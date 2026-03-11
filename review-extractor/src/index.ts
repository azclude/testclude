import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleMapsReviewScraper } from "./scraper.js";
import { classifyReviews } from "./classifier.js";
import type { Review, ExtractionResult } from "./types.js";

const MAX_REVIEWS_PER_LOCATION = 100;

/**
 * ユーザーに住宅メーカー名を入力させる
 */
function askManufacturer(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("住宅メーカー名を入力してください: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * 結果をJSON + TSVファイルに出力する
 */
function saveResults(result: ExtractionResult, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const baseName = `${result.manufacturer}_${timestamp}`;

  // JSON出力
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\n[保存] JSON: ${jsonPath}`);

  // TSV出力（スプレッドシート貼り付け用）
  const tsvPath = path.join(outputDir, `${baseName}.tsv`);
  const tsvLines: string[] = [];
  tsvLines.push(
    [
      "分類",
      "星評価",
      "投稿者",
      "日付",
      "口コミ本文",
      "展示場・支店名",
      "口コミ共有リンク",
      "展示場リンク",
    ].join("\t")
  );

  for (const review of result.positiveReviews) {
    tsvLines.push(formatReviewTsv("ポジティブ", review));
  }
  for (const review of result.negativeReviews) {
    tsvLines.push(formatReviewTsv("ネガティブ", review));
  }

  fs.writeFileSync(tsvPath, tsvLines.join("\n"), "utf-8");
  console.log(`[保存] TSV: ${tsvPath}`);
}

function formatReviewTsv(category: string, review: Review): string {
  const escapedText = review.text.replace(/\t/g, " ").replace(/\n/g, " ");
  return [
    category,
    review.rating.toString(),
    review.author,
    review.date,
    escapedText,
    review.locationName,
    review.shareLink,
    review.locationUrl,
  ].join("\t");
}

/**
 * 結果をコンソールに表示する
 */
function printSummary(result: ExtractionResult): void {
  console.log("\n" + "=".repeat(60));
  console.log(`住宅メーカー: ${result.manufacturer}`);
  console.log(`抽出日時: ${result.extractedAt}`);
  console.log(`対象拠点数: ${result.totalLocations}`);
  console.log("=".repeat(60));

  console.log(`\n★ ポジティブ口コミ: ${result.positiveReviews.length} 件`);
  console.log("-".repeat(40));
  for (const [i, review] of result.positiveReviews.entries()) {
    console.log(
      `  ${i + 1}. [★${review.rating}] ${review.locationName} - ${review.author} (${review.date})`
    );
    console.log(`     ${review.text.slice(0, 80)}${review.text.length > 80 ? "..." : ""}`);
    console.log(`     リンク: ${review.shareLink}`);
  }

  console.log(`\n★ ネガティブ口コミ: ${result.negativeReviews.length} 件`);
  console.log("-".repeat(40));
  for (const [i, review] of result.negativeReviews.entries()) {
    console.log(
      `  ${i + 1}. [★${review.rating}] ${review.locationName} - ${review.author} (${review.date})`
    );
    console.log(`     ${review.text.slice(0, 80)}${review.text.length > 80 ? "..." : ""}`);
    console.log(`     リンク: ${review.shareLink}`);
  }
}

async function main(): Promise<void> {
  console.log("=== 住宅メーカー口コミ抽出ツール ===\n");

  // コマンドライン引数またはインタラクティブ入力
  let manufacturer = process.argv[2];
  if (!manufacturer) {
    manufacturer = await askManufacturer();
  }

  if (!manufacturer) {
    console.error("エラー: 住宅メーカー名が入力されていません。");
    process.exit(1);
  }

  console.log(`\n対象: ${manufacturer}\n`);

  const scraper = new GoogleMapsReviewScraper();

  try {
    await scraper.init();
    console.log("[ブラウザ] 起動完了\n");

    // 展示場・支店を検索
    const locations = await scraper.searchLocations(manufacturer);

    if (locations.length === 0) {
      console.log("展示場・支店が見つかりませんでした。");
      console.log("別の検索語句で試してください。");
      return;
    }

    // 口コミ数が多い順にソート
    locations.sort((a, b) => b.reviewCount - a.reviewCount);

    console.log("\n[検出された展示場・支店]");
    for (const loc of locations) {
      console.log(
        `  - ${loc.name} (★${loc.overallRating} / ${loc.reviewCount}件の口コミ)`
      );
    }

    // 各展示場の口コミを抽出
    const allReviews: Review[] = [];
    for (const location of locations) {
      if (location.reviewCount === 0) {
        console.log(`[スキップ] ${location.name}: 口コミなし`);
        continue;
      }

      try {
        const reviews = await scraper.extractReviews(
          location,
          MAX_REVIEWS_PER_LOCATION
        );
        allReviews.push(...reviews);
        console.log(`  累計: ${allReviews.length} 件`);

        // ポジティブ・ネガティブ共に30件以上集まったら早期終了
        const posCount = allReviews.filter((r) => r.rating >= 4).length;
        const negCount = allReviews.filter((r) => r.rating <= 2).length;
        if (posCount >= 30 && negCount >= 30) {
          console.log("[十分な口コミを取得しました]");
          break;
        }
      } catch (err) {
        console.error(
          `[エラー] ${location.name} の口コミ取得に失敗: ${err instanceof Error ? err.message : err}`
        );
      }
    }

    if (allReviews.length === 0) {
      console.log("\n口コミを取得できませんでした。");
      return;
    }

    // 分類
    const result = classifyReviews(allReviews, manufacturer);

    // 表示
    printSummary(result);

    // ファイル保存
    const outputDir = path.join(process.cwd(), "output");
    saveResults(result, outputDir);

    console.log("\n[完了] 口コミの抽出が完了しました。");
  } catch (err) {
    console.error(
      `\nエラーが発生しました: ${err instanceof Error ? err.message : err}`
    );
    process.exit(1);
  } finally {
    await scraper.close();
    console.log("[ブラウザ] 終了");
  }
}

main();
