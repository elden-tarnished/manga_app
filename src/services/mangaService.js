import {
  validDemographicSet,
  validExplicitGenre,
  validGenreSet,
  validOrder,
  validThemeSet,
  validType,
} from "../utils/backendUtils/genreHandling.mjs";

async function sortMangaByFilters(db, filters, { page, limit, order, direction }) {
  let baseQuery = "";
  const baseSelectQuery = `
            SELECT m.id , main_picture_large, title, english_title, start_date, end_date, synopsis,
            rank, mean, popularity, status, media_type, num_volumes 
            FROM manga m`;

  let lastPartBaseQuery = "";

  let queryIndex = 1;
  const queryParams = [];
  const whereClause = [];
  let whereClauseType = null;

  const categories = ["genre", "theme", "explicit_genre", "demographic"];
  let totalTagCount = 0;
  let genreJoinNeeded = false;
  for (const category of Object.keys(filters)) {
    if (categories.includes(category)) {
      let categoryTags = Array.isArray(filters[category])
        ? filters[category]
        : [filters[category]];
      categoryTags = categoryTags.filter((i) => i !== "");

      if (categoryTags.length > 0) {
        queryParams.push(categoryTags);
        whereClause.push(` (g.type='${category}' AND g.name= ANY($${queryIndex}))`);
        totalTagCount += categoryTags.length;
        queryIndex++;
        genreJoinNeeded = true;
      }
    }
  }

  if (genreJoinNeeded) {
    baseQuery += ` JOIN manga_genre mg ON m.id=mg.manga_id JOIN genre g ON mg.genre_id=g.id`;
  }

  let categoryType = Array.isArray(filters.type) ? filters.type : [filters.type];
  categoryType = categoryType.filter((i) => i !== "");

  if (categoryType.length > 0) {
    queryParams.push(categoryType);
    whereClauseType = ` m.media_type = ANY($${queryIndex})`;
    queryIndex++;
  }

  if (whereClause.length > 0 || whereClauseType) {
    baseQuery += " WHERE ";
    if (whereClause.length > 0) {
      baseQuery += `(${whereClause.join(" OR ")})`;
      if (whereClauseType) {
        baseQuery += ` AND ${whereClauseType}`;
      }
    } else {
      baseQuery += ` ${whereClauseType}`;
    }
  }

  if (whereClause.length > 0) {
    baseQuery += ` GROUP BY m.id HAVING COUNT(DISTINCT g.id) = $${queryIndex}`;
    queryParams.push(totalTagCount);
  }
  lastPartBaseQuery += ` ORDER BY ${order} ${direction} NULLS LAST 
    LIMIT ${limit} OFFSET ${page};`;
  const countQuery = `
        SELECT COUNT(*) FROM (SELECT m.id FROM manga m ${baseQuery}) sub`;

  const { rows } = await db.query(
    baseSelectQuery + baseQuery + lastPartBaseQuery,
    queryParams,
  );
  const result = await db.query(countQuery, queryParams);

  return { cPage: rows, rowCount: result.rows[0].count };
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

export { buildSortOption, sortMangaByFilters };
