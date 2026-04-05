import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Heart, Ticket, Home, User, Search, Compass, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      const { error } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
      if (error) console.error("Error fetching profile:", error.message);
    };
    fetchUserProfile();
  }, [user]);

  if (!__fromLayout) return null;

  // Mobile: No background/border, just the icon. 
  // Desktop (md:): Adds the teal-on-white or white-on-teal rounded containers.
  const headerIconStyles = "h-10 w-10 flex items-center justify-center transition-all duration-200 active:scale-90 text-white md:rounded-xl md:hover:bg-white/20";

  return (
    <header 
      className={`z-[100] fixed top-0 left-0 right-0 flex py-2 bg-[#008080] border-b border-white/10 md:border-none ${className || ''}`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-12">
        
        {/* LEFT SECTION: Hamburger & Logo */}
        <div className="flex items-center">
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
          
          <Link to="/" className="flex items-center gap-2 ml-2">
            <span className="font-bold text-lg tracking-tight italic text-white">RealTravo</span>
          </Link>
        </div>

        {/* CENTER SECTION: Desktop Navigation Only */}
        <nav className="hidden lg:flex items-center gap-6">
          {[
            { to: "/", icon: <Home className="h-4 w-4" />, label: t('nav.home') },
            { to: "/explore", icon: <Compass className="h-4 w-4" />, label: "Explore" },
            { to: "/bookings", icon: <Ticket className="h-4 w-4" />, label: t('nav.bookings') },
            { to: "/saved", icon: <Heart className="h-4 w-4" />, label: t('nav.wishlist') },
          ].map(item => (
            <Link 
              key={item.to} 
              to={item.to} 
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors"
            >
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* RIGHT SECTION: Fixed Icons (No Mobile Backgrounds) */}
        <div className="flex items-center gap-0 md:gap-2">
          
          {/* Search Icon */}
          <button 
            onClick={() => navigate('/explore')} 
            className={headerIconStyles} 
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Become Host - Hidden on small mobile screens */}
          <button 
            onClick={() => navigate(user ? '/become-host' : '/auth')}
            className="hidden sm:flex h-9 px-3 rounded-xl items-center gap-2 transition-all font-semibold text-xs text-white bg-white/10 hover:bg-white/20"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden md:inline text-[10px] uppercase tracking-tighter">Become Host</span>
          </button>

          {/* Notification Bell - Logic to strip BG on mobile */}
          <div className="flex items-center justify-center h-10 w-10 [&_button]:bg-transparent [&_button]:text-white [&_button]:border-none [&_button]:shadow-none md:[&_button]:bg-white/20 md:[&_button]:rounded-xl md:[&_button]:h-9 md:[&_button]:w-9">
            <NotificationBell />
          </div>

          {/* Profile / Login */}
          {user ? (
            <AccountSheet>
              <button className="flex h-10 w-10 md:w-auto md:px-4 md:h-9 rounded-xl items-center justify-center gap-2 text-white md:text-[#008080] md:bg-white transition-all hover:brightness-105">
                <User className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden md:inline font-bold text-[11px] uppercase">{t('nav.profile')}</span>
              </button>
            </AccountSheet>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="flex h-10 w-10 md:w-auto md:px-4 md:h-9 rounded-xl items-center justify-center gap-2 text-white md:text-[#008080] md:bg-white transition-all hover:brightness-105"
            >
              <User className="h-5 w-5 md:h-4 md:w-4" />
              <span className="hidden md:inline font-bold text-[11px] uppercase">{t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};