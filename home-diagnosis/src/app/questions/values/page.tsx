'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LikertQuestion from '@/components/LikertQuestion';
import ProgressBar from '@/components/ProgressBar';
import { loadStore, saveStore } from '@/lib/store';
import { diagnosisData } from '@/lib/diagnosisData';
import { questionHelpTexts } from '@/lib/diagnosisData';
import type { LikertValue, ValueAnswers } from '@/lib/types';

const questions = diagnosisData.valueQuestions;
const QUESTIONS_PER_PAGE = 4;

export default function ValuesPage() {
  const router = useRouter();
  const [store, setStore] = useState(() => loadStore());
  const [isPersonB, setIsPersonB] = useState(false);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentQuestions = questions.slice(
    page * QUESTIONS_PER_PAGE,
    (page + 1) * QUESTIONS_PER_PAGE
  );

  const currentAnswers = isPersonB
    ? (store.valueAnswersB ?? {})
    : store.valueAnswersA;

  const answeredOnPage = currentQuestions.filter(
    (q) => currentAnswers[q.id] !== undefined
  ).length;

  const allPageAnswered = answeredOnPage === currentQuestions.length;

  const handleSelect = (questionId: string, value: LikertValue) => {
    const updatedAnswers = { ...currentAnswers, [questionId]: value };
    const updatedStore = { ...store };
    if (isPersonB) {
      updatedStore.valueAnswersB = updatedAnswers;
    } else {
      updatedStore.valueAnswersA = updatedAnswers;
    }
    setStore(updatedStore);
    saveStore(updatedStore);
  };

  const handleNext = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
      window.scrollTo(0, 0);
    } else {
      // Finished this person's questions
      if (store.mode === 'couple' && !isPersonB) {
        // Switch to person B
        setIsPersonB(true);
        setPage(0);
        window.scrollTo(0, 0);
      } else {
        // Move to requirements
        router.push('/questions/requirements');
      }
    }
  };

  const handlePrev = () => {
    if (page > 0) {
      setPage(page - 1);
      window.scrollTo(0, 0);
    } else if (isPersonB) {
      setIsPersonB(false);
      setPage(totalPages - 1);
      window.scrollTo(0, 0);
    }
  };

  const totalAnswered = Object.keys(currentAnswers).length;
  const personLabel = store.mode === 'couple'
    ? isPersonB ? 'Bさん' : 'Aさん'
    : '';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">
          価値観の質問
          {personLabel && <span className="text-blue-600 ml-2">（{personLabel}）</span>}
        </h1>
        {store.mode === 'couple' && (
          <p className="text-sm text-gray-500">
            {isPersonB
              ? 'Bさんが同じ26問に回答してください'
              : 'まずAさんが26問に回答してください'}
          </p>
        )}
        <ProgressBar
          current={totalAnswered}
          total={questions.length}
          label={`${personLabel}回答進捗`}
        />
      </div>

      <div className="space-y-4">
        {currentQuestions.map((q, idx) => (
          <div key={q.id}>
            <div className="text-xs text-gray-400 mb-1">
              Q{page * QUESTIONS_PER_PAGE + idx + 1} / {questions.length}
            </div>
            <LikertQuestion
              questionId={q.id}
              questionText={q.text}
              helpText={questionHelpTexts[q.id]}
              selectedValue={currentAnswers[q.id]}
              onSelect={handleSelect}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <button
          onClick={handlePrev}
          disabled={page === 0 && !isPersonB}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          disabled={!allPageAnswered}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {page < totalPages - 1
            ? '次へ'
            : store.mode === 'couple' && !isPersonB
              ? 'Bさんの回答へ'
              : '必要条件へ進む'}
        </button>
      </div>
    </div>
  );
}
