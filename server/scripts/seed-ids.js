// Inserts the ids of the top-ranked manga so the import script has rows to fill:
//   node scripts/seed-ids.js [count]      (default 2000)
// Then run: node src/apiFetching/db_fetching_promise.js
import axios from "axios";
import db from "../src/config/db.js";

const count = Number(process.argv[2] ?? 2000);
const PAGE = 500; // MyAnimeList's maximum page size for rankings
const headers = { "X-MAL-CLIENT-ID": process.env.CLIENT_ID };

try {
  const ids = [];
  for (let offset = 0; offset < count; offset += PAGE) {
    const { data } = await axios.get("https://api.myanimelist.net/v2/manga/ranking", {
      headers,
      params: { ranking_type: "all", limit: Math.min(PAGE, count - offset), offset },
      timeout: 30000,
    });
    ids.push(...data.data.map((entry) => entry.node.id));
    console.log(`fetched ${ids.length}/${count} ids`);
  }
  const result = await db.query(
    "insert into manga (id) select unnest($1::int[]) on conflict (id) do nothing",
    [ids],
  );
  console.log(`inserted ${result.rowCount} new rows (${ids.length - result.rowCount} already existed)`);
} finally {
  await db.end();
}
