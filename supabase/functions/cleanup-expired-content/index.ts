 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
 const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const now = new Date().toISOString();
     const today = new Date().toISOString().split('T')[0];
     
     console.log('Starting cleanup of expired content...');
     
     // 1. Delete events that have passed (date < today) and expired (expires_at < now)
     const { data: deletedEvents, error: eventsError } = await supabase
       .from('cached_events')
       .delete()
       .or(`date.lt.${today},expires_at.lt.${now}`)
       .select('slug, title, location');
     
     if (eventsError) {
       console.error('Error deleting events:', eventsError);
     } else {
       console.log(`Deleted ${deletedEvents?.length || 0} expired events`);
     }
     
     // 2. For attractions/accommodations - just log expired ones (we regenerate on access)
     const { count: expiredAttractions } = await supabase
       .from('cached_attractions')
       .select('*', { count: 'exact', head: true })
       .lt('expires_at', now);
     
     const { count: expiredAccommodations } = await supabase
       .from('cached_accommodations')
       .select('*', { count: 'exact', head: true })
       .lt('expires_at', now);
     
     console.log(`Found ${expiredAttractions || 0} expired attractions (will refresh on next access)`);
     console.log(`Found ${expiredAccommodations || 0} expired accommodations (will refresh on next access)`);
     
     // 3. Get statistics
     const { count: totalEvents } = await supabase
       .from('cached_events')
       .select('*', { count: 'exact', head: true });
     
     const { count: totalAttractions } = await supabase
       .from('cached_attractions')
       .select('*', { count: 'exact', head: true });
     
     const { count: totalAccommodations } = await supabase
       .from('cached_accommodations')
       .select('*', { count: 'exact', head: true });
     
     return new Response(JSON.stringify({
       success: true,
       message: 'Cleanup completed',
       stats: {
         deletedEvents: deletedEvents?.length || 0,
         expiredAttractions: expiredAttractions || 0,
         expiredAccommodations: expiredAccommodations || 0,
         remainingEvents: totalEvents || 0,
         totalAttractions: totalAttractions || 0,
         totalAccommodations: totalAccommodations || 0
       }
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
     
   } catch (error) {
     console.error('Cleanup error:', error);
     return new Response(JSON.stringify({
       success: false,
       error: error instanceof Error ? error.message : 'Cleanup failed'
     }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
   }
 });