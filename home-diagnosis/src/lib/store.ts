import type {
  DiagnosisMode,
  ValueAnswers,
  RequirementAnswers,
  BudgetAnswers,
  DiagnosisResult,
} from './types';

const STORAGE_KEY = 'home-diagnosis-store';

export interface StoreData {
  mode: DiagnosisMode;
  valueAnswersA: ValueAnswers;
  valueAnswersB?: ValueAnswers;
  requirements?: RequirementAnswers;
  budget?: BudgetAnswers;
  result?: DiagnosisResult;
}

function defaultStore(): StoreData {
  return {
    mode: 'solo',
    valueAnswersA: {},
  };
}

export function loadStore(): StoreData {
  if (typeof window === 'undefined') return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    return JSON.parse(raw) as StoreData;
  } catch {
    return defaultStore();
  }
}

export function saveStore(data: StoreData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearStore(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
