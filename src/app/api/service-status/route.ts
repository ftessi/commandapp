import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/services/supabaseClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/service-status
 * Get the current status of services (ordering open/closed)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceName = searchParams.get('service') || 'ordering';

        console.log(`📋 GET /api/service-status - Checking ${serviceName} status`);

        const { data, error } = await supabase
            .from('service_status')
            .select('*')
            .eq('service_name', serviceName)
            .single();

        if (error) {
            console.error('❌ Error fetching service status:', error);
            return NextResponse.json(
                { error: 'Failed to fetch service status' },
                { status: 500 }
            );
        }

        if (!data) {
            // Default to open if no record exists
            return NextResponse.json({
                service_name: serviceName,
                is_open: true,
                message: 'Service status not configured, defaulting to open'
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Unexpected error in GET /api/service-status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/service-status
 * Update service status (open/close)
 * Admin only
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { service_name, is_open } = body;

        if (!service_name || typeof is_open !== 'boolean') {
            return NextResponse.json(
                { error: 'service_name and is_open (boolean) are required' },
                { status: 400 }
            );
        }

        console.log(`📋 PATCH /api/service-status - Setting ${service_name} to ${is_open ? 'open' : 'closed'}`);

        const { data, error } = await supabase
            .from('service_status')
            .update({
                is_open,
                updated_at: new Date().toISOString()
            })
            .eq('service_name', service_name)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating service status:', error);
            return NextResponse.json(
                { error: 'Failed to update service status' },
                { status: 500 }
            );
        }

        console.log(`✅ Service ${service_name} is now ${is_open ? 'OPEN' : 'CLOSED'}`);

        return NextResponse.json({
            message: `Service ${service_name} is now ${is_open ? 'open' : 'closed'}`,
            data
        });
    } catch (error) {
        console.error('❌ Unexpected error in PATCH /api/service-status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
