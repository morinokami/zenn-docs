---
title: "Vercel というプラットフォームを抽象化する Build Output API について"
emoji: "🔺"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vercel"]
published: false
---

# はじめに

2022 年 7 月に Vercel は [Build Output API](https://vercel.com/docs/build-output-api/v3) という新しい機能をリリースしました。Vercel というと、最近では [Layouts RFC](https://nextjs.org/blog/layouts-rfc) が Next.js のルーティング、レイアウト、データ取得の構造を大きく変えるということでもっぱら話題になっているようです。一方、Build Output API はそれほど大きな注目を集めているわけではないようですが、調べてみると、実行環境としての Vercel というプラットフォームへと他のフレームワークを統合することを目指した野心的な試みであることがわかり、非常に興味深かったため、記事としてまとめてみることにしました。

なお、記事を作成するに際し、以下の 3 つのコンテンツを主に参照しました。いずれも趣が異なっており、また通読・視聴にそれほど時間が掛かる分量でもないため、Build Output API に興味をもった方はすべてに目を通すことをお勧めします。

* [Announcing the Build Output API](https://vercel.com/blog/build-output-api): Build Output API のモチベーションや概要を説明した Vercel のブログ記事
* [Build Output API (v3)](https://vercel.com/docs/build-output-api/v3): Build Output API のリファレンス
* [Building a modern web framework with Vercel's Build Output API](https://youtu.be/j6qweJF_TIc): Build Output API を使い、Vercel が提供する画像最適化や ISR などの機能を備えたフレームワークを自作する、という実践的なコンテンツ

# Build Output API とは何か

# Build Output API がもたらすもの

# 具体例から学ぶ
