/**
 * Reading Complexity Calculator
 * Calculates estimated readability complexity based on word length, sentence length, and vocabulary depth.
 */

export interface ReadingComplexityResult {
  level: 'easy' | 'moderate' | 'advanced';
  score: number; // 0 to 100
  labelFa: string;
  labelEn: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  avgWordLength: number;
  wordCount: number;
  sentenceCount: number;
  descriptionFa: string;
  descriptionEn: string;
}

export function calculateReadingComplexity(text: string): ReadingComplexityResult {
  if (!text || !text.trim()) {
    return {
      level: 'easy',
      score: 10,
      labelFa: 'ساده',
      labelEn: 'Easy',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/30',
      avgWordLength: 0,
      wordCount: 0,
      sentenceCount: 0,
      descriptionFa: 'ساختار جملات روان و واژگان ساده و روزمره',
      descriptionEn: 'Simple sentences and everyday vocabulary'
    };
  }

  const cleanText = text.trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      level: 'easy',
      score: 10,
      labelFa: 'ساده',
      labelEn: 'Easy',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/30',
      avgWordLength: 0,
      wordCount: 0,
      sentenceCount: 0,
      descriptionFa: 'ساختار جملات روان و واژگان ساده و روزمره',
      descriptionEn: 'Simple sentences and everyday vocabulary'
    };
  }

  // Sentences split by . ! ? ؟ or newlines
  const sentences = cleanText.split(/[.!?؟\n]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // 1. Average word length (characters per word)
  const totalCharacters = words.reduce((acc, word) => acc + word.replace(/[^\wآ-ی]/g, '').length, 0);
  const avgWordLength = totalCharacters / wordCount;

  // 2. Average sentence length (words per sentence)
  const avgWordsPerSentence = wordCount / sentenceCount;

  // 3. Complex words analysis (> 6 letters or multisyllabic academic Persian/English terms)
  const complexWords = words.filter(w => {
    const cleanWord = w.replace(/[^\wآ-ی]/g, '');
    if (cleanWord.length >= 7) return true;
    
    // Academic indicators
    const academicPatterns = [
      /تحلیل/, /برنامه/, /استنتاج/, /دیفرانسیل/, /ماتریس/, /سنتز/, /متابولیسم/, 
      /فرمول/, /روانشناس/, /روان\u200Cشناس/, /فیزیولوژی/, /ترمودینامیک/, /احتمال/,
      /پارادایم/, /استراتژی/, /متدولوژی/, /روش\u200Cشناسی/, /کنکور/, /بودجه\u200Cبندی/,
      /hypothesis/, /analysis/, /synthesis/, /algorithm/, /differentiation/, /derivation/
    ];
    return academicPatterns.some(p => p.test(cleanWord));
  });

  const complexWordRatio = complexWords.length / wordCount;

  // Calculate composite score from 0 to 100
  // Score weights:
  // - Word length: 30% (scale: 3.5 -> 0, 7.5 -> 100)
  // - Sentence length: 35% (scale: 4 -> 0, 25 -> 100)
  // - Complex words ratio: 35% (scale: 0 -> 0, 0.4 -> 100)
  
  const wordLenScore = Math.min(100, Math.max(0, ((avgWordLength - 3.5) / 4.0) * 100));
  const sentenceLenScore = Math.min(100, Math.max(0, ((avgWordsPerSentence - 4) / 20) * 100));
  const complexRatioScore = Math.min(100, Math.max(0, (complexWordRatio / 0.35) * 100));

  const compositeScore = Math.round(
    wordLenScore * 0.3 + sentenceLenScore * 0.35 + complexRatioScore * 0.35
  );

  if (compositeScore < 35) {
    return {
      level: 'easy',
      score: compositeScore,
      labelFa: 'ساده',
      labelEn: 'Easy',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/30',
      avgWordLength: Number(avgWordLength.toFixed(1)),
      wordCount,
      sentenceCount,
      descriptionFa: 'متن روان و ساختار واژگان ساده و عمومی',
      descriptionEn: 'Clear, straightforward and easily readable'
    };
  } else if (compositeScore < 70) {
    return {
      level: 'moderate',
      score: compositeScore,
      labelFa: 'متوسط',
      labelEn: 'Moderate',
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/15',
      borderClass: 'border-cyan-500/30',
      avgWordLength: Number(avgWordLength.toFixed(1)),
      wordCount,
      sentenceCount,
      descriptionFa: 'شامل اصطلاحات درسی و ساختار جملات چندبخشی',
      descriptionEn: 'Standard academic and conceptual inquiry'
    };
  } else {
    return {
      level: 'advanced',
      score: compositeScore,
      labelFa: 'پیشرفته',
      labelEn: 'Advanced',
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/15',
      borderClass: 'border-purple-500/30',
      avgWordLength: Number(avgWordLength.toFixed(1)),
      wordCount,
      sentenceCount,
      descriptionFa: 'سطح تخصصی بالا، مفاهیم عمیق و واژگان تحلیلی',
      descriptionEn: 'High technical depth and dense analytical phrasing'
    };
  }
}
