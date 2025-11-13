# Resend Email Service Setup Guide

## Why Resend?
- ✅ **FREE**: 3,000 emails/month forever
- ✅ **Easy Setup**: Similar to PHPMailer - simple API
- ✅ **Beautiful HTML Emails**: Full HTML support
- ✅ **Fast & Reliable**: Modern infrastructure
- ✅ **No Client-Side Exposure**: API key stays secure in Firebase Functions

## Step-by-Step Setup

### 1. Create Resend Account
1. Go to https://resend.com/
2. Sign up for a free account
3. Verify your email address

### 2. Get API Key
1. After logging in, go to **API Keys** in the dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "Salon Management System")
4. **Copy the API key** (starts with `re_...`)
   - ⚠️ **IMPORTANT**: Copy it now - you won't see it again!

### 3. Verify Domain (Optional but Recommended)
For production, you should verify your domain:
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Follow DNS setup instructions
4. Once verified, you can use emails like `noreply@yourdomain.com`

For testing, you can use Resend's test domain: `onboarding@resend.dev`

### 4. Set API Key in Firebase Functions

You need to set the Resend API key as an environment variable in Firebase Functions:

#### Option A: Using Firebase CLI (Recommended)
```bash
# Set the API key
firebase functions:config:set resend.api_key="re_your_api_key_here"

# Set the from email (optional, defaults to onboarding@resend.dev)
firebase functions:config:set resend.from_email="David's Salon <noreply@davidsalon.com>"

# Deploy functions to apply changes
firebase deploy --only functions
```

#### Option B: Using Firebase Console
1. Go to Firebase Console → Your Project → Functions
2. Click on **Environment** tab
3. Add environment variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_...`)
4. Add another variable (optional):
   - **Name**: `RESEND_FROM_EMAIL`
   - **Value**: `David's Salon <noreply@davidsalon.com>`

### 5. Update Firebase Functions Code

The code is already set up! Just make sure:
- `functions/sendPromotionEmail.js` exists (✅ already created)
- `functions/index.js` exports the function (✅ already done)
- `functions/package.json` has `resend` dependency (✅ already installed)

### 6. Deploy Firebase Functions

```bash
cd functions
npm install  # Make sure resend is installed
cd ..
firebase deploy --only functions:sendPromotionEmail
```

### 7. Test It!

1. Create a promotion with "Email to Clients" checked
2. Check browser console for logs
3. Check your email inbox!

## Environment Variables Reference

In Firebase Functions, you need:
- `RESEND_API_KEY` - Your Resend API key (required)
- `RESEND_FROM_EMAIL` - Sender email (optional, defaults to `onboarding@resend.dev`)

## Email Format

The emails are sent with:
- **Beautiful HTML formatting** (styled with your brand colors)
- **Promotion details** (title, description, discount, dates)
- **Professional design** (responsive, works on all devices)

## Free Tier Limits

- **3,000 emails/month** - Free forever
- **100 emails/day** - Rate limit
- Upgrade plans available if you need more

## Troubleshooting

### "Email service not configured" error?
- Check that `RESEND_API_KEY` is set in Firebase Functions environment
- Redeploy functions after setting environment variables

### Emails not arriving?
- Check spam folder
- Verify API key is correct
- Check Firebase Functions logs: `firebase functions:log`
- Make sure domain is verified (if using custom domain)

### Function deployment fails?
- Make sure `resend` is installed: `cd functions && npm install`
- Check Firebase Functions logs for errors

## Testing Locally

To test locally with Firebase Emulators:

```bash
# Set environment variable for emulator
export RESEND_API_KEY="re_your_api_key_here"

# Start emulators
firebase emulators:start --only functions
```

## Security Notes

- ✅ API key is stored securely in Firebase Functions (not exposed to client)
- ✅ Function requires authentication (only logged-in users can send)
- ✅ Rate limiting handled by Resend

## Next Steps

1. Set up Resend account
2. Get API key
3. Set environment variable in Firebase Functions
4. Deploy functions
5. Test by creating a promotion!

That's it! Your emails will now be sent via Resend. 🎉

