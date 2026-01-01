/**
 * PlaceSearch Component
 *
 * Provides a search input with autocomplete suggestions for finding places.
 * Uses Nominatim geocoding with debounced input and keyboard navigation.
 *
 * Features:
 * - Debounced search (300ms delay)
 * - Autocomplete suggestions
 * - Recent searches (localStorage)
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Loading and error states
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MapPin, Clock, Loader2, Navigation } from 'lucide-react';
import { searchPlaces, SearchSuggestion } from '../services/GeocodingService';

interface PlaceSearchProps {
  onSelect: (place: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  nearLocation?: { lat: number; lng: number };
}

// Max recent searches to store
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = 'tripflow-recent-searches';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function PlaceSearch({
  onSelect,
  placeholder = 'Search for a place...',
  className = '',
  nearLocation,
}: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((place: SearchSuggestion) => {
    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((p) => p.placeId !== place.placeId);
      // Add to front
      const updated = [place, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      // Persist
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  }, []);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const results = await searchPlaces(debouncedQuery, {
          limit: 6,
          near: nearLocation,
        });
        setSuggestions(results);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, nearLocation]);

  // Handle selection
  const handleSelect = useCallback(
    (place: SearchSuggestion) => {
      setQuery('');
      setSuggestions([]);
      setIsOpen(false);
      saveRecentSearch(place);
      onSelect(place);
    },
    [onSelect, saveRecentSearch]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = suggestions.length > 0 ? suggestions : recentSearches;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [suggestions, recentSearches, selectedIndex, handleSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Format place type for display
  const formatPlaceType = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Truncate display name for cleaner UI
  const truncateDisplayName = (name: string, maxLength: number = 60): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + '...';
  };

  // Show dropdown when there's content to show
  const shouldShowDropdown =
    isOpen && (suggestions.length > 0 || (query.length === 0 && recentSearches.length > 0));

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-lg"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto"
        >
          {/* Recent searches header */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Recent Searches
              </p>
            </div>
          )}

          {/* Search results header */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Navigation className="w-3 h-3" /> Search Results
              </p>
            </div>
          )}

          {/* Items list */}
          <div className="py-2">
            {(suggestions.length > 0 ? suggestions : recentSearches).map(
              (place, index) => (
                <button
                  key={place.placeId}
                  onClick={() => handleSelect(place)}
                  className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      suggestions.length > 0
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {truncateDisplayName(place.displayName, 50)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {formatPlaceType(place.type)}
                    </p>
                  </div>

                  {index === selectedIndex && (
                    <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex-shrink-0">
                      Enter
                    </div>
                  )}
                </button>
              )
            )}
          </div>

          {/* No results */}
          {suggestions.length === 0 && query.length >= 2 && !isLoading && (
            <div className="px-4 py-8 text-center text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No places found for "{query}"</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && query.length >= 2 && (
            <div className="px-4 py-6 text-center text-slate-400">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p className="text-xs">Searching...</p>
            </div>
          )}

          {/* Powered by OSM */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
            <p className="text-[9px] text-slate-400 text-center">
              Powered by{' '}
              <a
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenStreetMap
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceSearch;
