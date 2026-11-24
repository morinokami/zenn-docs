// `virtual:build-info` は vite.config.ts のプラグインが生成する仮想モジュール
import buildInfo from 'virtual:build-info';

// Worker からアクセス可能な「バインディング」の型。KV は vite.config.ts で設定する
type Env = {
  KV: KVNamespace;
};

export default {
  // Worker は「Request を受け取って Response を返す関数」をもつオブジェクトをエクスポートする
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/count') {
      // KV に訪問回数を保存する
      const count = Number((await env.KV.get('count')) ?? 0) + 1;
      await env.KV.put('count', String(count));
      return Response.json({ count });
    }

    return new Response(
      [
        `こんにちは！ このコードは ${navigator.userAgent} の上で動いています。`,
        `仮想モジュールを生成した Vite 環境: ${buildInfo.environment}`,
        `生成した時刻: ${buildInfo.generatedAt}`,
      ].join('\n'),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  },
};
