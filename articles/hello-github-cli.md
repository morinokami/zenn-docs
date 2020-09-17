---
title: "GitHub CLI 1.0 がリリースされたので使ってみた" # 記事のタイトル
emoji: "😸" # アイキャッチとして使われる絵文字（1文字だけ）
type: "tech" # tech: 技術記事 / idea: アイデア記事
topics: ["gh", "GitHub CLI"] # タグ。["markdown", "rust", "aws"]のように指定する
published: true # 公開設定（falseにすると下書き）
---

[GitHub CLI 1.0 がリリース](https://github.blog/2020-09-17-github-cli-1-0-is-now-available/)されました。
Zenn へと投稿するのは初めてなので、Zenn と連携するリポジトリを `gh` コマンドを通じて操作することで、`gh` コマンドの使用感の確認と Zenn への投稿を同時におこなってみます。

Zenn での記事の作成方法については以下の記事を参考にしました:

* [Zenn CLIを使ってコンテンツを作成する](https://zenn.dev/zenn/articles/zenn-cli-guide)

# `gh` のインストール

[Mac の場合](https://github.com/cli/cli#macos)は Homebrew または MacPorts からインストールすることが可能です:

```sh
$ brew install gh
```

あるいは

```sh
$ sudo port install gh
```

Linux 環境へインストールする場合は[こちら](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)を参考にしてください。
たとえば Ubuntu 20.04 にインストールするには以下のコマンドを実行します:

```sh
$ sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-key C99B11DEB97541F0
$ sudo apt-add-repository -u https://cli.github.com/packages
$ sudo apt install gh
```

# コマンドの補完

`gh` コマンドの補完を有効にするために、シェルの設定ファイルへと追記します。
たとえば、使用しているシェルが bash であれば、`.bash_profile` に以下の行を追記します:

```
eval "$(gh completion -s bash)"
```

補完が有効になっていれば、ターミナルで `gh ` と入力したあとに Tab を押下することで、以下のようなサブコマンドの候補が表示されるはずです:

```sh
$ gh
alias       -- Create command shortcuts
api         -- Make an authenticated GitHub API request
auth        -- Login, logout, and refresh your authentication
completion  -- Generate shell completion scripts
config      -- Manage configuration for gh
gist        -- Create gists
help        -- Help about any command
issue       -- Manage issues
pr          -- Manage pull requests
release     -- Manage GitHub releases
repo        -- Create, clone, fork, and view repositories
```

# 認証

`gh` コマンドから GitHub 上のリソースを操作できるようにするために、認証用のコマンドを実行する必要があります。
以下のコマンドにより認証プロセスが開始されます:

```sh
$ gh auth login
```

インタラクティブセッションが開始されるので、指示に従って認証を完了させてください。
問題が発生しなければ、`gh auth status` コマンドにより認証状態を確認することができるはずです:

```sh
$ gh auth status 
github.com
  ✓ Logged in to github.com as morinokami (~/.config/gh/hosts.yml)
  ✓ Git operations for github.com configured to use ssh protocol.
```

ここまでで `gh` コマンドを使用するための準備は整いました。
ここからは Zenn と連携するリポジトリを作成・操作してみます。

# リポジトリの作成

まずはリポジトリを作成します。
`gh` は Docker の CLI などと同様に、サブコマンドで操作対象のリソースを指定し、それに続いて操作内容を記述するようなスタイルです。
リポジトリに対する操作は `repo` サブコマンドを通じておこないます。
`repo` に対する可能な操作は以下のようになります:

```sh
$ gh repo
clone   -- Clone a repository locally
create  -- Create a new repository
fork    -- Create a fork of a repository
view    -- View a repository
```

非常に明快です。
今はリポジトリを作成したいため、`create` を使用します。
`create` の使い方を調べるために `gh repo create --help` を実行すると後半に `EXAMPLES` という項目が見つかります。
ここから、`gh repo create my-repo` というコマンドを実行すれば、自分のアカウントに紐づく `my-repo` というコマンドが作成されることがわかります。
また、`--public` フラグによりリポジトリをパブリックに設定できることもわかります。
早速実行してみましょう:

```sh
$ gh repo create --public zenn-docs                                                                                                                                                                                                       
? This will create 'zenn-docs' in your current directory. Continue?  Yes
✓ Created repository morinokami/zenn-docs on GitHub
? Create a local project directory for morinokami/zenn-docs? Yes
Initialized empty Git repository in /home/shf0811/dev/zenn-docs/.git/
✓ Initialized repository in './zenn-docs/'
```

コマンドの出力から、GitHub 上にリポジトリが作成され、またそれに紐づくディレクトリがカレントディレクトリに作成されたことがわかります。
ただ、質問の内容と実行内容が微妙に食い違っているように思えますし、また出力内容が冗長であるようにも感じますね。

リポジトリが作成されたことは以下のコマンドからも確認可能です:

```sh
$ cd zenn-docs
$ gh repo view 
morinokami/zenn-docs
No description provided

This repository does not have a README

View this repository on GitHub: https://github.com/morinokami/zenn-docs
```

あるいは、`--web` フラッグを用いることでブラウザからも確認することができます。

この時点で Zenn との連携が可能となるので、リポジトリを以下のコマンドで初期化した上で Zenn の [Deploys](https://zenn.dev/dashboard/deploys) からレポジトリを連携しておきます。

```sh
echo "# zenn-docs" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M master
git remote add origin git@github.com:morinokami/zenn-docs.git
git push -u origin master
```

# イシューの作成

続いてイシューを作成してみます。
イシュー関連の操作に対応するのは `gh issue` です。
これについても可能な操作を確認してみます:

```sh
$ gh issue
close   -- Close issue
create  -- Create a new issue
list    -- List and filter issues in this repository
reopen  -- Reopen issue
status  -- Show status of relevant issues
view    -- View an issue
```

これまた明快です。
`create` を使用してイシューを作成することができるようなので、ヘルプで使用方法を調べてみると、一番最初の使用例として `gh issue create --title "I found a bug" --body "Nothing works"` というものがあります。
他にもラベルやアサイン先を指定することもできるようですが、今回はシンプルに行きます:

```sh
$ gh issue create --title "Add an article" --body "This issue was created by gh."       

Creating issue in morinokami/zenn-docs

https://github.com/morinokami/zenn-docs/issues/1
```

作成されたイシューを確認してみます。
リポジトリに関連するイシューをざっくり確認したい場合は `status` を使うようです:

```sh
$ gh issue status

Relevant issues in morinokami/zenn-docs

Issues assigned to you
  There are no issues assigned to you

Issues mentioning you
  There are no issues mentioning you

Issues opened by you
  #1  Add an article    about 1 hour ago
```

ラベルやアサイン先によってイシューを絞り込みたいような場合には、`list` コマンドを使用します。

個別のイシューについて詳細を確認したいような場合には、`view` コマンドを使用します。
たとえば先ほど作られたばかりのイシューを確認するためには、イシュー番号が 1 であることから、次のようにコマンドを実行します:

```sh
$ gh issue view 1
Add an article
Open • morinokami opened less than a minute ago • 0 comments



  This issue was created by gh.                                               



View this issue on GitHub: https://github.com/morinokami/zenn-docs/issues/1
```

問題なくイシューが作成されていることが確認できました。
続いてプルリクエストを作成してみます。

# プルリクエストの作成

まず新しいブランチを作成し、そこで記事を作成していきます:

```sh
$ git switch -c first-article
$ mkdir articles
$ vim articles/hello-github-cli.md
```

なお、もともとは Zenn の CLI により記事を作成しようとしたのですが、次のようなエラーが出て作成できなかったため手動で作成しています。

```sh
$ npx zenn new:article
npx: installed 9 in 1.424s
command not found: zenn
zsh: exit 1     npx zenn new:article
```

さて、記事が作成できたらコミットをおこない、プルリクエストをおこないます。
プルリクエストに対応するサブコマンドは `pr` です。
例のごとく可能な操作について列挙してみます:

```sh
$ gh pr
checkout  -- Check out a pull request in git
checks    -- Show CI status for a single pull request
close     -- Close a pull request
create    -- Create a pull request
diff      -- View changes in a pull request
list      -- List and filter pull requests in this repository
merge     -- Merge a pull request
ready     -- Mark a pull request as ready for review
reopen    -- Reopen a pull request
review    -- Add a review to a pull request
status    -- Show status of relevant pull requests
view      -- View a pull request
```

プルリクエストに対する操作は比較的たくさんあるようです。
今はシンプルにプルリクエストを作成したいので `create` を指定します。
`create` のヘルプを読むと、`--title` と `--body` でタイトルと本文を、`--reviewer` でレビュアーを指定できるようなので、これらも指定してみます:

```sh
$ git add articles
$ git commit -m "Add my first article on Zenn"
$ git push -u origin first-article
$
```

作成されたプルリクエストは、イシューと同様に、`status` や `view` により確認することができます:

```sh
$
```

# レビュー

最後に、自分自信で先ほどのプルリクエストをレビューしマージしてみます。
まずは diff の確認をしてみます:

```sh
$
```

続いてマージします:

```sh
$
```

最後にプルリクエストのステータスを確認してみます:

```sh
$
```

見事、GitHub 上でプルリクエストがおこなわれ、Zenn において記事が公開されました!

# 終わりに

この記事では GitHub CLI の使用感を確かめるために、いくつかのサブコマンドを実際に使用した様子をレポートしました。
自分は [`hub` コマンド](https://github.com/github/hub)はこれまで使っておらず、ブラウザ上で GitHub を操作していたため、ターミナルからの操作がいかに楽か実感することができました。
サブコマンドに対する操作も一貫性があり明確で、かつヘルプなども充実しているため、これからは GitHub CLI をどんどん使っていきたいと思います。

