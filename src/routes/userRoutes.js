import { Router } from "express";
import argon2 from "argon2";
import { argon2Options, pepper } from "../config/security.js";
import { isAuthenticated } from "../middleware/auth.js";

function createUserRoutes(db) {
  const router = Router();

  router.get("/user", isAuthenticated, async (req, res) => {
    const userId = req.user.id;

    try {
      const userIdResult = await db.query(
        "SELECT username, email FROM users WHERE id=$1",
        [userId],
      );
      const user = userIdResult.rows[0];
      return res.status(200).json({ email: user.email, username: user.username });
    } catch (err) {
      console.error("Error getting user ID: ", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  router.patch("/", isAuthenticated, async (req, res) => {
    const userId = parseInt(req.user.id, 10);
    const updates = req.body;
    const updateFields = {};
    const updateStatements = [];

    try {
      const userIdResult = await db.query("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      const user = userIdResult.rows[0];

      if (updates.username) {
        const newUsername = updates.username;

        if (user.username === newUsername) {
          return res
            .status(400)
            .json({ error: "Username can not be the same as last username." });
        }
        const usernameCheckResult = await db.query(
          "SELECT 1 FROM users WHERE username = $1",
          [newUsername],
        );

        if (usernameCheckResult.rows.length > 0) {
          return res
            .status(400)
            .json({ error: "Username already taken try again." });
        }

        const lengthPattern = /^.{3,28}$/;
        if (!lengthPattern.test(newUsername)) {
          return res
            .status(400)
            .json({ error: "Password must range between 3 to 28 characters." });
        }

        updateStatements.push(() =>
          db.query("UPDATE users SET username = $1 WHERE id = $2", [
            newUsername,
            userId,
          ]),
        );
        updateFields.username = true;
      }

      if (updates.email) {
        const newEmail = updates.email;

        if (user.email === newEmail) {
          return res
            .status(400)
            .json({ error: "Email can not be the same as last Email." });
        }
        const emailCheckResult = await db.query(
          "SELECT 1 FROM users WHERE email = $1",
          [newEmail],
        );

        if (emailCheckResult.rows.length > 0) {
          return res.status(400).json({ error: "email already used try again." });
        }

        updateStatements.push(() =>
          db.query("UPDATE users SET email = $1 where id = $2", [
            newEmail,
            userId,
          ]),
        );
        updateFields.email = true;
      }

      if (!updates.password && "password" in updates) {
        return res
          .status(400)
          .json({ error: "Password field can not be empty if provided." });
      }

      if (updates.password) {
        const newPlainTextPass = updates.password;

        const lowerCasePattern = /(?=.*[a-z])/;
        const upperCasePattern = /(?=.*[A-Z])/;
        const digitPattern = /(?=.*\d)/;
        const specialPattern = /(?=.*[!@#$%^&*()_+={};"'<>,./])/;
        const lengthPattern = /^.{8,28}$/;

        if (!lowerCasePattern.test(newPlainTextPass)) {
          return res.status(400).json({
            error: "Password must contain a lowercase letter ex.(abcde...)",
          });
        }
        if (!upperCasePattern.test(newPlainTextPass)) {
          return res.status(400).json({
            error: "Password must contain a uppercase letter ex.(ABCDEF...)",
          });
        }
        if (!digitPattern.test(newPlainTextPass)) {
          return res
            .status(400)
            .json({ error: "Password must contain a digit ex.(12345...)" });
        }
        if (!specialPattern.test(newPlainTextPass)) {
          return res.status(400).json({
            error: "Password must contain special characters ex.(!@#$%^&*...).",
          });
        }
        if (!lengthPattern.test(newPlainTextPass)) {
          return res
            .status(400)
            .json({ error: "Password must range between 8 to 28 characters." });
        }

        const passCheck = await argon2.verify(
          user.password,
          newPlainTextPass,
          pepper ? { secret: pepper } : {},
        );
        if (passCheck) {
          return res
            .status(400)
            .json({ error: "Password can NOT be same as the last password" });
        }

        const hashedPassword = await argon2.hash(newPlainTextPass, argon2Options);
        updateStatements.push(() =>
          db.query("UPDATE users SET password = $1 WHERE id = $2", [
            hashedPassword,
            userId,
          ]),
        );

        updateFields.password = true;
      }

      if (Object.keys(updateFields).length === 0) {
        return res
          .status(400)
          .json({ error: "No fields provided for update or no changes made." });
      }

      await db.query("BEGIN");
      for (const statement of updateStatements) {
        await statement();
      }
      await db.query("COMMIT");
      return res.status(200).json({
        message: "User updated successfully",
        updateFields: updateFields,
      });
    } catch (err) {
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(`ROLLBACK failed at patchign user data`, rollbackError);
        return res
          .status(500)
          .json({ error: "Failed saving user data to database." });
      }
      console.error("Error patching user ID: ", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  router.get("/favorites", isAuthenticated, async (req, res) => {
    try {
      const { rows } = await db.query(
        `
            SELECT m.id, main_picture_medium, title, english_title, start_date, synopsis, rank, mean, popularity, status, media_type, num_volumes, num_chapters 
            FROM manga m JOIN users_favorites uf ON m.id = uf.manga_id WHERE uf.user_id = $1`,
        [req.user.id],
      );
      return res.status(200).json({ favorited: rows });
    } catch (err) {
      console.error("Error posting user ID: ", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  return router;
}

export default createUserRoutes;
