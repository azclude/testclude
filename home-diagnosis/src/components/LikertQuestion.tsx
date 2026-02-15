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
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div>
        <p className="text-base font-medium text-gray-900">{questionText}</p>
        {helpText && (
          <p className="text-xs text-gray-500 mt-1">{helpText}</p>
        )}
      </div>
      <div className="space-y-2">
        {LIKERT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedValue === opt.value
                ? 'bg-blue-50 border-2 border-blue-400'
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <input
              type="radio"
              name={questionId}
              value={opt.value}
              checked={selectedValue === opt.value}
              onChange={() => onSelect(questionId, opt.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
