/**
 * MANGAFIRE CHAPTER DOWNLOADER (Fixed & Debugged)
 *
 * Usage:
 * 1. npm install
 * 2. Edit 'TARGET_URL' below to the chapter you want to download.
 * 3. Run: node mangafire_chapter_images.js
 *
 * How it works:
 * - Uses Puppeteer with a custom extension to intercept the secure API request.
 * - Bypasses anti-debugging protections.
 * - Extracts the image API URL and Cookies.
 * - Downloads and descrambles images using Axios and Canvas.
 */

import puppeteer from "puppeteer";
import axios from "axios";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import http from "http";

// --- 1. CONFIGURATION ---
const PORT = 3000;
const TARGET_URL =
  "https://mangafire.to/read/isekai-koushoku-musouroku-isekai-tensei-no-chie-to-chikara-wo-tada-hitasura-xxxx-suru-tame-ni-tsukauu.0qp4r/en/chapter-1";

// --- 2. DESCRAMBLING LOGIC ---
const PIECE_SIZE = 200;
const MIN_SPLIT_COUNT = 5;

function ceilDiv(a, b) {
  return Math.ceil(a / b);
}

async function descrambleImage(imageBuffer, offset) {
  const img = await loadImage(imageBuffer);
  const width = img.width;
  const height = img.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const pieceWidth = Math.min(PIECE_SIZE, ceilDiv(width, MIN_SPLIT_COUNT));
  const pieceHeight = Math.min(PIECE_SIZE, ceilDiv(height, MIN_SPLIT_COUNT));
  const xMax = ceilDiv(width, pieceWidth) - 1;
  const yMax = ceilDiv(height, pieceHeight) - 1;

  for (let y = 0; y <= yMax; y++) {
    for (let x = 0; x <= xMax; x++) {
      const xDst = pieceWidth * x;
      const yDst = pieceHeight * y;
      const w = Math.min(pieceWidth, width - xDst);
      const h = Math.min(pieceHeight, height - yDst);
      let xSrc =
        x === xMax ? pieceWidth * x : pieceWidth * ((xMax - x + offset) % xMax);
      let ySrc =
        y === yMax
          ? pieceHeight * y
          : pieceHeight * ((yMax - y + offset) % yMax);
      ctx.drawImage(img, xSrc, ySrc, w, h, xDst, yDst, w, h);
    }
  }
  return canvas.toBuffer("image/jpeg");
}

