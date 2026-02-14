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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
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
