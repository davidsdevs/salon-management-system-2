const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send promotion email to clients via Resend
 * This is a callable function that can be invoked from the client
 */
const sendPromotionEmailFunction = functions.region('us-central1').https.onCall(async (data, context) => {
  console.log('📧 === sendPromotionEmail called ===');
  console.log('Context auth:', context.auth ? `UID: ${context.auth.uid}` : 'Not authenticated');
  console.log('Data received:', JSON.stringify({ 
    to: data.to, 
    subject: data.subject,
    hasHtml: !!data.html 
  }));
  
  // Verify the caller is authenticated
  if (!context.auth) {
    console.error('AUTHENTICATION FAILED: No context.auth');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { to, subject, html, text } = data;

  try {
    // Validate inputs
    if (!to || !subject) {
      throw new functions.https.HttpsError('invalid-argument', 'Email "to" and "subject" are required');
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      throw new functions.https.HttpsError('failed-precondition', 'Email service not configured. Please set RESEND_API_KEY in Firebase Functions environment.');
    }

    console.log('📧 Sending email via Resend...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);

    // Send email via Resend
    const emailData = {
      from: process.env.RESEND_FROM_EMAIL || 'David\'s Salon <noreply@davidsalon.com>',
      to: to,
      subject: subject,
    };

    // Add HTML content if provided
    if (html) {
      emailData.html = html;
    }

    // Add text content if provided (fallback)
    if (text) {
      emailData.text = text;
    } else if (!html) {
      // If no HTML or text, create a simple text version
      emailData.text = subject;
    }

    console.log('📧 Email data prepared, sending...');
    const result = await resend.emails.send(emailData);

    console.log('✅ Email sent successfully via Resend!');
    console.log('✅ Resend response:', result);

    return {
      success: true,
      message: 'Email sent successfully',
      emailId: result.data?.id,
      to: to
    };

  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    // Return a more user-friendly error
    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message || 'Unknown error'}`
    );
  }
});

exports.sendPromotionEmail = sendPromotionEmailFunction;

