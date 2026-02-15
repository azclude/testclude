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

function ScoreBar({ label, score, color = 'blue' }: { label: string; score: number; color?: string }) {
  const colorClass = color === 'blue' ? 'bg-blue-500' : color === 'pink' ? 'bg-pink-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
        <div
          className={`${colorClass} h-4 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-mono w-10 text-right">{score}</span>
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
      <div className="text-center py-12 text-gray-500">読み込み中...</div>
    );
  }

  const handleRestart = () => {
    clearStore();
    router.push('/');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 text-center space-y-2">
        <p className="text-sm opacity-80">あなたの家づくりタイプは</p>
        <h1 className="text-2xl font-bold">{result.typeDisplayName}</h1>
        <p className="text-sm opacity-90">{result.valueType.summary}</p>
      </div>

      {/* Axis Scores */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold">価値観スコア</h2>

        {result.mode === 'couple' && result.axisScores.personA && result.axisScores.personB ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600">Aさん</h3>
            {CORE_AXES.map(axis => (
              <ScoreBar
                key={`a-${axis}`}
                label={AXIS_LABELS[axis]}
                score={result.axisScores.personA![axis]}
                color="blue"
              />
            ))}
            <h3 className="text-sm font-medium text-gray-600 pt-2">Bさん</h3>
            {CORE_AXES.map(axis => (
              <ScoreBar
                key={`b-${axis}`}
                label={AXIS_LABELS[axis]}
                score={result.axisScores.personB![axis]}
                color="pink"
              />
            ))}
            <h3 className="text-sm font-medium text-gray-600 pt-2">平均</h3>
            {CORE_AXES.map(axis => (
              <ScoreBar
                key={`avg-${axis}`}
                label={AXIS_LABELS[axis]}
                score={result.axisScores.avg[axis]}
                color="blue"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {CORE_AXES.map(axis => (
              <ScoreBar
                key={axis}
                label={AXIS_LABELS[axis]}
                score={result.axisScores.avg[axis]}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top 3 Priorities */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">優先順位 TOP3</h2>
        <div className="space-y-2">
          {result.top3CoreAxes.map((item, i) => (
            <div key={item.axisId} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
              }`}>
                {i + 1}
              </span>
              <span className="font-medium">{AXIS_LABELS[item.axisId]}</span>
              <span className="text-gray-500 text-sm">({item.score}点)</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Gap */}
      {result.gaps && result.gaps.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold">夫婦ギャップ</h2>
          {result.gaps.map((gap) => (
            <div
              key={gap.axisId}
              className={`p-4 rounded-lg ${
                gap.level === 'risk'
                  ? 'bg-red-50 border-2 border-red-300'
                  : 'bg-yellow-50 border border-yellow-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold ${
                  gap.level === 'risk' ? 'text-red-600' : 'text-yellow-700'
                }`}>
                  {gap.level === 'risk' ? '要注意' : '要確認'}
                </span>
                <span className="font-medium">{AXIS_LABELS[gap.axisId]}</span>
                <span className="text-sm text-gray-500">(差: {gap.gap}点)</span>
              </div>
              {gap.alignmentQuestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-gray-700">すり合わせ質問:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
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
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">推奨坪数レンジ</h2>
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">
            {result.tsubo.low}〜{result.tsubo.high}坪
          </p>
          <p className="text-sm text-gray-500 mt-1">
            目安の中央値: {result.tsubo.mid}坪（{result.sizeType.label}）
          </p>
        </div>
      </section>

      {/* Budget Estimate */}
      {result.budgetEstimate && (
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-semibold">予算の目安（概算）</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">月々返済額</span>
              <span className="font-medium">{formatYen(result.budgetEstimate.monthlyPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">返済年数</span>
              <span className="font-medium">{result.budgetEstimate.years}年</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">想定金利</span>
              <span className="font-medium">{result.budgetEstimate.rate}%</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600">借入可能額（概算）</span>
              <span className="font-bold text-blue-600">{formatYen(result.budgetEstimate.loanMax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">総予算目安</span>
              <span className="font-bold text-blue-600">{formatYen(result.budgetEstimate.totalBudgetApprox)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            ※概算です。実際の借入条件は金融機関にご確認ください。
          </p>
        </section>
      )}

      {/* Layout Advice */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">おすすめ間取りの型</h2>
        <ul className="space-y-2">
          {result.layoutAdvice.map((advice, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5 shrink-0">&#9679;</span>
              <span>{advice}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Budget Rules */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">予算決めのルール</h2>
        <ul className="space-y-2">
          {result.budgetAdvice.map((advice, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-0.5 shrink-0">&#9679;</span>
              <span>{advice}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pitfalls */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">落とし穴</h2>
        <ul className="space-y-2">
          {result.pitfalls.map((pit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-0.5 shrink-0">&#9888;</span>
              <span>{pit}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Builder Type Recommendations */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">向いている依頼先タイプ</h2>
        <p className="text-xs text-gray-500">メーカー名ではなく、特徴で分類しています</p>
        <div className="space-y-3">
          {result.builderTypeRecommendations.map((bt, i) => (
            <div key={bt.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                  {i + 1}位
                </span>
                <span className="font-medium text-sm">{bt.label}</span>
              </div>
              <p className="text-xs text-gray-600 ml-10">{bt.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold">次にやることチェックリスト</h2>
        <ul className="space-y-2">
          {result.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" className="mt-0.5 w-4 h-4 rounded" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-amber-800 text-sm">免責事項</h3>
        <ul className="text-xs text-amber-700 space-y-1">
          {result.disclaimer.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      {/* Restart */}
      <div className="text-center pt-4">
        <button
          onClick={handleRestart}
          className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}
