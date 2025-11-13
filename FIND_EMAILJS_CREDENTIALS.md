# 🔍 How to Find Your EmailJS Credentials

You have: ✅ Service ID: `service_david_devs`

You still need:
- ❌ Template ID
- ❌ Public Key

## Step 1: Get Template ID (2 minutes)

1. Go to EmailJS Dashboard: https://dashboard.emailjs.com/
2. Click **"Email Templates"** in the left sidebar
3. If you don't have a template yet:
   - Click **"Create New Template"**
   - **Template Name:** "Promotion Email"
   - **Subject:** `{{subject}}`
   - **Content:** `{{message_html}}`
   - Click **"Save"**
4. **Copy the Template ID** - it looks like `template_xxxxx` or `template_abc123`
   - You'll see it in the template list or in the template editor URL

## Step 2: Get Public Key (30 seconds)

1. In EmailJS Dashboard, click **"Account"** (top right)
2. Click **"General"** tab
3. Scroll down to find **"Public Key"**
4. **Copy the Public Key** - it's a long string like `abcdefghijklmnopqrstuvwxyz123456`

## Step 3: Add to .env File

Create or edit `.env` file in your project root (same folder as `package.json`):

```env
VITE_EMAILJS_SERVICE_ID=service_david_devs
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Replace:**
- `template_xxxxx` with your actual Template ID
- `your_public_key_here` with your actual Public Key

## Step 4: Restart Server

```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ That's It!

After restarting, the warning should disappear and emails will work!

