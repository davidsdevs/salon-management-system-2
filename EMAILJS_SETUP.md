# EmailJS Setup Guide

## Why emails aren't being sent
Currently, emails are **NOT being sent** because EmailJS is not configured. The code is ready, but you need to:

1. Create an EmailJS account
2. Set up an email service
3. Create an email template
4. Add your credentials to `.env` file

## Step-by-Step Setup

### 1. Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account (200 emails/month free)
3. Verify your email address

### 2. Add Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook**
   - **Yahoo**
   - Or any SMTP service
4. Follow the setup instructions
5. **Copy the Service ID** (e.g., `service_xxxxx`)

### 3. Create Email Template
1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template structure:

**Subject:**
```
{{subject}}
```

**Content (HTML):**
```html
{{message}}
```

**Or use individual fields:**
```html
<h2>{{promotion_title}}</h2>
<p>{{promotion_description}}</p>
<p><strong>Discount:</strong> {{discount}}</p>
<p><strong>Valid from:</strong> {{start_date}}</p>
<p><strong>Valid until:</strong> {{end_date}}</p>
<p>{{applicable_to}}</p>
```

4. **Copy the Template ID** (e.g., `template_xxxxx`)

### 4. Get Public Key
1. Go to **Account** → **General**
2. Find **Public Key**
3. **Copy the Public Key**

### 5. Add to .env File
Add these lines to your `.env` file in the project root:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Example:**
```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

### 6. Restart Development Server
After adding the environment variables:
```bash
npm run dev
```

## Testing
1. Create a promotion with "Email to Clients" checked
2. Check the browser console for EmailJS logs
3. Check your email inbox (and spam folder)

## Template Variables Available
The following variables are sent to your EmailJS template:
- `to_email` - Client's email address
- `to_name` - Client's name
- `promotion_title` - Promotion title
- `promotion_description` - Promotion description
- `discount` - Discount amount (e.g., "10% OFF" or "₱100 OFF")
- `start_date` - Start date (formatted)
- `end_date` - End date (formatted)
- `applicable_to` - Where promotion applies
- `message` - Full HTML email content
- `subject` - Email subject

## Troubleshooting

### Emails still not sending?
1. Check browser console for errors
2. Verify all 3 environment variables are set correctly
3. Make sure you restarted the dev server after adding env variables
4. Check EmailJS dashboard for error logs
5. Verify your email service is connected in EmailJS

### "Email service not configured" error?
- Check that all 3 environment variables are in `.env`
- Make sure variable names start with `VITE_`
- Restart your dev server

### EmailJS errors?
- Check EmailJS dashboard → Logs for detailed errors
- Verify your email service is active
- Check template variable names match

## Free Tier Limits
- **200 emails/month** on free plan
- Upgrade for more emails if needed

