/**
 * Run the service_status migration
 * This creates the service_status table to control if ordering is open or closed
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('📋 Running service_status migration...\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_service_status.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        console.log('\n');

        // Split by semicolons and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.startsWith('COMMENT')) {
                // Skip comments - not supported in Supabase client
                console.log('⏭️  Skipping COMMENT statement');
                continue;
            }

            console.log('⚡ Executing statement...');
            const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                // Try direct query as fallback
                const { error: queryError } = await supabase.from('_').select().limit(0);
                
                if (queryError && queryError.message.includes('does not exist')) {
                    console.log('⚠️  Using alternative approach for table creation...');
                    
                    // For Supabase, we need to use the SQL editor or direct connection
                    console.log('\n📝 Please run this SQL directly in your Supabase SQL Editor:');
                    console.log('https://supabase.com/dashboard/project/_/sql\n');
                    console.log(migrationSQL);
                    console.log('\n');
                    return;
                }
                
                throw error;
            }

            console.log('✅ Statement executed successfully');
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Checking service_status table...');

        // Verify the table was created
        const { data, error } = await supabase
            .from('service_status')
            .select('*');

        if (error) {
            console.error('❌ Error checking table:', error);
        } else {
            console.log('✅ Table exists with data:', data);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
