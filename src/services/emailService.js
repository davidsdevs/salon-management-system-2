import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

class EmailService {
  constructor() {
    // For now, we'll use a simple email service
    // In production, you would integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Firebase Functions with Nodemailer
    // - EmailJS for client-side sending
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
}

export const emailService = new EmailService();
