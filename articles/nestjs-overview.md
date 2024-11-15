---
title: "NestJS の基礎概念の図解と要約" # 記事のタイトル
emoji: "🐈‍⬛" # アイキャッチとして使われる絵文字（1文字だけ）
type: "tech" # tech: 技術記事 / idea: アイデア記事
topics: ["nestjs", "typescript", "nodejs"] # タグ。["markdown", "rust", "aws"]のように指定する
published: true # 公開設定（falseにすると下書き）
---

# はじめに

仕事で使用することになった [NestJS](https://nestjs.com/) について、公式の [NestJS Fundamentals Course](https://courses.nestjs.com/) や[ドキュメント](https://docs.nestjs.com/)などで勉強を進めているのですが、新しい概念が次々と現れるため消化しきれなくなってきました。そこで、まず全体の俯瞰図をしっかりと頭に入れるために、公式ドキュメントの [Overview](https://docs.nestjs.com/first-steps) に出てくる範囲の概念を図解して整理し、また各々の役割やプロジェクト内のどこにどのように設定していくかについてまとめることにしました (逆に、大枠とは関係ない部分については大胆に省きました)。

対象読者としては、簡単な CRUD アプリケーションなどを NestJS によって作成したことがあり、基礎的な概念や構成要素について何となくは把握したものの、どうもスッキリとは理解できていない気がする、というような方を想定しています。

この記事が自分のような NestJS 入門者のお役に立てれば幸いです。なお、以下で示した各概念をすべて実装している[サンプル](https://github.com/morinokami/nestjs-app)を用意しましたので、この文章やドキュメントを読みながら、`yarn start:dev` を実行し、手元で色々と実験してみるなど、 何らかのかたちで手を動かしつつ理解することをオススメします。


# 基礎的な概念の図解

ドキュメントの Overview には、以下の各概念に関する説明があります (Custom decorators は少し毛色が違うため除きます):

- Controllers
- Providers
- Modules
- Middleware
- Exception filters
- Pipes
- Guards
- Interceptors

最初の三つの概念、すなわち、Controllers、Providers、Modules は、クライアントからのリクエストに対するルーティングやビジネスロジック、それらをまとめる機能を提供します。また、残りの五つの概念は、リクエストとレスポンスの経路上で様々な役割を果たします。このことを図解すると以下のようになります:

![](https://storage.googleapis.com/zenn-user-upload/zs4f5nwd0mf2m95sdpcye34x1gc8)

グレーの点線は、クライアントから発せられた HTTP Request と、NestJS アプリケーションから発せられた HTTP Response と Exception の流れを表わしています (厳密には、Exception が発生したとしても HTTP Response としてクライアントに送信されるわけですが、ここではわかりやすさのため Exception の流れを独立して描いています)。また、赤紫色の筒のようなものは、Guard や Exception filter などの概念が Request や Response へと何らかのかたちで作用することを表わしています。また、`App Module` は NestJS アプリケーションの Root module を表わし、それにぶら下がるように他の Module が登録されており、また各 Module には Controller や Providers の一種である Service などが登録されています (ここでは見やすさのために Controller と Service を一つずつ描きましたが、実際には、ある Module が別の Module の Service に依存するなど、より複雑な構成となるはずです)。

ここでのポイントとしては、まず、Request へと作用する概念として

1. Middleware
2. Guard
3. Intercepter
4. Pipe

という概念があり、これらがこの順番で作用するということです。同様に、Response に対しては Interceptor が、また Exception が発生した際には Interceptor や Exception filter が作用します。こうした全体の俯瞰図をまず頭に入れましょう。

また、Middleware を除く

- Exception filters
- Pipes
- Guards
- Interceptors

について、図ではざっくりとした流れを描きましたが、これらをアプリケーションへと登録する際に、実際には次の四つのレベルがあるということを認識しましょう:

- Global (グローバルなレベル)
- Controller (コントローラのレベル)
- Method (メソッドのレベル)
- Param (パラメータのレベル、これは後述するように Pipe のみ設定可能)

つまり、どのレベルで各機能を使いたいかに応じて、コード内での使用方法も変化するということです。

「クライアント」と「複数の Modules から成るアプリケーション」の間で展開されるリクエスト・レスポンスのサイクルにおいて、Middleware や Guard などの概念がどのような順序で作用するかを頭に入れ、各々に適用時のスコープ、レベルがあるということを理解することが、大枠を把握する上で重要です。

続いて以下では、各概念の役割やコードレベルでの典型的な形式、また Controller、Provider、Module 以外については各スコープでの登録方法について要約的に記述していきます。


# 各概念の役割と、実装方法に関するまとめ

## Controllers

Controller は

- 形式的には、`@Controller()` デコレータを適用したクラスのこと
- 指定したパスでリクエストを受け取りレスポンスを返すことが役割
- Provider が提供するサービスを利用する
- 特定の Module に属する

Controller を作成する際は、

```sh
$ nest g controller <name>
```

とします。ここで、`<name>` には作成したい Controller の名前が入ります。このコマンドにより、`src/<name>/<name>.controller.ts` とテスト用のファイルが作成されます (なお、Controller の作成に限りませんが、テスト用のファイルを作成したくない場合には、`--no-spec` を指定します。また、コマンドによる変更内容の確認だけしたい場合には、`--dry-run` を指定します)。

Controller の基本的な構造は次のようになります (公式ドキュメントからの引用となります):

```ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats') // @Controller() デコレータの適用と Route の指定
export class CatsController {
  constructor(private catsService: CatsService) {} // 利用する Service が inject される

  @Post() // HTTP メソッドの指定
  async create(@Body() createCatDto: CreateCatDto) { // リクエストの Body を取得
    this.catsService.create(createCatDto); // 受け取った値を Service に渡す
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll(); // Service から得た値をレスポンスとして返す
  }
}
```

Controller を使用するためには、Module へと登録します:

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController], // Controller の登録
  providers: [CatsService],
})
export class CatsModule {}
```

## Providers

Provider は

- 形式的には、`@Injectable()` デコレータを適用したクラスのこと
- 依存対象 (Dependency) として注入 (inject) される
- Controller から、複雑なタスクを依頼される

以下では、代表的な Provider である Service について記述します。

Service を作成する際は、

```sh
$ nest g service <name>
```

とします。このコマンドにより、`src/<name>/<name>.service.ts` などのファイルが作成されます。

Service の基本的な構造は次のようになります:

```ts
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable() // @Injectable() デコレータの適用
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    // サービスが提供するビジネスロジックを定義
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
```

Service を使用するためには、Module へと登録します:

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService], // Service の登録
})
export class CatsModule {}
```

