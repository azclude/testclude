# テスト計画

## 単体テスト（Vitest）

テストファイル: `src/__tests__/diagnose.test.ts`

### テストフィクスチャ

#### FIX1: 全て中庸（全問3回答）
- 全軸スコア = 50
- top1Score < 65 のため V10（バランス堅実）
- 期待: `valueType.id === 'V10'`

#### FIX2: COST + LIFE が高い
- COST/LIFE軸の質問を5（逆転は1）、他は3
- 両軸 >= 70、top1 >= 70 && top2 >= 65
- {COST, LIFE} → V6（実用コスパ）
- 期待: `valueType.id === 'V6'`

#### FIX3: PERF + DESIGN が高い
- PERF/DESIGN軸の質問を5（逆転は1）、他は3
- {PERF, DESIGN} → V8（意匠×性能ハイスペ）
- 期待: `valueType.id === 'V8'`

#### FIX4: PERF + COST が高い
- PERF/COST軸の質問を5（逆転は1）、他は3
- {COST, PERF} → V7（性能コスパ）
- 期待: `valueType.id === 'V7'`

#### FIX5: 夫婦でDESIGN差大
- A: DESIGN全問5（逆転は1）、他は3 → DESIGN=100
- B: DESIGN全問1、他は3 → DESIGN=25
- gap = 75 >= 20 → level='risk'
- alignmentQuestionsにDESIGNの質問が含まれる

### その他のテストケース

- `calculateAxisScores`: 全3→50, 全5(考慮reverse)→100, 全低→0
- `classifySizeType`: S(<31), M(31-38), L(>=39)
- `calculateTsubo`: 各加算要素の正確性
- `calculateGaps`: 同一回答→gap=0, 差が大きい→risk検出
- `recommendBuilderTypes`: COST高→B1, PERF高→B5, ASSURE高→B8
- `calculateBudgetEstimate`: 概算ローン計算の正確性
- `diagnose` 統合テスト: 全必須フィールドが存在

### テスト実行

```bash
pnpm test        # 1回実行
pnpm test:watch  # ウォッチモード
```

## 手動テスト観点

### UI/入力テスト
- [ ] LP → モード選択 → 質問 → 結果の一連フローが動作する
- [ ] 単独モードで26問＋8問＋4問を回答して結果が出る
- [ ] 夫婦モードでA→B→8問＋4問を回答して結果が出る
- [ ] 予算スキップで結果が出る
- [ ] 戻るボタンで前のページに戻れる
- [ ] 未回答の質問がある場合「次へ」が押せない

### 結果表示テスト
- [ ] タイプ名が正しく表示される
- [ ] 軸スコアのバーが0-100で描画される
- [ ] 夫婦モードでA/Bのスコアとギャップが表示される
- [ ] gap>=20の軸が強調表示される
- [ ] 坪数レンジが表示される
- [ ] 予算入力時にローン概算が表示される
- [ ] 免責事項が表示される

### レスポンシブテスト
- [ ] スマホ幅（375px）で崩れない
- [ ] タブレット幅（768px）で崩れない
