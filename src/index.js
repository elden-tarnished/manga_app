import express from "express";
import session from "express-session";
import pg from "pg";
import argon2 from "argon2";
import passport from "passport";
import LocalStrategy  from "passport-local";
// import GoogleStrategy from "passport-google-oauth2";
import env from "dotenv";
import bodyParser from "body-parser";
import {validDemographicSet, validGenreSet, validThemeSet,
        validExplicitGenre, validType, validOrder} from './utils/backendUtils/genreHandling.mjs';
import path from "path";
import { fileURLToPath } from "url";
import cors from 'cors';
import qs from 'qs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __envPath = path.resolve(__dirname, '../.env')

env.config({path: __envPath});
const app = express();
const port = 3000 ;
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173"}));

const pepper = Buffer.from(process.env.PEPPER)
const argon2Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    hashLength: 50,
    timeCost: 3,
    secret: pepper
};

const db = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port : process.env.DB_PORT,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 48 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.set('query parser', str => qs.parse(str))

passport.use(new LocalStrategy(
    async function(username, password, done) {
        let dbClient;
        try {            
            dbClient = await db.connect()
            const result = await dbClient.query("SELECT * FROM users WHERE username=$1 OR email=$1",[username]);
            if (result.rows.length > 0) {
                
                const user = result.rows[0];
                const hashedPassword = result.rows[0].password; 
                const pepperString = process.env.PEPPER
                const pepper = process.env.PEPPER ? Buffer.from(pepperString, 'utf-8') : undefined;
                const option = pepper ? {secret: pepper} : {};
                const checkPassword = await argon2.verify(hashedPassword, password, option);//add pepper to env

                if (checkPassword) {
                    const userToSerialized = {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                    return done(null, userToSerialized);
                } else {
                    return done(null, false, {message:'Wrong password, try again.'});
                }
            } else {
                return done(null, false, {message: 'User not found'})
            }
        } catch (err) {
            console.error("error trying local strategy:",err);
            return done(err)
        } finally {
            if (dbClient) {
            dbClient.release()
            }
        }
    }
));

passport.serializeUser((user, done) => {
    console.log('serializing user: ', user.username);
    done(null, user.id);
})

passport.deserializeUser(async(id, done) => {
    let dbClient;
    try {
        console.log('deserializing user: ', id);
        dbClient =  await db.connect();
        const result = await dbClient.query('SELECT id, username, email FROM users WHERE id=$1', [id]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            done(null, user)
        } else {
            done(new Error('user not found during deserialization'), null);
        }
    } catch (err) {
        console.error('Error during deserializeUser, ',err);
        done(err, null);
    } finally {
        if (dbClient){
            dbClient.release();
        }
    }
})

/* //comlete this later
passport.use(new GoogleStrategy(
    {
        
    }
))
*/

// ***** Functions *********************************************\\
// users :
//1.Validating user id

//mangas: 
//1. Validate manga id
async function ValidatingMangaId(req, res, next) {
    const mangaId = parseInt(req.params.mangaId, 10);
    if (isNaN(mangaId) || mangaId<0) {
        return res.status(400).json({error: 'Invalid manga Id'});
    }
    try {
    const mangaIdResult = await db.query('SELECT 1 FROM manga WHERE id=$1', [mangaId]);
    if (mangaIdResult.rows.length === 0) {
        return res.status(404).json({error: 'Manga with the specified ID does not exist'});
    } 
    return next();
    } catch (err) {
        console.error('Error during manga ID validation: ', err);
        return res.status(500).json({error: 'Internal server error during manga ID validation'})
    }
};

//cashing genre , themes...

async function validateQuery(req, res, next) {
    try {
        const {direction=null, order='popularity', genre='', theme='', explicitGenre='', type='',demographic=''} = req.query;
        console.log('niGGGGer', req.query)
        const validGenre = await validGenreSet();
        const validTheme = await validThemeSet();
        const validDemographic = await validDemographicSet();
        console.log(validGenre, validDemographic)
        let direction2;
        if (direction === null) {
            if (order === 'mean') direction='desc';
        } else {
            direction === 'asc';
        }
        direction2 = (typeof direction === 'string' && direction.toUpperCase() === 'DESC')? direction: 'ASC';
        const order2 = (typeof order === 'string' && validOrder.has(order))? order: 'popularity';

        /*
        function validateTag(tags, TagSet) {
            if(tags) {
                let tag = Array.isArray(tags)? tags : [tags];        
                const invalidTag = tag.filter((i) => !TagSet.has(i));
                if (invalidTag.length > 0) {
                    return res.status(400).json({error: 'Invalid tag ', validTag: TagSet})
                }
            }
        } maybe complete it ? not nessecery tho
        */

        if(genre) {
            let tag = Array.isArray(genre)? genre : [genre];        
            const invalidTag = tag.filter((i) => !validGenre.has(i));
            if (invalidTag.length > 0) {
                return res.status(400).json({error: 'Invalid tag ', validTag: [...validGenre]})
            }
        }

        if(theme) {
            let tag = Array.isArray(theme)? theme: [theme];      
            const invalidTag = tag.filter((i) => !validTheme.has(i))
            if (invalidTag.length > 0) {
                return res.status(400).json({error: 'Invalid tag ', validTag: [...validTheme]})
            }
        }

        if(explicitGenre) {
            let tag = Array.isArray(explicitGenre)? explicitGenre: [explicitGenre];      
            const invalidTag = tag.filter((i) => !validExplicitGenre.has(i))
            if (invalidTag.length > 0) {
                return res.status(400).json({error: 'Invalid tag ', validTag: [...validExplicitGenre]})
            }
        }

        if(type) {
            let tag = Array.isArray(type)? type: [type];    
            const invalidTag = tag.filter((i) => !validType.has(i));
            if (invalidTag.length > 0) {
                return res.status(400).json({error: 'Invalid tag ', validTag: [...validType]})
            }
        }

        if(demographic) {
            let tag = Array.isArray(demographic)? demographic: [demographic];    
            const invalidTag = tag.filter((i) => !validDemographic.has(i));
            if (invalidTag.length > 0) {
                return res.status(400).json({error: 'Invalid tag ', validTag: [...validDemographic]})
            }
        }
                        console.log('direction:99 ', direction)

        req.validated = {
            demographic: demographic,
            type: type,
            explicit_genre: explicitGenre,
            genre: genre,
            theme: theme,
            direction: direction2,
            order: order2
        }

        next();
    } catch (err) {
        console.error("Error at validate query middleware: ", err);
        return res.status(500).json({error: 'Internal server error during caching tags'});
    }

}

// filters = req.query
async function sortMangaByFilters(filters, {page, limit, order, direction}) {
    try {
    let baseQuery = '';
    let baseSelectQuery = `
            SELECT m.id , main_picture_large, title, english_title, start_date, end_date, synopsis,
            rank, mean, popularity, status, media_type, num_volumes 
            FROM manga m`;

    let lastPartBaseQuery = '';

    let queryIndex = 1;
    const queryParams = [];
    const whereClause = [];
    let WhereClauseType = null;

    const categories = [
        'genre',
        'theme',
        'explicit_genre',
        'demographic',
    ];
    let totalTagCount = 0;
    let genreJoinNeeded = false ;
    for(let category in filters) {
        if (categories.includes(category)) {
            
            let categoryTags = (Array.isArray(filters[category]))? filters[category] : [filters[category]];
            categoryTags = categoryTags.filter((i) => i!=='');

            if (categoryTags.length > 0 ) {
                queryParams.push(categoryTags);
                whereClause.push(` (g.type='${category}' AND g.name= ANY($${queryIndex}))`);
                totalTagCount += categoryTags.length;
                queryIndex++;
                genreJoinNeeded = true ;
            }
        }
    }

    if (genreJoinNeeded) baseQuery += ` JOIN manga_genre mg ON m.id=mg.manga_id JOIN genre g ON mg.genre_id=g.id`;
    
    let categoryType = (Array.isArray(filters.type))? filters.type : [filters.type];
    categoryType = categoryType.filter((i) => i!=='');
    
    if ( categoryType.length > 0) {
        queryParams.push(categoryType);
        WhereClauseType = ` m.media_type = ANY($${queryIndex})`;
        queryIndex++;
    }
    
    if (whereClause.length > 0 || WhereClauseType) {
        baseQuery += ' WHERE ';
        if (whereClause.length > 0) {
            baseQuery += `(${whereClause.join(" OR ")})`;
            if (WhereClauseType) {
                baseQuery += ` AND ${WhereClauseType}`;
            }
        } else {
            baseQuery += ` ${WhereClauseType}`;
        }
        
    }
    
    if (whereClause.length > 0){
        //and tags between tags and categories
        baseQuery += ` GROUP BY m.id HAVING COUNT(DISTINCT g.id) = $${queryIndex}`;
        queryParams.push(totalTagCount);
        // or tags between categories 
        /*
        baseQuery += `GROUP BY m.id HAVING VOUNT(DISTINCT g.type) = $${queryIndex}`
        also add 
        */
       //or tags between tags and categories
       /*
       
       */
    } 
    lastPartBaseQuery += ` ORDER BY ${order} ${direction} NULLS LAST 
    LIMIT ${limit} OFFSET ${page};`;
    const countQuery = `
        SELECT COUNT(*) FROM (SELECT m.id FROM manga m ${baseQuery}) sub`;
    console.log('BASE: '+baseSelectQuery + baseQuery + lastPartBaseQuery);
    console.log('COUNT: '+ countQuery + '\n');
    console.log(queryParams)

    const { rows } = await db.query(baseSelectQuery + baseQuery + lastPartBaseQuery, queryParams);
    const result = await db.query(countQuery, queryParams);
    console.log(result.rows[0].count)

    return {cPage: rows, rowCount: result.rows[0].count};
    } catch (err) {
        console.log(err)
    }
}

async function buildSortOption() {
    return ({
        validOrder: [...validOrder],
        genre: [...(await validGenreSet())],
        theme: [...(await validThemeSet())],
        demographic: [...(await validDemographicSet())],
        type: [...validType],
        explicitGenre: [...validExplicitGenre]
    })  
}



//*************************************** end ***************************************************

app.post("/user/signup", async (req, res) => {
    try {
        const {username=null, password=null, email=null} = req.body ; // set these in front , remember nigga
        console.error('test')

        if (!username || !passport ||!email) {
            return res.status(400).json({success: false ,error:'You MUST fill all fields.'})
        }
        const usernameExist = await db.query('SELECT EXISTS (SELECT 1 FROM USERS WHERE username = $1) AS username_exists', [username]);
        if (usernameExist.rows[0].username_exists) {
            return res.status(400).json({success: false, error: 'Username already exists, try a different one.'})
        }
        const emailExists = await db.query('SELECT EXISTS (SELECT 1 FROM USERS WHERE email = $1) AS email_exists', [email]);
        if (emailExists.rows[0].email_exists) {
            return res.status(400).json({success: false, error: 'Email already exist, try a different one.'})
        }  

        const lowerCasePattern = /(?=.*[a-z])/ ;
        const upperCasePattern = /(?=.*[A-Z])/;
        const digitPattern = /(?=.*\d)/;
        const specialPattern = /(?=.*[!@#$%^&*()_+={};"'<>,./])/;
        const lengthPattern = /^.{8,28}$/;
        if (!lowerCasePattern.test(password)) {return res.status(400).json({error: 'Password must contain a lowercase letter ex.(abcde...)'});}
        if (!upperCasePattern.test(password)) {return res.status(400).json({error: 'Password must contain uppercase letter ex.(ABCDEF...)'});}
        if (!digitPattern.test(password)) {return res.status(400).json({error: 'Password must contain a digit ex.(12345...)'})}
        if (!specialPattern.test(password)) {return res.status(400).json({error: 'Password must contain special characters ex.(!@#$%^&*...).'});}
        if (!lengthPattern.test(password)) {return res.status(400).json({error: 'Password must range between 8 to 28 characters.'});}
        
        const hashedPassword = await argon2.hash(password, argon2Options);
        await db.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',[username, hashedPassword, email]);
        res.status(201).send({success: true});

    } catch (err) {
        res.status(502).json({error: "Server error, try again later."});
        console.error("signup error: ", err.message)
    }
});

app.post('/user/login', (req, res, next) => {
    console.log("login route hit body:", req.body);
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.log('passport authentication error: ', err);
            return next(err); 
        }
        if (!user) {
            console.log('passport authentication failed');
            return res.status(400).json({error: info && info.message ? info.message : 'login failed'})
        }
        req.login(user, (err) => {
            if (err) {
                console.error("req.login error: ",err);
                return next(err);
            }
            console.log('user logged in successfully: ',user.username);
            return res.status(200).json({message: 'Logged in successfully' , user: {username: user.username, email: user.email, id : user.id}})
        });
    })(req, res, next);
});

