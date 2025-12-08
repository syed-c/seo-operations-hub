// Test environment variables
console.log('Environment Variables Test:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]');
console.log('SUPABASE_SERVICE_ROLE_KEY:', import.meta.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]');

// Check if values are properly loaded
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is not set');
} else {
  console.log('✅ VITE_SUPABASE_URL is set');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set');
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY is set');
}

export {};