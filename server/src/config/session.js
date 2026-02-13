import session from "express-session";
import "./env.js";

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600 * 1000 * 24 * 7, // 7 days
  },
};

export { session, sessionConfig };