app.post('/user/logout', (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            console.log('logout error: ', err);
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                console.log('error destroying session during logout ', err);
                return res.status(500).json({error: 'Logout failed, could not destroy the session.'})
            }
            res.clearCookie('connect.sid');
            console.log('User logged out and session destroyed.');
            return res.status(200).json({message: 'Logged out successfully'})
        });
    });
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next()
    }
    res.status(401).json({error: 'Unauthorized, please log in .'})
}

app.get('/manga', validateQuery, async(req, res) => {
    let page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? '50', 10);
    try {
        console.log('dirrrrectiom: '+ req.validated.direction)
        const result = await sortMangaByFilters(req.validated, {page: limit*(page-1), limit: limit, order: req.validated.order, direction: req.validated.direction });
        let favorites = new Set();
        
        let cPage = result.cPage;

        const count = result.rowCount;
        const allPages = Math.ceil(count/limit) ;
        if ( isNaN(page) || page > allPages || page < 1 ) page = 1 ;
        if ( isNaN(limit) || limit > 200 || limit < 1 ) limit = 60 ;
        
        console.log(req.isAuthenticated())
        if (req.isAuthenticated()) {
            const userId = req.user.id;
            const favoritesResult = await db.query('SELECT manga_id FROM users_favorites WHERE user_id = $1', [userId])
            favorites = new Set(favoritesResult.rows.map(i => i.manga_id));
            console.log(favorites)
            cPage = cPage.map((e) => ({...e, favorites: favorites.has(e.id)}));
        }
        
        
        let hasPrev ;
        let hasNext ;
        hasPrev = (page> 1)? true: false ;
        hasNext = (page < allPages)? true: false;  
        const orderOptions = await buildSortOption();
        console.log('page: ',page, allPages)
        res.status(200).json({
            page: cPage,
            totalCount: count,
            pageNum: page,
            maxPageNum: allPages,
            sortOption:orderOptions,
            hasNext: hasNext, hasPrev: hasPrev });
    } catch (err) {
        console.error("error fetching manga: ", err.message)
        res.status(500).json({error: "Error fetching manga "});
    } finally {
        
    }
});

