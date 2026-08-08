async function update(event: Event) {
  console.log(event);
}

enum Formatting {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Obfuscated
}

function formatting(type: Formatting): (event: Event) => void {
  return async (event) => {};
}

async function init() {
  const input = document.getElementById('input')!;
  input.onchange = update;

  document.getElementById('bold')!.onclick = formatting(Formatting.Bold);
  document.getElementById('italic')!.onclick = formatting(Formatting.Italic);
  document.getElementById('underline')!.onclick = formatting(Formatting.Underline);
  document.getElementById('strikethrough')!.onclick = formatting(Formatting.Strikethrough);
  document.getElementById('obfuscated')!.onclick = formatting(Formatting.Obfuscated);
}

init();
