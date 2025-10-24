import { doc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class ReceiptService {
  /**
   * Generate receipt data for a transaction
   * @param {Object} transaction - Transaction data
   * @param {Object} branchData - Branch information
   * @param {Object} clientData - Client information
   * @returns {Object} - Receipt data
   */
  generateReceiptData(transaction, branchData, clientData) {
    const receiptData = {
      receiptId: `RCP-${transaction.id.slice(-8)}`,
      transactionId: transaction.id,
      branchId: transaction.branchId,
      branchName: branchData?.name || 'David\'s Salon',
      branchAddress: branchData?.address || '',
      branchPhone: branchData?.contactNumber || '',
      branchEmail: branchData?.email || '',
      
      clientId: transaction.clientId,
      clientName: clientData?.name || 'Walk-in Customer',
      clientPhone: clientData?.phone || '',
      clientEmail: clientData?.email || '',
      
      items: transaction.items || [],
      subtotal: transaction.subtotal || 0,
      discount: transaction.discount || 0,
      loyaltyUsed: transaction.loyaltyUsed || 0,
      tax: transaction.tax || 0,
      total: transaction.total || 0,
      paymentMethod: transaction.paymentMethod || 'cash',
      
      loyaltyEarned: transaction.loyaltyEarned || 0,
      loyaltyBalance: clientData?.loyaltyPoints || 0,
      
      createdAt: transaction.createdAt,
      createdBy: transaction.createdBy,
      
      // Receipt formatting
      receiptNumber: this.generateReceiptNumber(),
      printedAt: new Date(),
      isVoid: false
    };

    return receiptData;
  }

  /**
   * Generate a unique receipt number
   * @returns {string} - Receipt number
   */
  generateReceiptNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    
    return `RCP${year}${month}${day}${time}`;
  }

  /**
   * Save receipt to Firestore
   * @param {Object} receiptData - Receipt data
   * @returns {Promise<string>} - Receipt document ID
   */
  async saveReceipt(receiptData) {
    try {
      const receiptRef = await addDoc(collection(db, 'receipts'), {
        ...receiptData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return receiptRef.id;
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw new Error('Failed to save receipt');
    }
  }

  /**
   * Generate HTML receipt for printing/display
   * @param {Object} receiptData - Receipt data
   * @returns {string} - HTML content
   */
  generateHTMLReceipt(receiptData) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${receiptData.receiptNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          .receipt {
            max-width: 300px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .business-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .business-details {
            font-size: 10px;
            color: #666;
          }
          .receipt-info {
            margin-bottom: 15px;
          }
          .receipt-number {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .date-time {
            font-size: 10px;
            color: #666;
          }
          .client-info {
            margin-bottom: 15px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .client-name {
            font-weight: bold;
            margin-bottom: 3px;
          }
          .client-details {
            font-size: 10px;
            color: #666;
          }
          .items-table {
            width: 100%;
            margin-bottom: 15px;
          }
          .items-table th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 5px 0;
            font-size: 10px;
          }
          .items-table td {
            padding: 3px 0;
            font-size: 11px;
          }
          .item-name {
            width: 60%;
          }
          .item-qty {
            width: 15%;
            text-align: center;
          }
          .item-price {
            width: 25%;
            text-align: right;
          }
          .totals {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-bottom: 15px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .total-line.final {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .payment-info {
            margin-bottom: 15px;
            padding: 8px;
            background: #f0f8ff;
            border-radius: 4px;
          }
          .loyalty-info {
            margin-bottom: 15px;
            padding: 8px;
            background: #fff8dc;
            border-radius: 4px;
            font-size: 10px;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 10px;
            font-size: 10px;
            color: #666;
          }
          .thank-you {
            font-weight: bold;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="business-name">${receiptData.branchName}</div>
            <div class="business-details">
              ${receiptData.branchAddress}<br>
              ${receiptData.branchPhone}<br>
              ${receiptData.branchEmail}
            </div>
          </div>

          <div class="receipt-info">
            <div class="receipt-number">Receipt #: ${receiptData.receiptNumber}</div>
            <div class="date-time">Date: ${formatDate(receiptData.createdAt)}</div>
          </div>

          ${receiptData.clientName !== 'Walk-in Customer' ? `
          <div class="client-info">
            <div class="client-name">${receiptData.clientName}</div>
            <div class="client-details">
              ${receiptData.clientPhone ? `Phone: ${receiptData.clientPhone}` : ''}
              ${receiptData.clientEmail ? `<br>Email: ${receiptData.clientEmail}` : ''}
            </div>
          </div>
          ` : ''}

          <table class="items-table">
            <thead>
              <tr>
                <th class="item-name">Item</th>
                <th class="item-qty">Qty</th>
                <th class="item-price">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.items.map(item => `
                <tr>
                  <td class="item-name">${item.name}</td>
                  <td class="item-qty">${item.quantity || 1}</td>
                  <td class="item-price">${formatCurrency(item.price * (item.quantity || 1))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(receiptData.subtotal)}</span>
            </div>
            ${receiptData.discount > 0 ? `
            <div class="total-line">
              <span>Discount:</span>
              <span>-${formatCurrency(receiptData.discount)}</span>
            </div>
            ` : ''}
            ${receiptData.loyaltyUsed > 0 ? `
            <div class="total-line">
              <span>Loyalty Points:</span>
              <span>-${formatCurrency(receiptData.loyaltyUsed)}</span>
            </div>
            ` : ''}
            <div class="total-line">
              <span>Tax (12%):</span>
              <span>${formatCurrency(receiptData.tax)}</span>
            </div>
            <div class="total-line final">
              <span>TOTAL:</span>
              <span>${formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          <div class="payment-info">
            <strong>Payment Method:</strong> ${receiptData.paymentMethod.toUpperCase()}
          </div>

          ${receiptData.loyaltyEarned > 0 ? `
          <div class="loyalty-info">
            <strong>Loyalty Points Earned:</strong> ${receiptData.loyaltyEarned} points<br>
            <strong>New Balance:</strong> ${receiptData.loyaltyBalance + receiptData.loyaltyEarned} points
          </div>
          ` : ''}

          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div>Please keep this receipt for your records</div>
            <div>Visit us again soon!</div>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Print receipt
   * @param {Object} receiptData - Receipt data
   */
  async printReceipt(receiptData) {
    const html = this.generateHTMLReceipt(receiptData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  /**
   * Download receipt as HTML file
   * @param {Object} receiptData - Receipt data
   */
  downloadReceipt(receiptData) {
    const html = this.generateHTMLReceipt(receiptData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${receiptData.receiptNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Email receipt to client
   * @param {Object} receiptData - Receipt data
   * @param {string} email - Client email
   */
  async emailReceipt(receiptData, email) {
    try {
      // This would integrate with an email service
      // For now, we'll just log the action
      console.log(`Emailing receipt ${receiptData.receiptNumber} to ${email}`);
      
      // In a real implementation, this would call a cloud function
      // that sends the email with the receipt attached
    } catch (error) {
      console.error('Error emailing receipt:', error);
      throw new Error('Failed to email receipt');
    }
  }

  /**
   * Void a receipt
   * @param {string} receiptId - Receipt ID
   * @param {string} reason - Reason for voiding
   * @param {string} userId - User ID who voided the receipt
   */
  async voidReceipt(receiptId, reason, userId) {
    try {
      const receiptRef = doc(db, 'receipts', receiptId);
      await updateDoc(receiptRef, {
        isVoid: true,
        voidReason: reason,
        voidedBy: userId,
        voidedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error voiding receipt:', error);
      throw new Error('Failed to void receipt');
    }
  }
}

export const receiptService = new ReceiptService();
export default receiptService;
