-- Add flexible_end_date column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS flexible_end_date date NULL;

-- Update cleanup function to use flexible_end_date for flexible trips
CREATE OR REPLACE FUNCTION public.cleanup_expired_listings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete fixed-date trips/events that are 5+ days past their date
  DELETE FROM public.trips
  WHERE is_flexible_date = false 
    AND date < (CURRENT_DATE - INTERVAL '5 days')::date;
    
  -- Delete flexible trips that have passed their flexible_end_date
  DELETE FROM public.trips
  WHERE is_flexible_date = true
    AND flexible_end_date IS NOT NULL
    AND flexible_end_date < CURRENT_DATE;
END;
$function$;