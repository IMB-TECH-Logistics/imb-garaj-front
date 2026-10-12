import i18n from "@/i18n/i18n";

const nw = (key: string) => i18n.t(`core.num_words.${key}`);

const chunkify = (number: number) => {
  const chunks = [];
  while (number > 0) {
    chunks.unshift(number % 1000);
    number = Math.floor(number / 1000);
  }
  return chunks;
};

const chunkToWord = (chunk: number) => {
  if (chunk === 0) return "";

  let result = "";
  const hundred = Math.floor(chunk / 100);
  const remainder = chunk % 100;
  const ten = Math.floor(remainder / 10);
  const one = remainder % 10;

  if (hundred > 0) {
    result += nw(`hundred_${hundred}`) + " ";
  }

  if (ten === 1) {
    result += nw(`teen_${one}`);
  } else {
    if (ten > 1) {
      result += nw(`ten_${ten}`);
      if (one > 0) result += " ";
    }
    if (one > 0 || (ten === 0 && hundred === 0)) {
      result += one > 0 ? nw(`one_${one}`) : "";
    }
  }

  return result.trim();
};

export function numberToWord(n: unknown) {
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  if (num === 0) return "";
  if (num > 1_000_000_000_000)
    return nw("limit");

  const chunks = chunkify(num);
  let words = "";
  const chunkCount = chunks.length;

  chunks.forEach((chunk, index) => {
    if (chunk > 0) {
      const scaleIndex = chunkCount - index - 1;

      words +=
        chunkToWord(chunk) +
        " " +
        (scaleIndex > 0 ? nw(`scale_${scaleIndex}`) : "") +
        " ";
    }
  });

  return words.trim();
}
