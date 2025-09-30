# Quick Setup: Google Login

## 🚀 Quick Start (5 minutes)

### 1. Get Google OAuth Credentials

Visit: https://console.cloud.google.com/apis/credentials

1. Create a new project (or select existing)
2. Go to "OAuth consent screen" → Configure
3. Go to "Credentials" → Create OAuth Client ID
4. Select "Web application"
5. Add authorized origins:
   - `http://localhost:3000`
   - Your production URL
6. Copy the **Client ID**

### 2. Update Environment Variables

**Backend** (`backend/.env`):
```bash
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
JWT_SECRET_KEY="any-random-secret-string-here"
```

**Frontend** (`frontend/.env`):
```bash
REACT_APP_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
```

### 3. Restart Services

```bash
cd frontend && bun run build
sudo supervisorctl restart backend frontend
```

### 4. Test

1. Open `/admin` in your browser
2. Click "Sign in with Google"
3. Select your Google account
4. Done! ✅

## 📚 Detailed Guide

For complete setup instructions, see: `docs/google-oauth-setup.md`

## 🔧 Development Mode

The app works without Google setup for testing:
- It accepts user info directly from the frontend
- Useful for local development
- Just click "Sign in with Google" - it will use a simplified auth flow

## ❓ Common Issues

**"Google OAuth not configured"**
→ Add `GOOGLE_CLIENT_ID` to both `.env` files

**"Invalid token"**
→ Client ID must match in frontend and backend

**"Redirect URI mismatch"**
→ Add your URL to Google Console authorized origins

## 🔒 Security

- ✅ JWT tokens expire after 30 days
- ✅ Passwords never stored (Google handles authentication)
- ✅ Admin panel protected by authentication
- ✅ User info stored in MongoDB

## 📝 Features

- Google OAuth 2.0 login
- User profile with avatar
- Persistent sessions
- Protected admin routes
- Beautiful login UI
- Automatic token refresh
