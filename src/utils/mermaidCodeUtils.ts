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