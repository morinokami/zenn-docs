---
title: "オブザーバーパターン: Use observables to notify subscribers when an event occurs"
---

![](/images/learning-patterns/observer-pattern-1280w.jpg)

**オブザーバーパターン**により、あるオブジェクト **Observer** を別のオブジェクト **Observable** に *Subscribe* することができます。イベントが発生すると、Observable は自身の Observer に通知をします！

---

Observable オブジェクトは、通常 3 つの重要なパーツから構成されます:

* `Observers`: 特定のイベントが発生するたびに通知を受ける Observer の配列
* `subscribe()`: Observer を Observer のリストに追加するためのメソッド
* `unsubscribe()`: Observer のリストから Observer を削除するメソッド
* `notify()`: 特定のイベントが発生したときに、すべての Observer に通知するメソッド

---

それでは、Observable を作っていきましょう。簡単な方法としては [ES6 のクラス](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)を使うものです。

```js
class Observable {
  constructor() {
    this.observers = [];
  }

  subscribe(func) {
    this.observers.push(func);
  }

  unsubscribe(func) {
    this.observers = this.observers.filter(observer => observer !== func);
  }

  notify(data) {
    this.observers.forEach(observer => observer(data));
  }
}
```

素晴らしい！これで、subscribe メソッドにより Observer をリストに追加し、unsubscribe メソッドでにより Observer を削除し、notify メソッドによりすべての Subscriber に通知できるようになりました。

この Observable を使って何か作ってみましょう。ここでは、`Button` と `Switch` という 2 つのコンポーネントからなる非常に簡単なアプリケーションを考えます。

```js
export default function App() {
  return (
    <div className="App">
      <Button>Click me!</Button>
      <FormControlLabel control={<Switch />} />
    </div>
  );
}
```

このアプリケーションと**ユーザーとのやり取り**を記録していきます。ユーザーがボタンをクリックするか、スイッチを切り替えるたびに、タイムスタンプと一緒にイベントをログ出力したいと思います。ログを出力するだけでなく、イベントが発生したときに表示されるトーストによる通知も作成したいと思います。

本質的には、私たちがやりたいことは以下のようになります:

<video width="100%" src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-41_nxsnbd.mp4" autoplay="" controls=""><source src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-41_nxsnbd.mp4"></video>

ユーザーが `handleClick` 関数または `handleToggle` 関数を呼び出すたびに、これらの関数は Observer の `notify` メソッドを呼び出します。`notify` メソッドは、`handleClick` 関数または `handleToggle` 関数によって渡されたデータをすべての Subscriber に通知します。

まず、`logger` 関数と `toastify` 関数を作成しましょう。これらの関数は、最終的に `notify` メソッドから `data` を受け取ります。

```js
import { ToastContainer, toast } from "react-toastify";

function logger(data) {
  console.log(`${Date.now()} ${data}`);
}

function toastify(data) {
  toast(data);
}

export default function App() {
  return (
    <div className="App">
      <Button>Click me!</Button>
      <FormControlLabel control={<Switch />} />
      <ToastContainer />
    </div>
  );
}
```

現在、`logger` 関数と `toasity` 関数は Observable を認識していません。つまり、Observable はまだこれらの関数に通知することができないということです。Observer となるためには、Observable の `subscribe` メソッドを使って、Observer を*登録*しなければなりません。

```js
import { ToastContainer, toast } from "react-toastify";

function logger(data) {
  console.log(`${Date.now()} ${data}`);
}

function toastify(data) {
  toast(data);
}

observable.subscribe(logger);
observable.subscribe(toastify);

export default function App() {
  return (
    <div className="App">
      <Button>Click me!</Button>
      <FormControlLabel control={<Switch />} />
      <ToastContainer />
    </div>
  );
}
```

イベントが発生するたびに、`logger` 関数と `toastify` 関数が通知を受けるようになりました。あとは、実際に Observable に通知する関数、すなわち `handleClick` 関数と `handleToggle` 関数を実装するだけです！これらの関数は、Observable の `notify` メソッドを呼び出し、Observer が受け取るデータを渡す必要があります。

```js
import { ToastContainer, toast } from "react-toastify";

function logger(data) {
  console.log(`${Date.now()} ${data}`);
}

function toastify(data) {
  toast(data);
}

observable.subscribe(logger);
observable.subscribe(toastify);

export default function App() {
  function handleClick() {
    observable.notify("User clicked button!");
  }

  function handleToggle() {
    observable.notify("User toggled switch!");
  }

  return (
    <div className="App">
      <Button>Click me!</Button>
      <FormControlLabel control={<Switch />} />
      <ToastContainer />
    </div>
  );
}
```

