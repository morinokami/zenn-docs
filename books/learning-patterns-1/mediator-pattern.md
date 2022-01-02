---
title: "メディエータ・ミドルウェアパターン"
---

---

> 中央のメディエータオブジェクトを介してコンポーネント間のやり取りを処理する

---

![](/images/learning-patterns/mediator-pattern-1280w.jpg)

メディエータパターン (mediator pattern) は、中央にあるメディエータという存在を通してコンポーネントどうしがやり取りすることを可能にします。コンポーネントどうしが直接対話するのではなく、メディエータがリクエストを受け取り、それを転送します。JavaScript では、メディエータは単なるオブジェクトリテラルや関数であることが多いです。

このパターンを、航空管制官とパイロットとの関係に例えることができます。パイロットどうしが直接会話するのではなく (これはおそらくかなりカオスな状況となります)、パイロットは管制官と会話します。管制官は、飛行機どうしが衝突することなく安全に飛行できるよう、各飛行機が必要な情報を受け取ることができるようにするのです。

JavaScript で飛行機をコントロールすることがないといいのですが、私たちはしばしば、オブジェクト間で多方向に行き交うデータを扱わなければなりません。コンポーネントの数が多くなると、コンポーネント間のやり取りはかなり複雑なものとなるはずです。

![](/images/learning-patterns/mediator-pattern-1.png)

そこで、各オブジェクトが他のオブジェクトと直接対話し、多対多の関係となる代わりに、オブジェクトのリクエストをメディエータが処理するようにします。メディエータはこのリクエストを処理し、必要なところへ送ります。

![](/images/learning-patterns/mediator-pattern-2.png)

メディエータパターンのわかりやすい例としてはチャットルームがあります。チャットルームのユーザーは、お互いに直接話すことはありません。その代わり、チャットルームサーバーがメディエータとしてユーザーを仲介します。

```js
class ChatRoom {
  logMessage(user, message) {
    const time = new Date();
    const sender = user.getName();

    console.log(`${time} [${sender}]: ${message}`);
  }
}

class User {
  constructor(name, chatroom) {
    this.name = name;
    this.chatroom = chatroom;
  }

  getName() {
    return this.name;
  }

  send(message) {
    this.chatroom.logMessage(this, message);
  }
}
```

チャットルームに接続するユーザーを新規に作成しましょう。各ユーザーインスタンスは `send` メソッドをもっており、これを用いてメッセージを送信することができます。

```js:index.js
class ChatRoom {
  logMessage(user, message) {
    const sender = user.getName();
    console.log(`${new Date().toLocaleString()} [${sender}]: ${message}`);
  }
}

class User {
  constructor(name, chatroom) {
    this.name = name;
    this.chatroom = chatroom;
  }

  getName() {
    return this.name;
  }

  send(message) {
    this.chatroom.logMessage(this, message);
  }
}

const chatroom = new ChatRoom();

const user1 = new User("John Doe", chatroom);
const user2 = new User("Jane Doe", chatroom);

user1.send("Hi there!");
user2.send("Hey!");
```

@[codesandbox](https://codesandbox.io/embed/late-glade-7gjmr)

---

## ケーススタディ

[Express.js](https://expressjs.com/) は、Web アプリケーションサーバーのフレームワークとして有名です。ユーザーがアクセスする route にコールバックを追加することができます。

たとえば、ユーザーがルート `/` にアクセスした場合に、リクエストにあるヘッダーを追加したいとします。ミドルウェアのコールバックにおいてこのヘッダーを追加することができます。

```js
const app = require("express")();

app.use("/", (req, res, next) => {
  req.headers["test-header"] = 1234;
  next();
});
```

`next` メソッドは、リクエストとレスポンスのサイクルの中にある、次のコールバックを呼び出します。このようにして、リクエストとレスポンスの間にミドルウェア関数の連鎖を作ることができます。

![](/images/learning-patterns/mediator-pattern-3.png)

`test-header` が正しく追加されたかどうかをチェックする、別のミドルウェア関数を追加してみましょう。直前のミドルウェア関数で加えられた変更は、この連鎖の中にいれば確認することができます。

```js
const app = require("express")();

app.use(
  "/",
  (req, res, next) => {
    req.headers["test-header"] = 1234;
    next();
  },
  (req, res, next) => {
    console.log(`Request has test header: ${!!req.headers["test-header"]}`);
    next();
  }
);
```

完璧です！ミドルウェア関数を通じて、リクエストオブジェクトがレスポンスへと至るまでのあいだに、これを 追跡・ 変更することができるのです。

```js:index.js
const app = require("express")();
const html = require("./data");

app.use(
  "/",
  (req, res, next) => {
    req.headers["test-header"] = 1234;
    next();
  },
  (req, res, next) => {
    console.log(`Request has test header: ${!!req.headers["test-header"]}`);
    next();
  }
);

app.get("/", (req, res) => {
  res.set("Content-Type", "text/html");
  res.send(Buffer.from(html));
});

app.listen(8080, function() {
  console.log("Server is running on 8080");
});
```

@[codesandbox](https://codesandbox.io/embed/express-js-0e4yr)

ユーザーがルートエンドポイント `/` にアクセスするたびに、 2 つのミドルウェアコールバックが呼び出されます。

---

メディエータパターンは、すべての通信が中央のメディエータを経由して流れるようにすることで、オブジェクト間の多対多の関係を簡潔にすることができます。

---

### 参考文献

* [Docs - Express](https://expressjs.com/)
* [Mediator Pattern - OO Design](https://www.oodesign.com/mediator-pattern.html)
