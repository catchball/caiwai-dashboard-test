import { _buildDailyAll, _buildChipTimeline, _parseDate, getWordColor, _WORD_COLOR_MAP } from "./utils";
import { T } from "./tokens";
import { Newspaper, Twitter, Youtube, SlidersHorizontal, Sprout, Flame, Mountain, Sunset } from "lucide-react";

const SOURCES = [
  { id: "all", label: "総合", icon: null, color: T.accent },
  { id: "news", label: "ニュース", icon: Newspaper, color: T.news },
  { id: "x", label: "X", icon: Twitter, color: T.xColor },
  { id: "youtube", label: "YouTube", icon: Youtube, color: T.youtube },
  { id: "toriatsukai", label: "取扱い", icon: SlidersHorizontal, color: T.ink60 },
];



const NEWS_SUB_SOURCES = [
  { id: "all-news", label: "すべて" },
  { id: "newspaper", label: "新聞社" },
  { id: "broadcaster", label: "放送局" },
  { id: "wire", label: "通信社" },
  { id: "publisher", label: "出版社" },
  { id: "webmedia", label: "Webメディア" },
  { id: "otherweb", label: "他ウェブ" },
];

// ドメイン名 → ニュースサブカテゴリ


const TORIATSUKAI_OPTIONS = [
  { id: "タイトル",  label: "タイトル" },
  { id: "冒頭",      label: "◩冒頭" },
  { id: "本文内",    label: "◪本文内" },
];
const TORIATSUKAI_DEFAULT = { "タイトル": true, "冒頭": true, "本文内": false };

/* ToriatsukaiPills — 削除済み（未使用） */

/* ─── 期間フィルタ ─── */


const PERIOD_OPTIONS = [
  { id: "7d",  label: "7日" },
  { id: "14d", label: "14日" },
  { id: "30d", label: "30日" },
];



const DOMAIN_DATA = [
  { domain:"メディカルドック", count:23, firstSeen:"2025/11", rare:false },
  { domain:"saita", count:14, firstSeen:"2025/11", rare:false },
  { domain:"BuzzFeed", count:14, firstSeen:"2025/11", rare:false },
  { domain:"ヨガジャーナル", count:14, firstSeen:"2025/11", rare:false },
  { domain:"ダイヤモンド・オンライン", count:13, firstSeen:"2025/11", rare:false },
  { domain:"モデルプレス", count:11, firstSeen:"2025/11", rare:false },
  { domain:"Tasty Japan", count:11, firstSeen:"2025/11", rare:false },
  { domain:"日テレNEWS NNN", count:10, firstSeen:"2025/11", rare:false },
  { domain:"4MEEE", count:9, firstSeen:"2025/11", rare:false },
  { domain:"TBS NEWS DIG", count:9, firstSeen:"2025/11", rare:false },
];

// v5 定性マップ — ARTICLES から動的生成（日別 × 共起語チップ）


