import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Returns a function that navigates to the booking page directly.
 * No auth check — users can book without signing up.
 */
export const useBookingNavigate = () => {
  const navigate = useNavigate();

  const navigateToBooking = useCallback((bookingPath: string) => {
    navigate(bookingPath);
  }, [navigate]);

  return navigateToBooking;
};
