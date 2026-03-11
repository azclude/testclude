import { chromium, type Browser, type Page } from "playwright";
import type { Location, Review } from "./types.js";

const GOOGLE_MAPS_BASE = "https://www.google.com/maps";
const SEARCH_DELAY = 2000;
const SCROLL_DELAY = 1500;

/**
 * Google Maps から住宅メーカーの展示場・支店を検索し、口コミを抽出する
 */
export class GoogleMapsReviewScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=ja"],
    });
    const context = await this.browser.newContext({
      locale: "ja-JP",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    this.page = await context.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * 住宅メーカー名で展示場・支店を検索
   */
  async searchLocations(manufacturer: string): Promise<Location[]> {
    const page = this.ensurePage();
    const query = `${manufacturer} 展示場 OR 支店 OR モデルハウス`;
    const searchUrl = `${GOOGLE_MAPS_BASE}/search/${encodeURIComponent(query)}`;

    console.log(`[検索] "${query}" でGoogle Mapsを検索中...`);
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });
    await this.delay(SEARCH_DELAY);

    // Cookie同意ダイアログがあれば閉じる
    await this.dismissCookieConsent(page);

    // 検索結果リストをスクロールして全件読み込む
    await this.scrollSearchResults(page);

    const locations: Location[] = await page.evaluate(() => {
      const results: Location[] = [];
      // Google Maps の検索結果リスト内の各アイテム
      const items = document.querySelectorAll('div[role="feed"] > div > div > a');
      for (const item of items) {
        const href = item.getAttribute("href");
        if (!href || !href.includes("/maps/place/")) continue;

        const nameEl = item.querySelector(".fontHeadlineSmall");
        const name = nameEl?.textContent?.trim() ?? "";

        // 星評価
        const ratingEl = item.closest("div")?.querySelector('span[role="img"]');
        const ratingText = ratingEl?.getAttribute("aria-label") ?? "";
        const ratingMatch = ratingText.match(/([\d.]+)/);
        const overallRating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        // 口コミ数
        const reviewCountEl = item
          .closest("div")
          ?.querySelector('span[aria-label*="件"]');
        const reviewCountText = reviewCountEl?.getAttribute("aria-label") ?? "";
        const countMatch = reviewCountText.match(/([\d,]+)/);
        const reviewCount = countMatch
          ? parseInt(countMatch[1].replace(",", ""), 10)
          : 0;

        // 住所
        const addressEls = item.closest("div")?.querySelectorAll(".fontBodyMedium");
        let address = "";
        if (addressEls) {
          for (const el of addressEls) {
            const text = el.textContent?.trim() ?? "";
            if (text.match(/[都道府県市区町村]/)) {
              address = text;
              break;
            }
          }
        }

        if (name) {
          results.push({
            name,
            url: href,
            address,
            overallRating,
            reviewCount,
          });
        }
      }
      return results;
    });

    console.log(`[結果] ${locations.length} 件の展示場・支店を検出`);
    return locations;
  }

  /**
   * 特定の場所の口コミを抽出する
   */
  async extractReviews(
    location: Location,
    maxReviews: number = 100
  ): Promise<Review[]> {
    const page = this.ensurePage();
    console.log(`[口コミ取得] ${location.name} の口コミを取得中...`);

    await page.goto(location.url, { waitUntil: "networkidle", timeout: 30000 });
    await this.delay(SEARCH_DELAY);

    // 「口コミ」タブをクリック
    const reviewTab = await page.$('button[role="tab"]:has-text("口コミ")');
    if (reviewTab) {
      await reviewTab.click();
      await this.delay(SEARCH_DELAY);
    } else {
      // 口コミボタンが別の形式の場合
      const altReviewBtn = await page.$(
        'button:has-text("口コミをすべて表示"), button:has-text("Google のクチコミ")'
      );
      if (altReviewBtn) {
        await altReviewBtn.click();
        await this.delay(SEARCH_DELAY);
      }
    }

    // 口コミリストをスクロールして読み込む
    await this.scrollReviewList(page, maxReviews);

    // 「もっと見る」を全部展開
    await this.expandAllReviews(page);

    const reviews: Review[] = await page.evaluate(
      ({ loc }) => {
        const reviewElements = document.querySelectorAll(
          'div[data-review-id], div[class*="review"]'
        );
        const extractedReviews: Review[] = [];

        for (const el of reviewElements) {
          // 投稿者名
          const authorEl = el.querySelector(
            'div[class*="d4r55"] span, button[data-review-id] div'
          );
          const author = authorEl?.textContent?.trim() ?? "匿名";

          // 星評価
          const starsEl = el.querySelector('span[role="img"][aria-label*="星"]');
          const starsLabel = starsEl?.getAttribute("aria-label") ?? "";
          const starsMatch = starsLabel.match(/([\d.]+)/);
          const rating = starsMatch ? parseFloat(starsMatch[1]) : 0;

          // 口コミ本文
          const textEl = el.querySelector(
            'span[class*="wiI7pd"], div[class*="MyEned"] span'
          );
          const text = textEl?.textContent?.trim() ?? "";

          // 日付
          const dateEl = el.querySelector('span[class*="rsqaWe"]');
          const date = dateEl?.textContent?.trim() ?? "";

          // 口コミの共有リンク（data-review-id から構築）
          const reviewId =
            el.getAttribute("data-review-id") ??
            el.querySelector("[data-review-id]")?.getAttribute("data-review-id") ??
            "";

          if (text && rating > 0) {
            extractedReviews.push({
              author,
              rating,
              text,
              date,
              shareLink: "", // 後でIDベースで構築
              locationName: loc.name,
              locationUrl: loc.url,
              _reviewId: reviewId,
            } as Review & { _reviewId: string });
          }
        }
        return extractedReviews;
      },
      { loc: location }
    );

    // 共有リンクを構築
    // Google Maps の口コミ共有リンク形式を使って個別リンクを生成
    for (const review of reviews) {
      const r = review as Review & { _reviewId: string };
      if (r._reviewId) {
        // Google Maps の口コミ共有URL形式
        review.shareLink = await this.getReviewShareLink(page, r._reviewId);
      }
      if (!review.shareLink) {
        // フォールバック: 場所のURLに口コミソートパラメータを付与
        review.shareLink = location.url.includes("?")
          ? `${location.url}&reviews`
          : `${location.url}?reviews`;
      }
      // _reviewId を削除
      delete (review as Record<string, unknown>)["_reviewId"];
    }

    console.log(`[口コミ取得] ${location.name}: ${reviews.length} 件取得`);
    return reviews;
  }

  /**
   * 口コミの共有リンクを取得する（三点メニューから）
   */
  private async getReviewShareLink(
    page: Page,
    reviewId: string
  ): Promise<string> {
    try {
      // data-review-id を持つ要素を探す
      const reviewEl = await page.$(`[data-review-id="${reviewId}"]`);
      if (!reviewEl) return "";

      // 三点メニューボタンをクリック
      const menuBtn = await reviewEl.$('button[data-value="共有"], button[aria-label*="メニュー"], button[data-tooltip*="More"]');
      if (!menuBtn) {
        // alt: class based menu button
        const altMenuBtn = await reviewEl.$('button[class*="action"]');
        if (!altMenuBtn) return "";
        await altMenuBtn.click();
      } else {
        await menuBtn.click();
      }
      await this.delay(500);

      // 「共有」メニュー項目をクリック
      const shareItem = await page.$('div[role="menuitem"]:has-text("共有"), a:has-text("共有")');
      if (!shareItem) {
        // メニューを閉じる
        await page.keyboard.press("Escape");
        return "";
      }
      await shareItem.click();
      await this.delay(1000);

      // 共有ダイアログからリンクを取得
      const linkInput = await page.$('input[readonly][value*="goo.gl"], input[readonly][value*="maps"]');
      let shareLink = "";
      if (linkInput) {
        shareLink = (await linkInput.getAttribute("value")) ?? "";
      }

      // ダイアログを閉じる
      await page.keyboard.press("Escape");
      await this.delay(300);

      return shareLink;
    } catch {
      return "";
    }
  }

  /**
   * 検索結果リストをスクロール
   */
  private async scrollSearchResults(page: Page): Promise<void> {
    const feedSelector = 'div[role="feed"]';
    const feed = await page.$(feedSelector);
    if (!feed) return;

    for (let i = 0; i < 5; i++) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollTop = el.scrollHeight;
      }, feedSelector);
      await this.delay(SCROLL_DELAY);
    }
  }

  /**
   * 口コミリストをスクロールして全件読み込む
   */
  private async scrollReviewList(page: Page, maxReviews: number): Promise<void> {
    // 口コミのスクロールコンテナを探す
    const scrollContainerSelector =
      'div[class*="m6QErb"][class*="DxyBCb"], div[role="main"] div[tabindex="-1"]';

    let previousCount = 0;
    let sameCountStreak = 0;

    for (let i = 0; i < 30; i++) {
      await page.evaluate((sel) => {
        const container = document.querySelector(sel);
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, scrollContainerSelector);
      await this.delay(SCROLL_DELAY);

      const currentCount = await page.evaluate(() => {
        return document.querySelectorAll(
          'div[data-review-id], div[class*="review"]'
        ).length;
      });

      if (currentCount >= maxReviews) break;
      if (currentCount === previousCount) {
        sameCountStreak++;
        if (sameCountStreak >= 3) break; // これ以上読み込めない
      } else {
        sameCountStreak = 0;
      }
      previousCount = currentCount;
    }
  }

  /**
   * 「もっと見る」ボタンを全部クリックして口コミ全文を展開
   */
  private async expandAllReviews(page: Page): Promise<void> {
    const expandButtons = await page.$$(
      'button[aria-label="もっと見る"], button:has-text("もっと見る"), button[aria-expanded="false"][class*="expand"]'
    );
    for (const btn of expandButtons) {
      try {
        await btn.click();
        await this.delay(200);
      } catch {
        // クリックできなくても続行
      }
    }
    await this.delay(500);
  }

  /**
   * Cookie同意ダイアログを閉じる
   */
  private async dismissCookieConsent(page: Page): Promise<void> {
    try {
      const consentBtn = await page.$(
        'button:has-text("同意する"), button:has-text("すべて承認"), button[aria-label="すべて同意"]'
      );
      if (consentBtn) {
        await consentBtn.click();
        await this.delay(1000);
      }
    } catch {
      // 同意ダイアログがなくても続行
    }
  }

  private ensurePage(): Page {
    if (!this.page) throw new Error("ブラウザが初期化されていません。init()を先に呼んでください。");
    return this.page;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
