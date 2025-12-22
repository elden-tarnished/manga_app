import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import env from "dotenv";
import pg from "pg";
import pLimit from "p-limit";
import chalk from "chalk";
import {
  BadRequestError,
  ForbiddonError,
  NotFoundError,
  RequestTimeoutError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../utils/apiFetchingUtils/errorHandling.js";
import { genreHandling } from "../utils/backendUtils/genreHandling.mjs";
import {
  errorLogger,
  fixDate,
  log,
  sleep,
} from "../utils/apiFetchingUtils/functions.js";

// --- Configuration & Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __envPath = path.resolve(__dirname, "../../.env");
env.config({ path: __envPath });

const __failedUrlsPath = path.resolve(__dirname, "../texts/failedUrls.txt");

const db = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 9,
  idleTimeoutMillis: 30 * 1000,
  connectionTimeoutMillis: 5 * 1000,
});

db.on("connect", () => {
  log("Database pool connected");
});

db.on("error", (error) => {
  errorLogger("Database connection error ", error);
});

const config = {
  timeout: 7000,
  headers: {
    "X-MAL-CLIENT-ID": process.env.CLIENT_ID,
  },
  params: {
    ranking_type: "all",
    fields:
      "id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_volumes,num_chapters,authors{first_name,last_name},pictures,background,related_anime,related_manga,recommendations,serialization{name}",
  },
};

const mangaErrorsToAppend = [];

const color = {
  dbBrakingError: chalk.bold.bgRed,
  dbSuccess: chalk.green.italic,
  dbMutual: chalk.white.italic,
  dbDontcareError: chalk.bgGray,
  dbExist: chalk.bgBlue.white,
};

// --- Helper Functions ---

function minute(Milliseconds) {
  return Milliseconds * 1000 * 60;
}

function writeFailedUrls(array) {
  fs.appendFileSync(__failedUrlsPath, array.join("\n"));
}

function urlMaker(array) {
  const url = "https://api.myanimelist.net/v2/manga/";
  return array.map((e) => `${url}${e}`);
}

function handleHttpError(error, url) {
  const status = error?.response?.status;
  if (!status) {
    return new Error(`network error at url: ${url}`);
  }
  switch (status) {
    case 400:
      return new BadRequestError(url);
    case 401:
      return new UnauthorizedError(url);
    case 403:
      return new ForbiddonError(url);
    case 404:
      return new NotFoundError(url);
    case 429:
      return new TooManyRequestsError(url);
    case 408:
      return new RequestTimeoutError(url);
    default:
      return null;
  }
}

async function addNullIdsFromDb() {
  try {
    const result = await db.query("select id from manga where title is null");
    const ids = result.rows.map((e) => e.id);
    return urlMaker(ids);
  } catch (err) {
    console.error("error within addNullIdsFromDb: ", err);
    throw err;
  }
}

// --- Main Logic ---

