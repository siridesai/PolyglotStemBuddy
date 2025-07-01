// MessageContent.tsx
import React from 'react';
import MermaidDiagram from './MermaidDiagram';
import LatexRender from './LatexCodeRender';

interface MessageContentProps {
  content: string;
  }

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  // Split content by Mermaid code blocks
  const segments: { type: 'text' | 'mermaid'; content: string }[] = [];
  const mermaidRegex = /```mermaid\s*([\s\S]*?)```/gm;

  let lastIndex = 0;
  let match;

  while ((match = mermaidRegex.exec(content)) !== null) {
    // Text before the Mermaid block
    if (match.index > lastIndex) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex, match.index)
    });
  }

  // Mermaid diagram
  segments.push({
    type: 'mermaid',
    content: match[1].trim()
  });

  lastIndex = match.index + match[0].length;
  }

// Remaining text after last Mermaid block
if (lastIndex < content.length) {
  segments.push({
    type: 'text',
    content: content.substring(lastIndex)
    });
  }

return (
  <div>
    {segments.map((segment, index) => (
      <div key={index}>
        {segment.type === 'text' ? (
          <LatexRender content={segment.content} />
        ) : (
          <div className="my-4 p-4 bg-white rounded-lg">
            <MermaidDiagram chart={segment.content} />
          </div>
        )}
      </div>
    ))}
  </div>
);
};

export default MessageContent;