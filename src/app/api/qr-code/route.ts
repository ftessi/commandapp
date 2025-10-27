import { NextRequest, NextResponse } from 'next/server';
import { generateSessionQR } from '@/services/qrService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qr-code?token=xxx
 * Generate QR code as data URL for a session token
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token parameter is required' },
                { status: 400 }
            );
        }

        console.log('🎨 GET /api/qr-code - Generating QR for token:', token.substring(0, 10) + '...');

        // Generate QR code as data URL
        const qrDataUrl = await generateSessionQR(token);

        return NextResponse.json({
            qrDataUrl,
            token
        });
    } catch (error) {
        console.error('❌ Error in GET /api/qr-code:', error);
        return NextResponse.json(
            { error: 'Failed to generate QR code' },
            { status: 500 }
        );
    }
}
