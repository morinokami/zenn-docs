import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * デプロイ時に作成した Cloudflare リソースの ID を記録するファイル（chibivoid.lock.json）。
 * Void と同じくリポジトリにコミットしておき、次回以降のデプロイで同じリソースを使う。
 */
export type LockFile = {
  kv?: { id: string; title: string };
};

const LOCK_FILE = 'chibivoid.lock.json';

export function readLockFile(root: string): LockFile {
  const path = join(root, LOCK_FILE);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as LockFile) : {};
}

export function writeLockFile(root: string, lock: LockFile): void {
  writeFileSync(join(root, LOCK_FILE), JSON.stringify(lock, null, 2) + '\n');
}
