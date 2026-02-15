import type {
  AxisId,
  AxisScores,
  BuilderType,
  BuilderTypeId,
  BudgetAnswers,
  BudgetEstimate,
  CoreAxisId,
  DiagnosisMode,
  DiagnosisResult,
  GapInfo,
  GapLevel,
  LikertValue,
  RequirementAnswers,
  SizeTypeId,
  TsuboRange,
  ValueAnswers,
  ValueTypeId,
} from './types';
import { CORE_AXES, ALL_AXES } from './types';
import { diagnosisData } from './diagnosisData';

// --- Raw score conversion ---
function likertToRaw(value: LikertValue): number {
  const map: Record<number, number> = { 5: 2, 4: 1, 3: 0, 2: -1, 1: -2 };
  return map[value] ?? 0;
}

// --- Calculate axis scores for one person's answers ---
export function calculateAxisScores(answers: ValueAnswers): AxisScores {
  const questions = diagnosisData.valueQuestions;
  const axisSums: Record<string, number> = {};
  const axisCounts: Record<string, number> = {};

  for (const axis of ALL_AXES) {
    axisSums[axis] = 0;
    axisCounts[axis] = 0;
  }

  for (const q of questions) {
    const val = answers[q.id];
    if (val === undefined) continue;
    let raw = likertToRaw(val);
    if (q.reverse) {
      raw = -raw;
    }
    axisSums[q.axis] += raw;
    axisCounts[q.axis] += 1;
  }

  const scores: Partial<AxisScores> = {};
  for (const axis of ALL_AXES) {
    const n = axisCounts[axis];
    if (n === 0) {
      scores[axis] = 50; // default mid
    } else {
      const sum = axisSums[axis];
      // axisScore = ((sum + 2n) / (4n)) * 100
      scores[axis] = Math.round(((sum + 2 * n) / (4 * n)) * 100);
    }
  }
  return scores as AxisScores;
}

// --- Determine value type ---
export function determineValueType(scoreAvg: Record<CoreAxisId, number>): ValueTypeId {
  // Find top1 and top2
  const sorted = CORE_AXES.map(a => ({ axis: a, score: scoreAvg[a] }))
    .sort((a, b) => b.score - a.score);

  const top1 = sorted[0];
  const top2 = sorted[1];

  // Rule 1: if top1 < 65 -> V10
  if (top1.score < 65) return 'V10';

  // Rule 2: dual-axis combos
  if (top1.score >= 70 && top2.score >= 65) {
    const pair = new Set([top1.axis, top2.axis]);
    if (pair.has('COST') && pair.has('LIFE')) return 'V6';
    if (pair.has('COST') && pair.has('PERF')) return 'V7';
    if (pair.has('PERF') && pair.has('DESIGN')) return 'V8';
    if (pair.has('PERF') && pair.has('LIFE')) return 'V9';
    // else single axis
    return singleAxisType(top1.axis);
  }

  // Rule 3: single axis
  return singleAxisType(top1.axis);
}

function singleAxisType(axis: CoreAxisId): ValueTypeId {
  const map: Record<CoreAxisId, ValueTypeId> = {
    COST: 'V1',
    PERF: 'V2',
    DESIGN: 'V3',
    LIFE: 'V4',
    FLEX: 'V5',
  };
  return map[axis];
}

// --- Tsubo (floor area) calculation ---
export function calculateTsubo(req: RequirementAnswers): TsuboRange {
  const futureKids = req.R02 + req.R03;
  const people = req.R01 + futureKids;

  // Base range
  let low: number, high: number;
  if (people <= 2) { low = 26; high = 32; }
  else if (people === 3) { low = 30; high = 36; }
  else if (people === 4) { low = 34; high = 40; }
  else if (people === 5) { low = 38; high = 46; }
  else { low = 42; high = 52; }

  // Study/workspace
  if (req.R05 === 'private') {
    low += 2; high += 4;
  }

  // Hobby storage
  if (req.R06 === 'many') {
    if (req.R06a === true) {
      low += 3; high += 6;
    } else {
      low += 1; high += 2;
    }
  }

  // Guest stay
  if (req.R07 === 'weekly' && req.R07a === true) {
    low += 2; high += 4;
  }

  // Storage preference
  if (req.R08 === 'max') {
    low += 1; high += 2;
  }

  const mid = Math.round((low + high) / 2);
  return { low, high, mid };
}

