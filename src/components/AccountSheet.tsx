import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight, User, Briefcase, CreditCard, Shield,
  LogOut, UserCog, LogIn,
  CalendarCheck, Settings, LayoutDashboard, Users, X
} from "lucide-react";

interface AccountSheetProps {
  children: React.ReactNode;
}

export const AccountSheet = ({ children }: AccountSheetProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [profileRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("name, profile_picture_url").eq("id", user.id).single(),
          supabase.from("user_roles").select("role").eq("user_id", user.id)
        ]);
        if (profileRes.data) {
          setUserName(profileRes.data.name || "User");
          setUserAvatar(profileRes.data.profile_picture_url || null);
        }
        if (rolesRes.data && rolesRes.data.length > 0) {
          const roleList = rolesRes.data.map(r => r.role);
          setUserRole(roleList.includes("admin") ? "admin" : "user");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => { setIsOpen(false); await signOut(); };
  const handleNavigate = (path: string) => { setIsOpen(false); navigate(path); };

  const menuItems = [
    {
      section: "Creator Tools",
      items: [
        { icon: Briefcase, label: "Become a Host", path: "/become-host", show: true },
        { icon: LayoutDashboard, label: "My Listings", path: "/my-listing", show: true },
        { icon: CalendarCheck, label: "My Host Bookings", path: "/host-bookings", show: true },
      ]
    },
    {
      section: "Personal",
      items: [
        { icon: User, label: "Profile & Security", path: "/profile/edit", show: true },
        { icon: CreditCard, label: "Payments & Earnings", path: "/payment", show: true },
      ]
    },
    {
      section: "Admin Control",
      items: [
        { icon: Shield, label: "Admin Dashboard", path: "/admin", show: userRole === "admin" },
        { icon: UserCog, label: "Host Verification", path: "/admin/verification", show: userRole === "admin" },
        { icon: CreditCard, label: "Payment Verification", path: "/admin/payment-verification", show: userRole === "admin" },
        { icon: Users, label: "Accounts Overview", path: "/admin/accounts", show: userRole === "admin" },
        { icon: Settings, label: "Referral Settings", path: "/admin/referral-settings", show: userRole === "admin" },
        { icon: CalendarCheck, label: "All Bookings", path: "/admin/all-bookings", show: userRole === "admin" },
      ]
    }
  ];

  // ── NOT LOGGED IN ──────────────────────────────────────────────
  if (!user) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent
          className="w-[85vw] max-w-sm sm:max-w-md p-0 border-none flex flex-col bg-primary [&>button]:hidden"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Close button — top right */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 z-50 h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
          >
            <X className="h-4 w-4 text-primary-foreground" />
          </button>

          {/* Top branding strip */}
          <div className="px-6 pt-14 pb-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary-foreground/50 mb-1">Realtravo</p>
            <h2 className="text-2xl font-extrabold text-primary-foreground leading-tight">Welcome</h2>
          </div>

          {/* White body */}
          <div className="flex-1 bg-background rounded-t-[2rem] flex flex-col items-center justify-center px-6 py-14">
            {/* Icon ring */}
            <div className="relative mb-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-9 w-9 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                <LogIn className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-foreground mb-2 text-center">Join Realtravo</h3>
            <p className="text-sm text-muted-foreground text-center mb-10 max-w-xs leading-relaxed">
              Sign up or log in to manage bookings, save favourites, and become a host.
            </p>

            <button
              onClick={() => { setIsOpen(false); navigate("/auth"); }}
              className="w-full max-w-xs py-3.5 rounded-2xl text-sm font-bold text-primary-foreground bg-primary hover:opacity-90 active:scale-95 transition-all"
            >
              Login / Register
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── LOGGED IN ──────────────────────────────────────────────────
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        className="w-[85vw] max-w-sm sm:max-w-md p-0 border-none flex flex-col bg-primary [&>button]:hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* ── Single close button at top right ── */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 z-50 h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
        >
          <X className="h-4 w-4 text-primary-foreground" />
        </button>

        {/* ── Header ── */}
        <div className="px-6 pt-14 pb-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary-foreground/50 mb-1">My Account</p>

          {loading ? (
            <div className="flex items-center gap-3 mt-3">
              <Skeleton className="h-14 w-14 rounded-full bg-primary-foreground/20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-primary-foreground/20 rounded-lg" />
                <Skeleton className="h-3 w-20 bg-primary-foreground/20 rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center overflow-hidden border-2 border-primary-foreground/20">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-lg font-black text-primary-foreground">{initials}</span>
                  )}
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-primary" />
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-extrabold text-primary-foreground truncate leading-tight">{userName}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  userRole === "admin"
                    ? "bg-yellow-400/20 text-yellow-200"
                    : "bg-primary-foreground/15 text-primary-foreground/60"
                }`}>
                  {userRole === "admin" ? "Administrator" : "Member"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Scrollable menu body ── */}
        <div className="flex-1 overflow-y-auto bg-background rounded-t-[2rem] py-6 px-4 space-y-5">

          {/* Creator Tools + Personal — always visible */}
          {menuItems.filter(s => s.section !== "Admin Control").map((section, idx) => {
            const visibleItems = section.items.filter(item => item.show);
            if (visibleItems.length === 0) return null;
            return (
              <div key={idx}>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">
                  {section.section}
                </p>
                <div className="rounded-2xl overflow-hidden border border-border bg-card divide-y divide-border/60">
                  {visibleItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Admin section */}
          {loading ? (
            <Skeleton className="h-16 w-full rounded-2xl" />
          ) : (
            menuItems.filter(s => s.section === "Admin Control").map((section, idx) => {
              const visibleItems = section.items.filter(item => item.show);
              if (visibleItems.length === 0) return null;
              return (
                <div key={`admin-${idx}`}>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">
                    {section.section}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-amber-200/60 bg-amber-50/40 dark:bg-amber-900/10 dark:border-amber-700/30 divide-y divide-amber-100 dark:divide-amber-800/30">
                    {visibleItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                            <item.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{item.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors group"
          >
            <div className="h-8 w-8 rounded-xl bg-destructive/10 group-hover:bg-destructive flex items-center justify-center flex-shrink-0 transition-colors">
              <LogOut className="h-4 w-4 text-destructive group-hover:text-destructive-foreground transition-colors" />
            </div>
            <span className="text-sm font-semibold text-destructive">Log Out</span>
          </button>

          {/* Bottom breathing room */}
          <div className="h-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
};