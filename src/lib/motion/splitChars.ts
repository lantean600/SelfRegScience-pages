function isCjk(char: string) {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(char);
}

export function splitChars(root: HTMLElement) {
  const words = root.querySelectorAll<HTMLElement>("[data-split-word]");
  const inners: HTMLElement[] = [];

  words.forEach((word) => {
    const text = word.textContent ?? "";
    word.textContent = "";
    word.setAttribute("aria-label", text);

    const allCjk = Array.from(text).every((ch) => ch === " " || isCjk(ch));
    if (allCjk) {
      word.classList.add("hero-word--cjk");
    }

    Array.from(text).forEach((letter) => {
      if (letter === " ") {
        word.appendChild(document.createTextNode("\u00a0"));
        return;
      }

      const char = document.createElement("span");
      char.className = allCjk ? "hero-char" : "hero-char hero-char--latin";
      char.setAttribute("aria-hidden", "true");

      const inner = document.createElement("span");
      inner.className = "hero-char__inner";
      inner.dataset.letter = letter.toUpperCase();
      inner.textContent = letter;

      char.appendChild(inner);
      word.appendChild(char);
      inners.push(inner);
    });
  });

  return inners;
}
