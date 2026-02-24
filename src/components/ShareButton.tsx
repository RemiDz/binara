'use client';

import { useCallback, useState } from 'react';
import { useProContext } from '@/context/ProContext';
import { useAppDispatch } from '@/context/AppContext';
import { shareSession, type SharedSession } from '@/lib/sharing';
import { trackEvent } from '@/lib/analytics';

interface ShareButtonProps {
  session: SharedSession;
  sessionName: string;
}

export default function ShareButton({ session, sessionName }: ShareButtonProps) {
  const { isPro } = useProContext();
  const dispatch = useAppDispatch();
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);

    const success = await shareSession(session, sessionName);
    if (success) {
      trackEvent('Share', { mode: session.type });
      dispatch({ type: 'SET_TOAST', payload: 'Link copied!' });
    } else {
      dispatch({ type: 'SET_TOAST', payload: 'Could not share session' });
    }

    setSharing(false);
  }, [session, sessionName, sharing, dispatch]);

  if (!isPro) return null;

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="w-10 h-10 flex items-center justify-center rounded-full glass-hover transition-colors disabled:opacity-50"
      style={{ color: 'var(--text-secondary)' }}
      aria-label="Share session"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    </button>
  );
}
