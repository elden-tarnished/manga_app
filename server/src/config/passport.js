import LocalStrategy from "passport-local";
import argon2 from "argon2";
import { pepper } from "./security.js";

function configurePassport(passport, db) {
  passport.use(
    new LocalStrategy(async function (username, password, done) {
      let dbClient;
      try {
        dbClient = await db.connect();
        const result = await dbClient.query(
          "SELECT * FROM users WHERE username=$1 OR email=$1",
          [username],
        );
        if (result.rows.length === 0) {
          return done(null, false, { message: "Invalid username or password." });
        }

        const user = result.rows[0];
        const hashedPassword = user.password;
        const secret = pepper ? { secret: pepper } : {};
        const checkPassword = await argon2.verify(hashedPassword, password, secret);

        if (checkPassword) {
          return done(null, {
            id: user.id,
            username: user.username,
            email: user.email,
          });
        }

        return done(null, false, { message: "Invalid username or password." });
      } catch (err) {
        console.error("error trying local strategy:", err);
        return done(err);
      } finally {
        if (dbClient) {
          dbClient.release();
        }
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("serializing user: ", user.username);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    let dbClient;
    try {
      console.log("deserializing user: ", id);
      dbClient = await db.connect();
      const result = await dbClient.query(
        "SELECT id, username, email FROM users WHERE id=$1",
        [id],
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        done(null, user);
      } else {
        done(new Error("user not found during deserialization"), null);
      }
    } catch (err) {
      console.error("Error during deserializeUser, ", err);
      done(err, null);
    } finally {
      if (dbClient) {
        dbClient.release();
      }
    }
  });
}

export default configurePassport;
