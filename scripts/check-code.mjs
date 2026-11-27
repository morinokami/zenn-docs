#!/usr/bin/env node
// code/how-void-works/ の各章のコードを実際に動かして、本文で説明している通りに動くかを確かめる。
//
// 章ごとに、次の順に実行する:
//   1. npm install（読者と同じく、package.json の範囲内の最新版をインストールする。lockfile は作らない）
//   2. npm run build
//   3. 型チェック
//   4. ビルド結果などを確かめる（下の CHAPTERS の build）
//   5. 開発サーバーを起動して、リクエストへの応答を確かめる（dev）
//   6. プレビューサーバーを起動して、同じように確かめる（preview）
//   7. コマンドの出力を確かめる（cli）
// 1 か 2 に失敗した場合、その章の残りは実行しない。
//
// 確かめるのは、本文で curl などにより示している、その章を終えた時点の動作。前の章で作った機能は
// 後の章でも動くはずなので、前の章の項目は後の章でも確かめる。ハイドレーションやクライアント遷移などの、
// ブラウザでしか確かめられない動作は対象外。
//
// サーバーは空いているポートで起動するので、手元で開発サーバーを動かしたままでも実行できる。
// また、起動する前に .wrangler/state を消すため、KV は毎回空の状態から始まる。
// 一部の項目は、章のディレクトリに一時的なファイル（smoke-test.* など）を作り、終わったら消す。
//
// 使い方:
//   node scripts/check-code.mjs            # すべての章を確かめる
//   node scripts/check-code.mjs ch05 ch08  # 指定した章だけを確かめる
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const codeDir = join(import.meta.dirname, '..', 'code', 'how-void-works');

// ---------------------------------------------------------------------------
// 確かめる項目
//
// 各項目は { name, run } というオブジェクトで、run は期待通りでない場合に例外を投げる。
// run が受け取るのは、章のディレクトリ dir、Vite を動かすディレクトリ app（第 4 章以降は playground）、
// 起動したサーバーの url（dev と preview の項目のみ）。
// ---------------------------------------------------------------------------

// 第 2 章: Vite の開発サーバーと仮想モジュール
const viteDev = [
  get('/', { includes: '<script type="module" src="/@vite/client"></script>' }),
  get('/@id/__x00__virtual:notes', {
    includes: '[{"title":"hello","body":"はじめてのメモ"},{"title":"vite","body":"Vite はプラグインで拡張できる"}]',
  }),
  {
    name: 'notes/ へのファイルの追加と削除が、仮想モジュールに反映される',
    run: async ({ app, url }) => {
      const file = join(app, 'notes', 'smoke-test.txt');
      const notes = () => expectResponse(`${url}/@id/__x00__virtual:notes`);
      try {
        writeTempFile(file, '確認用のメモ\n');
        await eventually(async () => expectIncludes(await notes(), '{"title":"smoke-test","body":"確認用のメモ"}'));
      } finally {
        removeTempFile(file);
      }
      await eventually(async () => expectExcludes(await notes(), 'smoke-test'));
    },
  },
];

const viteBuild = [
  {
    name: 'ビルドした JavaScript に、仮想モジュールの中身が含まれる',
    run: async ({ url }) => {
      const src = await findScript(url, /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/);
      await expectResponse(url + src, {}, { includes: ['はじめてのメモ', 'Vite はプラグインで拡張できる'] });
    },
  },
];

// 第 3 章: Worker と KV
const workers = [
  get('/', {
    includes: ['このコードは Cloudflare-Workers の上で動いています。', '仮想モジュールを生成した Vite 環境: worker'],
  }),
  get('/count', { body: '{"count":1}' }),
  get('/count', { body: '{"count":2}' }),
];

// 第 4 章: 固定の文字列を返す Hono のアプリケーション
const skeleton = [get('/', { body: 'Hello from chibivoid!', headers: { 'content-type': 'text/plain;charset=UTF-8' } })];

