import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a function that navigates to the booking page,
 * or redirects to auth (with return path) if not logged in.
 */
export const useBookingNavigate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigateToBooking = useCallback((bookingPath: string) => {
    if (!user) {
      navigate("/auth", { state: { returnTo: bookingPath } });
    } else {
      navigate(bookingPath);
    }
  }, [user, navigate]);

  return navigateToBooking;
};
