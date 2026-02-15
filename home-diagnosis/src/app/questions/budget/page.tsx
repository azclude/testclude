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
    // Save budget and run diagnosis
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">予算（任意）</h1>
        <p className="text-sm text-gray-500">
          入力するとローン上限の目安を概算表示します。スキップも可能です。
        </p>
      </div>

      <div className="space-y-4">
        {budgetQuestions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <div>
              <p className="text-base font-medium text-gray-900">{q.text}</p>
              {HELP_TEXTS[q.id] && (
                <p className="text-xs text-gray-500 mt-1">{HELP_TEXTS[q.id]}</p>
              )}
            </div>
            {q.type === 'number' ? (
              <input
                type="number"
                placeholder={q.placeholder}
                value={answers[q.id as keyof BudgetAnswers] ?? ''}
                onChange={(e) => handleNumberChange(q.id, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              />
            ) : q.type === 'select' && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const currentVal = answers[q.id as keyof BudgetAnswers];
                  const isSelected = currentVal === opt.value;
                  return (
                    <label
                      key={String(opt.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-400'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        onChange={() => handleSelectChange(q.id, opt.value)}
                        className="w-4 h-4 text-blue-600"
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

      <div className="flex flex-col gap-3 pt-4">
        <button
          onClick={handleSubmit}
          className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
        >
          診断結果を見る
        </button>
        <button
          onClick={handleSkip}
          className="w-full px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          予算をスキップして結果を見る
        </button>
        <button
          onClick={handlePrev}
          className="w-full px-6 py-3 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm"
        >
          必要条件に戻る
        </button>
      </div>
    </div>
  );
}
