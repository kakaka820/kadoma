// src/online/components/ui/RulesModal.tsx
import React, { useState } from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-purple-400 text-sm transition flex items-center gap-2"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className="mt-2 ml-6 p-3 bg-gray-900 rounded border-l-2 border-purple-500">
          {children}
        </div>
      )}
    </div>
  );
}

type RuleTab = 'basic' | 'card' | 'scoring' | 'judge' | 'others';

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState<RuleTab>('basic');

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as RuleTab, label: '基本ルール' },
    { id: 'card' as RuleTab, label: 'カードの出し方' },
    { id: 'judge' as RuleTab, label: '勝敗判定' },
    { id: 'scoring' as RuleTab, label: '得点計算' },
    { id: 'others' as RuleTab, label:'その他'},
    
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">ゲームルール</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-700 bg-gray-900">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition
                ${activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && <BasicRules />}
          {activeTab === 'card' && <CardRules />}
          {activeTab === 'judge' && <JudgeRules />}
          {activeTab === 'scoring' && <ScoringRules />}
          {activeTab === 'others' && <Others />}
        </div>

       
      </div>
    </div>
  );
}

// 基本ルール
function BasicRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">ゲームの進行について</h3>
      
      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">大まかな目的</h4>
        <p>勝つ。できるだけ負けない。負けるときは負けを最小限に抑える。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">プレイ人数</h4>
        <p>現段階では三人固定。将来的に4人、6人で遊べるゲームモードも作成します。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">ゲームの進行について</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>各プレイヤーに手札が配られます。</li>
          <li>全員、手札の中から1枚ずつ出すカードを決めます。</li>
          <li>全員が出すカードを決めたらショーダウン。そのターンの勝者と敗者が決まります。</li>
          <li>これを繰り返し、最終的な得点を争います。</li>
        </ol>
      </section>
      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">終了条件について</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>JOKERが規定枚数配られる</li>
          <li>いずれかのプレイヤーの持ち点が0以下となる</li>
        </ol>
        <p>規定のセット数JOKERが出る、って言った方がより正確かもしれん(要推敲)</p>
        </section>
    </div>
  );
}

// カードの出し方
function CardRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">カードの出し方</h3>
      
      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">基本</h4>
        <p>毎ターン手札から1枚選んでカードを出します。時間切れとなると手札から自動で選ばれます。一度出すと決めると決めなおしはできません。1デックはJOKERを2枚含んで54枚です。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">基本的なカードの強さ</h4>
        <p className="mb-2">基本的には数字が大きいほど強いです。</p>
        <div className="bg-gray-900 p-3 rounded">
          <p className="font-mono">A(1) &lt; 2 &lt; 3 &lt; ... &lt; 10 &lt; J(11) &lt; Q(12) &lt; K(13) &lt;&lt; JOKER</p>
        </div>
        <p className="mb-2">例外があるので詳細は「勝敗判定について」を参照してください。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">JOKERについて</h4>
        <p>JOKERは各セットの最初に出すことはできません(配られてすぐのターンにJOKERを使うことはできません)。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">相手のカードについて</h4>
        <p>相手の手札にあるカードのうち、JOKERを含む絵札をみることができます。また、自分の手札にある絵札も同様に対戦相手に見えています。</p>
      </section>
    </div>
  );
}



// 勝敗判定
function JudgeRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">勝敗判定について</h3>
      
      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">引き分けについて</h4>
        <p>場に出た三枚のカードのうち、同じ数字が2枚以上出ていればそのターンは「引き分け」となります。</p>
      </section>


      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">返し札について</h4>
        <p>基本的には、「最も強いカードを出した人間が勝ち」となります。ですが、特定の状況下で絵札に対して、弱いカードでも勝てるようになる「返し札」というルールがあります。Jに対しては1と5が、Qに対しては2と6が、Kに対してjは3と7が、JOKERに対しては4が「返し札」に相当します。但し、「返し札」が場に出たカードのうち、最弱のカードである事が条件です。</p>
        <CollapsibleSection title="例：返し札の成立条件">
        <ul className="list-none ml-6 mt-2 space-y-1 text-sm"></ul>
          <li className="text-sm">例：J, A, 7→Aを出した人が勝利。</li>
          <li className="text-sm">例：Q, 6, 10→6を出した人が勝利。</li>
          <li className="text-sm">例：K, 3, 7→3を出した人が勝利。</li>
          <li className="text-sm">例：K, 3, A→Kを出した人が勝利。</li>
          <li className="text-sm">例：JOKER, 9, 4→4を出した人が勝利。</li>
        </CollapsibleSection>
        <CollapsibleSection title='返し札対応表'>
<div className="overflow-x-auto mt-4">
  <table className="w-full border-collapse bg-gray-900 rounded">
    <thead>
      <tr className="border-b border-gray-700">
        <th className="px-4 py-2 text-left text-white font-bold">絵札</th>
        <th className="px-4 py-2 text-left text-white font-bold">返し札（小）</th>
        <th className="px-4 py-2 text-left text-white font-bold">返し札（大）</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-800">
        <td className="px-4 py-2 text-gray-300">J (11)</td>
        <td className="px-4 py-2 text-purple-400">A (1)</td>
        <td className="px-4 py-2 text-purple-400">5</td>
      </tr>
      <tr className="border-b border-gray-800">
        <td className="px-4 py-2 text-gray-300">Q (12)</td>
        <td className="px-4 py-2 text-purple-400">2</td>
        <td className="px-4 py-2 text-purple-400">6</td>
      </tr>
      <tr className="border-b border-gray-800">
        <td className="px-4 py-2 text-gray-300">K (13)</td>
        <td className="px-4 py-2 text-purple-400">3</td>
        <td className="px-4 py-2 text-purple-400">7</td>
      </tr>
      <tr>
        <td className="px-4 py-2 text-yellow-400 font-bold">JOKER</td>
        <td className="px-4 py-2 text-purple-400">4</td>
        <td className="px-4 py-2 text-gray-600">-</td>
      </tr>
    </tbody>
  </table>
