#!/usr/bin/env node
// books/*/*.md の中のマーカーに、code/ 以下の実ファイルの内容（または差分）を流し込む。
//
//   <!-- file: code/how-void-works/ch04/packages/chibivoid/src/router/parse-filename.ts -->
//   <!-- /file -->
//     → ファイル全体をコードブロックとして埋め込む（#L10-L20 で行範囲も指定できる）
//
//   <!-- diff: code/how-void-works/ch04/playground/vite.config.ts code/how-void-works/ch07/playground/vite.config.ts -->
//   <!-- /diff -->
//     → 2 つのファイルの差分を diff コードブロックとして埋め込む
//
// コードブロックは、Zenn の記法（```ts:ファイル名、```diff ts:ファイル名）でファイル名を付けて書き出す。
// マーカーは 1 行の HTML コメントなので、Zenn では表示されない。
//
// 使い方:
//   node scripts/sync-code.mjs          # 埋め込みを更新する
//   node scripts/sync-code.mjs --check  # 更新が必要なら失敗する（CI 用）
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = join(import.meta.dirname, '..');
const booksDir = join(root, 'books');
const check = process.argv.includes('--check');

const LANGUAGES = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.mjs': 'js',
  '.json': 'json',
  '.html': 'html',
  '.md': 'md',
  '.txt': 'text',
};

/** "code/how-void-works/ch04/packages/chibivoid/src/x.ts" → "packages/chibivoid/src/x.ts" */
function displayPath(path) {
  return path.replace(/^code\/[^/]+\/ch\d+\//, '');
}

/** 内容に含まれるバッククォートの連続より長いフェンスを選ぶ */
function fence(content) {
  const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map((m) => m[0].length));
  return '`'.repeat(longest + 1);
}

function renderFile(spec) {
  const [path, range] = spec.split('#');
  let content = readFileSync(join(root, path), 'utf8').replace(/\n$/, '');
  let label = displayPath(path);
  if (range) {
    const [, start, end] = /^L(\d+)-L(\d+)$/.exec(range) ?? [];
    if (!start) {
      throw new Error(`行範囲の書式が不正です: ${spec}`);
    }
    content = content
      .split('\n')
      .slice(Number(start) - 1, Number(end))
      .join('\n');
    label += `（${start}〜${end} 行目）`;
  }
  // Zenn は「言語:ファイル名」の形でファイル名を表示する。言語がわからないファイルは text にする
  const lang = LANGUAGES[extname(path)] ?? 'text';
  const f = fence(content);
  return `${f}${lang}:${label}\n${content}\n${f}`;
}

function renderDiff(spec) {
  const [oldPath, newPath] = spec.trim().split(/\s+/);
  // 差分は OS の diff コマンドではなく git で作る。diff コマンドは実装（GNU / macOS）によって
  // 同じ入力でも出力が変わるので、実行環境ごとに本文が書き換わってしまう。
  // 出力を変えうる git の設定（diff.algorithm、diff.context など）もオプションで固定する。
  const args = [
    '-c',
    'diff.suppressBlankEmpty=false',
    'diff',
    '--no-index',
    '--no-color',
    '--no-ext-diff',
    '--no-textconv',
    '--diff-algorithm=myers',
    '--indent-heuristic',
    '--unified=3',
    '--inter-hunk-context=0',
    join(root, oldPath),
    join(root, newPath),
  ];
  let output = '';
  try {
    // 環境変数 GIT_DIFF_OPTS は --unified より優先されるので、子プロセスには渡さない
    execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, GIT_DIFF_OPTS: undefined } });
  } catch (error) {
    // git diff --no-index は差分があると終了コード 1 を返す
    if (error.status !== 1) {
      throw error;
    }
    output = error.stdout;
  }
  const lines = output.split('\n');
  // git 独自のヘッダー（diff --git / index / --- / +++）は捨てて、最初の @@ 行から使う
  const start = lines.findIndex((line) => line.startsWith('@@'));
  if (start === -1) {
    throw new Error(`差分がありません: ${spec}`);
  }
  const hunks = lines
    .slice(start)
    // git が @@ 行の後ろに付ける関数名などを取り除き、diff -u と同じ形にする
    .map((line) => line.replace(/^(@@ -\S+ \+\S+ @@).*/, '$1'));
  // ファイル名はコードブロックの上に表示するので、--- / +++ の行は付けない
  // （Zenn の diff 表示では、- / + で始まる行が削除行・追加行として色付けされてしまう）
  const content = hunks.join('\n').replace(/\n$/, '');
  const oldLabel = displayPath(oldPath);
  const newLabel = displayPath(newPath);
  const label = oldLabel === newLabel ? newLabel : `${oldLabel} → ${newLabel}`;
  // 「diff 言語:ファイル名」と書くと、Zenn は差分の色付けと言語のハイライトを両方おこなう
  const lang = LANGUAGES[extname(newPath)];
  const f = fence(content);
  return `${f}diff${lang ? ` ${lang}` : ''}:${label}\n${content}\n${f}`;
}

const MARKER_RE = /<!-- (file|diff): ([^>]+?) -->\n[\s\S]*?<!-- \/\1 -->/g;

const chapters = readdirSync(booksDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .flatMap((book) =>
    readdirSync(join(booksDir, book))
      .filter((file) => file.endsWith('.md'))
      .sort()
      .map((file) => `books/${book}/${file}`),
  );

let stale = 0;
for (const chapter of chapters) {
  const path = join(root, chapter);
  const source = readFileSync(path, 'utf8');
  const updated = source.replace(MARKER_RE, (_match, kind, spec) => {
    const body = kind === 'file' ? renderFile(spec.trim()) : renderDiff(spec);
    return `<!-- ${kind}: ${spec.trim()} -->\n${body}\n<!-- /${kind} -->`;
  });
  if (updated !== source) {
    stale++;
    if (check) {
      console.error(`更新が必要です: ${chapter}`);
    } else {
      writeFileSync(path, updated);
      console.log(`更新しました: ${chapter}`);
    }
  }
}

if (check && stale > 0) {
  process.exitCode = 1;
} else if (stale === 0) {
  console.log('すべての埋め込みは最新です');
}
