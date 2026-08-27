/**
 * Academic Text Formatter and Typographic Normalizer
 * Standardizes spacing, paragraph breaks, Persian half-spaces, punctuation, and capitalization.
 */

export function formatAcademicText(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  let text = rawText;

  // 1. Normalize line endings and trim lines
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').map(l => l.trim());

  // Collapse 3+ consecutive newlines into 2 (standard paragraph spacing)
  text = lines.join('\n').replace(/\n{3,}/g, '\n\n');

  // 2. Persian specific typography & half-space (نیم‌فاصله) rules
  // Standardize Persian characters (ی and ک)
  text = text.replace(/ي/g, 'ی').replace(/ك/g, 'ک');

  // Normalize Persian half-spaces with common prefixes and suffixes
  // Prefixes: می / نمی
  text = text.replace(/\b(می|نمی)\s+([آ-یa-zA-Z]+)/g, '$1\u200C$2');

  // Suffixes: ها / های / هایم / هایت / هایمان / هایتان / هایشان / تر / ترین / ام / ات / اش / ایم / اید / اند
  text = text.replace(/([آ-ی])\s+(ها|های|هایم|هایت|هایمان|هایتان|هایشان|تر|ترین|ام|ات|اش|ایم|اید|اند)\b/g, '$1\u200C$2');
  
  // Specific educational / academic compounds
  text = text.replace(/دانش\s+آموز/g, 'دانش\u200Cآموز');
  text = text.replace(/دانش\s+آموزان/g, 'دانش\u200Cآموزان');
  text = text.replace(/برنامه\s+ریزی/g, 'برنامه\u200Cریزی');
  text = text.replace(/پاسخ\s+نامه/g, 'پاسخ\u200Cنامه');
  text = text.replace(/کتاب\s+نامه/g, 'کتاب\u200Cنامه');
  text = text.replace(/خود\s+کار/g, 'خودکار');
  text = text.replace(/روان\s+شناسی/g, 'روان\u200Cشناسی');
  text = text.replace(/زیست\s+شناسی/g, 'زیست\u200Cشناسی');
  text = text.replace(/جامعه\s+شناسی/g, 'جامعه\u200Cشناسی');
  text = text.replace(/زمین\s+شناسی/g, 'زمین\u200Cشناسی');

  // 3. Punctuation spacing (Persian and Latin)
  // Remove space before punctuation marks: . , ! ? : ; ، ؛ ؟
  text = text.replace(/\s+([.,!?:;،؛؟])/g, '$1');

  // Ensure single space after punctuation marks if followed by a non-space character (excluding newlines or digits for decimals)
  text = text.replace(/([.!?:;،؛؟])([^\s\n\d"'\)»\]])/g, '$1 $2');
  text = text.replace(/,([^\s\n\d])/g, ', $1');

  // Normalize quotes: "text" -> «text» in Persian or clean quotes
  text = text.replace(/<<([^>]+)>>/g, '«$1»');

  // 4. English / Latin capitalization rules
  // Capitalize first letter of every paragraph / sentence in Latin segments
  text = text.replace(/(^|[.?!]\s+)([a-z])/g, (match, sep, char) => `${sep}${char.toUpperCase()}`);

  // Capitalize standalone 'i'
  text = text.replace(/\b(i)\b/g, 'I');

  // 5. Remove multiple consecutive horizontal spaces
  text = text.replace(/[ \t]{2,}/g, ' ');

  return text.trim();
}
