import React from 'react';
import { X } from 'lucide-react';
import { MessageMedia } from '../../types';
import Diagram from './Diagram';

interface ImageModalProps {
  media: MessageMedia;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ media, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-lg p-4">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        {media.type === 'image' && media.url && (
          <img
            src={media.url}
            alt={media.caption || 'Enlarged image'}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {media.type === 'diagram' && media.diagramData && (
          <div onClick={(e) => e.stopPropagation()}>
            <Diagram
              width={800}
              height={600}
              data={media.diagramData}
            />
          </div>
        )}

        {media.caption && (
          <div className="mt-4 text-center text-gray-700">
            {media.caption}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;