const ARTICLES = [
  { id:1, title:"納豆で構成されている建物の中に入ったら大量の納豆を持ち帰ることができて笑いが止まらなかった", src:"youtube", date:"4/7", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:2, title:"この世で1番うまいキムタクの食べ方がこれ。しっかり混ぜることでふわっとろ食感になる納豆と卵白にキムタクが絡み合ってほんまぶっ飛ぶうまさしてる。冗談抜きで国民的スター性を感じるレベル", src:"x", date:"4/7", domain:"x.com", words:[], score:95 , repostCount:0 },
  { id:3, title:"納豆学校入学しました ！#DXTEEN #DXTN #田中笑太郎 #SHOTARO #福田歩汰 #AYUTA", src:"youtube", date:"4/7", domain:"youtube", words:["納豆学校"], score:95 , repostCount:0 },
  { id:4, title:"私も生卵と納豆はそんなに食べません(鯨は好き)。まあ、その3つが食べられなくも日本には美味しいものがたくさんあります。また来日の際には是非ごちそうさせてください。フグなんてどうです", src:"x", date:"4/7", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:5, title:"コメの「コスト指標」初公表 精米5キロあたり2816円 利益含まないコストの合計", src:"news", date:"4/7", domain:"日テレNEWS NNN", words:[], score:45 , share:9, repostCount:0 },
  { id:6, title:"納豆の家に入ったら納豆の香ばしい香りが漂っていて心が落ち着いた", src:"youtube", date:"4/8", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:7, title:"納豆学校ダンスをAIで踊らせてみた #ai #納豆学校 #踊ってみた #shorts", src:"youtube", date:"4/8", domain:"youtube", words:["納豆学校"], score:95 , play:286206, repostCount:0 },
  { id:8, title:"最近納豆開けて納豆パックの中で納豆とネギとめんみ混ぜてそのままそばにかけて温玉のっけて食べるのにはまってるおいしい", src:"x", date:"4/8", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:9, title:"「ランチ代」理想は777円、現実は1250円...「第3の給与」社食が救世主？ 都庁や農水省...誰でも使える“極上社食”【Nスタ解説】", src:"news", date:"4/8", domain:"dメニューニュース", words:[], score:45 , repostCount:0 },
  { id:10, title:"さらばの男飯パスタ対決！！森田のぺぺたま納豆 vs ブクロのトマトツナベーコン！", src:"youtube", date:"4/9", domain:"youtube", words:["パスタ"], score:95 , repostCount:0 },
  { id:11, title:"納豆の学校知ってる？ #城之内チャンネル", src:"youtube", date:"4/9", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:12, title:"#住職の朝ごはん めかぶ納豆 豆腐とツナサラダ ごはんと具沢山味噌汁 #猫のいる暮らし #猫 #那須の長楽寺", src:"youtube", date:"4/9", domain:"youtube", words:["豆腐", "味噌"], score:95 , repostCount:0 },
  { id:13, title:"「じつは冷凍できる食材」として驚いたのが、納豆でした。意外と賞味期限が近くて、焦って食べることが多かったのですが、冷凍しておくことで無駄なく使いきれます。納豆菌は冷凍しても死滅しに", src:"x", date:"4/9", domain:"x.com", words:[], score:82 , repostCount:23 },
  { id:14, title:"「子どもが野菜を食べてくれない...」そんな悩みは納豆で解決！？元保育園栄養士が教える、ツルンと食べやすい小松菜の納豆和え納豆を使うことで、苦手な葉物野菜やにんじんもツルンと食べや", src:"x", date:"4/9", domain:"x.com", words:["レシピ"], score:82 , repostCount:383 },
  { id:15, title:"毎日冷凍のうどん、うどん、うどん...《退職金1,500万円・厚生年金15万円》拍手で見送られた「サラリーマン最後の日」。65歳夫、翌朝から始まった「今日が何曜日かわからなくなる」", src:"news", date:"4/9", domain:"ゴールドオンライン", words:[], score:45 , repostCount:0 },
  { id:16, title:"納豆5Kgを米一粒で食う男", src:"youtube", date:"4/10", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:17, title:"フリーズドライを使うと細巻き納豆が簡単にできるので気に入っている。海苔の上に酢飯を広げてフリーズドライ納豆をスプーンで一列に並べて、その上からみじん切りの紫蘇もパラパラと。あとは巻", src:"x", date:"4/10", domain:"x.com", words:["簡単"], score:95 , views:164994, repostCount:0 },
  { id:18, title:"納豆のパック洗うか洗わないか議論したいスレ #shorts #2ch 【2ch面白スレ】", src:"youtube", date:"4/10", domain:"youtube", words:[], score:82 , repostCount:0 },
  { id:19, title:"コチュジャン、沢庵、卵黄、最高！#若ハゲ #垢抜け #ダイエット #納豆", src:"youtube", date:"4/10", domain:"youtube", words:["ダイエット"], score:82 , repostCount:0 },
  { id:20, title:"おはようございます！本日もラー油ありますので、ご希望の方はアレでお知らせください。赤の食券は納豆、黒の食券は岩のりです。よろしくお願いいたします！", src:"x", date:"4/10", domain:"x.com", words:[], score:65 , repostCount:7 },
  { id:21, title:"神野大地が高校で直面した「レベルの違い」、「ここにいてもいいのか？」から立ち返った原点は...「とことん練習」", src:"news", date:"4/10", domain:"読売新聞オンライン", words:[], score:45 , repostCount:15 },
  { id:22, title:"満天☆青空レストラン 4/18放送「山梨県 富士納豆ひきわり」", src:"youtube", date:"4/11", domain:"youtube", words:["レシピ"], score:95 , repostCount:0 },
  { id:23, title:"納豆学校笑笑最近このシリーズ頭から離れんくて困ってる", src:"youtube", date:"4/11", domain:"youtube", words:["納豆学校"], score:95 , repostCount:0 },
  { id:24, title:"今日は具だくさん豚汁&炊きたて飯の納豆、海苔付き定食を食べました。おいしかったです。", src:"x", date:"4/11", domain:"x.com", words:[], score:65 , views:184177, repostCount:0 },
  { id:25, title:"timelesz篠塚大輝“アイドルになって1年2か月”私生活の変化明かす「結構すごくないですか？」", src:"news", date:"4/11", domain:"モデルプレス", words:[], score:45 , repostCount:18 },
  { id:26, title:"【大食い】納豆ちゃんぽん3キロ！【三宅智子】", src:"youtube", date:"4/12", domain:"youtube", words:[], score:95 , play:242857, repostCount:0 },
  { id:27, title:"「納豆キムチご飯と鮭」で痩せると思っている人、一生痩せません", src:"youtube", date:"4/12", domain:"youtube", words:["健康", "キムチ", "発酵"], score:95 , repostCount:0 },
  { id:28, title:"倉敷駅近く、志乃家さんで昼食納豆うどんにしました。うどん出汁と納豆との相性は良いです。ごちそうさまでした。", src:"x", date:"4/12", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:29, title:"伊勢うどんのタレで食べる納豆", src:"news", date:"4/12", domain:"日本経済新聞", words:[], score:45 , repostCount:0 },
  { id:30, title:"納豆学校phonk知ってる？ #城之内チャンネル", src:"youtube", date:"4/13", domain:"youtube", words:["納豆学校"], score:95 , repostCount:0 },
  { id:31, title:"【無職日記】パンと珈琲と葬式とロケットナウと納豆キャベツサラダと無職", src:"youtube", date:"4/13", domain:"youtube", words:[], score:82 , repostCount:0 },
  { id:32, title:"納豆定食を頼んだものの、「やっぱりお肉も食べたい！」ってことで牛カルビ焼肉皿を追加(((((っ・ω・)っ #すき家", src:"x", date:"4/13", domain:"x.com", words:[], score:82 , views:55938, repostCount:212 },
  { id:33, title:"今夜8時54分〜世界！#ニッポン行きたい人応援団納豆を愛するオランダ人兄妹マロンさん&リュディアさんをご招待北海道で日本一のわら納豆の製法や発酵の秘密を学び、福島では美しい経木納豆", src:"x", date:"4/13", domain:"x.com", words:["発酵"], score:65 , repostCount:9 },
  { id:34, title:"木村拓哉、初めてスーパー「ロピア」へ→試食して「目利きすげえ」と感嘆したのは...... スタッフに“3つ買い”したお惣菜も", src:"news", date:"4/13", domain:"ねとらぼ", words:[], score:45 , share:7, repostCount:24 },
  { id:35, title:"【踊ってみた】TikTokで流行ってる納豆学校【神綺杏菜】#Shorts", src:"youtube", date:"4/14", domain:"youtube", words:["納豆学校"], score:95 , repostCount:0 },
  { id:36, title:"【海外感動秘話】「臭い」納豆をバカにしていたフランス名門校の結末...日本の定食とコンビニに出会い完全に考えが変わった瞬間", src:"youtube", date:"4/14", domain:"youtube", words:["海外"], score:95 , repostCount:0 },
  { id:37, title:"卵かけ納豆ご飯はアリだと思う？", src:"x", date:"4/14", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:38, title:"飯舘村に“台湾の夜市”出現！本場の魯肉飯が食べられる場所に・福島", src:"news", date:"4/14", domain:"Yahoo!ニュース", words:["テレビ"], score:45 , share:3, repostCount:0 },
  { id:39, title:"納豆の学校知ってる？ #城之内チャンネル", src:"youtube", date:"4/15", domain:"youtube", words:[], score:95 , play:84376, repostCount:0 },
  { id:40, title:"【新発見！】納豆菌はメーカーで全然違います。混ぜると最強になる農家の使い方", src:"youtube", date:"4/15", domain:"youtube", words:[], score:82 , play:33806, repostCount:0 },
  { id:41, title:"本日のSnow ManのYouTubeでも佐久間さん、阿部さんが先日の納豆の番組について語ってくれてましたhttps://youtu.be/GUbWqF2Uj80?si=1svDq", src:"x", date:"4/15", domain:"x.com", words:[], score:82 , views:100239, repostCount:30 },
  { id:42, title:"【踊ってみた】TikTokで流行ってる納豆学校(笑)#shorts", src:"youtube", date:"4/15", domain:"youtube", words:["納豆学校"], score:82 , repostCount:0 },
  { id:43, title:"マイベスト油そばトッピングを探索中です。半熟玉子...ねぎラー油...牛小鉢...キムチ...紅生姜...納豆...鬼おろしポン酢...塩さば...チーズ...今のところ納豆・鬼お", src:"x", date:"4/15", domain:"x.com", words:["キムチ", "チーズ"], score:82 , views:178532, repostCount:8 },
  { id:44, title:"冷蔵庫の棚は「時間の単位」で使い分ける、分かりやすくする消費の順番", src:"news", date:"4/15", domain:"産経新聞", words:[], score:45 , repostCount:25 },
  { id:45, title:"和田明日香とゆる宅飲み【浜野謙太とファンキー！トマト納豆パスタと赤ワイン】", src:"news", date:"4/15", domain:"テレビ東京", words:["パスタ"], score:45 , repostCount:0 },
  { id:46, title:"世界一うまい納豆の食べ方", src:"youtube", date:"4/16", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:47, title:"納豆学校セルフ音源 #shorts", src:"youtube", date:"4/16", domain:"youtube", words:["納豆学校"], score:95 , repostCount:0 },
  { id:48, title:"世界一うまい納豆の食べ方がこれ。ごはんのお供の三大巨頭、納豆・たまご・ごはんですよを混ぜたら革命が起きました。マジでなったま丼史上1番うまい自信あるんでぜひお試しください。", src:"x", date:"4/16", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:49, title:"今年度から「給食費実質無償化」のはずが...国の交付金「月額5200円」では難しい? 背景に“食材費の高騰” 差額は結局保護者が負担?", src:"news", date:"4/16", domain:"Yahoo!ニュース", words:["値上"], score:45 , share:3, repostCount:0 },
  { id:50, title:"【ボクシング】井上尚弥戦の勝利へ、中谷潤人が書き記すノートを一部公開 名王者が苦しんだメガ・ファイト前でも「ブレない」", src:"news", date:"4/16", domain:"web Sportiva", words:[], score:45 , share:1, repostCount:25 },
  { id:51, title:"#納豆学校 #納豆ミーム #ダブルダッチ #フライディガーズ", src:"youtube", date:"4/17", domain:"youtube", words:["納豆学校"], score:82 , play:170451, repostCount:0 },
  { id:52, title:"納豆麹の作り方 #japan #納豆麹 #麹 #腸活 #japanesefood #納豆 #diet #cleanse #教えてちえ先生", src:"youtube", date:"4/17", domain:"youtube", words:["腸活"], score:82 , repostCount:0 },
  { id:53, title:"この納豆がとにかく美味しいです。仲間の居所を吐かないとこの納豆を二度と食べさせないと脅されたとしたら、私は仲間の居場所どころか仲間の出身地や飼ってる犬の名前まで洗いざらい吐くことで", src:"x", date:"4/17", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:54, title:"「2か月後、用意できないかもしれない」ナフサ不足 物価の優等生”豆腐”店も直撃 容器の価格は45%値上がり", src:"news", date:"4/17", domain:"Yahoo!ニュース", words:["ナフサ", "中東", "豆腐", "大豆", "値上"], score:45 , repostCount:29 },
  { id:55, title:"ガチの初見の人ですごいな...ホントなら親や友達の納豆食べる姿を見て、表面にフィルムがあるんだなと学ぶはず...それがないということは本当に1人で、初めて食べるということに他ならず", src:"x", date:"4/18", domain:"x.com", words:[], score:95 , repostCount:0 },
  { id:56, title:"【即興ダンス】3姉妹でTikTokで流行ってる納豆学校の「ろこまこあこ学校ver」を踊ってみた！#Shorts", src:"youtube", date:"4/18", domain:"youtube", words:["納豆学校"], score:95 , play:67814, repostCount:0 },
  { id:57, title:"納豆に小さじ1杯だけで2週間で−14キロ!痩せホルモンが2倍になる黄金レシピTOP7で夏まで勝手に痩せる食べ物と避けるべき食べ方【ダイエット整体師｜40代50代ダイエット】", src:"youtube", date:"4/18", domain:"youtube", words:["レシピ", "ダイエット"], score:95 , repostCount:0 },
  { id:58, title:"【究極】納豆の激ウマアレンジ、どれが1番美味しいの？？？", src:"youtube", date:"4/18", domain:"youtube", words:["アレンジ"], score:95 , play:139466, repostCount:0 },
  { id:59, title:"大久保佳代子「ここ1年でハマっている」藤本美貴が「うまい」しぶしぶ頭を下げる", src:"news", date:"4/18", domain:"日刊スポーツ", words:["テレビ"], score:45 , share:4, repostCount:7 },
  { id:60, title:"【青空レストラン】『つくね』の作り方", src:"news", date:"4/18", domain:"日テレTOPICS", words:["レシピ"], score:45 , repostCount:0 },
  { id:61, title:"- 靴の納豆臭に - #薬剤師", src:"youtube", date:"4/19", domain:"youtube", words:[], score:82 , play:271858, repostCount:0 },
  { id:62, title:"納豆に〇〇を混ぜると腐った便が全て出る5選", src:"youtube", date:"4/19", domain:"youtube", words:[], score:82 , repostCount:0 },
  { id:63, title:"【HUNTER×HUNTER】確率5%の大凶を出したら納豆早食い！リスキーダイス大豆！【ネバネバ】", src:"youtube", date:"4/19", domain:"youtube", words:["大豆"], score:82 , repostCount:0 },
  { id:64, title:"こんにちは。納豆なくなってしまったのですが海老っちょ辣油用意できました。ご希望の方は赤の食券でお願いします。岩のりは黒食券高菜はまだまだありますのでご希望の方は「アレ？」でお願いし", src:"x", date:"4/19", domain:"x.com", words:[], score:65 , repostCount:0 },
  { id:65, title:"納豆に一つまみかけるだけ...血液サラサラ効果と全身の老化防止効果を爆上げするどこの家にもある\"調味料\"", src:"news", date:"4/19", domain:"PRESIDENT Online", words:[], score:45 , repostCount:0 },
  { id:66, title:"納豆を混ぜ続ける石丸伸二  #恋愛病院 ABEMAで【無料】配信中！ #石丸伸二 #shorts #恋愛 #ABEMA", src:"youtube", date:"4/20", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:67, title:"世界的歌姫が“納豆”にハマった結果...世界的なブームに", src:"youtube", date:"4/20", domain:"youtube", words:["海外"], score:82 , repostCount:0 },
  { id:68, title:"TBS「滝沢カレン&和田明日香のフィーリンきっちん」和田明日香がブロッコリーの納豆肉そぼろを作る#TVer #フィーリンきっちん", src:"x", date:"4/20", domain:"x.com", words:[], score:65 , repostCount:33 },
  { id:69, title:"父に美味しい納豆を食べさせたい！北海道の“わら納豆”と福島の“経木納豆”を学ぶ:世界！ニッポン行きたい人応援団", src:"news", date:"4/20", domain:"テレ東プラス", words:[], score:45 , share:4, repostCount:0 },
  { id:70, title:"伸び～る、納豆海外市場 江別・メーカー売り上げ9年で60倍 インフルエンサー後押しも ／北海道", src:"news", date:"4/20", domain:"毎日新聞", words:["海外", "輸出"], score:45 , share:10, repostCount:5 },
  { id:71, title:"「納豆キャベツの黄金焼き」市販のキャベツ・納豆・卵を混ぜるだけ！ふんわり卵焼き!!節約レシピ・市販の千切りキャベツアレンジ・納豆卵消費レシピ・粉を使わないお好み焼き作り方", src:"youtube", date:"4/21", domain:"youtube", words:["レシピ", "アレンジ", "節約"], score:95 , repostCount:0 },
  { id:72, title:"納豆の残り水を畑にかけたら — トマトが異常に甘くなった(農家が黙っている理由)", src:"youtube", date:"4/21", domain:"youtube", words:["朝食"], score:82 , play:248474, repostCount:0 },
  { id:73, title:"ついに買っちゃった。。。ミツカンさんのたまご醤油たれボトル。。大好きな納豆のタレなんだよなああああこれがあれば無敵すぎるやばい！！！早速今日納豆！！！！！！", src:"x", date:"4/21", domain:"x.com", words:["ミツカン", "醤油"], score:82 , repostCount:347 },
  { id:74, title:"四季凪アキラさんが唸ったあの“ケールのサラダ”と“すごいフルーツと野菜”が入ったコラボおためしセット、まだチェックできます※納豆も入っているので、納豆お茶漬けもできます...！数量", src:"x", date:"4/21", domain:"x.com", words:[], score:65 , repostCount:0 },
  { id:75, title:"刺身でもレバーでもない...管理栄養士が「骨粗鬆症予防に欠かせない」と勧める\"魚と肉の食べ方\"", src:"news", date:"4/21", domain:"PRESIDENT Online", words:["料理"], score:45 , repostCount:22 },
  { id:76, title:"【納豆にこれ入れろ】「納豆に●●入れてなかった昔の私は、正直バカでした 納豆にこれ入れるだけで納豆の効果が10倍に!?」を世界一わかりやすく要約してみた【本要約】", src:"youtube", date:"4/22", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:77, title:"実は納豆よりも血管を綺麗にする最強食品6選！ #あなたの健康を守るライフハック #健康 #雑学 #医療 #血管 #shorts", src:"youtube", date:"4/22", domain:"youtube", words:["健康"], score:95 , repostCount:0 },
  { id:78, title:"おはようございます今日の朝ごはんはファミマの納豆巻きです", src:"x", date:"4/22", domain:"x.com", words:[], score:65 , repostCount:0 },
  { id:79, title:"おはよー。朝ごはんに、ご飯納豆ゆで卵仕事行ってきまーす！！", src:"x", date:"4/22", domain:"x.com", words:[], score:65 , repostCount:0 },
  { id:80, title:"綾瀬はるか、“大事な人”からの理想のラブレターは「気持ちがこもっているもの」", src:"news", date:"4/22", domain:"日テレNEWS NNN", words:[], score:45 , share:8, repostCount:0 },
  { id:81, title:"マメピーたちの朝ご飯は納豆だよ。#shorts #educationalchannel #parenting", src:"youtube", date:"4/23", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:82, title:"納豆巻き大好きカラスのクッピ!!悪戦苦闘するラビ可愛い BGMキジバト 2026/4/21撮影 #カラス ※概要欄見てね #カラスのクッピ", src:"youtube", date:"4/23", domain:"youtube", words:[], score:82 , repostCount:0 },
  { id:83, title:"レンコンと豚肉の納豆明太マヨ", src:"youtube", date:"4/23", domain:"youtube", words:[], score:82 , repostCount:0 },
  { id:84, title:"昼ご飯、鱈フライと納豆巻きいただきます", src:"x", date:"4/23", domain:"x.com", words:[], score:65 , repostCount:0 },
  { id:85, title:"秋田のヤマダフーズ、ひきわり納豆やフリーズドライで磨く商品力", src:"news", date:"4/23", domain:"日本経済新聞", words:["大豆", "発酵"], score:45 , repostCount:0 },
  { id:86, title:"「チミチュリソース」知ってますか？ 大手飲食店も注目、出水アナがアルゼンチン大使館へ 本場の味と対面【Nスタ解説】", src:"news", date:"4/23", domain:"TBS NEWS DIG", words:["海外"], score:45 , repostCount:0 },
  { id:87, title:"浜田が披露する納豆の裏ワザ #旅行 #ダウンタウンプラス", src:"youtube", date:"4/24", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:88, title:"超簡単！チーズ納豆パスタ#簡単レシピ #cooking #VOICEVOXずんだもん", src:"youtube", date:"4/24", domain:"youtube", words:["レシピ", "料理", "簡単", "パスタ", "チーズ"], score:95 , play:222277, repostCount:0 },
  { id:89, title:"「納豆を混ぜる」という表現、何と何を「混ぜて」いるのか積年の疑問(醤油というわけではなさそう)", src:"x", date:"4/24", domain:"x.com", words:["醤油"], score:95 , repostCount:0 },
  { id:90, title:"#おろし納豆 やばいぐらい効く大根おろし100g=18kcalで腸が動く納豆=発酵パワーで腸内細菌が歓喜この2つを合わせると 胃もたれ消える 便がスムーズ 肝臓の負担も激減混ぜるだ", src:"x", date:"4/24", domain:"x.com", words:["レシピ", "発酵"], score:82 , views:152028, repostCount:35 },
  { id:91, title:"スーパー戦国時代 注目のドンキの新業態『ロビン・フッド』1号店がオープン 85円のおにぎり...300円台の弁当も 1回の買い物で3万円超え", src:"news", date:"4/24", domain:"TBS NEWS DIG", words:[], score:45 , repostCount:0 },
  { id:92, title:"コスパ・タイパを文字で強調！ドン・キホーテ新業態「ロビン・フッド」 一目でわかるPBと客を迷わせない戦略とは【Nスタ解説】", src:"news", date:"4/24", domain:"TBS NEWS DIG", words:[], score:45 , repostCount:17 },
  { id:93, title:"我が家の子供達が発明した名もなき遊び。1 納豆パックの蓋に水性ペンで色をつける。何色か重ねたほうが楽しい。2 木工用ボンドを豪快に絞り出す3 綿棒で混ぜる4 半日〜一日乾かす作業そ", src:"x", date:"4/25", domain:"x.com", words:[], score:95 , repostCount:0 },
  { id:94, title:"納豆にはからし絶対いれたい！唐揚げにはレモンかけたい！#tiktok #dance", src:"youtube", date:"4/25", domain:"youtube", words:[], score:95 , play:123814, repostCount:0 },
  { id:95, title:"【藁で作れ】子供の納豆嫌いを克服せよ 藁納豆 美味しんぼ 漫画飯再現料理 アニメ飯再現レシピ", src:"youtube", date:"4/25", domain:"youtube", words:["レシピ", "料理"], score:95 , repostCount:0 },
  { id:96, title:"大関琴桜が小結熱海富士らと14番「体力落とさないことが一番」 大相撲春巡業", src:"news", date:"4/25", domain:"産経新聞", words:[], score:45 , share:1, repostCount:19 },
  { id:97, title:"愛の納豆 美味しんぼ 漫画飯再現料理 アニメ飯再現レシピ", src:"youtube", date:"4/26", domain:"youtube", words:["レシピ", "料理"], score:95 , play:43482, repostCount:0 },
  { id:98, title:"納豆が生んだ確執 #コントチャンネル #funny #アニメ #面白い #anime #コント", src:"youtube", date:"4/26", domain:"youtube", words:[], score:82 , repostCount:0 },
  { id:99, title:"健屋が夜食にしている豆腐とめかぶと納豆とキムチと生卵を混ぜたやつ、リスナーさんに名前を募集したところ「発酵とろとろ大豆丼」になりました みんなも食べてみてね、発酵とろとろ大豆丼", src:"x", date:"4/26", domain:"x.com", words:["豆腐", "大豆", "キムチ", "発酵"], score:82 , repostCount:43 },
  { id:100, title:"「うなぎ」でも「ラーメン」でもない...味覚がバカになる無重力空間で宇宙飛行士人気NO.1の「日本食メニュー」", src:"news", date:"4/26", domain:"PRESIDENT Online", words:["ラーメン"], score:45 , repostCount:0 },
  { id:101, title:"『おかめ納豆』禁断の食べ方【バトルキッチン754(2026.4.27)】", src:"youtube", date:"4/27", domain:"youtube", words:[], score:95 , play:157784, repostCount:0 },
  { id:102, title:"【これ食べたらテンション上がる】忙しい朝でもパパッと作れる！簡単トーストレシピ4選面倒な手間はなし！のせて焼くだけのトーストレシピです新玉ねぎトースト、納豆チーズトースト、キムチチ", src:"x", date:"4/27", domain:"x.com", words:["レシピ", "キムチ", "簡単", "チーズ"], score:82 , repostCount:0 },
  { id:103, title:"上戸彩がハワイでの写真集撮影で真っ青に「ザ！世界仰天ニュース」で食にまつわるトーク", src:"news", date:"4/27", domain:"日テレTOPICS", words:["テレビ"], score:45 , share:4, repostCount:3 },
  { id:104, title:"“日本一の納豆”がピンチ「豆以外が全部値上がり」 ごみ袋「作れない」緊急事態 家庭向け月24万枚...どう確保 愛知・大府市", src:"youtube", date:"4/28", domain:"youtube", words:["値上"], score:95 , repostCount:0 },
  { id:105, title:"納豆に入れて美味しい物を3つあげられますか？", src:"x", date:"4/28", domain:"x.com", words:[], score:95 , repostCount:16 },
  { id:106, title:"コレから白和えはこう作る！納豆とワカメで作る栄養満点の絶品レシピ", src:"youtube", date:"4/28", domain:"youtube", words:["レシピ", "料理", "豆腐"], score:95 , play:83204, repostCount:0 },
  { id:107, title:"【鳥取県・島根県・広島県・山口県限定】⋱エモい給食フェア⋰おすすめは『スタミナ納豆(鶏ひき肉炒め)』唐辛子とニンニクでピリ辛に仕上げた鶏ひき肉+納豆納豆が苦手な方も食べやすい、地域", src:"x", date:"4/28", domain:"x.com", words:[], score:82 , views:142601, repostCount:0 },
  { id:108, title:"名古屋市がマンホールふたを販売 競争率150倍以上の物も", src:"news", date:"4/28", domain:"Locipo", words:["大豆"], score:45 , share:5, repostCount:22 },
  { id:109, title:"痩せたいなら納豆と〇〇と必ず食べてください", src:"youtube", date:"4/29", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:110, title:"外国人の初納豆#shorts", src:"youtube", date:"4/29", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:111, title:"5月は「豆腐や納豆が平均10円値上げ」夏に売れる“こんにゃく”も...6月にはレジ袋値上げへ 北海道", src:"youtube", date:"4/29", domain:"youtube", words:["値上げ", "豆腐"], score:95 , repostCount:0 },
  { id:112, title:"晩御飯に、納豆食べる人いますか", src:"x", date:"4/29", domain:"x.com", words:[], score:82 , repostCount:39 },
  { id:113, title:"上戸彩 好きな食べ物は「納豆」 最近ハマっている食べ方にtimelesz・松島絶賛「肌にも良い」", src:"news", date:"4/29", domain:"スポニチアネックス", words:["テレビ"], score:45 , share:5, repostCount:7 },
  { id:114, title:"中東情勢の悪化が直撃！5月から豆腐・納豆・豚肉など値上がり 家計防衛のお得な野菜情報", src:"youtube", date:"4/30", domain:"youtube", words:["値上げ", "中東", "豆腐"], score:95 , repostCount:0 },
  { id:115, title:"納豆だあいすき!!️ #納豆学校 #dance #fyp", src:"youtube", date:"4/30", domain:"youtube", words:["納豆学校"], score:95 , repostCount:0 },
  { id:116, title:"ただ納豆を食べても痩せません。納豆だけ食べるのは損なので、これ真似してみてください", src:"x", date:"4/30", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:117, title:"GWスタート 留守中の空き巣に注意“フードデリバリー”装い下見も 物価高直撃... 異例の“緊急値上げ”【news23】", src:"news", date:"4/30", domain:"TBS NEWS DIG", words:["値上げ"], score:45 , repostCount:0 },
  { id:118, title:"ネバネバ大惨事...糸を引きながら納豆を爆食するチワワ 「部屋の壁も食べました」", src:"news", date:"4/30", domain:"ORICON NEWS", words:[], score:45 , share:9, repostCount:0 },
  { id:119, title:"ミツカン 納豆を最大2割値上げ ナフサ高騰で【スーパーJチャンネル】(2026年5月1日)", src:"youtube", date:"5/1", domain:"youtube", words:["値上げ", "ミツカン", "ナフサ", "中東"], score:95 , repostCount:0 },
  { id:120, title:"ミツカン「金のつぶ」シリーズなど納豆商品を6月から最大20%値上げへ ナフサ価格高騰などで｜TBS NEWS DIG", src:"youtube", date:"5/1", domain:"youtube", words:["値上げ", "ミツカン", "ナフサ", "中東"], score:95 , repostCount:0 },
  { id:121, title:"【ミツカン】納豆商品を6月1日から最大20%値上げ「金のつぶ」など ナフサ急騰など影響", src:"youtube", date:"5/1", domain:"youtube", words:["値上げ", "ミツカン", "ナフサ", "中東"], score:95 , repostCount:0 },
  { id:122, title:"【影響】ミツカン、中東情勢悪化で「納豆」最大20%値上げへhttps://news.livedoor.com/article/detail/31148803/...納豆商品を6月1", src:"x", date:"5/1", domain:"x.com", words:["値上げ", "ミツカン", "ナフサ", "中東", "大豆"], score:95 , views:96987, repostCount:85 },
  { id:123, title:"ステーキ！！焼肉！！！牛乳！！！納豆！！！カレー！！！パフェ！！！！！", src:"x", date:"5/1", domain:"x.com", words:[], score:95 , repostCount:0 },
  { id:124, title:"幻の大豆、有機さといらずの納豆を欲しい方いらっしゃいますか？", src:"x", date:"5/1", domain:"x.com", words:["大豆"], score:82 , repostCount:0 },
  { id:125, title:"≪福生マッチョハンマー男・逮捕≫「騒音がうるさいと」とバイク少年を襲った無職男は庭に自力で“離れ”をつくった“子ども部屋おじさん”母は「優しくて頭がいい」と庇うが...", src:"news", date:"5/1", domain:"集英社オンライン", words:[], score:45 , share:7, repostCount:12 },
  { id:126, title:"中東情勢悪化で納豆値上げ ミツカン、最大20%", src:"news", date:"5/1", domain:"秋田魁新報電子版", words:["値上げ", "ミツカン", "ナフサ", "中東", "大豆"], score:45 , repostCount:0 },
  { id:127, title:"納豆や食パンも... 東海地方の食品メーカー値上げ発表 中東情勢で「ナフサ」高騰により", src:"youtube", date:"5/2", domain:"youtube", words:["値上げ", "ミツカン", "ナフサ", "中東"], score:95 , play:93326, repostCount:0 },
  { id:128, title:"夜に食べるとすっごい痩せる悪魔の納豆ご飯  #shorts", src:"youtube", date:"5/2", domain:"youtube", words:["ダイエット"], score:95 , repostCount:0 },
  { id:129, title:"【10分以内！チャーハンアレンジ14選】カニカマや納豆、サバ缶など、変わり種のレシピを集めました作ってみたいレシピはどれですか？？https://park.ajinomoto.co", src:"x", date:"5/2", domain:"x.com", words:["レシピ", "アレンジ"], score:65 , repostCount:0 },
  { id:130, title:"「納豆に砂糖をかけて食べる風習がある」道東・東北の一部地域に伝わる食べ方。砂糖を加えることで粘り気が増しフワフワになり、甘みと旨みの均衡が取れた味に！SNSでは「意外とイケる」など", src:"x", date:"5/2", domain:"x.com", words:["醤油"], score:65 , repostCount:65 },
  { id:131, title:"納豆や食パンも... 東海地方の食品メーカー値上げ発表 中東情勢で「ナフサ」高騰により", src:"news", date:"5/2", domain:"日テレNEWS NNN", words:["値上げ", "ミツカン", "ナフサ", "中東"], score:45 , repostCount:0 },
  { id:132, title:"イオンの納豆売り場で店員の人が「ナフサのため品薄が予想されます！今のうちに買い溜めを！」と呼びかけている", src:"x", date:"5/3", domain:"x.com", words:["ナフサ"], score:95 , repostCount:0 },
  { id:133, title:"実は納豆よりも腸内環境を良くする食材5選 #納豆 #腸活 #免疫力アップ", src:"youtube", date:"5/3", domain:"youtube", words:["健康", "腸活"], score:82 , repostCount:0 },
  { id:134, title:"【マズい！？】納豆に酢をかける人は、体がこうなります。60歳からの健康を左右する真実", src:"youtube", date:"5/3", domain:"youtube", words:["健康"], score:82 , play:101755, repostCount:0 },
  { id:135, title:"ミツカン「納豆」一部商品を5・1から休売 全19商品を6・1から値上げ...「ナフサ価格」理由に【詳細】", src:"news", date:"5/3", domain:"ORICON NEWS", words:["値上げ", "ミツカン", "ナフサ", "中東"], score:45 , repostCount:0 },
  { id:136, title:"美味しいで噂の納豆チップルがあるので食べてみてガチレビューしてみた結果は？", src:"youtube", date:"5/4", domain:"youtube", words:[], score:95 , play:184601, repostCount:0 },
  { id:137, title:"納豆とチーズの味噌汁 #爆速レシピ #味噌汁 #リアル30秒クッキング", src:"youtube", date:"5/4", domain:"youtube", words:["レシピ", "味噌", "チーズ"], score:82 , repostCount:0 },
  { id:138, title:"サラダ巻きと納豆巻き中巻き寿司は難しくないからいろいろ作ってみよう", src:"x", date:"5/4", domain:"x.com", words:[], score:82 , repostCount:17 },
  { id:139, title:"森香澄が毎日食べているものは？ 賢く整える「自炊ルール」と神レシピ3選", src:"news", date:"5/4", domain:"Yahoo!ニュース", words:["レシピ"], score:45 , repostCount:0 },
  { id:140, title:"この納豆アレンジレシピが美味しすぎる！！！ #大食い女子 #アレンジレシピ #納豆", src:"youtube", date:"5/5", domain:"youtube", words:["レシピ", "アレンジ"], score:82 , repostCount:0 },
  { id:141, title:"#ゴールデンウィークSNS展覧会2026伊達政宗沖田総司へのへのもへじ納豆", src:"x", date:"5/5", domain:"x.com", words:[], score:82 , views:114598, repostCount:69 },
  { id:142, title:"納豆サプリ毎日のんでる! 「#納豆学校」バレエ歴20年Vtuberが踊ってみた #さんたらいぶ #vtuber #shorts", src:"youtube", date:"5/5", domain:"youtube", words:["納豆学校"], score:82 , repostCount:0 },
  { id:143, title:"「俺は大丈夫」と笑っていたのに...年金月10万円・83歳父がアパートで昏倒。息子が見た「食費1日300円」極限生活の果て", src:"news", date:"5/5", domain:"ゴールドオンライン", words:[], score:45 , repostCount:2 },
  { id:144, title:"24時間 納豆生活する母#shorts", src:"youtube", date:"5/6", domain:"youtube", words:[], score:95 , repostCount:0 },
  { id:145, title:"【超簡単】混ぜるだけ！筋肉をつける納豆丼レシピ4選", src:"youtube", date:"5/6", domain:"youtube", words:["レシピ", "健康", "簡単"], score:95 , play:191456, repostCount:0 },
  { id:146, title:"冷蔵庫の余り物弁当 納豆天ぷら・卵焼き・ピーマンのクミン炒め", src:"youtube", date:"5/6", domain:"youtube", words:["醤油"], score:82 , repostCount:0 },
  { id:147, title:"イングリッシュブレックファーストのベイクドビーンズ。もしかすると納豆で作れるかも？と思って試してみたんです...結果、見た目はそれっぽくなりました。でも味は...味は、どうやっても", src:"x", date:"5/6", domain:"x.com", words:[], score:82 , repostCount:0 },
  { id:148, title:"朝ご飯に食べたいのは、漬け丼それとも納豆ご飯", src:"x", date:"5/6", domain:"x.com", words:[], score:65 , repostCount:168 },
  { id:149, title:"「政府はもっと危機感を」専門家は警鐘 高市政権で“ナフサ不足”が深刻化...現場は「価格転嫁は避けられない」と悲鳴", src:"news", date:"5/6", domain:"女性自身", words:["値上げ", "ナフサ"], score:45 , share:5, repostCount:0 },
  { id:150, title:"【納豆】中東情勢の影響で値上げ相次ぐ 活路は海外？ 輸出は2017年比で約3倍に増加", src:"youtube", date:"5/7", domain:"youtube", words:["値上げ", "中東", "海外", "輸出"], score:95 , repostCount:0 },
  { id:151, title:"【5月限定クーポン配信中】#やよい軒 の限定ク一ポンは使った イカのから揚げ→40引きの220円生たまご→30円引きの40円納豆→50円引きの60円5.31 (日)迄※ご利用は1度", src:"x", date:"5/7", domain:"x.com", words:[], score:65 , views:110417, repostCount:0 },
  { id:152, title:"食品容器不足・高騰で販売停止も", src:"news", date:"5/7", domain:"中国新聞デジタル", words:["値上げ", "中東"], score:45 , repostCount:20 },
];