// 第 5 章: ファイルベースルーティング
const routes = [
  get('/api/hello', { body: '{"message":"Hello from chibivoid!"}' }),
  get('/api/users/42', { body: '{"id":"42"}' }),
  get('/api/users/me', { body: '{"id":"me","name":"あなた"}' }),
  post('/api/hello', { status: 404 }),
];

// 第 6 章: ミドルウェアと、開発サーバーでのルートの更新
const middleware = [get('/api/hello', { headers: { 'x-response-time': /^\d+ms$/ } })];

const routesWatch = [
  {
    name: 'routes/ へのファイルの追加・変更・削除が、再起動せずに反映される',
    run: async ({ app, url }) => {
      const file = join(app, 'routes', 'api', 'smoke-test.ts');
      const endpoint = `${url}/api/smoke-test`;
      const route = (code) => `import { defineHandler } from "chibivoid";\n\n${code}\n`;
      try {
        writeTempFile(file, route('export const GET = defineHandler(() => ({ step: 1 }));'));
        await eventually(() => expectResponse(endpoint, {}, { body: '{"step":1}' }));
        writeTempFile(
          file,
          route(
            'export const GET = defineHandler(() => ({ step: 2 }));\nexport const POST = defineHandler(() => ({ posted: true }));',
          ),
        );
        await eventually(() => expectResponse(endpoint, {}, { body: '{"step":2}' }));
        await eventually(() => expectResponse(endpoint, { method: 'POST' }, { body: '{"posted":true}' }));
      } finally {
        removeTempFile(file);
      }
      await eventually(() => expectResponse(endpoint, {}, { status: 404 }));
    },
  },
];

// 第 7 章: リソースの推論
const counter = [
  post('/api/counter', { body: '{"count":1}' }),
  post('/api/counter', { body: '{"count":2}' }),
  get('/api/counter', { body: '{"count":2}' }),
];

const kvInferred = [
  {
    name: 'KV の利用が推論され、ビルドした wrangler.json に KV のバインディングが入る',
    run: ({ app }) => {
      const config = JSON.parse(readFileSync(join(app, 'dist', 'chibivoid_worker', 'wrangler.json'), 'utf8'));
      const actual = JSON.stringify(config.kv_namespaces);
      if (actual !== '[{"binding":"KV","id":"local"}]') {
        throw new Error(`kv_namespaces が ${actual} でした`);
      }
    },
  },
];

// 第 8 章: ページのサーバーサイドレンダリング
const pages = [
  get('/', {
    includes: [
      '<h1>chibivoid へようこそ</h1>',
      '<nav><a href="/">Home</a> | <a href="/users">Users</a> |<!-- --> <a href="/about">About</a></nav>',
      '<script id="__CHIBIVOID_PAGE_DATA__" type="application/json">{"component":"index","props":{"title":"chibivoid へようこそ",',
    ],
  }),
  get('/about', { includes: '<h1>About</h1>' }),
  get('/users', { includes: '<ul><li><a href="/users/1">Ada</a></li><li><a href="/users/2">Linus</a></li></ul>' }),
  get('/users/2', { includes: '<main><div><h1>Linus</h1><p>ID: <!-- -->2</p><a href="/users">← 一覧へ</a></div></main>' }),
  get('/users/999', { status: 404 }),
];

// 第 9 章: ハイドレーションとクライアント遷移
const clientEntry = [
  get('/', {
    includes: [
      'import RefreshRuntime from "/@react-refresh";',
      '<script type="module" src="/@id/__x00__virtual:chibivoid-pages-client"></script>',
    ],
  }),
  // ブラウザ用のエントリを、Vite が変換して返せる
  get('/@id/__x00__virtual:chibivoid-pages-client', { includes: 'startReactPages' }),
];

