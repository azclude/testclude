'use client';

import { useRouter } from 'next/navigation';
import { saveStore } from '@/lib/store';
import type { DiagnosisMode } from '@/lib/types';

export default function StartPage() {
  const router = useRouter();

  const handleSelect = (mode: DiagnosisMode) => {
    saveStore({
      mode,
      valueAnswersA: {},
      valueAnswersB: undefined,
      requirements: undefined,
      budget: undefined,
      result: undefined,
    });
    router.push('/questions/values');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold">診断モードを選択</h1>
        <p className="text-gray-600">どちらのモードで診断しますか？</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleSelect('solo')}
          className="w-full bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-400"
        >
          <h2 className="text-xl font-semibold text-blue-600">単独モード</h2>
          <p className="text-gray-600 mt-2">
            1人で回答します。価値観26問＋必要条件8問＋予算4問（任意）
          </p>
        </button>

        <button
          onClick={() => handleSelect('couple')}
          className="w-full bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-pink-400"
        >
          <h2 className="text-xl font-semibold text-pink-600">夫婦モード</h2>
          <p className="text-gray-600 mt-2">
            2人で順番に回答します。Aさん→Bさんの順で同じ26問に答え、ギャップを診断します。
          </p>
          <p className="text-sm text-gray-500 mt-1">
            必要条件・予算は世帯で1回のみ
          </p>
        </button>
      </div>
    </div>
  );
}
