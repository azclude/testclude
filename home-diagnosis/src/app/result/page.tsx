'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStore, clearStore } from '@/lib/store';
import type { DiagnosisResult } from '@/lib/types';
import { CORE_AXES } from '@/lib/types';
import { diagnosisData } from '@/lib/diagnosisData';

const AXIS_LABELS: Record<string, string> = {};
for (const a of diagnosisData.axes) {
  AXIS_LABELS[a.id] = a.label;
}

function formatYen(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}億円`;
  if (n >= 10000) return `${Math.round(n / 10000)}万円`;
  return `${n.toLocaleString()}円`;
}

function ScoreBar({ label, score, color = 'primary' }: { label: string; score: number; color?: string }) {
  const barColor = color === 'primary'
    ? 'bg-gradient-to-r from-[#f5b8c8] to-[#e87f9a]'
    : color === 'accent'
      ? 'bg-gradient-to-r from-[#b8e0d8] to-[#7fc4b8]'
      : 'bg-[#e8e4de]';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-24 shrink-0 text-[#57534e]">{label}</span>
      <div className="flex-1 bg-[#ffe4e6] rounded-full h-3 relative overflow-hidden">
        <div
          className={`${barColor} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right text-[#3e3a36]">{score}</span>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    const store = loadStore();
    if (store.result) {
      setResult(store.result);
    } else {
      router.push('/');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="text-center py-16 text-[#78716c] text-sm">読み込み中...</div>
    );
  }

  const handleRestart = () => {
    clearStore();
    router.push('/');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#e87f9a] to-[#d4607e] text-white rounded-2xl p-6 text-center space-y-2 overflow-hidden">
        <div className="absolute top-3 right-6 w-16 h-16 rounded-full border-2 border-dashed border-white/20" />
        <div className="absolute bottom-2 left-4 w-10 h-10 rounded-full border-2 border-dashed border-white/15" />
        <p className="text-xs opacity-80 tracking-wider">YOUR HOUSE TYPE</p>
        <h1 className="text-xl font-bold">{result.typeDisplayName}</h1>
        <p className="text-xs opacity-90 leading-relaxed">{result.valueType.summary}</p>
      </div>

      {/* Axis Scores */}
      <section className="card-soft p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#3e3a36] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#fff1f2] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e87f9a" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </span>
          価値観スコア
        </h2>

        {result.mode === 'couple' && result.axisScores.personA && result.axisScores.personB ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#e87f9a] mb-2">Aさん</p>
              <div className="space-y-2">
                {CORE_AXES.map(axis => (
                  <ScoreBar key={`a-${axis}`} label={AXIS_LABELS[axis]} score={result.axisScores.personA![axis]} color="primary" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#7fc4b8] mb-2">Bさん</p>
              <div className="space-y-2">
                {CORE_AXES.map(axis => (
                  <ScoreBar key={`b-${axis}`} label={AXIS_LABELS[axis]} score={result.axisScores.personB![axis]} color="accent" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716c] mb-2">平均</p>
              <div className="space-y-2">
                {CORE_AXES.map(axis => (
                  <ScoreBar key={`avg-${axis}`} label={AXIS_LABELS[axis]} score={result.axisScores.avg[axis]} color="primary" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {CORE_AXES.map(axis => (
              <ScoreBar key={axis} label={AXIS_LABELS[axis]} score={result.axisScores.avg[axis]} />
            ))}
          </div>
        )}
      </section>

      {/* Top 3 Priorities */}
      <section className="card-soft p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#3e3a36] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#fff1f2] flex items-center justify-center text-[#e87f9a] text-xs font-bold">
            !
          </span>
          優先順位 TOP3
        </h2>
        <div className="space-y-2.5">
          {result.top3CoreAxes.map((item, i) => (
            <div key={item.axisId} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                i === 0 ? 'bg-[#e87f9a]' : i === 1 ? 'bg-[#f5b8c8]' : 'bg-[#b8e0d8]'
              }`}>
                {i + 1}
              </span>
              <span className="text-sm font-medium text-[#3e3a36]">{AXIS_LABELS[item.axisId]}</span>
              <span className="text-xs text-[#78716c]">({item.score}点)</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Gap */}
      {result.gaps && result.gaps.length > 0 && (
        <section className="card-soft p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#3e3a36] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#f0fdfa] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7fc4b8" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            夫婦ギャップ
          </h2>
          {result.gaps.map((gap) => (
            <div
              key={gap.axisId}
              className={`p-4 rounded-xl ${
                gap.level === 'risk'
                  ? 'bg-[#fff1f2] border border-[#fecdd3]'
                  : 'bg-[#faf9f7] border border-[#e8e4de]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  gap.level === 'risk' ? 'bg-[#e87f9a] text-white' : 'bg-[#e8e4de] text-[#57534e]'
                }`}>
                  {gap.level === 'risk' ? '要注意' : '要確認'}
                </span>
                <span className="text-sm font-medium text-[#3e3a36]">{AXIS_LABELS[gap.axisId]}</span>
                <span className="text-xs text-[#78716c]">(差: {gap.gap}点)</span>
              </div>
              {gap.alignmentQuestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-[#57534e]">すり合わせ質問:</p>
                  <ul className="text-xs text-[#78716c] space-y-1 ml-4">
                    {gap.alignmentQuestions.map((q, i) => (
                      <li key={i} className="list-disc">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Tsubo Range */}
      <section className="card-soft p-5 space-y-3 text-center">
        <h2 className="text-sm font-bold text-[#3e3a36]">推奨坪数レンジ</h2>
        <p className="text-2xl font-bold text-[#e87f9a]">
          {result.tsubo.low}〜{result.tsubo.high}<span className="text-base font-normal">坪</span>
        </p>
        <p className="text-xs text-[#78716c]">
          目安の中央値: {result.tsubo.mid}坪（{result.sizeType.label}）
        </p>
      </section>

      {/* Budget Estimate */}
      {result.budgetEstimate && (
        <section className="card-soft p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#3e3a36]">予算の目安（概算）</h2>
          <div className="space-y-2.5">
            {[
              { label: '月々返済額', value: formatYen(result.budgetEstimate.monthlyPayment) },
              { label: '返済年数', value: `${result.budgetEstimate.years}年` },
              { label: '想定金利', value: `${result.budgetEstimate.rate}%` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-[#78716c]">{row.label}</span>
                <span className="font-medium text-[#3e3a36]">{row.value}</span>
              </div>
            ))}
            <div className="border-t border-[#ffe4e6] pt-2.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#78716c]">借入可能額（概算）</span>
                <span className="font-bold text-[#e87f9a]">{formatYen(result.budgetEstimate.loanMax)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#78716c]">総予算目安</span>
                <span className="font-bold text-[#e87f9a]">{formatYen(result.budgetEstimate.totalBudgetApprox)}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#78716c]">
            ※概算です。実際の借入条件は金融機関にご確認ください。
          </p>
        </section>
      )}

      {/* Layout Advice */}
      <section className="card-soft p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#3e3a36]">おすすめ間取りの型</h2>
        <ul className="space-y-2">
          {result.layoutAdvice.map((advice, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-[#57534e]">
              <span className="text-[#e87f9a] mt-0.5 shrink-0">&#9679;</span>
              <span className="leading-relaxed">{advice}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Budget Rules */}
      <section className="card-soft p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#3e3a36]">予算決めのルール</h2>
        <ul className="space-y-2">
          {result.budgetAdvice.map((advice, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-[#57534e]">
              <span className="text-[#7fc4b8] mt-0.5 shrink-0">&#9679;</span>
              <span className="leading-relaxed">{advice}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pitfalls */}
      <section className="card-soft p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#3e3a36]">落とし穴</h2>
        <ul className="space-y-2">
          {result.pitfalls.map((pit, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-[#57534e]">
              <span className="text-[#e87f9a] mt-0.5 shrink-0">&#9888;</span>
              <span className="leading-relaxed">{pit}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Builder Type Recommendations */}
      <section className="card-soft p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#3e3a36]">向いている依頼先タイプ</h2>
        <p className="text-[11px] text-[#78716c]">メーカー名ではなく、特徴で分類しています</p>
        <div className="space-y-2.5">
          {result.builderTypeRecommendations.map((bt, i) => (
            <div key={bt.id} className="p-3.5 bg-[#faf9f7] rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#fff1f2] text-[#e87f9a] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {i + 1}位
                </span>
                <span className="font-medium text-xs text-[#3e3a36]">{bt.label}</span>
              </div>
              <p className="text-[11px] text-[#78716c] ml-9 leading-relaxed">{bt.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section className="card-soft p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#3e3a36]">次にやることチェックリスト</h2>
        <ul className="space-y-2.5">
          {result.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-[#57534e]">
              <input type="checkbox" className="mt-0.5" />
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <section className="rounded-xl bg-[#faf9f7] border border-[#e8e4de] p-4 space-y-2">
        <h3 className="font-medium text-[#78716c] text-xs">免責事項</h3>
        <ul className="text-[11px] text-[#78716c] space-y-1 leading-relaxed">
          {result.disclaimer.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      {/* Restart */}
      <div className="text-center pt-2">
        <button
          onClick={handleRestart}
          className="btn-secondary px-8 py-3 text-sm"
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}