const pageObject = [
  get(
    '/users',
    {
      headers: { vary: /X-ChibivoidPages/, 'x-chibivoidpages': 'true' },
      includes:
        '{"component":"users/index","props":{"users":[{"id":1,"name":"Ada"},{"id":2,"name":"Linus"}]},"params":{},"url":"/users"',
    },
    { headers: { 'X-ChibivoidPages': 'true' } },
  ),
];

// 第 10 章: action とフォーム
const forms = [
  submit(
    '/users',
    { name: '' },
    {
      includes:
        '<form method="post"><input placeholder="名前" name="name"/><button type="submit">追加</button><p role="alert">名前を入力してください</p></form>',
    },
  ),
  submit(
    '/users',
    { name: 'Grace' },
    {
      includes:
        '<ul><li><a href="/users/1">Ada</a></li><li><a href="/users/2">Linus</a></li><li><a href="/users/3">Grace</a></li></ul>',
    },
  ),
  submit('/users', { name: 'X' }, { status: 403 }, 'https://evil.example'),
];

// 第 11 章: 型安全
const likeButton = [get('/', { includes: '<button>いいね' })];

// 本文の「型付き fetch() でできること」の例。型チェックの間だけ playground/src/ に置く。
// @ts-expect-error を付けた行が型エラーにならない場合は、型チェックが失敗する
const TYPED_FETCH_EXAMPLES = `import { fetch } from "chibivoid/client";

const hello = await fetch("/api/hello");
hello.message satisfies string;
const counter = await fetch("/api/counter", { method: "POST" });
counter.count satisfies number;
await fetch("/api/users/[id]", { params: { id: 1 } });

// @ts-expect-error
hello.message.toFixed();
// @ts-expect-error
await fetch("/api/helo");
// @ts-expect-error
await fetch("/api/users/[id]");
// @ts-expect-error
await fetch("/api/hello", { method: "DELETE" });
`;

const typedFetch = [
  {
    name: '型付き fetch() の誤った呼び出しが、型エラーになる',
    run: async ({ dir, app }) => {
      const file = join(app, 'src', 'smoke-test-types.ts');
      try {
        writeTempFile(file, TYPED_FETCH_EXAMPLES);
        await run(dir, 'npm', ['run', 'typecheck', '--workspace', 'playground']);
      } finally {
        removeTempFile(file);
      }
    },
  },
];

// 第 12 章: ビルドとデプロイ
const productionAssets = [
  {
    name: 'ビルドしたブラウザ用のエントリを、HTML から読み込める',
    run: async ({ url }) => {
      const src = await findScript(url, /<script type="module" src="(\/assets\/pages-client-[^"]+\.js)"><\/script>/);
      await expectResponse(url + src, {}, { headers: { 'content-type': /javascript/ } });
    },
  },
];

const deploy = [
  {
    name: 'chibivoid deploy --dry-run',
    run: async ({ dir }) => {
      const output = await deployDryRun(dir);
      expectIncludes(output, [
        '[dry-run] wrangler kv namespace create chibivoid-app-kv',
        'env.KV (local)',
        '--dry-run: exiting now.',
      ]);
    },
  },
  {
    name: 'chibivoid deploy --dry-run（chibivoid.lock.json に KV の ID がある場合）',
    run: async ({ dir, app }) => {
      const file = join(app, 'chibivoid.lock.json');
      try {
        writeTempFile(file, '{ "kv": { "id": "0123456789abcdef0123456789abcdef", "title": "chibivoid-app-kv" } }\n');
        const output = await deployDryRun(dir);
        expectIncludes(output, 'env.KV (0123456789abcdef0123456789abcdef)');
        expectExcludes(output, '[dry-run] wrangler kv namespace create');
      } finally {
        removeTempFile(file);
      }
    },
  },
];

function deployDryRun(dir) {
  return run(dir, 'npm', ['run', 'deploy', '--workspace', 'playground', '--', '--dry-run']);
}

