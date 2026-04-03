import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailNavBarProps {
  scrolled: boolean;
  itemName: string;
  isSaved: boolean;
  onSave: () => void;
  onBack: () => void;
  onShare?: () => void;
}

const TEAL = "#008080";

export const DetailNavBar = ({
  scrolled,
  itemName,
  isSaved,
  onSave,
  onBack,
  onShare,
}: DetailNavBarProps) => {
  return (
    <>
      {/* ── Always-visible nav bar (mobile + desktop) ── */}
      <div
        className="fixed top-0 left-0 right-0 z-[100]"
      >
        {/* Mobile teal bar */}
        <div className="md:hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', backgroundColor: TEAL }}>
          <div className="flex items-center justify-between px-3 py-2.5">
            {/* Back */}
            <button
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-150 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Title */}
            <p className="flex-1 mx-3 text-[11px] font-black uppercase tracking-[0.12em] text-white truncate text-center">
              {itemName}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-150 active:scale-95"
                >
                  <Share2 className="h-4 w-4 stroke-[2]" />
                </button>
              )}
              <button
                onClick={onSave}
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 active:scale-95 ${
                  isSaved
                    ? "bg-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.4)]"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                <Heart
                  className={`h-4 w-4 stroke-[2.5] transition-all duration-200 ${
                    isSaved ? "fill-white text-white scale-110" : "text-white"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop nav - full width bar */}
        <div
          className="hidden md:block w-full border-b border-slate-200/60 shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', backgroundColor: TEAL }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 transition-all duration-150 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <p className="text-sm font-black uppercase tracking-[0.1em] text-white truncate max-w-md">
              {itemName}
            </p>

            <button
              onClick={onSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${
                isSaved
                  ? "bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-white" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
