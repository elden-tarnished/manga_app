import fs from "fs";
import axios from "axios";
import env from "dotenv";
import pg from "pg";
import pLimit from "p-limit";
import chalk from "chalk";
import { BadRequestError, UnauthorizedError,
         ForbiddonError, NotFoundError,
         TooManyRequestsError, RequestTimeoutError} from '../utils/apiFetchingUtils/errorHandling.js';
import { genreHandling } from "../utils/backendUtils/genreHandling.mjs";
import { log, errorLogger, fixDate, sleep } from "../utils/apiFetchingUtils/functions.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __textDir = path.resolve(__dirname, '../texts');

const __envPath = path.resolve(__dirname, '../../.env');
const __failedUrlsPath = path.resolve(__dirname, '../texts/failedUrls.txt');

const __failedIdBatchesPath = path.join(__textDir, 'failedIdBatches.txt');
const __allValidMangaIdsPath = path.join(__textDir, 'allValidMangaIds.txt');
function writeValidIdBatches(array) {
    fs.appendFileSync(__allValidMangaIdsPath, array.flat().join('\n'));
};
function writeFailedIdBatches(array) {
    fs.appendFileSync(__failedIdBatchesPath, array.flat().join('\n'));
};

async function filteringDBFromIds() {
    const ids = fs.readFileSync(__allValidMangaIdsPath, {encoding: 'utf-8'}).split('\n').filter(Boolean);
    const DBIds = await WriteDbIds();
    const idsSet = new Set(ids);
    const DBIdsSet = new Set(DBIds.map(String).map(e => e.trim()));
    const goodIds = [...idsSet];
    console.log('good Ids: ', goodIds);
        console.log('bad Ids: ', DBIdsSet)
    console.log(`all Ids Set: ${goodIds.length}, db Ids Set: ${DBIdsSet.size},,, ${goodIds.length - DBIdsSet.size}\n`)
    const filteredIds = goodIds.filter(e => !DBIdsSet.has(e));
    console.log(`remaining: ${filteredIds.length}\n`);
    return filteredIds;
}

env.config({path: __envPath});

const db = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port : process.env.DB_PORT,
    max: 9,
    idleTimeoutMillis: 30 * 1000,
    connectionTimeoutMillis: 5 * 1000
});

const timeNow = new Date().toUTCString()
log(`Starting program at: ${timeNow}`)
db.on("connect", () => {
    log("Database pool connected");
});

db.on("error", (error) => {
    errorLogger("Database connection error ", error);
})

const config = {
    timeout: 7000,
    headers: {
    "X-MAL-CLIENT-ID": 'ee1579d93fb61acfb70a7e52af259e1a',
    },
    params: {
        ranking_type: "all",
        fields: "id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_volumes,num_chapters,authors{first_name,last_name},pictures,background,related_anime,related_manga,recommendations,serialization{name}"
    }
};

const configToWriteIds = (configOffset) => {
    return {
        timeout: 7000,
        headers: {
        "X-MAL-CLIENT-ID": 'ee1579d93fb61acfb70a7e52af259e1a',
        },
        params: {
            ranking_type: 'all',
            limit: '500',
            offset: configOffset
        }
    }
}

const mangaErrorsToAppend = [];

const color = {
    dbBrakingError: chalk.bold.bgRed,
    dbSuccess: chalk.green.italic,
    dbMutual: chalk.white.italic,
    dbDontcareError: chalk.bgGray,
    dbExist: chalk.bgBlue.white
};

function handleHttpError(error, url) {
    const status = error?.response?.status;
    if (!status) {
        return new Error(`network error at url: ${url}`)
    }
    switch (status) {
        case (400): return new BadRequestError(url);
        case (401): return new UnauthorizedError(url);
        case (403): return new ForbiddonError(url);
        case (404): return new NotFoundError(url);
        case (429): return new TooManyRequestsError(url);
        case (408): return new RequestTimeoutError(url);    
        default: return null;
    }
}

//***************** functions *****************
async function downloadFileAndDB (fileUrl, downlaodFolder, fileName) {
    const filePath = path.join(downlaodFolder, fileName);
    const result = await axios.get(fileUrl, {responseType: "stream"});

    const writer = fs.createWriteStream(filePath);
    result.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve(filePath));
        writer.on("error", reject);
    })
}

