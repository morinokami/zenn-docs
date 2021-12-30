---
title: "プロトタイプパターン: 複数の同じ型のオブジェクトの間でプロパティを共有する"
---

![](/images/learning-patterns/prototype-pattern-1280w.jpg)

プロトタイプパターンは、複数の同じ型のオブジェクトの間でプロパティを共有するのに便利な方法です。プロトタイプは JavaScript のネイティブオブジェクトであり、プロトタイプチェーンを通じてオブジェクトからアクセスすることができます。

アプリケーションの中で、同じ型のオブジェクトをたくさん作らなければならないことがよくあります。このような場合に便利なのが、ES6 クラスのインスタンスを複数作成する方法です。

例えば、犬をたくさん作りたいとしましょう！以下の例では、犬はそれほど多くのことができるわけではありません。名前をもち、吠えることができるだけです。

```js
class Dog {
  constructor(name) {
    this.name = name;
  }

  bark() {
    return `Woof!`;
  }
}

const dog1 = new Dog("Daisy");
const dog2 = new Dog("Max");
const dog3 = new Dog("Spot");
```

ここで、`constructor` に `name` プロパティがあり、クラス自体に `bark` プロパティがあることに注目してください。ES6 クラスを使用する場合、クラス自体に定義されたすべてのプロパティ (この場合は `bark`) は、自動的に `prototype` に追加されます。

`prototype` は、コンストラクタの `prototype` プロパティ、またはインスタンスの `__proto__` プロパティにアクセスすることで直接確認することができます。

```js
console.log(Dog.prototype);
// constructor: ƒ Dog(name, breed) bark: ƒ bark()

console.log(dog1.__proto__);
// constructor: ƒ Dog(name, breed) bark: ƒ bark()
```

コンストラクタのインスタンスの `__proto__` の値は、そのコンストラクタのプロトタイプへの直接の参照となります。オブジェクトに直接存在しないプロパティにアクセスしようとすると、JavaScript は、そのプロパティがプロトタイプチェーンの中で利用可能かどうかを確認するために、*プロトタイプチェーンを下っていきます*。

![](/images/learning-patterns/prototype-pattern-1.png)

同じプロパティにアクセスできるはずのオブジェクトを扱うときに、プロトタイプパターンはとても強力です。すべてのインスタンスはプロトタイプオブジェクトにアクセスできるため、プロパティの複製を毎回作成する代わりに、プロパティをプロトタイプに追加するだけでよいのです。

すべてのインスタンスはプロトタイプにアクセスできるので、インスタンスの作成後であっても、プロトタイプにプロパティを追加することが簡単にできます。

例えば私たちの犬を、吠える以外に遊べるようにもしたいとしましょう。これは、プロトタイプに `play` プロパティを追加することで可能となります。

```js:index.js
class Dog {
  constructor(name) {
    this.name = name;
  }

  bark() {
    return `Woof!`;
  }
}

const dog1 = new Dog("Daisy");
const dog2 = new Dog("Max");
const dog3 = new Dog("Spot");

Dog.prototype.play = () => console.log("Playing now!");

dog1.play();
```

@[codesandbox](https://codesandbox.io/embed/eloquent-turing-v42kr)

**プロトタイプチェーン**という言葉は、一つ以上の段階があることを示しています。そうなんです！ここまでは、`__proto__` が参照をもつ最初のオブジェクトから直接利用可能なプロパティにアクセスする方法について見てきました。ところが、プロトタイプ自身も `__proto__` オブジェクトをもっているのです！

別のタイプの犬、スーパードッグを作りましょう。この犬は普通の `Dog` からすべてを継承しますが、さらに空を飛ぶことができます。スーパードッグは `Dog` クラスを継承して `fly` メソッドを追加することで作ることができます。

```js
class SuperDog extends Dog {
  constructor(name) {
    super(name);
  }

  fly() {
    return "Flying!";
  }
}
```

`Daisy` という名前の空飛ぶ犬を作って、吠えたり飛んだりさせてあげましょう！

```js:index.js
class Dog {
  constructor(name) {
    this.name = name;
  }

  bark() {
    console.log("Woof!");
  }
}

class SuperDog extends Dog {
  constructor(name) {
    super(name);
  }

  fly() {
    console.log(`Flying!`);
  }
}

const dog1 = new SuperDog("Daisy");
dog1.bark();
dog1.fly();
```

@[codesandbox](https://codesandbox.io/embed/hopeful-poitras-vuch6)

`Dog` クラスを継承したので、`bark` メソッドにアクセスすることができます。`SuperDog` のプロトタイプの `__proto__` の値は `Dog.prototype` オブジェクトを指しているのです。

![](/images/learning-patterns/prototype-pattern-2.png)

プロトタイプ*チェーン*と呼ばれる理由がこれでわかりました。オブジェクトから直接利用できないプロパティにアクセスしようとすると、JavaScript は、`__proto__` が指すすべてのオブジェクトを、そのプロパティが見つかるまで再帰的に探して回るのです！

---

## Object.create

`Object.create` メソッドにより、新しいオブジェクトを作成し、そのオブジェクトに明示的にプロトタイプの値を渡すことができます。

```js
const dog = {
  bark() {
    return `Woof!`;
  }
};

const pet1 = Object.create(dog);
```

`pet1` 自身は何のプロパティももっていませんが、プロトタイプチェーンのプロパティにアクセスすることができます！`pet1` のプロトタイプとして `dog` オブジェクトを渡したので、`bark` プロパティにアクセスできるのです。

```js:index.js
const dog = {
  bark() {
    console.log(`Woof!`);
  }
};

const pet1 = Object.create(dog);

pet1.bark(); // Woof!
console.log("Direct properties on pet1: ", Object.keys(pet1));
console.log("Properties on pet1's prototype: ", Object.keys(pet1.__proto__));
```

@[codesandbox](https://codesandbox.io/embed/funny-wing-w38zk)

完璧です！`Object.create` は、新しく作成されるオブジェクトのプロトタイプを指定することで、あるオブジェクトに他のオブジェクトのプロパティを直接継承させる簡単な方法です。新しいオブジェクトは、プロトタイプチェーンをたどり、新しいプロパティにアクセスすることができます。

---

プロトタイプパターンは、あるオブジェクトが簡単に他のオブジェクトのプロパティにアクセスしたり、それを継承したりすることを可能とします。プロトタイプチェーンにより、オブジェクトは自身に直接定義されていないプロパティにアクセスできるため、メソッドやプロパティの重複を避け、使用するメモリ量を削減することができます。

---

### 参考文献

* [Object.create - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
* [Prototype - ECMA](https://www.ecma-international.org/ecma-262/5.1/#sec-4.3.5)
