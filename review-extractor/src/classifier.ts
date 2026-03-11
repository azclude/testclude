import type { Review, ExtractionResult } from "./types.js";

const TARGET_COUNT = 30;

/**
 * Google Maps の口コミをポジティブ・ネガティブに分類する
 *
 * - ポジティブ: ★4以上
 * - ネガティブ: ★2以下
 * - ★3: テキストのキーワード分析で振り分け
 */
export function classifyReviews(
  allReviews: Review[],
  manufacturer: string
): ExtractionResult {
  const unique = deduplicateReviews(allReviews);

  const positive = unique.filter((r) => r.rating >= 4);
  const negative = unique.filter((r) => r.rating <= 2);
  const neutral = unique.filter((r) => r.rating === 3);

  // ★3 をテキスト分析で補助分類
  const { extraPositive, extraNegative } = classifyNeutral(neutral);

  let positiveReviews = [...positive, ...extraPositive];
  let negativeReviews = [...negative, ...extraNegative];

  // ★の高い/低い順にソート
  positiveReviews.sort((a, b) => b.rating - a.rating);
  negativeReviews.sort((a, b) => a.rating - b.rating);

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

function deduplicateReviews(reviews: Review[]): Review[] {
  const seen = new Set<string>();
  return reviews.filter((r) => {
    const key = `${r.author}::${r.text.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function classifyNeutral(neutral: Review[]) {
  const posWords = [
    "良い", "よい", "満足", "おすすめ", "丁寧", "親切", "きれい",
    "素敵", "安心", "信頼", "嬉しい", "快適", "しっかり", "最高",
    "素晴らしい", "気に入", "大満足", "感謝",
  ];
  const negWords = [
    "悪い", "不満", "がっかり", "残念", "不親切", "遅い", "対応が悪",
    "雑", "改善", "問題", "トラブル", "ひどい", "最悪", "後悔",
    "失敗", "不信", "おすすめしない", "二度と",
  ];

  const extraPositive: Review[] = [];
  const extraNegative: Review[] = [];

  for (const r of neutral) {
    const pos = posWords.filter((w) => r.text.includes(w)).length;
    const neg = negWords.filter((w) => r.text.includes(w)).length;
    if (pos > neg) extraPositive.push(r);
    else if (neg > pos) extraNegative.push(r);
  }

  return { extraPositive, extraNegative };
}