//promise for array to id
// async function ensureRelatedMangaIdsExist(array) {
//     const godDid = array.node;
//     try {
//         const Promises = godDid.map(e => db.query("INSERT INTO manga (id) VALUES ($1) ON CONFLICT DO NOTHING", [e.id]));
//         await Promise.all(promises);
//     } catch (err) {
//         errorLogger("error: ", err)
//     } 
// }

function writeFailedUrls(array) {
    fs.appendFileSync(__failedUrlsPath, array.join('\n'));
}

function minute(Milliseconds) {
    return Milliseconds * 1000 * 60;
};

// a function to read the failed links from (errorUrls.txt) and try them again
async function readErrorUrls() {
    let data;
    try {
        data = fs.readFileSync('./texts/errorUrls.txt', 'utf8')

    } catch (err) {
        if (err.message === 'ENOENT') {
            log("no errorUrls.txt file or found-nothing to retry");
            return;
        }
        if (err.response?.status) {
            errorLogger(color.dbBrakingError('Critical error on reading Urls: ', err.message))
        }
    }
    const dataReady = data.split('\n').filter((item) => item.trim() !== "");
    log(color.dbMutual(`Done reading error file starting ... `));
    for (const e of dataReady) {
        await safeWrite(e);
        await sleep(300);
    }
}

async function WriteDbIds() {
    try {
        const result = await db.query('SELECT id FROM manga WHERE title IS NOT NULL');
        const ids = result.rows.map(e => e.id);
        return ids
    } catch (err) {
        console.log('error in WriteDbIds function: ')
    }
}

async function addNullIdsFromDb() {
    try {
        const result = await db.query('select id from manga where title is null');
        const ids = result.rows.map(e => e.id);
        const readyIds = urlMaker(ids);
        return readyIds;
        
    } catch (err) {
        console.error('error within addNullIdsFromDb: ', err)
    }
}
//*********************************************

