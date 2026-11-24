// 仮想モジュールの型を TypeScript に教える。
declare module 'virtual:notes' {
  const notes: Array<{ title: string; body: string }>;
  export default notes;
}
