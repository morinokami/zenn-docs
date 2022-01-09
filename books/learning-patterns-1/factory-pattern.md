---
title: "ファクトリパターン"
---

---

> オブジェクトの作成にファクトリ関数を使う

---

![](/images/learning-patterns/factory-pattern-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/factory-pattern/)
:::

## ファクトリパターン

ファクトリパターン (factory pattern) では、新しいオブジェクトを作成するために**ファクトリ関数** (factory function) を使用します。関数が `new` キーワードを使わずに新しいオブジェクトを返すとき、その関数はファクトリ関数であるといえます。

たとえば、アプリケーションに多くのユーザーが必要だとします。新しいユーザーは、`firstName`、`lastName`、`email` プロパティをもつように作成することができそうです。ファクトリ関数は、新しく作成されたオブジェクトに、`firstName` と `lastName` を返す `fullName` プロパティも追加します。

```js
const createUser = ({ firstName, lastName, email }) => ({
  firstName,
  lastName,
  email,
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
});
```

完璧です！`createUser` 関数を呼び出して、複数のユーザーを簡単に作成できるようになりました。

```js
const createUser = ({ firstName, lastName, email }) => ({
  firstName,
  lastName,
  email,
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
});

const user1 = createUser({
  firstName: "John",
  lastName: "Doe",
  email: "john@doe.com"
});

const user2 = createUser({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@doe.com"
});

console.log(user1);
console.log(user2);
```

@[codesandbox](https://codesandbox.io/embed/divine-glade-8s5cv)

---

ファクトリパターンは、比較的複雑で、設定により変更可能なオブジェクトを作成する場合に有効です。オブジェクトのキーや値が、ある環境や設定に依存している場合を考えてみてください。ファクトリパターンを使えば、カスタムキーやカスタム値を含む新しいオブジェクトを簡単に作成することができます。

```js
const createObjectFromArray = ([key, value]) => ({
  [key]: value
});

createObjectFromArray(["name", "John"]); // { name: "John" }
```

---

## Pros

ファクトリパターンは、同じプロパティを共有する小さなオブジェクトを複数作成する場合に便利です。ファクトリ関数により、現在の環境やユーザー固有の設定に依存するカスタムオブジェクトを返すことができます。

---

## Cons

JavaScript では、ファクトリパターンは `new` キーワードを使わずにオブジェクトを返す関数に過ぎません。[ES6 のアロー関数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#Arrow_functions)では、オブジェクトを**暗黙に返す**、小さなファクトリ関数を作ることができます。

しかし、毎回新しいオブジェクトを作成するよりも、新しいインスタンスを作成する方が、メモリ効率が良い場合が多いです。

```js
class User {
  constructor(firstName, lastName, email) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
  }

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

const user1 = new User({
  firstName: "John",
  lastName: "Doe",
  email: "john@doe.com"
});

const user2 = new User({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@doe.com"
});
```

---

## 参考文献

* [JavaScript Factory Functions with ES6+](https://medium.com/javascript-scene/javascript-factory-functions-with-es6-4d224591a8b1) - Eric Elliott
