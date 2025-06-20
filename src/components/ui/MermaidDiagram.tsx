// MermaidDiagram.tsx
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}
 const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    
    const initializeAndRender = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'neutral',
          fontFamily: 'inherit'
        });

        if (containerRef.current) {
          const { svg } = await mermaid.render(
            `mermaid-${Math.random().toString(36).substr(2, 9)}`, 
            chart
          );
          if (isMounted) setSvg(svg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) setError('Error rendering diagram');
      }
    };

    initializeAndRender();
    
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) return <div className="text-red-500 p-2">{error}</div>;

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />;
};
export default MermaidDiagram;
