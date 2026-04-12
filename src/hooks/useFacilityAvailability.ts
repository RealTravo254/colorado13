import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BookedDateRange {
  startDate: string;
  endDate: string;
}

/**
 * Fetches booked date ranges for a specific facility of an item.
 * Used to prevent double booking in MultiStepBooking and ManualBooking.
 */
export const useFacilityAvailability = (itemId: string, facilityName: string) => {
  const [bookedRanges, setBookedRanges] = useState<BookedDateRange[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookedDates = useCallback(async () => {
    if (!itemId || !facilityName) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_details, visit_date")
        .eq("item_id", itemId)
        .in("status", ["confirmed", "pending"])
        .neq("payment_status", "failed");

      if (error) {
        console.error("Error fetching facility bookings:", error);
        return;
      }

      const ranges: BookedDateRange[] = [];
      data?.forEach((booking: any) => {
        const details = booking.booking_details;
        if (!details?.facilities) return;
        
        const facilities = Array.isArray(details.facilities) ? details.facilities : [];
        facilities.forEach((f: any) => {
          if (f.name?.toLowerCase() === facilityName.toLowerCase() && f.startDate && f.endDate) {
            ranges.push({ startDate: f.startDate, endDate: f.endDate });
          }
        });
      });

      setBookedRanges(ranges);
    } catch (err) {
      console.error("Facility availability error:", err);
    } finally {
      setLoading(false);
    }
  }, [itemId, facilityName]);

  useEffect(() => {
    fetchBookedDates();
  }, [fetchBookedDates]);

  /**
   * Check if a specific date falls within any booked range
   */
  const isDateBooked = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return bookedRanges.some(range => {
      return dateStr >= range.startDate && dateStr < range.endDate;
    });
  }, [bookedRanges]);

  /**
   * Check if a date range overlaps with any booked range
   */
  const isRangeAvailable = useCallback((startDate: string, endDate: string): boolean => {
    return !bookedRanges.some(range => {
      return startDate < range.endDate && endDate > range.startDate;
    });
  }, [bookedRanges]);

  return { bookedRanges, isDateBooked, isRangeAvailable, loading, refetch: fetchBookedDates };
};
