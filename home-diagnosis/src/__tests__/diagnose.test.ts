import { describe, it, expect } from 'vitest';
import {
  calculateAxisScores,
  determineValueType,
  calculateTsubo,
  classifySizeType,
  calculateGaps,
  recommendBuilderTypes,
  calculateBudgetEstimate,
  diagnose,
} from '../lib/diagnose';
import type {
  ValueAnswers,
  LikertValue,
  RequirementAnswers,
  CoreAxisId,
  AxisScores,
} from '../lib/types';
import { CORE_AXES, ALL_AXES } from '../lib/types';
import { diagnosisData } from '../lib/diagnosisData';

// Helper: create answers where all values are the same
function allSameAnswers(value: LikertValue): ValueAnswers {
  const answers: ValueAnswers = {};
  for (const q of diagnosisData.valueQuestions) {
    answers[q.id] = value;
  }
  return answers;
}

// Helper: create answers with specific axes high
function axisHighAnswers(highAxes: string[], highVal: LikertValue = 5, defaultVal: LikertValue = 3): ValueAnswers {
  const answers: ValueAnswers = {};
  for (const q of diagnosisData.valueQuestions) {
    if (highAxes.includes(q.axis)) {
      // For reverse questions, invert: if we want high score, answer 1 for reverse
      answers[q.id] = q.reverse ? (6 - highVal as LikertValue) : highVal;
    } else {
      answers[q.id] = defaultVal;
    }
  }
  return answers;
}

// Helper: create answers with specific axes at specific levels
function axisSpecificAnswers(
  axisValues: Partial<Record<string, LikertValue>>,
  defaultVal: LikertValue = 3
): ValueAnswers {
  const answers: ValueAnswers = {};
  for (const q of diagnosisData.valueQuestions) {
    const targetVal = axisValues[q.axis] ?? defaultVal;
    answers[q.id] = q.reverse ? (6 - targetVal as LikertValue) : targetVal;
  }
  return answers;
}

// Default requirement answers
const defaultRequirements: RequirementAnswers = {
  R01: 2,
  R02: 1,
  R03: 1,
  R04: 'sometimes',
  R05: 'no',
  R06: 'none',
  R07: 'rare',
  R08: 'std',
};

describe('calculateAxisScores', () => {
  it('returns 50 for all-neutral (3) answers', () => {
    const answers = allSameAnswers(3);
    const scores = calculateAxisScores(answers);
    for (const axis of ALL_AXES) {
      expect(scores[axis]).toBe(50);
    }
  });

  it('returns 100 for all-5 answers (considering reverse)', () => {
    const answers = axisHighAnswers(ALL_AXES.map(String), 5, 5);
    const scores = calculateAxisScores(answers);
    for (const axis of ALL_AXES) {
      expect(scores[axis]).toBe(100);
    }
  });

  it('returns 0 for all-1 answers (considering reverse)', () => {
    // For normal questions: value=1 -> raw=-2
    // For reverse questions: value=1 -> raw=-2, then *-1 = +2
    // So all-1 doesn't give 0. We need value=1 for normal, value=5 for reverse
    const answers: ValueAnswers = {};
    for (const q of diagnosisData.valueQuestions) {
      answers[q.id] = q.reverse ? 5 : 1;
    }
    const scores = calculateAxisScores(answers);
    for (const axis of ALL_AXES) {
      expect(scores[axis]).toBe(0);
    }
  });
});

describe('determineValueType', () => {
  // FIX1: All neutral -> top1 < 65 -> V10
  it('FIX1: all neutral answers -> V10 (balance)', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 50, PERF: 50, DESIGN: 50, LIFE: 50, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V10');
  });

  // FIX2: COST and LIFE high -> V6
  it('FIX2: COST and LIFE high -> V6 (practical cospa)', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 80, PERF: 50, DESIGN: 50, LIFE: 75, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V6');
  });

  // FIX3: PERF and DESIGN high -> V8
  it('FIX3: PERF and DESIGN high -> V8 (design x performance)', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 50, PERF: 80, DESIGN: 75, LIFE: 50, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V8');
  });

  // FIX4: PERF and COST high -> V7
  it('FIX4: PERF and COST high -> V7 (performance cospa)', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 75, PERF: 80, DESIGN: 50, LIFE: 50, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V7');
  });

  // Single axis: only COST high
  it('single axis COST high -> V1', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 80, PERF: 50, DESIGN: 50, LIFE: 50, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V1');
  });

  // Single axis: DESIGN high alone
  it('single axis DESIGN high -> V3', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 50, PERF: 50, DESIGN: 80, LIFE: 50, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V3');
  });

  // PERF and LIFE high -> V9
  it('PERF and LIFE high -> V9', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 50, PERF: 75, DESIGN: 50, LIFE: 70, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V9');
  });

  // Edge: top1=65 exactly, should use single axis
  it('top1=65 exactly -> single axis type', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 50, PERF: 50, DESIGN: 65, LIFE: 50, FLEX: 50,
    };
    expect(determineValueType(scores)).toBe('V3');
  });

  // Edge: top1=64 -> V10
  it('top1=64 -> V10', () => {
    const scores: Record<CoreAxisId, number> = {
      COST: 64, PERF: 60, DESIGN: 60, LIFE: 60, FLEX: 60,
    };
    expect(determineValueType(scores)).toBe('V10');
  });
});

