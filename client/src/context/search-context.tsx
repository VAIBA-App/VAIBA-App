import { createContext, useContext, useState, ReactNode } from "react";

interface PlaceResult {
  name: string;
  industry?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  website?: string;
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SearchContextType {
  searchResults: PlaceResult[];
  setSearchResults: (results: PlaceResult[]) => void;
  selectedCustomers: Record<string, boolean>;
  setSelectedCustomers: (selected: Record<string, boolean>) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Record<string, boolean>>({});
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSetSearchResults = (results: PlaceResult[]) => {
    setSearchResults(results);
    // Reset selections when new search results come in
    setSelectedCustomers({});
  };

  return (
    <SearchContext.Provider
      value={{
        searchResults,
        setSearchResults: handleSetSearchResults,
        selectedCustomers,
        setSelectedCustomers,
        sortDirection,
        setSortDirection,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}