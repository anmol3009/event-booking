import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global component that scrolls the window to the top on every route change.
 * This should be placed inside the <Router> but outside of <Routes>.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
