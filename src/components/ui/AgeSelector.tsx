import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getTranslation } from '../../data/translations';

interface AgeGroup {
  label: string;
  range: string;
  minAge: number;
}

interface AgeSelectorProps {
  ageGroups: AgeGroup[];
  selectedAge: number | null;
  onSelectAge: (age: number) => void;
  language: string;
}

const AgeSelector: React.FC<AgeSelectorProps> = ({ 
  ageGroups, 
  selectedAge, 
  onSelectAge,
  language
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, age: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectAge(age);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectedGroup = ageGroups.find(group => group.minAge === selectedAge);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 flex items-center justify-between px-4 bg-white border-2 
                 border-indigo-100 rounded-xl hover:border-indigo-300 transition-all
                 duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-base truncate">
            {selectedGroup 
              ? selectedGroup.label
              : getTranslation(language, 'selectAgeGroup')}
            {selectedGroup && (
              <span className="text-gray-500 text-sm ml-2">
                ({selectedGroup.range})
              </span>
            )}
          </span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg 
                   border border-gray-200 overflow-hidden"
          style={{
            maxHeight: '240px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#94A3B8 #E2E8F0'
          }}
          role="listbox"
        >
          {ageGroups.map((group) => (
            <button
              key={group.range}
              onClick={() => {
                onSelectAge(group.minAge);
                setIsOpen(false);
              }}
              onKeyDown={(e) => handleKeyDown(e, group.minAge)}
              className={`
                w-full text-left px-4 py-3 hover:bg-gray-50 text-base
                transition-colors duration-150 outline-none
                ${group.minAge === selectedAge ? 'bg-indigo-50 text-indigo-700' : ''}
              `}
              role="option"
              aria-selected={group.minAge === selectedAge}
            >
              <div className="flex flex-col">
                <span className="font-medium">{group.label}</span>
                <span className="text-sm text-gray-500">{group.range}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgeSelector;