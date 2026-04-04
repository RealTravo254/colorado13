import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal, MapPin, Compass, Calendar, Tent, Trophy, X } from "lucide-react";
import { ListingCard } from "@/components/ListingCard";
import { ListingSkeleton } from "@/components/ui/listing-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useRatings, sortByRating } from "@/hooks/useRatings";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FILTER_TABS = [
  { key: "all", label: "All", icon: Compass },
  { key: "adventure", label: "Adventures", icon: Tent },
  { key: "trip", label: "Trips", icon: MapPin },
  { key: "event", label: "Events", icon: Calendar },
];

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { position } = useGeolocation();

  const allItemIds = useMemo(() => listings.map(l => l.id), [listings]);
  const tripEventIds = useMemo(() => listings.filter(l => l.type === "TRIP" || l.type === "EVENT").map(l => l.id), [listings]);
  const { bookingStats } = useRealtimeBookings(tripEventIds);
  const { ratings } = useRatings(allItemIds);
  const sortedListings = useMemo(() => sortByRating(listings, ratings, position, calculateDistance), [listings, ratings, position]);

  const filteredListings = useMemo(() => {
    if (activeFilter === "all") return sortedListings;
    return sortedListings.filter(l => {
      if (activeFilter === "adventure") return l.type === "ADVENTURE PLACE";
      if (activeFilter === "trip") return l.type === "TRIP";
      if (activeFilter === "event") return l.type === "EVENT";
      return true;
    });
  }, [sortedListings, activeFilter]);

  const fetchAllData = useCallback(async (query?: string) => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const qFilter = query ? `%${query}%` : null;

    const buildOr = (q: string) => `name.ilike.${q},location.ilike.${q},country.ilike.${q},place.ilike.${q}`;

    const [events, trips, adventures] = await Promise.all([
      supabase.from("trips")
        .select("id,name,location,place,country,image_url,gallery_images,images,date,is_custom_date,is_flexible_date,available_tickets,activities,type,created_at,price,price_child,description,event_category")
        .eq("approval_status", "approved").eq("is_hidden", false).eq("type", "event")
        .or(`date.gte.${today},is_flexible_date.eq.true`)
        .order('date', { ascending: true }).limit(30)
        .then(r => {
          let data = r.data || [];
          if (qFilter) {
            const q = query!.toLowerCase();
            data = data.filter((i: any) => i.name?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q) || i.country?.toLowerCase().includes(q) || i.place?.toLowerCase().includes(q) || i.event_category?.toLowerCase().includes(q));
          }
          return data.map((i: any) => ({ ...i, type: "EVENT" }));
        }),
      supabase.from("trips")
        .select("id,name,location,place,country,image_url,gallery_images,images,date,is_custom_date,is_flexible_date,available_tickets,activities,type,created_at,price,price_child,description")
        .eq("approval_status", "approved").eq("is_hidden", false).eq("type", "trip")
        .order('date', { ascending: true }).limit(30)
        .then(r => {
          let data = r.data || [];
          if (qFilter) {
            const q = query!.toLowerCase();
            data = data.filter((i: any) => i.name?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q) || i.country?.toLowerCase().includes(q) || i.place?.toLowerCase().includes(q));
          }
          return data.map((i: any) => ({ ...i, type: "TRIP" }));
        }),
      supabase.from("adventure_places")
        .select("id,name,location,place,country,image_url,gallery_images,images,entry_fee,activities,latitude,longitude,created_at,description")
        .eq("approval_status", "approved").eq("is_hidden", false)
        .order('created_at', { ascending: false }).limit(30)
        .then(r => {
          let data = r.data || [];
          if (qFilter) {
            const q = query!.toLowerCase();
            data = data.filter((i: any) => i.name?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q) || i.country?.toLowerCase().includes(q) || i.place?.toLowerCase().includes(q));
          }
          return data.map((i: any) => ({ ...i, type: "ADVENTURE PLACE" }));
        }),
    ]);

    const combined = [...adventures, ...trips, ...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setListings(combined);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleSearch = () => {
    if (searchQuery.trim()) fetchAllData(searchQuery);
    else fetchAllData();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Explore - RealTravo" description="Search and discover trips, adventures and events" />

      {/* Search header */}
      <div className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-primary-foreground p-1">
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search places, events, activities..."
                className="pl-9 pr-4 h-10 rounded-full bg-background border-none text-sm"
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} size="sm" variant="secondary" className="rounded-full h-10 px-4 font-bold text-xs">
              Search
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="container mx-auto px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary-foreground text-primary shadow-sm"
                      : "bg-primary-foreground/20 text-primary-foreground/90 hover:bg-primary-foreground/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 container mx-auto px-4 py-4 pb-24 md:pb-8">
        <p className="text-xs text-muted-foreground mb-3 font-medium">
          {searchQuery ? `Results for "${searchQuery}"` : `${filteredListings.length} listings`}
          {activeFilter !== "all" && ` in ${FILTER_TABS.find(t => t.key === activeFilter)?.label}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(8)].map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <Compass className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No results found</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredListings.map((listing, index) => {
              const ratingData = ratings.get(listing.id);
              const isTripsOrEvents = listing.type === "TRIP" || listing.type === "EVENT";
              const today = new Date().toISOString().split('T')[0];
              const isOutdated = listing.date && !listing.is_flexible_date && listing.date < today;
              return (
                <ListingCard
                  key={listing.id} id={listing.id} type={listing.type}
                  name={listing.name} location={listing.location} country={listing.country}
                  imageUrl={listing.image_url} price={listing.price || listing.entry_fee || 0}
                  date={listing.date} isCustomDate={listing.is_custom_date}
                  isFlexibleDate={listing.is_flexible_date} isOutdated={isOutdated}
                  isSaved={false}
                  availableTickets={isTripsOrEvents ? listing.available_tickets : undefined}
                  bookedTickets={isTripsOrEvents ? bookingStats[listing.id] || 0 : undefined}
                  showBadge={true} priority={index < 4}
                  hidePrice={listing.type === "ADVENTURE PLACE"}
                  activities={listing.activities}
                  avgRating={ratingData?.avgRating} reviewCount={ratingData?.reviewCount}
                  description={listing.description}
                  galleryImages={listing.gallery_images}
                  images={listing.images}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Explore;