// 取扱いフィールド付与: タイトルに「納豆」含む→"タイトル"、食品関連ニュース→"冒頭"、それ以外→"本文内"


const _HONBUN_IDS = new Set([21,25,34,38,50,80,86,91,92,96,103,108,117,125,143]);
ARTICLES.forEach(a => {
  if (a.title.includes("納豆")) a.toriatsukai = "タイトル";
  else if (_HONBUN_IDS.has(a.id)) a.toriatsukai = "本文内";
  else a.toriatsukai = "冒頭";
});

// 日別件数: ARTICLES から動的生成（グラフと記事一覧が同一ソース）


const DAILY_ALL = _buildDailyAll(ARTICLES);

// 定性マップ: ARTICLES から動的生成
const CHIP_TIMELINE = _buildChipTimeline(ARTICLES);

// ヘッダー用：データの日付範囲を動的に算出
const DATA_DATE_RANGE = (() => {
  if (ARTICLES.length === 0) return "";
  const sorted = [...new Set(ARTICLES.map(a => a.date))].sort((a,b) => _parseDate(a) - _parseDate(b));
  const fmt = (s) => { const [m,d] = s.split("/"); return String(m).padStart(2,"0") + "/" + String(d).padStart(2,"0"); };
  return `${fmt(sorted[0])} \u2013 ${fmt(sorted[sorted.length-1])}`;
})();
const CHIP_MAX_COUNT = CHIP_TIMELINE.length > 0
  ? Math.max(...CHIP_TIMELINE.flatMap(d => d.words.map(w => w.c)))
  : 1;
