import React from 'react';

// Lightweight and safe formatter for Persian chat messages with bold, lists, code, and callouts
export function formatMessageText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-xl bg-slate-950/90 border border-slate-700/60 p-3 text-left font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto dir-ltr">
            {codeLanguage && (
              <div className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-2">
                {codeLanguage}
              </div>
            )}
            <pre className="whitespace-pre-wrap">{codeBlockContent.join('\n')}</pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
        codeLanguage = '';
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().replace(/^```/, '');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-base sm:text-lg font-bold text-amber-300 mt-3 mb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-amber-400 inline-block"></span>
          {parseInlineFormatting(line.substring(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-lg sm:text-xl font-bold text-emerald-300 mt-4 mb-2 flex items-center gap-2">
          <span className="w-2 h-5 rounded-full bg-emerald-400 inline-block"></span>
          {parseInlineFormatting(line.substring(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-xl sm:text-2xl font-extrabold text-white mt-4 mb-2 border-b border-slate-700/60 pb-1">
          {parseInlineFormatting(line.substring(2))}
        </h2>
      );
      continue;
    }

    // Handle bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().substring(2);
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1.5 pr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
          <div className="leading-relaxed text-slate-200 text-sm sm:text-base">{parseInlineFormatting(content)}</div>
        </div>
      );
      continue;
    }

    // Handle numbered list
    const numberedMatch = line.trim().match(/^(\d+)[.)\-]\s+(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const content = numberedMatch[2];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 pr-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 shrink-0 mt-0.5">
            {num}
          </span>
          <div className="leading-relaxed text-slate-200 text-sm sm:text-base">{parseInlineFormatting(content)}</div>
        </div>
      );
      continue;
    }

    // Handle quote or callout
    if (line.trim().startsWith('>')) {
      const content = line.trim().substring(1).trim();
      elements.push(
        <blockquote key={`quote-${i}`} className="my-2 p-3 rounded-xl bg-emerald-950/30 border-r-4 border-emerald-500 text-emerald-200 text-sm italic">
          {parseInlineFormatting(content)}
        </blockquote>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`space-${i}`} className="h-2"></div>);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed my-1 text-slate-200 text-sm sm:text-base">
        {parseInlineFormatting(line)}
      </p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// Parse bold **text**, inline code `code`, highlight ==text==
function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match **bold**, `code`, or regular parts
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-xs border border-slate-700/50">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
