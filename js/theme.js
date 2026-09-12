/**
 * OmniTools — Dynamic Theme System & Persistence Controller
 * Calm Blue Design System
 * Supports: Light, Dark, and Calm themes with localStorage persistence & OS preference detection
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'omniToolsTheme';
  const VALID_THEMES = ['light', 'dark', 'calm', 'colorful'];

  /**
   * Resolve active theme (Saved preference -> OS preference -> Default Light)
   */
  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_THEMES.includes(saved)) {
        return saved === 'colorful' ? 'calm' : saved;
      }
    } catch (e) {
      console.warn('[OmniTools Theme] LocalStorage access blocked:', e);
    }

    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Apply Theme to Document Element
   * @param {string} themeName - 'light' | 'dark' | 'calm'
   * @param {boolean} userInitiated - whether triggered by explicit user selection
   */
  function applyTheme(themeName, userInitiated = false) {
    const nextTheme = (themeName === 'colorful' || themeName === 'calm') ? 'calm' : (themeName === 'dark' ? 'dark' : 'light');

    // Add temporary transition class for smooth theme shift without flash
    document.documentElement.classList.add('theme-switching');

    document.documentElement.dataset.theme = nextTheme;
    if (document.body) {
      document.body.classList.toggle('dark', nextTheme === 'dark');
    }

    if (userInitiated) {
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch (e) {
        console.warn('[OmniTools Theme] Could not save theme:', e);
      }
    }

    // Sync all theme dropdowns on the page
    const selects = document.querySelectorAll('#themeSelect, .theme-select');
    selects.forEach(select => {
      if (select) {
        // If option exists with value 'calm' or 'colorful'
        if (nextTheme === 'calm' && select.querySelector('option[value="colorful"]') && !select.querySelector('option[value="calm"]')) {
          select.value = 'colorful';
        } else {
          select.value = nextTheme;
        }
      }
    });

    // Remove transition lock after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-switching');
    }, 280);
  }

  // Initialize theme
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme, false);

  // DOM ready hook to attach event listeners and sync controls
  function initControls() {
    const selects = document.querySelectorAll('#themeSelect, .theme-select');
    selects.forEach(select => {
      select.value = document.documentElement.dataset.theme || initialTheme;
      select.removeEventListener('change', onThemeChange);
      select.addEventListener('change', onThemeChange);
    });

    // Listen for OS system theme changes if user hasn't explicitly set one
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        try {
          const userSaved = localStorage.getItem(STORAGE_KEY);
          if (!userSaved) {
            applyTheme(e.matches ? 'dark' : 'light', false);
          }
        } catch (err) {}
      };

      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (darkModeMediaQuery.addListener) {
        darkModeMediaQuery.addListener(handleSystemThemeChange);
      }
    }
  }

  function onThemeChange(e) {
    applyTheme(e.target.value, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initControls);
  } else {
    initControls();
  }

  // Expose global controller
  window.OmniTheme = {
    getTheme: () => document.documentElement.dataset.theme || 'light',
    setTheme: (t) => applyTheme(t, true),
    resetToSystem: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      applyTheme(getPreferredTheme(), false);
    }
  };
})();
