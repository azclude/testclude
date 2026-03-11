import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { Location, Review } from "./types.js";

const DELAY_MS = 2000;
const SCROLL_PAUSE_MS = 1500;

/**
 * Google Maps から住宅メーカーの展示場・支店の口コミを抽出するスクレイパー
 */
export class GoogleMapsReviewScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  /**
   * ブラウザを起動する
   */
  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--lang=ja",
      ],
    });
    this.context = await this.browser.newContext({
      locale: "ja-JP",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
    });
    console.log("[ブラウザ] 起動完了");
  }

  /**
   * ブラウザを終了する
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
    console.log("[ブラウザ] 終了");
  }

  /**
   * Google Maps で住宅メーカーの展示場・支店を検索する
   */
  async searchLocations(manufacturer: string): Promise<Location[]> {
    const page = await this.newPage();
    const query = `${manufacturer} 展示場 モデルハウス`;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    console.log(`[検索] "${query}" で Google Maps を検索中...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await this.delay(DELAY_MS);

    // Cookie 同意があれば閉じる
    await this.dismissConsent(page);

    // 検索結果リストをスクロールして全件読み込む（最大10回）
    for (let i = 0; i < 10; i++) {
      const endOfList = await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (!feed) return true;
        feed.scrollTop = feed.scrollHeight;
        // "これ以上の結果はありません"テキストが出たら終了
        return !!document.querySelector('p.fontBodyMedium span:has-text("これ以上"), span.HlvSq');
      });
      await this.delay(SCROLL_PAUSE_MS);
      if (endOfList) break;
    }

    // 検索結果からロケーション一覧を抽出
    const locations: Location[] = await page.evaluate(() => {
      const results: Location[] = [];
      const anchors = document.querySelectorAll('a[href*="/maps/place/"]');
      const seen = new Set<string>();

      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href;
        if (seen.has(href)) continue;
        seen.add(href);

        // 名前
        const nameEl = a.querySelector(".fontHeadlineSmall");
        const name = nameEl?.textContent?.trim() ?? "";
        if (!name) continue;

        // 親要素から星評価と口コミ数を探す
        const container = a.closest("div");
        const ratingEl = container?.querySelector('span[role="img"]');
        const ratingLabel = ratingEl?.getAttribute("aria-label") ?? "";
        const ratingMatch = ratingLabel.match(/([\d.]+)/);
        const overallRating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        // 口コミ数 (例: "(123)")
        const allText = container?.textContent ?? "";
        const countMatch = allText.match(/\((\d[\d,]*)\)/);
        const reviewCount = countMatch
          ? parseInt(countMatch[1].replace(",", ""), 10)
          : 0;

        // 住所
        let address = "";
        const spans = container?.querySelectorAll("span") ?? [];
        for (const span of spans) {
          const t = span.textContent?.trim() ?? "";
          if (/[都道府県市区町村郡]/.test(t) && t.length > 5) {
            address = t;
            break;
          }
        }

        results.push({ name, url: href, address, overallRating, reviewCount });
      }
      return results;
    });

    console.log(`[結果] ${locations.length} 件の拠点を検出`);
    for (const loc of locations) {
      console.log(`  - ${loc.name} (★${loc.overallRating} / ${loc.reviewCount}件)`);
    }

    await page.close();
    return locations;
  }

  /**
   * 特定の拠点の口コミを取得する
   */
  async extractReviews(location: Location, maxReviews = 100): Promise<Review[]> {
    const page = await this.newPage();
    console.log(`\n[口コミ取得] ${location.name}`);

    await page.goto(location.url, { waitUntil: "networkidle", timeout: 30000 });
    await this.delay(DELAY_MS);

    // 「口コミ」タブをクリック
    const clicked = await this.clickReviewsTab(page);
    if (!clicked) {
      console.log(`  口コミタブが見つかりません。スキップします。`);
      await page.close();
      return [];
    }
    await this.delay(DELAY_MS);

    // 口コミリストを並び替え（新しい順）
    await this.sortReviewsByNewest(page);

    // 口コミリストをスクロールして読み込む
    await this.scrollReviewList(page, maxReviews);

    // 「もっと見る」を全部展開
    await this.expandAllReviewTexts(page);

    // 口コミ要素を解析
    const rawReviews = await page.evaluate((locInfo) => {
      const items = document.querySelectorAll('div[data-review-id][data-review-id!=""]');
      const reviews: Array<{
        author: string;
        rating: number;
        text: string;
        date: string;
        reviewId: string;
        locationName: string;
        locationUrl: string;
      }> = [];

      for (const el of items) {
        const reviewId = el.getAttribute("data-review-id") ?? "";

        // 投稿者名
        const authorBtn = el.querySelector('button[data-review-id]');
        const authorDiv = authorBtn?.querySelector("div");
        const author = authorDiv?.textContent?.trim() ?? "匿名";

        // 星評価
        const starEl = el.querySelector('span[role="img"]');
        const starLabel = starEl?.getAttribute("aria-label") ?? "";
        const starMatch = starLabel.match(/([\d.]+)/);
        const rating = starMatch ? parseInt(starMatch[1], 10) : 0;

        // 口コミ本文（展開済み）
        const textEl = el.querySelector('span.wiI7pd');
        const text = textEl?.textContent?.trim() ?? "";

        // 日付
        const dateEl = el.querySelector('span.rsqaWe');
        const date = dateEl?.textContent?.trim() ?? "";

        if (text && rating > 0) {
          reviews.push({
            author,
            rating,
            text,
            date,
            reviewId,
            locationName: locInfo.name,
            locationUrl: locInfo.url,
          });
        }
      }
      return reviews;
    }, { name: location.name, url: location.url });

    // 各口コミの共有リンクを取得
    const reviews: Review[] = [];
    for (const raw of rawReviews) {
      const shareLink = await this.getReviewShareLink(page, raw.reviewId);
      reviews.push({
        author: raw.author,
        rating: raw.rating,
        text: raw.text,
        date: raw.date,
        shareLink,
        locationName: raw.locationName,
        locationUrl: raw.locationUrl,
      });
    }

    console.log(`  ${reviews.length} 件の口コミを取得`);
    await page.close();
    return reviews;
  }

  /**
   * 口コミの共有リンクを取得する
   * Google Maps の各口コミの三点メニュー → 共有 からURLを取得
   */
  private async getReviewShareLink(page: Page, reviewId: string): Promise<string> {
    if (!reviewId) return "";

    try {
      const reviewEl = await page.$(`div[data-review-id="${reviewId}"]`);
      if (!reviewEl) return "";

      // 三点メニューボタン
      const menuBtn = await reviewEl.$('button[data-value="共有"], button[aria-label*="その他"], button[aria-label*="More actions"], button.e2moi');
      if (!menuBtn) return "";

      await menuBtn.click();
      await this.delay(800);

      // 「共有」メニュー項目をクリック
      const shareMenuItem = await page.$('div[role="menuitemradio"]:has-text("共有"), div[role="menuitem"]:has-text("共有"), a[data-index]:has-text("共有")');
      if (!shareMenuItem) {
        await page.keyboard.press("Escape");
        await this.delay(300);
        return "";
      }
      await shareMenuItem.click();
      await this.delay(1500);

      // 共有ダイアログからURLを取得
      const linkInput = await page.$('input[type="text"][readonly], input[value*="goo.gl"], input[value*="maps.app"]');
      let shareUrl = "";
      if (linkInput) {
        shareUrl = (await linkInput.getAttribute("value")) ?? "";
      }

      // ダイアログを閉じる
      const closeBtn = await page.$('button[aria-label="閉じる"], button[aria-label="Close"]');
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await this.delay(500);

      return shareUrl;
    } catch {
      // エラー時はリカバリ
      try {
        await page.keyboard.press("Escape");
      } catch {}
      return "";
    }
  }

  /**
   * 「口コミ」タブをクリック
   */
  private async clickReviewsTab(page: Page): Promise<boolean> {
    // タブ形式
    const tab = await page.$('button[role="tab"]:has-text("口コミ"), button[role="tab"]:has-text("クチコミ")');
    if (tab) {
      await tab.click();
      return true;
    }
    // ボタン形式
    const btn = await page.$('button:has-text("口コミをすべて表示"), button:has-text("クチコミをすべて表示"), button:has-text("Google のクチコミ")');
    if (btn) {
      await btn.click();
      return true;
    }
    return false;
  }

  /**
   * 口コミを新しい順にソート
   */
  private async sortReviewsByNewest(page: Page): Promise<void> {
    try {
      const sortBtn = await page.$('button[aria-label*="並べ替え"], button[data-value="sort"]');
      if (sortBtn) {
        await sortBtn.click();
        await this.delay(800);
        // 「新しい順」を選択
        const newestOpt = await page.$('div[role="menuitemradio"]:has-text("新しい順"), li[data-index]:has-text("新しい順")');
        if (newestOpt) {
          await newestOpt.click();
          await this.delay(DELAY_MS);
        } else {
          await page.keyboard.press("Escape");
        }
      }
    } catch {
      // ソートできなくても続行
    }
  }

  /**
   * 口コミリストをスクロールして全件読み込む
   */
  private async scrollReviewList(page: Page, maxReviews: number): Promise<void> {
    const scrollSelector = 'div.m6QErb.DxyBCb, div[role="main"] div[tabindex="-1"]';
    let prevCount = 0;
    let stableCount = 0;

    for (let i = 0; i < 50; i++) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollTop = el.scrollHeight;
      }, scrollSelector);
      await this.delay(SCROLL_PAUSE_MS);

      const count = await page.evaluate(() =>
        document.querySelectorAll('div[data-review-id][data-review-id!=""]').length
      );

      console.log(`  スクロール ${i + 1}: ${count} 件読み込み済み`);

      if (count >= maxReviews) break;
      if (count === prevCount) {
        stableCount++;
        if (stableCount >= 3) break;
      } else {
        stableCount = 0;
      }
      prevCount = count;
    }
  }

  /**
   * 口コミの「もっと見る」を全てクリックして全文展開
   */
  private async expandAllReviewTexts(page: Page): Promise<void> {
    const buttons = await page.$$('button.w8nwRe.kyuRq, button[aria-label="もっと見る"]');
    for (const btn of buttons) {
      try {
        await btn.click();
        await this.delay(100);
      } catch {}
    }
    await this.delay(500);
  }

  /**
   * Cookie同意ダイアログを閉じる
   */
  private async dismissConsent(page: Page): Promise<void> {
    try {
      const btn = await page.$(
        'button:has-text("同意する"), button:has-text("すべて承認"), form[action*="consent"] button'
      );
      if (btn) {
        await btn.click();
        await this.delay(1000);
      }
    } catch {}
  }

  private async newPage(): Promise<Page> {
    if (!this.context) throw new Error("ブラウザが初期化されていません。init() を先に呼んでください。");
    return this.context.newPage();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