const CHIP_CONNECTED_WORDS = new Set(CHIP_TIMELINE.flatMap(day => day.words.map(w => w.w)));
CHIP_CONNECTED_WORDS.forEach(w => getWordColor(w));
Object.freeze(_WORD_COLOR_MAP);





/* ═══════════════════════════════════════════════════════════
   検知テンプレート関数（7タイプ）
   params → { label, detail } を生成。テキストは全てここで定義
   ═══════════════════════════════════════════════════════════ */
const DETECTION_TEMPLATES = {
  spike:        (p) => ({ label: `${p.date} に急増`,                    detail: `${p.count}件（平均${p.baseline} → +${p.pctChange}%）` }),
  sustained_up: (p) => ({ label: `${p.startDate}以降 高水準が継続`,     detail: `${p.days}日連続 平均超（${p.range} / 平均${p.baseline}）` }),
  source_bias:  (p) => ({ label: `${p.date} ${p.source} に集中`,       detail: `${p.source} ${p.count}件（${p.pct}%） / 通常 ${p.normalPct}%` }),
  new_domain:   (p) => ({ label: `新規ドメイン ${p.count}件`,           detail: p.domains.join(", ") }),
  source_lag:   (p) => ({ label: `${p.lead}→${p.lag} で${p.days}日ラグ`, detail: `${p.lead} ${p.leadDate} ピーク → ${p.lag} ${p.lagDate} ピーク` }),
  topic_rise:   (p) => ({ label: `${p.word} ${p.before}→${p.after}`,    detail: `${p.refDate}まで${p.before}件 → ${p.date}に${p.after}件出現` }),
  topic_fall:   (p) => ({ label: `${p.word} ${p.before}→${p.after}（${p.sinceDate}〜）`, detail: `${p.refDate}まで平均${p.avg}件 → ${p.sinceDate}以降${p.after}件` }),
};

