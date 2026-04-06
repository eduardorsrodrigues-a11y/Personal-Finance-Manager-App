import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trackPageView } from '../utils/analytics';

export function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
  return null;
}
