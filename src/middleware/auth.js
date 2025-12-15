function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized, please log in ." });
}

const createValidateMangaId =
  (db) =>
  async (req, res, next) => {
    const mangaId = parseInt(req.params.mangaId, 10);
    if (Number.isNaN(mangaId) || mangaId < 0) {
      return res.status(400).json({ error: "Invalid manga Id" });
    }
    try {
      const mangaIdResult = await db.query("SELECT 1 FROM manga WHERE id=$1", [
        mangaId,
      ]);
      if (mangaIdResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Manga with the specified ID does not exist" });
      }
      req.mangaId = mangaId;
      return next();
    } catch (err) {
      console.error("Error during manga ID validation: ", err);
      return res
        .status(500)
        .json({ error: "Internal server error during manga ID validation" });
    }
  };

export { createValidateMangaId, isAuthenticated };
