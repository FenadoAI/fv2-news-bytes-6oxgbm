# Google OAuth Setup Guide

This guide will help you configure Google OAuth for the Admin panel login.

## Prerequisites
- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left)
3. Click "New Project"
4. Enter a project name (e.g., "News App")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "People API"
3. Click on it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Your app name (e.g., "News Admin Panel")
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Save and Continue** (default scopes are fine)
7. On **Test users** page, add your email address
8. Click **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Application type**: **Web application**
4. Enter a name (e.g., "News App Web Client")
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-frontend-domain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000
   https://your-frontend-domain.com
   ```
7. Click **Create**
8. **Copy the Client ID** (you'll need this)

## Step 5: Update Environment Variables

### Backend (`backend/.env`)
```bash
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
JWT_SECRET_KEY="your-random-secret-key-here"  # Generate a random string
```

### Frontend (`frontend/.env`)
```bash
REACT_APP_GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
```

## Step 6: Generate JWT Secret Key

Generate a secure random string for `JWT_SECRET_KEY`:

```bash
# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Or using OpenSSL
openssl rand -base64 32
```

## Step 7: Restart Services

```bash
# Build frontend
cd frontend
bun run build

# Restart both services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## Step 8: Test Login

1. Navigate to `/admin` page
2. Click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. You should be redirected to the admin panel

## Troubleshooting

### Error: "Google OAuth not configured"
- Make sure `GOOGLE_CLIENT_ID` is set in both frontend and backend .env files
- Restart the services after updating .env

### Error: "Invalid Google token"
- Check that the Client ID matches in both frontend and backend
- Ensure the authorized origins are correctly configured in Google Console

### Error: "Unauthorized redirect URI"
- Make sure your current URL is added to "Authorized redirect URIs" in Google Console
- Don't forget to include both `http://localhost:3000` for local development

### Development Mode (No Google Setup Required)
The app includes a development mode that bypasses Google verification:
- The backend will accept direct user info if email and name are provided
- This is useful for local testing without setting up Google Console

## Security Notes

1. **Never commit production credentials** to git
2. Use different OAuth clients for development and production
3. Regularly rotate your `JWT_SECRET_KEY`
4. Keep `GOOGLE_CLIENT_SECRET` secure (only used in backend)
5. The frontend only needs `GOOGLE_CLIENT_ID` (safe to expose)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/gsi/web/guides/overview)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
