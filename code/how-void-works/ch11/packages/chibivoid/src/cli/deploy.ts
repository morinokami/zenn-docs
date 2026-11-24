import { spawnSync } from 'node:child_process';
import { createBuilder } from 'vite';
import { readWorkerName } from '../index.ts';
import { inferProjectBindings } from '../inference/walk.ts';
import { readLockFile, writeLockFile } from './lock.ts';

/**
 * `chibivoid deploy`: 推論 → プロビジョニング → ビルド → 公開
 * Void の `void deploy` がおこなう流れを、一番単純なかたちでなぞる。
 */
export async function runDeploy(root: string, options: { dryRun: boolean }): Promise<void> {
  // 1. どのリソースが必要かを、ソースコードから推論する（vite.config.ts と同じロジック）
  const bindings = inferProjectBindings(root);
  const lock = readLockFile(root);

  // 2. 必要なのにまだ作っていないリソースを、Cloudflare 上に作る（プロビジョニング）
  if (bindings.needsKV && !lock.kv) {
    const title = `${readWorkerName(root)}-kv`;
    if (options.dryRun) {
      console.log(`[dry-run] wrangler kv namespace create ${title}`);
    } else {
      const output = wrangler(['kv', 'namespace', 'create', title]);
      const id = /"id":\s*"([0-9a-f]{32})"/.exec(output)?.[1];
      if (!id) {
        throw new Error(`KV ネームスペースの ID を読み取れませんでした:\n${output}`);
      }
      // 作った ID を記録しておき、次回からは同じネームスペースを使う
      lock.kv = { id, title };
      writeLockFile(root, lock);
      console.log(`KV ネームスペース ${title}（${id}）を作成しました`);
    }
  }

  // 3. ビルドする。chibivoidPlugin() が chibivoid.lock.json の ID を Worker の設定に書き込む
  const builder = await createBuilder({ root });
  await builder.buildApp();

  // 4. 公開する。Cloudflare の Vite プラグインが、ビルド結果の wrangler.json を指す
  //    リダイレクト設定を出力するため、`wrangler deploy` は引数なしでよい
  wrangler(['deploy', ...(options.dryRun ? ['--dry-run'] : [])], { inherit: true });
}

function wrangler(args: string[], options: { inherit?: boolean } = {}): string {
  const result = spawnSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`wrangler ${args.join(' ')} が失敗しました\n${result.stderr ?? ''}`);
  }
  return result.stdout ?? '';
}
