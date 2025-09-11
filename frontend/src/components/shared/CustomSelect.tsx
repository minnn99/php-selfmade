import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  required?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "選択してください",
  className = "",
  error = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onBlur) {
          onBlur();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onBlur]);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    if (onBlur) {
      onBlur();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Handle option navigation with arrow keys
        const currentIndex = options.findIndex(opt => opt.value === value);
        let nextIndex;
        
        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        }
        
        if (options[nextIndex]) {
          onChange(options[nextIndex].value);
        }
      }
    }
  };

  const baseClasses = `
    relative w-full px-3 py-3 sm:px-4 border rounded-lg 
    focus:outline-none focus:ring-2 focus:border-transparent 
    transition-all duration-200 text-neutral-900 dark:text-white text-base 
    min-h-[44px] touch-manipulation cursor-pointer
    bg-white dark:bg-gray-700 flex items-center justify-between
    appearance-none
  `;

  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500' 
    : 'border-medical dark:border-gray-600 focus:ring-primary-500 hover:border-primary-300 dark:hover:border-gray-500';

  return (
    <div className="relative" ref={selectRef}>
      {/* Hidden select for form submission */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={() => {}} // Controlled by custom component
        className="sr-only"
        tabIndex={-1}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom select display */}
      <div
        className={`${baseClasses} ${errorClasses} ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-neutral-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Options dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-3 sm:px-4 cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors ${
                value === option.value ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium' : 'text-neutral-900 dark:text-white'
              }`}
              onClick={() => handleOptionClick(option.value)}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};