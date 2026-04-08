import { useState, useCallback } from "react";
import PaystackPop from "@paystack/inline-js";
import { supabase } from "@/integrations/supabase/client";
import { getReferralTrackingId } from "@/lib/referralUtils";

interface PaystackPopupOptions {
  onSuccess?: (reference: string, bookingData: any) => void;
  onVerifying?: () => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

interface BookingData {
  item_id: string;
  booking_type: string;
  total_amount: number;
  booking_details: Record<string, any>;
  user_id?: string | null;
  is_guest_booking: boolean;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  visit_date: string;
  slots_booked: number;
  host_id?: string;
  referral_tracking_id?: string | null;
  emailData?: {
    itemName: string;
  };
}

export const usePaystackPopup = (options: PaystackPopupOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  const cancelPendingBooking = useCallback(async (bookingId: string) => {
    try {
      await supabase
        .from("bookings")
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq("id", bookingId)
        .eq("status", "pending");
      console.log("Cancelled pending booking:", bookingId);
    } catch (err) {
      console.error("Error cancelling pending booking:", err);
    }
  }, []);

  const initiatePayment = useCallback(async (
    email: string,
    amount: number,
    bookingData: BookingData
  ) => {
    setIsLoading(true);
    setPaymentStatus('pending');
    setErrorMessage(null);

    try {
      const bookingDataWithReferral = {
        ...bookingData,
        referral_tracking_id: getReferralTrackingId(),
      };

      // Initialize transaction - this also creates a pending booking
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          email,
          amount,
          bookingData: bookingDataWithReferral,
          callbackUrl: `${window.location.origin}/payment/verify`,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to initialize payment');
      }

      const { access_code, reference, pending_booking_id } = data.data;
      setPendingBookingId(pending_booking_id);

      if (!access_code) {
        throw new Error('No access code received from payment initialization');
      }

      sessionStorage.setItem('paystack_reference', reference);
      sessionStorage.setItem('paystack_booking_data', JSON.stringify(bookingDataWithReferral));
      if (pending_booking_id) {
        sessionStorage.setItem('pending_booking_id', pending_booking_id);
      }

      // Open Paystack popup
      const popup = new PaystackPop();
      
      popup.resumeTransaction(access_code, {
        onSuccess: async (transaction: any) => {
          console.log('Payment successful:', transaction);
          setPaymentStatus('success');
          options.onVerifying?.();
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('paystack-verify', {
              body: { reference: transaction.reference },
            });

            if (verifyError || !verifyData?.success) {
              console.error('Verification error:', verifyError || verifyData?.error);
            }

            sessionStorage.removeItem('paystack_reference');
            sessionStorage.removeItem('paystack_booking_data');
            sessionStorage.removeItem('pending_booking_id');

            options.onSuccess?.(transaction.reference, verifyData?.data);
          } catch (err) {
            console.error('Error verifying payment:', err);
            options.onSuccess?.(transaction.reference, bookingDataWithReferral);
          }
        },
        onCancel: () => {
          console.log('Payment cancelled');
          // Cancel the pending booking to free up slots
          if (pending_booking_id) {
            cancelPendingBooking(pending_booking_id);
          }
          setPendingBookingId(null);
          setPaymentStatus('idle');
          setIsLoading(false);
          sessionStorage.removeItem('pending_booking_id');
          options.onClose?.();
        },
      });

    } catch (error: any) {
      console.error('Paystack payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message);
      setIsLoading(false);
      options.onError?.(error.message);
    }
  }, [options, cancelPendingBooking]);

  const resetPayment = useCallback(() => {
    // Cancel any pending booking when resetting
    if (pendingBookingId) {
      cancelPendingBooking(pendingBookingId);
      setPendingBookingId(null);
    }
    setPaymentStatus('idle');
    setErrorMessage(null);
    setIsLoading(false);
  }, [pendingBookingId, cancelPendingBooking]);

  return {
    initiatePayment,
    isLoading,
    paymentStatus,
    errorMessage,
    resetPayment,
    pendingBookingId,
  };
};
