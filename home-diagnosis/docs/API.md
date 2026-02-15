# API仕様

## 概要

MVPではAPIルートは設けず、クライアントサイドで診断ロジックを実行します。
データ保存はlocalStorageを使用し、サーバー送信は行いません。

## 内部関数API

### `diagnose(input: DiagnosisInput): DiagnosisResult`

メインの診断関数。全入力を受け取り、診断結果を返します。

#### Input

```typescript
interface DiagnosisInput {
  mode: 'solo' | 'couple';
  valueAnswersA: Record<string, 1|2|3|4|5>;  // V01-V26
  valueAnswersB?: Record<string, 1|2|3|4|5>; // 夫婦モードのみ
  requirements: RequirementAnswers;
  budget?: BudgetAnswers;
}
```

#### Output

```typescript
interface DiagnosisResult {
  mode: 'solo' | 'couple';
  valueType: { id: string; name: string; summary: string };
  sizeType: { id: string; label: string };
  typeDisplayName: string;
  axisScores: {
    solo?: Record<AxisId, number>;
    personA?: Record<AxisId, number>;
    personB?: Record<AxisId, number>;
    avg: Record<CoreAxisId, number>;
    supportAvg: { INVOLVE: number; ASSURE: number };
  };
  top3CoreAxes: { axisId: string; score: number }[];
  gaps?: GapInfo[];
  tsubo: { low: number; high: number; mid: number };
  layoutAdvice: string[];
  budgetAdvice: string[];
  pitfalls: string[];
  builderTypeRecommendations: BuilderType[];
  nextSteps: string[];
  disclaimer: string[];
  budgetEstimate?: BudgetEstimate;
}
```

### `calculateAxisScores(answers: ValueAnswers): AxisScores`

1人分の価値観回答から7軸スコア（0-100）を算出。

### `determineValueType(scoreAvg: Record<CoreAxisId, number>): ValueTypeId`

主要5軸の平均スコアから価値観タイプ（V1-V10）を判定。

### `calculateTsubo(req: RequirementAnswers): TsuboRange`

必要条件から推奨坪数レンジを算出。

### `calculateGaps(scoresA, scoresB): GapInfo[]`

夫婦の軸スコア差からギャップ情報を生成。

### `recommendBuilderTypes(coreAvg, supportAvg): BuilderType[]`

軸スコアから依頼先タイプを推薦（上位3つ）。

### `calculateBudgetEstimate(budget: BudgetAnswers): BudgetEstimate | undefined`

予算入力からローン上限を概算。
