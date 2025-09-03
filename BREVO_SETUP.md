# Brevo Email OTP Setup Guide

## Overview
This guide explains how to set up Brevo (formerly Sendinblue) for email OTP verification in your David's Salon Management System.

## Prerequisites
1. Brevo account (free tier available)
2. Verified sender domain or email address
3. API key from Brevo

## Step 1: Create Brevo Account
1. Go to [brevo.com](https://brevo.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get API Key
1. Log in to Brevo dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy the generated API key

## Step 3: Verify Sender
1. Go to **Settings** → **Senders & IP**
2. Add your sender email (e.g., noreply@davidsalon.com)
3. Verify the email address

## Step 4: Configure Environment Variables
1. Create a `.env` file in your project root
2. Add your Brevo API key:
```env
REACT_APP_BREVO_API_KEY=your_actual_api_key_here
```

## Step 5: Update Brevo Integration
1. Open `src/brevo.js`
2. Replace the mock implementation with the actual Brevo code
3. Uncomment the production code section
4. Remove the mock console.log statements

## Step 6: Test Email Sending
1. Start your development server
2. Go through the registration process
3. Check the console for OTP codes (in development)
4. Verify emails are sent (in production)

## Production Deployment
- Ensure your `.env` file is properly configured
- Set environment variables in your hosting platform
- Test email delivery in production environment

## Troubleshooting
- **API Key Issues**: Verify your API key is correct
- **Sender Verification**: Ensure your sender email is verified
- **Rate Limits**: Check Brevo's sending limits for your plan
- **Email Delivery**: Check spam folders and email provider settings

## Support
- [Brevo Documentation](https://developers.brevo.com/)
- [Brevo Support](https://www.brevo.com/support/)
- [Email Templates](https://www.brevo.com/email-templates/)

## Security Notes
- Never commit your API key to version control
- Use environment variables for sensitive data
- Regularly rotate your API keys
- Monitor your email sending activity