app.post("/manga/user/favorites/:mangaId",isAuthenticated, ValidatingMangaId , async(req, res) => {
    const mangaId = parseInt(req.params.mangaId, 10);
    const userId = req.user.id

    try {
    const favoriteExists = await db.query("SELECT 1 FROM users_favorites WHERE user_id=$1 AND manga_id=$2", [userId, mangaId]);
    if (favoriteExists.rows.length > 0) {
        return res.status(200).json({message :'Manga already exists in your favorites'})
    }

    const result = await db.query(`
        WITH inserted AS 
        (INSERT INTO users_favorites (manga_id, user_id) VALUES ($1, $2) 
        ON CONFLICT (user_id, manga_id) DO NOTHING RETURNING manga_id) 
        SELECT title FROM manga 
        INNER JOIN  inserted on manga.id=inserted.manga_id`, [mangaId, userId]);

    if (result.rows.length === 0) {
        return res.status(500).json({message: `Failed to favorite the manga.`})
    }
    return res.status(200).json({message: `${result.rows[0].title} added to your favorites`})
    } catch (err) {
       console.error(`Error favoriting the manga id:${mangaId}, user:${userId}`, err);
       return res.status(500).json({error: 'Internal server error'}) 
    }
})

app.delete("/manga/user/favorites/:mangaId", isAuthenticated, async(req, res) => {
    const mangaId = parseInt(req.params.mangaId, 10);
    const userId = req.user.id

    const MangaIdError = await ValidatingMangaId(mangaId, db); 
    if(MangaIdError) {return res.status(MangaIdError.status).json({error: MangaIdError.message})};

    try {
        const deleteResult = await db.query('DELETE FROM users_favorites WHERE manga_id=$1 AND user_id=$2', [mangaId, userId]);
        if (deleteResult.rowCount === 0) {
            return res.status(400).json({error: 'Could not remove favorite as it does not exist'})
        }

        return res.status(200).json({message: 'Manga removed from your favorites.'})

    } catch (err) {
        console.error(`Error deleting the manga ID:${mangaId}, user:${userId}`, err);
        return res.status(500).json({error: 'Internal server error'}) 
    }
});

