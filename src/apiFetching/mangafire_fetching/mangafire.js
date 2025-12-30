import * as cheerio from "cheerio";

const baseUrl = "https://mangafire.to";
async function amountOfPages() {
  try {
    const $ = await cheerio.fromURL(baseUrl + "/newest?page=1");
    const lastPage = $(".pagination > li").last();

    const lastPageText = lastPage.text().trim();
    const lastPageHref = lastPage.find("a").attr("href");

    const lastPageTextFromHref = new URL(
      lastPageHref,
      baseUrl,
    ).searchParams.get("page");

    if (/^\d+$/.test(lastPageText)) {
      console.log(lastPageText);
      return;
    }
    console.log(lastPageTextFromHref);
  } catch {}
}

async function gettingNamesAndUrlsFromPages(num) {
  try {
    const $ = await cheerio.fromURL(`https://mangafire.to/newest?page=${num}`);
    $(".unit").each((index, element) => {
      const card = $(element);
      const titleElement = card.find(".info > a");

      const title = titleElement.text().trim();
      const relativeLink = titleElement.attr("href");
      const fullLink = "https://mangafire.to" + relativeLink;

      console.log(title);
    });
  } catch (err) {
    console.log("error getting names and urls: ", err);
  }
}

//gettingNamesAndUrlsFromPages();

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function scrapeMangaChapter(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  // FIX: Capital 'P' in newPage
  const page = await browser.newPage();

  // FIX: CamelCase 'evaluateOnNewDocument'
  await page.evaluateOnNewDocument(() => {
    // FIX: Capital 'O' in Object
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // FIX: Capital 'F' in Function
    const originalFunction = Function.prototype.constructor;
    window.Function.prototype.constructor = function (...args) {
      const fnContent = args[args.length - 1];
      if (typeof fnContent === "string" && fnContent.includes("debugger")) {
        return function () {};
      }
      return originalFunction.apply(this, args);
    };

    window.console.log = () => {};
    window.console.debug = () => {};
    window.console.profile = () => {};
  });

  try {
    console.log("Navigating...");
    // FIX: CamelCase 'setViewport'
    await page.setViewport({ width: 1366, height: 768 });

    // FIX: CamelCase 'waitUntil'
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const readerSelector = "#page-wrapper img";
    console.log("Waiting for images to appear...");

    try {
      // FIX: CamelCase 'waitForSelector'
      await page.waitForSelector(readerSelector, { timeout: 20000 });
      console.log("Images detected!");
    } catch (e) {
      console.log("Warning: Selector timed out.");
    }

    console.log("Starting Smart Scroll...");
    // USE THE NEW SMART SCROLL FUNCTION HERE
    await smartScroll(page);
    console.log("Scroll complete.");

    const data = await page.evaluate((selector) => {
      // FIX: CamelCase 'getElementById'
      const container = document.getElementById("page-wrapper");
      if (!container) return [];

      // FIX: CamelCase 'querySelectorAll'
      const images = container.querySelectorAll("img");

      // FIX: Capital 'A' in Array
      return Array.from(images).map(
        // FIX: CamelCase 'getAttribute'
        (img) => img.src || img.getAttribute("data-src"),
      );
    }, readerSelector);

    console.log(`Success! Found ${data.length} images.`);
    // console.log(data); // Uncomment to print links
  } catch (e) {
    console.error("Critical Error:", e);
  } finally {
    console.log("Closing browser...");
    await browser.close();
  }
}

// --- THE CORRECTED SMART SCROLL FUNCTION ---
async function smartScroll(page) {
  await page.evaluate(async () => {
    // FIX: Capital 'P' in Promise
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;

      // FIX: CamelCase 'setInterval'
      const timer = setInterval(() => {
        // FIX: CamelCase 'scrollHeight'
        const scrollHeight = document.body.scrollHeight;

        // FIX: CamelCase 'scrollBy'
        window.scrollBy(0, distance);
        totalHeight += distance;

        // FIX: CamelCase 'innerHeight'
        if (totalHeight >= scrollHeight - window.innerHeight) {
          totalHeight = window.scrollY + window.innerHeight;

          // Check if page grows after waiting
          setTimeout(() => {
            const newScrollHeight = document.body.scrollHeight;
            if (newScrollHeight > scrollHeight) {
              return; // Keep scrolling
            } else {
              // FIX: CamelCase 'clearInterval'
              clearInterval(timer);
              resolve();
            }
          }, 2000);
        }
      }, 200);
    });
  });
}

scrapeMangaChapter(
  "https://mangafire.to/read/dont-say-mysteryy.0nz3/en/chapter-1",
);