describe('calculateTsubo', () => {
  it('returns correct range for couple with 1 child + 1 future', () => {
    const req: RequirementAnswers = {
      R01: 2, R02: 1, R03: 1, R04: 'sometimes', R05: 'no',
      R06: 'none', R07: 'rare', R08: 'std',
    };
    // people = 2 + 1 + 1 = 4 -> base 34-40
    const tsubo = calculateTsubo(req);
    expect(tsubo.low).toBe(34);
    expect(tsubo.high).toBe(40);
    expect(tsubo.mid).toBe(37);
  });

  it('adds space for private study', () => {
    const req: RequirementAnswers = {
      R01: 2, R02: 0, R03: 0, R04: 'daily', R05: 'private',
      R06: 'none', R07: 'rare', R08: 'std',
    };
    // people = 2 -> base 26-32, +study(private) +2/+4
    const tsubo = calculateTsubo(req);
    expect(tsubo.low).toBe(28);
    expect(tsubo.high).toBe(36);
  });

  it('adds space for hobby room and max storage', () => {
    const req: RequirementAnswers = {
      R01: 2, R02: 2, R03: 0, R04: 'none', R05: 'no',
      R06: 'many', R06a: true, R07: 'rare', R08: 'max',
    };
    // people = 4 -> base 34-40, +hobby(many+room) +3/+6, +storage(max) +1/+2
    const tsubo = calculateTsubo(req);
    expect(tsubo.low).toBe(38);
    expect(tsubo.high).toBe(48);
  });

  it('adds space for weekly guest with guest room', () => {
    const req: RequirementAnswers = {
      R01: 2, R02: 0, R03: 0, R04: 'none', R05: 'no',
      R06: 'none', R07: 'weekly', R07a: true, R08: 'std',
    };
    // people = 2 -> base 26-32, +guest +2/+4
    const tsubo = calculateTsubo(req);
    expect(tsubo.low).toBe(28);
    expect(tsubo.high).toBe(36);
  });
});

describe('classifySizeType', () => {
  it('S for tsuboMid < 31', () => {
    expect(classifySizeType(29)).toBe('S');
    expect(classifySizeType(30)).toBe('S');
  });
  it('M for 31 <= tsuboMid < 39', () => {
    expect(classifySizeType(31)).toBe('M');
    expect(classifySizeType(37)).toBe('M');
    expect(classifySizeType(38)).toBe('M');
  });
  it('L for tsuboMid >= 39', () => {
    expect(classifySizeType(39)).toBe('L');
    expect(classifySizeType(45)).toBe('L');
  });
});

describe('calculateGaps (couple mode)', () => {
  // FIX5: A has high DESIGN, B has low -> gap >= 20
  it('FIX5: large DESIGN gap detected', () => {
    const answersA = axisHighAnswers(['DESIGN'], 5, 3);
    const answersB = axisHighAnswers(['DESIGN'], 1, 3);
    // Actually for B, DESIGN low: normal questions get 1, reverse gets 5
    const answersBFixed: ValueAnswers = {};
    for (const q of diagnosisData.valueQuestions) {
      if (q.axis === 'DESIGN') {
        answersBFixed[q.id] = q.reverse ? 1 : 1; // low score for DESIGN
      } else {
        answersBFixed[q.id] = 3;
      }
    }

    const scoresA = calculateAxisScores(answersA);
    const scoresB = calculateAxisScores(answersBFixed);

    expect(scoresA.DESIGN).toBe(100);
    // B: all DESIGN normal=1 -> raw=-2, reverse=1 -> raw=-2, reversed -> +2
    // Actually for B: normal questions -> value=1 -> raw=-2, reverse question -> value=1 -> raw=-2 -> reversed = +2
    // DESIGN has 4 questions: V09(normal), V10(normal), V11(normal), V12(reverse)
    // B: V09=1->raw=-2, V10=1->raw=-2, V11=1->raw=-2, V12=1->raw=-2->reversed=+2
    // sum = -2 + -2 + -2 + 2 = -4, n=4, axisScore = ((-4+8)/16)*100 = 25

    const gaps = calculateGaps(scoresA, scoresB);
    const designGap = gaps.find(g => g.axisId === 'DESIGN');
    expect(designGap).toBeDefined();
    expect(designGap!.gap).toBeGreaterThanOrEqual(20);
    expect(designGap!.level).toBe('risk');
    expect(designGap!.alignmentQuestions.length).toBeGreaterThan(0);
  });

  it('no gap when both answer the same', () => {
    const answers = allSameAnswers(3);
    const scoresA = calculateAxisScores(answers);
    const scoresB = calculateAxisScores(answers);
    const gaps = calculateGaps(scoresA, scoresB);
    expect(gaps.length).toBe(0);
  });
});

