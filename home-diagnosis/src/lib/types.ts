// Axis IDs
export type CoreAxisId = 'COST' | 'PERF' | 'DESIGN' | 'LIFE' | 'FLEX';
export type SupportAxisId = 'INVOLVE' | 'ASSURE';
export type AxisId = CoreAxisId | SupportAxisId;

export const CORE_AXES: CoreAxisId[] = ['COST', 'PERF', 'DESIGN', 'LIFE', 'FLEX'];
export const SUPPORT_AXES: SupportAxisId[] = ['INVOLVE', 'ASSURE'];
export const ALL_AXES: AxisId[] = [...CORE_AXES, ...SUPPORT_AXES];

// Diagnosis mode
export type DiagnosisMode = 'solo' | 'couple';

// Value question answer (1-5 Likert)
export type LikertValue = 1 | 2 | 3 | 4 | 5;

// Value answers: questionId -> value
export type ValueAnswers = Record<string, LikertValue>;

// Requirement answers
export interface RequirementAnswers {
  R01: number;   // adults
  R02: number;   // current kids
  R03: number;   // kids increase in 10y
  R04: string;   // remote work frequency
  R05: string;   // study/workspace
  R06: string;   // hobby storage
  R06a?: boolean; // hobby dedicated room
  R07: string;   // guest stay frequency
  R07a?: boolean; // guest room needed
  R08: string;   // storage preference
}

// Budget answers (all optional)
export interface BudgetAnswers {
  B01?: number;  // monthly payment
  B02?: number;  // down payment
  B03?: number;  // repayment years
  B04?: number;  // interest rate %
}

// Size type
export type SizeTypeId = 'S' | 'M' | 'L';

// Value type
export type ValueTypeId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9' | 'V10';

// Gap level
export type GapLevel = 'ok' | 'check' | 'risk';

// Builder type
export type BuilderTypeId = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8';

export interface BuilderType {
  id: BuilderTypeId;
  label: string;
  reason: string;
}

// Axis scores
export type AxisScores = Record<AxisId, number>;

// Gap info (couple mode)
export interface GapInfo {
  axisId: AxisId;
  gap: number;
  level: GapLevel;
  alignmentQuestions: string[];
}

// Tsubo range
export interface TsuboRange {
  low: number;
  high: number;
  mid: number;
}

// Budget estimate
export interface BudgetEstimate {
  loanMax: number;
  totalBudgetApprox: number;
  monthlyPayment: number;
  years: number;
  rate: number;
}

// Diagnosis result
export interface DiagnosisResult {
  mode: DiagnosisMode;
  valueType: {
    id: ValueTypeId;
    name: string;
    summary: string;
  };
  sizeType: {
    id: SizeTypeId;
    label: string;
  };
  typeDisplayName: string;
  axisScores: {
    solo?: AxisScores;
    personA?: AxisScores;
    personB?: AxisScores;
    avg: Record<CoreAxisId, number>;
    supportAvg: { INVOLVE: number; ASSURE: number };
  };
  top3CoreAxes: { axisId: CoreAxisId; score: number }[];
  gaps?: GapInfo[];
  tsubo: TsuboRange;
  layoutAdvice: string[];
  budgetAdvice: string[];
  pitfalls: string[];
  builderTypeRecommendations: BuilderType[];
  nextSteps: string[];
  disclaimer: string[];
  budgetEstimate?: BudgetEstimate;
}

// Data types from JSON
export interface DiagnosisData {
  version: string;
  appName: string;
  axes: { id: AxisId; label: string; group: 'core' | 'support' }[];
  likert: {
    type: string;
    options: { value: number; label: string; rawScore: number }[];
  };
  valueQuestions: {
    id: string;
    axis: AxisId;
    reverse: boolean;
    weight: number;
    text: string;
  }[];
  requirementQuestions: RequirementQuestion[];
  budgetQuestions: BudgetQuestion[];
  valueTypes: ValueTypeData[];
  sizeTypes: SizeTypeData[];
  axisAlignmentQuestions: Record<string, string[]>;
  commonNextSteps: string[];
  disclaimerText: string[];
}

export interface RequirementQuestion {
  id: string;
  text: string;
  type: 'select' | 'selectWithSub';
  options: { value: number | string; label: string }[];
  subQuestion?: {
    id: string;
    text: string;
    type: 'yesno';
    options: { value: boolean; label: string }[];
  };
}

export interface BudgetQuestion {
  id: string;
  text: string;
  type: 'number' | 'select';
  placeholder?: string;
  default?: number;
  options?: { value: number; label: string }[];
}

export interface ValueTypeData {
  id: string;
  name: string;
  summary: string;
  policyBullets: string[];
  layoutPatterns: string[];
  budgetRules: string[];
  pitfalls: string[];
  builderSelectionPoints: string[];
}

export interface SizeTypeData {
  id: string;
  label: string;
  layoutOverrides: string[];
  warnings: string[];
}
