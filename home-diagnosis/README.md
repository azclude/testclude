# 家づくり価値観診断（MVP）

注文住宅を検討中の夫婦/家族向けの価値観診断Webアプリです。

## セットアップ

```bash
pnpm install
```

## 起動

```bash
pnpm dev
```

http://localhost:3000 でアクセスできます。

## テスト

```bash
pnpm test
```

## ビルド

```bash
pnpm build
pnpm start
```

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Vitest（単体テスト）
- pnpm（パッケージマネージャ）
- Zod（バリデーション）

## 仕様概要

### 診断フロー
1. LP（/）: サービス説明、開始ボタン
2. モード選択（/start）: 単独 or 夫婦
3. 価値観26問（/questions/values）: 5段階リッカート
4. 必要条件8問（/questions/requirements）: 家族構成、書斎、趣味等
5. 予算4問（/questions/budget）: 任意、スキップ可
6. 結果（/result）: 30タイプ判定、坪数、間取り、予算ルール、落とし穴、依頼先タイプ、ギャップ等

### 診断モデル
- 7軸スコアリング（COST/PERF/DESIGN/LIFE/FLEX + INVOLVE/ASSURE）
- 10価値観タイプ × 3規模タイプ = 30タイプ
- 夫婦モード: ギャップ検出（12/20点閾値）＋すり合わせ質問

### ディレクトリ構成
```
home-diagnosis/
├── data/diagnosis_v1.json     # 診断データ（質問・タイプ文言）
├── docs/                      # ドキュメント
│   ├── PRD.md
│   ├── SCORING_MODEL.md
│   ├── API.md
│   ├── TEST_PLAN.md
│   └── LEGAL_PRIVACY.md
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # UIコンポーネント
│   ├── lib/
│   │   ├── diagnose.ts        # 診断ロジック
│   │   ├── diagnosisData.ts   # データ読み込み
│   │   ├── store.ts           # localStorage管理
│   │   └── types.ts           # 型定義
│   └── __tests__/             # テスト
└── README.md
```

## 免責事項

本診断は一般的な目安であり、法的/建築的/金融的助言ではありません。