app.get("/manga/:mangaId", async(req, res) => {
    const mangaId = parseInt(req.params.mangaId, 10);
    const MangaIdError =await ValidatingMangaId(mangaId, db);
    if (MangaIdError) {
        return res.status(MangaIdError.status).json({error: MangaIdError.error});
    }
    try {
        const mangaResult = await db.query(`
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
			GROUP BY m.id `, [mangaId]);

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
            numScoringUsers: row.numScoringUsers,
            status: row.status,
            nsfw: row.nsfw,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            mediaType: row.mediaType,
            numChapters: row.numChapters,
            numVolumes: row.numVolumes,
            background: row.background,
            serialization: row.serialization,
            synonym: row.synonym,
            picturesMedium: row.picturesMedium,
            picturesLarge: row.picturesLarge,
            authors: row.authors,
            tags: row.tags
        }
            
        const relatedResult = await db.query(`
            SELECT m.main_picture_medium, m.title, m.english_title, m.start_date, m.synopsis,
            m.rank, m.mean, m.popularity, m.status, m.media_type, m.num_volumes, m.num_chapters,
            rm.relation_type

            FROM manga m 
            JOIN related_manga rm ON m.id = rm.related_manga_id
            WHERE rm.manga_id = $1`, [mangaId]);

        const relationRows = relatedResult.rows
        const relatedManga = relationRows.map( row => ({
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
            relationType: row.relation_type
        }));

        const recommendationResult = await db.query(`
            SELECT m.main_picture_medium, m.title, m.english_title, m.start_date, m.synopsis,
            m.rank, m.mean, m.popularity, m.status, m.media_type, m.num_volumes, m.num_chapters,
            rm.relation_type

            FROM manga m
            JOIN recommendation rec ON m.id = rec.recommendation_id
            WHERE rec.manga_id = $1`, [mangaId]);

        const recommendationRows = recommendationResult.rows
        const recommendedManga = recommendationRows.map( row => ({
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
            relationType: row.relation_type
        }));
          
        let isFavorited = false; 
        if (req.isAuthenticated && req.isAuthenticated()) {
            const favoritedResult = await db.query(`SELECT 1 FROM users_favorites WHERE user_id=$1 AND manga_id=$2`, [req.user.id, mangaId]);
            if (favoritedResult.rows.length > 0) {
                isFavorited = true;
            }
        }
        
        return res.status(200).json({
            manga: manga,
            relatedManga : relatedManga,
            recommendedManga : recommendedManga,
            Favorited: isFavorited 
        })

    } catch (err) {
        console.error(`Error getting manga id:${mangaId}: `,err);
        return res.status(500).json({error: "Internal server error"});
    }
});

