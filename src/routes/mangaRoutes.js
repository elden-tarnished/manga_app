import { Router } from "express";
import { isAuthenticated, createValidateMangaId } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { buildSortOption, sortMangaByFilters } from "../services/mangaService.js";

function createMangaRoutes(db) {
  const router = Router();
  const validateMangaId = createValidateMangaId(db);

  router.get("/", validateQuery, async (req, res) => {
    let page = parseInt(req.query.page ?? "1", 10);
    let limit = parseInt(req.query.limit ?? "50", 10);
    try {
      const result = await sortMangaByFilters(db, req.validated, {
        page: limit * (page - 1),
        limit: limit,
        order: req.validated.order,
        direction: req.validated.direction,
      });
      let favorites = new Set();

      let cPage = result.cPage;

      const count = result.rowCount;
      const allPages = Math.ceil(count / limit);
      if (Number.isNaN(page) || page > allPages || page < 1) page = 1;
      if (Number.isNaN(limit) || limit > 200 || limit < 1) limit = 60;

      if (req.isAuthenticated && req.isAuthenticated()) {
        const userId = req.user.id;
        const favoritesResult = await db.query(
          "SELECT manga_id FROM users_favorites WHERE user_id = $1",
          [userId],
        );
        favorites = new Set(favoritesResult.rows.map((i) => i.manga_id));
        cPage = cPage.map((e) => ({ ...e, favorites: favorites.has(e.id) }));
      }

      const hasPrev = page > 1;
      const hasNext = page < allPages;
      const orderOptions = await buildSortOption();
      res.status(200).json({
        page: cPage,
        totalCount: count,
        pageNum: page,
        direction: req.validated.direction,
        maxPageNum: allPages,
        sortOption: orderOptions,
        hasNext: hasNext,
        hasPrev: hasPrev,
      });
    } catch (err) {
      console.error("error fetching manga: ", err.message);
      res.status(500).json({ error: "Error fetching manga " });
    }
  });

  router.post("/user/favorites/:mangaId", isAuthenticated, validateMangaId, async (req, res) => {
    const mangaId = req.mangaId;
    const userId = req.user.id;

    try {
      const favoriteExists = await db.query(
        "SELECT 1 FROM users_favorites WHERE user_id=$1 AND manga_id=$2",
        [userId, mangaId],
      );
      if (favoriteExists.rows.length > 0) {
        return res
          .status(200)
          .json({ message: "Manga already exists in your favorites" });
      }

      const result = await db.query(
        `
        WITH inserted AS 
        (INSERT INTO users_favorites (manga_id, user_id) VALUES ($1, $2) 
        ON CONFLICT (user_id, manga_id) DO NOTHING RETURNING manga_id) 
        SELECT title FROM manga 
        INNER JOIN  inserted on manga.id=inserted.manga_id`,
        [mangaId, userId],
      );

      if (result.rows.length === 0) {
        return res
          .status(500)
          .json({ message: `Failed to favorite the manga.` });
      }
      return res
        .status(200)
        .json({ message: `${result.rows[0].title} added to your favorites` });
    } catch (err) {
      console.error(
        `Error favoriting the manga id:${mangaId}, user:${userId}`,
        err,
      );
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete(
    "/user/favorites/:mangaId",
    isAuthenticated,
    validateMangaId,
    async (req, res) => {
      const mangaId = req.mangaId;
      const userId = req.user.id;

      try {
        const deleteResult = await db.query(
          "DELETE FROM users_favorites WHERE manga_id=$1 AND user_id=$2",
          [mangaId, userId],
        );
        if (deleteResult.rowCount === 0) {
          return res
            .status(400)
            .json({ error: "Could not remove favorite as it does not exist" });
        }

        return res
          .status(200)
          .json({ message: "Manga removed from your favorites." });
      } catch (err) {
        console.error(
          `Error deleting the manga ID:${mangaId}, user:${userId}`,
          err,
        );
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  router.get("/:mangaId", validateMangaId, async (req, res) => {
    const mangaId = req.mangaId;
    try {
      const mangaResult = await db.query(
        `
            SELECT 
            m.main_picture_medium AS mainPictureMedium,
            m.main_picture_large AS mainPictureLarge,
            m.title AS title,
            m.english_title AS englishTitle,
            m.japanese_title AS japaneseTitle,
            m.start_date AS StartDate,
            m.end_date AS endDate,
            m.synopsis AS synopsis,
            m.mean AS mean,
            m.rank AS rank,
            m.popularity AS popularity,
            m.num_list_users AS numListUsers,
            m.num_scoring_users AS NumScoringUsers,
            m.status AS status,
            m.nsfw AS nsfw,
            m.created_at AS createdAt,
            m.updated_at AS UpdatedAt,
            m.media_type AS mediaType,
            m.num_volumes AS numVolumes,
            m.num_chapters AS numChapters,
            m.background AS background,

            string_agg(DISTINCT s.name, ', ') AS serialization,
 			string_agg(DISTINCT ms.synonym, ', ') AS synonym,
 			string_agg(DISTINCT p.picture_medium, ', ') AS picturesMedium,
 			string_agg(DISTINCT p.picture_large, ', ') AS picturesLarge,
 			json_agg(DISTINCT json_build_object('firstName', a.first_name, 'lastName', a.last_name, 'role', ma.role)) AS authors,
 			json_agg(DISTINCT json_build_object('tag', g.name, 'type', g.type)) AS tags
 			
            FROM manga AS m 
            JOIN manga_serialization AS mas ON m.id = mas.manga_id 
            JOIN serialization AS s         ON mas.serialization_id = s.id
            JOIN manga_synonym AS ms        ON m.id = ms.manga_id
            JOIN manga_genre AS mg          ON m.id = mg.manga_id 
            JOIN genre AS g                 ON mg.genre_id = g.id
            JOIN manga_picture AS mp        ON mp.manga_id = m.id 
            JOIN picture AS p               ON mp.picture_id = p.id
            JOIN manga_author AS ma         ON ma.manga_id = m.id 
            JOIN author AS a                ON ma.author_id = a.id
            WHERE m.id=$1
 			GROUP BY m.id `,
        [mangaId],
      );

      const row = mangaResult.rows[0];
      const manga = {
        mainPictureMedium: row.mainPictureMedium,
        mainPictureLarge: row.mainPictureLarge,
        title: row.title,
        englishTitle: row.englishTitle,
        japaneseTitle: row.japaneseTitle,
        startDate: row.startDate,
        endDate: row.endDate,
        synopsis: row.synopsis,
        mean: row.mean,
        rank: row.rank,
        popularity: row.popularity,
        numListUsers: row.numListUsers,
        numScoringUsers: row.NumScoringUsers,
        status: row.status,
        nsfw: row.nsfw,
        createdAt: row.createdAt,
        updatedAt: row.UpdatedAt,
        mediaType: row.mediaType,
        numChapters: row.numChapters,
        numVolumes: row.numVolumes,
        background: row.background,
        serialization: row.serialization,
        synonym: row.synonym,
        picturesMedium: row.picturesMedium,
        picturesLarge: row.picturesLarge,
        authors: row.authors,
        tags: row.tags,
      };

      const relatedResult = await db.query(
        `
            SELECT m.main_picture_medium, m.title, m.english_title, m.start_date, m.synopsis,
            m.rank, m.mean, m.popularity, m.status, m.media_type, m.num_volumes, m.num_chapters,
            rm.relation_type

            FROM manga m 
            JOIN related_manga rm ON m.id = rm.related_manga_id
            WHERE rm.manga_id = $1`,
        [mangaId],
      );

      const relatedManga = relatedResult.rows.map((row) => ({
        mainPictureMedium: row.main_picture_medium,
        title: row.title,
        englishTitle: row.english_title,
        startDate: row.start_date,
        synopsis: row.synopsis,
        rank: row.rank,
        mean: row.mean,
        popularity: row.popularity,
        status: row.status,
        mediaType: row.media_type,
        numVolumes: row.num_volumes,
        numChapters: row.num_chapters,
        relationType: row.relation_type,
      }));

      const recommendationResult = await db.query(
        `
            SELECT m.main_picture_medium, m.title, m.english_title, m.start_date, m.synopsis,
            m.rank, m.mean, m.popularity, m.status, m.media_type, m.num_volumes, m.num_chapters
            FROM manga m
            JOIN recommendation rec ON m.id = rec.recommendation_id
            WHERE rec.manga_id = $1`,
        [mangaId],
      );

      const recommendedManga = recommendationResult.rows.map((row) => ({
        mainPictureMedium: row.main_picture_medium,
        title: row.title,
        englishTitle: row.english_title,
        startDate: row.start_date,
        synopsis: row.synopsis,
        rank: row.rank,
        mean: row.mean,
        popularity: row.popularity,
        status: row.status,
        mediaType: row.media_type,
        numVolumes: row.num_volumes,
        numChapters: row.num_chapters,
        relationType: row.relation_type,
      }));

      let isFavorited = false;
      if (req.isAuthenticated && req.isAuthenticated()) {
        const favoritedResult = await db.query(
          `SELECT 1 FROM users_favorites WHERE user_id=$1 AND manga_id=$2`,
          [req.user.id, mangaId],
        );
        if (favoritedResult.rows.length > 0) {
          isFavorited = true;
        }
      }

      return res.status(200).json({
        manga: manga,
        relatedManga: relatedManga,
        recommendedManga: recommendedManga,
        Favorited: isFavorited,
      });
    } catch (err) {
      console.error(`Error getting manga id:${mangaId}: `, err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export default createMangaRoutes;