async function writeMAL_To_DB(url) {
  let dbClient;
  try {
    const result = await axios.get(url, config);
    const urlIdArr = url.split("/");
    const urlId = urlIdArr[urlIdArr.length - 1];

    if (result.data.error === "not_found") {
      errorLogger(
        color.dbDontcareError(`the manga doesnt exist with id: ${urlId}`),
      );
      return;
    }

    dbClient = await db.connect();
    await dbClient.query("BEGIN");

    const manga = result.data;
    // Arrays in MAL api v2 response
    const {
      related_manga: related_manga_arr = [],
      recommendations: recommendations_arr = [],
      pictures: pictures_arr = [],
      genres: genres_arr = [],
      alternative_titles: { synonyms: synonyms_arr = [] } = {},
      serialization: serialization_arr = [],
      authors: authors_arr = [],
    } = manga;

    // Single values in MAL api v2 response
    const start_date = fixDate(manga.start_date);
    const end_date = fixDate(manga.end_date);
    const created_at = fixDate(manga.created_at);
    const updated_at = fixDate(manga.updated_at);

    const {
      id = null,
      title = null,
      synopsis = null,
      mean = null,
      rank = null,
      popularity = null,
      num_list_users = null,
      num_scoring_users = null,
      nsfw = null,
      media_type = null,
      status = null,
      num_volumes = null,
      num_chapters = null,
      background = null,
      main_picture: {
        medium: main_picture_medium = null,
        large: main_picture_large = null,
      } = {},
      alternative_titles: {
        en: english_title = null,
        ja: japanese_title = null,
      } = {},
    } = manga;

    await dbClient.query(
      `
          INSERT INTO manga (id, main_picture_medium, main_picture_large, title,
                             english_title, japanese_title, start_date, end_date,
                             synopsis, mean, rank, popularity,
                             num_list_users, num_scoring_users, status, nsfw,
                             created_at, updated_at, media_type, num_volumes,
                             num_chapters, background)
          VALUES ($1, $2, $3, $4,
                  $5, $6, $7, $8,
                  $9, $10, $11, $12,
                  $13, $14, $15, $16,
                  $17, $18, $19, $20,
                  $21, $22)
          ON CONFLICT (id) DO UPDATE SET main_picture_medium = EXCLUDED.main_picture_medium,
                                         main_picture_large  = EXCLUDED.main_picture_large,
                                         title               = EXCLUDED.title,
                                         english_title       = EXCLUDED.english_title,
                                         japanese_title      = EXCLUDED.japanese_title,
                                         start_date          = EXCLUDED.start_date,
                                         end_date            = EXCLUDED.end_date,
                                         synopsis            = EXCLUDED.synopsis,
                                         mean                = EXCLUDED.mean,
                                         rank                = EXCLUDED.rank,
                                         popularity          = EXCLUDED.popularity,
                                         num_list_users      = EXCLUDED.num_list_users,
                                         num_scoring_users   = EXCLUDED.num_scoring_users,
                                         status              = EXCLUDED.status,
                                         nsfw                = EXCLUDED.nsfw,
                                         created_at          = EXCLUDED.created_at,
                                         updated_at          = EXCLUDED.updated_at,
                                         media_type          = EXCLUDED.media_type,
                                         num_volumes         = EXCLUDED.num_volumes,
                                         num_chapters        = EXCLUDED.num_chapters,
                                         background          = EXCLUDED.background`,
      [
        id,
        main_picture_medium,
        main_picture_large,
        title,
        english_title,
        japanese_title,
        start_date,
        end_date,
        synopsis,
        mean,
        rank,
        popularity,
        num_list_users,
        num_scoring_users,
        status,
        nsfw,
        created_at,
        updated_at,
        media_type,
        num_volumes,
        num_chapters,
        background,
      ],
    );

    if (
      Array.isArray(recommendations_arr) &&
      Array.isArray(related_manga_arr)
    ) {
      const combined = new Set([
        ...recommendations_arr.map((e) => e.node.id),
        ...related_manga_arr.map((e) => e.node.id),
      ]);
      if (combined.size > 0) {
        const combinedArray = [...combined];
        const combinedPlaceholder = combinedArray
          .map((_, i) => `($${i + 1})`)
          .join(", ");
        await dbClient.query(
          `INSERT INTO manga (id)
           VALUES ${combinedPlaceholder}
           ON CONFLICT (id) DO NOTHING`,
          combinedArray,
        );
      }
    }

    if (Array.isArray(authors_arr) && authors_arr.length > 0) {
      const placeholder = authors_arr
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(", ");
      const authorParams = authors_arr
        .map((e) => [e.node.id, e.node.first_name, e.node.last_name])
        .flat();
      const mangaAuthorParams = authors_arr
        .map((e) => [id, e.node.id, e.role])
        .flat();

      await dbClient.query(
        `INSERT INTO author (id, first_name, last_name)
         VALUES ${placeholder}
         ON CONFLICT (id) DO NOTHING`,
        authorParams,
      );
      await dbClient.query(
        `INSERT INTO manga_author (manga_id, author_id, role)
         VALUES ${placeholder}
         ON CONFLICT (manga_id, author_id, role) DO NOTHING`,
        mangaAuthorParams,
      );
    }

    if (Array.isArray(genres_arr) && genres_arr.length > 0) {
      const placeholder = genres_arr
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      const genreParams = genres_arr.map((e) => [e.id, e.name]).flat();
      const mangaGenreParams = genres_arr.map((e) => [id, e.id]).flat();

      await dbClient.query(
        `INSERT INTO genre (id, name)
         VALUES ${placeholder}
         ON CONFLICT (id) DO NOTHING`,
        genreParams,
      );
      await dbClient.query(
        `INSERT INTO manga_genre (manga_id, genre_id)
         VALUES ${placeholder}
         ON CONFLICT (manga_id, genre_id) DO NOTHING`,
        mangaGenreParams,
      );
    }

    let alreadyExist = false;
    if (Array.isArray(pictures_arr) && pictures_arr.length > 0) {
      const picturePlaceholder = pictures_arr
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join();
      const pictureParams = pictures_arr.map((e) => [e.medium, e.large]).flat();

      const combinedQuery = `
          WITH inserted_pictures AS
                   (INSERT INTO picture (picture_medium, picture_large)
                       VALUES ${picturePlaceholder}
                       ON CONFLICT (picture_medium, picture_large) DO NOTHING
                       RETURNING id)
          INSERT
          INTO manga_picture (manga_id, picture_id)
          SELECT $${pictureParams.length + 1}, id
          FROM inserted_pictures
          ON CONFLICT (manga_id, picture_id) DO NOTHING
          RETURNING (SELECT COUNT(*) FROM inserted_pictures) > 0 AS "did_insert";
      `;
      const { rows } = await dbClient.query(combinedQuery, [
        ...pictureParams,
        id,
      ]);
      if (rows.length > 0) {
        alreadyExist = rows[0].did_insert;
      }
    }

    if (Array.isArray(recommendations_arr) && recommendations_arr.length > 0) {
      const placeholder = recommendations_arr
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      const recommendationParams = recommendations_arr
        .map((e) => [id, e.node.id])
        .flat();
      await dbClient.query(
        `INSERT INTO recommendation (manga_id, recommendation_id)
         VALUES ${placeholder}
         ON CONFLICT (manga_id, recommendation_id) DO NOTHING`,
        recommendationParams,
      );
    }

    if (Array.isArray(related_manga_arr) && related_manga_arr.length > 0) {
      const placeholder = related_manga_arr
        .map(
          (_, i) =>
            `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`,
        )
        .join(", ");
      const relatedMangaParams = related_manga_arr
        .map((e) => [
          id,
          e.node.id,
          e.relation_type,
          e.relation_type_formatted,
        ])
        .flat();
      await dbClient.query(
        `INSERT INTO related_manga (manga_id, related_manga_id, relation_type, relation_type_formatted)
         VALUES ${placeholder}
         ON CONFLICT (manga_id, related_manga_id) DO NOTHING`,
        relatedMangaParams,
      );
    }

    if (Array.isArray(serialization_arr) && serialization_arr.length > 0) {
      const placeholder = serialization_arr
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      const serializationParams = serialization_arr
        .map((e) => [e.node.id, e.node.name])
        .flat();
      const mangaSerializationParams = serialization_arr
        .map((e) => [id, e.node.id])
        .flat();

      await dbClient.query(
        `INSERT INTO serialization (id, name)
         VALUES ${placeholder}
         ON CONFLICT (id) DO NOTHING`,
        serializationParams,
      );
      await dbClient.query(
        `INSERT INTO manga_serialization (manga_id, serialization_id)
         VALUES ${placeholder}
         ON CONFLICT (manga_id, serialization_id) DO NOTHING`,
        mangaSerializationParams,
      );
    }

    if (Array.isArray(synonyms_arr) && synonyms_arr.length > 0) {
      const placeholder = synonyms_arr
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      const synonymParams = synonyms_arr.map((e) => [id, e]).flat();
      await dbClient.query(
        `INSERT INTO manga_synonym (manga_id, synonym)
         VALUES ${placeholder}
         ON CONFLICT (manga_id, synonym) DO NOTHING`,
        synonymParams,
      );
    }

    await dbClient.query("COMMIT");
    if (alreadyExist) {
      log(
        color.dbSuccess(`insertion was successful: ${url?.split("/").pop()}\n`),
      );
    } else {
      log(color.dbExist(`Already Exist: ${url?.split("/").pop()}`));
    }
  } catch (err) {
    if (dbClient) {
      try {
        await dbClient.query("ROLLBACK");
      } catch (rollbackError) {
        errorLogger("ROLLBACK ERROR: ", rollbackError);
        mangaErrorsToAppend.push(url);
      }
    }
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      const timeout = new Error();
      timeout.name = "axiosTimeout";
      throw timeout;
    }
    const error = handleHttpError(err, url);
    if (error) throw error;
    throw err;
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
}

