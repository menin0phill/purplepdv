import { createClient } from '@supabase/supabase-js'; 

const supabase = createClient(
  'https://ryodvzcrisfctuiewyrk.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5b2R2emNyaXNmY3R1aWV3eXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDM2MzQsImV4cCI6MjEwMDExOTYzNH0.ge_g5aMGJV6t8DZlYdT3QjAsGTArI6OLcs70E2mxNnU'
); 
async function run() { 
  const yesterday = '2026-07-29T15:41:32.000Z'; 
  const { data: up, error: err2 } = await supabase.from('sales').update({ date: yesterday, updated_at: new Date().toISOString() }).eq('id', 's_1788460892444'); 
  console.log('Update:', err2 ? err2 : 'Success'); 
} 
run();
