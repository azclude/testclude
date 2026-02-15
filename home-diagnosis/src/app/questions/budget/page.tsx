'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStore, saveStore } from '@/lib/store';
import { diagnosisData } from '@/lib/diagnosisData';
import { diagnose } from '@/lib/diagnose';
import type { BudgetAnswers } from '@/lib/types';

const budgetQuestions = diagnosisData.budgetQuestions;

const HELP_TEXTS: Record<string, string> = {
  B01: '「借りられる額」ではなく「返せる額」で考えましょう。',
  B02: '任意です。住宅資金として用意できる自己資金を入力してください。',
  B03: '一般的には35年ですが、ご自身の年齢に合わせて設定してください。',
  B04: '固定/変動により異なります。迷ったら1.5%で試算できます。',
};

export default function BudgetPage() {
  const router = useRouter();
  const [store, setStoreState] = useState(() => loadStore());
  const [answers, setAnswers] = useState<BudgetAnswers>(
    store.budget ?? { B03: 35, B04: 1.5 }
  );

  const handleNumberChange = (id: string, value: string) => {
    const num = value === '' ? undefined : Number(value);
    setAnswers({ ...answers, [id]: num });
  };

  const handleSelectChange = (id: string, value: number) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    const updatedStore = { ...store, budget: answers };

    if (!updatedStore.requirements) {
      router.push('/questions/requirements');
      return;
    }

    const result = diagnose({
      mode: updatedStore.mode,
      valueAnswersA: updatedStore.valueAnswersA,
      valueAnswersB: updatedStore.valueAnswersB,
      requirements: updatedStore.requirements,
      budget: answers,
    });

    updatedStore.result = result;
    setStoreState(updatedStore);
    saveStore(updatedStore);
    router.push('/result');
  };

  const handleSkip = () => {
    const updatedStore = { ...store, budget: undefined };

    if (!updatedStore.requirements) {
      router.push('/questions/requirements');
      return;
    }

    const result = diagnose({
      mode: updatedStore.mode,
      valueAnswersA: updatedStore.valueAnswersA,
      valueAnswersB: updatedStore.valueAnswersB,
      requirements: updatedStore.requirements,
    });

    updatedStore.result = result;
    setStoreState(updatedStore);
    saveStore(updatedStore);
    router.push('/result');
  };

  const handlePrev = () => {
    router.push('/questions/requirements');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs font-medium tracking-widest text-[#e87f9a]">STEP 4</p>
        <h1 className="text-lg font-bold text-[#3e3a36]">予算（任意）</h1>
        <p className="text-xs text-[#78716c]">
          入力するとローン上限の目安を概算表示します。スキップも可能です。
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {budgetQuestions.map((q) => (
          <div key={q.id} className="card-soft p-5 space-y-3">
            <div>
              <p className="text-sm font-medium text-[#3e3a36]">{q.text}</p>
              {HELP_TEXTS[q.id] && (
                <p className="text-xs text-[#78716c] mt-1">{HELP_TEXTS[q.id]}</p>
              )}
            </div>
            {q.type === 'number' ? (
              <input
                type="number"
                placeholder={q.placeholder}
                value={answers[q.id as keyof BudgetAnswers] ?? ''}
                onChange={(e) => handleNumberChange(q.id, e.target.value)}
              />
            ) : q.type === 'select' && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const currentVal = answers[q.id as keyof BudgetAnswers];
                  const isSelected = currentVal === opt.value;
                  return (
                    <label
                      key={String(opt.value)}
                      className={`option-card ${isSelected ? 'option-card--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        onChange={() => handleSelectChange(q.id, opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-3">
        <button
          onClick={handleSubmit}
          className="btn-primary w-full py-3.5 text-sm"
        >
          診断結果を見る
        </button>
        <button
          onClick={handleSkip}
          className="btn-secondary w-full py-3 text-sm"
        >
          予算をスキップして結果を見る
        </button>
        <button
          onClick={handlePrev}
          className="w-full py-3 text-xs text-[#78716c] hover:bg-[#faf9f7] rounded-full transition-colors"
        >
          必要条件に戻る
        </button>
      </div>
    </div>
  );
}
