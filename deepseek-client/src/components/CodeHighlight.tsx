import { FC } from 'react';
import hljs from 'highlight.js';

interface CodeHighlightProps {
  code: string;
  language?: string;
  inline?: boolean;
  isDark?: boolean;
}

export const CodeHighlight: FC<CodeHighlightProps> = ({
  code,
  language = 'plaintext',
  inline = false,
  isDark = false,
}) => {
  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';

  if (inline) {
    return (
      <code
        className="inline-code"
        style={{
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
          color: isDark ? '#E6E6E6' : 'inherit',
          fontSize: '14px',
        }}
      >
        {code}
      </code>
    );
  }

  const highlighted = hljs.highlight(code, { language: validLanguage }).value;

  return (
    <pre
      className={`hljs language-${validLanguage}`}
      style={{
        backgroundColor: isDark ? '#282c34' : '#f6f8fa',
        borderRadius: '8px',
        margin: '10px 0',
        position: 'relative',
        fontSize: '15px',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="code-header"
        style={{
          backgroundColor: isDark ? '#343a46' : '#e7eaed',
          borderBottom: `1px solid ${isDark ? '#4a5261' : '#dde0e3'}`,
          color: isDark ? '#abb2bf' : '#606060',
          padding: '6px 12px',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <span className="code-language">{validLanguage}</span>
      </div>
      <code
        dangerouslySetInnerHTML={{ __html: highlighted }}
        style={{
          padding: '12px',
          fontSize: '14px',
          lineHeight: 1.5,
          letterSpacing: '0.01em',
        }}
      />
    </pre>
  );
};
