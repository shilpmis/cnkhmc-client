
import React, { createContext, useState,ReactNode } from 'react';

interface SearchContextType {
    activePage: 'students' | 'staff'|'admin-leave-management'|'fee'|undefined;
    setActivePage: (page: 'students' | 'staff'|'admin-leave-management'|'fee') => void;
  }

  export const SearchContext = createContext<SearchContextType | undefined>(undefined);

  interface SearchProviderProps {
    children: ReactNode;
  }
  
  export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
    const [activePage, setActivePage] = useState<'students'|'staff'|'admin-leave-management'|'fee'>();
  
    return (
      <SearchContext.Provider value={{ activePage, setActivePage }}>
        {children}
      </SearchContext.Provider>
    );
  };