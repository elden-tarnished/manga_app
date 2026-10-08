import { Router } from "express";
import argon2 from "argon2";
import { withTransaction } from "../config/db.js";
import { argon2Options, pepper } from "../config/security.js";
import { isAuthenticated } from "../middleware/auth.js";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/validation.js";

const UNIQUE_VIOLATION = "23505";

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
      return res
        .status(200)
        .json({ email: user.email, username: user.username });
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

        const usernameValidation = validateUsername(newUsername);
        if (!usernameValidation.valid) {
          return res.status(400).json({ error: usernameValidation.error });
        }

        updateStatements.push((client) =>
          client.query("UPDATE users SET username = $1 WHERE id = $2", [
            newUsername,
            userId,
          ]),
        );
        updateFields.username = true;
      }

      if (updates.email) {
        const newEmail = updates.email;

        const emailValidation = validateEmail(newEmail);
        if (!emailValidation.valid) {
          return res.status(400).json({ error: emailValidation.error });
        }

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
          return res
            .status(400)
            .json({ error: "email already used try again." });
        }

        updateStatements.push((client) =>
          client.query("UPDATE users SET email = $1 WHERE id = $2", [
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

        const passwordValidation = validatePassword(newPlainTextPass);
        if (!passwordValidation.valid) {
          return res.status(400).json({ error: passwordValidation.errors[0] });
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

        const hashedPassword = await argon2.hash(
          newPlainTextPass,
          argon2Options,
        );
        updateStatements.push((client) =>
          client.query("UPDATE users SET password = $1 WHERE id = $2", [
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

      // All changes or none: one connection, one transaction.
      await withTransaction(db, async (client) => {
        for (const statement of updateStatements) {
          await statement(client);
        }
      });
      return res.status(200).json({
        message: "User updated successfully",
        updateFields: updateFields,
      });
    } catch (err) {
      // Someone else took the name / email between the check above and the update.
      if (err.code === UNIQUE_VIOLATION) {
        return res
          .status(400)
          .json({ error: "That username or email was just taken, try another." });
      }
      console.error("Error patching user ID: ", err.message);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  router.get("/favorites", isAuthenticated, async (req, res) => {
    try {
      const { rows } = await db.query(
        `
            SELECT m.id, main_picture_large, title, english_title, start_date, synopsis, rank, mean, popularity, status, media_type, num_volumes, num_chapters 
            FROM manga m JOIN users_favorites uf ON m.id = uf.manga_id WHERE uf.user_id = $1`,
        [req.user.id],
      );
      return res.status(200).json({ favorited: rows });
    } catch (err) {
      console.error("Error posting user ID: ", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  router.post("/check-username", isAuthenticated, async (req, res) => {
    const { username } = req.body;
    const userId = req.user.id;

    // Use shared validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res
        .status(200)
        .json({ valid: false, error: usernameValidation.error });
    }

    try {
      // Check if it's the current user's username
      const currentUserResult = await db.query(
        "SELECT username FROM users WHERE id = $1",
        [userId],
      );
      if (currentUserResult.rows[0].username === username) {
        return res
          .status(200)
          .json({ valid: true, available: false, reason: "same_as_current" });
      }

      // Check if taken by others
      const checkResult = await db.query(
        "SELECT 1 FROM users WHERE username = $1",
        [username],
      );
      if (checkResult.rows.length > 0) {
        return res.status(200).json({
          valid: false,
          available: false,
          error: "Username is already taken",
        });
      }

      return res.status(200).json({ valid: true, available: true });
    } catch (err) {
      console.error("Error checking username:", err);
      return res
        .status(500)
        .json({ valid: false, error: "Internal server error" });
    }
  });

  // Public on purpose: the signup page checks the password before an account
  // exists. It only runs the rules below and never touches the database.
  router.post("/validate-password", (req, res) => {
    const { password } = req.body;

    const result = validatePassword(password);
    return res.status(200).json(result);
  });

  return router;
}

export default createUserRoutes;
