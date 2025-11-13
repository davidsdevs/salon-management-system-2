# 🚀 QUICK EMAIL SETUP - Get Emails Working in 5 Minutes!

## ⚡ FASTEST WAY TO GET EMAILS WORKING

### Step 1: Sign Up for EmailJS (2 minutes)
1. Go to **https://www.emailjs.com/**
2. Click **Sign Up** (use Google/GitHub for faster signup)
3. Verify your email

### Step 2: Add Email Service (1 minute)
1. In EmailJS dashboard, click **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (easiest for testing)
4. Click **Connect Account** and authorize Gmail
5. **Copy the Service ID** (looks like `service_xxxxx`)

### Step 3: Create Email Template (2 minutes)
1. Click **Email Templates** → **Create New Template**
2. Use this template:

**Template Name:** Promotion Email

**Subject:**
```
{{subject}}
```

**Content (HTML):**
```html
{{message_html}}
```

**OR use individual fields for better control:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #160B53, #12094A); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">Special Promotion!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">David's Salon</p>
    </div>
    
    <div style="padding: 40px 30px;">
      <h2 style="color: #160B53; margin-top: 0;">Hello {{to_name}},</h2>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #160B53; margin-top: 0;">{{promotion_title}}</h3>
        <p style="color: #555;">{{promotion_description}}</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="font-size: 36px; font-weight: bold; color: #10b981; margin-bottom: 10px;">
            {{discount}}
          </div>
          <p style="color: #666; font-size: 14px;">{{applicable_to}}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 5px 0; color: #555; font-size: 14px;">
            <strong style="color: #160B53;">Valid from:</strong> {{start_date}}
          </p>
          <p style="margin: 5px 0; color: #555; font-size: 14px;">
            <strong style="color: #160B53;">Valid until:</strong> {{end_date}}
          </p>
        </div>
      </div>
      
      <p style="color: #333; font-size: 16px;">
        Don't miss out on this amazing offer! Visit us soon to take advantage of this promotion.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        This is an automated email from David's Salon Management System.
      </p>
    </div>
  </div>
</body>
</html>
```

3. **Copy the Template ID** (looks like `template_xxxxx`)

### Step 4: Get Public Key (30 seconds)
1. Go to **Account** → **General**
2. Find **Public Key**
3. **Copy it** (looks like `abcdefghijklmnop`)

### Step 5: Add to .env File (30 seconds)
Create or edit `.env` file in your project root:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Replace:**
- `service_xxxxx` with your actual Service ID
- `template_xxxxx` with your actual Template ID  
- `your_public_key_here` with your actual Public Key

### Step 6: Restart Dev Server
```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 7: Test It!
1. Create a promotion
2. Check "Email to Clients"
3. Create the promotion
4. Check your email! 📧

## ✅ That's It! Emails Should Work Now!

## 🆘 Troubleshooting

### "Email service not configured" error?
- Make sure `.env` file is in the project root (same folder as `package.json`)
- Make sure variable names start with `VITE_`
- Restart your dev server after adding to `.env`
- Check that there are no spaces around the `=` sign

### "Invalid template" error?
- Make sure template variables match: `{{to_email}}`, `{{to_name}}`, etc.
- Check that your template is saved in EmailJS

### "Authentication failed" error?
- Check that your Public Key is correct
- Make sure you copied the entire key

### Emails not arriving?
- Check spam folder
- Verify the email address is correct
- Check EmailJS dashboard → Logs for errors

## 📊 Free Tier Limits
- **200 emails/month** on free plan
- Perfect for testing and small businesses!

## 🎉 You're Done!
Your emails will now be sent when you create promotions!