/* ═══════════════════════════════════════════════════════════
   検知エンジン結果（モック） — ハイライト生成の入力データ。UI直接表示なし
   ═══════════════════════════════════════════════════════════ */


const DETECTIONS_RAW = [
  { id:"d1", type:"spike", viewpoint:"spike", strength:92,
    params:{ date:"5/1", count:129, baseline:82, pctChange:57 },
    linkedDate:"5/1", linkedWord:null, linkedSource:null },
  { id:"d2", type:"sustained_up", viewpoint:"spike", strength:45,
    params:{ startDate:"4/7", days:4, range:"86〜92件", baseline:82 },
    linkedDate:null, linkedWord:null, linkedSource:null },
  { id:"d4", type:"source_bias", viewpoint:"source", strength:68,
    params:{ date:"5/1", source:"X", count:39, pct:30, normalPct:24 },
    linkedDate:"5/1", linkedWord:null, linkedSource:"x" },
  { id:"d5", type:"new_domain", viewpoint:"source", strength:55,
    params:{ count:3, domains:["たかちほ正史発酵蔵", "琉球新報デジタル", "下野新聞 SOON"] },
    linkedDate:null, linkedWord:null, linkedSource:null },
  { id:"d6", type:"source_lag", viewpoint:"source", strength:40,
    params:{ lead:"YT", lag:"News", leadDate:"4/29", lagDate:"5/1", days:2 },
    linkedDate:null, linkedWord:null, linkedSource:null },
  { id:"d7a", type:"topic_rise", viewpoint:"v5", strength:85,
    params:{ word:"値上げ", before:2, after:35, date:"5/1", refDate:"4/30" },
    linkedDate:"5/1", linkedWord:"値上げ", linkedSource:null },
  { id:"d7b", type:"topic_rise", viewpoint:"v5", strength:60,
    params:{ word:"ミツカン", before:0, after:40, date:"5/1", refDate:"4/30" },
    linkedDate:"5/1", linkedWord:"ミツカン", linkedSource:null },
  { id:"d7c", type:"topic_fall", viewpoint:"v5", strength:50,
    params:{ word:"レシピ", before:8, after:5, avg:8, sinceDate:"5/1", refDate:"4/30" },
    linkedDate:"5/1", linkedWord:"レシピ", linkedSource:null },
];



// params → label/detail を展開した DETECTIONS を生成


const DETECTIONS = DETECTIONS_RAW.map(d => {
  const tmpl = DETECTION_TEMPLATES[d.type];
  const { label, detail } = tmpl ? tmpl(d.params) : { label: d.type, detail: "" };
  return { ...d, label, detail };
});



const getDetectionsForView = (vpId) =>
  DETECTIONS.filter(d => d.viewpoint === vpId).sort((a,b) => b.strength - a.strength);

/* ═══════════════════════════════════════════════════════════
   共通コンポーネント
   ═══════════════════════════════════════════════════════════ */



// セグメントコントロール（横スクロール対応）


const LAST_SEEN_DATE = "05/05";


