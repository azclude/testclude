import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative text-center pt-8 pb-6 overflow-hidden">
        <div className="absolute top-2 right-4 w-20 h-20 rounded-full border-2 border-dashed border-[#fecdd3] opacity-40" />
        <div className="absolute bottom-0 left-2 w-12 h-12 rounded-full border-2 border-dashed border-[#b8e0d8] opacity-30" />
        <p className="text-xs font-medium tracking-widest text-[#e87f9a] mb-3">
          HOUSE VALUE DIAGNOSIS
        </p>
        <h1 className="text-2xl font-bold text-[#3e3a36] leading-relaxed">
          あなたにぴったりの<br />
          <span className="text-[#e87f9a]">家づくり</span>を見つけよう
        </h1>
        <p className="text-sm text-[#78716c] mt-3 leading-relaxed">
          たった5分の診断で<br />
          理想のマイホーム像が見えてきます
        </p>
      </div>

      {/* Feature Cards */}
      <div className="card-soft p-5 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#fff1f2] flex items-center justify-center text-[#e87f9a] text-sm">&#10003;</span>
          この診断でわかること
        </h2>
        <div className="space-y-3">
          {[
            { num: "01", text: "あなたの家づくり価値観タイプ", sub: "30タイプから判定" },
            { num: "02", text: "推奨坪数とおすすめ間取りの型", sub: "" },
            { num: "03", text: "予算の目安と落とし穴", sub: "" },
            { num: "04", text: "向いている依頼先タイプ", sub: "メーカー名なし" },
            { num: "05", text: "夫婦のギャップ診断", sub: "夫婦モード" },
          ].map((item) => (
            <div key={item.num} className="flex items-start gap-3">
              <span className="text-xs font-bold text-[#e87f9a] bg-[#fff1f2] rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <div>
                <p className="text-sm text-[#3e3a36] font-medium">{item.text}</p>
                {item.sub && (
                  <p className="text-xs text-[#78716c]">{item.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Estimate */}
      <div className="card-soft p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f0fdfa] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7fc4b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#3e3a36]">所要時間：約5〜10分</p>
            <p className="text-xs text-[#78716c]">価値観26問 + 必要条件8問 + 予算4問</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center pt-2">
        <Link
          href="/start"
          className="btn-primary inline-block px-10 py-4 text-base"
        >
          無料で診断をはじめる
        </Link>
        <p className="text-xs text-[#78716c] mt-3">
          登録不要・結果はすぐに表示されます
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-[#faf9f7] border border-[#e8e4de] p-4 space-y-2">
        <h3 className="font-medium text-[#78716c] text-xs flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          ご注意
        </h3>
        <ul className="text-[11px] text-[#78716c] space-y-1 leading-relaxed">
          <li>本診断は一般的な目安であり、法的・建築的・金融的助言ではありません。</li>
          <li>ローン計算は概算で、金融機関の審査・条件により変動します。</li>
          <li>最終判断は専門家と確認してください。</li>
        </ul>
      </div>
    </div>
  );
}
