/**
 * HybridPlaceSearch Component
 *
 * A search component that uses Google Places API for high-quality results
 * with Nominatim as a fallback. This provides the best of both worlds:
 * - Google Places: Accurate POI data, business info, ratings
 * - Nominatim: Free, privacy-friendly, offline-capable
 *
 * Cost Strategy:
 * - Uses session tokens to bundle autocomplete + details requests
 * - Falls back to Nominatim when Google API is unavailable
 * - Caches results to reduce API calls
 *
 * Features:
 * - Debounced search (300ms delay)
 * - Autocomplete suggestions with rich metadata
 * - Recent searches (localStorage)
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Loading and error states
 * - Provider indicator (Google/OSM)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MapPin, Clock, Loader2, Navigation, Star, DollarSign } from 'lucide-react';
import {
  isGooglePlacesAvailable,
  getAutocompleteSuggestions,
  getPlaceDetails,
  resetSessionToken,
  isGooglePlaceId,
  type GooglePlacePrediction,
  type GooglePlaceDetails,
} from '../services/GooglePlacesService';
import { searchPlaces, type SearchSuggestion } from '../services/GeocodingService';

// Unified suggestion interface
interface UnifiedSuggestion {
  placeId: string;
  displayName: string;
  secondaryText?: string;
  lat: number;
  lng: number;
  type: string;
  source: 'google' | 'nominatim';
  rating?: number;
  priceLevel?: number;
  needsResolution?: boolean; // True for Google results that need details fetch
}

interface HybridPlaceSearchProps {
  onSelect: (place: UnifiedSuggestion) => void;
  placeholder?: string;
  className?: string;
  nearLocation?: { lat: number; lng: number };
  preferGoogle?: boolean; // Force Google even if not recommended
}

// Constants
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = 'tripflow-hybrid-recent-searches';
const DEBOUNCE_DELAY = 300;

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

export function HybridPlaceSearch({
  onSelect,
  placeholder = 'Search for a place...',
  className = '',
  nearLocation,
  preferGoogle = true,
}: HybridPlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UnifiedSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<UnifiedSuggestion[]>([]);
  const [currentProvider, setCurrentProvider] = useState<'google' | 'nominatim'>('nominatim');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, DEBOUNCE_DELAY);

  // Determine if Google Places is available
  const googleAvailable = isGooglePlacesAvailable();

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
  const saveRecentSearch = useCallback((place: UnifiedSuggestion) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((p) => p.placeId !== place.placeId);
      const updated = [place, ...filtered].slice(0, MAX_RECENT_SEARCHES);
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
        // Try Google Places first if available and preferred
        if (googleAvailable && preferGoogle) {
          const googleResults = await getAutocompleteSuggestions(debouncedQuery, {
            location: nearLocation,
          });

          if (googleResults.length > 0) {
            setCurrentProvider('google');
            setSuggestions(
              googleResults.slice(0, 6).map((p) => ({
                placeId: p.placeId,
                displayName: p.mainText,
                secondaryText: p.secondaryText,
                lat: 0, // Will be resolved on selection
                lng: 0,
                type: p.types[0] || 'place',
                source: 'google' as const,
                needsResolution: true,
              }))
            );
            setSelectedIndex(-1);
            setIsLoading(false);
            return;
          }
        }

        // Fall back to Nominatim
        setCurrentProvider('nominatim');
        const nominatimResults = await searchPlaces(debouncedQuery, {
          limit: 6,
          near: nearLocation,
        });

        setSuggestions(
          nominatimResults.map((p) => ({
            placeId: p.placeId,
            displayName: p.displayName,
            lat: p.lat,
            lng: p.lng,
            type: p.type,
            source: 'nominatim' as const,
            needsResolution: false,
          }))
        );
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, nearLocation, googleAvailable, preferGoogle]);

  // Handle selection - resolve coordinates if needed
  const handleSelect = useCallback(
    async (place: UnifiedSuggestion) => {
      // If this is a Google result, we need to fetch details for coordinates
      if (place.needsResolution && isGooglePlaceId(place.placeId)) {
        setIsResolvingPlace(true);
        try {
          const details = await getPlaceDetails(place.placeId);
          if (details) {
            const resolvedPlace: UnifiedSuggestion = {
              ...place,
              lat: details.lat,
              lng: details.lng,
              rating: details.rating,
              priceLevel: details.priceLevel,
              needsResolution: false,
            };
            setQuery('');
            setSuggestions([]);
            setIsOpen(false);
            saveRecentSearch(resolvedPlace);
            onSelect(resolvedPlace);
          } else {
            console.error('Failed to resolve Google place');
          }
        } catch (error) {
          console.error('Failed to get place details:', error);
        } finally {
          setIsResolvingPlace(false);
          resetSessionToken();
        }
      } else {
        // Nominatim result or already resolved
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        saveRecentSearch(place);
        onSelect(place);
      }
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
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Truncate display name for cleaner UI
  const truncateDisplayName = (name: string, maxLength: number = 50): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + '...';
  };

  // Render price level
  const renderPriceLevel = (level?: number) => {
    if (level === undefined) return null;
    return (
      <span className="flex text-green-600 dark:text-green-400">
        {Array.from({ length: level }, (_, i) => (
          <DollarSign key={i} className="w-3 h-3" />
        ))}
      </span>
    );
  };

  // Render rating
  const renderRating = (rating?: number) => {
    if (rating === undefined) return null;
    return (
      <span className="flex items-center gap-0.5 text-amber-500">
        <Star className="w-3 h-3 fill-current" />
        <span className="text-[10px]">{rating.toFixed(1)}</span>
      </span>
    );
  };

  // Show dropdown when there's content to show
  const shouldShowDropdown =
    isOpen && (suggestions.length > 0 || (query.length === 0 && recentSearches.length > 0));

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading || isResolvingPlace ? (
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
          disabled={isResolvingPlace}
          className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-lg disabled:opacity-50"
        />

        {query && !isResolvingPlace && (
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

          {/* Search results header with provider indicator */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Navigation className="w-3 h-3" /> Search Results
              </p>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  currentProvider === 'google'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {currentProvider === 'google' ? 'Google Places' : 'OpenStreetMap'}
              </span>
            </div>
          )}

          {/* Items list */}
          <div className="py-2">
            {(suggestions.length > 0 ? suggestions : recentSearches).map((place, index) => (
              <button
                key={place.placeId}
                onClick={() => handleSelect(place)}
                disabled={isResolvingPlace}
                className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left disabled:opacity-50 ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    place.source === 'google'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {truncateDisplayName(place.displayName)}
                  </p>
                  {place.secondaryText && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {place.secondaryText}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {formatPlaceType(place.type)}
                    </p>
                    {renderRating(place.rating)}
                    {renderPriceLevel(place.priceLevel)}
                  </div>
                </div>

                {index === selectedIndex && (
                  <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex-shrink-0">
                    Enter
                  </div>
                )}
              </button>
            ))}
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

          {/* Provider attribution */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
            <p className="text-[9px] text-slate-400 text-center">
              {currentProvider === 'google' ? (
                <>
                  Powered by{' '}
                  <span className="font-medium text-blue-500">Google Places</span>
                </>
              ) : (
                <>
                  Powered by{' '}
                  <a
                    href="https://www.openstreetmap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    OpenStreetMap
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HybridPlaceSearch;
