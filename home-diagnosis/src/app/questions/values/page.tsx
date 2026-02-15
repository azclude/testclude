'use client';

import { useState } from 'react';
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
      if (store.mode === 'couple' && !isPersonB) {
        setIsPersonB(true);
        setPage(0);
        window.scrollTo(0, 0);
      } else {
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
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium tracking-widest text-[#e87f9a]">STEP 2</p>
          {personLabel && (
            <span className="text-xs font-medium bg-[#fff1f2] text-[#e87f9a] px-2.5 py-0.5 rounded-full">
              {personLabel}
            </span>
          )}
        </div>
        <h1 className="text-lg font-bold text-[#3e3a36]">価値観の質問</h1>
        {store.mode === 'couple' && (
          <p className="text-xs text-[#78716c]">
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

      {/* Questions */}
      <div className="space-y-4">
        {currentQuestions.map((q, idx) => (
          <div key={q.id}>
            <div className="text-[11px] text-[#78716c] mb-1.5 font-medium">
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

      {/* Navigation */}
      <div className="flex justify-between gap-3 pt-3">
        <button
          onClick={handlePrev}
          disabled={page === 0 && !isPersonB}
          className="btn-secondary px-6 py-3 text-sm"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          disabled={!allPageAnswered}
          className="btn-primary px-6 py-3 text-sm"
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
