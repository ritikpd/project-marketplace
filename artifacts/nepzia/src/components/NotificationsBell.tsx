import { useState } from "react";
import { Bell, Check, CheckCheck, MessageSquare, Tag, Package, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetNotifications, getGetNotificationsQueryKey,
  useMarkAllNotificationsRead, useMarkNotificationRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const TYPE_ICON: Record<string, React.ReactNode> = {
  message: <MessageSquare className="h-4 w-4 text-blue-400" />,
  offer: <Tag className="h-4 w-4 text-yellow-400" />,
  offer_accepted: <Check className="h-4 w-4 text-emerald-400" />,
  offer_rejected: <Tag className="h-4 w-4 text-red-400" />,
  offer_countered: <Tag className="h-4 w-4 text-orange-400" />,
  price_drop: <TrendingDown className="h-4 w-4 text-primary" />,
  listing_approved: <Package className="h-4 w-4 text-emerald-400" />,
};

function formatTime(iso: string, t: (k: string, opts?: any) => string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return t("notifications.justNow");
  if (diff < 3600000) return t("notifications.mAgo", { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return t("notifications.hAgo", { n: Math.floor(diff / 3600000) });
  return d.toLocaleDateString();
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: notifications = [] } = useGetNotifications({
    query: {
      queryKey: getGetNotificationsQueryKey(),
      refetchInterval: 30000,
    },
  });

  const markAll = useMarkAllNotificationsRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }) },
  });
  const markOne = useMarkNotificationRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }) },
  });

  const unread = (notifications as any[]).filter((n: any) => !n.isRead).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-white rounded-full"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-[#0a0f1d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="font-semibold text-white text-sm">{t("notifications.title")}</span>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {(notifications as any[]).length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  {t("notifications.empty")}
                </div>
              ) : (
                (notifications as any[]).map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.isRead) markOne.mutate({ id: n.id }); }}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${n.isRead ? "opacity-60" : "bg-primary/5 hover:bg-white/3"}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">{formatTime(n.createdAt, t)}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