const INITIAL_ARTICLES = [
  {
    id: 1, clusterId: "general", date: "05/07",
    title: "【納豆】中東情勢の影響で値上げ相次ぐ 活路は海外？ 輸出は2017年比で約3倍に増加",
    pub: "日テレNEWS", type: "youtube", score: 95, tone: "neutral",
    thumb: "https://i.ytimg.com/vi/Rw_Hj0U0iug/mqdefault.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.youtube.com/watch?v=Rw_Hj0U0iug",
    embedUrl: "https://www.youtube.com/embed/Rw_Hj0U0iug",
    play: 0, repostCount: 0,
    aiTags: ["値上げ", "中東情勢", "海外展開"],
    body: "納豆の大手メーカーで値上げが相次いでいます。中東情勢の影響を大きく受ける一方で、近年輸出が急増しています。 （2026年5 ...",
    bookmarked: true, memo: "値上げ動向チェック",
    url: "https://www.youtube.com/watch?v=Rw_Hj0U0iug",
  },
  {
    id: 2, clusterId: "general", date: "05/07",
    title: "フランス彼女のカレーに納豆入れてみたw",
    pub: "天然彼女エヴァちゃん", type: "youtube", score: 82, tone: "neutral",
    thumb: "https://scontent-nrt1-2.cdninstagram.com/v/t51.82787-15/641722806_17919242103270485_8928358452495618938_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=102&ccb=7-5&_nc_sid=18de74&oh=00_AfxuacWltq5bFzn2iqxQulThPrcMW3S_w3w1mmzzHxlYDw&oe=69B0D6ED",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.instagram.com/reel/DVia0cggRhl/",
    embedUrl: "https://www.youtube.com/embed/vGh96q_E0j8",
    play: 0, repostCount: 0,
    aiTags: ["納豆"],
    body: "",
    bookmarked: false, memo: null,
    url: "https://www.instagram.com/reel/DVia0cggRhl/",
  },
  {
    id: 3, clusterId: "general", date: "05/07",
    title: "食品容器不足・高騰で販売停止も",
    pub: "中国新聞デジタル", type: "mass", score: 45, tone: "neutral",
    thumb: "https://chugoku-np.ismcdn.jp/mwimgs/1/2/-/img_12d5f7610659d50cb777c63859f0098e37445.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.chugoku-np.co.jp/articles/-/827919",
    share: 0, repostCount: 7,
    aiTags: ["値上げ", "中東情勢"],
    body: "販売を休止した「ぎょうざの満洲」の「冷蔵生ぎょうざ」 中東情勢の混乱が続き、食品包装に使われる石油由来のプラスチック容器不足が起き始めた。一部商品の販売を停止した食品メーカーもある。容器の高騰で納豆やパンの値上げを決めた事業者も出ており、夏",
    bookmarked: false, memo: null,
    url: "https://www.chugoku-np.co.jp/articles/-/827919",
  },
  {
    id: 4, clusterId: "general", date: "05/07",
    title: "「冷蔵品が黄色い液体に浸かっている」 外袋に「人の尿」、コープみらい「不適切な衛生管理事案」謝罪",
    pub: "J-CAST", type: "web", score: 45, tone: "neutral",
    thumb: "https://www.j-cast.com/images/origin/2026/05/news_20260507110524.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.j-cast.com/2026/05/07514406.html",
    share: 0, repostCount: 3,
    aiTags: ["納豆"],
    body: "生活協同組合コープみらいが（本部・さいたま市）2026年5月6日、公式サイトを更新し、「配送委託先における不適切な衛生管理事案とお詫び」を公開した。ビニール袋に、黄色い液体が入っていたとの訴えが発端の事案だ。 ドライバーの「生理現象」が問題",
    bookmarked: false, memo: null,
    url: "https://www.j-cast.com/2026/05/07514406.html",
  },
  {
    id: 5, clusterId: "general", date: "05/07",
    title: "1日3食のつもりが無意識で12食...巨漢芸人が体重を公表 大鶴肥満が大台到達に不安「200kg行ったら」",
    pub: "ENCOUNT", type: "web", score: 45, tone: "neutral",
    thumb: "https://encount.press/wp-content/uploads/2026/02/01143643/2d504022dd668a4f9b4d7c86b93ae7fd.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://encount.press/archives/991874/",
    share: 0, repostCount: 2,
    aiTags: ["納豆"],
    body: "お笑いコンビ・ママタルトが6日、ABC『これ余談なんですけど…』（水曜午後11時10分）に出演。大鶴肥満は公式プロフィールでは体重188キロ（身長182センチ）だが、現在、195キロあると告白し、気づかないうちに1日12食だったことも明かし",
    bookmarked: false, memo: null,
    url: "https://encount.press/archives/991874/",
  },
  {
    id: 6, clusterId: "general", date: "05/06",
    title: "24時間 納豆生活する母#shorts",
    pub: "りおレモン", type: "youtube", score: 82, tone: "neutral",
    thumb: "https://i.ytimg.com/vi/ZAb1UOHRxF8/mqdefault.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.youtube.com/watch?v=ZAb1UOHRxF8",
    embedUrl: "https://www.youtube.com/embed/ZAb1UOHRxF8",
    play: 0, repostCount: 0,
    aiTags: ["納豆"],
    body: "",
    bookmarked: true, memo: "5/1スパイク参照",
    url: "https://www.youtube.com/watch?v=ZAb1UOHRxF8",
  },
  {
    id: 7, clusterId: "general", date: "05/06",
    title: "「政府はもっと危機感を」専門家は警鐘 高市政権で“ナフサ不足”が深刻化...現場は「価格転嫁は避けられない」と悲鳴",
    pub: "女性自身", type: "web", score: 45, tone: "neutral",
    thumb: "https://img.jisin.jp/uploads/2026/05/nafusa_busoku_fb_kyodo.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://jisin.jp/domestic/2581825/",
    share: 1, repostCount: 3,
    aiTags: ["値上げ", "原材料高騰"],
    body: "「4カ月分のナフサは確保している」と説明する高市早苗首相（写真：共同通信） 【一覧あり】ナフサ不足ショックにより値上げされる商品リスト15（他4枚） 「娘夫婦が家を新築中なんですが、工務店から『“ナフサ不足”の影響でキッチンの入荷時期が未定",
    bookmarked: false, memo: null,
    url: "https://jisin.jp/domestic/2581825/",
  },
  {
    id: 8, clusterId: "general", date: "05/05",
    title: "「俺は大丈夫」と笑っていたのに...年金月10万円・83歳父がアパートで昏倒。息子が見た「食費1日300円」極限生活の果",
    pub: "ゴールドオンライン", type: "web", score: 45, tone: "neutral",
    thumb: "https://ggo.ismcdn.jp/mwimgs/2/f/1200w/img_2f7cc423eded1c8a474cb0cc20e3d16f191178.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://gentosha-go.com/articles/-/76512",
    share: 0, repostCount: 3,
    aiTags: ["納豆"],
    body: "「子どもにも、誰にも迷惑をかけたくない」と、生活が苦しくても援助を求めようとしない……。実は、そんな気遣いをするシニアは少なくありません。しかし、その結果、最悪の事態が起きてしまったら、気づけなかったという深い傷を子どもの心に一生残すことに",
    bookmarked: false, memo: null,
    url: "https://gentosha-go.com/articles/-/76512",
  },
  {
    id: 9, clusterId: "general", date: "05/04",
    title: "美味しいで噂の納豆チップルがあるので食べてみてガチレビューしてみた結果は？",
    pub: "Fischer's-セカンダリ-", type: "youtube", score: 95, tone: "neutral",
    thumb: "https://i.ytimg.com/vi/o5VS9PBS8jM/mqdefault.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.youtube.com/watch?v=o5VS9PBS8jM",
    embedUrl: "https://www.youtube.com/embed/o5VS9PBS8jM",
    play: 48545, repostCount: 0,
    aiTags: ["納豆"],
    body: "チャンネル登録よろしくね！ □https://goo.gl/lnK83H ☆メインはこっち！「Fischer's-フィッシャーズ-」 ...",
    bookmarked: false, memo: null,
    url: "https://www.youtube.com/watch?v=o5VS9PBS8jM",
  },
  {
    id: 10, clusterId: "general", date: "05/03",
    title: "イオンの納豆売り場で店員の人が「ナフサのため品薄が予想されます！今のうちに買い溜めを！」と呼びかけている",
    pub: "ultraviolet @raurublock", type: "twitter", score: 82, tone: "neutral",
    thumb: null,
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://x.com/raurublock/status/2050829490742612397",
    embedId: "2050829490742612397",
    views: 4820, repostCount: 12,
    aiTags: ["原材料高騰"],
    body: "イオンの納豆売り場で店員の人が「ナフサのため品薄が予想されます！今のうちに買い溜めを！」と呼びかけている",
    bookmarked: false, memo: null,
    url: "https://x.com/raurublock/status/2050829490742612397",
  },
  {
    id: 11, clusterId: "general", date: "05/03",
    title: "ミツカン「納豆」一部商品を5・1から休売 全19商品を6・1から値上げ...「ナフサ価格」理由に【詳細】",
    pub: "ORICON NEWS", type: "web", score: 45, tone: "neutral",
    thumb: "https://contents.oricon.co.jp/upimg/news/2453000/2452671/20260503_164721_p_o_59749399.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.oricon.co.jp/news/2452671/full/",
    share: 0, repostCount: 10,
    aiTags: ["値上げ", "ミツカン", "原材料高騰"],
    body: "株式会社Mizkan（ミツカン）は5月1日、納豆商品について、価格改定（6月1日～）と一部休売（5月1日～）を発表した。 【画像】なっとういち 『押すだけプシュッ!と』超小粒3P 同社は「直近、中東地域における情勢不安の長期化を背景に、石油",
    bookmarked: false, memo: null,
    url: "https://www.oricon.co.jp/news/2452671/full/",
  },
  {
    id: 12, clusterId: "general", date: "05/01",
    title: "中東情勢悪化で納豆値上げ ミツカン、最大20%",
    pub: "秋田魁新報電子版", type: "mass", score: 45, tone: "neutral",
    thumb: "https://cdn.sakigake.jp/newspack/PN2026050101001782.-.-.CI0003.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.sakigake.jp/news/article/20260501CO0084/",
    share: 2, repostCount: 29,
    aiTags: ["値上げ", "ミツカン", "原材料高騰"],
    body: "ミツカン（愛知県半田市）は1日、納豆商品を6月1日に値上げすると発表した。税別の参考小売価格で6～20％引き上げる。大豆などの仕入れ価格が上昇したほか、中東情勢悪化で納豆パックの原料となるナフサ価格が高騰したため。一部商品は5月1日に販売休",
    bookmarked: false, memo: null,
    url: "https://www.sakigake.jp/news/article/20260501CO0084/",
  },
  {
    id: 13, clusterId: "general", date: "05/01",
    title: "ミツカン 納豆を最大2割値上げ ナフサ高騰で",
    pub: "琉球朝日放送", type: "mass", score: 45, tone: "neutral",
    thumb: "https://www.qab.co.jp/quebee/wp-content/uploads/000502415_640.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.qab.co.jp/quebee/video/000502415/",
    share: 0, repostCount: 4,
    aiTags: ["値上げ", "ミツカン", "原材料高騰"],
    body: "全国ニュース27 回視聴・49 分前 中東情勢の影響で、納豆を最大で20％値上げします。 ミツカンは、納豆のすべての商品19品目を、来月1日に6％から20％値上げすると発表しました。 大豆などの原料が高騰しているほか、中東情勢の長期化でナフ",
    bookmarked: false, memo: null,
    url: "https://www.qab.co.jp/quebee/video/000502415/",
  },
  {
    id: 14, clusterId: "general", date: "05/01",
    title: "福生市“ハンマー殴打”男を逮捕 母親「安心した」 習志野市のアパートに...居住者との関係性わからず",
    pub: "日テレNEWS NNN", type: "mass", score: 45, tone: "neutral",
    thumb: "https://news.ntv.co.jp/gimage/n24/articles/2cb5dfa7d2e34a54a0913f61fb0c87fa/20260501-175935-099-ch03-09-5376f1a8-1.jpg?w=1200",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://news.ntv.co.jp/category/society/29dda234a55b49ff978a075a2ffd6c55",
    share: 0, repostCount: 4,
    aiTags: ["納豆"],
    body: "東京都福生市で、ハンマーで少年を殴るなどし、逃走していた男が1日午後、殺人未遂の疑いで逮捕されました。逮捕を受けて、母親が取材に応じました。■母親「切り離された生活」高林輝行容疑者（44）は逃走から56時間あまりの1日午後4時過ぎ、殺人未遂",
    bookmarked: false, memo: null,
    url: "https://news.ntv.co.jp/category/society/29dda234a55b49ff978a075a2ffd6c55",
  },
  {
    id: 15, clusterId: "general", date: "05/01",
    title: "ミツカン「金のつぶ」シリーズなど納豆商品を6月から最大20%値上げへ ナフサ価格高騰などで",
    pub: "TBS NEWS DIG", type: "mass", score: 45, tone: "neutral",
    thumb: "https://newsdig.ismcdn.jp/mwimgs/2/1/1200w/img_21aa1060dfb28e502e5b87e65f474aea314379.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://newsdig.tbs.co.jp/articles/-/2638047?display=1",
    share: 0, repostCount: 7,
    aiTags: ["値上げ", "ミツカン", "原材料高騰"],
    body: "中東情勢の影響がごはんのお供にも出始めました。「金のつぶ」シリーズなどの納豆が最大20%値上げされます。 ミツカンは6月1日から、すべての納豆商品を6%から20%値上げすると発表しました。 対象となるのは、「金のつぶ たれたっぷり！たまご醤",
    bookmarked: false, memo: null,
    url: "https://newsdig.tbs.co.jp/articles/-/2638047?display=1",
  },
  {
    id: 16, clusterId: "general", date: "05/01",
    title: "「ミツカン」 納豆“最大2割”の値上げへ パックや包装フィルムに使う「ナフサ」が高騰 きょうから販売休止商品も",
    pub: "CBC web", type: "mass", score: 45, tone: "neutral",
    thumb: "https://newsdig.ismcdn.jp/mwimgs/c/b/1200w/img_cbc9a2cf626b05e6e0909f6e720d9ded97766.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://newsdig.tbs.co.jp/articles/cbc/2637683?display=1",
    share: 0, repostCount: 7,
    aiTags: ["値上げ", "ミツカン", "原材料高騰"],
    body: "大手食品メーカー｢ミツカン｣は中東情勢の影響を受け、納豆商品を最大2割値上げすると発表しました。 愛知県半田市に本社を置く大手食品メーカー｢ミツカン｣は、6月1日から納豆商品すべてで最大2割の値上げを行います。 例えば、｢金のつぶ たれたっ",
    bookmarked: false, memo: null,
    url: "https://newsdig.tbs.co.jp/articles/cbc/2637683?display=1",
  },
  {
    id: 17, clusterId: "general", date: "04/30",
    title: "中東情勢の悪化が直撃！5月から豆腐・納豆・豚肉など値上がり 家計防衛のお得な野菜情報",
    pub: "HTB北海道ニュース", type: "youtube", score: 82, tone: "neutral",
    thumb: "https://www.htb.co.jp/news/photo/37313_45956.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.htb.co.jp/news/archives_37313.html",
    embedUrl: "https://www.youtube.com/embed/jRWkAwt0D-U",
    play: 6297, repostCount: 0,
    aiTags: ["値上げ", "中東情勢", "発酵食品"],
    body: "あす（1日）から５月。連休もあり、つい出費も増えてしまいがちですがこれから、値上げするものと、いまお買い得なものを、 ...",
    bookmarked: false, memo: null,
    url: "https://www.htb.co.jp/news/archives_37313.html",
  },
  {
    id: 18, clusterId: "general", date: "04/30",
    title: "ただ納豆を食べても痩せません。納豆だけ食べるのは損なので、これ真似してみてください",
    pub: "たくみ先生｜食べ過ぎダイエット @biyou_ta", type: "twitter", score: 75, tone: "neutral",
    thumb: null,
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://x.com/biyou_takumi_/status/2049762401369915731",
    embedId: "2049762401369915731",
    views: 28500, repostCount: 87,
    aiTags: ["納豆"],
    body: "ただ納豆を食べても痩せません。 納豆だけ食べるのは損なので、これ真似してみてください http://x.com/i/article/1890692336067436545…",
    bookmarked: false, memo: null,
    url: "https://x.com/biyou_takumi_/status/2049762401369915731",
  },
  {
    id: 19, clusterId: "general", date: "04/28",
    title: "“日本一の納豆”がピンチ「豆以外が全部値上がり」 ごみ袋「作れない」緊急事態 家庭向け月24万枚...どう確保 愛知・大",
    pub: "中京テレビNEWS", type: "youtube", score: 82, tone: "neutral",
    thumb: "https://i.ytimg.com/vi/SpKUgR306po/mqdefault.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.youtube.com/watch?v=SpKUgR306po",
    embedUrl: "https://www.youtube.com/embed/SpKUgR306po",
    play: 13892, repostCount: 0,
    aiTags: ["納豆"],
    body: "愛知県大府市にある創業62年の「高丸食品」。全国からえりすぐりの納豆が集まるコンテストで日本一に輝いた、粘り気の強い ...",
    bookmarked: false, memo: null,
    url: "https://www.youtube.com/watch?v=SpKUgR306po",
  },
  {
    id: 20, clusterId: "general", date: "04/28",
    title: "納豆に入れて美味しい物を3つあげられますか？",
    pub: "@もつ @kikomotu", type: "twitter", score: 82, tone: "neutral",
    thumb: null,
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://x.com/kikomotu/status/2008297464517079372",
    embedId: "2048960467893399627",
    views: 1200, repostCount: 3,
    aiTags: ["納豆"],
    body: "納豆に入れて美味しい物を3つあげられますか？",
    bookmarked: false, memo: null,
    url: "https://x.com/kikomotu/status/2008297464517079372",
  },
  {
    id: 21, clusterId: "general", date: "04/25",
    title: "我が家の子供達が発明した名もなき遊び。1 納豆パックの蓋に水性ペンで色をつける。何色か重ねたほうが楽しい。2 木工用ボン",
    pub: "くろめ @chromedium96", type: "twitter", score: 95, tone: "neutral",
    thumb: null,
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://x.com/chromedium96/status/2047832721737810331",
    embedId: "2047832721737810331",
    views: 152000, repostCount: 420,
    aiTags: ["納豆"],
    body: "我が家の子供達が発明した名もなき遊び。 1 納豆パックの蓋に水性ペンで色をつける。何色か重ねたほうが楽しい。 2 木工用ボンドを豪快に絞り出す 3 綿棒で混ぜる 4 半日〜一日乾かす 作業そのものがちびっこには楽しく、乾かすと思いがけない色",
    bookmarked: false, memo: null,
    url: "https://x.com/chromedium96/status/2047832721737810331",
  },
  {
    id: 22, clusterId: "general", date: "04/25",
    title: "納豆にはからし絶対いれたい！唐揚げにはレモンかけたい！#tiktok #dance",
    pub: "Mumeixxx【むめい】", type: "youtube", score: 95, tone: "neutral",
    thumb: "https://i.ytimg.com/vi/EEzsbK70bPM/mqdefault.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.youtube.com/watch?v=EEzsbK70bPM",
    embedUrl: "https://www.youtube.com/embed/EEzsbK70bPM",
    play: 209715, repostCount: 0,
    aiTags: ["納豆"],
    body: "",
    bookmarked: false, memo: null,
    url: "https://www.youtube.com/watch?v=EEzsbK70bPM",
  },
  {
    id: 23, clusterId: "general", date: "04/25",
    title: "納豆ごはんといえば、納豆を混ぜてご飯の上にかけるのが普通だと思いますが...【納豆とご飯を混ぜて空気を含ませるようにして",
    pub: "だれウマ/料理研究家 @muscle1046", type: "twitter", score: 65, tone: "neutral",
    thumb: null,
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://x.com/muscle1046/status/2047908675353002028",
    embedId: "2047908675353002028",
    views: 89300, repostCount: 215,
    aiTags: ["納豆"],
    body: "納豆ごはんといえば、納豆を混ぜてご飯の上にかけるのが普通だと思いますが… 【納豆とご飯を混ぜて空気を含ませるようにして混ぜる】 これでふわっふわになってとても美味。 騙されたと思って是非お試しください。 詳しい作り方やポイントは下記から！ ",
    bookmarked: false, memo: null,
    url: "https://x.com/muscle1046/status/2047908675353002028",
  },
  {
    id: 24, clusterId: "general", date: "04/24",
    title: "浜田が披露する納豆の裏ワザ #旅行 #ダウンタウンプラス",
    pub: "DOWNTOWN+(ダウンタウンプラス)", type: "youtube", score: 82, tone: "neutral",
    thumb: "https://i.ytimg.com/vi/hotRy4ypCfc/mqdefault.jpg",
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://www.youtube.com/watch?v=hotRy4ypCfc",
    embedUrl: "https://www.youtube.com/embed/hotRy4ypCfc",
    play: 3604924, repostCount: 0,
    aiTags: ["納豆"],
    body: "続きはDOWNTOWN+(ダウンタウンプラス)で配信中！",
    bookmarked: false, memo: null,
    url: "https://www.youtube.com/watch?v=hotRy4ypCfc",
  },
  {
    id: 25, clusterId: "general", date: "04/24",
    title: "「納豆を混ぜる」という表現、何と何を「混ぜて」いるのか積年の疑問(醤油というわけではなさそう)",
    pub: "Mitchara @Mitchara", type: "twitter", score: 82, tone: "neutral",
    thumb: null,
    favicon: "https://t0.gstatic.com/faviconV2?client=SOCIAL&url=https://x.com/Mitchara/status/2047459753614561668",
    embedId: "2047459753614561668",
    views: 6700, repostCount: 18,
    aiTags: ["納豆"],
    body: "「納豆を混ぜる」という表現、何と何を「混ぜて」いるのか積年の疑問（醤油というわけではなさそう） 「みなさんは納豆を混ぜますか？」 奇妙な質問に思えるかもしれませんが、世の中には混ぜない宗派があるらしいのです。信仰の自由です。試さずに否定する",
    bookmarked: false, memo: null,
    url: "https://x.com/Mitchara/status/2047459753614561668",
  },
];
// INITIAL_ARTICLES にも取扱いフィールドを付与
INITIAL_ARTICLES.forEach(a => {
  if (a.title.includes("納豆")) a.toriatsukai = "タイトル";
  else a.toriatsukai = "冒頭";  // Watch用モック: タイトルに納豆なし→冒頭扱い
});






