import LocalStrategy from "passport-local";
import argon2 from "argon2";
import { pepper } from "./security.js";

function configurePassport(passport, db) {
  passport.use(
    new LocalStrategy(async function (username, password, done) {
      try {
        const result = await db.query(
          "SELECT * FROM users WHERE username=$1 OR email=$1",
          [username],
        );
        if (result.rows.length === 0) {
          return done(null, false, { message: "Invalid username or password." });
        }

        const user = result.rows[0];
        const secret = pepper ? { secret: pepper } : {};
        const checkPassword = await argon2.verify(user.password, password, secret);

        if (checkPassword) {
          return done(null, {
            id: user.id,
            username: user.username,
            email: user.email,
          });
        }

        return done(null, false, { message: "Invalid username or password." });
      } catch (err) {
        console.error("error trying local strategy:", err.message);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // `false` (not an error) when the account no longer exists: passport then
  // drops the stale login from the session and the visitor is simply logged out.
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await db.query(
        "SELECT id, username, email FROM users WHERE id=$1",
        [id],
      );
      return done(null, result.rows[0] ?? false);
    } catch (err) {
      console.error("Error during deserializeUser:", err.message);
      return done(err);
    }
  });
}

export default configurePassport;
