// Vercel serverless entry. The Express app is a (req, res) handler, so it can be
// exported as-is. vercel.json rewrites every /api/* request to this file and
// Express then routes on the original URL.
import app from "../server/src/app.js";

export default app;
