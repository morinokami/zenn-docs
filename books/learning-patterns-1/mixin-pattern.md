---
title: "ミックスインパターン"
---

---

> 継承をおこなわずにオブジェクトやクラスに機能を追加する

---

![](/images/learning-patterns/mixin-pattern-1280w.jpg)

**ミックスイン** (mixin) は、継承をおこなわずに他のオブジェクトやクラスに再利用可能な機能を追加することができるオブジェクトです。ミックスインを単独で使用することはできません。ミックスインの唯一の目的は、継承を使用せずにオブジェクトやクラスに*機能を追加する*ことだからです。

たとえば、アプリケーションで複数の犬を作成する必要があるとします。しかし、ここで作成する犬は、`name` 以外のプロパティを何ももっていません。

```js
class Dog {
  constructor(name) {
    this.name = name;
  }
}
```

犬は名前をもつ以外のこともできるはずです。吠えたり、尻尾を振ったり、遊んだりできるようにするべきでしょう！これを `Dog` に直接追加する代わりに、`bark`、`wagTail`、`play` というプロパティを提供するミックスインを作成することができます。

```js
const dogFunctionality = {
  bark: () => console.log("Woof!"),
  wagTail: () => console.log("Wagging my tail!"),
  play: () => console.log("Playing!")
};
```

`Object.assign` メソッドにより、`Dog` のプロトタイプに `dogFunctionality` ミックスインを追加することができます。このメソッドは、ターゲットとなるオブジェクトにプロパティを追加します。ここでは、`Dog.prototype` です。`Dog` の新しいインスタンスは、`Dog` のプロトタイプに `dogFunctionality` が追加されることにより、そのプロパティにアクセスすることができようになります。

```js
class Dog {
  constructor(name) {
    this.name = name;
  }
}

const dogFunctionality = {
  bark: () => console.log("Woof!"),
  wagTail: () => console.log("Wagging my tail!"),
  play: () => console.log("Playing!")
};

Object.assign(Dog.prototype, dogFunctionality);
```

最初のペットとして、Daisy という名前の `pet1` を作ってみましょう。`Dog` のプロトタイプに `dogFunctionality` ミックスインを追加したので、Daisy は吠えたり、尻尾を振ったり、遊んだりできるはずです！

```js
const pet1 = new Dog("Daisy");

pet1.name; // Daisy
pet1.bark(); // Woof!
pet1.play(); // Playing!
```
完璧です！ミックスインを使うと、継承を使わずにクラスやオブジェクトに独自の機能を簡単に追加することができます。

---

ミックスインにより継承なしで機能の追加ができますが、ミックスイン自身が継承を使うこともできます！

(イルカと...おそらくあといくつかを除く) ほとんどの哺乳類は、歩いたり眠ったりすることができます。犬も哺乳類なので、歩いたり眠ったりできるはずです。

`walk` と `sleep` プロパティを追加する `animalFunctionality` ミックスインを作ってみましょう。

```js
const animalFunctionality = {
  walk: () => console.log("Walking!"),
  sleep: () => console.log("Sleeping!")
};
```

これらのプロパティを `dogFunctionality` のプロトタイプに追加するには、`Object.assign` を使用します。ここでは、ターゲットオブジェクトは `dogFunctionality` です。

```js
const animalFunctionality = {
  walk: () => console.log("Walking!"),
  sleep: () => console.log("Sleeping!")
};

const dogFunctionality = {
  bark: () => console.log("Woof!"),
  wagTail: () => console.log("Wagging my tail!"),
  play: () => console.log("Playing!"),
  walk() {
    super.walk();
  },
  sleep() {
    super.sleep();
  }
};

Object.assign(dogFunctionality, animalFunctionality);
Object.assign(Dog.prototype, dogFunctionality);
```

完璧です！これで、`Dog` の新しいインスタンスは `walk` と `sleep` メソッドにもアクセスできるようになりました。

@[codesandbox](https://codesandbox.io/embed/zen-franklin-gvusj)

---

もっとリアリティのあるミックスインの例は、ブラウザ環境の `Window` インターフェースで見ることができます。`Window`オブジェクトは [`WindowOrWorkerGlobalScope`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope) と [`WindowEventHandlers`](https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers) ミックスインからそのプロパティの多くを実装しており、これにより `setTimeout` や `setInterval`、`indexedDB`、`isSecureContext` などのプロパティにアクセスすることができるようになっています。

ミックスインはオブジェクトに*機能を追加する*ためにのみ使用されるため、`WindowOrWorkerGlobalScope` 型のオブジェクトを作成することはできません。

```js:index.js
window.indexedDB.open("toDoList");

window.addEventListener("beforeunload", event => {
  event.preventDefault();
  event.returnValue = "";
});

window.onbeforeunload = function() {
  console.log("Unloading!");
};

console.log(
  "From WindowEventHandlers mixin: onbeforeunload",
  window.onbeforeunload
);

console.log(
  "From WindowOrWorkerGlobalScope mixin: isSecureContext",
  window.isSecureContext
);

console.log(
  "WindowEventHandlers itself is undefined",
  window.WindowEventHandlers
);

console.log(
  "WindowOrWorkerGlobalScope itself is undefined",
  window.WindowOrWorkerGlobalScope
);
```

@[codesandbox](https://codesandbox.io/embed/epic-dream-p8zhf)

---

### (ES6 以前の) React

ES6 クラスが導入される以前は、React のコンポーネントに機能を追加するためにミックスインがよく使われていました。React チームは、現在は[ミックスインの使用を推奨していません](https://reactjs.org/blog/2016/07/13/mixins-considered-harmful.html)。ミックスインはコンポーネントを不要に複雑にしがちで、保守や再利用を困難にするためです。React チームは代わりに[高階コンポーネントの使用を推奨していました](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750)が、これは現在ではフックにより置き換えられる場合が多いです。

---

ミックスインは、オブジェクトのプロトタイプに機能を注入することで、継承をおこなわずにオブジェクトに機能を追加することを可能にします。オブジェクトのプロトタイプを変更することは、プロトタイプ汚染や関数の出所が明らかでなくなる原因となるため、バッドプラクティスと考えられています。

---

### 参考文献

* [Functional Mixins](https://medium.com/javascript-scene/functional-mixins-composing-software-ffb66d5e731c) - Eric Elliott
* [Mixins](https://javascript.info/mixins) - JavaScript Info
