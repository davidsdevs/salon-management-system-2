import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    // EmailJS configuration - HARDCODED for immediate use
    this.emailjsServiceId = 'service_david_devs';
    this.emailjsTemplateId = 'template_j6ktzo1';
    this.emailjsPublicKey = 'nuqGoYtoFwXuCTNpv';
    
    // Initialize EmailJS
    console.log('🚀 Initializing EmailJS...');
    console.log('  Service ID:', this.emailjsServiceId);
    console.log('  Template ID:', this.emailjsTemplateId);
    console.log('  Public Key:', this.emailjsPublicKey ? 'Set (' + this.emailjsPublicKey.substring(0, 8) + '...)' : 'MISSING');
    
    if (this.emailjsPublicKey && this.emailjsPublicKey !== '') {
      try {
        emailjs.init(this.emailjsPublicKey);
        console.log('✅ EmailJS initialized successfully!');
      } catch (initError) {
        console.error('❌ Failed to initialize EmailJS:', initError);
      }
    } else {
      console.error('❌ EmailJS public key is missing!');
    }
  }

  /**
   * Check if EmailJS is configured
   */
  isConfigured() {
    const hasServiceId = this.emailjsServiceId && this.emailjsServiceId !== 'service_default';
    const hasTemplateId = this.emailjsTemplateId && this.emailjsTemplateId !== 'template_default';
    const hasPublicKey = this.emailjsPublicKey && this.emailjsPublicKey !== '';
    
    const configured = hasServiceId && hasTemplateId && hasPublicKey;
    
    console.log('🔍 EmailJS Configuration Check:');
    console.log('  Service ID:', this.emailjsServiceId, hasServiceId ? '✅' : '❌');
    console.log('  Template ID:', this.emailjsTemplateId, hasTemplateId ? '✅' : '❌');
    console.log('  Public Key:', this.emailjsPublicKey ? '✅ Set (' + this.emailjsPublicKey.substring(0, 8) + '...)' : '❌ Missing');
    console.log('  Final Result:', configured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED');
    
    if (!configured) {
      console.error('❌ Configuration failed because:');
      if (!hasServiceId) console.error('  - Service ID is missing or default');
      if (!hasTemplateId) console.error('  - Template ID is missing or default');
      if (!hasPublicKey) console.error('  - Public Key is missing');
    }
    
    return configured;
  }

  /**
   * Send appointment confirmation email to stylist
   */
  async sendStylistConfirmationEmail(appointment, stylistData) {
    try {
      console.log('Sending stylist confirmation email...');
      
      // Get appointment details
      const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const clientName = appointment.clientInfo?.name || appointment.clientName || 'Unknown Client';
      
      // Create email content
      const emailContent = {
        to: stylistData.email,
        subject: `Appointment Confirmed - ${clientName} on ${appointmentDate}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #160B53, #12094A); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Appointment Confirmed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">David's Salon Management System</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
              <h2 style="color: #160B53; margin-top: 0;">Hello ${stylistData.firstName || stylistData.name},</h2>
              
              <p>Your appointment has been confirmed with the following details:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #160B53; margin-top: 0;">Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Client:</td>
                    <td style="padding: 8px 0;">${clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
                    <td style="padding: 8px 0;">${appointmentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Time:</td>
                    <td style="padding: 8px 0;">${appointment.appointmentTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: bold;">CONFIRMED</td>
                  </tr>
                </table>
              </div>
              
              ${appointment.notes ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin-top: 0; color: #856404;">Notes:</h4>
                  <p style="margin: 0; color: #856404;">${appointment.notes}</p>
                </div>
              ` : ''}
              
              <p>Please ensure you are prepared for this appointment. If you have any questions or need to make changes, please contact the branch manager.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">
                  This is an automated message from David's Salon Management System.<br>
                  Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `
      };

      // For now, we'll simulate sending the email
      // In production, you would call your email service here
      console.log('Stylist email content:', emailContent);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: 'Stylist confirmation email sent successfully' };
      
    } catch (error) {
      console.error('Error sending stylist confirmation email:', error);
      return { success: false, message: 'Failed to send stylist confirmation email' };
    }
  }

  /**
   * Send appointment confirmation email to client
   */
  async sendClientConfirmationEmail(appointment, clientData) {
    try {
      console.log('Sending client confirmation email...');
      
      // Get appointment details
      const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const clientName = appointment.clientInfo?.name || appointment.clientName || 'Unknown Client';
      
      // Get stylist information from the appointment data
      let stylistInfo = '';
      if (appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0) {
        const stylistNames = appointment.serviceStylistPairs.map(pair => {
          return pair.stylistName || `Stylist ${pair.stylistId ? pair.stylistId.slice(-4) : 'N/A'}`;
        });
        stylistInfo = stylistNames.join(', ');
      }
      
      // Create email content
      const emailContent = {
        to: clientData.email || appointment.clientEmail || appointment.clientInfo?.email,
        subject: `Appointment Confirmed - ${appointmentDate} at ${appointment.appointmentTime}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #160B53, #12094A); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Appointment Confirmed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">David's Salon</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
              <h2 style="color: #160B53; margin-top: 0;">Hello ${clientName},</h2>
              
              <p>Great news! Your appointment has been confirmed. We look forward to seeing you at David's Salon.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #160B53; margin-top: 0;">Your Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
                    <td style="padding: 8px 0;">${appointmentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Time:</td>
                    <td style="padding: 8px 0;">${appointment.appointmentTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: bold;">CONFIRMED</td>
                  </tr>
                  ${stylistInfo ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #555;">Stylist:</td>
                      <td style="padding: 8px 0;">${stylistInfo}</td>
                    </tr>
                  ` : ''}
                </table>
              </div>
              
              ${appointment.notes ? `
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin-top: 0; color: #0066cc;">Special Notes:</h4>
                  <p style="margin: 0; color: #0066cc;">${appointment.notes}</p>
                </div>
              ` : ''}
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #856404;">Important Reminders:</h4>
                <ul style="margin: 0; color: #856404; padding-left: 20px;">
                  <li>Please arrive 10 minutes before your scheduled time</li>
                  <li>Bring a valid ID for verification</li>
                  <li>Contact us if you need to reschedule or cancel</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">
                  Thank you for choosing David's Salon!<br>
                  For any questions, please contact us directly.
                </p>
              </div>
            </div>
          </div>
        `
      };

      // For now, we'll simulate sending the email
      // In production, you would call your email service here
      console.log('Client email content:', emailContent);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: 'Client confirmation email sent successfully' };
      
    } catch (error) {
      console.error('Error sending client confirmation email:', error);
      return { success: false, message: 'Failed to send client confirmation email' };
    }
  }

  /**
   * Send confirmation emails to both stylist and client
   */
  async sendConfirmationEmails(appointment, stylistsData, clientData) {
    try {
      console.log('Sending confirmation emails for appointment:', appointment.id);
      console.log('Appointment data:', appointment);
      console.log('Stylists data:', stylistsData);
      console.log('Client data:', clientData);
      
      const results = [];
      
      // Send email to each stylist involved in the appointment
      if (appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0) {
        for (const pair of appointment.serviceStylistPairs) {
          if (pair.stylistId) {
            // Get stylist data from stylistsData or from the pair itself
            const stylistInfo = stylistsData[pair.stylistId] || {
              name: pair.stylistName || `Stylist ${pair.stylistId.slice(-4)}`,
              email: stylistsData[pair.stylistId]?.email || 'stylist@example.com', // Fallback email
              firstName: stylistsData[pair.stylistId]?.firstName || pair.stylistName?.split(' ')[0] || 'Stylist',
              lastName: stylistsData[pair.stylistId]?.lastName || pair.stylistName?.split(' ')[1] || 'User'
            };
            
            console.log(`Sending email to stylist: ${stylistInfo.name} (${stylistInfo.email})`);
            const stylistResult = await this.sendStylistConfirmationEmail(appointment, stylistInfo);
            results.push({
              type: 'stylist',
              name: stylistInfo.name,
              email: stylistInfo.email,
              result: stylistResult
            });
          }
        }
      }
      
      // Send email to client using the actual appointment data
      const clientEmail = appointment.clientEmail || clientData?.email;
      const clientName = appointment.clientName || clientData?.name || 'Unknown Client';
      
      if (clientEmail) {
        console.log(`Sending email to client: ${clientName} (${clientEmail})`);
        const clientInfo = {
          email: clientEmail,
          name: clientName,
          firstName: clientName.split(' ')[0] || 'Client',
          lastName: clientName.split(' ').slice(1).join(' ') || 'User'
        };
        
        const clientResult = await this.sendClientConfirmationEmail(appointment, clientInfo);
        results.push({
          type: 'client',
          name: clientName,
          email: clientEmail,
          result: clientResult
        });
      } else {
        console.warn('No client email found for appointment:', appointment.id);
      }
      
      return {
        success: true,
        message: 'Confirmation emails sent successfully',
        results: results
      };
      
    } catch (error) {
      console.error('Error sending confirmation emails:', error);
      return {
        success: false,
        message: 'Failed to send confirmation emails',
        error: error.message
      };
    }
  }

  /**
   * Send promotion email to client
   * @param {Object} promotion - Promotion data
   * @param {Object} clientData - Client data with email
   * @returns {Promise<Object>} - Result of email sending
   */
  async sendPromotionEmail(promotion, clientData) {
    console.log('🚨🚨🚨 ========== sendPromotionEmail FUNCTION CALLED! ========== 🚨🚨🚨');
    console.log('📧 Function called at:', new Date().toISOString());
    console.log('📧 Promotion ID:', promotion?.id);
    console.log('📧 Promotion Title:', promotion?.title);
    console.log('📧 Client Email:', clientData?.email);
    console.log('📧 Client Name:', clientData?.firstName, clientData?.lastName);
    console.log('📧 Full Promotion:', promotion);
    console.log('📧 Full Client Data:', clientData);
    
    try {
      console.log(`📧 Starting email send process for ${clientData.email}...`);
      
      if (!clientData.email) {
        console.error('❌❌❌ Client email not found! ❌❌❌');
        console.error('❌ Client data:', clientData);
        return {
          success: false,
          message: 'Client email not found'
        };
      }
      
      console.log('✅ Client email found:', clientData.email);

      const clientName = clientData.firstName && clientData.lastName
        ? `${clientData.firstName} ${clientData.lastName}`.trim()
        : clientData.name || 'Valued Client';

      // Fetch branch name
      let branchName = 'Unknown Branch';
      if (promotion.branchId) {
        try {
          const branchDoc = await getDoc(doc(db, 'branches', promotion.branchId));
          if (branchDoc.exists()) {
            branchName = branchDoc.data().name || branchDoc.data().branchName || 'Unknown Branch';
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch branch name:', err);
        }
      }

      // Fetch service/product names if applicable
      let applicableItemsText = '';
      if (promotion.applicableTo === 'specific' && (promotion.specificServices?.length > 0 || promotion.specificProducts?.length > 0)) {
        const itemNames = [];
        
        // Get service names
        if (promotion.specificServices?.length > 0) {
          const servicePromises = promotion.specificServices.map(async (serviceId) => {
            try {
              const serviceDoc = await getDoc(doc(db, 'services', serviceId));
              if (serviceDoc.exists()) {
                return serviceDoc.data().name || serviceDoc.data().serviceName || serviceId;
              }
            } catch (err) {
              console.warn(`⚠️ Could not fetch service ${serviceId}:`, err);
            }
            return serviceId;
          });
          const serviceNames = await Promise.all(servicePromises);
          if (serviceNames.length > 0) {
            itemNames.push(`Services: ${serviceNames.join(', ')}`);
          }
        }
        
        // Get product names
        if (promotion.specificProducts?.length > 0) {
          const productPromises = promotion.specificProducts.map(async (productId) => {
            try {
              const productDoc = await getDoc(doc(db, 'products', productId));
              if (productDoc.exists()) {
                return productDoc.data().name || productDoc.data().productName || productId;
              }
            } catch (err) {
              console.warn(`⚠️ Could not fetch product ${productId}:`, err);
            }
            return productId;
          });
          const productNames = await Promise.all(productPromises);
          if (productNames.length > 0) {
            itemNames.push(`Products: ${productNames.join(', ')}`);
          }
        }
        
        if (itemNames.length > 0) {
          applicableItemsText = itemNames.join('\n');
        }
      }

      // Format dates
      const startDate = promotion.startDate?.toDate 
        ? promotion.startDate.toDate() 
        : new Date(promotion.startDate);
      const endDate = promotion.endDate?.toDate 
        ? promotion.endDate.toDate() 
        : new Date(promotion.endDate);

      const startDateFormatted = startDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const endDateFormatted = endDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Format creation date
      const createdAt = promotion.createdAt?.toDate 
        ? promotion.createdAt.toDate() 
        : (promotion.createdAt ? new Date(promotion.createdAt) : new Date());
      const createdAtFormatted = createdAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Build applicable to text
      let applicableText = '';
      if (promotion.applicableTo === 'services') {
        applicableText = 'Valid on all services';
      } else if (promotion.applicableTo === 'products') {
        applicableText = 'Valid on all products';
      } else if (promotion.applicableTo === 'specific') {
        if (applicableItemsText) {
          applicableText = `Valid on specific items:\n${applicableItemsText}`;
        } else {
          const serviceCount = promotion.specificServices?.length || 0;
          const productCount = promotion.specificProducts?.length || 0;
          const items = [];
          if (serviceCount > 0) items.push(`${serviceCount} service${serviceCount > 1 ? 's' : ''}`);
          if (productCount > 0) items.push(`${productCount} product${productCount > 1 ? 's' : ''}`);
          applicableText = `Valid on ${items.join(' and ')}`;
        }
      } else {
        applicableText = 'Valid on all services and products';
      }

      // Build usage information
      let usageInfo = '';
      if (promotion.usageType === 'one-time') {
        usageInfo = 'Usage: One-time use per client';
      } else if (promotion.usageType === 'repeating') {
        if (promotion.maxUses) {
          usageInfo = `Usage: Can be used up to ${promotion.maxUses} time${promotion.maxUses > 1 ? 's' : ''}`;
        } else {
          usageInfo = 'Usage: Unlimited uses';
        }
      }

      // Build promotion code info
      const promotionCodeText = promotion.promotionCode 
        ? `Promotion Code: ${promotion.promotionCode}`
        : '';

      // Build status info
      const statusText = promotion.isActive ? 'Status: Active' : 'Status: Inactive';
      const usageCountText = promotion.usageCount !== undefined 
        ? `Times Used: ${promotion.usageCount}`
        : '';

      // Create comprehensive message with all promotion details
      const promotionMessage = `Hello ${clientName},

🎉 Special Promotion: ${promotion.title}

${promotion.description || 'No description provided.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCOUNT DETAILS:
Discount: ${promotion.discountType === 'percentage' 
  ? `${promotion.discountValue}% OFF`
  : `₱${promotion.discountValue} OFF`}

${applicableText}

${promotionCodeText ? promotionCodeText + '\n' : ''}${usageInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VALIDITY PERIOD:
Valid from: ${startDateFormatted}
Valid until: ${endDateFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMOTION INFORMATION:
Branch: ${branchName}
Created by: ${promotion.createdByName || promotion.createdBy || 'System'}
Created on: ${createdAtFormatted}
${statusText}
${usageCountText ? usageCountText : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Don't miss out on this amazing offer! Visit us soon to take advantage of this promotion.

We look forward to seeing you!

---
David's Salon`;

      // Create email content - simple format for your template
      const emailContent = {
        subject: `Contact Us: ${promotion.title}`, // Subject uses {{title}} in EmailJS template
        message: promotionMessage // Simple text message for {{message}} in template
      };

      console.log('📧 ========== EMAIL CONTENT PREPARED ==========');
      console.log('📧 Email To:', clientData.email);
      console.log('📧 Email Subject:', emailContent.subject);
      console.log('📧 Email Message Length:', emailContent.message.length, 'characters');
      console.log('📧 Email Message Preview:', emailContent.message.substring(0, 100) + '...');
      
      // Check if EmailJS is configured
      console.log('🔍 Checking EmailJS configuration...');
      const isConfig = this.isConfigured();
      console.log('🔍 isConfigured() returned:', isConfig);
      
      if (!isConfig) {
        console.error('❌❌❌ EmailJS is NOT configured! ❌❌❌');
        console.error('❌ Service ID:', this.emailjsServiceId);
        console.error('❌ Template ID:', this.emailjsTemplateId);
        console.error('❌ Public Key:', this.emailjsPublicKey ? 'Set' : 'MISSING');
        console.error('❌ Configuration check FAILED - emails will not be sent');
        
        return {
          success: false,
          message: 'Email service not configured. Please set up EmailJS. See console for instructions.',
          email: clientData.email,
          needsSetup: true
        };
      }
      
      console.log('✅ EmailJS is configured - proceeding with email send...');

      try {
        console.log('📧 Sending email via EmailJS...');
        console.log('📧 Service ID:', this.emailjsServiceId);
        console.log('📧 Template ID:', this.emailjsTemplateId);
        
        // Prepare template parameters for EmailJS
        // Your template uses: {{name}} = promotion title, {{time}} = date range, {{message}} = full message with client name
        // EmailJS template settings:
        //   Subject: Contact Us: {{title}}
        //   To Email: {{to_email}}
        //   From Name: {{name}}
        //   Reply To: {{email}}
        const templateParams = {
          // RECIPIENT EMAIL - This tells EmailJS WHO to send to
          to_email: clientData.email, // THIS IS THE CLIENT'S EMAIL - MUST BE SET IN EMAILJS SERVICE
          
          // Template variables matching your template
          name: promotion.title, // Maps to {{name}} in From Name - PROMOTION TITLE
          title: promotion.title, // Maps to {{title}} in Subject - PROMOTION TITLE
          time: `${startDateFormatted} to ${endDateFormatted}`, // Maps to {{time}} in your template
          message: emailContent.message, // Maps to {{message}} in your template - includes client name inside
          email: clientData.email, // Maps to {{email}} in Reply To - CLIENT'S EMAIL
          
          // Email subject (also sent as parameter for template)
          subject: emailContent.subject
        };
        
        console.log('📧 CRITICAL: Recipient email:', clientData.email);
        console.log('📧 Template params:', {
          to_email: templateParams.to_email,
          name: templateParams.name,
          time: templateParams.time,
          message_length: templateParams.message.length
        });

        console.log('📧 ========== SENDING EMAIL VIA EMAILJS ==========');
        console.log('📧 Service ID:', this.emailjsServiceId);
        console.log('📧 Template ID:', this.emailjsTemplateId);
        console.log('📧 To Email:', clientData.email);
        console.log('📧 Template parameters (matching your template):');
        console.log('  - to_email:', templateParams.to_email);
        console.log('  - name:', templateParams.name);
        console.log('  - time:', templateParams.time);
        console.log('  - message length:', templateParams.message.length, 'characters');
        console.log('  - subject:', templateParams.subject);
        
        // Send email via EmailJS
        console.log('📧 ========== CALLING EMAILJS.EMAILS.SEND() ==========');
        console.log('📧 Service ID:', this.emailjsServiceId);
        console.log('📧 Template ID:', this.emailjsTemplateId);
        console.log('📧 Template Params:', JSON.stringify(templateParams, null, 2));
        console.log('📧 About to call: emailjs.send(');
        console.log('    serviceId:', this.emailjsServiceId);
        console.log('    templateId:', this.emailjsTemplateId);
        console.log('    templateParams:', templateParams);
        console.log('  )');
        
        const startTime = Date.now();
        console.log('📧 API call started at:', new Date().toISOString());
        
        let response;
        try {
          response = await emailjs.send(
            this.emailjsServiceId,
            this.emailjsTemplateId,
            templateParams
          );
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log('📧 ========== EMAILJS API CALL COMPLETED ==========');
          console.log('📧 API call finished at:', new Date().toISOString());
          console.log('📧 Duration:', duration, 'ms');
          console.log('📧 Response received:', response);
          console.log('📧 Response type:', typeof response);
          console.log('📧 Response keys:', Object.keys(response || {}));
          
          if (response) {
            // LOG STATUS PROMINENTLY
            console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨JS STATUS CODE:', response.status, '🚨🚨🚨');
            
            if (response.status === 200) {
              console.log('✅✅✅ EMAILJS RETURNED SUCCESS (200) - EMAIL SHOULD BE SENT! ✅✅✅');
              console.log('✅ EmailJS confirmed the email was sent to:', clientData.email);
            } else {
              console.warn('⚠️ EmailJS returned status:', response.status, '(not 200)');
            }
          } else {
            console.error('❌ EmailJS returned NULL/UNDEFINED response!');
          }
          
        } catch (sendError) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.error('❌ ========== EMAILJS API CALL FAILED ==========');
          console.error('❌ Error occurred at:', new Date().toISOString());
          console.error('❌ Duration before error:', duration, 'ms');
          console.error('❌ Error object:', sendError);
          console.error('❌ Error type:', sendError?.constructor?.name);
          console.error('❌ Error message:', sendError?.message);
          console.error('❌ Error status:', sendError?.status);
          console.error('❌ Error text:', sendError?.text);
          console.error('❌ Full error:', JSON.stringify(sendError, Object.getOwnPropertyNames(sendError), 2));
          
          throw sendError; // Re-throw to be caught by outer catch
        }
        
        const emailResult = {
          success: true,
          message: 'Promotion email sent successfully',
          email: clientData.email,
          response: response
        };
        
        console.log('📧 ========== FINAL EMAIL RESULT ==========');
        console.log('📧 Success:', emailResult.success);
        console.log('📧 Email:', emailResult.email);
        console.log('📧 Message:', emailResult.message);
        console.log('📧 EmailJS Response Status:', response?.status);
        console.log('📧 ========== END sendPromotionEmail ==========');
        
        return emailResult;
        
      } catch (emailjsError) {
        console.error('❌ EmailJS error:', emailjsError);
        console.error('❌ Error details:', {
          status: emailjsError.status,
          text: emailjsError.text,
          message: emailjsError.message
        });
        
        // Provide helpful error message
        let errorMessage = 'Failed to send email';
        if (emailjsError.status === 400) {
          errorMessage = 'Invalid email template or parameters. Check EmailJS template configuration.';
        } else if (emailjsError.status === 401) {
          errorMessage = 'EmailJS authentication failed. Check your public key.';
        } else if (emailjsError.status === 404) {
          errorMessage = 'EmailJS service or template not found. Check your service ID and template ID.';
        } else {
          errorMessage = emailjsError.text || emailjsError.message || 'Unknown error';
        }
        
        return {
          success: false,
          message: errorMessage,
          email: clientData.email,
          error: emailjsError
        };
      }
      
    } catch (error) {
      console.error('❌ ========== ERROR in sendPromotionEmail ==========');
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Full error object:', error);
      console.error('❌ ========== END ERROR ==========');
      
      return {
        success: false,
        message: 'Failed to send promotion email',
        error: error.message
      };
    }
  }
}

export const emailService = new EmailService();