// 章ごとに確かめる項目
const CHAPTERS = {
  ch02: { dev: viteDev, preview: viteBuild },
  ch03: { dev: workers, preview: workers },
  ch04: { dev: skeleton },
  ch05: { dev: routes },
  ch06: { dev: [...routes, ...middleware, ...routesWatch] },
  ch07: {
    build: kvInferred,
    dev: [...routes, ...middleware, ...routesWatch, ...counter],
  },
  ch08: {
    build: kvInferred,
    dev: [...routes, ...middleware, ...routesWatch, ...counter, ...pages],
  },
  ch09: {
    build: kvInferred,
    dev: [...routes, ...middleware, ...routesWatch, ...counter, ...pages, ...clientEntry, ...pageObject],
  },
  ch10: {
    build: kvInferred,
    dev: [...routes, ...middleware, ...routesWatch, ...counter, ...pages, ...clientEntry, ...pageObject, ...forms],
  },
  ch11: {
    build: [...kvInferred, ...typedFetch],
    dev: [
      ...routes,
      ...middleware,
      ...routesWatch,
      ...counter,
      ...pages,
      ...clientEntry,
      ...pageObject,
      ...forms,
      ...likeButton,
    ],
  },
  ch12: {
    build: [...kvInferred, ...typedFetch],
    dev: [
      ...routes,
      ...middleware,
      ...routesWatch,
      ...counter,
      ...pages,
      ...clientEntry,
      ...pageObject,
      ...forms,
      ...likeButton,
    ],
    // 開発サーバーにしかないもの（ファイルの監視、/@id/ の URL など）以外は、ビルド結果でも確かめる
    preview: [
      ...routes,
      ...middleware,
      ...counter,
      ...pages,
      ...pageObject,
      ...forms,
      ...likeButton,
      ...productionAssets,
    ],
    cli: deploy,
  },
};

// ---------------------------------------------------------------------------
// 項目を作る関数
// ---------------------------------------------------------------------------

/** パスにリクエストを送り、レスポンスを確かめる項目 */
function request(method, path, expected = {}, init = {}) {
  const headers = Object.entries(init.headers ?? {}).map(([name, value]) => `${name}: ${value}`);
  return {
    name: `${method} ${path}${headers.length > 0 ? ` (${headers.join(', ')})` : ''} → ${describe(expected)}`,
    run: ({ url }) => expectResponse(url + path, { method, ...init }, expected),
  };
}

function get(path, expected, init) {
  return request('GET', path, expected, init);
}

function post(path, expected, init) {
  return request('POST', path, expected, init);
}

/** フォームを送信する項目。Origin ヘッダーは、指定しなければサーバー自身のオリジンにする */
function submit(path, fields, expected, origin) {
  const body = new URLSearchParams(fields);
  return {
    name: `POST ${path} (${body}${origin ? `, Origin: ${origin}` : ''}) → ${describe(expected)}`,
    run: ({ url }) => expectResponse(url + path, { method: 'POST', headers: { Origin: origin ?? url }, body }, expected),
  };
}

/** 項目の名前に付ける、期待する結果の短い説明 */
function describe({ status = 200, body, includes, headers = {} }) {
  const text = status !== 200 ? String(status) : (body ?? [includes].flat()[0] ?? Object.keys(headers).join(', '));
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

// ---------------------------------------------------------------------------
// 確かめるための関数
// ---------------------------------------------------------------------------

/** リクエストを送り、レスポンスが期待通りかを確かめて、本文を返す */
async function expectResponse(url, init = {}, expected = {}) {
  // curl と同じく、リダイレクトはたどらない
  const response = await fetch(url, { redirect: 'manual', ...init });
  const body = await response.text();
  const status = expected.status ?? 200;
  if (response.status !== status) {
    throw new Error(`ステータスコードが ${status} ではなく ${response.status} でした\n${body}`);
  }
  if (expected.body !== undefined && body !== expected.body) {
    throw new Error(`本文が違います\n期待: ${expected.body}\n実際: ${body}`);
  }
  expectIncludes(body, expected.includes ?? []);
  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    const actual = response.headers.get(name);
    if (value instanceof RegExp ? !value.test(actual ?? '') : actual !== value) {
      throw new Error(`${name} ヘッダーが ${value} ではなく ${actual} でした`);
    }
  }
  return body;
}

