import { Router } from "express";
import argon2 from "argon2";
import { argon2Options } from "../config/security.js";

function createAuthRoutes(db, passport) {
  const router = Router();

  router.post("/signup", async (req, res) => {
    try {
      const { username = null, password = null, email = null } = req.body;
      if (!username || !password || !email) {
        return res
          .status(400)
          .json({ success: false, error: "Please fill in all required fields." });
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

      const lowerCasePattern = /(?=.*[a-z])/;
      const upperCasePattern = /(?=.*[A-Z])/;
      const digitPattern = /(?=.*\d)/;
      const specialPattern = /(?=.*[!@#$%^&*()_+={};"'<>,./])/;
      const lengthPattern = /^.{8,28}$/;
      if (!lowerCasePattern.test(password)) {
        return res.status(400).json({
          error: "Password must contain at least one lowercase letter (a-z).",
        });
      }
      if (!upperCasePattern.test(password)) {
        return res.status(400).json({
          error: "Password must contain at least one uppercase letter (A-Z).",
        });
      }
      if (!digitPattern.test(password)) {
        return res
          .status(400)
          .json({ error: "Password must contain at least one number (0-9)." });
      }
      if (!specialPattern.test(password)) {
        return res.status(400).json({
          error: "Password must contain at least one special character (!@#$%^&*).",
        });
      }
      if (!lengthPattern.test(password)) {
        return res
          .status(400)
          .json({ error: "Password must be between 8 and 28 characters long." });
      }

      const hashedPassword = await argon2.hash(password, argon2Options);
      await db.query(
        "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
        [username, hashedPassword, email],
      );
      res.status(201).json({ success: true, message: "Account created successfully! You can now log in." });
    } catch (err) {
      res.status(500).json({ error: "Something went wrong. Please try again later." });
      console.error("signup error: ", err.message);
    }
  });

  router.post("/login", (req, res, next) => {
    console.log("login route hit body:", req.body);
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.log("passport authentication error: ", err);
        return next(err);
      }
      if (!user) {
        console.log("passport authentication failed");
        return res
          .status(401)
          .json({ error: info && info.message ? info.message : "Invalid username or password." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("req.login error: ", loginErr);
          return next(loginErr);
        }
        console.log("user logged in successfully: ", user.username);
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
        console.log("logout error: ", err);
        return next(err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.log("error destroying session during logout ", destroyErr);
          return res
            .status(500)
            .json({ error: "Logout failed. Please try again." });
        }
        res.clearCookie("connect.sid");
        console.log("User logged out and session destroyed.");
        return res.status(200).json({ success: true, message: "You've been logged out successfully." });
      });
    });
  });

  return router;
}

export default createAuthRoutes;
