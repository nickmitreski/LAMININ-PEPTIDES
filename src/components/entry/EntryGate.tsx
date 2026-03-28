import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import EntryScreen from './EntryScreen';

export const ENTRY_STORAGE_KEY = 'laminin-entry-verified';

const LEGAL_PATHS = ['/privacy', '/terms-and-conditions', '/guarantee'] as const;

function isLegalPath(pathname: string): boolean {
  return LEGAL_PATHS.includes(pathname as (typeof LEGAL_PATHS)[number]);
}

export default function EntryGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [verified, setVerified] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setVerified(localStorage.getItem(ENTRY_STORAGE_KEY) === '1');
    } catch {
      setVerified(false);
    }
    setHydrated(true);
  }, []);

  const handleComplete = () => {
    try {
      localStorage.setItem(ENTRY_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVerified(true);
  };

  if (!hydrated) {
    return (
      <div
        className="min-h-screen bg-carbon-900"
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  const allowLegalWhileUnverified = !verified && isLegalPath(location.pathname);

  if (!verified && !allowLegalWhileUnverified) {
    return <EntryScreen onComplete={handleComplete} />;
  }

  return <>{children}</>;
}
