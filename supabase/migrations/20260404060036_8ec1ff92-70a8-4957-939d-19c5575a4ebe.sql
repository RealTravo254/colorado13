
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS ticket_types jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS allow_children boolean DEFAULT true;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS location_link text DEFAULT NULL;

ALTER TABLE public.adventure_places ADD COLUMN IF NOT EXISTS location_link text DEFAULT NULL;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS location_link text DEFAULT NULL;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS registration_name text DEFAULT NULL;
