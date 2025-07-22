// Route protection utilities

/**
 * Check if user is trying to access protected routes directly
 */
export const checkDirectAccess = (): boolean => {
  // Check if user came from a direct URL access (no referrer or external referrer)
  const referrer = document.referrer;
  const currentDomain = window.location.origin;
  
  // If no referrer or referrer is from external domain, it's likely direct access
  if (!referrer || !referrer.startsWith(currentDomain)) {
    return true;
  }
  
  return false;
};

/**
 * Store current path for redirect after login
 */
export const storeRedirectPath = () => {
  const currentPath = window.location.pathname + window.location.search;
  if (currentPath !== '/' && currentPath !== '/login') {
    sessionStorage.setItem('redirectAfterLogin', currentPath);
  }
};

/**
 * Get and clear stored redirect path
 */
export const getAndClearRedirectPath = (): string | null => {
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  if (redirectPath) {
    sessionStorage.removeItem('redirectAfterLogin');
    return redirectPath;
  }
  return null;
};

/**
 * Protected route configuration
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/calendar',
  '/settings',
  '/profile',
  '/statistics',
  '/medical-records',
  '/self-care',
  '/pregnancy-support',
  '/partner-connection'
];

/**
 * Check if current route requires authentication
 */
export const isProtectedRoute = (path: string = window.location.pathname): boolean => {
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
};

/**
 * Redirect to login with current path stored
 */
export const redirectToLogin = () => {
  storeRedirectPath();
  window.location.href = '/';
};

/**
 * Handle unauthorized access
 */
export const handleUnauthorizedAccess = () => {
  console.warn('Unauthorized access detected, redirecting to login');
  redirectToLogin();
};