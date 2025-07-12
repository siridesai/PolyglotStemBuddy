// MessageContent.tsx
import React from 'react';
import MermaidDiagram from './MermaidDiagram';
import LatexRender from './LatexCodeRender';
import {splitTextAndMermaidBlocks } from '../../utils/mermaidCodeUtils';


interface MessageContentProps {
  content: string;
  }

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const segments = splitTextAndMermaidBlocks(content);

  return (
    <div>
      {segments.map((segment, index) =>
        segment.type === 'text'
          ? segment.content
              .split(/\n{2,}/)
              .filter(para => para.trim().length > 0)
              .map((para, pidx) => (
                <div className="message-text" key={`${index}-${pidx}`}>
                  <LatexRender content={para.trim()} />
                </div>
              ))
          : (
            <div className="my-4 p-4 bg-gray-100 rounded-lg" key={index}>
              <MermaidDiagram chart={segment.content} />
            </div>
          )
      )}
    </div>
  );
};



export default MessageContent;