// --- 3. CREATE TEMPORARY EXTENSION ---
function createExtension() {
  const extDir = path.resolve("./temp_extension");
  if (!fs.existsSync(extDir)) fs.mkdirSync(extDir);

  const manifest = {
    manifest_version: 3,
    name: "MangaFire Sniffer",
    version: "1.0",
    permissions: ["webRequest", "cookies"],
    host_permissions: ["*://mangafire.to/*", "http://localhost:3000/*"],
    background: {
      service_worker: "background.js",
    },
  };

  // We strictly target the URL pattern that has /ajax/read/chapter/FOLLOWED_BY_DIGITS
  // This avoids the chapter list URL (which is /ajax/read/SLUG/chapter/en)
  const backgroundJs = `
        const SERVER_URL = "http://localhost:${PORT}/captured";
        let captured = false;

        chrome.webRequest.onBeforeSendHeaders.addListener(
            function(details) {
                if (captured) return;
                // Regex to match .../ajax/read/chapter/12345...
                if (/\\/ajax\\/read\\/chapter\\/\\d+/.test(details.url)) {
                    console.log("🎯 TARGET ACQUIRED:", details.url);
                    
                    chrome.cookies.getAll({domain: "mangafire.to"}, function(cookies) {
                        const cookieString = cookies.map(c => c.name + "=" + c.value).join("; ");
                        
                        fetch(SERVER_URL, {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({
                                url: details.url,
                                cookie: cookieString
                            })
                        }).catch(err => console.error("Failed to send:", err));
                    });
                    
                    captured = true;
                }
            },
            {urls: ["*://mangafire.to/*"]},
            ["requestHeaders"]
        );
    `;

  fs.writeFileSync(
    path.join(extDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  fs.writeFileSync(path.join(extDir, "background.js"), backgroundJs);
  return extDir;
}

// --- 4. MAIN SCRIPT ---
async function main() {
  const extPath = createExtension();
  console.log("🧩 Created Native Extension at:", extPath);

  let resolveCapture;
  const capturePromise = new Promise((r) => (resolveCapture = r));

  const server = http
    .createServer((req, res) => {
      if (req.method === "POST" && req.url === "/captured") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
          res.end("OK");
          resolveCapture(JSON.parse(body));
        });
      }
    })
    .listen(PORT);

  console.log(`🚀 Launching Vanilla Puppeteer...`);

  const browser = await puppeteer.launch({
    headless: "new",
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-position=0,0",
      "--disable-infobars",
    ],
  });

  const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const trapPage = await browser.newPage();
  await trapPage.setUserAgent(USER_AGENT);

  const client = await trapPage.target().createCDPSession();
  await client.send("Debugger.setBlackboxPatterns", { patterns: [".*"] });

  console.log("🌐 Navigating to MangaFire (Trap Page)...");

  // We don't care if this times out or navigates away, we just need the extension to trigger
  // But we use 'domcontentloaded' to at least wait for the structure
  trapPage.goto(TARGET_URL, { waitUntil: "domcontentloaded" }).catch(() => {});

  // 2. Wait for the Extension to phone home (with timeout)
  console.log("⏳ Waiting for network capture (max 30s)...");

  let apiData;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), 30000),
  );

  try {
    apiData = await Promise.race([capturePromise, timeoutPromise]);
    console.log("✅ CAPTURE SUCCESS!", apiData.url);
  } catch (err) {
      if (err.message === "TIMEOUT") {
          console.error("❌ Capture timed out - likely stuck on Cloudflare or loading.");
          await trapPage.screenshot({ path: "debug_screenshot.png" });
          console.log("📸 Screenshot saved to debug_screenshot.png");
          
          const html = await trapPage.content();
          fs.writeFileSync("debug_page.html", html);
          console.log("📄 HTML source saved to debug_page.html");
      } else {
      console.error("❌ Capture failed:", err);
    }
    await browser.close();
    server.close();
    fs.rmSync(extPath, { recursive: true, force: true });
    return;
  }

  // Close browser now that we have the URL and Cookies
  await browser.close();
  server.close();
  fs.rmSync(extPath, { recursive: true, force: true });

  console.log("⚡ Fetching chapter data via Axios (Node.js)...");

  let chapterData;
  try {
    const response = await axios.get(apiData.url, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: apiData.cookie,
        Referer: TARGET_URL,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    chapterData = response.data;
  } catch (err) {
    console.error("❌ Axios Fetch Failed:", err.message);
    return;
  }

  // --- DOWNLOADER LOGIC ---
  if (!chapterData || !chapterData.result || !chapterData.result.images) {
    console.error("❌ INVALID JSON STRUCTURE or FETCH FAILED.");
    if (chapterData)
      console.error("Received:", JSON.stringify(chapterData, null, 2));
    return;
  }

  const images = chapterData.result.images;
  const outputDir = "extension_downloads";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  console.log(`✅ JSON Valid. Found ${images.length} images.`);
  console.log("⬇️ Downloading images...");

  for (let i = 0; i < images.length; i++) {
    const [url, _, offset] = images[i];
    const fileName = `${(i + 1).toString().padStart(3, "0")}.jpg`;
    const filePath = path.join(outputDir, fileName);

    process.stdout.write(`Processing ${i + 1}/${images.length}\r`);

    try {
      const imgRes = await axios.get(url, { responseType: "arraybuffer" });
      let buffer = imgRes.data;

      if (offset > 0) buffer = await descrambleImage(buffer, offset);
      fs.writeFileSync(filePath, buffer);
    } catch (imgErr) {
      console.error(`\nFailed to download image ${i + 1}: ${imgErr.message}`);
    }
  }
  console.log("\n✨ DOWNLOAD COMPLETE!");
}

main();
