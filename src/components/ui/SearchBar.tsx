import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { getTranslation } from '../../data/translations';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  language: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  language,
  placeholder
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSearch();
      inputRef.current?.blur();
    }
  };

  const handleSearchClick = () => {
    if (value.trim()) {
      onSearch();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || getTranslation(language, 'searchPlaceholder')}
          className="w-full py-3 pl-12 pr-4 text-gray-700 bg-white border-2 border-indigo-100 rounded-xl 
                   focus:outline-none focus:border-indigo-500 transition-colors"
          style={{
            fontFamily: language === 'hi' ? "'Noto Sans Devanagari', system-ui, sans-serif" :
                       language === 'ar' ? "'Noto Sans Arabic', system-ui, sans-serif" :
                       language === 'zh' ? "'Noto Sans SC', system-ui, sans-serif" :
                       'inherit'
          }}
        />
        <button
          onClick={handleSearchClick}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                   hover:text-indigo-600 transition-colors p-1 rounded-full
                   hover:bg-indigo-50"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;