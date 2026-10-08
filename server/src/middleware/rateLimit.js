// Counts attempts per visitor IP in Postgres. A serverless function has no
// shared memory between instances (and forgets everything on a cold start),
// so an in-memory counter would let an attacker reset it for free.
function createRateLimit(db, { name, max, windowSeconds }) {
  return async function rateLimit(req, res, next) {
    const key = `${name}:${req.ip}`;
    try {
      const { rows } = await db.query(
        `insert into rate_limit (key, hits, reset_at)
         values ($1, 1, now() + make_interval(secs => $2))
         on conflict (key) do update set
           hits     = case when rate_limit.reset_at <= now() then 1 else rate_limit.hits + 1 end,
           reset_at = case when rate_limit.reset_at <= now() then excluded.reset_at else rate_limit.reset_at end
         returning hits, ceil(extract(epoch from reset_at - now()))::int as retry_after`,
        [key, windowSeconds],
      );
      const { hits, retry_after: retryAfter } = rows[0];

      // Now and then, forget counters that ran out a day ago.
      if (Math.random() < 0.02) {
        db.query("delete from rate_limit where reset_at < now() - interval '1 day'").catch(() => {});
      }

      if (hits > max) {
        res.set("Retry-After", String(retryAfter));
        return res
          .status(429)
          .json({ error: "Too many attempts. Please wait a few minutes and try again." });
      }
    } catch (error) {
      // No table yet (scripts/init-db.js not run) or a database hiccup:
      // let the request through rather than locking everybody out.
      console.error(`rate limit check failed (${name}):`, error.message);
    }
    return next();
  };
}

export { createRateLimit };
