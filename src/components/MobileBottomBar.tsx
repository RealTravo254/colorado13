import { useState, lazy, Suspense, useEffect } from "react";
import { Home, Ticket, Heart, User, ChevronLeft, Compass } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { AccountSheet } from "@/components/AccountSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TealLoader } from "@/components/ui/teal-loader";

const Bookings = lazy(() => import("@/pages/Bookings"));
const Saved = lazy(() => import("@/pages/Saved"));

const TEAL = "#008080";

export const MobileBottomBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [loginPopoverOpen, setLoginPopoverOpen] = useState(false);

  const isAnySheetOpen = bookingsOpen || savedOpen;

  useEffect(() => {
    setBookingsOpen(false);
    setSavedOpen(false);
  }, [location.pathname]);

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (path === "/bookings") {
      e.preventDefault();
      setBookingsOpen(true);
      setSavedOpen(false);
    } else if (path === "/saved") {
      e.preventDefault();
      setSavedOpen(true);
      setBookingsOpen(false);
    }
  };

  const navItems = [
    { icon: Home, label: t('nav.home'), path: "/" },
    { icon: Ticket, label: t('nav.bookings'), path: "/bookings" },
    { icon: Compass, label: "Explore", path: "/explore", isCenter: true },
    { icon: Heart, label: t('nav.saved'), path: "/saved" },
  ];

  return (
    <>
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[110] shadow-[0_-4px_20px_rgb(0,0,0,0.08)]",
        isAnySheetOpen && "hidden"
      )}
        style={{ backgroundColor: TEAL, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav className="flex items-center justify-around h-14 px-4">
          {navItems.map((item) => {
            const isSheetPath = item.path === "/bookings" || item.path === "/saved";
            const isActive =
              (location.pathname === item.path && !bookingsOpen && !savedOpen) ||
              (item.path === "/bookings" && bookingsOpen) ||
              (item.path === "/saved" && savedOpen);

            const NavContent = (
              <>
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200 mb-0.5",
                  item.isCenter ? "bg-white/25 scale-110" : "",
                  isActive && !item.isCenter ? "bg-white/20" : ""
                )}>
                  <item.icon
                    className={cn("h-4 w-4 transition-colors duration-200 text-white")}
                    strokeWidth={isActive || item.isCenter ? 2.5 : 2}
                  />
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider text-white/80",
                  (isActive || item.isCenter) && "text-white font-black"
                )}>
                  {item.label}
                </span>
              </>
            );

            if (item.path === "/explore") {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center group"
                >
                  {NavContent}
                </Link>
              );
            }

            if (isSheetPath) {
              return (
                <button
                  key={item.path}
                  onClick={(e) => handleNavClick(item.path, e)}
                  className="relative flex flex-col items-center justify-center group"
                >
                  {NavContent}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { setBookingsOpen(false); setSavedOpen(false); }}
                className="relative flex flex-col items-center justify-center group"
              >
                {NavContent}
              </Link>
            );
          })}

          {/* Profile Button */}
          {user ? (
            <AccountSheet>
              <button className="relative flex flex-col items-center justify-center group">
                <div className="p-1.5 rounded-xl transition-all duration-200 mb-0.5">
                  <User className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">
                  {t('nav.profile')}
                </span>
              </button>
            </AccountSheet>
          ) : (
            <Popover open={loginPopoverOpen} onOpenChange={setLoginPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="relative flex flex-col items-center justify-center group">
                  <div className="p-1.5 rounded-xl transition-all duration-200 mb-0.5">
                    <User className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">
                    {t('nav.profile')}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 mb-2" align="end" side="top">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Welcome!</p>
                  <p className="text-xs text-muted-foreground">Log in or sign up to access your profile, bookings, and saved items.</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setLoginPopoverOpen(false); navigate('/auth'); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                      style={{ backgroundColor: TEAL }}>
                      Sign Up
                    </button>
                    <button onClick={() => { setLoginPopoverOpen(false); navigate('/auth'); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-foreground transition-all active:scale-95 hover:bg-slate-50">
                      Log In
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </nav>
      </div>

      {/* Bookings Full-Page Sheet */}
      <Sheet open={bookingsOpen} onOpenChange={(open) => {
        setBookingsOpen(open);
        if (open) setSavedOpen(false);
      }}>
        <SheetContent side="bottom" className="h-[100dvh] rounded-none p-0 border-none flex flex-col z-[260] [&>button]:hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
            <button onClick={() => setBookingsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close bookings">
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-lg font-semibold">{t('nav.myBookings')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain pb-24 bg-white" style={{ touchAction: "pan-y" }}>
            <Suspense fallback={<div className="flex items-center justify-center py-20"><TealLoader /></div>}>
              <Bookings />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      {/* Saved Full-Page Sheet */}
      <Sheet open={savedOpen} onOpenChange={(open) => {
        setSavedOpen(open);
        if (open) setBookingsOpen(false);
      }}>
        <SheetContent side="bottom" className="h-[100dvh] rounded-none p-0 border-none flex flex-col z-[260] [&>button]:hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
            <button onClick={() => setSavedOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close saved">
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-lg font-semibold">{t('nav.savedItems')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain pb-24 bg-white">
            <Suspense fallback={<div className="flex items-center justify-center py-20"><TealLoader /></div>}>
              <Saved />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
