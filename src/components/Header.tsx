import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Heart, Ticket, Home, User, Search, Compass, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NavigationDrawer } from "./NavigationDrawer";
import { Link, useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { AccountSheet } from "./AccountSheet";

export interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
  className?: string;
  hideIcons?: boolean;
  __fromLayout?: boolean;
}

export const Header = ({ onSearchClick, showSearchIcon = true, className, __fromLayout }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hostPopoverOpen, setHostPopoverOpen] = useState(false);
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      const { error } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
      if (error) console.error("Error fetching profile:", error.message);
    };
    fetchUserProfile();
  }, [user]);

  if (!__fromLayout) return null;

  // Mobile: Transparent icons (no white/rgba background)
  // Desktop: Standard rounded boxes
  const headerIconStyles = "h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-90 text-white md:rounded-xl md:hover:bg-white/20";

  return (
    <header 
      className={`z-[100] fixed top-0 left-0 right-0 flex py-3 bg-[#008080] ${className || ''}`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <button className={headerIconStyles} aria-label="Open Menu">
                <Menu className="h-6 w-6 stroke-[2.5]" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-72 p-0 h-screen border-none">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2 group ml-1">
            <span className="font-bold text-lg tracking-tight italic text-white hidden md:inline">RealTravo</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          {[
            { to: "/", icon: <Home className="h-4 w-4" />, label: t('nav.home') },
            { to: "/explore", icon: <Compass className="h-4 w-4" />, label: "Explore" },
            { to: "/bookings", icon: <Ticket className="h-4 w-4" />, label: t('nav.bookings') },
            { to: "/saved", icon: <Heart className="h-4 w-4" />, label: t('nav.wishlist') },
          ].map(item => (
            <Link key={item.to} to={item.to} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors">
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Search/Explore - Fixed & No BG on mobile */}
          <button onClick={() => navigate('/explore')} className={headerIconStyles} aria-label="Explore">
            <Search className="h-5 w-5" />
          </button>

          {/* Become Host - Desktop Only Pill */}
          <Popover open={hostPopoverOpen} onOpenChange={setHostPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="hidden md:flex h-9 px-3 rounded-xl items-center gap-2 transition-all font-semibold text-xs text-white bg-white/20 hover:bg-white/30">
                <Briefcase className="h-4 w-4" /><span>Become Host</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Start hosting today!</p>
                <button onClick={() => { setHostPopoverOpen(false); navigate(user ? '/become-host' : '/auth'); }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ backgroundColor: '#008080' }}>
                  Get Started →
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notification - Background stripped on mobile */}
          <div className="[&_button]:text-white [&_button]:bg-transparent md:[&_button]:bg-white/20 md:[&_button]:rounded-xl">
            <NotificationBell />
          </div>

          {/* Profile / Account */}
          {user ? (
            <AccountSheet>
              <button className="flex h-9 w-9 md:w-auto md:px-4 rounded-xl items-center justify-center gap-2 transition-all text-white md:text-[#008080] md:bg-white">
                <User className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden md:inline font-semibold text-xs">{t('nav.profile')}</span>
              </button>
            </AccountSheet>
          ) : (
            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex h-9 w-9 md:w-auto md:px-4 rounded-xl items-center justify-center gap-2 transition-all text-white md:text-[#008080] md:bg-white">
                  <User className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline font-semibold text-xs">{t('nav.login')}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <button onClick={() => { setAccountPopoverOpen(false); navigate('/auth'); }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: '#008080' }}>
                  Log In / Sign Up
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
};