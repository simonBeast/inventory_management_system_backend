const nodemailer = require('nodemailer');
const AppExceptions = require('./AppExceptions');
const sendEmail = async options=>{
    const transporter = await nodemailer.createTransport({
        service: 'gmail',
        port: 25,
        auth:{
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    })
    const mailOptions = {
        from: 'Michaele gebru Inventory System <SimonBeast@simon.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
        try{
            await transporter.sendMail(mailOptions);
        }
        catch(e){
           throw new AppExceptions(`can't send Email maybe check you internet connection`);
        }
        
}
const sendLowStockMail = async(details) => {
    let textToSend = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e53935;">⚠️ Low Stock Alert</h2>
        <p>The following products have reached their minimum stock levels. Please reorder them as soon as possible to avoid running out of inventory.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Available Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${
              details.map(detail => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${detail.Product.productName}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${detail.availableQuantity}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
        <p style="margin-top: 20px;">Regards,<br><strong>Inventory Management System</strong></p>
      </div>
    `;
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 25,
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to: process.env.GMAIL_USERNAME,
      subject: '📦 Low Stock Alert - Inventory System',
      html: textToSend
    };
  
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending low stock email:', error);
    }
  };
  
module.exports.sendEmail = sendEmail;

module.exports.sendLowStockMail = sendLowStockMail;