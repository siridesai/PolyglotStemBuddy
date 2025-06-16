import React, { useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { getTranslation } from '../../data/translations';
import { ChildSettings } from '../../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Summary {
  title: string;
  summaryExplanation: string;
}

interface SummaryModalProps {
  onClose: () => void;
  settings: ChildSettings;
  summary: Summary | null; // Allow null in props
}

const cleanSummary = (raw: string | null): string => {
  if (!raw) return '';
  return raw
    .replace(/Ø<ß|Ø=Üd/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const sanitizeFilename = (name: string) =>
  name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_').slice(0, 50);

const SummaryModal: React.FC<SummaryModalProps> = ({
  onClose,
  settings,
  summary,
}) => {
  const summaryRef = useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    if (!summaryRef.current || !summary) return; // Add null check

    const pdfContent = summaryRef.current.cloneNode(true) as HTMLElement;
    pdfContent.style.fontSize = '14px';
    pdfContent.style.padding = '20px';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.width = '650px';
    document.body.appendChild(pdfContent);

    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 650,
    });
    document.body.removeChild(pdfContent);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Get today's date and format as YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    pdf.save(`${sanitizeFilename(summary.title)}-${formattedDate}-summary.pdf`);
  };

  // Handle null summary case
  if (!summary) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center text-red-500 py-8">
            {getTranslation(settings.language, 'noSummaryAvailable') || 'No summary available right now.'}
          </div>
        </div>
      </div>
    );
  }

  const cleanedSummary = cleanSummary(summary.summaryExplanation);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Summary
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div ref={summaryRef} className="pdf-content">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                {summary.title}
              </h3>
              {cleanedSummary && (
                <div
                  className="summary-content"
                  style={{
                    fontFamily: '"Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", Arial, Helvetica, sans-serif',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    color: '#1e293b',
                  }}
                  dangerouslySetInnerHTML={{ __html: cleanedSummary }}
                />
              )}
            </div>

            {cleanedSummary ? (
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                {getTranslation(settings.language, 'noSummaryAvailable') || 'No summary available right now.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
