# Supabase Setup Guide for OmniTools

This guide walks you through connecting **OmniTools** to your own **Supabase** backend to enable Sign In, Sign Up, Password Recovery, and persistent tool execution history.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"**.
3. Choose an **Organization**, enter a **Project Name** (e.g., `OmniTools`), set a secure **Database Password**, and select your nearest region.
4. Click **"Create new project"** and wait about 1-2 minutes for the database to provision.

---

## 2. Run the SQL Migration Schema

1. In your Supabase Project dashboard, navigate to the **SQL Editor** tab (icon `>_` on the left sidebar).
2. Click **"New query"**.
3. Copy and paste the entire contents of [`supabase-schema.sql`](./supabase-schema.sql) into the SQL editor.
4. Click **"Run"** (or press `Ctrl+Enter`).
5. Verify that the tables `profiles` and `tool_history`, along with the trigger `on_auth_user_created`, are successfully created.

---

## 3. Retrieve Your API Credentials

1. In the Supabase dashboard, go to **Project Settings** (gear icon at the bottom left) &rarr; **API**.
2. Locate the following two values:
   - **Project URL** (e.g., `https://abcdefghijklm.supabase.co`)
   - **Project API Keys** &rarr; `anon` `public` key (starts with `eyJhbGciOi...`)

---

## 4. Connect OmniTools to Your Supabase Backend

You have two convenient ways to connect OmniTools:

### Option A: In-App UI (Recommended)
1. Open OmniTools in your browser (e.g., `index.html` or deployed site on GitHub Pages).
2. Click the **"Sign in"** button in the top navigation bar.
3. Switch to the **"Settings"** tab in the modal dialog.
4. Paste your **Supabase Project URL** and **Anon Public API Key**.
5. Click **"Test"** to verify connectivity, then click **"Save & Connect"**.

### Option B: Set Default Configuration in Code
Open `js/supabase-client.js` and edit the `DEFAULT_CONFIG` object:

```javascript
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseKey: 'your-anon-public-api-key-here'
};
```

---

## 5. Configure Authentication Settings (Optional)

In your Supabase Dashboard &rarr; **Authentication** &rarr; **URL Configuration**:
- **Site URL**: Enter your deployment URL (e.g. `https://redoun-shafi.github.io/OmniTools/` or `http://localhost:8080`).
- **Redirect URLs**: Add `https://redoun-shafi.github.io/OmniTools/**` for seamless password reset email redirects.

In **Authentication** &rarr; **Providers** &rarr; **Email**:
- By default, Supabase requires email confirmation for new signups. If you want instant signups without confirmation emails during testing, you can toggle off **"Confirm email"**.

---

## Features Enabled by Supabase Integration
- **User Authentication**: Sign In and Sign Up with email & password across all tool pages.
- **Profile Management**: Automatic avatar generator and name sync.
- **Password Recovery**: Dispatches secure password reset links via email.
- **Persistent Tool History**: Log and view tool executions (Recipe Index Studio, Canva Bulk Converter, Auto Flow).
- **Client-Side Security**: Enforced with PostgreSQL Row Level Security (RLS) policies.
