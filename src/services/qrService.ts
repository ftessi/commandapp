// QR Code generation service
import QRCode from 'qrcode';

/**
 * Generate QR code as data URL for a session token
 * QR contains: https://yourapp.com/qr/{sessionToken}
 */
export const generateSessionQR = async (sessionToken: string): Promise<string> => {
    try {
        // Get the base URL (use environment variable in production)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        
        const qrUrl = `${baseUrl}/qr/${sessionToken}`;
        
        console.log('🎨 Generating QR code for URL:', qrUrl);
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 400,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        console.log('✅ QR code generated successfully');
        return qrDataUrl;
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        throw error;
    }
};

/**
 * Generate QR code as buffer (for email attachments)
 */
export const generateSessionQRBuffer = async (sessionToken: string): Promise<Buffer> => {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const qrUrl = `${baseUrl}/qr/${sessionToken}`;
        
        console.log('🎨 Generating QR code buffer for URL:', qrUrl);
        
        const qrBuffer = await QRCode.toBuffer(qrUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 400
        });
        
        console.log('✅ QR code buffer generated successfully');
        return qrBuffer;
    } catch (error) {
        console.error('❌ Error generating QR code buffer:', error);
        throw error;
    }
};

/**
 * Get the QR URL for a session token (without generating the image)
 */
export const getSessionQRUrl = (sessionToken: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${baseUrl}/qr/${sessionToken}`;
};