// --- Size type classification ---
export function classifySizeType(tsuboMid: number): SizeTypeId {
  if (tsuboMid < 31) return 'S';
  if (tsuboMid < 39) return 'M';
  return 'L';
}

// --- Gap calculation (couple mode) ---
export function calculateGaps(scoresA: AxisScores, scoresB: AxisScores): GapInfo[] {
  const gaps: GapInfo[] = [];
  for (const axis of ALL_AXES) {
    const gap = Math.abs(scoresA[axis] - scoresB[axis]);
    let level: GapLevel;
    if (gap < 12) level = 'ok';
    else if (gap < 20) level = 'check';
    else level = 'risk';

    if (level !== 'ok') {
      const alignmentQuestions = diagnosisData.axisAlignmentQuestions[axis] ?? [];
      gaps.push({ axisId: axis, gap, level, alignmentQuestions });
    }
  }
  return gaps.sort((a, b) => b.gap - a.gap);
}

// --- Builder type recommendations ---
const BUILDER_TYPES: { id: BuilderTypeId; label: string }[] = [
  { id: 'B1', label: '規格・パッケージ（選択肢少なめ/コスパ）' },
  { id: 'B2', label: 'セミオーダー（標準＋一部カスタム）' },
  { id: 'B3', label: '自由設計・提案型（間取り/動線提案が得意）' },
  { id: 'B4', label: '設計事務所/デザイン工務店（意匠特化）' },
  { id: 'B5', label: '性能特化（断熱/気密/パッシブ等に強い）' },
  { id: 'B6', label: '地元工務店・柔軟対応（現場対応/融通）' },
  { id: 'B7', label: '体制・保証重視（仕組み/保証/手続きが整う）' },
  { id: 'B8', label: '透明性・第三者確認重視（内訳/履歴/検査）' },
];

const BUILDER_REASONS: Record<BuilderTypeId, Record<string, string>> = {
  B1: {
    COST_HIGH: '予算管理が明確で、標準パッケージでコスパが高い',
    INVOLVE_LOW: '選択肢が絞られているので、決めやすい',
  },
  B2: {
    COST_HIGH: '標準仕様ベースでコストを抑えつつカスタムも可能',
    INVOLVE_LOW: '標準をベースに一部だけ変更できる',
  },
  B3: {
    LIFE_HIGH: '生活動線を起点とした間取り提案が得意',
    FLEX_HIGH: '将来の変更を見据えた柔軟な設計が可能',
    INVOLVE_HIGH: '打合せを重ねて、納得いく間取りを一緒に作れる',
  },
  B4: {
    DESIGN_HIGH: '意匠・世界観を追求した設計が得意',
    INVOLVE_HIGH: '素材やディテールにこだわった提案が受けられる',
  },
  B5: {
    PERF_HIGH: '断熱・気密・換気の実務が標準化されている',
  },
  B6: {
    LIFE_HIGH: '生活シーンに合わせた柔軟な対応が可能',
    FLEX_HIGH: '将来の変更相談にも乗りやすい',
    INVOLVE_HIGH: '現場レベルで融通が利き、相談しやすい',
    ASSURE_LOW: '任せやすく、柔軟に対応してくれる',
  },
  B7: {
    FLEX_HIGH: '保証体制が整っており、長期の安心感がある',
    INVOLVE_LOW: '手続き・保証が仕組み化されていて安心',
    ASSURE_HIGH: '契約・保証・手続きの体制が整っている',
  },
  B8: {
    ASSURE_HIGH: '内訳開示・第三者検査など透明性の仕組みがある',
  },
};

