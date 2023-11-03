---
title: "Next.js に対する Kent C. Dodds の批判と、Lee Robinson のアンサーの要約"
emoji: "🤔"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["nextjs", "react"]
published: true
---

## はじめに

10 月 26 日に [Next.js Conf](https://nextjs.org/conf) が開催されましたが、それと前後して [Kent C. Dodds](https://twitter.com/kentcdodds) (以下 kentcdodds と呼びます) と [Lee Robinson](https://twitter.com/leeerob) (以下 leerob と呼びます) がそれぞれ

https://www.epicweb.dev/why-i-wont-use-nextjs

https://leerob.io/blog/using-nextjs

という記事を公開しました。前者はタイトルの通り、Testing Library の作者であり、Remix の共同創業者の一人でもある開発者兼教育者 kentcdodds が、Next.js を使わない理由について述べたものです。そして後者は、Vercel の VP of Developer Experience である leerob が、主に前者に対する反論を述べたものです。筆者は両方の記事を公開後すぐに面白く読み、そしてどちらにも頷けるところがあったため、両者の主張を要約してまとめてみることにしました。筆者が重要だと感じた箇所にフォーカスし大胆に要約していますが、あくまで一つの切り取り方であるため、二人の主張を正確に知りたい場合は是非原文に当たることをオススメします。また、両記事ともに公開後も更新され続けているため、時間の経過に伴い以下の内容とのズレが生じる可能性についても留意してください。

以下の各セクションでは、まず kentcdodds の主張を要約し、続いて leerob の反論を要約しています。筆者の感想も付記していますが、あくまで感想ですので流し読みしていただければ幸いです。また、セクションのタイトルは kentcdodds の記事の見出しをそのまま引用し、また括弧内で筆者が読み取った彼の主張の要点 (基本的に Next.js への不満) と思われるものを日本語で表現しています。

## The Web Platform (ウェブというプラットフォームに対する軽視)

kentcdodds 曰く:

- Next.js はウェブ標準の API をラップしており、Next.js 特有の API の使用をユーザーに強いる。[Testing Library](https://testing-library.com/) が登場する前の [Enzyme](https://enzymejs.github.io/enzyme/) と同じような立ち位置にあり、Next.js で学んだ知識には可搬性 (transferability) がない。`Request` や `Response` などウェブ標準の API を適切に提供している Remix を使おう。

leerob 曰く:

- Next.js は Remix よりも歴史が長く、Pages Router など過去の機能については、確かにウェブ標準の API よりも Node.js の API に近い。しかし Remix v1 がリリースされた 2021 年には、Next.js も [Middleware](https://nextjs.org/blog/next-12#introducing-middleware) でウェブ API をサポートし始めている。さらに [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) においては、`Request` や `Response` だけでなく、それらを抽象化してより使いやすくした [`cookies()`](https://nextjs.org/docs/app/api-reference/functions/cookies) や [`headers()`](https://nextjs.org/docs/app/api-reference/functions/headers) まで提供している。Next.js は、Remix など他のフレームワークと同様に、ウェブ API を重要視している。

筆者感想: ここでは leerob の反論が妥当であるように感じられます。`cookies()` が引数として `Request` を取らないことに多少の奇妙さ (後に出てくる言葉を使えば magic 感) を覚えたり、あるいは https://pilcrow.vercel.app/blog/nextjs-why で書かれているように API の設計に一貫性のなさを感じることはあるものの、Next.js がウェブ API に向き合うことを重要視し始めていることはわかります。kentcdodds は Next.js に関する古い認識に (わざと？) 基づいて印象操作をしているのでしょうか。初っ端で少し不安になってきました。

## Independence (Vercel との癒着)

kentcdodds 曰く:

- Next.js を [Vercel](https://vercel.com/) 以外でまともに動かすことは一筋縄ではいかない。Next.js と Vercel はほぼ一体であり、Next.js を Vercel 以外にデプロイすれば、ドキュメントに書かれている通りに動かすことは難しいだろう。その帰結として [OpenNext](https://open-next.js.org/) というプロジェクトまで登場している。Vercel は自社のホスティングプラットフォームをプロモートしたいので、他の場所にデプロイしやすくするというインセンティブが存在しないのだろう。JavaScript が動くプラットフォームであればどこにでもデプロイ可能な Remix を使おう。

leerob 曰く:

- 我々は Next.js を Docker でセルフホストするための[動画](https://www.youtube.com/watch?v=Pd2tVxhFnO4)や[コード例](https://github.com/vercel/next.js/tree/canary/examples/with-docker)を公開している。多くの名だたる企業が `next start` コマンドにより Next.js を動かしているという事実を認識すべきだろう。
- Vercel は [Framework-defined infrastructure](https://vercel.com/blog/framework-defined-infrastructure) (FdI) というビジョンを掲げている。そこでは、フレームワークを動かすための IaC を開発者が自ら定義するのではなく、逆にフレームワークの各構成要素が自動生成された IaC を介しインフラ要素へとマッピング・デプロイされる。そして Vercel プラットフォームにおけるマッピングの仕様は [Build Output API](https://vercel.com/docs/build-output-api/v3) により公開されており、Next.js はもちろんのこと、Remix や Astro など他のフレームワークの Vercel アダプタもこの仕様に沿ってビルドを出力する。(注: 以下は筆者の想像を含む) このように、フレームワークは自己の機能の開発に注力し、インフラはフレームワークを自己の要素へとマッピングする統一的な仕組みを準備する、という両者の棲み分けを理想としているため、他のサーバーレス環境への Next.js アダプターを公式に提供することはしていない。 
- ユーザーが Vercel から離れられないようにすることで Vercel が儲けようとしているというが、それは間違っている。上述したように Next.js を他のプラットフォームにセルフホストすることは容易だ。確かに Vercel でホストするユーザーが増えれば Vercel は儲かるが、そのために Vercel 以外のプラットフォームでのデプロイを難しくしているということではなく、逆に Vercel が極めて優れたインフラの抽象化であり、その結果単にデプロイが容易であるだけなのだ。

筆者感想: ここでの leerob の議論は少しハイコンテクストなものとなっており、若干歯切れが悪く感じます。結局のところ、資金面やサービスのインフラ構成など様々な事情によって Vercel 以外の場所で Next.js を動かしたいという需要が少なからずあること、また単にコンテナ上で動かすだけでは Next.js の様々な機能が上手く使えなくなることは事実であると思います。なので、「Vercel 上で動く Next.js」を再現するために別のプラットフォームで苦しんでいるユーザーを救済するプランを示すこともなく、「(コンテナを使えば) 普通にどこでも動きますよ」といったちょっとズレた議論でかわそうとするだけでは、納得できない人も多いだろうという気がしました。ただ一方で、数多くあるインフラに向けてアダプターを公式にメンテナンスしていくのが厳しいということは普通に納得できます。また、たとえば https://twitter.com/thdxr/status/1718308244383228124 などで述べられているアプリケーションと API のバージョニングの一貫性の保証などは Next.js でなくとも難しいわけで、そういった pain points を Vercel が上手く解消しているだけだという意見もわかります (単純に Vercel はプラットフォームとして快適なんですよね)。

## Next.js is eating React (React への侵食)

kentcdodds 曰く:

- Next.js は React と一体化しつつあり、両者の境界線は曖昧になりつつある。多数の React チームメンバーが Vercel に移籍したが、そのせいで React チームはますます非協力的になってしまった。Redwood や Apollo のメンテナも[同じような不満](https://twitter.com/phry/status/1718185739328844085)を漏らしている。非協力的なチームはソフトウェアにとって良くない兆候だ。

leerob 曰く:

- 最近になって React のドキュメントにおいても `useFormStatus` や [tainting](https://react.dev/reference/react/experimental_taintUniqueValue) に関する記述が登場するようになり、React の API を Next.js が使用しているという関係がわかりやすくなったはずだ。両者の境界がわかりづらくなっていたことは認めるが意図したものではなく、今後は線引をより明確にするよう努めたい。

筆者感想: 筆者も kentcdodds と同様に両者の境界が曖昧になってきたという漠然とした印象は抱いており、たとえば Server Actions については[このツイート](https://twitter.com/reactjs/status/1716573234160967762)を見るまで Next.js の機能であると誤解していました。この点について leerob も認めていると思われるので、今後の改善に期待したいです。一方、React チームが非協力的になってきたという意見については客観的な証拠もなく、これだけでは kentcdodds の一方的な思い込みとしか判断できないように感じられます。ただ、同じような思いを抱いている開発者は他にもいるようなので、React チームからのアンサーも欲しいところです。

## Experimenting on my users (実験台になるユーザー)

Kent C. Dodds 曰く:

- Next.js は安定版と称して React の[カナリア](https://en.wikipedia.org/wiki/Sentinel_species)版の機能を自身に組み込んでいる。その結果ユーザーのアプリケーションは不安定な実験台となっている。App Router で苦しんでいる人の数は殊の外多いようだ。React の安定した機能のみが組み込まれている Remix を使おう。RSC は安定してから使えばいい。

leerob 曰く:

- React の[ブログ記事](https://react.dev/blog/2023/05/03/react-canaries)に明言されている通り、カナリア版の機能をフレームワークが採用することについて何ら問題はない。確かに App Router に関して改善すべき点は多いが、それはカナリア版が悪いというわけではなく、我々の実装の問題だ。RSC はすでに多くのトップサイトで採用されており、十分に production ready といえる。

筆者感想: React 側のブログ記事を読む限り、leerob の主張の通り、確かにカナリア版を使用すること自体は React チームの意図に即しており問題なさそうに思えます。RSC を使用しているトップサイトが多いことは RSC が安定していることの根拠としては弱く、「安定」という言葉を定義した上で直接的に安定していることを証明してほしくもありますが、そもそもの kentcdodds がふわっとした物言いであるため、ふわっとした返答しかできないとも言えます。また、ユーザーで実験しているというのは明らかに言い過ぎであり、これは少し印象操作が過ぎるのではないかと感じました。

## Too much magic (黒魔術)

kentcdodds 曰く:

- グローバルの `fetch` をオーバーライドしたキャッシュ機能の追加など、Next.js はユーザーが予測不可能な機能追加を多くおこなっている。その結果 Next.js のユーザーは、こういった予測不可能な機能追加が他にもあるかどうか疑心暗鬼にならざるを得ない。[驚き最小の原則](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)に従って設計され、選択的に魔法を使用可能な Remix を使おう。

leerob 曰く:

- `fetch` に関してはその通りだろう。コミュニティからのフィードバックをもとに改善の方向性を決めていきたい。

筆者感想: ここでは leerob は kentcdodds の主張の正しさを率直に認めているように思えます。Next.js に加えて React 自身も `fetch` を[拡張してしまっている](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch)らしいため落とし所がどうなるのか筆者はわかりませんが、気になる方は https://github.com/vercel/next.js/discussions/54075 といった関連する discussions などを参照するといいかもしれません。

## Complexity (複雑さ)

kentcdodds 曰く:

- Next.js はどんどん複雑になっている。React の Server Actions は[フォームを POST に変えてしまう](https://twitter.com/ryanflorence/status/1715459904474104104)が、このようなセマンティクスの変更は複雑度を増加させる。こうした API をそのまま取り入れ複雑度の増大に加担しようとする Next.js ではなく、複雑度を最小限に抑えて API を設計している Remix を使おう。

leerob 曰く:

- App Router は Pages Router とは別のモデルであり、ほぼ新しいフレームワークとすらいえる。学びの場として新しく[チュートリアル](https://nextjs.org/learn)を提供している。

筆者感想: ここでは leerob は「複雑でない」とはっきり否定すべきであり、チュートリアルを紹介するだけでは反論になっていません (ここでも「複雑」という言葉の定義がないため直接的な反論が難しい気もしますが)。というよりも、新しいチュートリアルで学び直さなければいけないという意味では、複雑になっているという事実を暗黙に認めているようにも思えます。また、kentcdodds が触れているフォームのセマンティクスの変更などの点については、ハッキリとした理由や反論を示してくれないと `fetch` の際と似た不安を感じます。

## Stability (安定性)

kentcdodds 曰く:

- Next.js は次々にメジャーバージョンの更新をおこなっており、安定性への配慮が欠けている。Remix は 2 年近くバージョン 1 をキープし、一ヶ月前のバージョン 2 のリリースは、その安定性の高さから「ウェブフレームワーク史上[最も退屈なメジャーバージョンの更新](https://twitter.com/ryanflorence/status/1715017282374787261)」となった。安定性を重視するなら Remix を使おう。

leerob 曰く:

- メジャーバージョンの数とフレームワークの安定性とは何の関係もない。Next.js は [codemods](https://nextjs.org/docs/app/building-your-application/upgrading/codemods) や[アップグレードガイド](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)を適切に提供しているため、危惧しているようなバージョンアップに伴う不安は小さいはずだ。

筆者感想: Next.js のメジャーバージョンアップにおける過去の難点を具体的に挙げていない時点で、kentcdodds の主張には説得力がないように思えます。バージョン番号の大きさを不安定さの証のように論じるのはさすがに失笑を禁じ得ません。

## おわりに

全体としては、kentcdodds の発言は根拠が弱いものが多く、leerob が丁寧に応答しているように感じました。`fetch` について率直に誤りを認めた点も適切な対応であると思います。ただ、Vercel 以外へのデプロイの難しさに関する議論など、一部の回答についてはスッキリしない点も残っています。

ここでは kentcdodds による Next.js へのネガティブな意見と、それに対する leerob の応答を要約しましたが、若干雰囲気が悪いため、最後に leerob の記事の最後に書かれている、彼が Next.js を使う理由というポジティブな内容を引用して終わろうと思います (括弧内は筆者訳):

- I never need to write separate backends for projects I want to create. I can build my entire project with Next.js. (Next.js で自分が作りたいプロジェクトの全体を構築できるため、プロジェクトのバックエンドを別途作成する必要がない。)
- I never have to worry about bundler, compiler, or frontend infrastructure. I get to focus on making great products through React components. And I'm able to use the latest React features, which I personally find to have a great developer experience. (バンドラーやコンパイラ、フロントエンドのインフラについて心配する必要がない。React コンポーネントを使って素晴らしいプロダクトを作ることに集中できる。そして最新の React の機能を使うことができ、これにより素晴らしい開発体験を得られる。)
- I am able to update to the latest versions of Next.js and things continue to improve. Performance gets faster and new features get added. The iteration velocity is high. If there are changes, codemods and upgrade guides are provided. (Next.js を最新バージョンにアップデートすると常に何か改善されている。パフォーマンスは向上し、新しい機能も追加される。イテレーションの速度が速い。何か変更があれば、codemods やアップグレードガイドが提供される。)
- Next.js provides a bunch of components that help me keep my site fast. [Images](https://nextjs.org/docs/app/building-your-application/optimizing/images), [fonts](https://nextjs.org/docs/app/building-your-application/optimizing/fonts), [scripts](https://nextjs.org/docs/app/building-your-application/optimizing/scripts), and now even [properly loading third-parties](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries). (Next.js は[画像](https://nextjs.org/docs/app/building-your-application/optimizing/images)や[フォント](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)、[スクリプト](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)、さらには[サードパーティーライブラリのロード](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)など、サイトを高速に保つための様々なコンポーネントを提供している。)

## おまけ

上の内容について興味をもたれた方がいれば、彼らが記事を発表したツイートにぶら下がっているリプライなどを掘っていくと、よりコミュニティの雰囲気や具体的な議論を知ることができるのでオススメです:

https://twitter.com/kentcdodds/status/1717274167123526055

https://twitter.com/leeerob/status/1718023238238781826
