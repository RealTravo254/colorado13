import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract IP-based location from Cloudflare/Supabase headers
    const country = req.headers.get("cf-ipcountry") || req.headers.get("x-country") || null;
    const city = req.headers.get("cf-ipcity") || req.headers.get("x-city") || null;
    const latitude = req.headers.get("cf-iplongitude") ? null : null;
    const longitude = req.headers.get("cf-iplongitude") || null;
    const cfLatitude = req.headers.get("cf-iplatitude") || null;
    const cfLongitude = req.headers.get("cf-iplongitude") || null;
    const region = req.headers.get("cf-region") || req.headers.get("x-region") || null;
    const timezone = req.headers.get("cf-timezone") || null;

    return new Response(
      JSON.stringify({
        country,
        city,
        region,
        latitude: cfLatitude ? parseFloat(cfLatitude) : null,
        longitude: cfLongitude ? parseFloat(cfLongitude) : null,
        timezone,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
