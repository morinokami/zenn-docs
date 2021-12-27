---
title: "ファクトリーパターン: オブジェクトの作成にファクトリー関数を使う"
---

![](/images/learning-patterns/factory-pattern-1280w.jpg)

ファクトリーパターンでは、新しいオブジェクトを作成するために**ファクトリー関数**を使用します。関数が `new` キーワードを使わずに新しいオブジェクトを返すとき、その関数はファクトリー関数であるといえます。

例えば、アプリケーションに多くのユーザがいるとします。`firstName`、`lastName`、`email` プロパティをもつ新しいユーザーを作成することができますが、ファクトリー関数は、新しく作成されたオブジェクトに `fullName` プロパティも追加し、`firstName` と `lastName` を返します。

---

### 参考文献

* [JavaScript Factory Functions with ES6+](https://medium.com/javascript-scene/javascript-factory-functions-with-es6-4d224591a8b1) - Eric Elliott
