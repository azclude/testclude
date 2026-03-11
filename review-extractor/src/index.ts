import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleMapsReviewScraper } from "./scraper.js";
import { classifyReviews } from "./classifier.js";
import type { Review, ExtractionResult } from "./types.js";

const MAX_REVIEWS_PER_LOCATION = 150;

function askInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function saveResults(result: ExtractionResult, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const base = `${result.manufacturer}_${ts}`;

  // JSON
  const jsonPath = path.join(outputDir, `${base}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\n[保存] JSON: ${jsonPath}`);

  // TSV（スプレッドシート用）
  const tsvPath = path.join(outputDir, `${base}.tsv`);
  const header = [
    "分類", "No.", "星評価", "投稿者", "日付",
    "口コミ本文", "展示場・支店名", "口コミ共有リンク", "展示場リンク",
  ].join("\t");

  const rows: string[] = [header];
  result.positiveReviews.forEach((r, i) => rows.push(toTsv("ポジティブ", i + 1, r)));
  result.negativeReviews.forEach((r, i) => rows.push(toTsv("ネガティブ", i + 1, r)));

  fs.writeFileSync(tsvPath, rows.join("\n"), "utf-8");
  console.log(`[保存] TSV: ${tsvPath}`);
}

function toTsv(label: string, no: number, r: Review): string {
  const text = r.text.replace(/[\t\n\r]/g, " ");
  return [label, no, r.rating, r.author, r.date, text, r.locationName, r.shareLink, r.locationUrl].join("\t");
}

function printSummary(result: ExtractionResult): void {
  console.log("\n" + "=".repeat(60));
  console.log(`住宅メーカー: ${result.manufacturer}`);
  console.log(`抽出日時: ${result.extractedAt}`);
  console.log(`対象拠点数: ${result.totalLocations}`);
  console.log("=".repeat(60));

  const show = (label: string, reviews: Review[]) => {
    console.log(`\n【${label}口コミ: ${reviews.length} 件】`);
    for (const [i, r] of reviews.entries()) {
      console.log(`  ${i + 1}. [★${r.rating}] ${r.locationName}`);
      console.log(`     ${r.author} (${r.date})`);
      console.log(`     ${r.text.slice(0, 100)}${r.text.length > 100 ? "..." : ""}`);
      console.log(`     共有リンク: ${r.shareLink || "(取得不可)"}`);
    }
  };

  show("ポジティブ", result.positiveReviews);
  show("ネガティブ", result.negativeReviews);
}

async function main(): Promise<void> {
  console.log("=== 住宅メーカー口コミ抽出ツール（Google Maps 専用）===\n");

  let manufacturer = process.argv[2];
  if (!manufacturer) {
    manufacturer = await askInput("住宅メーカー名を入力してください: ");
  }
  if (!manufacturer) {
    console.error("エラー: メーカー名が入力されていません。");
    process.exit(1);
  }

  console.log(`\n対象: ${manufacturer}\n`);

  const scraper = new GoogleMapsReviewScraper();
  try {
    await scraper.init();

    // 展示場・支店を検索
    const locations = await scraper.searchLocations(manufacturer);
    if (locations.length === 0) {
      console.log("展示場・支店が見つかりませんでした。");
      return;
    }

    // 口コミ数が多い順にソート
    locations.sort((a, b) => b.reviewCount - a.reviewCount);

    // 各拠点の口コミを取得
    const allReviews: Review[] = [];
    for (const loc of locations) {
      if (loc.reviewCount === 0) continue;

      try {
        const reviews = await scraper.extractReviews(loc, MAX_REVIEWS_PER_LOCATION);
        allReviews.push(...reviews);

        // 十分集まったか確認
        const pos = allReviews.filter((r) => r.rating >= 4).length;
        const neg = allReviews.filter((r) => r.rating <= 2).length;
        console.log(`  累計: ${allReviews.length} 件 (ポジ ${pos} / ネガ ${neg})`);
        if (pos >= 30 && neg >= 30) {
          console.log("\n[十分な口コミを取得しました]");
          break;
        }
      } catch (err) {
        console.error(`  [エラー] ${loc.name}: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (allReviews.length === 0) {
      console.log("\n口コミを取得できませんでした。");
      return;
    }

    // 分類 & 出力
    const result = classifyReviews(allReviews, manufacturer);
    printSummary(result);

    const outputDir = path.join(process.cwd(), "output");
    saveResults(result, outputDir);

    console.log("\n[完了]");
  } finally {
    await scraper.close();
  }
}

main().catch((err) => {
  console.error(`致命的エラー: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
