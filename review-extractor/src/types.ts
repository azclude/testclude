/** 個別の口コミ */
export interface Review {
  /** 投稿者名 */
  author: string;
  /** 星評価 (1-5) */
  rating: number;
  /** 口コミ本文 */
  text: string;
  /** 投稿日（テキスト） */
  date: string;
  /** 口コミの共有リンク（Google Maps上のURL） */
  shareLink: string;
  /** 展示場・支店名 */
  locationName: string;
  /** 展示場・支店のGoogle Maps URL */
  locationUrl: string;
}

/** 展示場・支店の情報 */
export interface Location {
  name: string;
  url: string;
  address: string;
  overallRating: number;
  reviewCount: number;
}

/** 抽出結果 */
export interface ExtractionResult {
  manufacturer: string;
  extractedAt: string;
  totalLocations: number;
  positiveReviews: Review[];
  negativeReviews: Review[];
}
