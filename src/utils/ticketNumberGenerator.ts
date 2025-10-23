// Ticket number generation utility
// Generates: TI-XXX (tickets, 3 digits) or DR-XXXX (drinks, 4 digits)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export type TicketType = 'ticket' | 'drink';

/**
 * Determines if order is drinks-only based on product IDs
 * Products 1-20 are drinks, 21+ are tickets/food
 */
export function getTicketType(productIds: number[]): TicketType {
    // If ALL products are drinks (ID <= 20), it's a drink order
    const allDrinks = productIds.every(id => id <= 20);
    return allDrinks ? 'drink' : 'ticket';
}

/**
 * Generate next ticket number based on type
 * TI-XXX: tickets (001-999)
 * DR-XXXX: drinks (0001-9999)
 */
export async function generateTicketNumber(type: TicketType): Promise<string> {
    const prefix = type === 'ticket' ? 'TI' : 'DR';
    const digits = type === 'ticket' ? 3 : 4;
    const maxNumber = type === 'ticket' ? 999 : 9999;

    try {
        // Get current counter from Supabase
        const { data, error } = await supabase
            .from('ticket_counters')
            .select('current_number')
            .eq('type', type)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error fetching ticket counter:', error);
            throw new Error('Failed to generate ticket number');
        }

        let currentNumber = data?.current_number || 0;
        currentNumber = (currentNumber % maxNumber) + 1; // Increment and wrap around

        // Update counter in database
        const { error: updateError } = await supabase
            .from('ticket_counters')
            .upsert({
                type,
                current_number: currentNumber,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'type'
            });

        if (updateError) {
            console.error('Error updating ticket counter:', updateError);
            // Continue anyway with generated number
        }

        // Format number with leading zeros
        const formattedNumber = currentNumber.toString().padStart(digits, '0');
        return `${prefix}-${formattedNumber}`;

    } catch (err) {
        console.error('Error in generateTicketNumber:', err);
        // Fallback: use timestamp-based number
        const fallbackNum = Date.now() % maxNumber;
        return `${prefix}-${fallbackNum.toString().padStart(digits, '0')}`;
    }
}

/**
 * Reset counter for a specific type (admin function)
 */
export async function resetTicketCounter(type: TicketType): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ticket_counters')
            .update({ current_number: 0, updated_at: new Date().toISOString() })
            .eq('type', type);

        return !error;
    } catch (err) {
        console.error('Error resetting counter:', err);
        return false;
    }
}
