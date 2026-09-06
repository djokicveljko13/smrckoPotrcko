const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "đ", е: "e", ж: "ž",
  з: "z", и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n",
  њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "ć", у: "u",
  ф: "f", х: "h", ц: "c", ч: "č", џ: "dž", ш: "š",
};

/** Google može vratiti ćirilicu i uz sr-Latn; menjamo prikaz, ne placeId. */
export function toSerbianLatin(text: string): string {
  return text.replace(/[А-Яа-яЂђЈјЉљЊњЋћЏџ]+/g, (word) => {
    const allCaps = word.length > 1 && word === word.toUpperCase();

    return Array.from(word, (letter) => {
      const lower = letter.toLowerCase();
      const latin = CYRILLIC_TO_LATIN[lower];
      if (!latin) return letter;
      if (letter === lower) return latin;
      // Љубљана -> Ljubljana, ЊЕГОШЕВА -> NJEGOŠEVA.
      return allCaps ? latin.toUpperCase() : latin[0].toUpperCase() + latin.slice(1);
    }).join("");
  });
}
