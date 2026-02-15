'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/ProgressBar';
import { loadStore, saveStore } from '@/lib/store';
import { diagnosisData } from '@/lib/diagnosisData';
import type { RequirementAnswers } from '@/lib/types';

const questions = diagnosisData.requirementQuestions;

const HELP_TEXTS: Record<string, string> = {
  R01: '将来同居の可能性がある場合も含めてお考えください。',
  R02: '現在のお子さまの人数です。',
  R03: '10年以内の計画や可能性を含めてください。坪数算定に影響します。',
  R04: '在宅頻度が高いほど、書斎やワークスペースの重要度が上がります。',
  R05: '個室が必要な場合は坪数が増えます。',
  R06: '趣味道具が多いほど、収納や専用スペースの検討が必要です。',
  R07: '頻度が高く客間が必要な場合、坪数に影響します。',
  R08: '収納を多めにしたい場合、パントリーやWIC等のスペースが必要です。',
};

export default function RequirementsPage() {
  const router = useRouter();
  const [store, setStoreState] = useState(() => loadStore());
  const [answers, setAnswers] = useState<Partial<RequirementAnswers>>(
    store.requirements ?? {}
  );
  const [subAnswers, setSubAnswers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (store.requirements?.R06a !== undefined) init['R06a'] = store.requirements.R06a;
    if (store.requirements?.R07a !== undefined) init['R07a'] = store.requirements.R07a;
    return init;
  });

  const handleSelect = (id: string, value: number | string) => {
    const updated = { ...answers, [id]: value };
    setAnswers(updated);
  };

  const handleSubAnswer = (id: string, value: boolean) => {
    setSubAnswers({ ...subAnswers, [id]: value });
  };

  const isComplete = () => {
    for (const q of questions) {
      const val = answers[q.id as keyof RequirementAnswers];
      if (val === undefined) return false;
      if (q.type === 'selectWithSub' && q.subQuestion) {
        const parentVal = val as string;
        if (q.id === 'R06' && parentVal === 'many' && subAnswers['R06a'] === undefined) return false;
        if (q.id === 'R07' && parentVal === 'weekly' && subAnswers['R07a'] === undefined) return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    const req: RequirementAnswers = {
      R01: Number(answers.R01) || 2,
      R02: Number(answers.R02) || 0,
      R03: Number(answers.R03) || 0,
      R04: String(answers.R04 || 'none'),
      R05: String(answers.R05 || 'no'),
      R06: String(answers.R06 || 'none'),
      R06a: subAnswers['R06a'],
      R07: String(answers.R07 || 'rare'),
      R07a: subAnswers['R07a'],
      R08: String(answers.R08 || 'std'),
    };
    const updatedStore = { ...store, requirements: req };
    setStoreState(updatedStore);
    saveStore(updatedStore);
    router.push('/questions/budget');
  };

  const handlePrev = () => {
    router.push('/questions/values');
  };

  const answeredCount = questions.filter(
    q => answers[q.id as keyof RequirementAnswers] !== undefined
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs font-medium tracking-widest text-[#e87f9a]">STEP 3</p>
        <h1 className="text-lg font-bold text-[#3e3a36]">必要条件</h1>
        <p className="text-xs text-[#78716c]">ご家庭の状況を教えてください（世帯で1回）</p>
        <ProgressBar current={answeredCount} total={questions.length} label="回答進捗" />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="card-soft p-5 space-y-3">
            <div>
              <p className="text-sm font-medium text-[#3e3a36]">{q.text}</p>
              {HELP_TEXTS[q.id] && (
                <p className="text-xs text-[#78716c] mt-1">{HELP_TEXTS[q.id]}</p>
              )}
            </div>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const val = answers[q.id as keyof RequirementAnswers];
                const isSelected = val !== undefined && String(val) === String(opt.value);
                return (
                  <label
                    key={String(opt.value)}
                    className={`option-card ${isSelected ? 'option-card--selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={isSelected}
                      onChange={() => handleSelect(q.id, opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Sub question */}
            {q.type === 'selectWithSub' && q.subQuestion && (
              (() => {
                const parentVal = answers[q.id as keyof RequirementAnswers];
                const showSub =
                  (q.id === 'R06' && parentVal === 'many') ||
                  (q.id === 'R07' && (parentVal === 'weekly' || parentVal === 'monthly'));
                if (!showSub) return null;
                return (
                  <div className="ml-3 mt-3 p-4 bg-[#fff1f2] rounded-xl space-y-2">
                    <p className="text-sm font-medium text-[#3e3a36]">{q.subQuestion.text}</p>
                    <div className="space-y-2">
                      {q.subQuestion.options.map((subOpt) => {
                        const subVal = subAnswers[q.subQuestion!.id];
                        const isSubSelected = subVal === subOpt.value;
                        return (
                          <label
                            key={String(subOpt.value)}
                            className={`option-card ${isSubSelected ? 'option-card--selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={q.subQuestion!.id}
                              checked={isSubSelected}
                              onChange={() => handleSubAnswer(q.subQuestion!.id, subOpt.value as boolean)}
                            />
                            <span className="text-sm">{subOpt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3 pt-3">
        <button
          onClick={handlePrev}
          className="btn-secondary px-6 py-3 text-sm"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          disabled={!isComplete()}
          className="btn-primary px-6 py-3 text-sm"
        >
          予算へ進む
        </button>
      </div>
    </div>
  );
}
