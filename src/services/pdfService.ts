// PDF generation service for QR codes using jsPDF
import { jsPDF } from 'jspdf';

interface TicketPDFData {
    firstName: string;
    lastName: string;
    ticketType: string;
    qrCodeDataUrl: string;
}

/**
 * Generate a PDF with QR code and ticket information
 * Returns a Buffer that can be attached to emails
 */
export const generateTicketPDF = async (data: TicketPDFData): Promise<Buffer> => {
    try {
        // Create PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Header - 7Vite
        doc.setFontSize(28);
        doc.setTextColor(102, 126, 234); // Purple color
        doc.text('7Vite', centerX, 30, { align: 'center' });

        // Subtitle
        doc.setFontSize(18);
        doc.setTextColor(51, 51, 51);
        doc.text('Event Ticket', centerX, 45, { align: 'center' });

        // Ticket details
        doc.setFontSize(12);
        doc.setTextColor(102, 102, 102);
        doc.text(`Name: ${data.firstName} ${data.lastName}`, centerX, 60, { align: 'center' });
        doc.text(`Ticket Type: ${data.ticketType}`, centerX, 70, { align: 'center' });

        // QR Code section label
        doc.setFontSize(14);
        doc.setTextColor(51, 51, 51);
        doc.text('Your Entry QR Code', centerX, 90, { align: 'center' });

        // Add QR code image (centered)
        const qrSize = 80; // mm
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = 100;

        doc.addImage(data.qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // Instructions below QR
        doc.setFontSize(10);
        doc.setTextColor(102, 102, 102);
        doc.text('Scan this QR code at the event entrance', centerX, qrY + qrSize + 10, { align: 'center' });
        doc.text('Keep this PDF or screenshot it for easy access', centerX, qrY + qrSize + 17, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(153, 153, 153);
        doc.text('This is your personal ticket - do not share with others', centerX, 270, { align: 'center' });
        doc.text('For support, contact our event team', centerX, 277, { align: 'center' });

        // Get PDF as buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer;

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        throw error;
    }
};

