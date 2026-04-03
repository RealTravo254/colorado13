import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight, User, Briefcase, CreditCard, Shield, 
  LogOut, UserCog, LogIn,
  CalendarCheck, Settings, LayoutDashboard, Receipt, Users
} from "lucide-react";

const ACCENT = "#c2185b";
const ACCENT_BG = "rgba(194, 24, 91, 0.08)";

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
    { section: "Creator Tools", items: [
      { icon: Briefcase, label: "Become a Host", path: "/become-host", show: true },
      { icon: LayoutDashboard, label: "My Listings", path: "/my-listing", show: true },
      { icon: CalendarCheck, label: "My Host Bookings", path: "/host-bookings", show: true },
    ]},
    { section: "Personal", items: [
      { icon: User, label: "Edit Profile", path: "/profile/edit", show: true },
      { icon: CreditCard, label: "Payments & Earnings", path: "/payment", show: true },
      { icon: Receipt, label: "Payment History", path: "/payment-history", show: true },
    ]},
    { section: "Admin Control", items: [
      { icon: Shield, label: "Admin Dashboard", path: "/admin", show: userRole === "admin" },
      { icon: UserCog, label: "Host Verification", path: "/admin/verification", show: userRole === "admin" },
      { icon: CreditCard, label: "Payment Verification", path: "/admin/payment-verification", show: userRole === "admin" },
      { icon: Users, label: "Accounts Overview", path: "/admin/accounts", show: userRole === "admin" },
      { icon: Settings, label: "Referral Settings", path: "/admin/referral-settings", show: userRole === "admin" },
      { icon: CalendarCheck, label: "All Bookings", path: "/admin/all-bookings", show: userRole === "admin" },
    ]}
  ];

  // Not logged in
  if (!user) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="w-[85vw] max-w-sm sm:max-w-md p-0 border-none flex flex-col" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          <div className="px-6 pt-6 pb-4">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold tracking-tight text-white">
                Welcome
              </SheetTitle>
            </SheetHeader>
          </div>
          <div className="flex-1 bg-white rounded-t-3xl flex flex-col items-center justify-center px-6 py-12">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: ACCENT_BG }}>
              <User className="h-8 w-8" style={{ color: ACCENT }} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Join RealTravo</h3>
            <p className="text-sm text-slate-500 text-center mb-8 max-w-xs">
              Sign up or log in to manage your bookings, save your favorite places, and become a host.
            </p>
            <button 
              onClick={() => { setIsOpen(false); navigate('/auth'); }}
              className="w-full max-w-xs py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ backgroundColor: ACCENT }}
            >
              <LogIn className="h-4 w-4 inline mr-2" />
              Login / Register
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[85vw] max-w-sm sm:max-w-md p-0 border-none flex flex-col" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
        {/* Dark Header */}
        <div className="px-6 pt-6 pb-4">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold tracking-tight text-white">
              My Account
            </SheetTitle>
          </SheetHeader>
          
          {!loading && userName && (
            <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">
                  {userRole === "admin" ? "Administrator" : "Member"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* White rounded content */}
        <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl py-4">
          {loading ? (
            <div className="space-y-3 px-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : ( 
            <div className="space-y-4 px-4">
              {menuItems.map((section, idx) => {
                const visibleItems = section.items.filter(item => item.show);
                if (visibleItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-1">
                      {section.section}
                    </p>
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm divide-y divide-slate-50">
                      {visibleItems.map((item) => (
                        <button 
                          key={item.path} 
                          onClick={() => handleNavigate(item.path)} 
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: ACCENT_BG }}>
                              <item.icon className="h-4 w-4" style={{ color: ACCENT }} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-red-100 shadow-sm hover:bg-red-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-50 group-hover:bg-red-500 transition-colors">
                    <LogOut className="h-4 w-4 text-red-500 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-medium text-red-500">
                    Log Out
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-red-200 group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
