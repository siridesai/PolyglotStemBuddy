import React, { useState } from 'react';
import { X, Download, Mail, Check } from 'lucide-react';
import { Message, ChildSettings } from '../../types';
import Button from './Button';
import { getTranslation } from '../../data/translations';

interface SummaryModalProps {
  onClose: () => void;
  messages: Message[];
  settings: ChildSettings;
  topic: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ onClose, messages, settings, topic }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [diagramUrls, setDiagramUrls] = useState<{ [key: string]: string }>({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [summaryImage, setSummaryImage] = useState<string | null>(null);

  React.useEffect(() => {
    const generateDiagramImages = async () => {
      const urls: { [key: string]: string } = {};
      
      for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
        const message = messages[messageIndex];
        if (message.media) {
          for (let mediaIndex = 0; mediaIndex < message.media.length; mediaIndex++) {
            const media = message.media[mediaIndex];
            if (media.type === 'diagram' && media.diagramData) {
              const canvas = document.createElement('canvas');
              canvas.width = 560;
              canvas.height = 400;
              const ctx = canvas.getContext('2d');
              if (!ctx) continue;

              const scale = 2;

              const drawNode = (x: number, y: number, label: string, color = '#4F46E5') => {
                const radius = 30 * scale;
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(x * scale, y * scale, radius, 0, 2 * Math.PI);
                ctx.fill();

                ctx.fillStyle = '#FFFFFF';
                ctx.font = `${14 * scale}px Quicksand`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x * scale, y * scale);
              };

              const drawEdge = (fromX: number, fromY: number, toX: number, toY: number, label?: string) => {
                ctx.beginPath();
                ctx.strokeStyle = '#94A3B8';
                ctx.lineWidth = 2 * scale;
                ctx.moveTo(fromX * scale, fromY * scale);
                ctx.lineTo(toX * scale, toY * scale);
                ctx.stroke();

                if (label) {
                  const midX = (fromX + toX) / 2;
                  const midY = (fromY + toY) / 2;
                  ctx.fillStyle = '#64748B';
                  ctx.font = `${12 * scale}px Quicksand`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(label, midX * scale, midY * scale - 10 * scale);
                }
              };

              media.diagramData.edges.forEach(edge => {
                const fromNode = media.diagramData!.nodes.find(n => n.id === edge.from);
                const toNode = media.diagramData!.nodes.find(n => n.id === edge.to);
                if (fromNode && toNode) {
                  drawEdge(fromNode.x, fromNode.y, toNode.x, toNode.y, edge.label);
                }
              });

              media.diagramData.nodes.forEach(node => {
                drawNode(node.x, node.y, node.label, node.color);
              });

              urls[`${messageIndex}-${mediaIndex}`] = canvas.toDataURL('image/png');
            }
          }
        }
      }
      
      setDiagramUrls(urls);
      generateSummaryImage(urls);
    };

    generateDiagramImages();
  }, [messages, topic]);

  const generateSummaryImage = async (urls: { [key: string]: string }) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    // Set dimensions (16:9 aspect ratio)
    canvas.width = 1920;
    canvas.height = 1080;

    // Set background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add title
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 48px Quicksand';
    ctx.textAlign = 'center';
    ctx.fillText(`${topic} - Learning Summary`, canvas.width / 2, 80);

    let yOffset = 160;
    const margin = 60;
    const contentWidth = canvas.width - (margin * 2);

    // Add content
    const assistantMessages = messages.filter(m => m.type === 'assistant');
    for (const message of assistantMessages) {
      // Add message content
      ctx.font = '24px Quicksand';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';

      // Word wrap text
      const words = message.content.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > contentWidth) {
          ctx.fillText(line, margin, yOffset);
          line = word + ' ';
          yOffset += 40;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, margin, yOffset);
      yOffset += 60;

      // Add media
      if (message.media) {
        for (const [index, media] of message.media.entries()) {
          if (media.type === 'image' && media.url) {
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = media.url;
              });

              const aspectRatio = img.width / img.height;
              const maxWidth = contentWidth;
              const width = Math.min(maxWidth, img.width);
              const height = width / aspectRatio;

              ctx.drawImage(img, margin, yOffset, width, height);
              yOffset += height + 40;
            } catch (error) {
              console.error('Error loading image:', error);
            }
          } else if (media.type === 'diagram' && urls[`${index}-${index}`]) {
            const img = new Image();
            img.src = urls[`${index}-${index}`];
            await new Promise(resolve => {
              img.onload = resolve;
            });

            const aspectRatio = img.width / img.height;
            const maxWidth = contentWidth;
            const width = Math.min(maxWidth, img.width);
            const height = width / aspectRatio;

            ctx.drawImage(img, margin, yOffset, width, height);
            yOffset += height + 40;
          }
        }
      }
    }

    setSummaryImage(canvas.toDataURL('image/png'));
    setIsGenerating(false);
  };

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleDownload = () => {
    if (summaryImage) {
      const link = document.createElement('a');
      link.href = summaryImage;
      link.download = `${topic.toLowerCase().replace(/\s+/g, '-')}-summary.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {getTranslation(settings.language, 'lessonSummary')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-xl">
              <h3 className="font-semibold text-lg text-indigo-900 mb-3">
                {topic}
              </h3>
              <div className="space-y-6">
                {messages
                  .filter(m => m.type === 'assistant')
                  .map((message, index) => (
                    <div key={index} className="space-y-4">
                      <p className="text-indigo-700">• {message.content}</p>
                      {message.media && (
                        <div className="flex flex-col gap-6">
                          {message.media.map((media, mediaIndex) => (
                            <div key={mediaIndex} className="flex flex-col items-start">
                              {media.type === 'image' && media.url && (
                                <img
                                  src={media.url}
                                  alt={media.caption || 'Learning material'}
                                  className="rounded-lg max-w-full h-auto"
                                />
                              )}
                              {media.type === 'diagram' && media.diagramData && diagramUrls[`${index}-${mediaIndex}`] && (
                                <img
                                  src={diagramUrls[`${index}-${mediaIndex}`]}
                                  alt={media.caption || 'Diagram'}
                                  className="rounded-lg max-w-[560px] h-auto"
                                />
                              )}
                              {media.caption && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-gray-200 rounded-xl">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Summary
                </h3>
                <p className="text-gray-600 mb-4">
                  Save this lesson summary as an image
                </p>
                <Button
                  onClick={handleDownload}
                  variant="secondary"
                  size="medium"
                  disabled={isGenerating || !summaryImage}
                >
                  {isGenerating ? 'Preparing...' : 'Download Summary'}
                </Button>
              </div>

              <div className="p-4 border-2 border-gray-200 rounded-xl">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Share via Email
                </h3>
                <form onSubmit={handleEmailShare} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <Button
                    onClick={() => {}}
                    variant="primary"
                    size="medium"
                    className="w-full"
                  >
                    {emailSent ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Sent!
                      </span>
                    ) : (
                      'Share Summary'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;