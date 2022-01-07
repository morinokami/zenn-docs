---
title: "フライウェイトパターン"
---

---

> 同一のオブジェクトを扱う際に既存のインスタンスを再利用する

---

![](/images/learning-patterns/flyweight-pattern-1280w.jpg)

## フライウェイトパターン

フライウェイトパターン (flyweight[^1] pattern) は、類似のオブジェクトを大量に作るときに、メモリを節約するための便利な方法です。

[^1]: 訳注: この単語は、ボクシングにおけるフライ級という階級を意味します。

アプリケーションで、ユーザーが本を追加できるようにしたいとします。すべての本は、`title`、`author`、そして `isbn` 番号をもちます。しかし、図書館には通常、ある本が 1 冊だけあるわけではなく、同じ本が複数冊あります。

まったく同じ本が複数ある場合、毎回新しい本のインスタンスを作成するのはあまり意味がありません。その代わり、1 冊の本を表わす `Book` コンストラクタのインスタンスを複数作成するようにします。

```js
class Book {
  constructor(title, author, isbn) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
  }
}
```

新しい本をリストに追加する機能を作ってみましょう。同じ ISBN 番号の本、つまりまったく同じ種類の本であれば、 新規に `Book` のインスタンスを作成する必要はありません。その代わり、この本がすでに存在するかどうかをまず確認します。

```js
const isbnNumbers = new Set();

const createBook = (title, author, isbn) => {
  const book = isbnNumbers.has(isbn);

  if (book) {
    return book;
  }
};
```

もしまだその本の ISBN 番号がなければ、新しい本を作り、その ISBN 番号を `isbnNumbers` セットに追加します。

```js
const createBook = (title, author, isbn) => {
  const book = isbnNumbers.has(isbn);

  if (book) {
    return book;
  }

  const book = new Book(title, author, isbn);
  isbnNumbers.add(isbn);

  return book;
};
```

`createBook` 関数は、ある本の新しいインスタンスを作成するのに役立ちます。しかし、図書館には同じ本が複数冊あるのが普通です！そこで、同じ本を複数追加する `addBook` 関数を作成しましょう。この関数は、`createBook` 関数を呼び出して、新しく作成した `Book` インスタンスを返すか、すでに存在するインスタンスを返します。

また、本の総量を記録するために、図書館内のすべての本を格納する `bookList` 配列を作成しましょう。

```js
const bookList = [];

const addBook = (title, author, isbn, availibility, sales) => {
  const book = {
    ...createBook(title, author, isbn),
    sales,
    availibility,
    isbn
  };

  bookList.push(book);
  return book;
};
```

完璧です！本を追加するたびに新しい `Book` インスタンスを作成する代わりに、その本に対応する既存の `Book` インスタンスを効果的に使用することができるようになりました。ハリー・ポッター (Harry Potter)、アラバマ物語 (To Kill a Mockingbird)、そしてグレート・ギャツビー (The Great Gatsby) という 3 種類の本を 5 冊作ってみましょう。

```js
addBook("Harry Potter", "JK Rowling", "AB123", false, 100);
addBook("Harry Potter", "JK Rowling", "AB123", true, 50);
addBook("To Kill a Mockingbird", "Harper Lee", "CD345", true, 10);
addBook("To Kill a Mockingbird", "Harper Lee", "CD345", false, 20);
addBook("The Great Gatsby", "F. Scott Fitzgerald", "EF567", false, 20);
```

本は 5 冊ありますが、作成された `Book` インスタンスは 3 つだけです。

```js:index.js
class Book {
  constructor(title, author, isbn) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
  }
}

const isbnNumbers = new Set();
const bookList = [];

const addBook = (title, author, isbn, availibility, sales) => {
  const book = {
    ...createBook(title, author, isbn),
    sales,
    availibility,
    isbn
  };

  bookList.push(book);
  return book;
};

const createBook = (title, author, isbn) => {
  const book = isbnNumbers.has(isbn);
  if (book) {
    return book;
  } else {
    const book = new Book(title, author, isbn);
    isbnNumbers.add(isbn);
    return book;
  }
};

addBook("Harry Potter", "JK Rowling", "AB123", false, 100);
addBook("Harry Potter", "JK Rowling", "AB123", true, 50);
addBook("To Kill a Mockingbird", "Harper Lee", "CD345", true, 10);
addBook("To Kill a Mockingbird", "Harper Lee", "CD345", false, 20);
addBook("The Great Gatsby", "F. Scott Fitzgerald", "EF567", false, 20);

console.log("Total amount of copies: ", bookList.length);
console.log("Total amount of books: ", isbnNumbers.size);
```

@[codesandbox](https://codesandbox.io/embed/wandering-firefly-m5c31)

---

フライウェイトパターンは、膨大な数のオブジェクトを作成することで、使用可能な **RAM** をすべて消費してしまうような場合に役に立ちます。消費されるメモリの量を最小限に抑えることができるのです。

JavaScript では[プロトタイプ継承](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)によって、この問題を簡単に解決することができます。現在では、ハードウェアは GB 単位の **RAM** をもっているため、フライウェイトパターンの重要性は低くなっています。

---

## 参考文献

* [Flyweight](https://refactoring.guru/design-patterns/flyweight) - Refactoring Guru
* [Flyweight Design Pattern](https://howtodoinjava.com/design-patterns/structural/flyweight-design-pattern) - How To Do In Java
