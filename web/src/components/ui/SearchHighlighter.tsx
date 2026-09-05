import React, { useState, useEffect, useRef } from 'react';

interface SearchHighlighterProps {
  onSearch: (query: string) => void;
  suggestions?: string[];
  placeholder?: string;
}

export const SearchHighlighter: React.FC<SearchHighlighterProps> = ({ 
  onSearch, 
  suggestions = [], 
  placeholder = 'Search...' 
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 && suggestions.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(query.toLowerCase()) && s !== query
  );

  return (
    <div className="search-container" ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: '12px', color: '#666' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length > 0 && filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: '24px',
            border: '1px solid #e0e0e0',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: '#f5f5f5',
            transition: 'background-color 0.2s, box-shadow 0.2s'
          }}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 100,
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          {filteredSuggestions.map((suggestion, idx) => (
            <div 
              key={idx}
              onClick={() => selectSuggestion(suggestion)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: idx < filteredSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ marginRight: '12px', color: '#999' }}>⏱️</span>
              <HighlightedText text={suggestion} query={query} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HighlightedText: React.FC<{text: string, query: string}> = ({ text, query }) => {
  if (!query) return <span>{text}</span>;

  // Escape regex characters in query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? 
          <mark key={index} style={{ backgroundColor: '#fff59d', padding: 0, fontWeight: 'bold' }}>{part}</mark> : 
          <span key={index}>{part}</span>
      )}
    </span>
  );
};
