import { Router } from "express";

function createSearchRoutes(db) {
  const router = Router();

  router.get("/search", async (req, res) => {
    try {
      const query = req.query.q;
      const userId = req.isAuthenticated && req.isAuthenticated() ? req.user.id : null;
      if (!query) {
        return res.status(400).json({ error: 'Search query "q" is needed ' });
      }
      const selectedColumns = `
        m.id,
        m.main_picture_medium,
        m.main_picture_large,
        m.title,
        m.english_title,
        m.start_date,
        m.synopsis,
        m.rank,
        m.mean,
        m.status,
        m.media_type,
        m.num_volumes,
        m.num_chapters,
        m.popularity,
        CASE
          WHEN $2::integer IS NULL THEN FALSE
          ELSE EXISTS (
            SELECT 1
            FROM users_favorites uf
            WHERE uf.user_id = $2 AND uf.manga_id = m.id
          )
        END AS favorites
      `;

      const rawPage = req.query.page;
      if (rawPage === undefined) {
        const result = await db.query(
          `
          SELECT ${selectedColumns}
          FROM manga m
          WHERE m.search_title_lower ILIKE '%' || LOWER($1) || '%'
          ORDER BY popularity ASC
          LIMIT 24
          `,
          [query, userId],
        );
        return res.status(200).json(result.rows);
      }

      const rawLimit = Number.parseInt(req.query.limit ?? "24", 10);
      const limit = Number.isNaN(rawLimit) ? 24 : Math.min(Math.max(rawLimit, 1), 60);
      let page = Number.parseInt(rawPage, 10);
      if (Number.isNaN(page) || page < 1) page = 1;

      const countResult = await db.query(
        `
        SELECT COUNT(*)::int AS count
        FROM manga m
        WHERE m.search_title_lower ILIKE '%' || LOWER($1) || '%'
        `,
        [query],
      );
      const totalCount = countResult.rows[0]?.count ?? 0;
      const maxPageNum = Math.max(1, Math.ceil(totalCount / limit));
      if (page > maxPageNum) page = maxPageNum;
      const offset = limit * (page - 1);

      const result = await db.query(
        `
        SELECT ${selectedColumns}
        FROM manga m
        WHERE m.search_title_lower ILIKE '%' || LOWER($1) || '%'
        ORDER BY popularity ASC
        LIMIT $3
        OFFSET $4
        `,
        [query, userId, limit, offset],
      );

      return res.status(200).json({
        page: result.rows,
        totalCount,
        pageNum: page,
        maxPageNum,
        hasNext: page < maxPageNum,
        hasPrev: page > 1,
      });
    } catch (err) {
      console.log("error in search engine: ", err);
      return res.status(500).json({ error: "internal database/server error" });
    }
  });

  return router;
}

export default createSearchRoutes;
