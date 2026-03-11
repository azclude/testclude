import type { Review, ExtractionResult } from "./types.js";

const TARGET_COUNT = 30;

/**
 * 口コミをポジティブ・ネガティブに分類する
 *
 * 分類基準:
 * - ポジティブ: 星4以上
 * - ネガティブ: 星2以下
 * - 星3は中立として扱い、テキスト内容で補助判定
 */
export function classifyReviews(
  allReviews: Review[],
  manufacturer: string
): ExtractionResult {
  // 重複排除（同じauthor + 同じtext）
  const unique = deduplicateReviews(allReviews);

  // 星評価ベースの分類
  const positive = unique.filter((r) => r.rating >= 4);
  const negative = unique.filter((r) => r.rating <= 2);
  const neutral = unique.filter((r) => r.rating === 3);

  // 星3の口コミをテキスト分析で補助分類
  const { additionalPositive, additionalNegative } =
    classifyNeutralByText(neutral);

  // ポジティブ: 星4-5 + テキスト分析でポジティブな星3
  let positiveReviews = [...positive, ...additionalPositive];
  // ネガティブ: 星1-2 + テキスト分析でネガティブな星3
  let negativeReviews = [...negative, ...additionalNegative];

  // 星評価の高い/低い順にソート
  positiveReviews.sort((a, b) => b.rating - a.rating);
  negativeReviews.sort((a, b) => a.rating - b.rating);

  // 各30件に制限
  positiveReviews = positiveReviews.slice(0, TARGET_COUNT);
  negativeReviews = negativeReviews.slice(0, TARGET_COUNT);

  return {
    manufacturer,
    extractedAt: new Date().toISOString(),
    totalLocations: new Set(unique.map((r) => r.locationName)).size,
    positiveReviews,
    negativeReviews,
  };
}

/**
 * 重複排除
 */
function deduplicateReviews(reviews: Review[]): Review[] {
  const seen = new Set<string>();
  return reviews.filter((r) => {
    const key = `${r.author}:${r.text.slice(0, 100)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 星3の口コミをテキスト内容でポジティブ/ネガティブに補助分類
 */
function classifyNeutralByText(neutral: Review[]): {
  additionalPositive: Review[];
  additionalNegative: Review[];
} {
  const positiveKeywords = [
    "良い",
    "よい",
    "満足",
    "おすすめ",
    "オススメ",
    "丁寧",
    "親切",
    "きれい",
    "キレイ",
    "素敵",
    "安心",
    "信頼",
    "感謝",
    "嬉しい",
    "快適",
    "しっかり",
    "最高",
    "素晴らしい",
    "気に入",
    "好印象",
    "頼りになる",
    "気持ちいい",
    "大満足",
  ];

  const negativeKeywords = [
    "悪い",
    "不満",
    "がっかり",
    "ガッカリ",
    "残念",
    "不親切",
    "遅い",
    "高い",
    "対応が悪",
    "雑",
    "適当",
    "改善",
    "問題",
    "トラブル",
    "クレーム",
    "ひどい",
    "酷い",
    "最悪",
    "後悔",
    "失敗",
    "騙",
    "不信",
    "やめた方",
    "おすすめしない",
    "二度と",
  ];

  const additionalPositive: Review[] = [];
  const additionalNegative: Review[] = [];

  for (const review of neutral) {
    const text = review.text;
    const posScore = positiveKeywords.filter((kw) => text.includes(kw)).length;
    const negScore = negativeKeywords.filter((kw) => text.includes(kw)).length;

    if (posScore > negScore) {
      additionalPositive.push(review);
    } else if (negScore > posScore) {
      additionalNegative.push(review);
    }
    // 同スコアの場合はどちらにも分類しない
  }

  return { additionalPositive, additionalNegative };
}