app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if(!query) return(res.status(400).json({error: 'Search query "q" is needed '}));
        const result = await db.query(`
            SELECT 
            id, main_picture_medium, title, start_date, end_date, synopsis, mean, status, media_type, similarity(search_title, $1) AS relevency
            FROM manga WHERE search_title % $1 ORDER BY relevency DESC`, [query]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.log('error in search engine: ', err);
        res.status(500).json({error: 'internal database/server error'})
    }
});

app.get("/user/user", isAuthenticated, async(req, res) => {
    const userId = req.user.id;

    try {
        const userIdResult = await db.query('SELECT username, email FROM users WHERE id=$1', [userId]);
        return res.status(200).json({email: userIdResult.email, username: userIdResult.username});
    } catch (err) {
        console.error('Error getting user ID: ', err)
        return res.status(500).json({error: 'Internal server error.'});
    }

});

/* NOT UET USEFULL BUT COULD BE USEFULL IF THERE WAS SOME INFO TO ADD LATER ON LIKE PICTURE , NAME , LAST NAME
app.post("/user/:userId", async(req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const ValidateUserId =await ValidatingUserId(userId, db)
    if (ValidateUserId) {return res.status(ValidateUserId.status).json({error: ValidateUserId.error});};
    try {
        
    } catch (err) {
        console.error('Error posting user ID: ', err)
        return res.status(500).json({error: 'Internal server error.'});
    }
});
*/

