# 🚨 CRITICAL: EmailJS Template Setup

## Your EmailJS Credentials:
- ✅ Service ID: `service_david_devs`
- ✅ Template ID: `template_j6ktzo1`
- ✅ Public Key: `nuqGoYtoFwXuCTNpv`

## ⚠️ TEMPLATE MUST BE CONFIGURED CORRECTLY!

Go to EmailJS Dashboard → Email Templates → Edit `template_j6ktzo1`

### Template Configuration:

**Subject Line:**
```
{{subject}}
```

**Content (HTML):**
```html
{{message_html}}
```

**OR if you want individual fields:**

**Subject:**
```
{{subject}}
```

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  {{message_html}}
</body>
</html>
```

## 🔥 IMPORTANT NOTES:

1. **Use `{{message_html}}` in your template** - This contains the FULL formatted HTML email
2. **Subject MUST be `{{subject}}`** - This is the email subject line
3. **Save the template** after making changes
4. **Test the template** using EmailJS's test feature

## ✅ Quick Fix Steps:

1. Go to: https://dashboard.emailjs.com/admin/template
2. Find template: `template_j6ktzo1`
3. Click **Edit**
4. Set **Subject** to: `{{subject}}`
5. Set **Content** to: `{{message_html}}`
6. Click **Save**
7. Try sending a promotion again!

## 🧪 Test Your Template:

In EmailJS dashboard, you can test the template with:
- `subject`: "Test Promotion"
- `message_html`: "<h1>Test</h1><p>This is a test email</p>"

If the test email arrives, your template is correct!

