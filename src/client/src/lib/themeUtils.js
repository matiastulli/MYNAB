/**
 * Theme utility functions for consistent theme handling across the app
 */

// Check if dark mode is currently active
export function isDarkModeActive() {
  if (typeof window === 'undefined') return false;
  
  // First check localStorage
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme === 'dark';
  }
  
  // Then check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  // Finally check HTML class
  return document.documentElement.classList.contains('dark');
}

// Toggle between light and dark themes
export function toggleTheme() {
  const currentlyDark = isDarkModeActive();
  const newMode = currentlyDark ? 'light' : 'dark';
  
  if (newMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Store in localStorage
  localStorage.setItem('theme', newMode);
  
  // Notify app of theme change via custom event
  window.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme: newMode } 
  }));
  
  return !currentlyDark;
}

// Set theme directly to light or dark
export function setTheme(mode) {
  if (mode !== 'dark' && mode !== 'light') {
    throw new Error('Theme must be "dark" or "light"');
  }
  
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  localStorage.setItem('theme', mode);
  
  window.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme: mode } 
  }));
}

// Listen for system preference changes
export function setupSystemPreferenceListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = () => {
    // Only follow system preference if user hasn't explicitly set a preference
    if (!localStorage.getItem('theme')) {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}