export function recommendBuilderTypes(
  coreAvg: Record<CoreAxisId, number>,
  supportAvg: { INVOLVE: number; ASSURE: number }
): BuilderType[] {
  const scores: Record<BuilderTypeId, number> = {
    B1: 0, B2: 0, B3: 0, B4: 0, B5: 0, B6: 0, B7: 0, B8: 0,
  };
  const reasons: Record<BuilderTypeId, string[]> = {
    B1: [], B2: [], B3: [], B4: [], B5: [], B6: [], B7: [], B8: [],
  };

  const addScore = (bt: BuilderTypeId, pts: number, reasonKey: string) => {
    scores[bt] += pts;
    const r = BUILDER_REASONS[bt]?.[reasonKey];
    if (r && !reasons[bt].includes(r)) reasons[bt].push(r);
  };

  // COST high
  if (coreAvg.COST >= 70) {
    addScore('B1', 3, 'COST_HIGH');
    addScore('B2', 2, 'COST_HIGH');
  }
  // PERF high
  if (coreAvg.PERF >= 70) {
    addScore('B5', 3, 'PERF_HIGH');
  }
  // DESIGN high
  if (coreAvg.DESIGN >= 70) {
    addScore('B4', 3, 'DESIGN_HIGH');
  }
  // LIFE high
  if (coreAvg.LIFE >= 70) {
    addScore('B3', 2, 'LIFE_HIGH');
    addScore('B6', 1, 'LIFE_HIGH');
  }
  // FLEX high
  if (coreAvg.FLEX >= 70) {
    addScore('B3', 1, 'FLEX_HIGH');
    addScore('B6', 2, 'FLEX_HIGH');
    addScore('B7', 1, 'FLEX_HIGH');
  }
  // INVOLVE high
  if (supportAvg.INVOLVE >= 70) {
    addScore('B3', 2, 'INVOLVE_HIGH');
    addScore('B4', 2, 'INVOLVE_HIGH');
    addScore('B6', 2, 'INVOLVE_HIGH');
  }
  // INVOLVE low
  if (supportAvg.INVOLVE <= 40) {
    addScore('B1', 2, 'INVOLVE_LOW');
    addScore('B2', 2, 'INVOLVE_LOW');
    addScore('B7', 2, 'INVOLVE_LOW');
  }
  // ASSURE high
  if (supportAvg.ASSURE >= 70) {
    addScore('B8', 3, 'ASSURE_HIGH');
    addScore('B7', 2, 'ASSURE_HIGH');
  }
  // ASSURE low
  if (supportAvg.ASSURE <= 40) {
    addScore('B6', 1, 'ASSURE_LOW');
  }

  // Sort by score desc, take top 3
  const sorted = (Object.keys(scores) as BuilderTypeId[])
    .map(id => ({
      id,
      score: scores[id],
      label: BUILDER_TYPES.find(b => b.id === id)!.label,
      reasons: reasons[id],
    }))
    .filter(b => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return sorted.map(b => ({
    id: b.id,
    label: b.label,
    reason: b.reasons.join('／') || 'バランスの取れた選択肢',
  }));
}

// --- Budget estimate ---
export function calculateBudgetEstimate(budget: BudgetAnswers): BudgetEstimate | undefined {
  if (!budget.B01 || budget.B01 <= 0) return undefined;

  const payment = budget.B01;
  const downPayment = budget.B02 ?? 0;
  const years = budget.B03 ?? 35;
  const ratePercent = budget.B04 ?? 1.5;

  const r = (ratePercent / 100) / 12;
  const n = years * 12;

  let loanMax: number;
  if (r === 0) {
    loanMax = payment * n;
  } else {
    loanMax = payment * (1 - Math.pow(1 + r, -n)) / r;
  }

  loanMax = Math.round(loanMax);
  const totalBudgetApprox = loanMax + downPayment;

  return {
    loanMax,
    totalBudgetApprox,
    monthlyPayment: payment,
    years,
    rate: ratePercent,
  };
}

// --- Main diagnosis function ---
export interface DiagnosisInput {
  mode: DiagnosisMode;
  valueAnswersA: ValueAnswers;
  valueAnswersB?: ValueAnswers;
  requirements: RequirementAnswers;
  budget?: BudgetAnswers;
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const { mode, valueAnswersA, valueAnswersB, requirements, budget } = input;

  // 1. Calculate axis scores
  const scoresA = calculateAxisScores(valueAnswersA);
  const scoresB = valueAnswersB ? calculateAxisScores(valueAnswersB) : undefined;

  // 2. Average scores
  const coreAvg: Record<CoreAxisId, number> = {} as Record<CoreAxisId, number>;
  for (const axis of CORE_AXES) {
    if (scoresB) {
      coreAvg[axis] = Math.round((scoresA[axis] + scoresB[axis]) / 2);
    } else {
      coreAvg[axis] = scoresA[axis];
    }
  }

  const supportAvg = {
    INVOLVE: scoresB
      ? Math.round((scoresA.INVOLVE + scoresB.INVOLVE) / 2)
      : scoresA.INVOLVE,
    ASSURE: scoresB
      ? Math.round((scoresA.ASSURE + scoresB.ASSURE) / 2)
      : scoresA.ASSURE,
  };

  // 3. Value type
  const valueTypeId = determineValueType(coreAvg);
  const vtData = diagnosisData.valueTypes.find(v => v.id === valueTypeId)!;

  // 4. Tsubo & size
  const tsubo = calculateTsubo(requirements);
  const sizeTypeId = classifySizeType(tsubo.mid);
  const stData = diagnosisData.sizeTypes.find(s => s.id === sizeTypeId)!;

  // 5. Type display name
  const typeDisplayName = `${stData.label}・${vtData.name}`;

  // 6. Top 3 core axes
  const top3 = CORE_AXES
    .map(a => ({ axisId: a, score: coreAvg[a] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 7. Gaps (couple)
  const gaps = mode === 'couple' && scoresB
    ? calculateGaps(scoresA, scoresB)
    : undefined;

  // 8. Layout advice
  const layoutAdvice = [
    ...vtData.layoutPatterns,
    ...stData.layoutOverrides,
  ];

  // 9. Budget advice
  const budgetAdvice = [...vtData.budgetRules];

  // 10. Pitfalls
  const pitfalls = [
    ...vtData.pitfalls,
    ...stData.warnings,
  ];

  // 11. Builder recommendations
  const builderTypeRecommendations = recommendBuilderTypes(coreAvg, supportAvg);

  // 12. Next steps
  const nextSteps = [...diagnosisData.commonNextSteps];

  // 13. Disclaimer
  const disclaimer = [...diagnosisData.disclaimerText];

  // 14. Budget estimate
  const budgetEstimate = budget ? calculateBudgetEstimate(budget) : undefined;

  // 15. Axis scores output
  const axisScoresOut: DiagnosisResult['axisScores'] = {
    avg: coreAvg,
    supportAvg,
  };
  if (mode === 'solo') {
    axisScoresOut.solo = scoresA;
  } else {
    axisScoresOut.personA = scoresA;
    axisScoresOut.personB = scoresB;
  }

  return {
    mode,
    valueType: { id: valueTypeId, name: vtData.name, summary: vtData.summary },
    sizeType: { id: sizeTypeId, label: stData.label },
    typeDisplayName,
    axisScores: axisScoresOut,
    top3CoreAxes: top3,
    gaps: gaps && gaps.length > 0 ? gaps : undefined,
    tsubo,
    layoutAdvice,
    budgetAdvice,
    pitfalls,
    builderTypeRecommendations,
    nextSteps,
    disclaimer,
    budgetEstimate,
  };
}
