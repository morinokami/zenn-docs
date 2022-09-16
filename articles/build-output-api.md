---
title: "Vercel というプラットフォームを抽象化する Build Output API について"
emoji: "🔺"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vercel"]
published: false
---

# はじめに

2022 年 7 月、Vercel は [Build Output API](https://vercel.com/docs/build-output-api/v3) という新しい機能をリリースしました^[正確に述べると、File System API という同じような仕組みが以前からあったのですが、それを大きく変更して Build Output API という新しい名前のもとでリリースした、ということのようです。こうした経緯については https://github.com/vercel/community/discussions/577#discussion-4034102 に詳しく書かれています。]。Vercel というと、最近では [Layouts RFC](https://nextjs.org/blog/layouts-rfc) が Next.js のルーティング、レイアウト、データ取得の構造を大きく変えるということでもっぱら話題になっているようです。一方、Build Output API はそれほど大きな注目を集めているわけではないようですが、調べてみると、実行環境としての Vercel というプラットフォームへと他のフレームワークを統合することを目指した野心的な試みであることがわかり、非常に興味深かったため、記事としてまとめてみることにしました。

なお、記事を作成するに際し、以下の 3 つのコンテンツ (文書と動画) を主に参照しました。いずれも趣が異なっており、また通読・視聴にそれほど時間が掛かる分量でもないため、Build Output API に興味をもった方は以下すべてに目を通すことをお勧めします。

* [Announcing the Build Output API](https://vercel.com/blog/build-output-api): Build Output API のモチベーションや概要を説明した Vercel のブログ記事
* [Build Output API (v3)](https://vercel.com/docs/build-output-api/v3): Build Output API のリファレンス
* [Building a modern web framework with Vercel's Build Output API](https://youtu.be/j6qweJF_TIc): Build Output API を使い、Vercel が提供する画像最適化や ISR などの機能を備えたフレームワークを自作する、という実践的なコンテンツ

# Build Output API とは何か

Build Output API は、あるコードの集まりが Vercel 上で動作するために必要となるディレクトリ構造と設定方法を定めた仕様です。つまり、たとえばあるフレームワークのビルド結果が Build Output API に従っていれば、そのビルドを Vercel へとデプロイして実行することができるというわけです。よって、Nuxt や SvelteKit などのフレームワークが Vercel 上で動作するためには、それらフレームワークのビルドツールが Build Output API に従ってビルド結果を出力すればいいということになります。また、ディレクトリの内容が特定のフレームワークの出力であるかどうかは関係なく、手動で Build Output API に沿ってディレクトリの内容を構成し、Vercel へとデプロイすることも可能です。

このように、あるビルドの出力 (Build Output) が Vercel 上で動作するために満たすべき規約を定めたものが、Build Output API です。

ところで、上で「Vercel 上で動作」と何度か書きましたが、これの意味するところはなんでしょうか。通常、Vercel へとデプロイする前提のもとで Next.js による開発をおこなう際、

* [画像最適化](https://nextjs.org/docs/basic-features/image-optimization)
* [Middleware](https://nextjs.org/docs/advanced-features/middleware)
* [Serverless Functions](https://nextjs.org/docs/api-routes/introduction)
* [Edge Functions](https://nextjs.org/docs/api-routes/edge-api-routes)
* [Static Generation](https://nextjs.org/docs/basic-features/pages#static-generation-recommended)^[Static Site Generation (SSG) という用語も一般的によく使われますが、これは Vercel のドキュメントでは最近は使われていないため、ここでもそれに従いました。]
* [Server-side Rendering (SSR)](https://nextjs.org/docs/basic-features/pages#server-side-rendering)
* [Incremental Static Regeneration (ISR)](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)

といった様々な機能を組み合わせると思います。実は、Build Output API に従うことで、Next.js を使用せずともこうした機能をすべて利用することができます。よって、たとえばあるフレームワークの開発者が ISR をサポートしたいと考えた場合、Build Output API に従ってビルド結果を出力すれば、少なくとも Vercel 上では ISR を利用することができるというわけです。

# Build Output API がもたらすもの

さて、

# 具体例から学ぶ