describe('recommendBuilderTypes', () => {
  it('recommends B1/B2 for high COST', () => {
    const core: Record<CoreAxisId, number> = {
      COST: 80, PERF: 50, DESIGN: 50, LIFE: 50, FLEX: 50,
    };
    const support = { INVOLVE: 50, ASSURE: 50 };
    const recs = recommendBuilderTypes(core, support);
    const ids = recs.map(r => r.id);
    expect(ids).toContain('B1');
  });

  it('recommends B5 for high PERF', () => {
    const core: Record<CoreAxisId, number> = {
      COST: 50, PERF: 80, DESIGN: 50, LIFE: 50, FLEX: 50,
    };
    const support = { INVOLVE: 50, ASSURE: 50 };
    const recs = recommendBuilderTypes(core, support);
    const ids = recs.map(r => r.id);
    expect(ids).toContain('B5');
  });

  it('recommends B8 for high ASSURE', () => {
    const core: Record<CoreAxisId, number> = {
      COST: 50, PERF: 50, DESIGN: 50, LIFE: 50, FLEX: 50,
    };
    const support = { INVOLVE: 50, ASSURE: 80 };
    const recs = recommendBuilderTypes(core, support);
    const ids = recs.map(r => r.id);
    expect(ids).toContain('B8');
  });
});

describe('calculateBudgetEstimate', () => {
  it('calculates loan max correctly', () => {
    const result = calculateBudgetEstimate({
      B01: 90000,
      B02: 5000000,
      B03: 35,
      B04: 1.5,
    });
    expect(result).toBeDefined();
    expect(result!.loanMax).toBeGreaterThan(0);
    expect(result!.totalBudgetApprox).toBe(result!.loanMax + 5000000);
    // Rough check: 90000/month, 35yr, 1.5% -> ~28M loan
    expect(result!.loanMax).toBeGreaterThan(25000000);
    expect(result!.loanMax).toBeLessThan(35000000);
  });

  it('returns undefined when B01 is not provided', () => {
    const result = calculateBudgetEstimate({});
    expect(result).toBeUndefined();
  });
});

describe('diagnose (integration)', () => {
  it('FIX1: solo, all-neutral -> V10 balance type', () => {
    const result = diagnose({
      mode: 'solo',
      valueAnswersA: allSameAnswers(3),
      requirements: defaultRequirements,
    });
    expect(result.valueType.id).toBe('V10');
    expect(result.mode).toBe('solo');
    expect(result.typeDisplayName).toContain('バランス堅実');
    expect(result.gaps).toBeUndefined();
  });

  it('FIX2: solo, COST+LIFE high -> V6', () => {
    const answers = axisSpecificAnswers({ COST: 5, LIFE: 5 }, 3);
    const result = diagnose({
      mode: 'solo',
      valueAnswersA: answers,
      requirements: defaultRequirements,
    });
    expect(result.valueType.id).toBe('V6');
  });

  it('FIX3: solo, PERF+DESIGN high -> V8', () => {
    const answers = axisSpecificAnswers({ PERF: 5, DESIGN: 5 }, 3);
    const result = diagnose({
      mode: 'solo',
      valueAnswersA: answers,
      requirements: defaultRequirements,
    });
    expect(result.valueType.id).toBe('V8');
  });

  it('FIX4: solo, PERF+COST high -> V7', () => {
    const answers = axisSpecificAnswers({ PERF: 5, COST: 5 }, 3);
    const result = diagnose({
      mode: 'solo',
      valueAnswersA: answers,
      requirements: defaultRequirements,
    });
    expect(result.valueType.id).toBe('V7');
  });

  it('FIX5: couple, DESIGN gap -> risk detected', () => {
    const answersA = axisSpecificAnswers({ DESIGN: 5 }, 3);
    const answersB = axisSpecificAnswers({ DESIGN: 1 }, 3);
    const result = diagnose({
      mode: 'couple',
      valueAnswersA: answersA,
      valueAnswersB: answersB,
      requirements: defaultRequirements,
    });
    expect(result.mode).toBe('couple');
    expect(result.gaps).toBeDefined();
    const designGap = result.gaps!.find(g => g.axisId === 'DESIGN');
    expect(designGap).toBeDefined();
    expect(designGap!.level).toBe('risk');
    expect(designGap!.alignmentQuestions.length).toBeGreaterThan(0);
  });

  it('includes all required result fields', () => {
    const result = diagnose({
      mode: 'solo',
      valueAnswersA: allSameAnswers(4),
      requirements: defaultRequirements,
      budget: { B01: 90000, B02: 3000000, B03: 35, B04: 1.5 },
    });
    expect(result.typeDisplayName).toBeTruthy();
    expect(result.top3CoreAxes.length).toBe(3);
    expect(result.tsubo.low).toBeLessThan(result.tsubo.high);
    expect(result.layoutAdvice.length).toBeGreaterThan(0);
    expect(result.budgetAdvice.length).toBeGreaterThan(0);
    expect(result.pitfalls.length).toBeGreaterThan(0);
    expect(result.builderTypeRecommendations.length).toBeGreaterThan(0);
    expect(result.nextSteps.length).toBeGreaterThan(0);
    expect(result.disclaimer.length).toBeGreaterThan(0);
    expect(result.budgetEstimate).toBeDefined();
  });
});
