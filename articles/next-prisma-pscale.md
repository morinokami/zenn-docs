---
title: "Next.js + Prisma + PlanetScale"
emoji: "🪐"
type: "tech"
topics: [nextjs, prisma, planetscale]
published: false
---

## はじめに

この記事では、Next.js アプリケーションを Prisma により PlanetScale へと接続する方法について解説します。まず、簡単に各技術の紹介をおこなった上で、簡単な Next.js アプリケーションを例として、Prisma と PlanetScale を用いてデータを永続化する流れを示していきます。また最後にオマケとして、作成したアプリケーションを Vercel へとデプロイする方法についても触れます。

### Next.js

[Next.js](https://nextjs.org/) は、[Vercel](https://vercel.com/) が提供する React フレームワークです。[CSR](https://en.wikipedia.org/wiki/Single-page_application)、[SSR](https://nextjs.org/docs/basic-features/pages#server-side-rendering)、[SSG](https://nextjs.org/docs/basic-features/pages#static-generation-recommended)^[Next.js のウェブサイトでは、SSG という言葉は現在使われておらず、Static Generation と呼ばれていることに注意してください。]、[ISR](https://vercel.com/docs/concepts/next.js/incremental-static-regeneration) などのレンダリングパターンをサポートしています。また、直近の Next.js Conf では、React の進化に追随し、[Suspense や SSR streaming をサポート](https://nextjs.org/docs/advanced-features/react-18)していくことも発表されています。

https://youtu.be/dMBYI7pTR4Q

### Prisma

[Prisma](https://www.prisma.io/) は、Node.js と TypeScript 向けの ORM です。hoge

https://youtu.be/EEDGwLB55bI

### PlanetScale

[PlanetScale](https://planetscale.com/) は、[Vitess](https://vitess.io/) を基礎として作成された、新しいサーバーレス DB サービスです。

https://youtu.be/0w-pst8cTSo


## Next.js による Contacts App

まず、土台となるアプリケーションについて説明します。ここでは複雑なアプリケーションは不要なため、以下の動画に登場する [Contacts App](https://github.com/chenkie/next-prisma) に手を加えたものを用いることにします:

https://youtu.be/FMnlyi60avU


## Prisma

### Install the Prisma CLI: npm install prisma --save-dev

### Install the Prisma Client: npm install @prisma/client

### Set up Prisma files: npx prisma init

### Edit shema.prisma

* referentialIntegrity*
* https://docs.planetscale.com/learn/operating-without-foreign-key-constraints

### Edit .env


## PlanetScale

### Install the MySQL command-line client

###  Install the PlanetScale CLI

https://docs.planetscale.com/concepts/planetscale-environment-setup

### Sign in to your account: pscale auth login

### Create a PlanetScale database: pscale db create <DATABASE_NAME> --region <REGION>

### Create a development branch: pscale branch create <DATABASE_NAME> <BRANCH_NAME>

### Connect to PlanetScale: pscale connect <DATABASE_NAME> <BRANCH_NAME> --port 3309

### Push Prisma schema to PlanetScale: npx prisma db push

### Deploy development branch to production

https://docs.planetscale.com/tutorials/prisma-quickstart#deploy-development-branch-to-production

### Create a deploy request

https://docs.planetscale.com/tutorials/prisma-quickstart#create-a-deploy-request

### Reconnect to PlanetScale: pscale connect <DATABASE_NAME> main --port 3309

### Run the app: npm run dev


## Vercel へのデプロイ

https://github.com/planetscale/nextjs-conf-2021#deploy-on-vercel
