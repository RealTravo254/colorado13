import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search as SearchIcon, Loader2 } from "lucide-react";
import { SearchBarWithSuggestions } from "@/components/SearchBarWithSuggestions";
import { ListingCard } from "@/components/ListingCard";
import { ListingSkeleton } from "@/components/ui/listing-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useRatings, sortByRating } from "@/hooks/useRatings";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { SEOHead } from "@/components/SEOHead";

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { savedItems, handleSave } = useSavedItems();
  const { position } = useGeolocation();

  const allItemIds = useMemo(() => listings.map(l => l.id), [listings]);
  const tripEventIds = useMemo(() => listings.filter(l => l.type === "TRIP" || l.type === "EVENT").map(l => l.id), [listings]);
  const { bookingStats } = useRealtimeBookings(tripEventIds);
  const { ratings } = useRatings(allItemIds);
  const sortedListings = useMemo(() => sortByRating(listings, ratings, position, calculateDistance), [listings, ratings, position]);

  const fetchAllData = useCallback(async (query?: string) => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const fetchTable = async (table: "hotels" | "adventure_places", type: string) => {
      let dbQuery = supabase.from(table).select(table === "hotels"
        ? "id,name,location,place,country,image_url,activities,latitude,longitude,created_at,description"
        : "id,name,location,place,country,image_url,entry_fee,activities,latitude,longitude,created_at,description")
        .eq("approval_status", "approved").eq("is_hidden", false);
      if (query) { const p = `%${query}%`; dbQuery = dbQuery.or(`name.ilike.${p},location.ilike.${p},country.ilike.${p}`); }
      dbQuery = dbQuery.order('created_at', { ascending: false }).limit(15);
      const { data } = await dbQuery;
      return (data || []).map((item: any) => ({ ...item, type }));
    };
    const [events, trips, hotels, adventures] = await Promise.all([
      supabase.from("trips").select("id,name,location,place,country,image_url,date,is_custom_date,is_flexible_date,available_tickets,activities,type,created_at,price,price_child,description")
        .eq("approval_status", "approved").eq("is_hidden", false).eq("type", "event").or(`date.gte.${today},is_flexible_date.eq.true`).order('date', { ascending: true }).limit(15)
        .then(r => (r.data || []).map((i: any) => ({ ...i, type: "EVENT" }))),
      supabase.from("trips").select("id,name,location,place,country,image_url,date,is_custom_date,is_flexible_date,available_tickets,activities,type,created_at,price,price_child,description")
        .eq("approval_status", "approved").eq("is_hidden", false).eq("type", "trip").order('date', { ascending: true }).limit(15)
        .then(r => (r.data || []).map((i: any) => ({ ...i, type: "TRIP" }))),
      fetchTable("hotels", "HOTEL"),
      fetchTable("adventure_places", "ADVENTURE PLACE"),
    ]);
    const combined = [...hotels, ...adventures, ...trips, ...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setListings(combined);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Explore - RealTravo" description="Search and discover trips, hotels, adventures and events" />
      
      {/* Header */}
      <div className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#008080' }}>
        <div className="container mx-auto px-4 py-3">
          <SearchBarWithSuggestions
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => { if (searchQuery.trim()) fetchAllData(searchQuery); }}
            onSuggestionSearch={q => { setSearchQuery(q); fetchAllData(q); }}
            onFocus={() => {}}
            onBlur={() => {}}
            onBack={() => navigate('/')}
            showBackButton={true}
          />
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          {searchQuery ? `Results for "${searchQuery}"` : "All Listings"}
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : sortedListings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedListings.map((listing, index) => {
              const itemDistance = position && listing.latitude && listing.longitude ? calculateDistance(position.latitude, position.longitude, listing.latitude, listing.longitude) : undefined;
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
                  isSaved={savedItems.has(listing.id)} onSave={() => handleSave(listing.id, listing.type)}
                  availableTickets={isTripsOrEvents ? listing.available_tickets : undefined}
                  bookedTickets={isTripsOrEvents ? bookingStats[listing.id] || 0 : undefined}
                  showBadge={true} priority={index < 4}
                  hidePrice={listing.type === "HOTEL" || listing.type === "ADVENTURE PLACE"}
                  activities={listing.activities} distance={itemDistance}
                  avgRating={ratingData?.avgRating} reviewCount={ratingData?.reviewCount}
                  description={listing.description}
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
