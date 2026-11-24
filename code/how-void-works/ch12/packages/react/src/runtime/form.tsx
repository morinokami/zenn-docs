import { useContext, type FormHTMLAttributes, type SubmitEvent } from 'react';
import { RouterContext } from './context.ts';

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'method' | 'action'> & {
  /** 送信先のページ。省略すると今のページ */
  action?: string;
};

/**
 * ページの action に送信するフォーム。普通の <form method="post"> として描画されるため、
 * JavaScript がなくても動く。JavaScript が動いていれば fetch で送信して画面だけを差し替える。
 */
export function Form({ action, onSubmit, ...rest }: FormProps) {
  const router = useContext(RouterContext);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    onSubmit?.(event);
    if (!router || event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    const form = event.currentTarget;
    // action を省略した場合は、普通のフォームと同じく今のページに送る
    const url = new URL(action ?? location.href, location.href);
    const page = await router.visit(url.pathname + url.search, {
      method: 'POST',
      // 押されたボタン（submitter）の name と value も、普通のフォーム送信と同じく含める
      body: new FormData(form, event.nativeEvent.submitter),
    });
    // 成功した場合は入力欄を初期値に戻す
    if (page && !page.errors) {
      form.reset();
    }
  }

  return <form method="post" action={action} onSubmit={handleSubmit} {...rest} />;
}