/* ═══════════════════════════════════════════════════════════
   ハイライト帯テキスト（WatchInsightBar 用）
   AI生成想定。プロトタイプではハードコード
   ───────────────────────────────────────────────────────────
   Input:  (1) 当日記事一覧（title, pub, type, aiTags, score, share/play/views）+ 前2日
           (2) 検知エンジン出力（DETECTIONS_RAW: type, strength, params）
   Prompt: 因果語禁止、常体、3〜5文、定量定性バランス、具体名、対比表現
           検知シグナルがあれば定量的裏付けとして織り込む（「57%増」等）
           検知がない日も記事メタデータだけでハイライト生成可
   Output: segments 配列（string | { t, ids }）+ collapsed 1文
   ═══════════════════════════════════════════════════════════ */
const HIGHLIGHT_SEGMENTS = [
  { t: "ミツカンの納豆値上げ（最大20%）が5/1に一斉報道", ids: [12] },
  "、",
  { t: "ナフサ高騰・中東情勢", ids: [13] },
  "が主因で主要テレビ局が横並びで取り上げた。",
  { t: "5/7時点でも日テレが追報", ids: [1] },
  "し、海外輸出増の文脈と接続。一方でYouTubeは",
  { t: "エンタメ系（バズ動画・納豆学校）", ids: [1] },
  "が再生数上位を占め、値上げニュースとの温度差が目立つ。",
  { t: "Xでは消費者の値上げ実感ポスト", ids: [3] },
  "が散発的に出ている。",
];
const HIGHLIGHT_COLLAPSED = "ミツカン納豆値上げ（最大20%）が5/1一斉報道。ナフサ・中東が主因。YTはエンタメ優勢で温度差";
const HIGHLIGHT_DATE = "5/7";