これですべての準備が整いました。`handleClick` と `handleToggle` はデータと共に Observable の `notify` メソッドを呼び出し、その後 Observable は Subscriber (この場合 `logger` 関数と `toastify` 関数) に通知します。

ユーザーがいずれかのコンポーネントを操作するたびに、`logger` と `toastify` 関数の両方が `notify` メソッドに渡したデータとともに通知を受けます！

```js:App.js
import React from "react";
import { Button, Switch, FormControlLabel } from "@material-ui/core";
import { ToastContainer, toast } from "react-toastify";
import observable from "./Observable";

function handleClick() {
  observable.notify("User clicked button!");
}

function handleToggle() {
  observable.notify("User toggled switch!");
}

function logger(data) {
  console.log(`${Date.now()} ${data}`);
}

function toastify(data) {
  toast(data, {
    position: toast.POSITION.BOTTOM_RIGHT,
    closeButton: false,
    autoClose: 2000
  });
}

observable.subscribe(logger);
observable.subscribe(toastify);

export default function App() {
  return (
    <div className="App">
      <Button variant="contained" onClick={handleClick}>
        Click me!
      </Button>
      <FormControlLabel
        control={<Switch name="" onChange={handleToggle} />}
        label="Toggle me!"
      />
      <ToastContainer />
    </div>
  );
}
```

```js:Observable.js
class Observable {
  constructor() {
    this.observers = [];
  }

  subscribe(f) {
    this.observers.push(f);
  }

  unsubscribe(f) {
    this.observers = this.observers.filter(subscriber => subscriber !== f);
  }

  notify(data) {
    this.observers.forEach(observer => observer(data));
  }
}

export default new Observable();
```

@[codesandbox](https://codesandbox.io/embed/quizzical-sinoussi-md8k5)

---

オブザーバーパターンにはさまざまな使用方法がありますが、**非同期のイベントベースのデータ**を扱うときに非常に便利です。例えば、あるデータのダウンロードが終了したときに特定のコンポーネントに通知したい場合や、ユーザーが掲示板に新しいメッセージを送ったときに他のメンバー全員に通知したい場合などが考えられます。

---

## ケーススタディ

オブザーバーパターンを使用する人気のライブラリに RxJS があります。

> 「ReactiveX は、オブザーバーパターンとイテレーターパターン、そしてコレクションを使った関数型プログラミングとを組み合わせ、イベントのシーケンスを管理する理想的な方法に対するニーズを満たします。」- RxJS

RxJS により、Observable を作成して、特定のイベントに Subscribe することができるのです！RxJS のドキュメントにある、ユーザーがドラッグしているかどうかのログを取る例を見てみましょう。

```js:index.js
import React from "react";
import ReactDOM from "react-dom";
import { fromEvent, merge } from "rxjs";
import { sample, mapTo } from "rxjs/operators";

import "./styles.css";

merge(
  fromEvent(document, "mousedown").pipe(mapTo(false)),
  fromEvent(document, "mousemove").pipe(mapTo(true))
)
  .pipe(sample(fromEvent(document, "mouseup")))
  .subscribe(isDragging => {
    console.log("Were you dragging?", isDragging);
  });

ReactDOM.render(
  <div className="App">Click or drag anywhere and check the console!</div>,
  document.getElementById("root")
);
```

@[codesandbox](https://codesandbox.io/embed/stoic-turing-kqq9z)

RxJS には、オブザーバーパターンで動作する組み込みの機能や例が山ほどあります。

---

## Pros

オブザーバーパターンを使うことは、**関心の分離**と単一責任の原則を実現するための素晴らしい方法です。Observer オブジェクトは Observable オブジェクトと密結合しておらず、いつでも結合 (あるいは粗結合化) することができます。Observable オブジェクトはイベントの監視に責任をもち、Observer は受け取ったデータを処理するだけとなります。

---

## Cons

Observer が複雑になりすぎると、すべての Subscriber に通知する際にパフォーマンスの問題が発生する可能性があります。

---

### 参考文献

* [RxJS](https://rxjs-dev.firebaseapp.com/)
* [JavaScript Design Patterns: The Observer Pattern](https://www.sitepoint.com/javascript-design-patterns-observer-pattern/)
