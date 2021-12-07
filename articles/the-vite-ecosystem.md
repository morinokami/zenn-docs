---
title: "Vite のエコシステム"
emoji: "🌱"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vite"]
published: false
---

TODO: https://patak.dev/vite/ecosystem.html へのリンク差し替え

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

## Astro

[astro](https://astro.build/) チームは、[Vite を使用するためにエンジンを作り直し](https://astro.build/blog/astro-021-preview/#hello-vite)、エコシステムにおける重要なプレーヤーとなりました。Astro は、これまで他のフレームワークが扱ってこなかったいくつかの分野で Vite の限界を押し広げており、探求しながらコア部分を改良しています。ESM ツールに関する彼らの経験は、今後の  Vite にとって非常に重要なものとなるでしょう。

## iles

[@MaximoMussini](https://twitter.com/MaximoMussini) は、Vite と Vue によりインタラクティブな islands を作ることができるフレームワーク、[iles](https://iles-docs.netlify.app/) を作成しました。Astro や VitePress にインスパイアされた iles は、[Vite が可能にしている新たな試み](https://viewsonvue.com/islands-architecture-in-vue-with-m-ximo-mussini-vue-170)の好例です。Maximo は積極的にコミュニティに参加しており、また [Rails](https://patak.dev/vite/ecosystem.html#vite-ruby) コミュニティにおける Vite の採用についても推進しています。

## VitePress

VitePress is a fresh take on VuePress, taking the opportunity to see rethink what a Vue-powered static site generator can look like using Vue 3 and Vite. Evan You は、Vite と並行して VitePress を開発しましたが、これは Vite のデザインをテストし、その情報を提供するための素晴らしいユースケースです。VitePress は、ドキュメント作成において多くの採用実績があります。[Vite](https://vitejs.dev/)、[Vue Blog](https://blog.vuejs.org/)、[VueUse](https://vueuse.js.org/)、[Pinia](https://pinia.esm.dev/)、[vite-ruby](https://vite-ruby.netlify.app/)、[vite-plugin-pwa](https://vite-plugin-pwa.netlify.app/)、[Slidev](https://sli.dev/)、[windi](https://windicss.org/)、[laravel-vite](https://laravel-vite.innocenzi.dev/) などがその例です。VuePress も [@vuepress/bundler-vite](https://v2.vuepress.vuejs.org/reference/bundler/vite.html#vite) によって Vite のサポートを実装しました。

## Slinkity

[@bholmesdev](https://twitter.com/bholmesdev) らは、[Eleventy](https://www.11ty.dev/) と Vite を統合する islands SSG フレームワークである [Slinkity](https://slinkity.dev/) に取り組んでいます。[@Snugug](https://twitter.com/Snugug) の [vite-plugin-eleventy における初期の取り組み](https://snugug.com/musings/eleventy-plus-vite/)や、[Astro](https://patak.dev/vite/ecosystem.html#astro) のようなフレームワークに影響を受け、Slinkity は 11ty ユーザーに Vite のエコシステムへの扉を開きました。これにより、Eleventy のプロジェクトは、[Vite の UI フレームワークのサポート](https://youtu.be/DqUGJyuX8m0)、高速な HMR、Vite の豊富なプラグインエコシステムを活用することができます。

## rakkas

[rakkas](https://rakkasjs.org/) は Next.js と SvelteKit にインスパイアされた、Vite を使用した React の SSR フレームワークです。作者の [@cyco130](https://twitter.com/cyco130) は、Vite の SSR を改善するために他の人と協力しながら Vite のコミュニティで活躍しています。

## vite-plugin-ssr

[vite-plugin-ssr](https://vite-plugin-ssr.com/) は、[@brillout](https://twitter.com/brillout) によって開発されているミニマルな SSR フレームワークです。彼は Vite の SSR まわりで非常に活発に活動しており、他の人を助けたり、Vite コアに修正やアイデアを提供したりしています。vite-plugin-ssr は SSR フレームワークの作者のためのツールキットで、Vite の低レベルな SSR プリミティブをより一貫性のあるかたちで利用できるようにすることを目的としています。[@asleMammadam](https://twitter.com/asleMammadam) が開発した React フレームワークである [vitext](https://github.com/Aslemammad/vitext) のようなフレームワークは、vite-plugin-ssr によって作成されています。また、[@brillout](https://twitter.com/brillout) も、[telefunc](https://telefunc.com/) や Vike など、他の関連プロジェクトに取り組んでいます。

## vite-ssr

[@frandiox](https://twitter.com/frandiox) は、Node.js における Vite のためのシンプルかつ強力な SSR ソリューションとして、[vite-ssr](https://github.com/frandiox/vite-ssr#readme) を作成しました。これは、Vite のSSR API を高レベルのソリューションとして公開するための別の試みです。彼はまた、[Cloudflare Workers](https://workers.cloudflare.com/) 上で動作する、エッジサイドレンダリングとフルスタックの Vite フレームワークである [vitedge](https://vitedge.js.org/) の作成者でもあります。


# 他のエコシステムとの統合

## vite-ruby

[@MaximoMussini](https://twitter.com/MaximoMussini) は、洗練されたバックエンドとの最初の統合の 1 つを [vite-ruby](https://vite-ruby.netlify.app/) によって果たし、Vite が Ruby コミュニティに参入することを可能にしました。プロジェクト発足の経緯については、[ドキュメントのモチベーションに関するセクション](https://vite-ruby.netlify.app/guide/introduction.html#why-vite-ruby-%F0%9F%A4%94)をチェックしてください。[Vite Land の #rails チャンネル](https://patak.dev/vite/discord.gg/pC5sG7Gqh7.html)では多くの活動がおこなわれており、このプロジェクトにより他の人も Vite を自分のプロジェクトに統合するようになりました。

## laravel-vite

[@enzoinnocenzi](https://twitter.com/enzoinnocenzi) は、Vite と Laravel のエコシステムを統合するために [laravel-vite](https://laravel-vite.innocenzi.dev/) を作成しました。[vite-ruby](https://vite-ruby.netlify.app/) に続くかたちで、Enzo の活動は Laravel コミュニティでの Vite の採用を促進する重要な要因となっています。

## fastify-vite

[fastify-vite](https://fastify-vite.dev/) は、Nuxt や Next のような本格的な SSR フレームワークのミニマルかつ高速な代替です。[@anothergalvez](https://twitter.com/anothergalvez) は、フレームワークではなく [fastify を第一とするソリューション](https://fastify-vite.dev/meta/philosophy.html#fastify-first)として fastify-vite を作成しました。fastify と Vite のコミュニティの間には多くの相乗効果が生まれています。fastify-vite により、両プロジェクトの採用が促進されています。


# CSS フレームワーク

## Tailwind CSS

[Tailwind Labs](https://tailwindcss.com/) は、Vite の可能性を最初に認識したチームの 1 つで、非常に早い段階で Vite を導入する例を公式に提供し、プロジェクトのスポンサリングを開始しました。Vite エコシステムにおける DX の革新に対応して、Tailwind v2.1+ 用のオンデマンドエンジンである [Just-in-Time モード](https://tailwindcss.com/docs/just-in-time-mode)をリリースし、Vite HMR と組み合わせた際の素晴らしい体験を提供しています。[Hydrogen](https://patak.dev/vite/ecosystem.html#hydrogen) のようなフレームワークが Vite と Tailwind CSS の組み合わせを推奨していることから、Tailwind のユーザーによる Vite の採用という新たな波が訪れるでしょう。

## Windi CSS

[@satireven](https://twitter.com/satireven) は Tailwind のための高速なオンデマンドエンジンである [WindiCSS](https://windicss.org/) を作り、また [@antfu](https://twitter.com/antfu7) はそれを使って、ローディングと HMR 速度において前例のない DX を提供する [vite-plugin-windicss](https://github.com/windicss/vite-plugin-windicss) を作りました。このプロジェクトを中心として活発なコミュニティが現在は展開されています。WindiCSS は現在、[Nuxt 3](https://v3.nuxtjs.org/) のドキュメントページや、[Slidev](https://sli.dev/) のようなプロジェクトで使用されています。

## UnoCSS

Windi での経験を経て [@antfu](https://twitter.com/antfu7) は、オンデマンドで即座に使える Atomic CSS エンジンのツールキット、[UnoCSS](https://github.com/antfu/unocss) を作りました。UnoCSS は、私たちの前にどれだけ改善の余地があるかを改めて示してくれました。UnoCSS は Windi CSS の 200 倍の速度を出すことができ、最速のエンジンに 2 桁の差をつけています。誕生の経緯については、[Reimagine Atomic CSS](https://antfu.me/posts/reimagine-atomic-css) と [Icons in Pure CSS](https://antfu.me/posts/icons-in-pure-css) を読むことができます。Anthony はこのプロジェクトを Vite のみのソリューションとして開始しましたが、現在では他のバンドラーでも利用可能です。UnoCSS は、WindiCSS の次世代のエンジンを動かす予定です。


# プラグイン

## Awesome Vite Plugins

[Vite プラグイン](https://vitejs.dev/guide/api-plugin.html)のリストは [Awesome Vite](https://github.com/vitejs/awesome-vite#plugins) で見つかります。新しいプロジェクト、テンプレート、プラグインが投稿されるため、[リポジトリ](https://github.com/vitejs/awesome-vite)では多くの活動がおこなわれていますが、[@Scrum_](https://twitter.com/Scrum_) がリストを上手くキュレーションしてくれています。膨大な数のプラグインがあり、エコシステムは日々成長しています。どういった機能が利用可能であるかを示すために、いくつかの例を紹介します。完全なリストを見るには、Awesome Vite の [Plugins セクション](https://github.com/vitejs/awesome-vite#plugins)をチェックしてください。

| 名前 | 説明 |
| ---- | ---- |
| [vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages#readme) | ファイルシステムベースのルーティングサポート |
| [vite-plugin-mpa](https://github.com/IndexXuan/vite-plugin-mpa#readme) | Vite の MPA サポート |
| [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation#readme) | Webpack のようなモジュールフェデレーションのサポート |
| [vite-plugin-node](https://github.com/axe-me/vite-plugin-node#readme) | Node の開発用サーバーとしての Vite の使用 |
| [vite-plugin-comlink](https://github.com/mathe42/vite-plugin-comlink#readme) | [comlink](https://github.com/GoogleChromeLabs/comlink#readme) を使った WebWorkers |
| [vite-plugin-rsw](https://github.com/lencx/vite-plugin-rsw#readme) | [wasm-pack](https://rustwasm.github.io/wasm-pack/) のサポート |
| [vite-plugin-elm](https://github.com/hmsk/vite-plugin-elm) | プロジェクト上で Elm のアプリ/ドキュメント/エレメントをコンパイルする |
| [vite-plugin-qrcode](https://github.com/svitejs/vite-plugin-qrcode#readme) | モバイルでデバッグするために、サーバー起動時に QR コードを表示する |
| [vite-plugin-full-reload](https://github.com/ElMassimo/vite-plugin-full-reload#readme) | ファイル変更に応じて自動的にページをリロードする |
| [vite-plugin-compress](https://github.com/alloc/vite-plugin-compress#readme) | バンドルとアセットを圧縮する |
| [vite-plugin-checker](https://github.com/fi3ework/vite-plugin-checker#readme) | ワーカースレッドでの TypeScript、VLS、vue-tsc、ESLint のチェック |
| [vite-plugin-inspect](https://github.com/antfu/vite-plugin-inspect#readme) | プラグインの中間状態の検査 |

## awesome-rollup

Rollup のエコシステムでは [Rollup org でコアプラグイン](https://github.com/rollup/plugins#readme)をメンテナンスしており、また [Awesome Rollup](https://github.com/rollup/awesome#plugins) にはコミュニティプラグインのリストがあります。[Vite Plugin API](https://vitejs.dev/guide/api-plugin.html) は [Rollup と高い互換性](https://vitejs.dev/guide/api-plugin.html#rollup-plugin-compatibility)があります。また、[Vite Rollup プラグインの互換性](https://vite-rollup-plugins.patak.dev/)のリストも管理されています。Rollup のエコシステムが Vite に近づいているため、将来的には Rollup プラグインのドキュメントにおいて "Works in Vite" (「Vite で動作する」) のバッジが見られるようになることを期待しています。以下は互換性のあるプラグインの例です:

| 名前 | 説明 |
| ---- | ---- |
| [@rollup/plugin-yaml](https://github.com/rollup/plugins/tree/master/packages/yaml) | YAML ファイルを ES6 モジュールに変換する |
| [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) | コンパイラエラーのある typescript を実行する |
| [rollup-plugin-critical](https://github.com/nystudio107/rollup-plugin-critical) | クリティカルな CSS を生成する |

## unplugin

[unplugin](https://github.com/unjs/unplugin#readme) は [@antfu](https://twitter.com/antfu7) の別のプロジェクトで、Vite、Rollup、Webpack、そして将来的には他のバンドラーのための統一的なプラグインシステムです。Anthony は、自身のプラグインをこのライブラリへと移行し、彼が Vite にもたらした DX イノベーションの多くを他のビルドツールにも開放しています。このプロジェクトは [unjs umbrella](https://github.com/unjs) の一部であり、それは Nuxt チームによる特定のバンドラーに依存しないライブラリのコレクションで、使用するビルドツールから Nuxt を抽象化する試みから生まれれたものです。いくつかの例を紹介します:

| 名前 | 説明 |
| ---- | ---- |
| [unplugin-icons](https://github.com/antfu/unplugin-icons) | 数千のアイコンをオンデマンドでコンポーネント化 |
| [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components) | Vue のためのオンデマンドのコンポーネント自動インポート |
| [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import) | TS をサポートする、オンデマンドの自動インポート API |

## vite-plugin-pwa

[vite-plugin-pwa](https://vite-plugin-pwa.netlify.app/) は、Vite を使用する際に利用できるプラグインの好例であり、フレームワークに依存しない Vite 用ゼロコンフィグ PWA プラグインで、[Workbox](https://developers.google.com/web/tools/workbox) によるオフラインサポートを実現しています。[@antfu](https://twitter.com/antfu7) と [@userquin](https://github.com/userquin) は、あらゆるフレームワークに対する洗練されたシームレスな開発経験を構築しました。


# スターター

## Replit

[Replit](https://replit.com/) は、ユーザーにより良い体験を提供するために [Vite を活用した](https://blog.replit.com/vite)最初の企業の一つで、[React スターターテンプレート](https://replit.com/@templates/Reactjs)を Vite に切り替えました。[このテンプレートと CRA のバージョンを比較](https://twitter.com/amasad/status/1355379680275128321)した [@amasad](https://twitter.com/amasad) 氏のツイートは、後に多くのブログ記事や講演において、ロード速度の違いを説明するために使用されました。「コンテナが CRA のファイルを読み込むよりも早く Vite が実行されたのです」。

## Glitch

[glitch](https://glitch.com/) は、彼らの[スタータープロジェクト](https://glitch.com/create-project)に Vite を採用しました。[重い処理を Vite に任せる](https://blog.glitch.com/post/a-closer-look-at-the-new-glitch-starter-apps)ことにしたのです。[keithkurson](https://twitter.com/keithkurson) は「Vite を使うことはとても楽しいですし、すべてのスタータープロジェクトが同様のビルドパターンと Rollup プラグインを使えるようにすることは、glitch のプログラマーにとって大きな付加価値となるでしょう」と[述べています](https://twitter.com/keithkurson/status/1382054337795411968)。

## StackBlitz

[StackBlitz](https://stackblitz.com/) は、Vite を彼らのブラウザ IDE の第一級市民としました。彼らは Vite を ([esbuild](https://esbuild.github.io/) をサポートする) [WebContainers](https://github.com/stackblitz/webcontainer-core) と互換性をもたせるようにし、また、Vite エコシステムのチームと協力して、最も人気のある Vite フレームワークがスムーズに動作するようにしました。これはたとえば [SvelteKit](https://blog.stackblitz.com/posts/sveltekit-supported-in-webcontainers/)、[Hydrogen](https://blog.stackblitz.com/posts/shopify-hydrogen-in-stackblitz-webcontainers/)、[Astro](https://blog.stackblitz.com/posts/astro-support/) などです。ローカルにとても近い環境であるため、Vite Core はバグレポートでのミニマルな再現に Stackblitz の使用を推奨しています。また、[Vite のスターター](https://blog.stackblitz.com/posts/vite-new-templates/)として [vite.new](https://vite.new/)、[vite.new/{template}](https://vite.new/vue) を追加し、新しいダッシュボードに Vite を含め、[Vite の最大のスポンサー](https://blog.stackblitz.com/posts/why-were-backing-vite/)となっています。

## Vitesse

[Vitesse](https://github.com/antfu/vitesse) は、Vite スターターの良い例です。これは Vue 3 のテンプレートで、[@antfu](https://twitter.com/antfu7) がこのスターターを使って[エコシステムの中でも特に優れたプラグイン](https://github.com/antfu/vitesse#plugins)を紹介しています。また、ファイルベースのルーティング、自動インポート、PWA、Windi CSS、SSG、critical CSS など、[様々な機能が詰め込まれています](https://github.com/antfu/vitesse#features)。さらに、[Cypress](https://patak.dev/vite/ecosystem.html#cypress) を使ったテストのセットアップの好例でもあります。

## WebExtension Vite Starter

[Vitesse](https://github.com/antfu/vitesse) をベースにした [WebExtension Vite Starter](https://github.com/antfu/vitesse-webext) は、Vite を搭載した [WebExtension](https://developer.chrome.com/docs/extensions/mv3/overview/) のスターターテンプレートです。典型的な Web アプリ以外での Vite の使い方を紹介したく、ここに含めています。これは、他の環境において Vite を使用し、Vite の高速な HMR、機能、プラグインを利用できるようにするという試みの一つです。

## Awesome Vite Templates

Vite コミュニティでは、フレームワークとツールのさまざまな組み合わせに対応したテンプレートをメンテナンスしています。[Awesome Vite Templates](https://github.com/vitejs/awesome-vite#templates) には、膨大な選択肢のリストがあります。オンラインでテストしたい場合は、`https://github.com/{user}/{repo}` のようなテンプレートの場合、`https://stackblitz.com/github/{user}/{repo}` にアクセスして試すことができます。ローカルで動かしたい場合は [degit](https://github.com/Rich-Harris/degit#readme) のようなツールを用いて、`degit user/repo` によりテンプレートの新しいコピーを取得できます。


# テスト

## mocha-vite-puppeteer

[@larsthorup](https://twitter.com/larsthorup) が開発している [mocha-vite-puppeteer](https://github.com/larsthorup/mocha-vite-puppeteer) は、Mocha のフロントエンドテストを Vite と [Puppeteer](https://pptr.dev/) で実行できるようにするものです。[Vite がコードをバンドルするのと同じ速さでテストを実行](https://www.youtube.com/watch?v=uU5yKjojtq4)することができます。

## vite-jest

TODO: @sodatea is building vite-jest, which aims to provide first-class Vite integration for Jest. これは、Jest の[阻害要因](https://github.com/sodatea/vite-jest/blob/main/packages/vite-jest/README.md#vite-jest)のために、まだ進行中のプロジェクトです。[First Class Jest Integration というイシュー](https://github.com/vitejs/vite/issues/1955)で進捗状況を確認できますし、[Vite Land](https://chat.vitejs.dev/) の #testing チャンネルに参加することで、この取り組みを支援することもできます。

## Cypress

[Cypress](https://www.cypress.io/) は Vite を彼らのプロダクトに組み込んでおり、コミュニティでもかなり活発に活動しています。彼らは、新しい [Cypress Component Testing](https://docs.cypress.io/guides/component-testing/introduction) を Vite の開発サーバーとうまくマッチするようにしています。また、アプリケーションの UI を [Vitesse](https://patak.dev/vite/ecosystem.html#vitesse) を使って再構築しています。Cypress と Vite の相性の良さについては、[@_jessicasachs](https://twitter.com/_jessicasachs) の [VueConf US 2021 での講演](https://www.youtube.com/watch?v=7S5cbY8iYLk)をチェックしてみてください。

## Web Test Runner

[vite-web-test-runner-plugin](https://github.com/material-svelte/vite-web-test-runner-plugin#readme) は、Vite を使ったプロジェクトをテストするための [@web/test-runner](https://patak.dev/vite/modern-web.dev/docs/test-runner/overview/) プラグインです。このプラグインは、カレントディレクトリにある Vite プロジェクトに自動的に接続し、プロジェクトの設定を読み込み、設定済みの Vite のビルドパイプラインを使用して各テストファイルをビルドします。


# その他のツール

## Storybook

[@eirikobo](https://twitter.com/eirikobo)、[@sasan_farrokh](https://twitter.com/sasan_farrokh)、[janvanschooten](https://twitter.com/ianvanschooten) は、Vite を使って Storybook をビルドする [storybook-builder-vite](https://github.com/eirslett/storybook-builder-vite) を作成しました。[Michael Shilman](https://twitter.com/mshilman) が、このツールの仕組みを詳細に説明し、新しいビルダーの利点を強調した[ブログ記事](https://storybook.js.org/blog/storybook-for-vite/)を書いています。具体的な内容としては、劇的に改善されたビルド速度、Vite プロジェクトの設定との互換性、Vite のプラグインエコシステムへのアクセスについてなどです。

## Tauri

[Tauri](https://tauri.studio/) は、Web フロントエンドの技術によりデスクトップアプリケーションを構築するためのフレームワークです。Tauri チームは、主要メンバーである [@Amr__Bashir](https://twitter.com/Amr__Bashir) がメンテナンスしているプラグイン [vite-plugin-tauri](https://github.com/amrbashir/vite-plugin-tauri#readme) を使って、Vite 用の公式スターターテンプレートを作成しました。Vite と Tauri は、ネイティブアプリの開発において素晴らしい組み合わせとなるでしょう。以下は Tauri チームからの引用です: [「Vite は Tauri の心の中で特別な地位を占めています」](https://twitter.com/TauriApps/status/1381975542753280004)。

## TroisJS

[troisjs](https://troisjs.github.io/) は [ThreeJS](https://threejs.org/)、[Vue 3](https://v3.vuejs.org/)、Vite を組み合わせた、[react-three-fiber](https://docs.pmnd.rs/react-three-fiber) のような Vue 用のライブラリです。[デモは素晴らしい出来](https://stackblitz.com/edit/troisjs-cannonjs.html)です。[@Rich_Harris](https://twitter.com/Rich_Harris) は最近、Svelte 用に宣言型 の 3D コンポーネントベースのシーンを提供する [Svelte Cubed](https://svelte-cubed.vercel.app/) を発表しました。Vite の HMR は 3D シーンをデザインするのに完璧にマッチしており、実際、[react-three-fiber](https://github.com/pmndrs/react-three-fiber/tree/master/example) のいくつかのサンプルは現在 Vite を使用しています。

## Slidev

[@antfu](https://twitter.com/antfu7) の別のプロジェクトである [Slidev](https://sli.dev/) は、Vite、Vue 3、[Windi CSS](https://patak.dev/vite/windicss.html) を使った、Markdown ベースのスライドジェネレータです。[機能が満載](https://sli.dev/guide/#features)されており、またその DX は素晴らしいものです。Vite の HMR により、変更が即座にスライドに反映されます。これは、Vite が可能にした新しい傾向のツールにおける最高の例の一つです。

## Viteshot

[@fwouts](https://twitter.com/fwouts) の [Viteshot](https://viteshot.com/) は、[UI コンポーネントのスクリーンショットを数秒で生成](https://www.youtube.com/watch?v=Ag5NBguCucc)することができます。また、[React Preview](https://reactpreview.com/) (Preview JSに改名される予定です) にも取り組んでおり、Visual Studio Code でコンポーネントや Storybook のストーリーを瞬時にプレビューすることができます。

## Backlight

[Backlight](https://backlight.dev/) は、[<div>RIOTS](https://divriots.com/) によるデザインシステムプラットフォームです。アプリのビルドには Vite、ドキュメントには [VitePress](https://patak.dev/vite/ecosystem.html#vitepress) を使用しており、また、ブラウザ上で使用することを目的とした Vite のフォークである [browser-vite](https://github.com/divriots/browser-vite) にも取り組んでいます (service worker により実行されます)。
