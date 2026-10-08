import { Router } from "express";
import argon2 from "argon2";
import { argon2Options } from "../config/security.js";
import { createRateLimit } from "../middleware/rateLimit.js";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/validation.js";

const UNIQUE_VIOLATION = "23505";

function createAuthRoutes(db, passport) {
  const router = Router();
  // Each attempt costs a 64 MiB Argon2 hash, so guessing is limited per IP.
  const loginLimit = createRateLimit(db, { name: "login", max: 10, windowSeconds: 15 * 60 });
  const signupLimit = createRateLimit(db, { name: "signup", max: 5, windowSeconds: 60 * 60 });

  router.post("/signup", signupLimit, async (req, res) => {
    try {
      const { username = null, password = null, email = null } = req.body;
      if (!username || !password || !email) {
        return res
          .status(400)
          .json({ success: false, error: "Please fill in all required fields." });
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ success: false, error: emailValidation.error });
      }

      // Validate username format
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return res.status(400).json({ success: false, error: usernameValidation.error });
      }

      const usernameExist = await db.query(
        "SELECT EXISTS (SELECT 1 FROM USERS WHERE username = $1) AS username_exists",
        [username],
      );
      if (usernameExist.rows[0].username_exists) {
        return res.status(400).json({
          success: false,
          error: "This username is already taken. Please choose another one.",
        });
      }
      const emailExists = await db.query(
        "SELECT EXISTS (SELECT 1 FROM USERS WHERE email = $1) AS email_exists",
        [email],
      );
      if (emailExists.rows[0].email_exists) {
        return res.status(400).json({
          success: false,
          error: "This email is already registered. Please use a different one.",
        });
      }

      // Validate password using shared utility
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.errors[0],
        });
      }

      const hashedPassword = await argon2.hash(password, argon2Options);
      await db.query(
        "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
        [username, hashedPassword, email],
      );
      res.status(201).json({ success: true, message: "Account created successfully! You can now log in." });
    } catch (err) {
      // Two signups with the same name at the same moment both pass the
      // checks above; the unique constraint stops the second one here.
      if (err.code === UNIQUE_VIOLATION) {
        return res.status(400).json({
          success: false,
          error: "This username or email is already registered.",
        });
      }
      console.error("signup error: ", err.message);
      return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
  });

  // Never log req.body here: it holds the password in plain text.
  router.post("/login", loginLimit, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ error: info && info.message ? info.message : "Invalid username or password." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("req.login error: ", loginErr);
          return next(loginErr);
        }
        return res.status(200).json({
          success: true,
          message: "Welcome back! You've logged in successfully.",
          user: { username: user.username, email: user.email, id: user.id },
        });
      });
    })(req, res, next);
  });

  router.post("/logout", (req, res, next) => {
    req.logOut((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("error destroying session during logout:", destroyErr.message);
          return res
            .status(500)
            .json({ error: "Logout failed. Please try again." });
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({ success: true, message: "You've been logged out successfully." });
      });
    });
  });

  return router;
}

export default createAuthRoutes;
