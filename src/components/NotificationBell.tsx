import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bell, CheckCircle2, Trash2, Clock, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_SOUND_URL = "/audio/notification.mp3";

const categorizeNotifications = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {};
  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    let category: string;
    if (isToday(date)) category = 'Today';
    else if (isYesterday(date)) category = 'Yesterday';
    else category = format(date, 'MMMM dd, yyyy');

    if (!groups[category]) groups[category] = [];
    groups[category].push(notification);
  });
  return Object.keys(groups).map(title => ({ title, notifications: groups[title] }));
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getNotificationDeepLink = useCallback((notification: Notification): string | null => {
    const { type, data } = notification;
    switch (type) {
      case 'host_verification': return '/verification-status';
      case 'payment_verification': return '/account';
      case 'withdrawal_success':
      case 'withdrawal_failed':
        return '/payment';
      case 'new_booking':
        if (data?.item_id && data?.booking_type) return `/host-bookings/${data.booking_type}/${data.item_id}`;
        return '/host-bookings';
      case 'payment_confirmed': return '/bookings';
      case 'new_referral': return '/payment';
      case 'item_status':
      case 'item_hidden':
      case 'item_unhidden':
        if (data?.item_id && data?.item_type) return `/host-bookings/${data.item_type}/${data.item_id}`;
        return '/my-listing';
      default: return null;
    }
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    const deepLink = getNotificationDeepLink(notification);
    if (deepLink) {
      setIsOpen(false);
      navigate(deepLink);
    }
  }, [getNotificationDeepLink, navigate]);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    return () => { audioRef.current = null; };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const showInAppNotification = useCallback((notification: Notification) => {
    toast({ title: notification.title, description: notification.message });
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) {
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channelName = `notifications-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          playNotificationSound();
          if (payload.new) showInAppNotification(payload.new as Notification);
          fetchNotifications();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications);
    
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    if (!error) {
      fetchNotifications();
      toast({ title: "CLEARED!", description: "All notifications marked as read." });
    }
  };

  const categorizedNotifications = useMemo(() => categorizeNotifications(notifications), [notifications]);

  return (
    <div className="relative overflow-visible z-20">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button 
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative group overflow-visible"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 stroke-[2.5px] transition-transform group-hover:rotate-12" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white text-[10px] font-black z-[50] bg-destructive text-destructive-foreground"
                style={{ 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  pointerEvents: 'none'
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
        </SheetTrigger>
        
        <SheetContent className="w-[85vw] max-w-sm sm:max-w-md p-0 border-none flex flex-col bg-primary">
          {/* Dark Header - uses primary color */}
          <div className="px-6 pt-6 pb-4">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-primary-foreground/40 uppercase tracking-[0.2em] mb-1">Stay Updated</p>
                  <SheetTitle className="text-xl font-bold tracking-tight text-primary-foreground">
                    Inbox
                  </SheetTitle>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </SheetHeader>
          </div>

          {/* White rounded content area */}
          <div className="flex-1 overflow-hidden bg-background rounded-t-3xl">
            <ScrollArea className="h-full p-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-5 rounded-2xl mb-4 bg-primary/10">
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {categorizedNotifications.map(group => (
                    <div key={group.title} className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                        {group.title}
                      </p>
                      
                      <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm divide-y divide-border/50">
                        {group.notifications.map((notification) => {
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-all group flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-xl flex-shrink-0 ${notification.is_read ? "bg-muted" : "bg-primary/10"}`}>
                                  {!notification.is_read ? (
                                    <Clock className="h-4 w-4 text-primary" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-semibold truncate ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {notification.message}
                                  </p>
                                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {format(new Date(notification.created_at), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Cancel button at bottom */}
          <div className="bg-background px-4 pb-4 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="w-full py-3 rounded-2xl text-sm font-bold text-muted-foreground border-border hover:bg-muted"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};