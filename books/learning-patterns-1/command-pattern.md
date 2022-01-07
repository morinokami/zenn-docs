---
title: "コマンドパターン"
---

---

> Commander にコマンドを送信することで、タスクを実行するメソッドを分離する

---

![](/images/learning-patterns/command-pattern-1280w.jpg)

## コマンドパターン

**コマンドパターン** (command pattern) を用いると、あるタスクを実行するオブジェクトと、そのメソッドを呼び出すオブジェクトを*切り離す*ことができことができます。

たとえば、オンラインフードデリバリーのプラットフォームがあったとします。ユーザーは注文をしたり (place)、追跡したり (track)、キャンセルしたり (cancel) することができます。

```js
class OrderManager() {
  constructor() {
    this.orders = []
  }

  placeOrder(order, id) {
    this.orders.push(id)
    return `You have successfully ordered ${order} (${id})`;
  }

  trackOrder(id) {
    return `Your order ${id} will arrive in 20 minutes.`
  }

  cancelOrder(id) {
    this.orders = this.orders.filter(order => order.id !== id)
    return `You have canceled your order ${id}`
  }
}
```

ここでは `OrderManager` クラスの `placeOrder`、`trackOrder`、`cancelOrder` メソッドにアクセスすることができます。これらのメソッドを直接使用しても、JavaScript としてまったく問題はありません。

```js
const manager = new OrderManager();

manager.placeOrder("Pad Thai", "1234");
manager.trackOrder("1234");
manager.cancelOrder("1234");
```

しかし、`manager` インスタンスのメソッドを直接呼び出すことにはデメリットがあります。それは、あるメソッドの名前をあとで変更することになったり、メソッドの機能が変更されたりした場合に発生します。

たとえば、`placeOrder` という名前を `addOrder` へと変更したとしましょう。このとき、`placeOrder` メソッドがコードベースのどこからも呼び出されないようにしなければなりませんが、これは大規模なアプリケーションでは非常に厄介なことです。

代わりに、`manager` オブジェクトからメソッドを切り離し、各コマンドに対応する個別のコマンド関数を作成します。

`OrderManager` クラスをリファクタリングしましょう。`placeOrder`、`cancelOrder`、`trackOrder` メソッドの代わりに、`execute` という単一のメソッドをもつようにします。このメソッドは、与えられた任意のコマンドを実行します。

各コマンドは、`OrderManager` の `orders` にアクセスする必要があるため、これを最初の引数として渡します。

```js
class OrderManager {
  constructor() {
    this.orders = [];
  }

  execute(command, ...args) {
    return command.execute(this.orders, ...args);
  }
}
```

`OrderManager` に与える 3 つの `Command` を作成します:

* `PlaceOrderCommand`
* `CancelOrderCommand`
* `TrackOrderCommand`

```js
class Command {
  constructor(execute) {
    this.execute = execute;
  }
}

function PlaceOrderCommand(order, id) {
  return new Command(orders => {
    orders.push(id);
    return `You have successfully ordered ${order} (${id})`;
  });
}

function CancelOrderCommand(id) {
  return new Command(orders => {
    orders = orders.filter(order => order.id !== id);
    return `You have canceled your order ${id}`;
  });
}

function TrackOrderCommand(id) {
  return new Command(() => `Your order ${id} will arrive in 20 minutes.`);
}
```

完璧です！これらのメソッドは、`OrderManager` のインスタンスと密結合していません。`OrderManager` の `execute` メソッドを通して呼び出すことができる、疎結合化された関数となっています。

```js:index.js
class OrderManager {
  constructor() {
    this.orders = [];
  }

  execute(command, ...args) {
    return command.execute(this.orders, ...args);
  }
}

class Command {
  constructor(execute) {
    this.execute = execute;
  }
}

function PlaceOrderCommand(order, id) {
  return new Command(orders => {
    orders.push(id);
    console.log(`You have successfully ordered ${order} (${id})`);
  });
}

function CancelOrderCommand(id) {
  return new Command(orders => {
    orders = orders.filter(order => order.id !== id);
    console.log(`You have canceled your order ${id}`);
  });
}

function TrackOrderCommand(id) {
  return new Command(() =>
    console.log(`Your order ${id} will arrive in 20 minutes.`)
  );
}

const manager = new OrderManager();

manager.execute(new PlaceOrderCommand("Pad Thai", "1234"));
manager.execute(new TrackOrderCommand("1234"));
manager.execute(new CancelOrderCommand("1234"));
```

@[codesandbox](https://codesandbox.io/embed/serene-sea-41ixg)

---

## Pros

コマンドパターンにより、ある操作を実行するオブジェクトから、メソッドを切り離すことができます。これは、特定の寿命をもつコマンドや、特定の時間にキューに入れられ実行されるようなコマンドを扱う場合に、より細かな制御を可能とします。

## Cons

コマンドパターンのユースケースは非常に限られています。また、不要なボイラープレートをアプリケーションに追加してしまうことも少なくありません。

---

## 参考文献

* [Command Design Pattern](https://sourcemaking.com/design_patterns/command) - SourceMaking
* [Command Pattern](https://refactoring.guru/design-patterns/command) - Refactoring Guru
* [Command Pattern](https://www.carloscaballero.io/design-patterns-command/) - Carlos Caballero