async function safeWrite(url) {
  let delay = 4000;
  let retries = 3;
  while (retries >= 0) {
    try {
      await writeMAL_To_DB(url);
      return;
    } catch (err) {
      if (err.name === "axiosTimeout") {
        throw err;
      }
      if (
        err instanceof UnauthorizedError ||
        err instanceof TooManyRequestsError ||
        err instanceof ForbiddonError ||
        err instanceof BadRequestError ||
        err instanceof RequestTimeoutError
      ) {
        if (retries === 0) {
          errorLogger(
            color.dbBrakingError(`Gave up after 3 retries, ID:${err.id}`),
          );
          mangaErrorsToAppend.push(url);
          return;
        }
        errorLogger(
          color.dbBrakingError(
            `[${err.message}], trying again in ${delay / 1000}s, (ID: ${err.id}) (retry no.${retries}/3).`,
          ),
        );
        await sleep(delay);
        delay *= 3;
        retries--;
        continue;
      }
      if (err instanceof NotFoundError) {
        log(color.dbDontcareError(err.message));
        return;
      }
      mangaErrorsToAppend.push(url);
      errorLogger("error : ", err);
      // If we reach here, it's an unhandled error type, maybe we should break loop?
      // Original logic implied continuing retries for everything unless explicitly handled above.
      // But adding "break" or decrementing retries is safer. Assuming original logic was intentional.
      retries--; // Added decrement to avoid infinite loops on unknown errors
    }
  }
}