## Modules

Module は

- 形式的には、`@Module()` デコレータを適用したクラスのこと
- 以下の要素から構成される:
  - `providers`: Nest injector によりインスタンス化される Provider で、Module 内でシェアされる
  - `controllers`: Module で定義される Controller
  - `imports`: Module で使用する Provider をエクスポートしている他の Module
  - `exports`: Module からエクスポートされる Provider で、Module の public interface といえる
- Nest アプリケーションは、少なくとも一つの Module (これを Root module という) を必要とし、これと他のインポートされた Module の連鎖である application graph によって構成される
- 特定の役割に応じて一つの Module が構成されるべきである
- `@Global()` デコレータを適用した Module は、グローバルに利用可能となる
- 使用する Provider を動的に切り替えることも可能 ([Dynamic modules](https://docs.nestjs.com/modules#dynamic-modules))

Module を作成する際は、

```sh
$ nest g module <name>
```

とします。このコマンドにより、`src/<name>/<name>.module.ts` というファイルが作成されます。

Module の基本的な構造は次のようになります:

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController], // Controller の登録
  providers: [CatsService], // Service の登録
  exports: [CatsService], // エクスポートする Provider の登録
})
export class CatsModule {}
```

Root module がこの Module を利用する場合は、次のようになります:

```ts
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

## Middleware

Middleware は

- Route ハンドラの前に呼び出される関数で、リクエストやレスポンスオブジェクトへとアクセス可能
- [Express の Middleware](https://expressjs.com/en/guide/using-middleware.html) と同等のもの
- 以下のことなどが可能:
  - コードの実行
  - リクエストやレスポンスオブジェクトの改変
  - リクエスト・レスポンスのサイクルを終わらせる
  - 他の Middleware を呼ぶ
- 関数、または `@Injectable()` デコレータを適用したクラスとして実装する
- ドキュメントには例としてロガーが紹介されている

Middleware を作成する際は、

```sh
$ nest g middleware common/middleware/<name>
```

とします。このコマンドにより、`src/common/middleware/<name>.middleware.ts` などのファイルが作成されます (なお、Middleware 以降の概念については `common` というディレクトリにコードを追加する前提で記述していますが、このあたりはプロジェクトごとに適宜変更してください)。

Middleware をクラスとして定義した場合の基本的な構造は次のようになります:

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable() // @Injectable() デコレータの適用
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...'); // Middleware の処理
    next(); // 次の関数へとコントロールを引き渡す
  }
}
```

また、Middleware を関数として定義した場合は次のようになります:

```ts
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
}
```

このように Middleware の定義の仕方には二種類ありますが、[公式ドキュメント](https://docs.nestjs.com/middleware#functional-middleware)にはシンプルな関数型 Middleware をなるべく使うよう書かれています。

Middleware を使用するためには、Module において `NestModule` インターフェースを実装し、 `configure()` メソッドを定義します:

```ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule { // NestModule インターフェースの実装
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // Middleware の適用
      .forRoutes(CatsController); // 適用対象の Route を指定
  }
}
```

また、グローバルに Middleware を登録するためには、`use()` メソッドを使用します:

```ts
const app = await NestFactory.create(AppModule);
app.use(LoggerMiddleware);
```

## Exception filters

Exception filter は、

- 形式的には、`@Catch()` デコレータを適用し、`ExceptionFilter` インターフェース を実装したクラスのこと
- ハンドルされていない例外を処理する
- `HttpException` をハンドルする組み込みの Global exception filter の制御フローと、それがクライアントへと送り返すレスポンスをコントロールする
  - デフォルトでは、この Global exception filter が例外を検出し HTTP レスポンスへと変換する
- ドキュメントには例として、例外をキャッチしレスポンスにタイムスタンプなどの情報を追加する Filter が紹介されている

Exception filter を作成する際は、

```sh
$ nest g filter common/filters/<name>
```

とします。このコマンドにより、`src/common/filters/<name>.filter.ts` などのファイルが作成されます。

Exception filter の基本的な構造は次のようになります:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException) // @Catch() デコレータの適用、HttpException をハンドルすることを宣言
export class HttpExceptionFilter implements ExceptionFilter { // ExceptionFilter インターフェースの実装
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // レスポンスを加工
    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
```

