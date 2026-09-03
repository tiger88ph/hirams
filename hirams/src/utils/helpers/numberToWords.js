// utils/helpers/numberToWords.js
const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const TENS = [
  "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY",
];

function convert(n) {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ten = TENS[Math.floor(n / 10)];
    const one = n % 10 ? ONES[n % 10] : "";
    return one ? `${ten}-${one}` : ten;
  }
  if (n < 1000) {
    return (
      ONES[Math.floor(n / 100)] +
      " HUNDRED" +
      (n % 100 ? " " + convert(n % 100) : "")
    );
  }
  if (n < 1000000) {
    return (
      convert(Math.floor(n / 1000)) +
      " THOUSAND" +
      (n % 1000 ? " " + convert(n % 1000) : "")
    );
  }
  if (n < 1000000000) {
    return (
      convert(Math.floor(n / 1000000)) +
      " MILLION" +
      (n % 1000000 ? " " + convert(n % 1000000) : "")
    );
  }
  return (
    convert(Math.floor(n / 1000000000)) +
    " BILLION" +
    (n % 1000000000 ? " " + convert(n % 1000000000) : "")
  );
}

export function numberToWords(amount) {
  const value = Number(amount) || 0;
  if (value === 0) return "ZERO AND 00/100 PESOS ONLY";

  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100);

  let words = convert(intPart);
  if (decPart > 0) {
    words += ` AND ${String(decPart).padStart(2, "0")}/100`;
  }
  return `${words} PESOS ONLY`;
}