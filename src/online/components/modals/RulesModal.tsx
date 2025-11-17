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
      
      <section>
        <h4 className="font-bold text-white mb-2">大まかな目的</h4>
        <p>勝つ。できるだけ負けない。負けるときは負けを最小限に抑える。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">プレイ人数</h4>
        <p>現段階では三人固定。将来的に4人、6人で遊べるゲームモードも作成します。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">ゲームの進行について</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>各プレイヤーに手札が配られます。</li>
          <li>全員、手札の中から1枚ずつ出すカードを決めます。</li>
          <li>全員が出すカードを決めたらショーダウン。そのターンの勝者と敗者が決まります。</li>
          <li>これを繰り返し、最終的な得点を争います。</li>
        </ol>
      </section>
      <section>
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
      
      <section>
        <h4 className="font-bold text-white mb-2">基本</h4>
        <p>毎ターン手札から1枚選んでカードを出します。時間切れとなると手札から自動で選ばれます。一度出すと決めると決めなおしはできません。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">基本的なカードの強さ</h4>
        <p className="mb-2">基本的には数字が大きいほど強いです。</p>
        <div className="bg-gray-900 p-3 rounded">
          <p className="font-mono">A(1) &lt; 2 &lt; 3 &lt; ... &lt; 10 &lt; J(11) &lt; Q(12) &lt; K(13) &lt;&lt; JOKER</p>
        </div>
        <p className="mb-2">例外があるので詳細は「勝敗判定について」を参照してください。</p>
        <p className="mb-2">1デックはJOKERを2枚含んで54枚です。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">JOKERについて</h4>
        <p>JOKERは各セットの最初に出すことはできません(配られてすぐのターンにJOKERを使うことはできません)。</p>
      </section>

      <section>
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
      
      <section>
        <h4 className="font-bold text-white mb-2">引き分けについて</h4>
        <p>場に出た三枚のカードのうち、同じ数字が2枚以上出ていればそのターンは「引き分け」となります。</p>
      </section>


      <section>
        <h4 className="font-bold text-white mb-2">返し札について</h4>
        <p>基本的には、「最も強いカードを出した人間が勝ち」となります。ですが、特定の状況下で絵札に対して、弱いカードでも勝てるようになる「返し札」というルールがあります。Jに対しては1と5が、Qに対しては2と6が、Kに対してjは3と7が、JOKERに対しては4が「返し札」に相当します。但し、「返し札」が場に出たカードのうち、最弱のカードである事が条件です。</p>
        <p>この後折りたためる例と表を追加</p>
      </section>
    </div>
  );
}


// 得点計算
function ScoringRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">得点について</h3>
      
      <section>
        <h4 className="font-bold text-white mb-2">お金について</h4>
        <p>部屋ごとにアンティとJOKERの枚数が決められており、この2つの要素により最初の持ち込み金が決定されます。これは「必要チップ」として明記されており、所持金が足りない場合該当する部屋に入室することはできません。ゲーム終了時、自身の得点が所持金に反映されます。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">場代について</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>前のターンで勝敗がついていた場合、敗者からは「アンティ*2」分のポイントを徴収します。勝敗に関わらなかったプレイヤーからは「アンティ*1」分のポイントを徴収し、勝者からは徴収しません。</li>
          <li>前のターンが引き分けだった場合、全員から「アンティ*1」分徴収します。</li>
        </ol>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">基本的な得点について</h4>
        <p>後述する「倍率について」も併せてお読みください。ポイントは敗者から勝者へ支払われます。</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>通常の勝負なら、「[( 大きいカードの数 ) - ( 小さいカードの数 )] * 2 * 倍率 * アンティ」分のポイントが移動します。</li>
          <li>JOKERで勝利した場合は「50 * アンティ * 倍率」分のポイントが移動します。</li>
          <li>返し札で勝利した場合、より小さい値(Jに対して1、Qに対して2、Kに対して3)で勝利した場合は「30 * アンティ * 倍率」分のポイントが移動します。</li>
          <li>より大きい値(Jに対して5、Qに対して6、Kに対して7)で勝利した場合は「25 * アンティ * 倍率」分のポイントが移動します。</li>
          <li>JOKERに対して4で勝利した場合は「100 * アンティ * 倍率」分のポイントが移動します。</li>
        </ol>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">倍率について</h4>
        <p>基本的には1倍ですが、特殊なシチュエーションが起こった時、次のターンの倍率が増加します。但し、新たなセットが開始されるとき(手札が配られるとき)には、倍率は必ずリセットされて1倍から始まります。</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>場にでたカードの数字が重複していた時、次のターンに倍率が増加します。2枚重複で+1、3枚重複で+2です。</li>
          <li>場に出たカードのスートが一致していた時、次のターンに倍率が+1されます。</li>
          <li>場に出たカードが階段状になっていた時、次のターンに倍率が+1されます。なお、Q, K,Aのような循環は成立しません。</li>
          <li>倍率は重複して加算されます。(折りたたんで例を挙げる)</li>
          <li>ターンを超えて倍率を加算することもできます。(折りたたんで例を挙げる)場率が加算されない状態になると、次のターンの倍率はまたリセットされて1倍になります。</li>
        </ol>

        <p>「ローカル対戦」で実際に自分でプレイしながら細かいルールの確認ができます。</p>
      </section>
    </div>
  );
}

//各場所ないからここに置く（仮置き）
  function Others() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">その他</h3>
      
      <section>
        <h4 className="font-bold text-white mb-2">切断への対処について</h4>
        <p>故意であるかどうかに関わらず、切断するとその時点でbotに切り替わります。botに切り替わると、即時選択、即時開示となり、他プレイヤーからどのカードを選んだのかわかるようになっています。また、切断したままゲームを終了した場合(復帰できなかった場合も含みます)、ゲーム終了後の得点は所持金に反映されません。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">プレイ人数</h4>
        <p>現段階では三人固定。将来的に4人、6人で遊べるゲームモードも作成します。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">注意事項など</h4>
        <p>このゲームの結果に基づいてなにか勝負事をするのは厳禁です。（罰ゲームなども含む）←ここまで面倒見る必要あるかな</p>
        <p>配信及び動画化okです。その際の収益化についても問題ありません。（ストーリー追加したらまた考える）</p>
        <p>問題点を発見された場合はこちらまで連絡をいただけると嬉しいです（連絡先をいつか作る）</p>
        <p>感想などはXにて#（後で決める）をつけてポストしていただけると励みになります。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">生成AIの使用について</h4>
        <p>ゲームを作成するにあたり、以下の部分に生成AIを使用しています。</p>
        <p>-一部コーディングに生成AIを使用しています。</p>
        </section>
    </div>
  );
}