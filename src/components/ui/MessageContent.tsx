// MessageContent.tsx
import React from 'react';
import MermaidDiagram from './MermaidDiagram';
import LatexRender from './LatexCodeRender';
import {splitTextAndMermaidBlocks } from '../../utils/mermaidCodeUtils';
import {normalizeLaTeXDelimiters} from '../../utils/chatUtils'


interface MessageContentProps {
  content: string;
  }

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const cleaned = normalizeLaTeXDelimiters(content);
  const segments = splitTextAndMermaidBlocks(cleaned);

  return (
    <div>
      {segments.map((segment, index) =>
        segment.type === 'text'
          ? segment.content
              .split(/\n{2,}/)
              .filter(para => para.trim().length > 0)
              .map((para, pidx) => (
                 <div className="message-bubble" key={`${index}-${pidx}`}>
                <div className="message-text latex-equation-container">
                  <LatexRender content={para.trim()} />
                </div>
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