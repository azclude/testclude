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
    <div className="space-y-6">
      <div className="text-center space-y-2 pt-4">
        <p className="text-xs font-medium tracking-widest text-[#e87f9a]">STEP 1</p>
        <h1 className="text-xl font-bold text-[#3e3a36]">診断モードを選んでください</h1>
        <p className="text-sm text-[#78716c]">あなたの状況にあったモードをお選びください</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleSelect('solo')}
          className="card-soft w-full p-5 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f5b8c8] to-[#e87f9a] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#3e3a36]">おひとりで診断</h2>
              <p className="text-xs text-[#78716c] mt-1.5 leading-relaxed">
                価値観26問 + 必要条件8問 + 予算4問（任意）
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSelect('couple')}
          className="card-soft w-full p-5 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b8e0d8] to-[#7fc4b8] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#3e3a36]">おふたりで診断</h2>
              <p className="text-xs text-[#78716c] mt-1.5 leading-relaxed">
                ご夫婦で順番に回答し、価値観のギャップを診断します
              </p>
              <p className="text-[11px] text-[#7fc4b8] mt-1 font-medium">
                必要条件・予算は世帯で1回のみ
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