async function writeMAL_To_DB (url) {
    let dbClient;
    try {
        const result = await axios.get(url, config);
        const urlIdArr = url.split('/');
        const urlId = urlIdArr[urlIdArr.length-1]
        if (result.data.error === 'not_found') {
            errorLogger(color.dbDontcareError(`the manga doesnt exist with id: ${urlId}`))
            return;
        }
         dbClient = await db.connect();
        await dbClient.query("BEGIN");
        const manga = result.data;
        // arrays in MAL api v2 responce.    
        const {
            related_manga: related_manga_arr = [],
            recommendations: recommendations_arr = [], 
            pictures: pictures_arr = [], 
            genres: genres_arr = [] ,
            alternative_titles: {synonyms: synonyms_arr = []} = {},
            serialization: serialization_arr = [], 
            authors: authors_arr = []
        } = manga;
    
        // single values in MAL api v2 responce    
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
                large: main_picture_large = null
            } = {},
            alternative_titles: {
                en: english_title = null,
                ja: japanese_title = null
            } = {},
        } = manga


        await dbClient.query(`
            INSERT INTO manga (
                id, main_picture_medium, main_picture_large, title, 
                english_title, japanese_title, start_date, end_date, 
                synopsis, mean, rank, popularity, 
                num_list_users, num_scoring_users, status, nsfw, 
                created_at, updated_at, media_type, num_volumes, 
                num_chapters, background
            ) 
            VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, 
                $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19, $20,
                $21, $22) 

            ON CONFLICT (id) DO UPDATE SET 
            main_picture_medium = EXCLUDED.main_picture_medium,
            main_picture_large = EXCLUDED.main_picture_large,
            title = EXCLUDED.title, 
            english_title = EXCLUDED.english_title,
            japanese_title = EXCLUDED.japanese_title, 
            start_date = EXCLUDED.start_date, 
            end_date = EXCLUDED.end_date, 
            synopsis = EXCLUDED.synopsis,
            mean = EXCLUDED.mean, 
            rank = EXCLUDED.rank, 
            popularity = EXCLUDED.popularity, 
            num_list_users = EXCLUDED.num_list_users, 
            num_scoring_users = EXCLUDED.num_scoring_users, 
            status = EXCLUDED.status,
            nsfw = EXCLUDED.nsfw, 
            created_at = EXCLUDED.created_at, 
            updated_at = EXCLUDED.updated_at, 
            media_type = EXCLUDED.media_type, 
            num_volumes = EXCLUDED.num_volumes, 
            num_chapters = EXCLUDED.num_chapters,
            background = EXCLUDED.background`,
            [ 
                id, main_picture_medium, main_picture_large, title, 
                english_title, japanese_title, start_date, end_date, 
                synopsis, mean, rank, popularity, 
                num_list_users, num_scoring_users, status, nsfw, 
                created_at, updated_at, media_type, num_volumes, 
                num_chapters, background]);

        if (Array.isArray(recommendations_arr) && Array.isArray(related_manga_arr)) {
                const combined = new Set([...recommendations_arr.map((e) => e.node.id), ...related_manga_arr.map((e) => e.node.id)]);
                if (combined.size > 0) {
                const combinedArray = [...combined];
                const combinedPlaceholder = combinedArray.map((_, i) => `($${i + 1})`).join(', ');
                await dbClient.query(`INSERT INTO manga (id) VALUES ${combinedPlaceholder} ON CONFLICT (id) DO NOTHING`, combinedArray);  
            };
        }

        if (Array.isArray(authors_arr)) {
            if (authors_arr.length > 0) {
                const placeholder = authors_arr.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
                const authorParams = authors_arr.map(e => [e.node.id, e.node.first_name, e.node.last_name]).flat();
                const mangaAuthorParams = authors_arr.map(e => [id, e.node.id, e.role]).flat();
                await dbClient.query(`
                    INSERT INTO author (id, first_name, last_name) 
                    VALUES ${placeholder} 
                    ON CONFLICT (id) DO NOTHING`, 
                    authorParams);
                await dbClient.query(`
                    INSERT INTO manga_author (manga_id, author_id, role) 
                    VALUES ${placeholder} 
                    ON CONFLICT (manga_id, author_id, role) DO NOTHING`, 
                    mangaAuthorParams);
            };
        }
    
        if(Array.isArray(genres_arr)) {
            if(genres_arr.length > 0){
                const placeholder = genres_arr.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
                const genreParams = genres_arr.map(e => [e.id, e.name]).flat();
                const mangaGenreParams = genres_arr.map(e => [id, e.id]).flat();
                await dbClient.query(`
                    INSERT INTO genre (id, name) 
                    VALUES ${placeholder} 
                    ON CONFLICT (id) DO NOTHING`, 
                    genreParams);
                await dbClient.query(`
                    INSERT INTO manga_genre (manga_id, genre_id) 
                    VALUES ${placeholder} 
                    ON CONFLICT (manga_id, genre_id) DO NOTHING`, 
                    mangaGenreParams);
            } ;
        }

        // if (Array.isArray(pictures_arr)) {
        //     if (pictures_arr.length > 0) {
        //         const picturePlaceholder = pictures_arr.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
        //         const pictureParams = pictures_arr.map(e => [e.medium, e.large]).flat();
        //         const ids = await dbClient.query(`
        //             INSERT INTO picture (picture_medium, picture_large)
        //             VALUES ${picturePlaceholder}
        //             ON CONFLICT (picture_medium, picture_large) DO NOTHING RETURNING id`, 
        //             pictureParams);
        //         const mangaPictureParams = ids.rows.map(e => [id, e.id]).flat();
        //         const mangaPicturePlaceholder = ids.rows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
        //         await dbClient.query(`
        //             INSERT INTO manga_picture (manga_id, picture_id) 
        //             VALUES ${mangaPicturePlaceholder} 
        //             ON CONFLICT (manga_id, picture_id) DO NOTHING`, 
        //             mangaPictureParams);
        //     };
        // }
        let alreadyExist = false;
        if (Array.isArray(pictures_arr) && pictures_arr.length > 0) {
            const picturePlaceholder = pictures_arr.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join();
            const pictureParams =  pictures_arr.map(e => [e.medium, e.large]).flat();

            const combinedQuery = `
                WITH inserted_pictures AS 
                    (INSERT INTO picture (picture_medium, picture_large)
                    VALUES ${picturePlaceholder}
                    ON CONFLICT (picture_medium, picture_large) DO NOTHING
                    RETURNING id
                )
                INSERT INTO manga_picture (manga_id, picture_id)
                SELECT $${pictureParams.length + 1}, id FROM inserted_pictures
                ON CONFLICT (manga_id, picture_id) DO NOTHING RETURNING (SELECT COUNT(*) FROM inserted_pictures) > 0 AS "did_insert"  ;
                `;
            const {rows} = await dbClient.query(combinedQuery, [...pictureParams, id]);
            if (rows.length > 0){
                alreadyExist = rows[0].did_insert;
            }
        }

        if (Array.isArray(recommendations_arr)) {
            if (recommendations_arr.length > 0) {
                const placeholder = recommendations_arr.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
                const recommendationParams = recommendations_arr.map(e => [id, e.node.id]).flat();
                await dbClient.query(`
                    INSERT INTO recommendation (manga_id, recommendation_id) 
                    VALUES ${placeholder} 
                    ON CONFLICT (manga_id, recommendation_id) DO NOTHING`, 
                    recommendationParams);
            };
        }

        if (Array.isArray(related_manga_arr)) {
            if (related_manga_arr.length > 0) {
                const placeholder = related_manga_arr.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ');
                const relatedMangaParams = related_manga_arr.map(e => [id, e.node.id, e.relation_type, e.relation_type_formatted]).flat();
                await dbClient.query(`
                    INSERT INTO related_manga (manga_id, related_manga_id, relation_type, relation_type_formatted) 
                    VALUES ${placeholder}
                    ON CONFLICT (manga_id, related_manga_id) DO NOTHING`, 
                    relatedMangaParams);                
            };
        };

        if (Array.isArray(serialization_arr)) {
            if (serialization_arr.length > 0) {
            const placeholder = serialization_arr.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
            const serializationParams = serialization_arr.map(e => [e.node.id, e.node.name]).flat();
            const mangaSerializationParams = serialization_arr.map(e =>[id, e.node.id]).flat();
            await dbClient.query(`
                INSERT INTO serialization (id, name) 
                VALUES ${placeholder} 
                ON CONFLICT (id) DO NOTHING `, 
                serializationParams);
            await dbClient.query(`
                INSERT INTO manga_serialization (manga_id, serialization_id) 
                VALUES ${placeholder} 
                ON CONFLICT (manga_id, serialization_id) DO NOTHING `, 
                mangaSerializationParams);               
            } ;
        };
        
        if (Array.isArray(synonyms_arr)) {
                if (synonyms_arr.length > 0) {
                const placeholder = synonyms_arr.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
                const synonymParams = synonyms_arr.map(e => [id, e]).flat();
                await dbClient.query(`
                    INSERT INTO manga_synonym (manga_id, synonym)
                    VALUES ${placeholder} ON CONFLICT (manga_id, synonym) DO NOTHING`, 
                    synonymParams    
                );        
            };
        }

        await dbClient.query("COMMIT");
        if (alreadyExist){
            log(color.dbSuccess(`insertion was succesful: ${url?.split('/').pop()}\n`));
        } else {
            log(color.dbExist(`Already Exist: ${url?.split('/').pop()}`));
        }

    } catch (err) {
        if (dbClient){
            try{
                await dbClient.query("ROLLBACK")
            } catch (errr) {
                errorLogger('ROLLBACK ERROR: ', errr);
                mangaErrorsToAppend.push(url);
                
            }
        }
        if(err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            const timeout = new Error;
            timeout.name = 'axiosTimeout';
            throw timeout;
        }
        const error = handleHttpError(err, url);
        if (error) throw error;
        throw err;

    } finally {
        if(dbClient) {
            dbClient.release()
        }
    } 
};

