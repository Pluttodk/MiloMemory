// filepath: c:\Code\dev\FindFriends\src\config\supabase.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export configuration
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  supabase: {
    url: supabaseUrl,
    key: supabaseKey,
    projectName: process.env.SUPABASE_PROJECT_NAME || 'MiloMemory'
  }
};