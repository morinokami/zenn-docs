# zenn-docs

[![Likes](https://badgen.org/img/zenn/morinokami/likes?style=flat)](https://zenn.dev/morinokami)

https://zenn.dev/morinokami

## 記事の作成

```sh
$ npx zenn new:article --slug my-awesome-article
```

## プレビュー

```sh
$ npx zenn preview
```

## 本のコードの埋め込み

`books/how-void-works` では、本文中のコードブロックの多くを、`<!-- file: ... -->` / `<!-- diff: ... -->` というマーカーで `code/how-void-works/` の実ファイルから埋め込んでいます。コードを直したら、次のコマンドで本文を更新してください（`--check` を付けると、本文が最新かどうかだけを確認します）。

```sh
$ node scripts/sync-code.mjs
$ node scripts/sync-code.mjs --check
```