app.patch("/user", isAuthenticated, async(req, res) => {
    const userId = parseInt(req.user.id, 10);
    const updates = req.body;
    try {

        await db.query('BEGIN');

        const updateFields = {}
        const userIdResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userIdResult.rows[0];

        if (updates.username) {
            const newUsername = updates.username;

            if (user.username === newUsername) {
                return res.status(400).json({error: 'Username can not be the same as last username.'})
            }
            const usernameCheckResult = await db.query('SELECT 1 FROM users WHERE username = $1', [newUsername]);
        
            if (usernameCheckResult.rows.length > 0) {
                return res.status(400).json({error: 'Username already taken try again.'})
            }

            const lengthPattern = /^.{3,28}$/;
            if (!lengthPattern.test(newUsername)) {return res.status(400).json({error: 'Password must range between 3 to 28 characters.'});}

            await db.query('UPDATE users SET username = $1 WHERE id = $2', [newUsername, userId]);
            updateFields.username = true;
        }

        if (updates.email) {
            const newEmail = updates.email;

            if (user.email === newEmail) {  
                return res.status(400).json({error: 'Email can not be the same as last Email.'})
            }
            const emailCheckResult = await db.query('SELECT 1 FROM users WHERE email = $1', [newEmail]);
        
            if (emailCheckResult.rows.length > 0) {
                return res.status(400).json({error: 'email already used try again.'})
            }

            await db.query('UPDATE users SET email = $1 where id = $2', [newEmail, userId]);// Consider adding a regex to validate the format of newEmail
            updateFields.email = true;

        }

        if (!updates.password && 'password' in updates) {
            return res.status(400).json({error: 'Password field can not be empty if provided.'})
        }

        if (updates.password) {
            const newPlainTextPass = updates.password;

            const lowerCasePattern = /(?=.*[a-z])/ ;
            const upperCasePattern = /(?=.*[A-Z])/;
            const digitPattern = /(?=.*\d)/;
            const specialPattern = /(?=.*[!@#$%^&*()_+={};"'<>,./])/;
            const lengthPattern = /^.{8,28}$/;

            if (!lowerCasePattern.test(newPlainTextPass)) {return res.status(400).json({error: 'Password must contain a lowercase letter ex.(abcde...)'});}
            if (!upperCasePattern.test(newPlainTextPass)) {return res.status(400).json({error: 'Password must contain a uppercase letter ex.(ABCDEF...)'});}
            if (!digitPattern.test(newPlainTextPass))     {return res.status(400).json({error: 'Password must contain a digit ex.(12345...)'})}
            if (!specialPattern.test(newPlainTextPass))   {return res.status(400).json({error: 'Password must contain special characters ex.(!@#$%^&*...).'});}
            if (!lengthPattern.test(newPlainTextPass))    {return res.status(400).json({error: 'Password must range between 8 to 28 characters.'});}
            
            const passCheck = argon2.verify(user.password, newPlainTextPass, { secret: pepper });
            if (passCheck) {
                return res.status(400).json({error: 'Password can NOT be same as the last password' });
            }

            const hashedPassword = await argon2.hash(newPlainTextPass, argon2Options);
            await db.query('UPDATE users SET password = $1 WHERE id = $2',[hashedPassword, userId]);

            updateFields.password = true;
        }

        if (!(Object.keys(updateFields).length === 0)) {
            return res.status(400).json({error: 'No fields provided for update or no changes made.'})
        }

        await db.query('COMMIT')
        return res.status(200).json({message: 'User updated successfully', updateFields: updateFields})
    } catch (err) {
        try {
            await db.query("ROLLBACK")
        } catch (rollbackError) {
            console.error(`ROLLBACK failed at patchign user data`, rollbackError);
            return res.status(500).json({error: 'Failed saving user data to database.'})
        }
        console.error('Error patching user ID: ', err)
        return res.status(500).json({error: 'Internal server error.'});
    }
});

app.get("/user/favorites", isAuthenticated, async(req, res) => {
    try {

        const {rows} = await db.query(`
            SELECT m.id, main_picture_medium, title, english_title, start_date, synopsis, rank, mean, popularity, status, media_type, num_volumes, num_chapters 
            FROM manga m JOIN users_favorites uf ON m.id = uf.manga_id WHERE uf.user_id = $1`, [req.user.id]);
        return res.status(200).json({favorited: rows});

    } catch (err) {
        console.error('Error posting user ID: ', err)
        return res.status(500).json({error: 'Internal server error.'});
    }
});


/*
app.post('/manga', isAuthenticated, async (req, res) => {
    const {title, } = req.body
}) this is probably not needed since its supposed to be automatic and only api also with using this theneed to be way more goddamn code 
 */

app.listen(port, () => {console.log(`listening to port: ${port}`)});

