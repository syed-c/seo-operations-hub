import { supabase } from './lib/supabaseClient';

// Test Supabase connection
async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by trying to fetch roles (a simple read operation)
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection successful:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return { success: false, error: err };
  }
}

// Run the test
testSupabase().then(result => {
  console.log('Test result:', result);
});

export default testSupabase;