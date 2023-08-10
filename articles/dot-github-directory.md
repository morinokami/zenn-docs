---
title: ".github ディレクトリでできること"
emoji: "⚙️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["github"]
published: true
---

## はじめに

GitHub Actions のワークフローを管理したり、あるいは Pull Request テンプレートを置いたりなど、常日頃からお世話になっている `.github` ディレクトリですが、最近ふと「このディレクトリでできることを自分は網羅的に把握していない」ということに気付きました。そこで [GitHub Docs](https://docs.github.com/en) で `.github` ディレクトリに関する総合的な解説資料を探してみたのですが、個別の用途に関するページなどはすぐに見つかるものの、`.github` ディレクトリそのものをターゲットとしたページは存在しないようでした（もしご存知の方がいれば教えていただけるとありがたいです）。

上に書いたような背景のもと、「`.github` ディレクトリを使ってできることのリスト」をまとめることに一定の価値があるのではないかと考え、この記事を書くに至りました。概要を箇条書き的に並べているため、全体をざっと読んでから、知らなかった・気になった箇所の公式ドキュメントを深掘りするのに向いているかもしれません。なお、自分なりに調べられる限りの機能をまとめましたが、もし不足等あればコメントなどで補足いただけますと幸いです。

## 主な機能

`.github` ディレクトリをリポジトリのルートに配置すると、GitHub の一部の機能をカスタマイズしたり、リポジトリに関するメタデータを設定できます。以下は `.github` ディレクトリで設定可能な項目の一覧です。それぞれの役割と設定例なども引用を交えつつ簡単に記述していますが、詳しくはドキュメントなどを確認してください。

なお、以下に挙げた項目のうち、設定ファイルを`.github` ディレクトリ以外の場所に配置することが可能なものもあることに注意してください。たとえば、GitHub Actions のワークフロー定義は必ず `.github` ディレクトリに配置しなければならないのに対し、プロジェクト内での行動規範を示すための `CODE_OF_CONDUCT.md` ファイルはルートディレクトリや `docs` ディレクトリなどその他の場所を選択することも可能です。こうした事情から、念のため、`.github` ディレクトリ以外でも設定可能な項目については、説明の末尾に配置可能な場所のリストも示しておきます。

### Issue テンプレートの設定

Issue テンプレートを設定することで、Issue 作成時にそのテンプレートが自動的に適用され、Issue の内容を標準化することができます。テンプレートは複数用意することができ、Issue 作成時にはテンプレートの一覧から選択することができます。また、フォームを用いた複雑なテンプレートを作成することも可能です。

Issue テンプレートを設定するには、`.github/ISSUE_TEMPLATE` ディレクトリにテンプレートファイルを配置します。テンプレートファイルは Markdown 形式で記述します。たとえば以下のファイルは、機能追加用のデフォルトテンプレートとして GitHub が提供しているものです:

```markdown:.github/ISSUE_TEMPLATE/feature_request.md
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: ''
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

Issue テンプレートについて詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository

### Pull Request テンプレートの設定

Pull Request テンプレートも Issue テンプレートと同様に、PR の内容化を標準化するためのものです。テンプレートは複数用意することができ、その際は `template` クエリパラメータを利用して使用するテンプレートを選択します。

Pull Request テンプレートを設定するには、`.github` ディレクトリに `pull_request_template.md` ファイルを配置します。たとえば以下のファイルは、[Astro](https://astro.build/) の[ドキュメント用リポジトリ](https://github.com/withastro/docs)で使用されているテンプレートです:

```markdown:.github/pull_request_template.md
<!-- Thank you for opening a PR! We really appreciate you taking the time to help out 🙌 -->

#### What kind of changes does this PR include?
<!-- Delete any that don’t apply -->

- Minor content fixes (broken links, typos, etc.)
- New or updated content
- Translated content
- Changes to the docs site code
- Something else!

#### Description

- Closes # <!-- Add an issue number if this PR will close it. -->
- What does this PR change? Give us a brief description.
- Did you change something visual? A before/after screenshot can be helpful.

<!-- Are these docs for an upcoming Astro release? -->
<!-- Uncomment the line below and fill in the future Astro version and link the relevant `withastro/astro` PR.  -->
<!-- #### For Astro version: `version`. See [Astro PR #](url). -->

<!--
Here’s what will happen next:

1. Our GitHub bots will run to check your changes.
   If they spot any broken links you will see some error messages on this PR.
   Don’t hesitate to ask any questions if you’re not sure what these mean!

2. In a few minutes, you’ll be able to see a preview of your changes on Netlify 🥳

3. One or more of our maintainers will take a look and may ask you to make changes.
   We try to be responsive, but don’t worry if this takes a day or two.
-->
```

Pull Request テンプレートは、`.github` ディレクトリ以外にプロジェクトのルートディレクトリや `docs` ディレクトリに配置することもできます。また、複数のテンプレートを配置するためには、`PULL_REQUEST_TEMPLATE` ディレクトリをいずれかのディレクトリに作成し、その中にテンプレートファイルを配置します。

Pull Request テンプレートについて詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository

### GitHub Actions ワークフローの定義

GitHub Actions は、GitHub が提供する CI/CD サービスです。GitHub Actions を利用することで、リポジトリに対する様々な処理を自動化することができます。たとえば、PR がマージされた際に自動でデプロイをおこなうような処理を GitHub Actions で実行することができます。GitHub Actions ではワークフローと呼ばれる単位で処理を定義します。ワークフローは YAML 形式で記述し、`.github/workflows` ディレクトリに配置します。

以下は、GitHub Actions 公式の [starter-workflows](https://github.com/actions/starter-workflows) リポジトリで提供されている、Node.js 用ワークフローの例です。このワークフローは、デフォルトブランチへの `push` イベントと `pull_request` イベントに対して、パッケージのインストールとキャッシュ、プロジェクトのビルド、テストの実行をおこないます:

```yaml:.github/workflows/node.js.yml
name: Node.js CI

on:
  push:
    branches: [ $default-branch ]
  pull_request:
    branches: [ $default-branch ]

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
        # See supported Node.js release schedule at https://nodejs.org/en/about/releases/

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
```

GitHub Actions について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions

### Dependabot の設定

Dependabot は、GitHub が提供する依存パッケージの自動更新サービスです。また、パッケージの脆弱性を検知しセキュリティアップデートを自動で適用したり、アラートを送信することも可能です。各機能は公式にはそれぞれ Dependabot version updates、Dependabot security updates、Dependabot alerts と呼ばれています。

Dependabot version updates を設定するためには、`.github` ディレクトリに `dependabot.yml` ファイルを作成します。以下は、Dependabot version updates の設定方法に関する[ドキュメント](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates#example-dependabotyml-file)に記載されている、`dependabot.yml` のサンプルファイルです:

```yaml:.github/dependabot.yml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    # Look for `package.json` and `lock` files in the `root` directory
    directory: "/"
    # Check the npm registry for updates every day (weekdays)
    schedule:
      interval: "daily"

  # Enable version updates for Docker
  - package-ecosystem: "docker"
    # Look for a `Dockerfile` in the `root` directory
    directory: "/"
    # Check for updates once a week
    schedule:
      interval: "weekly"
```

Dependabot security updates に関する設定も同様に `.github/dependabot.yml` に記述します。どのオプションがどちらの機能に対応しているかなどについて、詳しくはリファレンスを参照してください:

https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file

Dependabot の設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates
https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates
https://docs.github.com/en/code-security/dependabot/dependabot-alerts/configuring-dependabot-alerts

### コードオーナーの設定

リポジトリ内の各コードに対してオーナーを設定することで、そのコードに関する PR が作成された際にそのオーナーを自動でアサインすることができます。また、[Branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) と組み合わせ、オーナーの承認がなければ PR をマージできないようにすることも可能です。特定のディレクトリやファイル拡張子に対して細かくオーナーを設定することができ、オーナーには GitHub のユーザー名やチーム名を指定できます。

コードオーナーは `.github/CODEOWNERS` ファイルに記述します。以下は、コードオーナーの設定方法に関する[ドキュメント](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners#example-of-a-codeowners-file)に記載されている、`.github/CODEOWNERS` のサンプルファイルです。対象となるコードをまず指定し、その後にオーナーを指定します。

```yaml:.github/CODEOWNERS
# This is a comment.
# Each line is a file pattern followed by one or more owners.

# These owners will be the default owners for everything in
# the repo. Unless a later match takes precedence,
# @global-owner1 and @global-owner2 will be requested for
# review when someone opens a pull request.
*       @global-owner1 @global-owner2

# Order is important; the last matching pattern takes the most
# precedence. When someone opens a pull request that only
# modifies JS files, only @js-owner and not the global
# owner(s) will be requested for a review.
*.js    @js-owner #This is an inline comment.

# You can also use email addresses if you prefer. They'll be
# used to look up users just like we do for commit author
# emails.
*.go docs@example.com

# Teams can be specified as code owners as well. Teams should
# be identified in the format @org/team-name. Teams must have
# explicit write access to the repository. In this example,
# the octocats team in the octo-org organization owns all .txt files.
*.txt @octo-org/octocats

# In this example, @doctocat owns any files in the build/logs
# directory at the root of the repository and any of its
# subdirectories.
/build/logs/ @doctocat

# The `docs/*` pattern will match files like
# `docs/getting-started.md` but not further nested files like
# `docs/build-app/troubleshooting.md`.
docs/*  docs@example.com

# In this example, @octocat owns any file in an apps directory
# anywhere in your repository.
apps/ @octocat

# In this example, @doctocat owns any file in the `/docs`
# directory in the root of your repository and any of its
# subdirectories.
/docs/ @doctocat

# In this example, any change inside the `/scripts` directory
# will require approval from @doctocat or @octocat.
/scripts/ @doctocat @octocat

# In this example, @octocat owns any file in a `/logs` directory such as
# `/build/logs`, `/scripts/logs`, and `/deeply/nested/logs`. Any changes
# in a `/logs` directory will require approval from @octocat.
**/logs @octocat

# In this example, @octocat owns any file in the `/apps`
# directory in the root of your repository except for the `/apps/github`
# subdirectory, as its owners are left empty.
/apps/ @octocat
/apps/github
```

`CODEOWNERS` ファイルは、`.github` ディレクトリ以外にプロジェクトのルートディレクトリや `docs` ディレクトリに配置することもできます。

コードオーナーの設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

### スポンサーの募集

`.github/FUNDING.yml` ファイルを作成し、プロジェクトのスポンサーを募集することができます。このファイルには、資金の獲得に使用するプラットフォームと、対象となるユーザー名を記述します。

たとえば、以下は [Hono](https://github.com/honojs/hono/blob/fc73d5d105b65ae823184d33e67c8228aa1c2e02/.github/FUNDING.yml) がリポジトリに配置している `FUNDING.yml` です。GitHub Sponsors を使用しており、Hono 作者の [yusukebe](https://twitter.com/yusukebe) さんなどの名前が並んでいます。

```yaml:.github/FUNDING.yml
github: ['yusukebe', 'usualoma']
```

この設定により、以下のようなスポンサーボタンがリポジトリのページに表示されるようになります:

![Hono のスポンサーボタン](/images/dot-github-directory/github-sponsors.png)

スポンサーの募集について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository
### コントリビューションガイドラインの設定

プロジェクトへの貢献の仕方、たとえばコミットメッセージのフォーマットや、コードのスタイルガイドなどを記述したコントリビューションガイドラインを作成することで、リポジトリに対する PR や Issue に関連するコミュニケーションを円滑にすることができます。コントリビューションガイドラインは、`.github/CONTRIBUTING.md` に記述します。

内容はプロジェクトごとに千差万別ですが、比較的簡潔なガイドラインの例として、[ESLint の `CONTRIBUTING.md`](https://github.com/eslint/eslint/blob/a766a48030d4359db76523d5b413d6332130e485/CONTRIBUTING.md) を引用してみます:

```markdown:.github/CONTRIBUTING.md
# Contributing

Please be sure to read the contribution guidelines before making or requesting a change.

## Code of Conduct

This project adheres to the [Open JS Foundation Code of Conduct](https://eslint.org/conduct). We kindly request that you read over our code of conduct before contributing.

## Filing Issues

Before filing an issue, please be sure to read the guidelines for what you're reporting:

* [Report Bugs](https://eslint.org/docs/latest/contribute/report-bugs)
* [Propose a New Rule](https://eslint.org/docs/latest/contribute/propose-new-rule)
* [Propose a Rule Change](https://eslint.org/docs/latest/contribute/propose-rule-change)
* [Request a Change](https://eslint.org/docs/latest/contribute/request-change)

To report a security vulnerability in ESLint, please use our [HackerOne program](https://hackerone.com/eslint).

## Contributing Code

In order to submit code or documentation to an ESLint project, you’ll be asked to sign our CLA when you send your first pull request. (Read more about the Open JS Foundation CLA process at <https://cla.openjsf.org/>.) Also, please read over the [Pull Request Guidelines](https://eslint.org/docs/latest/contribute/pull-requests).

## Full Documentation

Our full contribution guidelines can be found at:
<https://eslint.org/docs/latest/contribute/>
```

`CONTRIBUTING.md` ファイルは、`.github` ディレクトリ以外にプロジェクトのルートディレクトリや `docs` ディレクトリに配置することもできます。

コントリビューションガイドラインの設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors

### セキュリティポリシーの設定

リポジトリのセキュリティ脆弱性を報告するための手順を記述したセキュリティポリシーを配置することもできます。セキュリティポリシーは、`.github/SECURITY.md` に記述します。

これもプロジェクトごとに内容は様々ですが、たとえば Microsoft は Organization レベルのセキュリティポリシーとして以下の `SECURITY.md` を[用意しています](https://github.com/microsoft/.github/blob/74f8e39cfbd9bc41e5f52f3959a817fab57edb7f/SECURITY.md):

```markdown:.github/SECURITY.md
<!-- BEGIN MICROSOFT SECURITY.MD V0.0.5 BLOCK -->

# Security

Microsoft takes the security of our software products and services seriously, which includes all source code repositories managed through our GitHub organizations, which include [Microsoft](https://github.com/Microsoft), [Azure](https://github.com/Azure), [DotNet](https://github.com/dotnet), [AspNet](https://github.com/aspnet), [Xamarin](https://github.com/xamarin), and [our GitHub organizations](https://opensource.microsoft.com).

If you believe you have found a security vulnerability in any Microsoft-owned repository that meets [Microsoft's definition of a security vulnerability](https://learn.microsoft.com/previous-versions/tn-archive/cc751383(v=technet.10)), please report it to us as described below.

## Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them to the Microsoft Security Response Center (MSRC) at [https://msrc.microsoft.com/create-report](https://msrc.microsoft.com/create-report).

If you prefer to submit without logging in, send email to [secure@microsoft.com](mailto:secure@microsoft.com).  If possible, encrypt your message with our PGP key; please download it from the [Microsoft Security Response Center PGP Key page](https://www.microsoft.com/msrc/pgp-key-msrc).

You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message. Additional information can be found at [microsoft.com/msrc](https://www.microsoft.com/msrc). 

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

  * Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
  * Full paths of source file(s) related to the manifestation of the issue
  * The location of the affected source code (tag/branch/commit or direct URL)
  * Any special configuration required to reproduce the issue
  * Step-by-step instructions to reproduce the issue
  * Proof-of-concept or exploit code (if possible)
  * Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

If you are reporting for a bug bounty, more complete reports can contribute to a higher bounty award. Please visit our [Microsoft Bug Bounty Program](https://microsoft.com/msrc/bounty) page for more details about our active programs.

## Preferred Languages

We prefer all communications to be in English.

## Policy

Microsoft follows the principle of [Coordinated Vulnerability Disclosure](https://www.microsoft.com/msrc/cvd).

<!-- END MICROSOFT SECURITY.MD BLOCK -->
```

`SECURITY.md` ファイルは、`.github` ディレクトリ以外にプロジェクトのルートディレクトリや `docs` ディレクトリに配置することもできます。

セキュリティポリシーの設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository

### 行動規範の設定

プロジェクトの行動規範を明示することもできます。行動規範は、OSS 開発という場における公共性を担保するために重要となります。行動規範は、`.github/CODE_OF_CONDUCT.md` に記述します。

行動規範の例としては、React や Next.js などが採用している [Contributor Covenant](https://www.contributor-covenant.org/) があります。Contriburor Covenant は、様々なプロジェクトに共通するような核となる価値観や規範を定めたものです。[日本語訳](https://www.contributor-covenant.org/ja/version/2/0/code_of_conduct/)もあるようですので、興味のある方は参照してみてください。

`CODE_OF_CONDUCT.md` ファイルは、`.github` ディレクトリ以外にプロジェクトのルートディレクトリや `docs` ディレクトリに配置することもできます。

行動規範の設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-code-of-conduct-to-your-project

### サポート情報の提示

ユーザーに対してどのようなサポートが可能かどうかを提示することも可能です。こうしたサポート情報は、`.github/SUPPORT.md` に記述します。

以下は [Node.js](https://github.com/nodejs/node/blob/d150316a8ecad1a9c20615ae62fcaf4f8d060dcc/.github/SUPPORT.md) の `SUPPORT.md` の例です。この場合、まずは自力救済を試みてほしい旨が書いてあり、それでも解決しない場合は Stack Overflow や Slack などで質問することを勧めています。

```markdown:.github/SUPPORT.md
# Support

Node.js contributors have limited availability to address general support
questions. Please make sure you are using a [currently-supported version of
Node.js](https://github.com/nodejs/Release#release-schedule).

When looking for support, please first search for your question in these venues:

* [Node.js Website](https://nodejs.org/en/), especially the
  [API docs](https://nodejs.org/api/)
* [Node.js Help](https://github.com/nodejs/help)
* [Open or closed issues in the Node.js GitHub organization](https://github.com/issues?utf8=%E2%9C%93&q=sort%3Aupdated-desc+org%3Anodejs+is%3Aissue)

If you didn't find an answer in the resources above, try these unofficial
resources:

* [Questions tagged 'node.js' on Stack Overflow](https://stackoverflow.com/questions/tagged/node.js)
* [#node.js channel on libera.chat](https://web.libera.chat?channels=node.js&uio=d4)
* [Node.js Slack Community](https://node-js.slack.com/)
  * To register: [nodeslackers.com](https://www.nodeslackers.com/)

GitHub issues are for tracking enhancements and bugs, not general support.

The open source license grants you the freedom to use Node.js. It does not
guarantee commitments of other people's time. Please be respectful and manage
your expectations.
```

`SUPPORT.md` ファイルは、`.github` ディレクトリ以外にプロジェクトのルートディレクトリや `docs` ディレクトリに配置することもできます。

サポート情報の設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-support-resources-to-your-project

### README

`README.md` ファイルを `.github` ディレクトリに配置することもできます。この場合、`.github` ディレクトリに配置された `README.md` ファイルは、リポジトリのトップに表示されます。`.github` ディレクトリ以外に、プロジェクトのルートディレクトリや `docs` ディレクトリにも配置できます。

https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes

## その他

### `.github` リポジトリ

`.github` リポジトリは、リポジトリに `.github` ディレクトリが存在しなかった場合のフォールバック用の設定を配置するためのリポジトリです。たとえば、`.github` リポジトリの `.github/ISSUE_TEMPLATE` ディレクトリに Issue テンプレートを配置しておくと、リポジトリに `.github` ディレクトリが存在しなかった場合でも、`.github` リポジトリに設定した Issue テンプレートが適用されるようになります。

このリポジトリに配置可能なファイルの一覧は以下のようになります:

- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `FUNDING.yml`
- `GOVERNANCE.md`
- Issue テンプレート
- Pull Request テンプレート
- `SECURITY.md`
- `SUPPORT.md`


`.github` リポジトリの設定について詳しくは、以下のドキュメントを参照してください。

https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file

### `.github/assets`

このディレクトリは公式ドキュメントに記載されているものではありませんが、いくつかのリポジトリで見掛けたため紹介しておきます^[そもそも `.github` ディレクトリに何が配置可能なのか気になったのは、このディレクトリをたまたま見掛けたためでした。]。色々なリポジトリの `github` ディレクトリを覗いてみると、こうしたドキュメントに記載されていないファイルやディレクトリを使って工夫しているケースが珍しくないことがわかります。

Astro のコアメンテナである Nate Moore が開発している、[clack](https://github.com/natemoo-re/clack) というコマンドラインアプリ用のフレームワークがあるのですが、このリポジトリには `.github/assets` ディレクトリが[存在します](https://github.com/natemoo-re/clack/tree/593f93d06c1a53c8424e9aaf0c1c63fbf6975527/.github/assets)。ディレクトリの中身を確認すると、README で使用する画像ファイルなどが配置されているようです。`.github` ディレクトリがリポジトリのメタデータを配置するための場所であり、README をサポートしていることとあわせて考えると、README 用の画像をここに置くのも筋が通っているように思えます^[が、慣習のためか `README.md` はリポジトリのルートに置かれているため、ここで書いたような意味での一貫性を志向しているわけではないのかもしれません。]。README などで使うアセットの置き場所に悩んだら、`.github/assets` ディレクトリを使ってみると良いかもしれません。

## おわりに

`.github` ディレクトリについて、その主要機能を一覧的にまとめてみました。自分にとって一部は常識であったものの、コードオーナーなどの機能は詳しく知らなかったため、今回調べてみて勉強になりました。この記事を読んでくれた方にも何らかの発見があれば嬉しいです。

## 参考

- [Is there an overview of what can go into a .github "dot github" directory? - Stack Overflow](https://stackoverflow.com/questions/60507097/is-there-an-overview-of-what-can-go-into-a-github-dot-github-directory)
