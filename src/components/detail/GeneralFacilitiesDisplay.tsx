import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVAILABLE_FACILITIES } from "@/components/creation/GeneralFacilitiesSelector";

const ITEMS_PER_PAGE = 10;

interface GeneralFacilitiesDisplayProps {
  facilityIds: string[];
}

export const GeneralFacilitiesDisplay = ({ facilityIds }: GeneralFacilitiesDisplayProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [mobileShowAll, setMobileShowAll] = useState(false);

  if (!facilityIds || facilityIds.length === 0) return null;

  const facilities = facilityIds
    .map(id => AVAILABLE_FACILITIES.find(f => f.id === id))
    .filter(Boolean);

  if (facilities.length === 0) return null;

  const totalPages = Math.ceil(facilities.length / ITEMS_PER_PAGE);
  const displayedFacilities = showAll
    ? facilities
    : facilities.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const MOBILE_INITIAL = 6;

  return (
    <section className="bg-background rounded-3xl p-4 md:p-6 shadow-sm border border-border">
      <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 md:mb-4 text-muted-foreground">General Facilities</h2>
      
      {/* Mobile: compact horizontal scrolling row */}
      <div className="md:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {(mobileShowAll ? facilities : facilities.slice(0, MOBILE_INITIAL)).map((facility) => {
            if (!facility) return null;
            const Icon = facility.icon;
            return (
              <div
                key={facility.id}
                className="flex-shrink-0 flex flex-col items-center gap-0.5 p-1 rounded-md bg-muted/50 border border-border w-14"
              >
                <div className="p-1 rounded bg-primary/10">
                  <Icon className="h-2.5 w-2.5 text-primary" />
                </div>
                <span className="text-[6px] font-bold text-foreground text-center leading-tight line-clamp-2">{facility.label}</span>
              </div>
            );
          })}
        </div>
        {facilities.length > MOBILE_INITIAL && (
          <button
            onClick={() => setMobileShowAll(!mobileShowAll)}
            className="mt-1.5 text-[10px] font-bold text-primary"
          >
            {mobileShowAll ? "Show Less" : `View More (${facilities.length})`}
          </button>
        )}
      </div>

      {/* Desktop: original grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-3">
          {displayedFacilities.map((facility) => {
            if (!facility) return null;
            const Icon = facility.icon;
            return (
              <div
                key={facility.id}
                className="flex flex-row items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground text-left leading-tight">{facility.label}</span>
              </div>
            );
          })}
        </div>

        {facilities.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {!showAll && totalPages > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground font-bold">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowAll(!showAll); setCurrentPage(1); }}
              className="text-xs font-bold h-8"
            >
              {showAll ? "Show Less" : `View All (${facilities.length})`}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