async function dbSaverArray({ array, batch, plimit }) {
  if (!Array.isArray(array)) {
    log("enter a array for the urls");
    return;
  }
  let limit = pLimit(plimit);
  const amount = array.length;
  const batchArr = Array.from({ length: Math.ceil(amount / batch) }, (_, i) =>
    array.slice(i * batch, i * batch + batch),
  );
  let sleepTime = minute(4.5);
  let sleepAfterBatch = 300;
  let hadTimeout = false;

  for (let i = 0; i < batchArr.length; i++) {
    log(
      color.dbMutual(
        `batch no: ${i + 1}: ${batchArr[i].map((e) => e.split("/").pop())}`,
      ),
    );
    const promise = batchArr[i].map((e) => {
      if (!e) return Promise.resolve();
      return limit(async () => {
        try {
          await safeWrite(e);
        } catch (err) {
          if (err.name === "axiosTimeout") {
            hadTimeout = true;
          }
          errorLogger(
            color.dbBrakingError(
              `Critical error mapping manga url: ${e}, error: ${err}\n`,
            ),
          );
          mangaErrorsToAppend.push(e);
        }
      });
    });
    await Promise.all(promise);
    if (hadTimeout) {
      log(
        color.dbBrakingError(
          `⏸️Axios timeout pause: ${sleepTime / 1000 / 60} minutes⏸️`,
        ),
      );
      await sleep(sleepTime);
      hadTimeout = false;
    }
    log(
      color.dbMutual(
        `✅ batch ${i + 1}/${batchArr.length}, ${array.length - i + 1} left`,
      ),
    );
    await sleep(sleepAfterBatch);
  }
  writeFailedUrls(mangaErrorsToAppend);
}

// --- Entry Point ---

async function main() {
  const timeNow = new Date().toUTCString();
  log(`Starting program at: ${timeNow}`);
  try {
    const arr = await addNullIdsFromDb();
    console.log(`Found ${arr.length} manga with null titles to process.`);
    await dbSaverArray({ array: arr, batch: 3, plimit: 3 });
    log("Running genreHandling...");
    genreHandling();
  } catch (err) {
    errorLogger(
      color.dbBrakingError("Critical error in main() :", err.message),
    );
  } finally {
    db.end();
  }
}

main();
