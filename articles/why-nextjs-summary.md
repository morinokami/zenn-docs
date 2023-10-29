---
title: "Next.js に対する Kent C.Dodds の批判と、Lee Robinson のアンサーの要約"
emoji: "🤔"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["nextjs", "react"]
published: false
---

## はじめに

## The Web Platform (ウェブというプラットフォームの軽視)

kentcdodds 曰く:

- Next.js はウェブ標準の API をラップしており、Next.js 特有の API の使用をユーザーに強いる。[Testing Library](https://testing-library.com/) が登場する前の [Enzyme](https://enzymejs.github.io/enzyme/) と同じような立ち位置にあり、Next.js で学んだ知識には可搬性 (transferability) がない。ウェブ標準の API、たとえば `Request` や `Response` を適切に提供している Remix を使おう。

leerob 曰く:

- Next.js は Remix よりも歴史が長く、Pages Router など過去の機能については、確かにウェブ標準の API よりも Node.js の API に近い。しかし Remix v1 がリリースされた 2021 年には、Next.js も [Middleware](https://nextjs.org/blog/next-12#introducing-middleware) でウェブ API をサポートし始めている。さらに App Router の [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) においては、`Request` や `Response` だけでなく、それらを抽象化した [`cookies()`](https://nextjs.org/docs/app/api-reference/functions/cookies) や [`headers()`](https://nextjs.org/docs/app/api-reference/functions/headers) まで提供している。Next.js は、Remix など他のフレームワークと同様に、ウェブ API を重要視している。

## Independence (Vercel との癒着)

kentcdodds 曰く:

- Next.js を [Vercel](https://vercel.com/) 以外でまともに動かすことは難しい。Vercel は自社のホスティングプラットフォームをプロモートしたいので、他の場所にデプロイしやすくするというインセンティブが存在しないのだろう。その帰結として [OpenNext](https://open-next.js.org/) というプロジェクトまで登場している。JavaScript が動くプラットフォームであればどこにでもデプロイ可能な Remix を使おう。

leerob 曰く:

- 我々は Next.js を Docker でセルフホストするための[動画](https://www.youtube.com/watch?v=Pd2tVxhFnO4)や[コード例](https://github.com/vercel/next.js/tree/canary/examples/with-docker)を公開している。多くの名だたる企業が `next start` コマンドにより Next.js を動かしているという事実を認識すべきだろう。
- Vercel は [Framework-defined infrastructure](https://vercel.com/blog/framework-defined-infrastructure) (FdI) というビジョンを掲げている。そこでは、フレームワークを動かすための IaC を開発者が自ら定義することはなく、逆にフレームワークの各構成要素が自動生成された IaC を介しインフラ要素へとマッピング・デプロイされる。そして Vercel プラットフォームにおけるマッピングの仕様は [Build Output API](https://vercel.com/docs/build-output-api/v3) により公開されており、Next.js はもちろんのこと、Remix や Astro など他のフレームワークの Vercel アダプタもこの仕様に沿ってビルドを出力する。(注: 以下は筆者の想像を含む) このように、フレームワークは自己の機能の開発に注力し、インフラはフレームワークを自己の要素へとマッピングする統一的な仕組みを準備する、という両者の棲み分けを理想としているため、他の各サーバーレス環境への Next.js アダプターを公式に提供することはしていない。 
- TODO: pricing-correlation-or-causation

（ここでの leerob はハイコンテクストで歯切れが悪く感じるな。Framework-defined infrastructure が他プラットフォームへのアダプターを作成しないことへの excuse として使われるのは意外だ）

## Next.js is eating React (React への侵食)

kentcdodds 曰く:

- Next.js は React と一体化しつつあり、両者の境界線は曖昧になりつつある。多数の React チームメンバーが Vercel に移籍したが、そのせいで React チームはますます非協力的になってしまった。非協力的なチームはソフトウェアにとって良くない兆候だ。

leerob 曰く:

- 最近になって React のドキュメントにおいても `useFormStatus` や [tainting](https://react.dev/reference/react/experimental_taintUniqueValue) に関する記述が登場するようになり、React の API を Next.js が使用しているという関係がわかりやすくなったはずだ。両者の境界が分かりにくくなっていたことは事実ではあるが意図したものではなく、今後は線引をより明確にするよう努めたい。

(筆者も kentcdodds と同様に両者の境界が曖昧であると感じており、たとえば Server Actions はこのツイートを見るまで Next.js の機能であると誤解していた。この点について leerob も認めていると思われるので、今後の改善に期待したい。また、React チームが非協力的になってきたという意見については客観的な証拠もなく、これだけでは kentcdodds の一方的な思い込みとしか判断できない)

## Experimenting on my users (実験台になるユーザー)

Kent C. Dodds 曰く:

- Next.js は安定版と称して React のカナリア版の機能を自身に組み込んでいる。その結果ユーザーのアプリケーションは不安定な実験台とされている。App Router で苦しんでいる人の数は殊の外多いようだ。React の安定した機能のみが組み込まれている Remix を使おう。RSC は安定してから使えばいい。

leerob 曰く:

- React の[ブログ記事](https://react.dev/blog/2023/05/03/react-canaries)に名言されている通り、カナリア版をフレームワークが採用することについて問題はない。確かに App Router に関して改善すべき点は多いが、それはカナリア版が悪いというわけではなく、我々の実装の問題だ。RSC はすでに多くのトップサイトで採用されており、十分に production ready といえる。

(React 側のブログ記事を読む限り、leerob の主張の通り、カナリア版の使用自体は問題なさそう。ユーザーで実験しているというのは明らかに言い過ぎで、ポジショントークに近い)

## Too much magic (多すぎる魔法)

kentcdodds 曰く:

- グローバルの `fetch` をオーバーライドしたキャッシュ機能の追加など、Next.js はユーザーが予測不可能な機能追加を多くおこなっている。その結果 Next.js のユーザーは、こういった予測不可能な機能追加が他にもあるかどうか疑心暗鬼にならざるを得ない。驚き最小の原則に従って設計され、選択的に魔法を使用可能な Remix を使おう。

leerob 曰く:

- `fetch` に関してはその通りだろう。コミュニティからのフィードバックをもとに改善の方向性を決めていきたい。

## Complexity (複雑さ) と Stability (安定性)

kentcdodds 曰く:

- Next.js はどんどん複雑になっている。React の Server Actions はフォームを POST に変えてしまうが、セマンティクスの変更は複雑度を増加させる。こうした API をそのまま取り入れ複雑度の増大に加担する Next.js ではなく、複雑度を最小限に抑えて API を設計している Remix を使おう。

leerob 曰く:

- App Router は Pages Router とは別のモデルであり、ほぼ新しいフレームワークとすらいえる。学びの場として新しく[チュートリアル](https://nextjs.org/learn)を提供している。

(leerob は「複雑でない」とはっきり否定すべきだが、そのように言わないため歯切れが悪く感じる。セマンティクスの変更などについてはハッキリとした理由を示してくれないと不安になる。ただ一方で、複雑でないことを証明することもまた難しいのはわかる)

kentcdodds 曰く:

- Next.js は次々にメジャーバージョンの更新をおこなっており、安定性への配慮が欠けている。Remix は 2 年近くバージョン 1 をキープし、一ヶ月前のバージョン 2 のリリースは、その安定性の高さから「ウェブフレームワーク史上最も退屈なメジャーバージョンの増加」となった。安定性を重視するなら Remix を使おう。

leerob 曰く:

- メジャーバージョンの数とフレームワークの安定性とは何の関係もない。

## おわりに
