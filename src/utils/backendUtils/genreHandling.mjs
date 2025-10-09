    import env from "dotenv";
    import pg from "pg";
    import fs from "fs";
    import path from "path";
    import { fileURLToPath } from "url";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    env.config({path: path.resolve(__dirname, '../../../.env')});

    const db = new pg.Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port : process.env.DB_PORT,
        max: 5,
        idleTimeoutMillis: 30* 1000,
        connectionTimeoutMillis: 2 * 1000
    });

    const missingGenre = path.resolve(__dirname, '../../texts/missing_genre.log');
    function writer(item) {
        fs.appendFileSync(missingGenre, `missiing genre id:${item.id}\n`);//why not use writefilesync and use flags: 'a';
    }

    //genre length = 18:
    const genres = [
    1,  2,  4, 5,  7,  8,
    14, 10, 22, 30, 37,
    45, 46, 26, 24, 28, 
    47, 36 
    ];

    //explicit genres length = 3
    const explicitGenres = [9, 12, 49];

    //themes = 53:
    const themes = [
    3,  6, 11, 13, 83,
    17, 18, 19, 20, 21,
    23, 29, 31, 32, 35,
    38, 39, 40, 44, 48,
    50, 51, 52, 53, 54,
    55, 56, 57, 58, 59,
    60, 61, 62, 63, 64,
    65, 66, 67, 68, 69,
    70, 71, 72, 73, 74,
    75, 76, 77, 78, 79,
    80, 81, 82
    ];

    //demographic = 5:
    const demographic = [15, 25, 27, 41, 42];

    export async function genreHandling() {
        let dbClient;
        try {
            dbClient = await db.connect()
            await dbClient.query("BEGIN");
            const genresResult = await dbClient.query("SELECT id FROM genre")
            const genresDb = genresResult.rows;
            for (let item of genresDb) { 
                if(genres.includes(item.id)){
                    await dbClient.query("UPDATE genre SET type = 'genre' WHERE id = $1;",[item.id]);
                    continue;
                }
                if(explicitGenres.includes(item.id)) {
                    await dbClient.query("UPDATE genre SET type = 'explicit_genre' WHERE id = $1;",[item.id]);
                    continue;
                }
                if(themes.includes(item.id)){
                    await dbClient.query("UPDATE genre SET type = 'theme' WHERE id = $1;", [item.id]);
                    continue;
                }
                if(demographic.includes(item.id)){
                    await dbClient.query("UPDATE genre SET type = 'demographic' WHERE id = $1;", [item.id])
                    continue;
                }
                writer(item);
            };
            await dbClient.query("COMMIT");
        } catch (err) {
            try {
                if (dbClient) await dbClient.query("ROLLBACK");
                return
            } catch (err) {
                console.log("ROLLBACK ERROR ", err);
            }   
            console.error("error: ", err);
        } finally {
            if(dbClient) {
                dbClient.release()
            }
        }
    }

    const validOrder = new Set(['start_date', 'rank', 'mean', 'popularity']);
    const validType =  new Set(['manga', 'one_shot', 'doujinshi', 'light_novel', 'novel', 'manhwa', 'manhua']);
    const validExplicitGenre = new Set(['Ecchi', 'Erotica', 'Hentai']);

    const setCache = new Map();

    async function validSetMaker({type}) {
        if(setCache.has(type)) {
            return setCache.get(type);
        }
        const validData = db.query(`SELECT name FROM genre WHERE type=$1`, [type])
            .then(item => new Set(item.rows.map(e => e.name)))
            .catch(err => {
                console.error(`Error fetchign ${type} set: `, err);
                setCache.delete(type);
                throw err;
            });
            setCache.set(type, validData);
            return validData;
    }

    export function validGenreSet() {
        return validSetMaker({type: 'genre'});
    };

    export function validThemeSet() {
        return validSetMaker({type: 'theme'});
    };

    export function validDemographicSet() {
        return validSetMaker({type: 'demographic'})
    }

    export {validOrder, validType, validExplicitGenre}

