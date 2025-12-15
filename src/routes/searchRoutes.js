import { Router } from "express";

function createSearchRoutes(db) {
  const router = Router();

  router.get("/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: 'Search query "q" is needed ' });
      }
      const searchQuery = `
    SELECT
      id, main_picture_medium, title, start_date, mean, status, media_type, popularity
    FROM manga
    WHERE search_title_lower ILIKE '%' || LOWER($1) || '%'
ORDER BY popularity ASC 
LIMIT 24
`;
      const result = await db.query(searchQuery, [query]);
      res.status(200).json(result.rows);
    } catch (err) {
      console.log("error in search engine: ", err);
      res.status(500).json({ error: "internal database/server error" });
    }
  });

  return router;
}

export default createSearchRoutes;
