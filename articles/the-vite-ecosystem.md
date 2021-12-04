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

[Vite 2 のリリース](https://patak.dev/web/vite-2.html)における 2 回目の大規模スプリントの後、[Evan You](https://twitter.com/youyuxi) は [Vite チームを立ち上げ](https://github.com/vitejs/vite/discussions/2601)、プロジェクトのメンテナンスを開始しました。現在、Evan が率いる緊密なチームがプロジェクトを推進しており、エコシステム内の他のチームと密接に協力して、彼らのフレームワークや%統合%で Vite がスムーズに動作するようにしています。[リポジトリのコントリビュータは 400 人を超えており](https://github.com/vitejs/vite/graphs/contributors)、[Discord でも活発なコミュニティが形成されています](https://chat.vitejs.com/)。プロジェクトは急速に成長しています。GitHub では [75000 以上の他のプロジェクト](https://github.com/vitejs/vite/network/dependents?package_id=UGFja2FnZS0xMTA1NzgzMTkx)で使用されており、[vite パッケージ](https://www.npmjs.com/package/vite)の npm 月間ダウンロード数は 130 万回を超えています。

## rollup

[Rollup](https://rollupjs.org/) は根本的な要素です。Vite は、独自の Rollup のセットアップに、%迅速な%開発用サーバーを組み合わせたものと考えることができます。Rollup の主要メンテナの一人である [@lukastaegert](https://twitter.com/lukastaegert) は、長い間欠けていた Rollup のウェブ開発用ラッパーとして Vite を推薦しました。%Vite は Rollup プラグインのエコシステムとの互換性があるため、Vite は先行しており%、実際に Rollup のセットアップが数多く利用されています。エコシステムの互換性を確保するために、プラグイン API を拡張する際に Rollup のメンテナが [Vite や WMR のメンテナとコミュニケーションを取っている](https://github.com/rollup/rollup/pull/4230#issuecomment-927237678)のは素晴らしいことです。

## esbuild

[esbuild](https://esbuild.github.io/) は Go で書かれたバンドラーで、ビルドツールのパフォーマンスの限界を拡張し続けています。Vite は esbuild により個々のファイルをトランスパイルしたり (typecript の型の削除、JSX のコンパイル)、(JS と CSS ファイルともに) デフォルトのミニファイアーとして使用したりしています。また、開発中に依存関係を事前にバンドルする際のバンドラーとしても使用されています。[@evanwallace](https://twitter.com/evanwallace) は素晴らしい仕事をしてくれています。esbuild は日々改善されており、タスクに応じて tsc、babel、Rollup の高速な代替手段として Vite に利用されています。
