import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchBarWithSuggestions } from "@/components/SearchBarWithSuggestions";
import { useSearchFocus } from "@/components/PageLayout";
import { ListingCard } from "@/components/ListingCard";
import { TealLoader } from "@/components/ui/teal-loader";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useRatings, sortByRating } from "@/hooks/useRatings";

const TABS = ["All", "Adventure Places", "Guided Trips"] as const;
type Tab = typeof TABS[number];

const CountyDetail = () => {
  const { county } = useParams<{ county: string }>();
  const decodedCounty = decodeURIComponent(county || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const { savedItems, handleSave } = useSavedItems();
  const { position } = useGeolocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [showSearchIcon, setShowSearchIcon] = useState(false);
  const [isSearchFocusedLocal, setIsSearchFocusedLocal] = useState(false);
  const { setSearchFocused } = useSearchFocus();

  const setIsSearchFocused = useCallback((v: boolean) => {
    setIsSearchFocusedLocal(v);
    setSearchFocused(v);
  }, [setSearchFocused]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [adventuresRes, guidedRes] = await Promise.all([
        supabase.from("adventure_places")
          .select("id,name,location,place,country,image_url,gallery_images,images,entry_fee,activities,latitude,longitude,created_at,description,opening_hours,closing_hours")
          .eq("approval_status", "approved").eq("is_hidden", false).eq("place", decodedCounty),
        supabase.from("trips")
          .select("id,name,location,place,country,image_url,gallery_images,images,date,is_custom_date,is_flexible_date,available_tickets,activities,type,created_at,price,price_child,description,opening_hours,closing_hours")
          .eq("approval_status", "approved").eq("is_hidden", false).eq("type", "trip")
          .or("is_flexible_date.eq.true,is_custom_date.eq.true").eq("place", decodedCounty),
      ]);
      const combined = [
        ...(adventuresRes.data || []).map((i: any) => ({ ...i, itemType: "ADVENTURE PLACE" })),
        ...(guidedRes.data || []).map((i: any) => ({ ...i, itemType: "TRIP" })),
      ];
      setItems(combined);
      setLoading(false);
    };
    if (decodedCounty) fetchData();
  }, [decodedCounty]);

  const itemIds = useMemo(() => items.map(i => i.id), [items]);
  const { ratings } = useRatings(itemIds);
  const sorted = useMemo(() => sortByRating(items, ratings, position, calculateDistance), [items, ratings, position]);

  const filtered = useMemo(() => {
    let result = sorted;
    if (activeTab === "Adventure Places") result = result.filter(i => i.itemType === "ADVENTURE PLACE");
    else if (activeTab === "Guided Trips") result = result.filter(i => i.itemType === "TRIP");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.name?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q));
    }
    return result;
  }, [sorted, activeTab, searchQuery]);

  useEffect(() => {
    const handleScroll = () => { if (window.innerWidth >= 768) setShowSearchIcon(window.scrollY > 100); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      <Header className="hidden md:flex" showSearchIcon={showSearchIcon}
        onSearchClick={() => searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <div ref={searchRef} className={cn("bg-card border-b z-50 sticky top-0 md:static", isSearchFocusedLocal && "z-[600]")}>
        <div className="container px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="md:hidden shrink-0 p-2 rounded-lg hover:bg-muted transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <SearchBarWithSuggestions value={searchQuery} onChange={setSearchQuery}
              onSubmit={() => {}} onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)}
              onBack={() => { setIsSearchFocused(false); setSearchQuery(""); }} showBackButton={isSearchFocusedLocal} />
          </div>
        </div>
      </div>

      {/* Tab filters */}
      <div className="sticky top-[52px] md:static z-40 bg-card border-b">
        <div className="container px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0",
                  activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
                )}>{tab}</button>
            ))}
          </div>
        </div>
      </div>

      <main className={cn("container px-4 py-6 transition-opacity duration-200", isSearchFocusedLocal && "pointer-events-none opacity-20")}>
        <h1 className="text-lg font-extrabold mb-4">{decodedCounty} County</h1>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {loading ? (
            <div className="col-span-full"><TealLoader text="Loading..." /></div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground italic">No items found.</div>
          ) : filtered.map(item => {
            const rd = ratings.get(item.id);
            return (
              <ListingCard key={item.id} id={item.id} type={item.itemType}
                name={item.name} imageUrl={item.image_url} location={item.location} country={item.country || ""}
                price={item.price || item.entry_fee} date={item.date} isCustomDate={item.is_custom_date}
                isFlexibleDate={Boolean(item.is_flexible_date || item.is_custom_date)}
                isSaved={savedItems.has(item.id)} activities={item.activities}
                avgRating={rd?.avgRating} reviewCount={rd?.reviewCount} description={item.description}
                galleryImages={item.gallery_images} images={item.images}
                openingHours={item.opening_hours} closingHours={item.closing_hours} />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default CountyDetail;
