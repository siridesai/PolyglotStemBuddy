import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ChildSettings, Message } from '../../utils/assistantMessageType.ts';
import { getTranslation } from '../../data/translations';
import Button from './Button'; 
import MermaidDiagram from './MermaidDiagram';
import LatexRender from './LatexCodeRender';
import { generateSummary } from '../../api/generateSummary';
import { extractMermaidCode, removeMermaidCode } from '../../utils/mermaidCodeUtils';
import { appInsights } from '../../utils/appInsightsForReact.ts';


interface Summary {
  title: string;
  summaryExplanation: string;
}

interface SummaryModalProps {
  onClose: () => void;
  settings: ChildSettings;
  messages: Message[];
  threadId: string;
  cookie: string;
  cancelAssistant?: (threadId: string, runId: string) => Promise<void>;
}

const sanitizeFilename = (name: string) =>
  name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_').slice(0, 50);

const SummaryModal: React.FC<SummaryModalProps> = ({
  onClose,
  settings,
  messages,
  threadId,
  cookie,
}) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);
  
  // Log App Insights page usage
  useEffect(() => {
    if (appInsights) {
      appInsights.trackPageView({ name: 'SummaryModal' });
    }
  }, );

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);


      try {
        const conversationText = messages
          .map(msg => {
            let text = `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
            if (msg.mermaidCode) {
              text += `\`\`mermaid\n${msg.mermaidCode}\n\`\`\``;
            }
            return text;
          })
          .join('\n');

          
        const result = await generateSummary(
          conversationText,
          threadId,
          settings.age,
          settings.language,
          cookie,
        );

        // Parse and validate response
        let data: Summary | null = null;
        try {
          data = typeof result === 'string' ? JSON.parse(result) : result;
        } catch {
          data = null;
        }

        if (data?.title && data?.summaryExplanation) {
          setSummary(data);
        } else {
          setError('Invalid summary format received');
        }
      } catch (err: any) {
        console.log('Summary generation failed:', err);
        if (err.name !== 'AbortError') {
          setError('Failed to generate summary. Please try again.');
          console.error('Summary generation failed:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    return () => {};
  }, [messages, threadId, settings, cookie]);

  const generatePdf = async () => {
    if (!summaryRef.current || !summary) return;

    const pdfContent = summaryRef.current.cloneNode(true) as HTMLElement;
    pdfContent.style.fontSize = '14px';
    pdfContent.style.padding = '20px';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.width = '650px';
    document.body.appendChild(pdfContent);

    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 650,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      pdf.save(`${sanitizeFilename(summary.title)}-${formattedDate}-summary.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  const mermaidCode = summary ? extractMermaidCode(summary.summaryExplanation) : undefined;
  const textWithoutMermaid = summary ? removeMermaidCode(summary.summaryExplanation) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {getTranslation(settings.language, 'lessonSummary') || 'Summary'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">
                {getTranslation(settings.language, 'generatingSummary') || 'Generating summary...'}
              </p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-8">
              {error}
            </div>
          )}

          {!loading && !error && summary && (
            <div className="space-y-6">
              <div ref={summaryRef} className="pdf-content">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {summary.title}
                </h3>
               
                {/* Text with LaTeX equations */}
                <div
                  className="summary-content"
                  style={{
                    fontFamily: '"Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", Arial, Helvetica, sans-serif',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    color: '#1e293b',
                  }}
                >
                  <LatexRender content={textWithoutMermaid} />
                   {/* Mermaid diagram */}
                {mermaidCode && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <MermaidDiagram chart={mermaidCode} />
                  </div>
                )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={generatePdf}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <span>{getTranslation(settings.language, 'downloadPDF') || 'Download PDF'}</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
