/**
 * OmniTools — Unified Authentication UI & Modal Controller
 * Calm Blue Design System
 */

(function () {
  'use strict';

  // Active tab in Auth Modal: 'signin' | 'signup' | 'forgot' | 'settings'
  let activeTab = 'signin';
  let isModalOpen = false;

  /**
   * Initializes the Auth UI components on DOM ready
   */
  function initAuthUI() {
    injectAuthModal();
    mountTopbarControls();
    subscribeToAuth();
  }

  /**
   * Mounts or updates the Topbar Authentication widget
   */
  function mountTopbarControls() {
    // Find target topbar container
    const targets = document.querySelectorAll('.header-actions, .tool-header-right, .omni-topbar-right');
    if (!targets.length) return;

    targets.forEach(container => {
      // Avoid duplicate containers
      let authContainer = container.querySelector('.omni-auth-container');
      if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.className = 'omni-auth-container';
        // Prepend before theme control or append
        container.prepend(authContainer);
      }
      renderTopbarState(authContainer);
    });
  }

  /**
   * Renders Signed-In or Signed-Out state inside the auth container
   */
  function renderTopbarState(container) {
    if (!window.OmniSupabase) return;

    window.OmniSupabase.getUser().then(user => {
      if (user) {
        // Signed-in state
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const email = user.email || '';
        const initial = name.charAt(0).toUpperCase();
        const avatarUrl = user.user_metadata?.avatar_url;

        container.innerHTML = `
          <button class="omni-auth-user-badge" id="omniUserBadge" aria-haspopup="true" aria-expanded="false" title="Account options">
            <div class="omni-auth-avatar">
              ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" onerror="this.remove()">` : initial}
            </div>
            <span class="omni-auth-user-name">${escapeHtml(name)}</span>
            <svg class="omni-auth-caret" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"/></svg>
          </button>
          <div class="omni-auth-dropdown" id="omniUserDropdown" role="menu">
            <div class="omni-dropdown-header">
              <div class="omni-dropdown-user-fullname">${escapeHtml(name)}</div>
              <div class="omni-dropdown-user-email">${escapeHtml(email)}</div>
            </div>
            <button class="omni-dropdown-item" id="omniBtnSettings" role="menuitem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Supabase Settings
            </button>
            <div class="omni-dropdown-divider"></div>
            <button class="omni-dropdown-item danger" id="omniBtnSignOut" role="menuitem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign out
            </button>
          </div>
        `;

        // Wire dropdown toggle
        const badge = container.querySelector('#omniUserBadge');
        const dropdown = container.querySelector('#omniUserDropdown');
        const btnSettings = container.querySelector('#omniBtnSettings');
        const btnSignOut = container.querySelector('#omniBtnSignOut');

        badge?.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = dropdown.classList.contains('open');
          closeAllDropdowns();
          if (!isOpen) {
            dropdown.classList.add('open');
            badge.setAttribute('aria-expanded', 'true');
          }
        });

        btnSettings?.addEventListener('click', () => {
          closeAllDropdowns();
          openAuthModal('settings');
        });

        btnSignOut?.addEventListener('click', async () => {
          closeAllDropdowns();
          await window.OmniSupabase.signOut();
        });

      } else {
        // Signed-out state
        container.innerHTML = `
          <button class="omni-auth-btn-signin" id="omniBtnSignIn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            Sign in
          </button>
        `;

        const btnSignIn = container.querySelector('#omniBtnSignIn');
        btnSignIn?.addEventListener('click', () => openAuthModal('signin'));
      }
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.omni-auth-dropdown').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.omni-auth-user-badge').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  document.addEventListener('click', () => closeAllDropdowns());

  /**
   * Injects the Auth Modal HTML into the document body
   */
  function injectAuthModal() {
    if (document.getElementById('omniAuthModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'omniAuthModalOverlay';
    overlay.className = 'omni-auth-modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="omni-auth-modal" role="dialog" aria-labelledby="omniAuthTitle" aria-modal="true">
        <div class="omni-auth-modal-head">
          <h2 class="omni-auth-modal-title" id="omniAuthTitle">
            <span class="omni-mark small" style="width:24px;height:24px;font-size:0.75rem;">O</span>
            OmniTools Account
            <span class="badge" id="omniConfigStatus">Supabase</span>
          </h2>
          <button class="omni-auth-modal-close" id="omniAuthClose" aria-label="Close modal">&times;</button>
        </div>

        <div class="omni-auth-tabs" role="tablist">
          <button class="omni-auth-tab active" data-tab="signin" role="tab">Sign In</button>
          <button class="omni-auth-tab" data-tab="signup" role="tab">Create Account</button>
          <button class="omni-auth-tab" data-tab="forgot" role="tab">Forgot Password</button>
          <button class="omni-auth-tab" data-tab="settings" role="tab">Settings</button>
        </div>

        <div class="omni-auth-modal-body">
          <div class="omni-auth-alert" id="omniAuthAlert" role="alert"></div>

          <!-- Tab: Sign In -->
          <form id="omniFormSignIn" class="omni-auth-tab-content">
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignInEmail">Email address</label>
              <input class="omni-form-input" type="email" id="omniSignInEmail" required placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="omni-form-group">
              <div class="omni-form-label">
                <label for="omniSignInPassword">Password</label>
                <a href="javascript:void(0)" id="omniLinkForgot">Forgot?</a>
              </div>
              <input class="omni-form-input" type="password" id="omniSignInPassword" required placeholder="••••••••" autocomplete="current-password">
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitSignIn">Sign In</button>
            <div class="omni-auth-footer-link">
              Don't have an account? <a href="javascript:void(0)" id="omniLinkToSignUp">Sign up</a>
            </div>
          </form>

          <!-- Tab: Sign Up -->
          <form id="omniFormSignUp" class="omni-auth-tab-content" style="display:none;">
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpName">Full name</label>
              <input class="omni-form-input" type="text" id="omniSignUpName" placeholder="Alex Morgan" autocomplete="name">
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpEmail">Email address</label>
              <input class="omni-form-input" type="email" id="omniSignUpEmail" required placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpPassword">Password</label>
              <input class="omni-form-input" type="password" id="omniSignUpPassword" required minlength="6" placeholder="Min 6 characters" autocomplete="new-password">
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpConfirm">Confirm password</label>
              <input class="omni-form-input" type="password" id="omniSignUpConfirm" required minlength="6" placeholder="Repeat password" autocomplete="new-password">
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitSignUp">Create Account</button>
            <div class="omni-auth-footer-link">
              Already have an account? <a href="javascript:void(0)" id="omniLinkToSignIn">Sign in</a>
            </div>
          </form>

          <!-- Tab: Forgot Password -->
          <form id="omniFormForgot" class="omni-auth-tab-content" style="display:none;">
            <p class="omni-form-help">Enter your registered email and we will send you a password recovery link.</p>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniForgotEmail">Email address</label>
              <input class="omni-form-input" type="email" id="omniForgotEmail" required placeholder="you@example.com">
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitForgot">Send Reset Link</button>
            <div class="omni-auth-footer-link">
              Remembered your password? <a href="javascript:void(0)" id="omniLinkBackSignIn">Back to Sign In</a>
            </div>
          </form>

          <!-- Tab: Supabase Settings -->
          <form id="omniFormSettings" class="omni-auth-tab-content" style="display:none;">
            <p class="omni-form-help">Configure your custom Supabase Project URL and Anon Public API Key. Stored securely in your browser's local storage.</p>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSettingUrl">Supabase Project URL</label>
              <input class="omni-form-input" type="url" id="omniSettingUrl" placeholder="https://xyzproject.supabase.co" required>
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSettingKey">Anon Public API Key</label>
              <input class="omni-form-input" type="password" id="omniSettingKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." required>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="submit" class="omni-auth-submit" style="flex:1;" id="omniBtnSaveSettings">Save & Connect</button>
              <button type="button" class="omni-btn-secondary" id="omniBtnTestConnection">Test</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Attach Event Handlers
    wireModalEvents(overlay);
  }

  /**
   * Sets up event listeners for the Auth Modal
   */
  function wireModalEvents(overlay) {
    const closeBtn = overlay.querySelector('#omniAuthClose');
    const tabButtons = overlay.querySelectorAll('.omni-auth-tab');

    // Close on X or outside click
    closeBtn?.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isModalOpen) closeAuthModal();
    });

    // Tab buttons
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // Switching links
    overlay.querySelector('#omniLinkForgot')?.addEventListener('click', () => switchTab('forgot'));
    overlay.querySelector('#omniLinkToSignUp')?.addEventListener('click', () => switchTab('signup'));
    overlay.querySelector('#omniLinkToSignIn')?.addEventListener('click', () => switchTab('signin'));
    overlay.querySelector('#omniLinkBackSignIn')?.addEventListener('click', () => switchTab('signin'));

    // Form: Sign In
    const formSignIn = overlay.querySelector('#omniFormSignIn');
    formSignIn?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = overlay.querySelector('#omniSignInEmail').value;
      const password = overlay.querySelector('#omniSignInPassword').value;
      const submitBtn = overlay.querySelector('#omniBtnSubmitSignIn');

      setLoading(submitBtn, true, 'Signing In...');
      hideAlert();

      try {
        await window.OmniSupabase.signIn({ email, password });
        showAlert('Signed in successfully!', 'success');
        setTimeout(() => closeAuthModal(), 600);
      } catch (err) {
        showAlert(err.message || 'Failed to sign in. Please verify your credentials.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Sign In');
      }
    });

    // Form: Sign Up
    const formSignUp = overlay.querySelector('#omniFormSignUp');
    formSignUp?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = overlay.querySelector('#omniSignUpName').value;
      const email = overlay.querySelector('#omniSignUpEmail').value;
      const password = overlay.querySelector('#omniSignUpPassword').value;
      const confirm = overlay.querySelector('#omniSignUpConfirm').value;
      const submitBtn = overlay.querySelector('#omniBtnSubmitSignUp');

      if (password !== confirm) {
        showAlert('Passwords do not match.', 'error');
        return;
      }

      setLoading(submitBtn, true, 'Creating account...');
      hideAlert();

      try {
        const res = await window.OmniSupabase.signUp({ email, password, fullName });
        if (res.needsEmailConfirmation) {
          showAlert('Account created! Please check your email inbox to confirm your address before signing in.', 'success');
        } else {
          showAlert('Account registered and signed in!', 'success');
          setTimeout(() => closeAuthModal(), 800);
        }
      } catch (err) {
        showAlert(err.message || 'Failed to create account.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Create Account');
      }
    });

    // Form: Forgot Password
    const formForgot = overlay.querySelector('#omniFormForgot');
    formForgot?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = overlay.querySelector('#omniForgotEmail').value;
      const submitBtn = overlay.querySelector('#omniBtnSubmitForgot');

      setLoading(submitBtn, true, 'Sending link...');
      hideAlert();

      try {
        await window.OmniSupabase.resetPassword(email);
        showAlert('Password recovery link dispatched! Check your email inbox.', 'success');
      } catch (err) {
        showAlert(err.message || 'Failed to send recovery email.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Send Reset Link');
      }
    });

    // Form: Settings
    const formSettings = overlay.querySelector('#omniFormSettings');
    formSettings?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = overlay.querySelector('#omniSettingUrl').value;
      const key = overlay.querySelector('#omniSettingKey').value;
      const submitBtn = overlay.querySelector('#omniBtnSaveSettings');

      try {
        window.OmniSupabase.saveConfig(url, key);
        showAlert('Supabase settings updated and connected!', 'success');
        updateConfigBadge();
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });

    // Test Connection Button
    const btnTest = overlay.querySelector('#omniBtnTestConnection');
    btnTest?.addEventListener('click', async () => {
      const url = overlay.querySelector('#omniSettingUrl').value;
      const key = overlay.querySelector('#omniSettingKey').value;
      if (url && key) {
        window.OmniSupabase.saveConfig(url, key);
      }
      btnTest.innerText = 'Testing...';
      const result = await window.OmniSupabase.checkConnection();
      btnTest.innerText = 'Test';
      showAlert(result.message, result.ok ? 'success' : 'error');
    });
  }

  /**
   * Switches modal tabs
   */
  function switchTab(tabName) {
    activeTab = tabName;
    const overlay = document.getElementById('omniAuthModalOverlay');
    if (!overlay) return;

    hideAlert();

    // Update active tab button
    overlay.querySelectorAll('.omni-auth-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });

    // Toggle forms
    const forms = {
      signin: overlay.querySelector('#omniFormSignIn'),
      signup: overlay.querySelector('#omniFormSignUp'),
      forgot: overlay.querySelector('#omniFormForgot'),
      settings: overlay.querySelector('#omniFormSettings')
    };

    Object.keys(forms).forEach(key => {
      if (forms[key]) {
        forms[key].style.display = (key === tabName) ? 'block' : 'none';
      }
    });

    // Pre-populate settings form when opening settings tab
    if (tabName === 'settings' && window.OmniSupabase) {
      const conf = window.OmniSupabase.getConfig();
      const urlInput = overlay.querySelector('#omniSettingUrl');
      const keyInput = overlay.querySelector('#omniSettingKey');
      if (urlInput) urlInput.value = conf.supabaseUrl.includes('xyzcompany') ? '' : conf.supabaseUrl;
      if (keyInput) keyInput.value = conf.supabaseKey.includes('placeholder') ? '' : conf.supabaseKey;
    }
  }

  function openAuthModal(initialTab = 'signin') {
    const overlay = document.getElementById('omniAuthModalOverlay');
    if (!overlay) return;

    switchTab(initialTab);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    isModalOpen = true;
    updateConfigBadge();

    // Focus initial input
    setTimeout(() => {
      const activeForm = overlay.querySelector(`.omni-auth-tab-content[style*="display: block"], #omniFormSignIn`);
      const input = activeForm?.querySelector('input');
      input?.focus();
    }, 150);
  }

  function closeAuthModal() {
    const overlay = document.getElementById('omniAuthModalOverlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    isModalOpen = false;
    hideAlert();
  }

  function showAlert(msg, type = 'info') {
    const alert = document.getElementById('omniAuthAlert');
    if (!alert) return;

    alert.className = `omni-auth-alert ${type} visible`;
    alert.textContent = msg;
  }

  function hideAlert() {
    const alert = document.getElementById('omniAuthAlert');
    if (!alert) return;
    alert.className = 'omni-auth-alert';
    alert.textContent = '';
  }

  function setLoading(button, loading, originalText) {
    if (!button) return;
    button.disabled = loading;
    if (loading) {
      button.innerHTML = `<span class="omni-spinner" aria-hidden="true"></span> ${originalText}`;
    } else {
      button.innerText = originalText;
    }
  }

  function updateConfigBadge() {
    const badge = document.getElementById('omniConfigStatus');
    if (badge && window.OmniSupabase) {
      const isCustom = window.OmniSupabase.isConfigured();
      badge.textContent = isCustom ? 'Connected' : 'Setup Required';
      badge.style.background = isCustom ? 'rgba(87, 185, 255, 0.2)' : 'rgba(255, 180, 0, 0.2)';
      badge.style.color = isCustom ? 'var(--color-slate-blue)' : '#996500';
    }
  }

  function subscribeToAuth() {
    if (window.OmniSupabase) {
      window.OmniSupabase.onAuthStateChange((event, session, user) => {
        mountTopbarControls();
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export global trigger helpers
  window.OmniAuthUI = {
    openModal: openAuthModal,
    closeModal: closeAuthModal,
    switchTab: switchTab
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  } else {
    initAuthUI();
  }
})();
