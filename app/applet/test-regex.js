const keywords = ["সীমান্ত", "চোরাচালান", "বিডিআর"];
const text = "এখানে সীমান্তের, চোরাচালানের,বিডিআরের কথা বলা হয়েছে।";

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const wordChars = `[^\\s.,!?;:"'\\(\\)\\[\\]{}|<>-]*`;

keywords.forEach(kw => {
  const regex = new RegExp(`(${wordChars}${escapeRegExp(kw)}${wordChars})`, 'gi');
  console.log("Keyword:", kw);
  const parts = text.split(regex);
  console.log("Parts:", parts);
});
