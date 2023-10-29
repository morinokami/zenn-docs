---
title: "Next.js に対する Kent C.Dodds の批判と、Lee Robinson のアンサーの要約"
emoji: "🤔"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["nextjs", "react"]
published: false
---

## はじめに

## The Web Platform

Kent C. Dodds 曰く:

- Next.js はウェブ標準の API をラップしており、Next.js 特有の API の使用をユーザーに強いる。Testing Library が登場する前の Enzyme と同じような立ち位置にあり、Next.js で学んだ知識には可搬性 (transferability) がない。`Request` や `Response` が使える Remix を使おう。

## Independence

Kent C. Dodds 曰く:

- Next.js を Vercel 以外でまともに動かすことは難しい。その証拠として [OpenNext](https://open-next.js.org/) というプロジェクトも存在している。JavaScript が動くプラットフォームであればどこにでもデプロイ可能な Remix を使おう。

## Next.js is eating React

Kent C. Dodds 曰く:

- Next.js は React と一体化しつつあり、両者の境界線は曖昧になりつつある。多数の React チームメンバーが Vercel に移籍したが、そのせいで React チームはますます非協力的になってしまった。非協力的なチームはソフトウェアにとって良くない兆候である。

## Experimenting on my users

Kent C. Dodds 曰く:

- Next.js は安定版と称して React のカナリア版の機能を自身に組み込んでいる。その結果ユーザーのアプリケーションは不安定な実験台とされている。App Router で苦しんでいる人の数は殊の外多いようだ。React の安定した機能のみが組み込まれている Remix を使おう。

## Too much magic

Kent C. Dodds 曰く:

- グローバルの fetch をオーバーライドしたキャッシュ機能の追加など、Next.js はユーザーが予測不可能な機能追加を多くおこなっている。その結果 Next.js のユーザーは、こういった予測不可能な機能追加が他にもあるかどうか疑心暗鬼にならざるを得ない。驚き最小の原則に従って設計され、選択的に魔法を使用可能な Remix を使おう。

## Complexity

Kent C. Dodds 曰く:

- Next.js はどんどん複雑になっている。React の Server Actions はフォームを POST に変えてしまうが、セマンティクスの変更は複雑度を増加させる。こうした API をそのまま取り入れ複雑度の増大に加担する Next.js ではなく、複雑度を最小限に抑えて API を設計している Remix を使おう。

## Stability

Kent C. Dodds 曰く:

- Next.js は次々にメジャーバージョンの更新をおこなっており、安定性への配慮が欠けている。Remix は 2 年近くバージョン 1 をキープし、一ヶ月前のバージョン 2 のリリースは、その安定性の高さから「ウェブフレームワーク史上最も退屈なメジャーバージョンの増加」となった。安定性を重視するなら Remix を使おう。

## Capabiliy

## おわりに
