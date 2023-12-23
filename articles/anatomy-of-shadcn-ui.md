---
title: "shandcn/ui の内部構造を探る"
emoji: "🔎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["react", "shadcnui"]
published: true
---

## 訳者序文

以下の文章は、[shandcn/ui](https://ui.shadcn.com/) の内部構造について解説している [The anatomy of shadcn/ui](https://manupa.dev/blog/anatomy-of-shadcn-ui) を、原著者である [@manupadev](https://twitter.com/manupadev) 氏の[許可](https://twitter.com/manupadev/status/1737860265096691982)のもとに日本語へと翻訳したものです。

shadcn/ui のモチベーションや使い方に関する日本語の解説は少なくありませんが、その実装に焦点を絞って解説した文章は、訳者が知る範囲では存在しませんでした。shadcn/ui は単にコンポーネントライブラリとして優れているだけでなく、同時にコンポーネントの実装パターン集としても学ぶところが多く、そのエッセンスを知ることは多くの開発者にヒントを与えるだろうと訳者は考えていました。そうした折に、まさにドンピシャの内容の記事を発見したため、ここに翻訳して公表することとしました。shadcn/ui をなんとなく使っている状態を脱して一歩深く理解するきっかけが欲しい方や、モダンなコンポーネントの実装にはどういったライブラリが使われているのかについて興味がある方などにとって役立つ記事であると思います。

なお、この文章を書いていた日本時間の本日 12 月 23 日早朝に、Drawer や Carousel など新たなコンポーネントが shadcn/ui に追加されたことがアナウンスされました。shadcn/ui のこれからの進化が楽しみですね。

https://twitter.com/shadcn/status/1738283281424982488

それでは、以下が本文となります。

---

あなたが今年 JavaScript のエコシステム界隈をうろついていたら、そこで shadcn/ui という興味深い UI ライブラリを見かけたかもしれません。shadcn/ui のコンポーネントは npm パッケージとしては配布されず、コンポーネントのソースコードをプロジェクトに直接取得するための CLI を通じて配信されます。このライブラリの作者は、上の決定をした理由について、shadcn/ui の公式サイトで次のように述べています:

> なぜ依存関係としてパッケージ化せずにコピー・ペーストするのですか?
>
> あなたがコードに対するオーナーシップとコントロールをもち、コンポーネントのビルド方法やスタイルの適用方法を自身で決められるようにすることが、このアイデアのベースにあります。
>
> いくつかの理にかなったデフォルトを起点として、そこからコンポーネントを自分のニーズに合わせてカスタマイズしてください。
>
> コンポーネントを npm パッケージにパッケージ化することの欠点の一つは、スタイルが実装と結びついてしまうことです。コンポーネントのデザインは、その実装とは別に考えるべきです。

本質的には、shadcn/ui は単なるコンポーネントライブラリではなく、デザインシステムをコードとして表現するための仕組みといえます。

この記事の目的は、shadcn/ui のアーキテクチャと実装について調査し、上に引用した目標を達成するために shadcn/ui がどのように設計されているかについて確認することです。

もしまだ shadcn/ui を触ったことがなければ、この記事の内容を十分に吸収できるように、shadcn/ui のドキュメントを読んで少し遊んでみることをおすすめします。

## プロローグ

すべてのユーザーインターフェースは、プリミティブで再利用可能な一連のコンポーネントと、それらの組み合わせとに分解できます。そして、ある UI コンポーネントは、自身の振る舞いのセットと、指定されたスタイルの視覚的な表現とによって構成されます。

### 振る舞い

純粋に見た目の表示のみを責務とするものを除いて、UI コンポーネントは、ユーザーが実行可能なインタラクションを認識し、それに対して反応します。こうした振る舞いのために必要となる基礎はブラウザのネイティブ要素に組み込まれており、私たちが利用できるようになっています。しかし、現代的なユーザーインターフェースにおいては、ブラウザのネイティブ要素だけでは満たすことができない振る舞いを備えたコンポーネントを提供する必要があります。たとえばタブやアコーディオン、日付ピッカーなどです。そのため、我々が概念としてイメージした見た目と振る舞いを備えたカスタムコンポーネントを作成する必要が生じます。

カスタムコンポーネントの実装は、現代の UI フレームワークを使えば、表面的なレベルでは難しくありません。ただ、こうしたカスタムコンポーネントの実装において、UI コンポーネントの振る舞いに関する非常に重要な側面が見落とされがちです。たとえば、フォーカス・ブラー状態の認識、キーボードによるナビゲーション、WAI-ARIA の設計原則への準拠などがあります。ユーザーインターフェースにおいてアクセシビリティを実現するための振る舞いは非常に重要ですが、W3C の仕様に従ってこうした振る舞いを正しく実装することは非常に難しく、またプロダクト開発を大幅に遅らせる可能性もあります。

モダンなソフトウェア開発の移り変わりの速さを考えると、フロントエンドチームがカスタムコンポーネントの開発にアクセシビリティガイドラインを取り入れることは困難です。こうした負担を軽減するために企業が取るべきアプローチの一つとして、振る舞いを実装済みの、スタイルのないベースコンポーネントを開発し、各プロジェクトでそれらを使うというものがあります。ただし、これらのコンポーネントは、各チームが自身のプロジェクトのビジュアルデザインに合わせて、容易に拡張やスタイリングをおこなえるものでなければなりません。

スタイルをもたず、振る舞いのみをカプセル化した再利用可能なコンポーネントは、**Headless UI** コンポーネントと一般に呼ばれます。多くの場合、こうしたコンポーネントは、内部状態を読み取り制御するための API を公開するように設計されています。このコンセプトは、shadcn/ui のアーキテクチャにおける主要な要素の一つとなっています。

### スタイル

UI コンポーネントのもっとも具体的な側面は、その視覚的な表現です。すべてのコンポーネントは、プロジェクト全体のビジュアルテーマに基づいたデフォルトのスタイルをもちます。コンポーネントの視覚的な要素には二種類あります。一つは、コンポーネントの構造に関するものです。ボーダーの半径、縦横のサイズ、スペース、フォントサイズ、フォントウェイトなどのプロパティが、こちらに属します。もう一つは、視覚的なスタイルに関するものです。フォアグラウンドとバックグラウンドの色、アウトライン、ボーダーなどのプロパティが、こちらに属します。

ユーザーのインタラクションやアプリケーションの状態に応じて、UI コンポーネントは異なる状態へと変化することがあります。コンポーネントの視覚的なスタイルは、コンポーネントの現在の状態を反映するべきであり、ユーザーがコンポーネントとインタラクションをおこなった際にはフィードバックを提供するべきです。そのため、同じ UI コンポーネントに対して複数のバリエーションを作成しておく必要があります。こうしたバリエーションはバリアント (variants) と呼ばれることも多く、コンポーネントの状態を上手く伝えるために、構造と視覚的なスタイルを調整しながら作成されます。

ソフトウェアの開発ライフサイクルにおいて、デザインチームは、アプリケーションの忠実なモックアップを開発する際に、ビジュアルテーマやコンポーネント、バリアントを把握します。また、コンポーネントに期待される振る舞いについても文書化します。ソフトウェアに関するこうした設計判断を集約した文書は、一般に*デザインシステム*として知られています。

デザインシステムが与えられたとき、フロントエンドチームの責務はそれをコードによって表現することです。ビジュアルテーマのグローバル変数、再利用可能なコンポーネントとそのバリアントについて把握する必要があります。このアプローチの主な利点は、デザインシステムが将来変更された際に、それを効率的にコードに反映できることです。これにより、デザインチームと開発チームの間においてスムーズなワークフローを実現できます。

## アーキテクチャの概要

すでに述べたように、shadcn/ui はデザインシステムをコードにより表現するための仕組みです。これを使い、フロントエンドチームはデザインシステムを取り込み、それを開発プロセスで利用できる形式へと変換することができます。以下でこうしたワークフローを実現可能とするアーキテクチャについて詳しく見ていきましょう。

すべての shadcn/ui コンポーネントの設計は、以下のアーキテクチャへと一般化できます。

![shadcn/ui のアーキテクチャ](/images/anatomy-of-shadcn-ui/architecture-overview.webp)

shadcn/ui は、*コンポーネントのデザインは、その実装とは別のものとして考えるべきである*という原則に基づいて構築されています。そのため、shadcn/ui のすべてのコンポーネントは、以下の二層のアーキテクチャからなっています。

- 構造と振る舞いに関するレイヤー
- スタイルに関するレイヤー

### 構造と振る舞いに関するレイヤー

構造と振る舞いに関するレイヤーでは、コンポーネントはヘッドレスなかたちで実装されます。プロローグで述べたように、これはコンポーネントの構造と中心的な振る舞いがカプセル化されて表現されていることを意味します。キーボードによるナビゲーションや WAI-ARIA への準拠といった難しい考慮事項は、このレイヤーにおいて各コンポーネントごとに実装されます。

shadcn/ui は、ブラウザのネイティブ要素だけでは実装できないコンポーネントのために、定評のあるヘッドレス UI ライブラリを使用しています。 shadcn/ui のコードベースにおいてキーとなるヘッドレス UI ライブラリの一つが Radix UI です。アコーディオン、ポップオーバー、タブなどのよく使われるコンポーネントは、Radix UI の実装をベースにして作成されています。

![構造と振る舞いに関するレイヤーの概要図](/images/anatomy-of-shadcn-ui/structure-and-behavior-layer-overview.webp)

ブラウザのネイティブ要素と Radix UI コンポーネントだけでも、多くのコンポーネントの要件を満たすためには十分です。しかし、特殊なヘッドレス UI ライブラリを使う必要がある状況もあります。

そうした状況の一つにフォーム処理があります。このために shadcn/ui は、フォームの状態管理を担う **React Hook Form** ヘッドレスフォームライブラリをベースにした`Form`コンポーネントを提供しています。shadcn/ui は、React Hook Form が提供するプリミティブを使い、それらを組み合わせられるようにしてラップします。

テーブルビューを扱うために、shadcn/ui はヘッドレステーブルライブラリである **TanStack の React Table** を利用しています。shadcn/ui の `Table` と `DataTable` コンポーネントは、このライブラリをベースにして作成されています。TanStack の React Table は、フィルタリング、ソート、仮想化など、テーブルビューを扱うための API を多数提供しています。

カレンダービュー、日付ピッカー、日付範囲ピッカーは、正しく実装するのが難しいとされるコンポーネントの一つです。shadcn/ui では、これらのコンポーネントのヘッドレスレイヤーを実装するために、**React Day Picker** パッケージをベースコンポーネントとして利用しています。

### スタイルに関するレイヤー

TailwindCSS は、shadcn/ui のスタイルレイヤーにおける中核をなします。色や border-radius などの属性値は Tailwind の設定ファイルへと配置され、そこで使われる CSS 変数は global.css ファイルに定義されます。これをデザインシステム全体で共有される変数の値を管理するために利用できます。デザインツールとして Figma を使っている場合、このアプローチにより、デザインシステムにある Figma の変数と対応付けることができます。

コンポーネントのバリアントに対する異なるスタイリングを管理するために、shadcn/ui では Class Variance Authority (CVA) を使用しています。CVA は、各コンポーネントのバリアントに対するスタイリングを設定するために、非常に表現力のある API を提供しています。

以上で shadcn/ui の高レベルなアーキテクチャについて説明し終わったので、続いていくつかのコンポーネントの実装の詳細について掘り下げていきましょう。まずは shadcn/ui の中でもっともシンプルなコンポーネントから始めます。

### shadcn/ui Badge

![shadcn/ui Badge](/images/anatomy-of-shadcn-ui/badge.png)

`<Badge />` コンポーネントの実装は比較的シンプルです。そのため、これまでに議論してきたコンセプトを通じてどのようにして再利用可能なコンポーネントが実装されているかを見るためには、良い出発点となります。

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

コンポーネントの実装は、`class-variance-authority` ライブラリの `cva` 関数を呼び出すことから始まります。これはコンポーネントのバリアントを宣言するために使用されます。

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

`cva` 関数にわたす最初の引数により、`<Badge/>` コンポーネントのすべてのバリアントに適用されるベーススタイルを定義します。二つ目の引数として、`cva` は、コンポーネントが取り得るバリアントと、使用するデフォルトのバリアントを定義するための設定オブジェクトを受け取ります。また、`tailwind.config.js` において定義されたデザインシステムのトークンを消費するユーティリティスタイルの使用も確認できます。これにより、CSS 変数を調整することで簡単に見栄えを更新できることがわかります。

`cva` 関数を呼び出すと、新たに別の関数が返却されます。この関数は、各バリアントに対応するスタイルを条件に応じて適用するために使用します。バリアント名がコンポーネントに prop として渡されたときに正しいスタイルを適用するために、それを`badgeVariants` という変数に格納しています。

続いて、コンポーネントの型を定義する `BadgeProps` インターフェースが置かれています。

```tsx
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
```

バッジコンポーネントのベース要素は HTML の `div` です。そのため、このコンポーネントは、`div` 要素の拡張としてコンポーネントの使用者に公開されるべきです。これは `React.HTMLAttributes<HTMLDivElement>` 型を拡張することで実現されています。さらに、`<Badge/>` コンポーネントから `variant` prop も公開する必要があります。これにより、必要とするコンポーネントのバリアントを使用者がレンダリングできるようになります。ヘルパータイプ `VariantProps` により、利用可能なバリアントを `variants` prop に Enum として公開できます。

```tsx
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

最後に、`Badge` を定義する関数コンポーネントが置かれています。ここで、`className` と `variant` を除くすべての props を、下位の div にスプレッドするために `props` オブジェクトにまとめていることに注目してください。これにより、コンポーネントの使用者は、`div` 要素において利用可能なすべての props をやり取りできるようになります。

コンポーネントへのスタイルの適用の仕方に注目してください。`variant` prop の値を `badgeVariants` 関数に渡すと、コンポーネントのバリアントをレンダリングするために必要なすべてのユーティリティクラス名を含むクラス文字列が返されます。ここで、関数の戻り値と、`className` prop に渡された値は、`div` 要素の `className` 属性として評価される前に、`cn` という名前の関数を通してから渡されていることがわかります。

これは、shadcn/ui によって提供されている特別なユーティリティ関数です。この関数は、ユーティリティクラスを管理するために利用されます。実装を見てみましょう。

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

このユーティリティ関数は、ユーティリティクラスを管理するための二つのライブラリを組み合わせています。一つ目のライブラリは `clsx` です。これはクラス名を連結し、条件に応じてコンポーネントに対してスタイルを適用する機能を提供します。

```tsx
import React from "react";

const Link = ({ isActive, children }: { isActive: boolean, children: React.ReactNode }) => {
  return <a className={clsx("text-lg", { "text-blue-500": isActive })}>{children}</a>;
};
```

ここでは `clsx` が単独で使用されています。デフォルトでは、`text-lg` ユーティリティクラスのみが Link コンポーネントに適用されます。しかし、`isActive` prop に `true` を渡すと、`text-blue-500` ユーティリティクラスもコンポーネントに適用されるようになります。

しかし、`clsx` 単体では目的を達成できないような状況もあります。

```tsx
import React from "react";
import clsx from "clsx";

const Link = ({ isActive, children }: { isActive: boolean, children: React.ReactNode }) => {
  return <a className={clsx("text-lg text-grey-800", { "text-blue-500": isActive })}> {children}</a>;
};
```

この状況では、色のユーティリティ `text-grey-800` がデフォルトで要素に適用されています。ここでの目標は、`isActive` prop が `true` になったときに、テキストの色を `blue-500` に変更することです。しかし、CSS カスケードの仕組みのために、`text-grey-800` によって適用される色のスタイルは変更されません。

ここで `tailwind-merge` ライブラリの出番となります。`tailwind-merge` を使って上記のコードを修正してみましょう。

```tsx
import React from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

const Link = ({ isActive, children }: { isActive: boolean, children: React.ReactNode }) => {
  return <a className={twMerge(clsx("text-lg text-grey-800", { "text-blue-500": isActive }))}>{children}</a>;
};
```

`clsx` の出力が `tailwind-merge` に渡されるようになりました。`taiwlind-merge` はクラス文字列を解析し、スタイル定義を浅くマージ (shallow merge) します。つまり、`text-grey-800` は `text-blue-500` に置き換えられるため、条件に応じて適用される新しいスタイルが要素に反映されるのです。

このアプローチにより、バリアントを実装する際に発生するスタイルの競合を抑止できます。`className` prop も `cn` ユーティリティを通して渡されるため、必要に応じてスタイルを簡単にオーバーライドできるのです。ただし、ここにはトレードオフがあります。`cn` を利用することで、コンポーネントの使用者がアドホックにスタイルをオーバーライドする可能性が生まれてしまうのです。その結果、`cn` が濫用されていないかを確認するために、コードレビューのステップに一定の責任が委ねられることになります。一方で、このような振る舞いがまったく必要ない場合は、`clsx` のみを使うようにコンポーネントを変更できます。

`Badge` コンポーネントの実装を分析すると、SOLID にも関連するいくつかのパターンを見出すことができます。

1. 単一責任の原則 (Single Responsibility Principle、SRP):
    - `Badge` コンポーネントは、与えられたバリアントに基づいて異なるスタイルのバッジをレンダリングする、という単一の責任をもっているようです。スタイルの管理は `badgeVariants` オブジェクトに委ねられています。
2. 開放閉鎖の原則 (Open/Closed Principle、OCP):
    - このコードは、既存のコードを変更することなく新しいバリアントを追加できるようになっており、開放閉鎖の原則に従っているように見えます。新しいバリアントは、`badgeVariants` の定義にある `variants` オブジェクトに簡単に追加できます。
    - ただし、`cn` の使い方によっては、コンポーネントの使用者が `className` 属性を通じてオーバーライド用のスタイルを新しく渡すことが可能になります。これはコンポーネントが変更可能となることを意味します。そのため、shadcn/ui を使って独自のコンポーネントライブラリを作成する際には、そうした振る舞いを許容するかどうかを決定しておく必要があります。
3. 依存性逆転の原則 (Dependency Inversion Principle、DIP):
    - `Badge` コンポーネントとそのスタイリングは別々に定義されています。`Badge` コンポーネントは、スタイリング情報を得るために `badgeVariants` オブジェクトに依存しています。このように分離することにより、柔軟性が高まり、またメンテナンスが容易になります。これは依存性逆転の原則に準拠しているといえます。
4. 一貫性と再利用性 (Consistency and Reusability):
    - このコードは、ユーティリティ関数 `cva` を使い、バリアントに基づいてスタイルを管理・適用することで、一貫性を高めています。こうした一貫性により、開発者がコンポーネントを理解・利用することが容易になります。さらに、`Badge` コンポーネントは再利用可能であり、アプリケーションのさまざまな箇所に簡単に組み込むことができます。
5. 関心の分離 (Separation of Concerns):
    - スタイリングとレンダリングの関心が分離されています。`badgeVariants` オブジェクトはスタイリングロジックを担い、`Badge` コンポーネントはレンダリングとスタイルの適用を担います。

`Badge` コンポーネントの実装を分析したことで、shadcn/ui の一般的なアーキテクチャについて詳細に理解することができました。しかし、これは純粋に表示に関するコンポーネントでした。そこで、もう少しインタラクティブなコンポーネントを続いて見てみましょう。

### shadcn/ui Switch

![shadcn/ui Switch](/images/anatomy-of-shadcn-ui/switch.png)

```tsx
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

これは、モダンなユーザーインターフェースによく見られる、あるフィールドの値を二つの値の間で切り替えるための `Switch` コンポーネントです。`Badge` コンポーネントが純粋に表示に関するコンポーネントであったのに対し、`Switch` はユーザーの入力に応じて状態を切り替えるインタラクティブなコンポーネントです。また、視覚的なスタイルを通じて、現在の状態をユーザーに伝えることもおこないます。

ユーザーがスイッチコンポーネントを操作する主な方法は、ポインティングデバイスでスイッチをクリックあるいはタップすることです。ポインターイベントに応答するスイッチコンポーネントを作成するのは非常に簡単ですが、スイッチがキーボードの操作やスクリーンリーダーにも対応する必要がある場合、実装は複雑になります。スイッチコンポーネントに期待される振る舞いは、以下のようになります。

1. `Tab` キーを押すと、スイッチにフォーカスする。
2. フォーカスされた状態で Enter キーを押すと、スイッチの状態が切り替わる。
3. スクリーンリーダーに対して、現在の状態をユーザーに伝える。

上のコードを注意深く分析すると、スイッチの実際の構造は、`<SwitchPrimitives.Root/>` と `<SwitchPrimitives.Thumb/>` コンポーネントとが組み合わせて作成されたものであることがわかります。これらのコンポーネントはヘッドレスライブラリ RadixUI のものであり、スイッチに期待される振る舞いに関するすべての実装を含んでいます。また、このコンポーネントには `React.forwardRef` が使用されていることも確認できます。これにより、与えられた `ref` にこのコンポーネントをバインドすることが可能になります。これは、フォーカス状態を追跡したり、特定の外部ライブラリと統合する必要がある場合に便利な機能です。たとえば、React Hook Form ライブラリで入力用にこのコンポーネントを使うためには、ref を通じてフォーカスできるようになっている必要があります。

上述した通り、RadixUI のコンポーネントはスタイリングを提供していません。そのため、スタイルは `cn` ユーティリティ関数を通してから直接 `className` prop に適用されています。必要に応じて `cva` を使ってコンポーネントのバリアントを作成することもできるでしょう。

## 結論

ここまで議論してきた shadcn/ui のアーキテクチャと構造は、shadcn/ui の他のコンポーネントでも同様に実装されています。ただし、一部のコンポーネントの振る舞いや実装はもう少し複雑です。そうしたコンポーネントのアーキテクチャについては、別の記事として議論する価値があるでしょう。そのため、ここではその詳細には触れず、それらの構造についての概要を示すにとどめます。

1. `Calendar`
    - `react-day-picker` をヘッドレスコンポーネントとして使用しています。
    - `date-fns` を日時のフォーマットライブラリとして使用しています。
2. `Table` と `DataTable`
    - `@tanstack/react-table` をヘッドレステーブルライブラリとして使用しています。
3. `Form`
    - `react-hook-form` のヘッドレスコンポーネントにより、フォームの作成やフォームの状態管理ライブラリをおこなっています。
    - shadcn/ui は、フォームロジックをカプセル化したユーティリティコンポーネントを露出しています。これらは入力やエラーメッセージなどのフォームの部品を組み立てるために使用します。
    - フォームのスキーマ検証ライブラリとして `zod` を使用しています。`zod` によって返されるバリデーションエラーは、フォームの入力欄の横にエラーを表示する `<FormMessage />` コンポーネントに渡されます。

shadcn/ui は、フロントエンド開発について考えるための新しいパラダイムを導入しました。コンポーネント全体を抽象化するサードパーティのパッケージに依存するのではなく、コンポーネントの実装を自ら所有し、必要な要素のみを公開するという考え方です。デザインシステムを具体化する際に、既成のコンポーネントライブラリ独自の API によって制限されることなく、カスタマイズ可能な優れたデフォルトをスタート地点として始めてみるのはいかがでしょうか。
