
-- Update validate_booking_capacity to exclude stale pending bookings (>15 min old)
CREATE OR REPLACE FUNCTION public.validate_booking_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_capacity integer;
  v_already integer;
  v_request integer;
BEGIN
  IF new.status IN ('cancelled', 'rejected') THEN
    RETURN new;
  END IF;
  IF COALESCE(new.payment_status, 'pending') = 'failed' THEN
    RETURN new;
  END IF;

  IF new.booking_type = 'hotel' AND new.visit_date IS NULL THEN
    RAISE EXCEPTION 'Visit date is required for hotel bookings.';
  END IF;

  IF new.booking_type IN ('trip', 'event') THEN
    SELECT COALESCE(t.available_tickets, 0) INTO v_capacity
    FROM public.trips t
    WHERE t.id = new.item_id;
  ELSIF new.booking_type = 'hotel' THEN
    SELECT COALESCE(h.available_rooms, 0) INTO v_capacity
    FROM public.hotels h
    WHERE h.id = new.item_id;
  ELSIF new.booking_type IN ('adventure', 'adventure_place') THEN
    SELECT COALESCE(a.available_slots, 0) INTO v_capacity
    FROM public.adventure_places a
    WHERE a.id = new.item_id;
  ELSE
    RETURN new;
  END IF;

  IF v_capacity IS NULL OR v_capacity <= 0 THEN
    RAISE EXCEPTION 'This item is not available for booking.';
  END IF;

  v_request := GREATEST(COALESCE(new.slots_booked, 1), 1);

  -- First, auto-cancel stale pending bookings (older than 15 min)
  UPDATE public.bookings
  SET status = 'cancelled', payment_status = 'expired', updated_at = NOW()
  WHERE item_id = new.item_id
    AND status = 'pending'
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '15 minutes';

  SELECT COALESCE(SUM(COALESCE(b.slots_booked, 1)), 0)
  INTO v_already
  FROM public.bookings b
  WHERE b.item_id = new.item_id
    AND b.id <> COALESCE(new.id, '00000000-0000-0000-0000-000000000000')::uuid
    AND (b.visit_date = new.visit_date OR (b.visit_date IS NULL AND new.visit_date IS NULL))
    AND b.status NOT IN ('cancelled', 'rejected')
    AND COALESCE(b.payment_status, 'pending') NOT IN ('failed', 'expired');

  IF (v_already + v_request) > v_capacity THEN
    RAISE EXCEPTION 'Sold out for the selected date. Please choose another date.';
  END IF;

  RETURN new;
END;
$function$;

-- Cleanup function for stale pending bookings
CREATE OR REPLACE FUNCTION public.cleanup_stale_pending_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.bookings
  SET status = 'cancelled', payment_status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '15 minutes';
END;
$function$;

-- Update recompute functions to also clean stale pending bookings
CREATE OR REPLACE FUNCTION public.recompute_item_availability_by_date(p_item_id text, p_visit_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total integer;
BEGIN
  IF p_item_id IS NULL OR p_visit_date IS NULL THEN
    RETURN;
  END IF;

  -- Auto-expire stale pending bookings
  UPDATE public.bookings
  SET status = 'cancelled', payment_status = 'expired', updated_at = NOW()
  WHERE item_id = p_item_id
    AND visit_date = p_visit_date
    AND status = 'pending'
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '15 minutes';

  SELECT COALESCE(SUM(COALESCE(b.slots_booked, 1)), 0)
  INTO v_total
  FROM public.bookings b
  WHERE b.item_id = p_item_id
    AND b.visit_date = p_visit_date
    AND b.status NOT IN ('cancelled', 'rejected')
    AND COALESCE(b.payment_status, 'pending') NOT IN ('failed', 'expired');

  INSERT INTO public.item_availability_by_date (item_id, visit_date, booked_slots, updated_at)
  VALUES (p_item_id, p_visit_date, v_total, now())
  ON CONFLICT (item_id, visit_date)
  DO UPDATE SET booked_slots = excluded.booked_slots, updated_at = excluded.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recompute_item_availability_overall(p_item_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total integer;
BEGIN
  IF p_item_id IS NULL THEN
    RETURN;
  END IF;

  -- Auto-expire stale pending bookings
  UPDATE public.bookings
  SET status = 'cancelled', payment_status = 'expired', updated_at = NOW()
  WHERE item_id = p_item_id
    AND status = 'pending'
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '15 minutes';

  SELECT COALESCE(SUM(COALESCE(b.slots_booked, 1)), 0)
  INTO v_total
  FROM public.bookings b
  WHERE b.item_id = p_item_id
    AND b.status NOT IN ('cancelled', 'rejected')
    AND COALESCE(b.payment_status, 'pending') NOT IN ('failed', 'expired');

  INSERT INTO public.item_availability_overall (item_id, booked_slots, updated_at)
  VALUES (p_item_id, v_total, now())
  ON CONFLICT (item_id)
  DO UPDATE SET booked_slots = excluded.booked_slots, updated_at = excluded.updated_at;
END;
$function$;
