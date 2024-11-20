---
title: "Astro の Ecosystem CI について"
emoji: "🪸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["astro"]
published: false
---

## はじめに

私たちがソフトウェアを開発する際、多くの場合、外部のライブラリやパッケージに依存することになります。そして、それらのライブラリもまた、他のライブラリへと依存しています。こうしたソフトウェア間の依存関係は巨大なネットワークを形成し、そのネットワーク全体あるいはサブネットワークは「エコシステム」と呼ばれることがあります。特に、あるソフトウェア X とそれに依存するソフトウェア群は「X のエコシステム」などと呼ばれます。たとえば「Python のエコシステムは巨大だ」とか「React のエコシステムは成熟している」といった表現は、開発者であればよく耳にするのではないかと思います。

ここで、あるソフトウェア X の評価は、X の品質にのみ依存するわけではなく、X のエコシステム全体に依存する場合が多いことに注意が必要です。たとえば、React が 2024 年現在において UI ライブラリとして圧倒的な地位を占めていることは多くの開発者が認めるところであると思われますが、それは単に React が優れたソフトウェアであるからそうなったというよりも、React のエコシステムを支える他のライブラリやツールの品質や規模がそうした認識を形成する大きな要因となったはずです。

つまり、「あるソフトウェアが評価されるためには、それを支えるエコシステムの規模が大きく、かつ全体が正しく動作している必要がある」ということを意味します。逆に言えば、エコシステムが充実していなかったり壊れてしまっていれば、そのソフトウェアは使いづらいものとなり、開発者の選択肢から外れていく可能性が高くなります。このような観点から、あるソフトウェアを開発している主体は、そのソフトウェアを中心としたエコシステムの品質を保つための取り組みをおこなう動機をもつことがわかります。

こうした「あるソフトウェアを中心としたエコシステムの品質を保つための取り組み」の一つとして現在広まりつつある仕組みが Ecosystem CI です。この記事では、まず Ecosystem CI の起源となった Vite における取り組みやその現状について紹介し、次にその影響のもと Astro にも導入された [astro-ecosystem-ci](https://github.com/withastro/astro-ecosystem-ci) について詳しく見ていきます。

## Ecosystem CI について

### vite-ecosystem-ci

Vite のエコシステムは巨大です。2024 年現在、Vite の週間ダウンロード数は 1600 万回を超えており、ちょうど一年間で倍増しています。以下は https://npmtrends.com/vite を執筆時点で開いた際のスクリーンショットです:

![Vite npm trends](/images/astro-ecosystem-ci/npm-trends-vite.png)

Vite に依存するライブラリやツールも増え続けており、その数は枚挙に暇がありません。Vite 自身が進化し、そのエコシステムも成長することで、それがまた Vite 自身の追い風となるという、正のフィードバックループが形成されているように思えます。

一方で、このようにエコシステムが巨大化していくに連れて、段々と開発がしづらくなっていくことは想像に難くありません。予想外の破壊的変更を組み込んでしまったりすれば、その影響は巨大なエコシステム全体に波及するため、必然的に慎重な開発が求められるようになり、また実際にエコシステムに問題を生じさせるかどうかを予測することも困難になります。

こうした状況を打開するために、Vite は Ecosystem CI という仕組みを導入しました。Vite の Ecosystem CI は [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) というリポジトリで管理されており、[dominikg](https://github.com/dominikg) らを中心に開発が進められています。

vite-ecosystem-ci は、次の図のように、Vite の変更に対して実行される CI パイプラインの一部であり、なんちゃらかんちゃら

![vite-ecosystem-ci の流れ](/images/astro-ecosystem-ci/vite-ecosystem-ci.png =296x)

うんたらかんたら

以上のように、Vite では Ecosystem CI という仕組みが導入され、Vite のエコシステムの主要なパッケージが意図せず壊れていないことや、また壊れた場合にも早期に連携し修正をおこなえることを担保し、エコシステム全体の品質の維持が図られています。Vite における Ecosystem CI の意義については、以下の Dominik G. による ViteConf の動画も参考になるため、興味のある方はぜひご覧ください:

https://www.youtube.com/watch?v=UgQtYT1DMiw

https://www.youtube.com/watch?v=7L4I4lDzO48

### Ecosystem CI の普及

上で述べた Ecosystem CI という取り組みは、Vite エコシステムという枠を超え、他のエコシステムにも広まっています。代表的な例でいえば、UI フレームワークの Vue や Svelte、モノレポ管理ツールの Nx、テストフレームワークの Vitest などが挙げられます。Ecosystem CI を取り入れている主要なプロジェクトをざっくり列挙すると以下のようになります:

- Vue: [vuejs/ecosystem-ci](https://github.com/vuejs/ecosystem-ci)
- Svelte: [sveltejs/svelte-ecosystem-ci](https://github.com/sveltejs/svelte-ecosystem-ci)
- Nuxt: [nuxt/ecosystem-ci](https://github.com/nuxt/ecosystem-ci)
- Astro: [withastro/astro-ecosystem-ci](https://github.com/withastro/astro-ecosystem-ci)
- Nx: [nrwl/nx-ecosystem-ci](https://github.com/nrwl/nx-ecosystem-ci)
- Vitest: [vitest-dev/vitest-ecosystem-ci](https://github.com/vitest-dev/vitest-ecosystem-ci)
- Rspack: [rspack-contrib/rspack-ecosystem-ci](https://github.com/rspack-contrib/rspack-ecosystem-ci)、[rspack-contrib/rsbuild-ecosystem-ci](https://github.com/rspack-contrib/rsbuild-ecosystem-ci)
- Biome: [biomejs/ecosystem-ci](https://github.com/biomejs/ecosystem-ci)
- Oxc: [oxc-project/oxlint-ecosystem-ci](https://github.com/oxc-project/oxlint-ecosystem-ci)

何らかのかたちで Vite と関連のあるプロジェクトが多いですが、かなり有名なプロジェクトにおいても Ecosystem CI が導入されていることがわかると思います。状態管理ライブラリの Jotai なども、現在はまだ CI 自体は動いていないようですが、https://github.com/jotaijs/jotai-ecosystem-ci というリポジトリを作成して導入の準備を進めているようです。こうして様々なプロジェクトに Ecosystem CI が普及していく流れのなかで、2024 年に Astro にも Ecosystem CI が導入されました。

## astro-ecosystem-ci
