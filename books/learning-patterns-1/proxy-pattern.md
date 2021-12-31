---
title: "プロキシパターン"
---

---

> ターゲットオブジェクトとのやり取りをインターセプトし制御する

---

![](/images/learning-patterns/proxy-pattern-1280w.jpg)

プロキシオブジェクトを使うと、特定のオブジェクトとのやり取りをより自由にコントロールできるようになります。プロキシオブジェクトは、例えば値の取得や設定などのオブジェクトの操作における挙動を決定することができます。

---

一般に、プロキシは誰かの代役を意味します。ある人に直接話しかける代わりに、あなたが連絡を取ろうとしていた人を代理するプロキシに話しかけるという具合です。これは JavaScript でも同じです。つまり、ターゲットとなるオブジェクトを直接操作する代わりに、プロキシオブジェクトとやり取りするのです。

---

John Doe を表わす `person` オブジェクトを作りましょう。

```js
const person = {
  name: "John Doe",
  age: 42,
  nationality: "American"
};
```

このオブジェクトと直接やり取りする代わりに、プロキシオブジェクトとやり取りしたいと思います。JavaScript では、`Proxy` のインスタンスを作成することで、簡単に新しいプロキシを作成することができます。

```js
const person = {
  name: "John Doe",
  age: 42,
  nationality: "American"
};

const personProxy = new Proxy(person, {});
```

`Proxy` の最初の引数は*ハンドラ*を表わすオブジェクトです。ハンドラオブジェクトでは、やり取りの種類に応じて特定の動作を定義することができます。プロキシのハンドラに追加できるメソッドは[たくさん](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)ありますが、代表的なものは `get` と `set` です:

* `get`: プロパティにアクセスしようとしたときに呼び出されます
* `set`: プロパティを変更しようとしたときに呼び出されます

最終的には以下のような挙動となります:

<video width="100%" src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056520/patterns.dev/jspat-51_xvbob9.mp4" autoplay="" controls=""><source src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056520/patterns.dev/jspat-51_xvbob9.mp4"></video>

`personProxy` プロキシにハンドラを追加してみましょう。プロパティを変更しようとするとき、つまり `Proxy` の `set` メソッドを呼び出すとき、プロパティの以前の値と新しい値をプロキシがログ出力するようにします。また、プロパティにアクセスしようとして、`Proxy` の `get` メソッドを呼び出すとき、プロパティのキーと値を含む読みやすい文をログ出力するようにします。

```js
const personProxy = new Proxy(person, {
  get: (obj, prop) => {
    console.log(`The value of ${prop} is ${obj[prop]}`);
  },
  set: (obj, prop, value) => {
    console.log(`Changed ${prop} from ${obj[prop]} to ${value}`);
    obj[prop] = value;
  }
});
```

完璧です！では、プロパティを変更したり取得したりするときに何が起こるか見てみましょう。

```js:index.js
const person = {
  name: "John Doe",
  age: 42,
  nationality: "American"
};

const personProxy = new Proxy(person, {
  get: (obj, prop) => {
    console.log(`The value of ${prop} is ${obj[prop]}`);
  },
  set: (obj, prop, value) => {
    console.log(`Changed ${prop} from ${obj[prop]} to ${value}`);
    obj[prop] = value;
    return true;
  }
});

personProxy.name;
personProxy.age = 43;
```

@[codesandbox](https://codesandbox.io/embed/cocky-bird-rkgyo)

`name` プロパティにアクセスすると、プロキシは `The value of name is John Doe` という、響きの良い文を返しました。

`age` プロパティを変更すると、プロキシは、このプロパティの以前の値と新しい値を `Changed age from 42 to 43` というかたちで返しました。

---

プロキシは、**バリデーション**を追加するのに便利です。ユーザーが `person` の年齢を文字列に変更したり、名前を空にしたりできてはいけません。あるいは、ユーザーがオブジェクト上の存在しないプロパティにアクセスしようとした場合、ユーザーにそれを知らせるべきです。

```js
const personProxy = new Proxy(person, {
  get: (obj, prop) => {
    if (!obj[prop]) {
      console.log(
        `Hmm.. this property doesn't seem to exist on the target object`
      );
    } else {
      console.log(`The value of ${prop} is ${obj[prop]}`);
    }
  },
  set: (obj, prop, value) => {
    if (prop === "age" && typeof value !== "number") {
      console.log(`Sorry, you can only pass numeric values for age.`);
    } else if (prop === "name" && value.length < 2) {
      console.log(`You need to provide a valid name.`);
    } else {
      console.log(`Changed ${prop} from ${obj[prop]} to ${value}.`);
      obj[prop] = value;
    }
  }
});
```

誤った値を渡そうとしたときに何が起こるか見てみましょう！

```js:index.js
const person = {
  name: "John Doe",
  age: 42,
  nationality: "American"
};

