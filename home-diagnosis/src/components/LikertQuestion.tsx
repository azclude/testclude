'use client';

import type { LikertValue } from '@/lib/types';

const LIKERT_OPTIONS: { value: LikertValue; label: string }[] = [
  { value: 5, label: 'とてもそう思う' },
  { value: 4, label: 'そう思う' },
  { value: 3, label: 'どちらとも言えない' },
  { value: 2, label: 'あまりそう思わない' },
  { value: 1, label: 'まったくそう思わない' },
];

interface LikertQuestionProps {
  questionId: string;
  questionText: string;
  helpText?: string;
  selectedValue?: LikertValue;
  onSelect: (questionId: string, value: LikertValue) => void;
}

export default function LikertQuestion({
  questionId,
  questionText,
  helpText,
  selectedValue,
  onSelect,
}: LikertQuestionProps) {
  return (
    <div className="card-soft p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-[#3e3a36] leading-relaxed">{questionText}</p>
        {helpText && (
          <p className="text-xs text-[#78716c] mt-1.5">{helpText}</p>
        )}
      </div>
      <div className="space-y-2">
        {LIKERT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`option-card ${
              selectedValue === opt.value ? 'option-card--selected' : ''
            }`}
          >
            <input
              type="radio"
              name={questionId}
              value={opt.value}
              checked={selectedValue === opt.value}
              onChange={() => onSelect(questionId, opt.value)}
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