function expectIncludes(text, expected) {
  for (const part of [expected].flat()) {
    if (!text.includes(part)) {
      throw new Error(`次の文字列が含まれていません: ${part}\n---\n${text}`);
    }
  }
}

function expectExcludes(text, part) {
  if (text.includes(part)) {
    throw new Error(`次の文字列が含まれています: ${part}\n---\n${text}`);
  }
}

/** トップページの HTML から、パターンに一致する <script> タグの src を取り出す */
async function findScript(url, pattern) {
  const html = await expectResponse(`${url}/`);
  const src = pattern.exec(html)?.[1];
  if (!src) {
    throw new Error(`HTML に ${pattern} に一致する <script> タグがありません\n${html}`);
  }
  return src;
}

/** ファイルの変更が反映されるまでには時間がかかるので、成功するまで繰り返す */
async function eventually(fn, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (Date.now() > deadline) {
        throw error;
      }
    }
    await sleep(250);
  }
}

// ---------------------------------------------------------------------------
// プロセスとファイル
// ---------------------------------------------------------------------------

// 中断された場合も、起動したサーバーと、確認のために作ったファイルを片付ける
const servers = new Set();
const tempFiles = new Set();
process.on('exit', () => {
  for (const server of servers) {
    killServer(server, 'SIGKILL');
  }
  for (const file of tempFiles) {
    rmSync(file, { force: true });
  }
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => process.exit(1));
}

/** 確認のために一時的なファイルを作る。既存のファイルは上書きしない */
function writeTempFile(file, content) {
  if (!tempFiles.has(file) && existsSync(file)) {
    throw new Error(`${file} がすでにあるため、確認を続けられません`);
  }
  tempFiles.add(file);
  writeFileSync(file, content);
}

function removeTempFile(file) {
  rmSync(file, { force: true });
  tempFiles.delete(file);
}

/** コマンドを実行して、出力（stdout と stderr）を返す。失敗した場合は、出力を含むエラーを投げる */
function run(cwd, command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`${[command, ...args].join(' ')} が失敗しました（終了コード ${code}）\n${output}`));
      }
    });
  });
}

/**
 * `npm run dev` などでサーバーを起動し、リクエストに応答するようになるまで待つ。
 * 手元で動かしている開発サーバーとぶつからないように、空いているポートを使う
 */
