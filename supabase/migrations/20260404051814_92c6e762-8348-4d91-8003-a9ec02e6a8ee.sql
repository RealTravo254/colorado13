ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS inclusions text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS exclusions text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS event_category text DEFAULT NULL;