const personProxy = new Proxy(person, {
  get: (obj, prop) => {
    if (!obj[prop]) {
      console.log(`Hmm.. this property doesn't seem to exist`);
    } else {
      console.log(`The value of ${prop} is ${obj[prop]}`);
    }
  },
  set: (obj, prop, value) => {
    if (prop === "age" && typeof value !== "number") {
      console.log(`Sorry, you can only pass numeric values for age.`);
    } else if (prop === "name" && value.length < 2) {
      console.log(`You need to provide a valid name.`);
    } else {
      console.log(`Changed ${prop} from ${obj[prop]} to ${value}.`);
      obj[prop] = value;
    }
    return true;
  }
});

personProxy.nonExistentProperty;
personProxy.age = "44";
personProxy.name = "";
```

@[codesandbox](https://codesandbox.io/embed/focused-rubin-dgk2v)

プロキシが、誤った値で `person` オブジェクトが変更されることを防ぎ、私たちのデータをクリーンに保ってくれました！

---

### Reflect

JavaScript には `Reflect` という組み込みオブジェクトがあり、プロキシを扱う際に対象オブジェクトを簡単に操作できるようになっています。

以前は、プロキシ内のターゲットオブジェクトのプロパティに変更を加えたりアクセスしたりするには、ブラケット記法により値を直接取得したり設定したりしていました。その代わりとして使用できるのが `Reflect` オブジェクトです。`Reflect` オブジェクトのメソッドは、`handler` オブジェクトのメソッドと同じ名前をもっています。

`obj[prop]` によるプロパティへのアクセスや `obj[prop] = value` によるプロパティへの設定の代わりに、 `Reflect.get()` と `Reflect.set()` によってターゲットオブジェクトのプロパティの取得や変更ができます。これらのメソッドは、ハンドラオブジェクト上のメソッドと同じ引数を受け取ります。

```js
const personProxy = new Proxy(person, {
  get: (obj, prop) => {
    console.log(`The value of ${prop} is ${Reflect.get(obj, prop)}`);
  },
  set: (obj, prop, value) => {
    console.log(`Changed ${prop} from ${obj[prop]} to ${value}`);
    Reflect.set(obj, prop, value);
  }
});
```

完璧です！`Reflect` オブジェクトにより、ターゲットオブジェクトのプロパティへのアクセスや変更が簡単になりました。

```js:index.js
const person = {
  name: "John Doe",
  age: 42,
  nationality: "American"
};

const personProxy = new Proxy(person, {
  get: (obj, prop) => {
    console.log(`The value of ${prop} is ${Reflect.get(obj, prop)}`);
  },
  set: (obj, prop, value) => {
    console.log(`Changed ${prop} from ${obj[prop]} to ${value}`);
    return Reflect.set(obj, prop, value);
  }
});

personProxy.name;
personProxy.age = 43;
personProxy.name = "Jane Doe";
```

@[codesandbox](https://codesandbox.io/embed/gallant-violet-o1hjx)

---

プロキシは、オブジェクトの振る舞いを制御するための強力な手段です。プロキシには、バリデーション、書式設定、通知、デバッグなど、様々なユースケースがあります。

`Proxy` オブジェクトを使いすぎたり、 `handler` メソッドを呼び出すたびに重い処理を実行したりすると、 アプリケーションのパフォーマンスに悪影響を及ぼす可能性があります。パフォーマンスが重要なコードにはプロキシを使用しないのが一番です。

---

### 参考文献

* [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) - MDN
* [JavaScript Proxy](https://davidwalsh.name/javascript-proxy) - David Walsh
* [Awesome ES2015 Proxy](https://github.com/mikaelbr/awesome-es2015-proxy) - GitHub @mikaelbr
* [Thoughts on ES6 Proxies Performance](http://thecodebarbarian.com/thoughts-on-es6-proxies-performance) - Valeri Karpov