async function startServer(dir, app, args) {
  // KV などのローカルの状態を消して、空の状態から始める
  rmSync(join(app, '.wrangler', 'state'), { recursive: true, force: true });
  const port = await freePort();
  // npm → vite → workerd と連なるプロセスを後でまとめて止められるように、別のプロセスグループで起動する
  const child = spawn('npm', [...args, '--', '--port', String(port), '--strictPort'], {
    cwd: dir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const server = { url: `http://localhost:${port}`, child, output: '' };
  servers.add(server);
  child.stdout.on('data', (chunk) => (server.output += chunk));
  child.stderr.on('data', (chunk) => (server.output += chunk));
  const deadline = Date.now() + 60_000;
  while (true) {
    try {
      const response = await fetch(server.url, { redirect: 'manual' });
      await response.body?.cancel();
      return server;
    } catch {
      // まだ起動していない
    }
    if (child.exitCode !== null || Date.now() > deadline) {
      await stopServer(server);
      throw new Error(`サーバーを起動できませんでした\n${server.output}`);
    }
    await sleep(250);
  }
}

/** サーバーのプロセスをまとめて止め、終了するまで待つ */
async function stopServer(server) {
  killServer(server, 'SIGTERM');
  for (let i = 0; i < 50 && isServerAlive(server); i++) {
    await sleep(100);
  }
  killServer(server, 'SIGKILL');
  servers.delete(server);
}

function killServer(server, signal) {
  try {
    // detached で起動したプロセスの PID は、そのプロセスグループの ID でもある
    process.kill(-server.child.pid, signal);
  } catch {
    // すでに終了している
  }
}

function isServerAlive(server) {
  try {
    process.kill(-server.child.pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** OS に空いているポートを選ばせる */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// ---------------------------------------------------------------------------
// 実行
// ---------------------------------------------------------------------------

/** 1 つの章を確かめる。すべて期待通りだった場合は true を返す */
async function checkChapter(name) {
  console.log(`\n${name}`);
  const dir = join(codeDir, name);
  // 第 4 章以降は npm workspaces のモノレポで、アプリケーションは playground にある
  const workspace = existsSync(join(dir, 'playground'));
  const app = workspace ? join(dir, 'playground') : dir;
  const inApp = workspace ? ['--workspace', 'playground'] : [];
  const { build = [], dev = [], preview = [], cli = [] } = CHAPTERS[name];
  let ok = true;

  /** 手順を 1 つ実行して、結果を表示する。成功した場合は true を返す */
  async function step(label, fn) {
    const start = performance.now();
    try {
      await fn();
      const seconds = (performance.now() - start) / 1000;
      console.log(`  ✓ ${label}${seconds >= 1 ? ` (${seconds.toFixed(1)}s)` : ''}`);
      return true;
    } catch (error) {
      ok = false;
      console.log(`  ✗ ${label}\n${indent(error.message)}`);
      return false;
    }
  }

  // 依存のインストールかビルドに失敗した場合は、残りを確かめようがない
  if (!(await step('npm install', () => run(dir, 'npm', ['install', '--no-package-lock', '--no-audit', '--no-fund'])))) {
    return false;
  }
  if (!(await step('npm run build', () => run(dir, 'npm', ['run', 'build'])))) {
    return false;
  }
  if (workspace) {
    await step('npm run typecheck', () => run(dir, 'npm', ['run', 'typecheck', ...inApp]));
  } else {
    await step('tsc --noEmit', () => run(dir, join(dir, 'node_modules', '.bin', 'tsc'), ['--noEmit']));
  }
  for (const check of build) {
    await step(check.name, () => check.run({ dir, app }));
  }
  for (const [script, checks] of [
    ['dev', dev],
    ['preview', preview],
  ]) {
    if (checks.length === 0) {
      continue;
    }
    let server;
    if (!(await step(`npm run ${script}`, async () => (server = await startServer(dir, app, ['run', script, ...inApp]))))) {
      continue;
    }
    try {
      for (const check of checks) {
        await step(`${script}: ${check.name}`, async () => {
          try {
            await check.run({ dir, app, url: server.url });
          } catch (error) {
            error.message += `\n--- サーバーの出力（最後の 20 行）---\n${server.output.trimEnd().split('\n').slice(-20).join('\n')}`;
            throw error;
          }
        });
      }
    } finally {
      await stopServer(server);
    }
  }
  for (const check of cli) {
    await step(check.name, () => check.run({ dir, app }));
  }
  return ok;
}

function indent(text) {
  return text
    .trimEnd()
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
}

const all = readdirSync(codeDir)
  .filter((name) => /^ch\d+$/.test(name))
  .sort();
const missing = all.filter((name) => !CHAPTERS[name]);
if (missing.length > 0) {
  throw new Error(`CHAPTERS に確かめる項目がない章があります: ${missing.join(', ')}`);
}
const selected = process.argv.slice(2);
const unknown = selected.filter((name) => !all.includes(name));
if (unknown.length > 0) {
  throw new Error(`章が見つかりません: ${unknown.join(', ')}`);
}

const failed = [];
for (const name of selected.length > 0 ? selected : all) {
  if (!(await checkChapter(name))) {
    failed.push(name);
  }
}
if (failed.length > 0) {
  console.error(`\n期待通りに動かなかった章があります: ${failed.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('\nすべての章が期待通りに動きました');
}
