// `virtual:notes` はディスク上には存在しない「仮想モジュール」。
// 中身は notes-plugin.ts が notes/ ディレクトリから組み立てる。
import notes from "virtual:notes";

const list = document.querySelector("#notes")!;
for (const note of notes) {
  const item = document.createElement("li");
  item.textContent = `${note.title}: ${note.body}`;
  list.append(item);
}
