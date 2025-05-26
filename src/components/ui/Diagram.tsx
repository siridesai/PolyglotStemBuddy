import React, { useEffect, useRef } from 'react';

interface DiagramProps {
  width?: number;
  height?: number;
  data: {
    nodes: Array<{
      id: string;
      label: string;
      x: number;
      y: number;
      color?: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      label?: string;
    }>;
  };
}

const Diagram: React.FC<DiagramProps> = ({ 
  width = 400, 
  height = 300, 
  data 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color = '#4F46E5'
  ) => {
    // Draw circle
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.fill();

    // Draw label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Quicksand';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  };

  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    label?: string
  ) => {
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw label if provided
    if (label) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      ctx.fillStyle = '#64748B';
      ctx.font = '12px Quicksand';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, midX, midY - 10);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges first
    data.edges.forEach(edge => {
      const fromNode = data.nodes.find(n => n.id === edge.from);
      const toNode = data.nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        drawEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, edge.label);
      }
    });

    // Draw nodes on top
    data.nodes.forEach(node => {
      drawNode(ctx, node.x, node.y, node.label, node.color);
    });
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="bg-white rounded-lg shadow-sm"
    />
  );
};

export default Diagram;