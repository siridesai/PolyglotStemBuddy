import React from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface LatexRendererProps {
  content: string;
}

const LatexRender: React.FC<LatexRendererProps> = ({ content }) => {
  // Regex to find $$...$$ blocks
  const regex = /\$\$([\s\S]+?)\$\$/g;
  const segments: Array<{ type: 'text' | 'latex'; value: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Add text before LaTeX block
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    // Add LaTeX block
    segments.push({ type: 'latex', value: match[1] });
    lastIndex = regex.lastIndex;
  }
  // Add any remaining text after the last LaTeX block
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return (
    <div>
      {segments.map((seg, idx) =>
        seg.type === 'latex' ? (
          <BlockMath key={idx}>{seg.value}</BlockMath>
        ) : (
          <span key={idx}>{seg.value}</span>
        )
      )}
    </div>
  );
};

export default LatexRender;
