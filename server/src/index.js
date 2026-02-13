import "./config/env.js";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import qs from "qs";
import db from "./config/db.js";
import configurePassport from "./config/passport.js";
import { session, sessionConfig } from "./config/session.js";
import createAuthRoutes from "./routes/authRoutes.js";
import createMangaRoutes from "./routes/mangaRoutes.js";
import createSearchRoutes from "./routes/searchRoutes.js";
import createUserRoutes from "./routes/userRoutes.js";

const app = express();
const port = Number(process.env.PORT || 3000);

const normalizeOrigin = (value = "") =>
  value.trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
const defaultOrigins = ["http://localhost:5173", "https://manga-app-mu.vercel.app"];
const envOriginsRaw = process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? "";
const allowedOrigins = new Set(
  (envOriginsRaw || defaultOrigins.join(","))
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl/Postman) with no Origin header.
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.set("query parser", (str) => qs.parse(str));

configurePassport(passport, db);

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

app.use("/user", createAuthRoutes(db, passport));
app.use("/user", createUserRoutes(db));
app.use("/manga", createMangaRoutes(db));
app.use("/", createSearchRoutes(db));

app.listen(port, () => {
  console.log(`listening to port: ${port}`);
});
