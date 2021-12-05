---
title: "Vite のエコシステム"
emoji: "🌱"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vite"]
published: false
---

TODO: Preface

# 巨人の肩に乗って

## vite

[Vite 2 のリリース](https://patak.dev/web/vite-2.html)における 2 回目の大規模スプリントの後、[Evan You](https://twitter.com/youyuxi) は [Vite チームを立ち上げ](https://github.com/vitejs/vite/discussions/2601)、プロジェクトのメンテナンスを開始しました。現在、Evan が率いる緊密なチームがプロジェクトを推進しており、エコシステム内の他のチームと密接に協力して、彼らのフレームワークや%統合%で Vite がスムーズに動作するようにしています。[リポジトリのコントリビュータは 400 人を超えており](https://github.com/vitejs/vite/graphs/contributors)、[Discord でも活発なコミュニティが形成されています](https://chat.vitejs.com/)。プロジェクトは急速に成長しています。GitHub では [75000 以上の他のプロジェクト](https://github.com/vitejs/vite/network/dependents?package_id=UGFja2FnZS0xMTA1NzgzMTkx)で使用されており、[`vite` パッケージ](https://www.npmjs.com/package/vite)の npm 月間ダウンロード数は 130 万回を超えています。

## rollup

[Rollup](https://rollupjs.org/) は根本的な要素です。Vite は、独自の Rollup のセットアップに、%迅速な%開発用サーバーを組み合わせたものと考えることができます。Rollup の主要メンテナの一人である [@lukastaegert](https://twitter.com/lukastaegert) は、長い間欠けていた Rollup のウェブ開発用ラッパーとして Vite を推薦しました。%Vite は Rollup プラグインのエコシステムとの互換性があるため、Vite は先行しており%、実際に Rollup のセットアップが数多く利用されています。エコシステムの互換性を確保するために、プラグイン API を拡張する際に Rollup のメンテナが [Vite や WMR のメンテナとコミュニケーションを取っている](https://github.com/rollup/rollup/pull/4230#issuecomment-927237678)のは素晴らしいことです。

## esbuild

[esbuild](https://esbuild.github.io/) は Go で書かれたバンドラーで、ビルドツールのパフォーマンスの限界を拡張し続けています。Vite は esbuild により個々のファイルをトランスパイルしたり (typecript の型の削除、JSX のコンパイル)、(JS と CSS ファイルともに) デフォルトのミニファイアーとして使用したりしています。また、開発中に依存関係を事前にバンドルする際のバンドラーとしても使用されています。[@evanwallace](https://twitter.com/evanwallace) は素晴らしい仕事をしてくれています。esbuild は日々改善されており、タスクに応じて tsc、babel、Rollup の高速な代替手段として Vite に利用されています。

## TypeScript

[TypeScript](https://typescriptlang.org/) が JS の世界に旋風を巻き起こしています。Vite は [.ts ファイルのインポートをデフォルトでサポートしています](https://vitejs.dev/guide/features.html#typescript)。内部的には、esbuild を使用して型を除去し、ブラウザ用にソースをトランスパイルする際のクリティカルパスにおけるコストのかかる型チェックを回避しています。これは、可能な限り最高の HMR 体験を得るために重要です。[VS Code](https://code.visualstudio.com/docs/languages/typescript) のような最新の IDE を使用している場合、コードを書いているときにインテリセンスによってほとんどの情報を得ることができます。また、ビルド時に `tsc` を実行したり、[rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) のようなプラグインを使用することもできます。[@fi3ework](https://twitter.com/fi3ework) の [vite-plugin-checker](https://github.com/fi3ework/vite-plugin-checker#readme) は、ワーカースレッドで TypeScript を実行することができる興味深いオプションです。

## babel

Vite はほとんどのセットアップで [babel](https://babeljs.io/) を必要とせず、その重い AST パイプラインを不要としています。しかし、React のエコシステムは、HMR や コンパイルを必要とする CSS-in-JS ライブラリのような他のソリューションのために babel に大きく依存しています。現在は、[@vitejs/plugin-react](https://github.com/vitejs/vite/tree/main/packages/plugin-react) と、レガシーブラウザのサポートのために [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) において使用されています。[Parcel](https://parceljs.org/) チームと [Next.js](https://nextjs.org/) チームは、最も使われているプラグインを Rust のツールチェーンである [SWC](https://swc.rs/) に移植する作業をおこなっています。これらの取り組みが成熟すれば、Vite は babel から SWC に移行するかもしれません (初期段階の試み: [SWC ベースの @vitejs/plugin-legacy](https://github.com/vitejs/vite/pull/4105)、[unplugin-swc](https://github.com/egoist/unplugin-swc)、[vite-plugin-swc-react](https://github.com/iheyunfei/vite-on-swc))。

## PostCSS

Vite は [PostCSS](https://postcss.org/) の使用を推奨しており、デフォルトでサポートしています。[他の CSS プリプロセッサ](https://vitejs.dev/guide/features.html#css-pre-processors)も、プロジェクトの依存関係に手動で追加することでサポートされます。しかし、PostCSS は Vite のビジョンとより一致しており、[postcss-nesting](https://github.com/csstools/postcss-nesting) のような [CSSWG ドラフト](https://drafts.csswg.org/)の使用を今日から可能とし、また将来にわたって CSS 標準への準拠を維持してくれます。


# その他の試み

## Snowpack

[Snowpack](https://www.snowpack.dev/) は、JavaScriptのネイティブのモジュールシステムを利用して不要な作業を回避し、プロジェクトがどれだけ大きくなっても高速に動作します。開発ツールにおける ESM ファーストというアプローチの利点を確立するのに貢献しました。Snowpack と Vite は、HMR API を標準化するための議論や、CJS と ESM が混在する世界でパッケージをロードするための技術など、互いに影響を与え合いました。Snowpack のコアチームのメンバー ([@FredKSchott](https://twitter.com/FredKSchott)、[@drwpow](https://twitter.com/drwpow)、[@matthewcp](https://twitter.com/matthewcp)、[@n_moore](https://twitter.com/n_moore)) は、現在 Vite を利用した Islands\* ベースの SSG フレームワークである [astro](https://astro.build/) に取り組んでいます。両方のコミュニティが協力しあいながら、Snowpack に取り組む中で学んだことを Vite コアの改善に活かしています。

\* 訳注) Astro の主要コンセプトである [Island Architecture](https://docs.astro.build/core-concepts/component-hydration/index.html#concept-island-architecture) のこと。

## WMR

[WMR](https://github.com/preactjs/wmr) は Vite と似たスコープと哲学を持ち、[Preact](https://preactjs.com/) チームによって開発されています。[@_developit](https://twitter.com/_developit) は、WMR でユニバーサルな Rollup プラグインAPIを開発しました。これは、Rollup の豊かなエコシステムを利用して、開発中とビルド時に Rollup プラグインを使用できるようにする仕組みです。Vite 2 のプラグイン API は WMR のアプローチに基づいており、Vite 独自のフックが追加されています。Vite と WMR は協調し、URL サフィックス修飾子やその他の機能を統一しました。

## Web Dev Server

TODO: Web Dev Server takes a more lower-level approach, requiring a manual Rollup setup for the production build. The modern web project encompasses several explorations and includes tools that could be used in a Vite setup, like the Web Test Runner that some community members are using with vite-web-test-runner-plugin.


# UI フレームワーク

## Vue

Vue の創始者かつプロジェクトリーダーである [Evan You](https://twitter.com/youyuxi)、そして他に 2 人の Vue コアチームメンバー ([@antfu](https://twitter.com/antfu7) と [@sodatea](https://twitter.com/haoqunjiang)) が Vite コアチームにいることから、Vue チームが新しいプロジェクトに Vite が動くスキャフォールディングツールである [create-vue](https://github.com/vuejs/create-vue) の使用を推奨しているのは驚くことではありません。Vue 3 のサポートは [@vitejs/plugin-vue](https://github.com/vitejs/vite/tree/main/packages/plugin-vue) で、Vue 2のサポートは [vite-plugin-vue2](https://github.com/underfin/vite-plugin-vue2) で実現しています。Vite は Vue のエコシステムで大々的に導入される予定で、ほとんどのプロジェクトが Vite のサポートを計画またはすでに実装しており、いくつかのケースではデフォルトで Vite を有効にしています ([Nuxt](https://v3.nuxtjs.org/)、[Vuetify](https://next.vuetifyjs.com/en/getting-started/installation/#vite)、[Quasar](https://quasar.dev/start/vite-plugin))。また、Vite の速度と機能を活かすために生まれた新しい Vue のプロジェクトもあります ([VitePress](https://patak.dev/vite/ecosystem.html#vitepress)、[iles](https://patak.dev/vite/ecosystem.html#iles)、[Slidev](https://patak.dev/vite/ecosystem.html#slidev))。

## React

Vite では、[@vitejs/plugin-react](https://github.com/vitejs/vite/tree/main/packages/plugin-react) により [React](https://reactjs.org/) がサポートされています。Vite の主要メンテナの一人である [@alecdotbiz](https://twitter.com/alecdotbiz) は、開発体験をスムーズにするために尽力しています。React のエコシステムでは、主にプロトタイピングやライブラリの例として多くの利用が見られます。例えば、[React Router のドキュメント](https://reactrouter.com/)では、[StackBlitz](https://stackblitz.com/) の [Web Containers](https://blog.stackblitz.com/posts/introducing-webcontainers/) を使った Vite 環境が紹介されています。Next.js は Webpack と SWC の未来に賭けています。そのため、複雑な SSR の React アプリケーションで Vite が使われることはあまりありません。しかし、Vite をベースとする、Next.js にインスパイアされたフレームワークが、[rakkas](https://rakkasjs.org/) や [vitext](https://github.com/Aslemammad/vitext) のように登場し始めています。

## Preact

[Preact](https://preactjs.com/) チームが [WMR](https://github.com/preactjs/wmr) を開発していることから、推奨するビルドツールとして WMR が提案されているだろうと予想できます。それにもかかわらず、彼らは [@preact/preset-vite](https://github.com/preactjs/preset-vite) で Vite も公式にサポートしています。特に Preact のコアチームのメンバーである [@marvinhagemeist](https://twitter.com/marvinhagemeist) は、Vite コミュニティと密接な関係にあり、セキュリティや両エコシステム間の互換性に関する議論に積極的に参加しています ([機能を揃えること](https://github.com/preactjs/wmr/issues/452#issuecomment-803569329)と、プラグインが Vite と WMR で動作するようにすることの両方)。

## Svelte

[Svelte](https://svelte.dev/) チームは、Vite への最も活発な貢献者の一つです。Svelte のサポートは [vite-plugin-svelte](https://github.com/sveltejs/vite-plugin-svelte) により実現しています。[SvelteKit](https://kit.svelte.dev/) は Vite によって動いており、彼らのエコシステムで Vite を使用することが推進されていくでしょう。[@Rich_Harris](https://twitter.com/Rich_Harris) は、SvelteKit のための汎用的な SSR の仕組みを考え出し、Evan You は後にそれを Vite に移植して、重要な機能の 1 つとなりました。SSR プリミティブを共有できることは、現在の Vite ベースの SSG および SSR フレームワークの革新を進めるために非常に重要でした。[@GrygrFlzr](https://twitter.com/GrygrFlzr)、[@benmccann](https://twitter.com/benjaminmccann)、[@dominikg](https://github.com/dominikg)、[@bluwyoo](https://twitter.com/bluwyoo) はこのプロジェクトと密接な関係にあり、SvelteKit は Vite を使用した先進的なフレームワークの 1 つであることから、両チームは緊密に協力しあっています。

## marko

[marko](https://markojs.com/) チームは、Vite の公式プラグインとして [@marko/vite](https://github.com/marko-js/vite#readme) をメンテナンスしており、[Vite ベースのスターター](https://twitter.com/markodevteam/status/1386733591296561153)を提供しています。また、[@dylan_piercey](https://twitter.com/dylan_piercey) と [@RyanCarniato](https://twitter.com/RyanCarniato) はこのプロジェクトに深く関わっており、[Zero JS](https://github.com/vitejs/vite/issues/3127) や [SSR ストリーミング](https://github.com/vitejs/vite/issues/3163)のサポートなどの機能を進めています。

## Solid

[Solid](https://www.solidjs.com/) チームも、Vite の公式プラグインである [vite-plugin-solid](https://github.com/solidjs/vite-plugin-solid) をメンテナンスしています。彼らのスターターテンプレートも Vite を使用しており、また Vite を使用したアプリケーションフレームワークである [SolidStart](https://github.com/solidjs/solid-start) にも取り組んでいます。[@RyanCarniato](https://twitter.com/RyanCarniato) は Vite コミュニティで非常に活発に活動しています。たとえば Vite と Solid を使って [Vercel Edge Functions](https://vercel.com/features/edge-functions) のストリーミング機能を活用した[デモ](https://twitter.com/RyanCarniato/status/1453283158149980161?s=20)などをチェックしてみてください。

## lit

[lit](https://lit.dev/) チームはフレームワークの新バージョンをリリースしました。Vite のモノレポにスターターテンプレートがあるので、create-vite で利用することができます。lit プロジェクトで HMR を有効にするプラグインはありませんが、lit チームはそれを作ることに興味をもっていました。


# アプリケーションフレームワーク

## Nuxt

[Nuxt チーム](https://nuxtlabs.com/)は、Vite が Nuxt でスムーズに動作するよう、Vite チームと密接に協力してきました。彼らは、Vite を Nuxt 2 に統合する [nuxt-vite](https://vite.nuxtjs.org/) を作成しました。そして次のバージョンである [Nuxt 3](https://v3.nuxtjs.org/) はデフォルトで Vite を使用します。Nuxt チームは、使用するビルドツールからフレームワークを抽象化するという、ビルドツールに関する興味深いアプローチをとりました。ユーザーは、Vite と [Webpack 5](https://webpack.js.org/) のいずれかを選択することができるのです。Nuxt 3 は、[Vue Storefront](https://www.vuestorefront.io/) のような、Vue エコシステムの他のプロジェクトにおいても Vite の DX を享受することを可能とします。なお、エコシステムの DX に関するイノベーションの大部分を担当している [@antfu](https://twitter.com/antfu7) は、現在 Nuxt チームで活動しています (この記事でも再度触れます)。

## SvelteKit

[SvelteKit](https://kit.svelte.dev/) は、[Svelte](https://patak.dev/vite/ecosystem.html#svelte) を基礎とするアプリケーションフレームワークで、モダンなWeb開発のための [Transitional Apps](https://www.youtube.com/watch?v=860d8usGC0o) というアイデアを推進しています。Svelte チームと Vite チームは、Vite の SSR プリミティブ、サーバ API、および全般的な品質を向上させるために、協力しあっています。SvelteKit が Vite の限界を拡張してきたことで、Vite 自身も大きく改善されてきました。
