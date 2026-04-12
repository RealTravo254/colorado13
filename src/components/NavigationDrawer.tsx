import { useState, useEffect } from "react";
import { 
  Home, Ticket, Heart, Phone, Info, LogIn, LogOut, User, 
  FileText, Shield, ChevronRight, Trophy, Map, Mountain, Bed, Building2, Globe, Briefcase, Languages, DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Capacitor } from '@capacitor/core';

interface NavigationDrawerProps {
  onClose: () => void;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "he", name: "עברית" },
];

export const NavigationDrawer = ({ onClose }: NavigationDrawerProps) => {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rate, loading: rateLoading } = useCurrency();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [language, setLanguage] = useState(i18n.language || "en");
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("name, profile_picture_url").eq("id", user.id).single();
      if (profile) {
        setUserName(profile.name || "");
        setUserAvatar(profile.profile_picture_url || null);
      }
    };
    fetchUserData();
  }, [user]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = (lang === "ar" || lang === "he") ? "rtl" : "ltr";
  };

  const handleProtectedNavigation = (path: string) => {
    window.location.href = user ? path : "/auth";
    onClose();
  };

  const NavItem = ({ icon: Icon, label, path, isProtected = false }: any) => (
    <button
      onClick={() => isProtected ? handleProtectedNavigation(path) : (window.location.href = path, onClose())}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-foreground">
          {label}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-primary" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Brand Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight italic text-primary-foreground">
            RealTravo
          </span>
          <button onClick={onClose} className="text-xs font-medium text-primary-foreground/60 hover:text-primary-foreground/90 transition-colors">
            Cancel
          </button>
        </div>
      </div>

      {/* Login / User Section */}
      <div className="px-6 pb-4">
        {user ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-foreground truncate">{userName || t('drawer.traveler')}</p>
              <span className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">{t('nav.account')}</span>
            </div>
            <button 
              onClick={() => { signOut(); onClose(); }}
              className="p-2 rounded-lg hover:bg-primary-foreground/10 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth" onClick={onClose}
            className="flex items-center justify-center w-full py-3 rounded-2xl bg-primary-foreground text-primary font-semibold text-sm hover:bg-primary-foreground/90 transition-all"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t('nav.loginRegister')}
          </Link>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-background rounded-t-3xl">
        <div className="py-4">
          {/* Quick Links */}
          <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 mt-2">
            {t('drawer.mainMenu')}
          </p>
          <div className="mx-4 bg-card rounded-2xl overflow-hidden border border-border shadow-sm divide-y divide-border/50">
            <NavItem icon={Heart} label={t('nav.wishlist')} path="/saved" isProtected />
            <NavItem icon={Ticket} label={t('nav.myBookings')} path="/bookings" isProtected />
            <NavItem icon={Briefcase} label="Host" path="/become-host" isProtected />
          </div>

          {/* Support & Legal */}
          <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 mt-5">
            {t('drawer.supportLegal')}
          </p>
          <div className="mx-4 bg-card rounded-2xl overflow-hidden border border-border shadow-sm divide-y divide-border/50">
            <NavItem icon={Phone} label={t('drawer.contact')} path="/contact" />
            <NavItem icon={Info} label={t('drawer.about')} path="/about" />
            <NavItem icon={FileText} label={t('drawer.terms')} path="/terms-of-service" />
            <NavItem icon={Shield} label={t('drawer.privacy')} path="/privacy-policy" />
          </div>

          {/* Preferences */}
          <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 mt-5">
            Preferences
          </p>
          <div className="mx-4 bg-card rounded-2xl overflow-hidden border border-border shadow-sm divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Languages className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Language: {LANGUAGES.find(l => l.code === language)?.name || "English"}
                </span>
              </div>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="text-xs font-medium text-muted-foreground bg-transparent focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Currency: {currency}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrency("KES")}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    currency === "KES" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  KES
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    currency === "USD" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};