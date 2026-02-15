import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-900">
          家づくり価値観診断
        </h1>
        <p className="text-lg text-gray-600">
          注文住宅を検討中のあなたへ
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold">この診断でわかること</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">1.</span>
            <span>あなたの家づくり価値観タイプ（30タイプから判定）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">2.</span>
            <span>推奨坪数レンジとおすすめ間取りの型</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">3.</span>
            <span>予算決めのルールと落とし穴</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">4.</span>
            <span>向いている依頼先タイプ（メーカー名なし）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">5.</span>
            <span>夫婦のギャップ診断とすり合わせ質問（夫婦モード）</span>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        <h2 className="text-xl font-semibold">所要時間</h2>
        <p className="text-gray-700">約5〜10分（価値観26問＋必要条件8問＋予算4問）</p>
        <p className="text-sm text-gray-500">夫婦モードは価値観の質問を2人分回答します</p>
      </div>

      <div className="text-center">
        <Link
          href="/start"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          診断を始める
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-amber-800 text-sm">ご注意（免責事項）</h3>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>本診断は一般的な目安であり、法的/建築的/金融的助言ではありません。</li>
          <li>ローン計算は概算で、金融機関の審査・条件により変動します。</li>
          <li>最終判断は専門家（住宅会社、建築士、金融機関、FP等）と確認してください。</li>
        </ul>
      </div>
    </div>
  );
}
