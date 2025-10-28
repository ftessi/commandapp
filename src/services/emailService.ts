// Email service using Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface TicketEmailData {
    to: string;
    firstName: string;
    lastName: string;
    ticketType: string;
    price: number;
    qrCodeDataUrl: string;
    sessionToken: string;
    appUrl: string;
}

/**
 * Send ticket confirmation email with QR code
 */
export const sendTicketEmail = async (data: TicketEmailData): Promise<boolean> => {
    try {
        console.log('📧 Sending ticket email to:', data.to);

        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
            return false;
        }

        // Convert data URL to base64 for attachment
        const qrCodeBase64 = data.qrCodeDataUrl.split(',')[1]; // Remove "data:image/png;base64," prefix

        const { data: emailResult, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: [data.to],
            subject: `Your Ticket for Entrance - 7Vite`,
            html: getTicketEmailHTML(data),
            attachments: [
                {
                    filename: 'ticket-qr-code.png',
                    content: qrCodeBase64
                }
            ]
        });

        if (error) {
            console.error('❌ Error sending email:', error);
            return false;
        }

        console.log('✅ Email sent successfully with QR code attachment:', emailResult);
        return true;
    } catch (error) {
        console.error('❌ Error in sendTicketEmail:', error);
        return false;
    }
};

/**
 * Generate HTML for ticket email - Simple clean design
 */
function getTicketEmailHTML(data: TicketEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Ticket Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 30px;
        }
        .ticket-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .ticket-details p {
            margin: 10px 0;
            font-size: 16px;
        }
        .ticket-details strong {
            color: #667eea;
        }
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #ffffff;
            border: 2px solid #667eea;
            border-radius: 10px;
        }
        .qr-section img {
            max-width: 300px;
            width: 100%;
            height: auto;
        }
        .qr-section p {
            margin-top: 15px;
            font-size: 14px;
            color: #666;
        }
        .button {
            display: inline-block;
            padding: 15px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
            background: #f8f9fa;
        }
        .important-note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Ticket Confirmed!</h1>
        </div>
        
        <div class="content">
            <p>Hi ${data.firstName},</p>
            
            <p>Great news! Your ticket has been confirmed and paid for. You're all set for the event!</p>
            
            <div class="ticket-details">
                <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Ticket Type:</strong> Entrance</p>
                <p><strong>Price:</strong> €${data.price.toFixed(2)}</p>
            </div>
            
            <div class="important-note">
                <strong>⚠️ Important:</strong> Save this email! Your QR code is attached as <strong>ticket-qr-code.png</strong>. You'll need it to enter the event and access your orders at the bar.
            </div>
            
            <div class="qr-section">
                <h3>Your Entry QR Code</h3>
                <img src="${data.qrCodeDataUrl}" alt="QR Code" />
                <p>Show this QR code at the entrance to gain entry<br/>and access your orders</p>
                <p><small>Can't see the QR code? Find it attached as <strong>ticket-qr-code.png</strong></small></p>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.appUrl}/qr/${data.sessionToken}" class="button">
                    Open QR
                </a>
            </div>
            
            <p style="margin-top: 30px;">
                <strong>Lost this email?</strong> No problem! Click the button above to view your QR code online.
            </p>
            
            <p>
                See you at the event!<br/>
                <strong>The Event Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>If you have any questions, contact us at support@yourapp.com</p>
        </div>
    </div>
</body>
</html>
    `;
}
