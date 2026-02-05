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

    // Block any popup navigations
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    // Block navigations AFTER page has loaded
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const reqUrl = request.url();
      // Block main frame navigations that aren't to the current chapter
      if (
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame()
      ) {
        if (!reqUrl.includes("/read/")) {
          console.log("Blocked navigation to:", reqUrl);
          request.abort();
          return;
        }
      }
      request.continue();
    });

    // USE THE NEW SMART SCROLL FUNCTION HERE - returns collected URLs
    const collectedUrls = await smartScroll(page);
    console.log("Scroll complete.");

    // Use collected URLs from scroll, or try to get from page if still available
    let data = collectedUrls;
    if (data.length === 0) {
      try {
        data = await page.evaluate((selector) => {
          const container = document.getElementById("page-wrapper");
          if (!container) return [];
          const images = container.querySelectorAll("img");
          return Array.from(images)
            .map((img) => img.src || img.getAttribute("data-src"))
            .filter((url) => url && !url.includes("data:"));
        }, readerSelector);
      } catch (e) {
        console.log("Could not get images from page, using collected URLs");
      }
    }

    console.log(`Success! Found ${data.length} images.`);
    console.log("Image URLs:");
    data.forEach((url, i) => console.log(`${i + 1}. ${url}`));
  } catch (e) {
    console.error("Critical Error:", e);
  } finally {
    console.log("Closing browser...");
    //await browser.close();
  }
}

// --- THE CORRECTED SMART SCROLL FUNCTION ---
async function smartScroll(page) {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // Wait for initial images
  await delay(2000);

  // Check if there's a specific scrollable container
  const scrollTarget = await page.evaluate(() => {
    const pageWrapper = document.getElementById("page-wrapper");
    if (pageWrapper) {
      const style = window.getComputedStyle(pageWrapper);
      if (style.overflowY === "scroll" || style.overflowY === "auto") {
        return "page-wrapper";
      }
    }
    return "window";
  });

  console.log(`Scroll target: ${scrollTarget}`);

  let lastImageCount = 0;
  let noNewImagesAttempts = 0;
  const maxAttempts = 10;
  let collectedUrls = new Set();

  console.log(`Starting scroll loop...`);

  while (noNewImagesAttempts < maxAttempts) {
    try {
      // Scroll the correct target
      await page.evaluate((target) => {
        if (target === "page-wrapper") {
          const el = document.getElementById("page-wrapper");
          if (el) el.scrollBy(0, 500);
        } else {
          window.scrollBy(0, 500);
        }
      }, scrollTarget);

      await delay(500);

      // Collect image URLs as we scroll (save them before potential navigation break)
      const imageInfo = await page.evaluate(() => {
        const container = document.getElementById("page-wrapper");
        if (!container)
          return {
            total: 0,
            loaded: 0,
            scrollY: 0,
            scrollHeight: 0,
            containerScroll: 0,
            urls: [],
          };

        const images = container.querySelectorAll("img");
        let loaded = 0;
        const urls = [];
        images.forEach((img) => {
          const src = img.src || img.getAttribute("data-src");
          if (src && !src.includes("data:") && src !== "") {
            loaded++;
            urls.push(src);
          }
        });

        return {
          total: images.length,
          loaded,
          scrollY: window.scrollY,
          scrollHeight: document.body.scrollHeight,
          containerScroll: container.scrollTop,
          containerScrollHeight: container.scrollHeight,
          urls,
        };
      });

      // Save URLs progressively
      imageInfo.urls.forEach((url) => collectedUrls.add(url));

      console.log(
        `Window: ${imageInfo.scrollY}/${imageInfo.scrollHeight}, Container: ${imageInfo.containerScroll}/${imageInfo.containerScrollHeight}, Images: ${imageInfo.loaded}/${imageInfo.total}`,
      );

      if (imageInfo.loaded > lastImageCount) {
        lastImageCount = imageInfo.loaded;
        noNewImagesAttempts = 0;
      } else {
        noNewImagesAttempts++;
      }
    } catch (e) {
      // Navigation might have broken the context, return what we have
      console.log("Context lost, returning collected URLs");
      break;
    }
  }

  return Array.from(collectedUrls);
}

scrapeMangaChapter(
  "https://mangafire.to/read/dont-say-mysteryy.0nz3/en/chapter-1",
);
