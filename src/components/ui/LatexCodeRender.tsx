import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface LatexRenderProps {
  content: string;
}

const LatexRender: React.FC<LatexRenderProps> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkMath]}
    rehypePlugins={[rehypeKatex]}
    components={{
      text({ children }) {
        return (
          <>
            {String(children).split('\n').map((line, i, arr) => (
              i < arr.length - 1 ? (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ) : (
                line
              )
            ))}
          </>
        );
      }
    }}
  >
    {content}
  </ReactMarkdown>
);

export default LatexRender;