Exception filters は、メソッドのレベル、コントローラのレベル、グローバルなレベルで使用することができます。メソッド、つまり Route ハンドラのレベルにおいて使用するためには、次のように `@UseFilters()` デコレータを使用します:

```ts
@Post()
@UseFilters(HttpExceptionFilter) // Exception filter を登録
async create(@Body() createCatDto: CreateCatDto) {
  // ...
}
```

コントローラレベルで使用する場合も同様です:

```ts
@UseFilters(HttpExceptionFilter)
export class CatsController {}
```

一方、グローバルに Exception filter を登録するためには、`useGlobalFilters()` メソッドを使用します:

```ts
const app = await NestFactory.create(AppModule);
app.useGlobalFilters(HttpExceptionFilter);
```

なお、Filter のインスタンスを `@UseFilters` へと与えることも可能ですが (`@UseFilters(new HttpExceptionFilter())` のように)、メモリ使用の効率性の観点から、[公式ドキュメント](https://docs.nestjs.com/exception-filters#binding-filters)ではインスタンスよりもクラスを使用することが推奨されています。

## Pipes

Pipe は、

- 形式的には、`@Injectable()` デコレータを適用し、`PipeTransform` インターフェースを実装したクラスのこと
- 大きく二つのユースケースがある:
  - 変換: インプットされたデータを変換する (たとえば文字列から整数へ)
  - バリデーション: インプットされたデータに問題がなければ次の処理へと引き継ぎ、問題があれば例外を送出する
- 九つの組み込みの Pipe が存在する:
  - `ValidationPipe`
  - `ParseIntPipe`
  - `ParseFloatPipe`
  - `ParseBoolPipe`
  - `ParseArrayPipe`
  - `ParseUUIDPipe`
  - `ParseEnumPipe`
  - `DefaultValuePipe`
  - `ParseFilePipe`
- ドキュメントには例として、[Joi](https://github.com/hapijs/joi) によるスキーマを使用するバリデーションや、[class-validator](https://github.com/typestack/class-validator) によるデコレータを使用するバリデーションなどが紹介されている

Pipe を作成する際は、

```sh
nest g pipe common/pipes/<name>
```

とします。このコマンドにより、`src/common/pipes/<name>.pipe.ts` などのファイルが作成されます。

Pipe の基本的な構造は次のようになります:

```ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable() // @Injectable() デコレータの適用
export class ParseIntPipe implements PipeTransform<string, number> { // PipeTransform インターフェースの実装
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10); // データの変換
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed'); // Pipe を適用できないケースは例外を送出
    }
    return val;
  }
}
```

なお、これは与えられたデータを変換するタイプの Pipe ですが、変換が不可能である場合には例外を送出します。これはバリデーションをおこなうタイプの Pipe でも同様で、バリデーションの過程で問題があればその際も例外を送出するようにします。

Pipe は例外的に、メソッドのレベル、コントローラのレベル、グローバルなレベルに加えて、パラメータのレベルでも使用することができます。まず、パラメータのレベルで使用するためには、次のように @Param() などの [Param decorator](https://docs.nestjs.com/custom-decorators#param-decorators) の内部で Pipe を指定します:

```ts
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id) { // パラメータ id に対する Pipe を登録
  return this.catsService.findOne(id);
}
```

メソッドやコントローラのレベルで使用するためは、次のように `@UsePipes()` デコレータを使用します:

```ts
@Post()
@UsePipes(ValidationPipe) // Pipe を登録
async create(@Body() createCatDto: CreateCatDto) {
  // ...
}
```

グローバルに Pipe を登録するためには、`useGlobalPipes()` メソッドを使用します:

```ts
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(ValidationPipe);
```

## Guards

Guard は、

- 形式的には、`@Injectable()` デコレータを適用し、`CanActivate` インターフェースを実装したクラスのこと
- (権限やロール、ACL 等の) 特定の条件に応じて、リクエストがハンドラによって処理されるべきかどうかを決定する
- ドキュメントには例として、認可や、ユーザーのロールに応じたアクセス権限の付与に関する Guard が紹介されている

Guard を作成する際は、

```sh
$ nest g guard common/guards/<name>
```

とします。このコマンドにより、`src/common/guards/<name>.guard.ts` などのファイルが作成されます。

Guard の基本的な構造は次のようになります:

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

const API_KEY = 'secret';

// ヘッダーの Authorization の値を検証する単純な関数
function validateRequest(request: Request): boolean {
  return request.header('Authorization') === API_KEY;
}

@Injectable() // @Injectable() デコレータの適用
export class AuthGuard implements CanActivate { // CanActivate インターフェースの実装
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    return validateRequest(request); // リクエストに対する何らかの検証 (true であれば次の処理へと進む)
  }
}
```

Guard は、メソッドのレベル、コントローラのレベル、グローバルなレベルで使用することができます。メソッドのレベルで使用するためには、次のように `@UseGuards()` デコレータを使用します:

```ts
@Post()
@UseGuards(AuthGuard) // Guard を登録
async create(@Body() createCatDto: CreateCatDto) {
  // ...
}
```

コントローラレベルで使用する場合も同様です:

```ts
@UseGuards(AuthGuard)
export class CatsController {}
```

一方、グローバルに Guard を登録するためには、`useGlobalGuards()` メソッドを使用します:

```ts
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(AuthGuard);
```

## Interceptors

Interceptor は、

- 形式的には、`@Injectable()` デコレータを適用し、`NestInterceptor` インターフェースを実装したクラスのこと
- 以下のことなどが可能:
  - メソッドの実行の前後において追加のロジックをバインドする
  - 関数の返り値を変換する
  - 関数から送出された例外を変換する
  - 関数の振る舞いを拡張する
  - (たとえばキャッシュを目的として) 特定の条件に応じて関数をオーバーライドする
- ドキュメントには例として、リクエストからレスポンスまでに掛かった時間を確認したり、ハンドラから返されたレスポンスや例外を書き換える Interceptor が紹介されている

Interceptor を作成する際は、

```sh
$ nest g interceptor common/interceptors/<name>
```

とします。このコマンドにより、`src/common/interceptors/<name>.interceptor.ts` などのファイルが作成されます。

Interceptor の基本的な構造は次のようになります:

```ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable() // @Injectable() デコレータの適用
export class LoggingInterceptor implements NestInterceptor { // NestInterceptor  インターフェースの実装
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)), // レスポンスが返るまでの経過時間を表示
      );
  }
}
```

Interceptor は、メソッドのレベル、コントローラのレベル、グローバルなレベルで使用することができます。メソッドのレベルで使用するためには、次のように `@UseInterceptors()` デコレータを使用します:

```ts
@Post()
@UseInterceptors(LoggingInterceptor) // Interceptor を登録
async create(@Body() createCatDto: CreateCatDto) {
  // ...
}
```

コントローラレベルで使用する場合も同様です:

```ts
@UseInterceptors(LoggingInterceptor)
export class CatsController {}
```

一方、グローバルに Interceptor を登録するためには、`useGlobalInterceptors()` メソッドを使用します:

```ts
const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(LoggingInterceptor);
```


# まとめ

入門時に様々な概念が登場し、各概念の役割や使い方に関して多少混乱したため、それらについて図解しまとめました。まずは、Module や Controller、Provider など、レスポンスを返すための基本的な仕組みやコードをまとめるための構造について理解することが大切です。そして、クライアントとサーバとの間でのリクエスト・レスポンスサイクルを制御するための仕組みである残りの概念について、その役割、適用される順序・スコープ、コード内での組み込み方などを頭に入れていくと腑に落ちるはずです。

なお、個人的に最も理解しづらいと感じたのは、Middleware と Interceptor です。これらは適用範囲が広いため役割がはっきりとしなかったり、また Express や RxJS など、別のレイヤーの概念が顔を出してくるためです。これらを使用する際は、設計時にしっかりと役割などについて取り決めたほうが良さそうだと感じました (これらに関しては、Express そのものだったり、Interceptor という同名かつ同じようなことができる概念があるらしい Spring Framework などを触ったことがある人は、それほど迷わないのだろうか)。