const MIN_PANE = 400;
const MAX_PANE = 560;

/* --- リサイズ可能ペイン — ドラッグハンドル + localStorage永続化 --- */


/* ═══════════════════════════════════════════════════════════
   トレンドデータ + Maturity 関連（ReportMode 依存）
   ═══════════════════════════════════════════════════════════ */
const TRENDS = [
  {
    id: "t1", topic: "値上げ・ナフサ高騰", maturity: "peak", confidence: 92,
    articles: 203, velocity: "+1925%",
    signals: [
      { type: "volume", label: "5/1に一斉報道、7日間で203件", strength: 3 },
      { type: "spread", label: "テレビ→YouTube→Xに波及", strength: 3 },
      { type: "duration", label: "5/7時点でも追報あり", strength: 2 },
    ],
    insight: "ミツカンの最大20%値上げ発表がトリガー。ナフサ価格高騰と中東情勢が背景。主要テレビ局が横並びで報じ、5/7時点でも日テレが海外輸出の文脈で追報。",
    consumerAngle: "家計直撃の実感 — Xでは「スーパーで値上がりを実感」の声が散発。消費者の価格感度が高いテーマ。",
  },
  {
    id: "t2", topic: "レシピ・アレンジ", maturity: "growing", confidence: 78,
    articles: 129, velocity: "+10%",
    signals: [
      { type: "volume", label: "安定的に週129件前後", strength: 2 },
      { type: "spread", label: "YouTube・Xが中心", strength: 2 },
      { type: "engagement", label: "再生数上位にレシピ動画が常駐", strength: 3 },
    ],
    insight: "「世界一うまい納豆の食べ方」系コンテンツが継続的にエンゲージメント獲得。料理研究家のUGCが牽引し、キムチ・パスタ等の組み合わせが定番化。",
    consumerAngle: "定番食材の新しい楽しみ方 — 「飽き」への対策として新レシピが求められている。",
  },
  {
    id: "t3", topic: "健康・腸活", maturity: "growing", confidence: 81,
    articles: 46, velocity: "-26%",
    signals: [
      { type: "volume", label: "7日間で46件", strength: 2 },
      { type: "spread", label: "YouTube健康チャンネルが主導", strength: 2 },
      { type: "duration", label: "通年で安定した関心", strength: 2 },
    ],
    insight: "「腸活」「ダイエット」の文脈で定着。健康系YouTuberの検証動画が継続的に再生数を稼いでいる。",
    consumerAngle: "健康維持の手軽な手段としての納豆 — 「朝食に加えるだけ」の簡便性がUGC拡散の主因。",
  },
  {
    id: "t4", topic: "納豆学校（TikTok）", maturity: "fading", confidence: 58,
    articles: 32, velocity: "+10%",
    signals: [
      { type: "volume", label: "ピーク比で減少傾向", strength: 1 },
      { type: "spread", label: "TikTok→YouTube転載が中心", strength: 1 },
      { type: "duration", label: "4月中旬がピーク", strength: 1 },
    ],
    insight: "TikTokのダンストレンド「納豆学校」の派生コンテンツ。4月中旬にピークを迎え、直近は沈静化傾向。",
    consumerAngle: "Z世代のミーム消費 — 納豆ブランドとの直接的関連は薄いが、若年層への認知には寄与。",
  },
];

/* ═══════════════════════════════════════════════════════════
   Maturity — 成熟度ライフサイクル（v4継承）
   ═══════════════════════════════════════════════════════════ */



const MATURITY_META = {
  emerging: { label: "Emerging", icon: Sprout, color: T.emerging, bg: T.emergingSoft, desc: "新出" },
  growing:  { label: "Growing",  icon: Flame,  color: T.growing,  bg: T.growingSoft,  desc: "拡大中" },
  peak:     { label: "Peak",     icon: Mountain, color: T.peak,   bg: T.peakSoft,     desc: "ピーク" },
  fading:   { label: "Fading",   icon: Sunset, color: T.fading,   bg: T.fadingSoft,   desc: "沈静化" },
};



const FAVICON_COLORS = {
  mass: "#1e3a5f",
  web: "#6366f1",
  youtube: "#ef4444",
  twitter: "#64748b",
};
/* Badge path — scalloped seal */


/* ═══════════════════════════════════════════════════════════
   caiwai 招待UIコンポーネント群 v1（2026-04-28）
   ─────────────────────────────────────────────────────────
   準拠: caiwai_実装ロードマップ_v2.md §7.5 文脈適応設計
         caiwai_コピー集_v1.md §3, §5
   方針: theme(T) と font はモジュール定数を直接参照
   ═══════════════════════════════════════════════════════════ */

/* AI招待文サンプル（コピー集 §4 から3パターン抜粋） */
const INVITE_TEMPLATES = [
  {
    id: "formal",
    label: "ビジネスフォーマル",
    body: `[受け手名]様

いつもお世話になっております。
[送り手名]です。

ご業務に役立ちそうな情報整理サービスを
ご紹介させていただきたく、ご連絡いたしました。

「caiwai」という、業界カテゴリー別のAIキュレーション
マガジンサービスです。私自身、業界の動きを毎朝
キャッチするのに利用しています。

招待制のサービスのため、下記URLからご登録いただけます：
[?ref URL]

ご検討いただけますと幸いです。

[送り手名]`,
  },
  {
    id: "casual",
    label: "カジュアル業界仲間",
    body: `[受け手名]さん

最近見つけて毎朝チェックしてる「caiwai」というサービス、
業界関連のニュース・SNS・YouTubeをAIがまとめてくれて、
すごく便利なんで共有します。

招待制なんですが、下記URLからどうぞ：
[?ref URL]

業界の動きを朝5分でキャッチできるので、
朝の情報収集が楽になりました。

[送り手名]`,
  },
  {
    id: "niche",
    label: "ニッチ発見をシェア",
    body: `[受け手名]さん

業界のまとまった情報源が少ないと感じていませんか。
最近「caiwai」という界隈別のAIキュレーションマガジンを
使い始めて、毎朝業界界隈の動きが整理された状態で届くように
なりました。

業界紙には載らないニッチな話題までカバーされていて、
業界仲間との会話のネタにもなっています。

招待制ですが、下記URLからご登録可能です：
[?ref URL]

ご興味あれば。

[送り手名]`,
  },
];

/* ─── 共通: モーダルバックドロップ ─── */

export {
  SOURCES, NEWS_SUB_SOURCES,
  TORIATSUKAI_OPTIONS, TORIATSUKAI_DEFAULT,
  PERIOD_OPTIONS,
  DOMAIN_DATA, ARTICLES, _HONBUN_IDS,
  DAILY_ALL, CHIP_TIMELINE, DATA_DATE_RANGE, CHIP_MAX_COUNT, CHIP_CONNECTED_WORDS,
  DETECTION_TEMPLATES, DETECTIONS_RAW, DETECTIONS, getDetectionsForView,
  LAST_SEEN_DATE,
  INITIAL_ARTICLES,
  HIGHLIGHT_SEGMENTS, HIGHLIGHT_COLLAPSED, HIGHLIGHT_DATE,
  MIN_PANE, MAX_PANE,
  TRENDS, MATURITY_META, FAVICON_COLORS,
  INVITE_TEMPLATES,
};
