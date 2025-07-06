export function extractMermaidCode(text: string): string | undefined {
        // Match code blocks like ```mermaid ... ```
        const mermaidRegex = /```mermaid\s*([\s\S]*?)```/m;
        const match = text.match(mermaidRegex);
        return match ? match[1].trim() : undefined;
    }

export function removeMermaidCode(text: string): string {
        // Regex to match mermaid code blocks
        const pattern =  /```mermaid\s*([\s\S]*?)```/m;
        // Remove mermaid code blocks and trim whitespace
        return text.replace(pattern, '').trim();
}

export function splitTextAndMermaidBlocks(text: string): Array<{ type: 'text' | 'mermaid', content: string }> {
  const mermaidRegex = /```mermaid\s*([\s\S]*?)```/gm;
  let lastIndex = 0;
  let match;
  const segments: Array<{ type: 'text' | 'mermaid', content: string }> = [];

  while ((match = mermaidRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'mermaid',
      content: match[1].trim(),
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }
  return segments;
}