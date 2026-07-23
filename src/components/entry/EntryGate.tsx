import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import EntryScreen from './EntryScreen';

export const ENTRY_STORAGE_KEY = 'laminin-entry-verified';

const LEGAL_PATHS = [
  '/privacy',
  '/disclaimer',
  '/terms-and-conditions',
  '/guarantee',
  '/shipping',
] as const;

function isLegalPath(pathname: string): boolean {
  return LEGAL_PATHS.includes(pathname as (typeof LEGAL_PATHS)[number]);
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function readEntryVerified(): boolean {
  try {
    return localStorage.getItem(ENTRY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function EntryGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  // Sync-read so returning visitors never flash a blank carbon screen.
  const [verified, setVerified] = useState(readEntryVerified);

  const handleComplete = () => {
    try {
      localStorage.setItem(ENTRY_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVerified(true);
  };

  // Admin paths bypass the entry gate entirely
  if (isAdminPath(location.pathname)) {
    return <>{children}</>;
  }

  const allowLegalWhileUnverified = !verified && isLegalPath(location.pathname);

  if (!verified && !allowLegalWhileUnverified) {
    return <EntryScreen onComplete={handleComplete} />;
  }

  return <>{children}</>;
}
