import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { email, amount, bookingData, callbackUrl } = body;

    if (!email || !amount) {
      throw new Error("Email and amount are required");
    }

    // First, cleanup stale pending bookings for this item
    await supabase.rpc('cleanup_stale_pending_bookings');

    const amountInCents = Math.round(amount * 100);
    const reference = `PAY_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create a PENDING booking to lock slots and prevent double booking
    const visitDate = bookingData?.visit_date || null;
    const { data: pendingBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert([{
        user_id: bookingData?.user_id || null,
        item_id: bookingData?.item_id,
        booking_type: bookingData?.booking_type,
        total_amount: Number(bookingData?.total_amount || amount),
        status: "pending",
        payment_status: "pending",
        payment_method: "card",
        is_guest_booking: bookingData?.is_guest_booking || false,
        guest_name: bookingData?.guest_name,
        guest_email: bookingData?.guest_email,
        guest_phone: bookingData?.guest_phone || null,
        slots_booked: bookingData?.slots_booked || 1,
        visit_date: visitDate,
        booking_details: bookingData?.booking_details || {},
        referral_tracking_id: bookingData?.referral_tracking_id || null,
      }])
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating pending booking:", bookingError);
      // If capacity error, return user-friendly message
      if (bookingError.message?.includes('Sold out') || bookingError.message?.includes('not available')) {
        throw new Error(bookingError.message);
      }
      throw new Error("Failed to reserve your booking slot. Please try again.");
    }

    console.log("Pending booking created:", pendingBooking?.id);

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInCents,
        reference,
        currency: "KES",
        callback_url: callbackUrl || `${supabaseUrl}/functions/v1/paystack-callback`,
        metadata: {
          booking_id: pendingBooking?.id,
          booking_data: bookingData,
          custom_fields: [
            {
              display_name: "Booking Type",
              variable_name: "booking_type",
              value: bookingData?.booking_type || "unknown",
            },
            {
              display_name: "Item Name",
              variable_name: "item_name",
              value: bookingData?.emailData?.itemName || "Booking",
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      // Payment init failed - cancel the pending booking
      await supabase
        .from("bookings")
        .update({ status: 'cancelled', payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq("id", pendingBooking?.id);
      
      console.error("Paystack error:", paystackData);
      throw new Error(paystackData.message || "Failed to initialize payment");
    }

    // Store payment record with booking_id reference
    const { error: paymentError } = await supabase.from("payments").insert([{
      checkout_request_id: reference,
      phone_number: email,
      amount: amount,
      account_reference: reference,
      payment_status: "pending",
      booking_data: { ...bookingData, pending_booking_id: pendingBooking?.id },
      host_id: bookingData?.host_id || null,
      user_id: bookingData?.user_id || null,
    }]);

    if (paymentError) {
      console.error("Error storing payment:", paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paystackData.data.reference,
          pending_booking_id: pendingBooking?.id,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Paystack initialize error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
