import React, { useState } from 'react';
import { X, Download, Mail, Check } from 'lucide-react';
import { Message, ChildSettings, MessageMedia } from '../../types';
import Button from './Button';
import { getTranslation } from '../../data/translations';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import Diagram from './Diagram';

interface SummaryModalProps {
  onClose: () => void;
  messages: Message[];
  settings: ChildSettings;
  topic: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#4B5563'
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 10
  },
  section: {
    marginBottom: 20
  },
  image: {
    marginVertical: 10,
    maxWidth: '100%',
    objectFit: 'contain'
  },
  caption: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5
  },
  mediaContainer: {
    marginVertical: 15,
    alignItems: 'center'
  }
});

const LessonPDF = ({ messages, topic }: { messages: Message[]; topic: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{topic} - Learning Summary</Text>
      
      {messages
        .filter(m => m.type === 'assistant')
        .map((message, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.content}>• {message.content}</Text>
            
            {message.media && message.media.map((media, mediaIndex) => (
              <View key={mediaIndex} style={styles.mediaContainer}>
                {media.type === 'image' && media.url && (
                  <>
                    <Image src={media.url} style={styles.image} />
                    {media.caption && <Text style={styles.caption}>{media.caption}</Text>}
                  </>
                )}
                {/* For diagrams, we'll skip rendering them in the PDF for now */}
                {media.caption && <Text style={styles.caption}>{media.caption}</Text>}
              </View>
            ))}
          </View>
        ))}
    </Page>
  </Document>
);

const SummaryModal: React.FC<SummaryModalProps> = ({ onClose, messages, settings, topic }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the email through a backend service
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-4">
                {messages
                  .filter(m => m.type === 'assistant')
                  .map((message, index) => (
                    <div key={index}>
                      <p className="text-indigo-700">• {message.content}</p>
                      {message.media && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {message.media.map((media, mediaIndex) => (
                            <div key={mediaIndex} className="relative">
                              {media.type === 'image' && media.url && (
                                <img
                                  src={media.url}
                                  alt={media.caption || 'Learning material'}
                                  className="rounded-lg w-full h-auto"
                                />
                              )}
                              {media.type === 'diagram' && media.diagramData && (
                                <Diagram
                                  width={280}
                                  height={200}
                                  data={media.diagramData}
                                />
                              )}
                              {media.caption && (
                                <p className="text-sm text-gray-600 mt-1 text-center">
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
                  Download PDF
                </h3>
                <p className="text-gray-600 mb-4">
                  Save this lesson summary as a PDF file
                </p>
                <PDFDownloadLink
                  document={<LessonPDF messages={messages} topic={topic} />}
                  fileName={`${topic.toLowerCase().replace(/\s+/g, '-')}-summary.pdf`}
                >
                  {({ loading }) => (
                    <Button
                      onClick={() => {}}
                      variant="secondary"
                      size="medium"
                      disabled={loading}
                    >
                      {loading ? 'Preparing...' : 'Download Summary'}
                    </Button>
                  )}
                </PDFDownloadLink>
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