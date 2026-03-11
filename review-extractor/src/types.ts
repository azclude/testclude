/** Google Maps 上の個別の口コミ */
export interface Review {
  /** 投稿者名 */
  author: string;
  /** 星評価 (1-5) */
  rating: number;
  /** 口コミ本文 */
  text: string;
  /** 投稿日（テキスト） */
  date: string;
  /** Google Maps上の口コミ共有リンク */
  shareLink: string;
  /** 展示場・支店名 */
  locationName: string;
  /** 展示場・支店のGoogle Maps URL */
  locationUrl: string;
}

/** Google Maps 上の展示場・支店の情報 */
export interface Location {
  /** 場所の名前 */
  name: string;
  /** Google Maps URL */
  url: string;
  /** 住所 */
  address: string;
  /** 総合星評価 */
  overallRating: number;
  /** 口コミ件数 */
  reviewCount: number;
}

/** 抽出結果 */
export interface ExtractionResult {
  /** 住宅メーカー名 */
  manufacturer: string;
  /** 抽出日時 */
  extractedAt: string;
  /** 検索した拠点数 */
  totalLocations: number;
  /** ポジティブ口コミ（★4-5）最大30件 */
  positiveReviews: Review[];
  /** ネガティブ口コミ（★1-2）最大30件 */
  negativeReviews: Review[];
}