</div>
</CollapsibleSection>
      </section>
    </div>
  );
}


// 得点計算
function ScoringRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">得点について</h3>

      <p>「ローカル対戦」で実際に自分でプレイしながら細かいルールの確認ができます。</p>
      
      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">お金について</h4>
        <p>部屋ごとに「アンティ」と「JOKERの枚数」が決められており、この2つの要素により最初の持ち込み金が決定されます。これは「必要チップ」として明記されており、所持金が足りない場合ゲームに参加することはできません。ゲーム終了時、自身の得点が所持金に反映されます。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">場代について</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>前のターンで勝敗がついていた場合、敗者からは「アンティ*2」分のポイントを徴収します。勝敗に関わらなかったプレイヤーからは「アンティ*1」分のポイントを徴収し、勝者からは徴収しません。</li>
          <li>前のターンが引き分けだった場合、全員から「アンティ*1」分徴収します。</li>
        </ol>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">基本的な得点について</h4>
        <p>後述する「倍率について」も併せてお読みください。ポイントは敗者から勝者へ支払われます。</p>
        <ol className="list-decimal list-inside space-y-3 ml-2">
          <li>
            <span className="font-semibold">通常の勝負の場合</span>
            <ul className="list-none ml-6 mt-2 space-y-1 text-sm">
                <li>• 「[( 大きいカードの数 ) - ( 小さいカードの数 )] × 2 × 倍率 × アンティ」分のポイントが移動します。</li>
              <li>• JOKERで勝利した場合は「50 × アンティ × 倍率」分のポイントが移動します。</li>
            </ul>
          </li>

          <li>
            <span className="font-semibold">返し札で勝利した場合</span>
            <ul className="list-none ml-6 mt-2 space-y-1 text-sm">
              <li>• より小さい値(Jに対して1、Qに対して2、Kに対して3)で勝利した場合は「30 × アンティ × 倍率」分のポイントが移動します。</li>
              <li>• より大きい値(Jに対して5、Qに対して6、Kに対して7)で勝利した場合は「25 × アンティ × 倍率」分のポイントが移動します。</li>
              <li>• JOKERに対して4で勝利した場合は「100 × アンティ × 倍率」分のポイントが移動します。</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">倍率について</h4>
        <p>基本的には1倍ですが、特殊なシチュエーションが起こった時、次のターンの倍率が増加します。但し、新たなセットが開始されるとき(手札が配られるとき)には、倍率は必ずリセットされて1倍から始まります。</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>場にでたカードの数字が重複していた時、次のターンに倍率が増加します。2枚重複で+1、3枚重複で+2です。</li>
          <li>場に出たカードのスートが一致していた時、次のターンに倍率が+1されます。</li>
          <li>場に出たカードが階段状になっていた時、次のターンに倍率が+1されます。なお、Q, K,Aのような循環は成立しません。</li>
          <li>倍率は重複して加算されます。<CollapsibleSection title='例えば'>
          <p>あるターンで出たカードが♦7, ♦8, ♦9だった場合、階段で+1、スート一致で+1となり合計+2。したがって、次のターンでの倍率は3倍となります。</p>
          </CollapsibleSection></li>
          <li>ターンを超えて倍率を加算することもできます。<CollapsibleSection title='例えば'>
          <p>先の例によって、今のターンの倍率が3倍になっているとします。ところが、場にでたカードは8, 8, K。この場合、さらに倍率が+1されて、次のターンの倍率は4倍となります。</p>
          </CollapsibleSection>場率が加算されない状態になると、次のターンの倍率はまたリセットされて1倍になります。</li>
        </ol>
      </section>
    </div>
  );
}

//各場所ないからここに置く（仮置き）
  function Others() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">その他</h3>
      
      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">切断への対処について</h4>
        <p>故意であるかどうかに関わらず、切断するとその時点でbotに切り替わります。botに切り替わると、即時選択、即時開示となり、他プレイヤーからどのカードを選んだのかわかるようになっています。また、切断したままゲームを終了した場合(復帰できなかった場合も含みます)、ゲーム終了後の得点は所持金に反映されません。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">注意事項など</h4>
        <p>このゲームの結果に基づいてなにか勝負事をするのは厳禁です。（罰ゲームなども含む）←ここまで面倒見る必要あるかな</p>
        <p>配信及び動画化okです。その際の収益化についても問題ありません。（ストーリー追加したらまた考える）</p>
        <p>問題点を発見された場合はこちらまで連絡をいただけると嬉しいです（連絡先をいつか作る）</p>
        <p>感想などはXにて#（後で決める）をつけてポストしていただけると励みになります。</p>
      </section>

      <section className='mt-6'>
        <h4 className="font-bold text-white mb-2">生成AIの使用について</h4>
        <p>ゲームを作成するにあたり、以下の部分に生成AIを使用しています。</p>
        <p>-一部コーディングに生成AIを使用しています。</p>
        </section>
    </div>
  );
}