// Simple test script to check if we can fetch projects from Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProjectsFetch() {
  console.log('Testing projects fetch...');
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, client, status, health_score, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }
    
    console.log('Projects fetched successfully:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

testProjectsFetch();