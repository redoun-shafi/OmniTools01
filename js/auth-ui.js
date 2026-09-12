/**
 * OmniTools — Unified Authentication UI & User Account Controller
 * Version: 2.1.0 (Calm Blue Design System)
 *
 * Features:
 * - Supabase JS v2 Persistent Auth (Zero plaintext password storage)
 * - Sign In, Sign Up, Forgot Password, and Deep-Link Reset Password
 * - Real-time inline field validation & error messages
 * - 4-Level Password Strength Meter with visual indicators
 * - Password Visibility Toggles (Show / Hide eye icon)
 * - Terms of Service acceptance & Remember Me preferences
 * - User Account & Live Tool History Modal (fetching from Supabase tool_history)
 * - Calm Floating Toast Notification System
 * - Non-blocking guest access across all tools
 */

(function () {
  'use strict';

  // Active tab in Auth Modal: 'signin' | 'signup' | 'forgot' | 'reset'
  let activeTab = 'signin';
  let isModalOpen = false;
  let isProfileModalOpen = false;
  let pendingRedirectUrl = null;
  let pendingSuccessCallback = null;

  /**
   * Initializes the Auth UI components on DOM ready
   */
  function initAuthUI() {
    injectToastContainer();
    injectAuthModal();
    injectProfileModal();
    mountTopbarControls();
    checkAndRenderToolGate();
    subscribeToAuth();
    checkRecoveryDeepLink();
  }

  /* ==========================================================================
     1. Toast Notification System
     ========================================================================== */

  function injectToastContainer() {
    if (document.getElementById('omniToastContainer')) return;
    const container = document.createElement('div');
    container.id = 'omniToastContainer';
    container.className = 'omni-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  /**
   * Displays a calm floating toast notification
   * @param {string} message - Message text
   * @param {'success'|'error'|'info'|'warning'} type - Visual alert tone
   * @param {number} duration - Auto dismiss time in ms
   */
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('omniToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `omni-toast omni-toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div class="omni-toast-icon">${iconSvg}</div>
      <div class="omni-toast-message">${escapeHtml(message)}</div>
      <button class="omni-toast-close" type="button" aria-label="Dismiss">&times;</button>
    `;

    const closeBtn = toast.querySelector('.omni-toast-close');
    closeBtn?.addEventListener('click', () => dismissToast(toast));

    container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => dismissToast(toast), duration);
    }
  }

  function dismissToast(toast) {
    if (!toast || toast.classList.contains('omni-toast-dismissing')) return;
    toast.classList.add('omni-toast-dismissing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }

  /* ==========================================================================
     2. Topbar Controls & Session Mounting
     ========================================================================== */

  function mountTopbarControls() {
    const targets = document.querySelectorAll('.header-actions, .tool-header-right, .omni-topbar-right');
    if (!targets.length) return;

    targets.forEach(container => {
      let authContainer = container.querySelector('.omni-auth-container');
      if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.className = 'omni-auth-container';
        container.prepend(authContainer);
      }
      renderTopbarState(authContainer);
    });
  }

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
          <button class="omni-auth-user-badge" id="omniUserBadge" aria-haspopup="true" aria-expanded="false" title="Account & Profile">
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
            <button class="omni-dropdown-item" id="omniBtnOpenProfile" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              My Account & History
            </button>
            <div class="omni-dropdown-divider"></div>
            <button class="omni-dropdown-item danger" id="omniBtnSignOut" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign out
            </button>
          </div>
        `;

        // Wire dropdown toggle
        const badge = container.querySelector('#omniUserBadge');
        const dropdown = container.querySelector('#omniUserDropdown');
        const btnOpenProfile = container.querySelector('#omniBtnOpenProfile');
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

        btnOpenProfile?.addEventListener('click', () => {
          closeAllDropdowns();
          openProfileModal();
        });

        btnSignOut?.addEventListener('click', async () => {
          closeAllDropdowns();
          try {
            await window.OmniSupabase.signOut();
            showToast('Signed out successfully.', 'info');
          } catch (err) {
            showToast('Error during sign out.', 'error');
          }
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

  /* ==========================================================================
     3. Password Strength & Visibility Helpers
     ========================================================================== */

  /**
   * Calculates password strength score (0 to 4)
   * 0: Empty / Very Weak
   * 1: Weak
   * 2: Fair
   * 3: Good
   * 4: Strong
   */
  function calculatePasswordStrength(password) {
    if (!password || password.length === 0) {
      return { score: 0, label: '', width: '0%', class: '' };
    }

    let points = 0;
    if (password.length >= 6) points += 1;
    if (password.length >= 10) points += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
    if (/\d/.test(password)) points += 1;
    if (/[^A-Za-z0-9]/.test(password)) points += 1;

    // Map points to 4 tiers
    if (points <= 1) {
      return { score: 1, label: 'Weak', width: '25%', class: 'strength-weak' };
    } else if (points === 2) {
      return { score: 2, label: 'Fair', width: '50%', class: 'strength-fair' };
    } else if (points === 3 || points === 4) {
      return { score: 3, label: 'Good', width: '75%', class: 'strength-good' };
    } else {
      return { score: 4, label: 'Strong', width: '100%', class: 'strength-strong' };
    }
  }

  function updateStrengthMeter(inputEl, meterEl) {
    if (!inputEl || !meterEl) return;
    const strength = calculatePasswordStrength(inputEl.value);
    const fill = meterEl.querySelector('.omni-strength-bar-fill');
    const label = meterEl.querySelector('.omni-strength-label');

    if (fill && label) {
      fill.style.width = strength.width;
      fill.className = `omni-strength-bar-fill ${strength.class}`;
      label.textContent = strength.label ? `Strength: ${strength.label}` : '';
      label.className = `omni-strength-label ${strength.class}`;
    }
  }

  function wirePasswordToggles(container) {
    const toggles = container.querySelectorAll('.omni-pwd-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const input = toggle.parentElement.querySelector('input');
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        toggle.innerHTML = isPassword
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      });
    });
  }

  /* ==========================================================================
     4. Auth Modal Construction & Event Handling
     ========================================================================== */

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
          <button class="omni-auth-tab" data-tab="reset" role="tab" id="omniTabReset" style="display:none;">Reset Password</button>
        </div>

        <div class="omni-auth-modal-body">
          <div class="omni-auth-alert" id="omniAuthAlert" role="alert"></div>

          <!-- Tab 1: Sign In -->
          <form id="omniFormSignIn" class="omni-auth-tab-content">
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignInEmail">Email address</label>
              <input class="omni-form-input" type="email" id="omniSignInEmail" required placeholder="you@example.com" autocomplete="email">
              <div class="omni-field-error" id="errSignInEmail"></div>
            </div>
            <div class="omni-form-group">
              <div class="omni-form-label">
                <label for="omniSignInPassword">Password</label>
                <a href="javascript:void(0)" id="omniLinkForgot">Forgot?</a>
              </div>
              <div class="omni-password-wrap">
                <input class="omni-form-input" type="password" id="omniSignInPassword" required placeholder="••••••••" autocomplete="current-password">
                <button type="button" class="omni-pwd-toggle" aria-label="Show password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
              <div class="omni-field-error" id="errSignInPassword"></div>
            </div>
            <div class="omni-form-checkbox-row">
              <label class="omni-checkbox-label">
                <input type="checkbox" id="omniSignInRemember" checked>
                <span>Remember me on this device</span>
              </label>
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitSignIn">Sign In</button>
            <div class="omni-auth-footer-link">
              Don't have an account? <a href="javascript:void(0)" id="omniLinkToSignUp">Create one for free</a>
            </div>
          </form>

          <!-- Tab 2: Sign Up -->
          <form id="omniFormSignUp" class="omni-auth-tab-content" style="display:none;">
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpName">Full name</label>
              <input class="omni-form-input" type="text" id="omniSignUpName" placeholder="Alex Morgan" autocomplete="name">
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpEmail">Email address</label>
              <input class="omni-form-input" type="email" id="omniSignUpEmail" required placeholder="you@example.com" autocomplete="email">
              <div class="omni-field-error" id="errSignUpEmail"></div>
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpPassword">Password</label>
              <div class="omni-password-wrap">
                <input class="omni-form-input" type="password" id="omniSignUpPassword" required minlength="6" placeholder="Min 6 characters" autocomplete="new-password">
                <button type="button" class="omni-pwd-toggle" aria-label="Show password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
              <div class="omni-strength-meter" id="omniSignUpStrength">
                <div class="omni-strength-bar"><div class="omni-strength-bar-fill"></div></div>
                <div class="omni-strength-label"></div>
              </div>
              <div class="omni-field-error" id="errSignUpPassword"></div>
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniSignUpConfirm">Confirm password</label>
              <div class="omni-password-wrap">
                <input class="omni-form-input" type="password" id="omniSignUpConfirm" required minlength="6" placeholder="Repeat password" autocomplete="new-password">
                <button type="button" class="omni-pwd-toggle" aria-label="Show password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
              <div class="omni-field-error" id="errSignUpConfirm"></div>
            </div>
            <div class="omni-form-checkbox-row">
              <label class="omni-checkbox-label">
                <input type="checkbox" id="omniSignUpTerms" required>
                <span>I agree to the <a href="javascript:void(0)" class="omni-terms-link">Terms of Service</a> & <a href="javascript:void(0)" class="omni-terms-link">Privacy Policy</a></span>
              </label>
              <div class="omni-field-error" id="errSignUpTerms"></div>
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitSignUp">Create Account</button>
            <div class="omni-auth-footer-link">
              Already have an account? <a href="javascript:void(0)" id="omniLinkToSignIn">Sign in</a>
            </div>
          </form>

          <!-- Tab 3: Forgot Password -->
          <form id="omniFormForgot" class="omni-auth-tab-content" style="display:none;">
            <p class="omni-form-help">Enter your registered email address and we'll send a secure password reset link directly to your inbox.</p>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniForgotEmail">Email address</label>
              <input class="omni-form-input" type="email" id="omniForgotEmail" required placeholder="you@example.com" autocomplete="email">
              <div class="omni-field-error" id="errForgotEmail"></div>
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitForgot">Send Reset Link</button>
            <div class="omni-auth-footer-link">
              Remembered your password? <a href="javascript:void(0)" id="omniLinkBackSignIn">Back to Sign In</a>
            </div>
          </form>

          <!-- Tab 4: Reset Password (Deep-link recovery) -->
          <form id="omniFormReset" class="omni-auth-tab-content" style="display:none;">
            <p class="omni-form-help">Set a new secure password for your OmniTools account.</p>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniResetPassword">New password</label>
              <div class="omni-password-wrap">
                <input class="omni-form-input" type="password" id="omniResetPassword" required minlength="6" placeholder="Min 6 characters" autocomplete="new-password">
                <button type="button" class="omni-pwd-toggle" aria-label="Show password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
              <div class="omni-strength-meter" id="omniResetStrength">
                <div class="omni-strength-bar"><div class="omni-strength-bar-fill"></div></div>
                <div class="omni-strength-label"></div>
              </div>
              <div class="omni-field-error" id="errResetPassword"></div>
            </div>
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniResetConfirm">Confirm new password</label>
              <div class="omni-password-wrap">
                <input class="omni-form-input" type="password" id="omniResetConfirm" required minlength="6" placeholder="Repeat new password" autocomplete="new-password">
                <button type="button" class="omni-pwd-toggle" aria-label="Show password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
              <div class="omni-field-error" id="errResetConfirm"></div>
            </div>
            <button type="submit" class="omni-auth-submit" id="omniBtnSubmitReset">Update Password</button>
            <div class="omni-auth-footer-link">
              <a href="javascript:void(0)" id="omniLinkResetToSignIn">Back to Sign In</a>
            </div>
          </form>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireModalEvents(overlay);
    wirePasswordToggles(overlay);
  }

  function wireModalEvents(overlay) {
    const closeBtn = overlay.querySelector('#omniAuthClose');
    const tabButtons = overlay.querySelectorAll('.omni-auth-tab');

    // Close handlers
    closeBtn?.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isModalOpen) closeAuthModal();
    });

    // Tab buttons
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Tab switcher links
    overlay.querySelector('#omniLinkForgot')?.addEventListener('click', () => switchTab('forgot'));
    overlay.querySelector('#omniLinkToSignUp')?.addEventListener('click', () => switchTab('signup'));
    overlay.querySelector('#omniLinkToSignIn')?.addEventListener('click', () => switchTab('signin'));
    overlay.querySelector('#omniLinkBackSignIn')?.addEventListener('click', () => switchTab('signin'));
    overlay.querySelector('#omniLinkResetToSignIn')?.addEventListener('click', () => switchTab('signin'));

    // Real-time strength meter updates
    const signUpPwd = overlay.querySelector('#omniSignUpPassword');
    const signUpMeter = overlay.querySelector('#omniSignUpStrength');
    signUpPwd?.addEventListener('input', () => {
      updateStrengthMeter(signUpPwd, signUpMeter);
      clearFieldError('errSignUpPassword');
    });

    const resetPwd = overlay.querySelector('#omniResetPassword');
    const resetMeter = overlay.querySelector('#omniResetStrength');
    resetPwd?.addEventListener('input', () => {
      updateStrengthMeter(resetPwd, resetMeter);
      clearFieldError('errResetPassword');
    });

    // Form: Sign In
    const formSignIn = overlay.querySelector('#omniFormSignIn');
    formSignIn?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const email = overlay.querySelector('#omniSignInEmail').value.trim();
      const password = overlay.querySelector('#omniSignInPassword').value;
      const rememberMe = overlay.querySelector('#omniSignInRemember')?.checked;
      const submitBtn = overlay.querySelector('#omniBtnSubmitSignIn');

      if (!validateEmail(email)) {
        setFieldError('errSignInEmail', 'Please enter a valid email address.');
        return;
      }
      if (!password) {
        setFieldError('errSignInPassword', 'Please enter your password.');
        return;
      }

      setLoading(submitBtn, true, 'Signing In...');
      hideAlert();

      try {
        const res = await window.OmniSupabase.signIn({ email, password });
        showAlert('Signed in successfully!', 'success');
        showToast(`Welcome back, ${res.user?.user_metadata?.full_name || email.split('@')[0]}!`, 'success');
        setTimeout(() => {
          closeAuthModal();
          handleAuthSuccess(res.user);
        }, 400);
      } catch (err) {
        showAlert(err.message || 'Failed to sign in. Please verify your credentials.', 'error');
        showToast(err.message || 'Sign in failed.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Sign In');
      }
    });

    // Form: Sign Up
    const formSignUp = overlay.querySelector('#omniFormSignUp');
    formSignUp?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const fullName = overlay.querySelector('#omniSignUpName').value.trim();
      const email = overlay.querySelector('#omniSignUpEmail').value.trim();
      const password = overlay.querySelector('#omniSignUpPassword').value;
      const confirm = overlay.querySelector('#omniSignUpConfirm').value;
      const terms = overlay.querySelector('#omniSignUpTerms')?.checked;
      const submitBtn = overlay.querySelector('#omniBtnSubmitSignUp');

      if (!validateEmail(email)) {
        setFieldError('errSignUpEmail', 'Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setFieldError('errSignUpPassword', 'Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirm) {
        setFieldError('errSignUpConfirm', 'Passwords do not match.');
        return;
      }
      if (!terms) {
        setFieldError('errSignUpTerms', 'You must agree to the Terms of Service to continue.');
        return;
      }

      setLoading(submitBtn, true, 'Creating Account...');
      hideAlert();

      try {
        const res = await window.OmniSupabase.signUp({ email, password, fullName });
        if (res.needsEmailConfirmation) {
          showAlert('Account registered! Please check your email to confirm your address before signing in.', 'success');
          showToast('Confirmation email sent! Please check your inbox.', 'info', 6000);
        } else {
          showAlert('Account created and signed in!', 'success');
          showToast(`Welcome to OmniTools, ${fullName || email.split('@')[0]}!`, 'success');
          setTimeout(() => {
            closeAuthModal();
            handleAuthSuccess(res.user);
          }, 500);
        }
      } catch (err) {
        showAlert(err.message || 'Failed to create account.', 'error');
        showToast(err.message || 'Account creation failed.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Create Account');
      }
    });

    // Form: Forgot Password
    const formForgot = overlay.querySelector('#omniFormForgot');
    formForgot?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const email = overlay.querySelector('#omniForgotEmail').value.trim();
      const submitBtn = overlay.querySelector('#omniBtnSubmitForgot');

      if (!validateEmail(email)) {
        setFieldError('errForgotEmail', 'Please enter a valid email address.');
        return;
      }

      setLoading(submitBtn, true, 'Sending Link...');
      hideAlert();

      try {
        await window.OmniSupabase.resetPassword(email);
        showAlert('Password recovery link dispatched! Check your email inbox.', 'success');
        showToast('Password reset link sent to your email!', 'success');
      } catch (err) {
        showAlert(err.message || 'Failed to send recovery email.', 'error');
        showToast(err.message || 'Could not send reset link.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Send Reset Link');
      }
    });

    // Form: Reset Password
    const formReset = overlay.querySelector('#omniFormReset');
    formReset?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const newPassword = overlay.querySelector('#omniResetPassword').value;
      const confirm = overlay.querySelector('#omniResetConfirm').value;
      const submitBtn = overlay.querySelector('#omniBtnSubmitReset');

      if (newPassword.length < 6) {
        setFieldError('errResetPassword', 'New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirm) {
        setFieldError('errResetConfirm', 'Passwords do not match.');
        return;
      }

      setLoading(submitBtn, true, 'Updating Password...');
      hideAlert();

      try {
        const res = await window.OmniSupabase.updatePassword(newPassword);
        showAlert('Password updated successfully! You are now signed in.', 'success');
        showToast('Password updated successfully!', 'success');
        setTimeout(() => {
          closeAuthModal();
          handleAuthSuccess(res.user);
        }, 600);
      } catch (err) {
        showAlert(err.message || 'Failed to update password.', 'error');
        showToast(err.message || 'Password update failed.', 'error');
      } finally {
        setLoading(submitBtn, false, 'Update Password');
      }
    });
  }

  function handleAuthSuccess(user) {
    if (pendingRedirectUrl) {
      const target = pendingRedirectUrl;
      pendingRedirectUrl = null;
      window.location.href = target;
      return;
    }

    if (typeof pendingSuccessCallback === 'function') {
      const cb = pendingSuccessCallback;
      pendingSuccessCallback = null;
      cb(user);
    }
  }

  function switchTab(tabName) {
    activeTab = tabName;
    const overlay = document.getElementById('omniAuthModalOverlay');
    if (!overlay) return;

    hideAlert();
    clearAllErrors();

    // Toggle reset tab button visibility
    const resetTabBtn = overlay.querySelector('#omniTabReset');
    if (resetTabBtn) {
      resetTabBtn.style.display = (tabName === 'reset') ? 'inline-block' : 'none';
    }

    // Update active tab buttons
    overlay.querySelectorAll('.omni-auth-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });

    // Toggle forms
    const forms = {
      signin: overlay.querySelector('#omniFormSignIn'),
      signup: overlay.querySelector('#omniFormSignUp'),
      forgot: overlay.querySelector('#omniFormForgot'),
      reset: overlay.querySelector('#omniFormReset')
    };

    Object.keys(forms).forEach(key => {
      if (forms[key]) {
        forms[key].style.display = (key === tabName) ? 'block' : 'none';
      }
    });
  }

  function openAuthModal(initialTab = 'signin', alertMsg = null, targetUrl = null, onSuccess = null) {
    const overlay = document.getElementById('omniAuthModalOverlay');
    if (!overlay) return;

    if (targetUrl) pendingRedirectUrl = targetUrl;
    if (onSuccess) pendingSuccessCallback = onSuccess;

    switchTab(initialTab);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    isModalOpen = true;
    updateConfigBadge();

    if (alertMsg) {
      showAlert(alertMsg, 'info');
    }

    setTimeout(() => {
      const activeForm = overlay.querySelector(`.omni-auth-tab-content[style*="display: block"], #omniFormSignIn`);
      const input = activeForm?.querySelector('input:not([type="checkbox"])');
      input?.focus();
    }, 120);
  }

  function closeAuthModal() {
    const overlay = document.getElementById('omniAuthModalOverlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    isModalOpen = false;
    hideAlert();
    clearAllErrors();
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

  function setFieldError(fieldId, errorMsg) {
    const el = document.getElementById(fieldId);
    if (el) {
      el.textContent = errorMsg;
      el.style.display = 'block';
    }
  }

  function clearFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  function clearAllErrors() {
    document.querySelectorAll('.omni-field-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  function validateEmail(email) {
    return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
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

  /* ==========================================================================
     5. User Profile & Tool Usage History Modal
     ========================================================================== */

  function injectProfileModal() {
    if (document.getElementById('omniProfileModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'omniProfileModalOverlay';
    overlay.className = 'omni-auth-modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="omni-profile-modal" role="dialog" aria-labelledby="omniProfileTitle" aria-modal="true">
        <div class="omni-auth-modal-head">
          <h2 class="omni-auth-modal-title" id="omniProfileTitle">
            <span class="omni-mark small" style="width:24px;height:24px;font-size:0.75rem;">O</span>
            Account & Activity History
          </h2>
          <button class="omni-auth-modal-close" id="omniProfileClose" aria-label="Close modal">&times;</button>
        </div>

        <div class="omni-profile-modal-body">
          <!-- Profile Overview -->
          <div class="omni-profile-card">
            <div class="omni-profile-avatar-lg" id="omniProfileAvatarLg">U</div>
            <div class="omni-profile-info">
              <div class="omni-profile-name-row">
                <h3 class="omni-profile-name" id="omniProfileName">User</h3>
                <button class="omni-profile-edit-btn" id="omniBtnEditName" title="Edit display name">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </div>
              <div class="omni-profile-email" id="omniProfileEmail">user@example.com</div>
              <div class="omni-profile-meta-tags">
                <span class="omni-profile-tag" id="omniProfileMemberSince">Member</span>
                <span class="omni-profile-tag active">Active Session</span>
              </div>
            </div>
          </div>

          <!-- Edit Name Form (Collapsible) -->
          <div class="omni-profile-edit-box" id="omniProfileEditBox" style="display:none;">
            <div class="omni-form-group">
              <label class="omni-form-label" for="omniInputEditName">Display Name</label>
              <div style="display:flex;gap:8px;">
                <input class="omni-form-input" type="text" id="omniInputEditName" placeholder="Your full name">
                <button class="button button-primary" id="omniBtnSaveName" type="button" style="padding:0 16px;white-space:nowrap;font-size:0.8rem;">Save</button>
                <button class="button button-secondary" id="omniBtnCancelName" type="button" style="padding:0 12px;font-size:0.8rem;">Cancel</button>
              </div>
            </div>
          </div>

          <!-- Tool Activity & History Section -->
          <div class="omni-history-section">
            <div class="omni-history-head">
              <div class="omni-history-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Recent Tool Activity
              </div>
              <button class="omni-history-refresh-btn" id="omniBtnRefreshHistory" title="Refresh history">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                Refresh
              </button>
            </div>

            <div class="omni-history-list" id="omniHistoryList">
              <div class="omni-history-loading">
                <span class="omni-spinner" style="margin-right:8px;"></span> Loading history...
              </div>
            </div>
          </div>
        </div>

        <div class="omni-profile-modal-foot">
          <button class="button button-secondary" id="omniProfileBtnClose" type="button">Close</button>
          <button class="button button-primary omni-btn-danger" id="omniProfileBtnSignOut" type="button">Sign Out</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireProfileModalEvents(overlay);
  }

  function wireProfileModalEvents(overlay) {
    const closeBtn = overlay.querySelector('#omniProfileClose');
    const footerCloseBtn = overlay.querySelector('#omniProfileBtnClose');
    const signOutBtn = overlay.querySelector('#omniProfileBtnSignOut');
    const editNameBtn = overlay.querySelector('#omniBtnEditName');
    const cancelNameBtn = overlay.querySelector('#omniBtnCancelName');
    const saveNameBtn = overlay.querySelector('#omniBtnSaveName');
    const refreshHistoryBtn = overlay.querySelector('#omniBtnRefreshHistory');

    const closeHandler = () => closeProfileModal();
    closeBtn?.addEventListener('click', closeHandler);
    footerCloseBtn?.addEventListener('click', closeHandler);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProfileModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isProfileModalOpen) closeProfileModal();
    });

    signOutBtn?.addEventListener('click', async () => {
      closeProfileModal();
      if (window.OmniSupabase) {
        await window.OmniSupabase.signOut();
        showToast('Signed out successfully.', 'info');
      }
    });

    editNameBtn?.addEventListener('click', () => {
      const editBox = overlay.querySelector('#omniProfileEditBox');
      const input = overlay.querySelector('#omniInputEditName');
      const currentName = overlay.querySelector('#omniProfileName')?.textContent || '';
      if (editBox && input) {
        editBox.style.display = 'block';
        input.value = currentName === 'User' ? '' : currentName;
        input.focus();
      }
    });

    cancelNameBtn?.addEventListener('click', () => {
      const editBox = overlay.querySelector('#omniProfileEditBox');
      if (editBox) editBox.style.display = 'none';
    });

    saveNameBtn?.addEventListener('click', async () => {
      const input = overlay.querySelector('#omniInputEditName');
      const newName = input ? input.value.trim() : '';
      if (!newName) {
        showToast('Please enter a display name.', 'warning');
        return;
      }

      setLoading(saveNameBtn, true, 'Saving...');
      try {
        if (window.OmniSupabase) {
          await window.OmniSupabase.updateProfile(null, { full_name: newName });
          showToast('Profile updated!', 'success');
          const editBox = overlay.querySelector('#omniProfileEditBox');
          if (editBox) editBox.style.display = 'none';
          refreshProfileData();
          mountTopbarControls();
        }
      } catch (err) {
        showToast(err.message || 'Failed to update profile.', 'error');
      } finally {
        setLoading(saveNameBtn, false, 'Save');
      }
    });

    refreshHistoryBtn?.addEventListener('click', () => {
      loadUserToolHistory();
    });
  }

  function openProfileModal() {
    const overlay = document.getElementById('omniProfileModalOverlay');
    if (!overlay) return;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    isProfileModalOpen = true;

    refreshProfileData();
    loadUserToolHistory();
  }

  function closeProfileModal() {
    const overlay = document.getElementById('omniProfileModalOverlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    isProfileModalOpen = false;

    const editBox = overlay.querySelector('#omniProfileEditBox');
    if (editBox) editBox.style.display = 'none';
  }

  function refreshProfileData() {
    if (!window.OmniSupabase) return;
    const overlay = document.getElementById('omniProfileModalOverlay');
    if (!overlay) return;

    window.OmniSupabase.getUser().then(user => {
      if (!user) {
        closeProfileModal();
        return;
      }

      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const email = user.email || '';
      const initial = name.charAt(0).toUpperCase();
      const avatarUrl = user.user_metadata?.avatar_url;

      const avatarLg = overlay.querySelector('#omniProfileAvatarLg');
      const nameEl = overlay.querySelector('#omniProfileName');
      const emailEl = overlay.querySelector('#omniProfileEmail');
      const memberSinceEl = overlay.querySelector('#omniProfileMemberSince');

      if (avatarLg) {
        avatarLg.innerHTML = avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" onerror="this.remove()">` : initial;
      }
      if (nameEl) nameEl.textContent = name;
      if (emailEl) emailEl.textContent = email;
      if (memberSinceEl && user.created_at) {
        try {
          const date = new Date(user.created_at);
          memberSinceEl.textContent = `Member since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        } catch (e) {
          memberSinceEl.textContent = 'Member';
        }
      }
    });
  }

  async function loadUserToolHistory() {
    const overlay = document.getElementById('omniProfileModalOverlay');
    if (!overlay || !window.OmniSupabase) return;

    const list = overlay.querySelector('#omniHistoryList');
    if (!list) return;

    list.innerHTML = '<div class="omni-history-loading"><span class="omni-spinner" style="margin-right:8px;"></span> Loading history...</div>';

    try {
      const records = await window.OmniSupabase.getUserHistory(null, 25);
      if (!records || records.length === 0) {
        list.innerHTML = `
          <div class="omni-history-empty">
            <div class="omni-history-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <div class="omni-history-empty-text">No tool activity logged yet.</div>
            <div class="omni-history-empty-sub">Your conversions, index exports, and automation runs will be automatically tracked here.</div>
          </div>
        `;
        return;
      }

      list.innerHTML = records.map(item => {
        const dateStr = item.created_at ? formatTimeAgo(new Date(item.created_at)) : 'Recently';
        const metaStr = item.meta_data && Object.keys(item.meta_data).length > 0
          ? Object.entries(item.meta_data).map(([k, v]) => `<span class="omni-history-tag">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join(' ')
          : '';

        return `
          <div class="omni-history-item">
            <div class="omni-history-item-head">
              <span class="omni-history-tool-badge">${escapeHtml(item.tool_name || 'Tool Execution')}</span>
              <span class="omni-history-time">${escapeHtml(dateStr)}</span>
            </div>
            <div class="omni-history-action">${escapeHtml(formatActionType(item.action_type))}</div>
            ${metaStr ? `<div class="omni-history-meta">${metaStr}</div>` : ''}
          </div>
        `;
      }).join('');

    } catch (err) {
      list.innerHTML = '<div class="omni-history-empty"><div class="omni-history-empty-text">Unable to load history. Please try again.</div></div>';
    }
  }

  function formatActionType(action) {
    if (!action) return 'Tool executed';
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatTimeAgo(date) {
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /* ==========================================================================
     6. Deep-Link Password Recovery Detection
     ========================================================================== */

  function checkRecoveryDeepLink() {
    if (typeof window === 'undefined' || !window.OmniSupabase) return;

    if (window.OmniSupabase.isRecoveryUrl()) {
      setTimeout(() => {
        openAuthModal('reset', 'Password recovery session active. Please enter your new password.');
      }, 500);
    }
  }

  /* ==========================================================================
     7. Tool Gating & Non-Blocking Access Logic
     ========================================================================== */

  function checkAndRenderToolGate() {
    // Phase 2 requirement: Ensure zero blocking gates for guest access
    const gate = document.getElementById('omniToolGateOverlay');
    if (gate) {
      gate.remove();
    }
  }

  function requireAuth(onSuccess, alertMessage, targetUrl) {
    if (!window.OmniSupabase) {
      if (typeof onSuccess === 'function') onSuccess(null);
      return;
    }

    window.OmniSupabase.getUser().then(user => {
      if (user) {
        if (typeof onSuccess === 'function') onSuccess(user);
      } else {
        openAuthModal('signin', alertMessage || 'Sign in or create an account to access this feature.', targetUrl, onSuccess);
      }
    });
  }

  function subscribeToAuth() {
    if (window.OmniSupabase) {
      window.OmniSupabase.onAuthStateChange((event, session, user) => {
        mountTopbarControls();
        checkAndRenderToolGate();

        // Handle recovery event from Supabase
        if (event === 'PASSWORD_RECOVERY') {
          openAuthModal('reset', 'Password recovery active. Please create a new password.');
        }

        window.dispatchEvent(new CustomEvent('omni:auth-state-changed', { detail: { event, session, user } }));
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

  /* ==========================================================================
     8. Exported Global API
     ========================================================================== */

  window.OmniAuthUI = {
    openModal: openAuthModal,
    closeModal: closeAuthModal,
    openProfileModal: openProfileModal,
    closeProfileModal: closeProfileModal,
    switchTab: switchTab,
    showToast: showToast,
    requireAuth: requireAuth,
    checkToolAccess: checkAndRenderToolGate
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  } else {
    initAuthUI();
  }
})();
