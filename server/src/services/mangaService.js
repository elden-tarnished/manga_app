import {
  validDemographicSet,
  validExplicitGenre,
  validGenreSet,
  validOrder,
  validThemeSet,
  validType,
} from "../utils/backendUtils/genreHandling.mjs";

const TAG_CATEGORIES = ["genre", "theme", "explicit_genre", "demographic"];

function toList(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter((item) => typeof item === "string" && item !== "");
}

// Builds the FROM / WHERE part shared by the page query and the count query.
// Every value goes in as a $n parameter; only fixed SQL text is concatenated.
// Rows without a title are ids the import script queued but has not filled yet.
function buildFilterQuery(filters) {
  const params = [];
  const tagConditions = [];
  let totalTagCount = 0;

  for (const category of TAG_CATEGORIES) {
    const tags = toList(filters[category]);
    if (tags.length === 0) continue;
    params.push(category, tags);
    tagConditions.push(
      `(g.type = $${params.length - 1} AND g.name = ANY($${params.length}))`,
    );
    totalTagCount += tags.length;
  }

  const where = ["m.title IS NOT NULL"];
  if (tagConditions.length > 0) {
    where.push(`(${tagConditions.join(" OR ")})`);
  }

  const types = toList(filters.type);
  if (types.length > 0) {
    params.push(types);
    where.push(`m.media_type = ANY($${params.length})`);
  }

  let sql = "FROM manga m";
  if (tagConditions.length > 0) {
    sql += " JOIN manga_genre mg ON m.id = mg.manga_id JOIN genre g ON mg.genre_id = g.id";
  }
  sql += ` WHERE ${where.join(" AND ")}`;
  if (tagConditions.length > 0) {
    // A manga must carry every selected tag, not just one of them.
    params.push(totalTagCount);
    sql += ` GROUP BY m.id HAVING COUNT(DISTINCT g.id) = $${params.length}`;
  }
  return { sql, params };
}

async function countMangaByFilters(db, filters) {
  const { sql, params } = buildFilterQuery(filters);
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM (SELECT m.id ${sql}) sub`,
    params,
  );
  return rows[0].count;
}

// `order` and `direction` come from validateQuery's whitelists, so they are
// safe to place in the SQL text; LIMIT and OFFSET are parameters.
async function findMangaByFilters(db, filters, { limit, offset, order, direction }) {
  const { sql, params } = buildFilterQuery(filters);
  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT m.id, m.main_picture_large, m.title, m.english_title, m.start_date, m.end_date,
            m.synopsis, m.rank, m.mean, m.popularity, m.status, m.media_type, m.num_volumes
     ${sql}
     ORDER BY m.${order} ${direction} NULLS LAST, m.id
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows;
}

async function buildSortOption() {
  return {
    validOrder: [...validOrder],
    genre: [...(await validGenreSet())],
    theme: [...(await validThemeSet())],
    demographic: [...(await validDemographicSet())],
    type: [...validType],
    explicitGenre: [...validExplicitGenre],
  };
}

export { buildSortOption, countMangaByFilters, findMangaByFilters };
