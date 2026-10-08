const MAX_INT = 2147483647; // Postgres int

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized, please log in ." });
}

const createValidateMangaId =
  (db) =>
  async (req, res, next) => {
    // Digits only ("12abc" is not 12), and small enough for an int column.
    const mangaId = /^\d{1,10}$/.test(req.params.mangaId)
      ? Number(req.params.mangaId)
      : NaN;
    if (!(mangaId <= MAX_INT)) {
      return res.status(400).json({ error: "Invalid manga Id" });
    }
    try {
      // An id-only row (queued by the import script, not filled yet) counts as missing.
      const mangaIdResult = await db.query(
        "SELECT 1 FROM manga WHERE id=$1 AND title IS NOT NULL",
        [mangaId],
      );
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
