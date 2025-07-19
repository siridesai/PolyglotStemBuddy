// LatexRender.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface LatexRenderProps {
  content: string;
}

const LatexRender: React.FC<LatexRenderProps> = ({ content }) => {
  // Strip surrounding quotes, if present (only one pair)
  const cleanedContent = content.replace(/^"(.*)"$/, '$1');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {cleanedContent}
    </ReactMarkdown>
  );
};

export default LatexRender;