async function safeWrite(url) {
    let delay = 4000;
    let retries = 3
    while (retries >= 0) {
        try {
            await writeMAL_To_DB(url);
            return;
        } catch (err) {
            if (err.name === 'axiosTimeout') {
                throw err;
            }
            if (
                err instanceof UnauthorizedError    ||
                err instanceof TooManyRequestsError ||
                err instanceof ForbiddonError       ||
                err instanceof BadRequestError      ||
                err instanceof RequestTimeoutError  
            ) {

                if (retries === 0) {
                    errorLogger(color.dbBrakingError(`Gave up after ${retries}, ID:${err.id}`))
                    mangaErrorsToAppend.push(url);
                    return;
                }
                errorLogger(color.dbBrakingError(`[${err.message}], trying again in ${delay/1000}s, (ID: ${err.id}) (retry no.${retries}/3).`));
                await sleep(delay);
                delay *= 3;
                retries--;
                continue;
            }
            if (err instanceof NotFoundError) {
            log(color.dbDontcareError(err.message))
            return;
            } 
            mangaErrorsToAppend.push(url);
            errorLogger('error : ',err)
        }
    }
};

const failedTxt = fs.readFileSync('../texts/failedUrls.txt', {encoding: 'utf8'}).split('\n');

function urlMaker(array) {
    const url = 'https://api.myanimelist.net/v2/manga/';
    const arr = array.map(e => `${url}${e}`);
    return arr
}

