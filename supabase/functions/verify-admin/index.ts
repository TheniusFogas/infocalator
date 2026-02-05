 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 
     // Get auth header
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       console.log('Verify-admin: No authorization header');
       return new Response(
         JSON.stringify({ isAdmin: false, error: 'No authorization' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Verify user with anon key (respects RLS)
     const authClient = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } }
     });
 
     const { data: { user }, error: authError } = await authClient.auth.getUser();
     if (authError || !user) {
       console.log('Verify-admin: Invalid user', authError?.message);
       return new Response(
         JSON.stringify({ isAdmin: false, error: 'Invalid authentication' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log(`Verify-admin check for user: ${user.id}`);
 
     // Use service role to check admin status (bypasses RLS for this specific check)
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
     const { data: adminData, error: adminError } = await supabase
       .from('admin_users')
       .select('role, email')
       .eq('user_id', user.id)
       .single();
 
     if (adminError || !adminData) {
       console.log(`User ${user.id} is not admin`);
       return new Response(
         JSON.stringify({ isAdmin: false }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log(`User ${user.id} verified as admin with role: ${adminData.role}`);
     
     return new Response(
       JSON.stringify({ 
         isAdmin: true, 
         role: adminData.role,
         email: adminData.email 
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error in verify-admin:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ isAdmin: false, error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });