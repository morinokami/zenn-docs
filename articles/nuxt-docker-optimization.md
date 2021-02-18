---
title: "Nuxt.js アプリのコンテナイメージの最適化" # 記事のタイトル
emoji: "🐋" # アイキャッチとして使われる絵文字（1文字だけ）
type: "tech" # tech: 技術記事 / idea: アイデア記事
topics: ["docker", "nuxtjs", "nodejs"] # タグ。["markdown", "rust", "aws"]のように指定する
published: false # 公開設定（falseにすると下書き）
---

# はじめに

最近業務にて、Nuxt.js が動作するコンテナイメージを主にサイズ面において最適化するということをおこないました。結果的に今回のケースでは、カリカリにチューニングするということはおこないませんでしたが、ローカルで `docker images` を実行して表示されるサイズを、約 2.5GB から 約 380 MB まで小さくすることができました。ここではそこで実施した内容を記述します (なお、Nuxt.js と書いてはいますが、Next.js など、他の Node.js ベースのアプリケーションでも通じる話になっています)。

以下では話をわかりやすくするために、`yarn create nuxt-app my-app` として作成された初期状態の Nuxt アプリケーションをコンテナ化する前提で Dockerfile の例などを記述していきます。具体的には、Nuxt アプリのルートに置かれている

```dockerfile
FROM node:14.15

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

CMD ["yarn", "start", "--", "--hostname", "0.0.0.0"]
```

という Dockerfile を改良することを目指します。こちらの Dockerfile を手元の環境 (Ubuntu 20.04) にてビルドすると、

```sh
$ docker build -t my-app .
$ docker images
REPOSITORY          TAG            IMAGE ID       CREATED          SIZE
my-app              latest         73d682fe6543   11 seconds ago   1.15GB
```

となり、イメージのサイズは 1.15GB でした。これがスタート地点です。最終的に、今回の例では 188MB までイメージサイズを小さくしていきます。

なお、こちらのイメージの動作確認をおこなうには、

```sh
$ docker run --rm -d -p 3000:3000 my-app
```

などとしてから、http://localhost:3000 にアクセスしてみてください。

また、今回のデモ用に[リポジトリ](https://github.com/morinokami/nuxt-docker-optimization)も作成しましたので、手元で動作確認したい場合はそちらも参照してみてください。

# なぜイメージを軽量化するのか

具体的な話に入る前に、そもそもの話となりますが、コンテナイメージを軽量化するメリットにはどういったものがあるでしょうか。

# 実行した施策

## 1. 公式の Node.js イメージを使わない

基本的なことですが、とても重要です。[公式の Node.js イメージ](https://hub.docker.com/_/node) には、アプリケーションをビルドするために必要と思われるバイナリなどが大量に含まれています。

## 2. マルチステージビルドをおこなう

## 3. devDependencies をイメージに含めない

## 4. .dockerignore ファイルを作成する

## 5. 適切にキャッシュを制御する (time コマンドで実測)

## 6. node-prune にて node_modules フォルダを最適化する