async function main() {
    try {
    const arr = await addNullIdsFromDb();
    console.log(arr);
    await dbSaverArray({array: arr, batch: 3, plimit: 3})
    log('genreHandling: ')
    genreHandling();
    }
    catch(err) {
        errorLogger(color.dbBrakingError(" Critical error in main() :", err.message));
    }
    finally{
        db.end();
    }
};

main();

async function dbSaverArray({array , batch, plimit}) {
    if (!Array.isArray(array)) {
        log('enter a array for the urls');
        return;
    }
    let limit = pLimit(plimit);
    const amount = array.length;
    const batchArr = Array.from({length: (Math.ceil(amount/batch))}, (_, i) => array.slice(i * batch, i * batch + batch));
    let batchTime ;
    let sleepTime = minute(4.5);
    let sleepAfterBatch = 300;
    let hadTimeout = false;


    for (let i = 0; i < batchArr.length ; i++) {
        log(color.dbMutual(`batch no: ${i+1}: ${batchArr[i].map(e => e.split('/').pop())}`));
        const promise = batchArr[i].map(e => {
            batchTime = Date.now();
            if (!e) return Promise.resolve();
            return limit(async () => {
                try {
                    await safeWrite(e);
                    } catch (err) {
                        if (err.name === 'axiosTimeout') {
                            hadTimeout = true;
                        }
                        errorLogger(color.dbBrakingError(`Critical error mappig manga url: ${e}, error: ${err}\n`));
                        mangaErrorsToAppend.push(e);
                    }
                })
            })
            await Promise.all(promise);
            if (hadTimeout) {
            log((color.dbBrakingError(`⏸️Axios timeout pause: ${(sleepTime/1000/60)} minutes⏸️`)))
            await sleep(sleepTime);
            hadTimeout = false;
        }
        log(color.dbMutual(`✅ batch ${i + 1}/${batchArr.length}, ${array.length - i+1} left`));
        await sleep(sleepAfterBatch);
    }; 
    writeFailedUrls(mangaErrorsToAppend);
}

async function mangaIdWriter(idWriterUrl, configOffset) {
    try {
        const config = configToWriteIds(configOffset);
        const result = await axios.get(idWriterUrl, config);
        if (!Array.isArray(result.data.data)) log('this url aint even a array, check it out!');
        const ids = result.data.data.map(e => e.node.id);
        return ids;
    } catch (err) {
        if(err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            const timeout = new Error;
            timeout.name = 'axiosTimeout';
            throw timeout;
        }
        log('error in idWriter: ', err);
    }
};

async function mangaIdPromise(fiveRacks) {
    let limit = pLimit(3);
    const batch = Array.from({length: fiveRacks}, (_, i) => i*500);
    const batchArr = Array.from({length: (Math.ceil(fiveRacks/3))}, (_, i) => batch.slice(i*3, i*3+3));
    let sleepTime = minute(4.5);
    let sleepAfterBatch = 300;
    let hadTimeout = false;
    const succesful = [];
    const failed = [];


    for (let i = 0; i < batchArr.length ; i++) {
        log(color.dbMutual(`batch no: ${i+1}: ${batchArr[i].at(0)}/${batchArr[i].at(-1)+500}`));
        const promise = batchArr[i].map(e => {
            return limit(async () => {
                try {
                    const ids = await mangaIdWriter('https://api.myanimelist.net/v2/manga/ranking', e);
                    succesful.push(ids);
                    } catch (err) {
                        if (err.name === 'axiosTimeout') {
                            hadTimeout = true;
                        }
                        errorLogger(color.dbBrakingError(`Axios Timeout for offset: ${e}\n`));
                        failed.push(e);
                    }
                })
            })
            await Promise.all(promise);
            if (hadTimeout) {
            log((color.dbBrakingError(`⏸️Axios timeout pause: ${(sleepTime/1000/60)} minutes⏸️`)))
            await sleep(sleepTime);
            hadTimeout = false;
        }
        log(color.dbMutual(`✅ batch ${i + 1}/${batchArr.length} left`));
        await sleep(sleepAfterBatch);
    }; 
    writeFailedIdBatches(failed);
    writeValidIdBatches(succesful)
}

