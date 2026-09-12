/**
 * OmniTools — Supabase Client & Authentication Layer
 * Calm Blue Design System | Client SDK wrapper
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniSupabase = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Storage keys for custom or default Supabase configuration
  const CONFIG_STORAGE_KEY_URL = 'omnitools_supabase_url';
  const CONFIG_STORAGE_KEY_KEY = 'omnitools_supabase_anon_key';
  const USER_STORAGE_KEY = 'omnitools_auth_user';

  // Default project credentials placeholder (or user-provided via settings modal)
  const DEFAULT_CONFIG = {
    supabaseUrl: 'https://pwhjmythxdfidteoykpn.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3aGpteXRoeGRmaWR0ZW95a3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzg0NDcsImV4cCI6MjEwNDcxNDQ0N30.cX9eCLKDqTlLcf9I29ZQZ0SgHfnESiZdOHIltmK9UYM'
  };

  let supabaseClient = null;
  let authListeners = [];
  let currentUser = null;
  let currentSession = null;

  /**
   * Retrieves active Supabase configuration (stored or default)
   */
  function getConfig() {
    try {
      const storedUrl = localStorage.getItem(CONFIG_STORAGE_KEY_URL);
      const storedKey = localStorage.getItem(CONFIG_STORAGE_KEY_KEY);
      return {
        supabaseUrl: storedUrl && storedUrl.trim() !== '' ? storedUrl.trim() : DEFAULT_CONFIG.supabaseUrl,
        supabaseKey: storedKey && storedKey.trim() !== '' ? storedKey.trim() : DEFAULT_CONFIG.supabaseKey,
        isCustom: Boolean(storedUrl && storedKey)
      };
    } catch (e) {
      console.warn('[OmniSupabase] LocalStorage not accessible, using default credentials', e);
      return {
        supabaseUrl: DEFAULT_CONFIG.supabaseUrl,
        supabaseKey: DEFAULT_CONFIG.supabaseKey,
        isCustom: false
      };
    }
  }

  /**
   * Updates and saves Supabase configuration in localStorage
   */
  function saveConfig(url, anonKey) {
    if (!url || !anonKey) {
      throw new Error('Supabase URL and Anon Public Key are required.');
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = anonKey.trim();

    localStorage.setItem(CONFIG_STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(CONFIG_STORAGE_KEY_KEY, cleanKey);

    // Re-initialize client with new credentials
    initClient(cleanUrl, cleanKey);
    return { success: true, url: cleanUrl };
  }

  /**
   * Clears custom configuration to fallback defaults
   */
  function resetConfig() {
    localStorage.removeItem(CONFIG_STORAGE_KEY_URL);
    localStorage.removeItem(CONFIG_STORAGE_KEY_KEY);
    initClient(DEFAULT_CONFIG.supabaseUrl, DEFAULT_CONFIG.supabaseKey);
    return { success: true };
  }

  /**
   * Initializes the Supabase client instance using window.supabase
   */
  function initClient(url, key) {
    const config = (url && key) ? { supabaseUrl: url, supabaseKey: key } : getConfig();

    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
          }
        });

        // Setup auth state change subscriber
        supabaseClient.auth.onAuthStateChange(function (event, session) {
          currentSession = session;
          currentUser = session ? session.user : null;
          notifyListeners(event, session, currentUser);
        });

        // Eagerly check active session
        supabaseClient.auth.getSession().then(function (res) {
          if (res.data && res.data.session) {
            currentSession = res.data.session;
            currentUser = res.data.session.user;
            notifyListeners('INITIAL_SESSION', currentSession, currentUser);
          }
        }).catch(function (err) {
          console.warn('[OmniSupabase] Failed to restore session on init:', err);
        });

      } catch (err) {
        console.error('[OmniSupabase] Error initializing client:', err);
      }
    } else {
      console.warn('[OmniSupabase] Supabase JS SDK not loaded yet. Make sure to include @supabase/supabase-js.');
    }
    return supabaseClient;
  }

  /**
   * Checks if active configuration has valid real-world endpoints
   */
  function isConfigured() {
    const conf = getConfig();
    return Boolean(
      conf.supabaseUrl &&
      !conf.supabaseUrl.includes('xyzcompany.supabase.co') &&
      conf.supabaseKey &&
      !conf.supabaseKey.includes('placeholder')
    );
  }

  /**
   * Health-check connectivity to the Supabase backend
   */
  async function checkConnection() {
    const client = getClient();
    if (!client) {
      return { ok: false, message: 'Supabase client is not initialized.' };
    }
    try {
      // Test connectivity by pinging auth settings or health endpoint
      const conf = getConfig();
      const res = await fetch(`${conf.supabaseUrl}/auth/v1/settings`, {
        headers: {
          'apikey': conf.supabaseKey,
          'Authorization': `Bearer ${conf.supabaseKey}`
        }
      });
      if (res.ok) {
        return { ok: true, message: 'Connected to Supabase successfully!' };
      } else {
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data.msg || data.error_description || `Connection failed with status ${res.status}` };
      }
    } catch (err) {
      return { ok: false, message: err.message || 'Unable to connect to Supabase server. Check your project URL and internet connection.' };
    }
  }

  /**
   * Returns current Supabase client or initializes it
   */
  function getClient() {
    if (!supabaseClient) {
      initClient();
    }
    return supabaseClient;
  }

  /**
   * Subscribe to Auth State Changes
   */
  function onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      authListeners.push(callback);
      // Immediately invoke with current state if already loaded
      if (currentUser || currentSession) {
        try {
          callback('CURRENT_STATE', currentSession, currentUser);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return function unsubscribe() {
      authListeners = authListeners.filter(function (cb) { return cb !== callback; });
    };
  }

  function notifyListeners(event, session, user) {
    authListeners.forEach(function (listener) {
      try {
        listener(event, session, user);
      } catch (err) {
        console.error('[OmniSupabase] Listener error:', err);
      }
    });
  }

  /**
   * Authentication Actions
   */

  /**
   * Sign Up with Email and Password
   * @param {Object} param0
   * @param {string} param0.email
   * @param {string} param0.password
   * @param {string} [param0.fullName]
   */
  async function signUp({ email, password, fullName }) {
    const client = getClient();
    if (!client) throw new Error('Supabase client is not ready. Please verify connection.');

    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName ? fullName.trim() : email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || email)}`
        }
      }
    });

    if (error) throw error;

    // If session was created, sync profile
    if (data && data.user) {
      currentUser = data.user;
      currentSession = data.session;
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !data.session
    };
  }

  /**
   * Sign In with Email and Password
   * @param {Object} param0
   * @param {string} param0.email
   * @param {string} param0.password
   */
  async function signIn({ email, password }) {
    const client = getClient();
    if (!client) throw new Error('Supabase client is not ready. Please verify connection.');

    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) throw error;

    currentUser = data.user;
    currentSession = data.session;

    return {
      user: data.user,
      session: data.session
    };
  }

  /**
   * Sign Out current user
   */
  async function signOut() {
    const client = getClient();
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) console.warn('[OmniSupabase] SignOut error:', error);
    }
    currentUser = null;
    currentSession = null;
    notifyListeners('SIGNED_OUT', null, null);
    return { success: true };
  }

  /**
   * Send Password Reset Email
   * @param {string} email
   */
  async function resetPassword(email) {
    const client = getClient();
    if (!client) throw new Error('Supabase client is not ready.');

    if (!email) throw new Error('Please enter your email address.');

    const redirectUrl = window.location.origin + window.location.pathname;
    const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl
    });

    if (error) throw error;
    return { success: true, data };
  }

  /**
   * Update User Password
   * @param {string} newPassword
   */
  async function updatePassword(newPassword) {
    const client = getClient();
    if (!client) throw new Error('Supabase client is not ready.');

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const { data, error } = await client.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true, user: data.user };
  }

  /**
   * Get Current Authenticated User & Session
   */
  async function getUser() {
    if (currentUser) return currentUser;
    const client = getClient();
    if (!client) return null;
    try {
      const { data } = await client.auth.getUser();
      currentUser = data.user || null;
      return currentUser;
    } catch (e) {
      return null;
    }
  }

  async function getSession() {
    if (currentSession) return currentSession;
    const client = getClient();
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      currentSession = data.session || null;
      return currentSession;
    } catch (e) {
      return null;
    }
  }

  /**
   * Profile Operations
   */
  async function getProfile(userId) {
    const client = getClient();
    if (!client) return null;

    const uid = userId || (currentUser ? currentUser.id : null);
    if (!uid) return null;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[OmniSupabase] Failed to fetch profile:', error);
      }
      return data || null;
    } catch (e) {
      return null;
    }
  }

  async function updateProfile(userId, updates) {
    const client = getClient();
    if (!client) throw new Error('Supabase client is not ready.');

    const uid = userId || (currentUser ? currentUser.id : null);
    if (!uid) throw new Error('User is not authenticated.');

    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update auth metadata if full_name is present
    if (updates.full_name) {
      try {
        await client.auth.updateUser({
          data: {
            full_name: updates.full_name,
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updates.full_name)}`
          }
        });
      } catch (err) {
        console.warn('[OmniSupabase] Could not sync user metadata:', err);
      }
    }

    const { data, error } = await client
      .from('profiles')
      .upsert({ id: uid, ...payload })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Activity & Tool History Logging
   * Automatically saves tool executions to Supabase if authenticated
   */
  async function logToolActivity(toolName, actionType, metadata) {
    const client = getClient();
    const user = await getUser();
    if (!client || !user) {
      // Quietly return when not signed in
      return null;
    }

    try {
      const payload = {
        user_id: user.id,
        tool_name: toolName,
        action_type: actionType,
        meta_data: metadata || {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('tool_history')
        .insert([payload])
        .select();

      if (error) {
        console.warn('[OmniSupabase] Could not log tool history:', error.message);
        return null;
      }
      return data ? data[0] : null;
    } catch (err) {
      console.warn('[OmniSupabase] Exception logging tool history:', err);
      return null;
    }
  }

  /**
   * Fetch saved user history for a specific tool or workspace
   */
  async function getUserHistory(toolName, limit = 20) {
    const client = getClient();
    const user = await getUser();
    if (!client || !user) return [];

    try {
      let query = client
        .from('tool_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (toolName) {
        query = query.eq('tool_name', toolName);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[OmniSupabase] Could not fetch tool history:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Helper to check if URL contains password recovery hash
   */
  function isRecoveryUrl() {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return hash.includes('type=recovery') || search.includes('type=recovery');
  }

  // Auto initialize on script load if window is ready
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        initClient();
      });
    } else {
      initClient();
    }
  }

  return {
    init: initClient,
    getConfig: getConfig,
    saveConfig: saveConfig,
    resetConfig: resetConfig,
    isConfigured: isConfigured,
    checkConnection: checkConnection,
    getClient: getClient,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
    getUser: getUser,
    getSession: getSession,
    getProfile: getProfile,
    updateProfile: updateProfile,
    isRecoveryUrl: isRecoveryUrl,
    logToolActivity: logToolActivity,
    getUserHistory: getUserHistory,
    onAuthStateChange: onAuthStateChange
  };
}));
