import { useState } from "react";
import { Link } from "wouter";
import { Plus, Eye, Edit, Trash2, Package, Heart, MessageSquare, TrendingUp, CheckCircle, Clock, XCircle, BadgeCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyListings, getGetMyListingsQueryKey, useDeleteListing, useUpdateListing, useGetMarketplaceStats, useGetWishlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const STATUS_TABS = ["all", "active", "draft", "sold"] as const;
type Tab = typeof STATUS_TABS[number];

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  active: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
  draft: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Clock },
  sold: { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: XCircle },
};

const TAB_KEYS: Record<Tab, string> = {
  all: "dashboard.tabAll",
  active: "dashboard.tabActive",
  draft: "dashboard.tabDraft",
  sold: "dashboard.tabSold",
};

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("all");
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: listings, isLoading } = useGetMyListings();
  const { data: wishlist } = useGetWishlist();
  const deleteListing = useDeleteListing({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() }) } });

  const filtered = (listings ?? []).filter((l: any) => tab === "all" || l.status === tab);

  const stats = {
    total: listings?.length ?? 0,
    active: listings?.filter((l: any) => l.status === "active").length ?? 0,
    sold: listings?.filter((l: any) => l.status === "sold").length ?? 0,
    views: listings?.reduce((a: number, l: any) => a + (l.viewCount ?? 0), 0) ?? 0,
    wishlistCount: wishlist?.length ?? 0,
  };

  const updateListing = useUpdateListing({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() }) } });

  const handleDelete = (id: number) => {
    if (confirm(t("dashboard.deleteConfirm"))) {
      deleteListing.mutate({ id });
    }
  };

  const handleMarkSold = (id: number) => {
    updateListing.mutate({ id, data: { status: "sold" } });
  };

  const handleRelist = (id: number) => {
    updateListing.mutate({ id, data: { status: "active" } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
          </div>
          <Link href="/listings/new">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 h-11">
              <Plus className="h-4 w-4 mr-2" />
              {t("dashboard.newListing")}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: t("dashboard.totalListings"), value: stats.total, icon: Package, color: "text-blue-400" },
            { label: t("dashboard.active"), value: stats.active, icon: CheckCircle, color: "text-emerald-400" },
            { label: t("dashboard.totalViews"), value: stats.views, icon: Eye, color: "text-primary" },
            { label: t("dashboard.wishlisted"), value: stats.wishlistCount, icon: Heart, color: "text-pink-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-white/5 rounded-2xl p-5">
              <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/listings/new">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center hover:bg-primary/20 transition-colors cursor-pointer">
              <Plus className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-primary">{t("dashboard.sellItem")}</p>
            </div>
          </Link>
          <Link href="/dashboard/messages">
            <div className="bg-card border border-white/5 rounded-xl p-4 text-center hover:bg-white/5 transition-colors cursor-pointer">
              <MessageSquare className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">{t("dashboard.messages")}</p>
            </div>
          </Link>
          <Link href="/dashboard/wishlist">
            <div className="bg-card border border-white/5 rounded-xl p-4 text-center hover:bg-white/5 transition-colors cursor-pointer">
              <Heart className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">{t("dashboard.wishlist")}</p>
            </div>
          </Link>
        </div>

        {/* Listings Table */}
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">{t("dashboard.myListings")}</h2>
            <div className="flex gap-1 bg-black/30 rounded-xl p-1">
              {STATUS_TABS.map((t_) => (
                <button key={t_} onClick={() => setTab(t_)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t_ ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}>
                  {t(TAB_KEYS[t_])}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">
                {tab === "all" ? t("dashboard.noListingsAll") : t("dashboard.noListings", { status: t(TAB_KEYS[tab]).toLowerCase() })}
              </p>
              <Link href="/listings/new">
                <Button className="mt-4 bg-primary hover:bg-primary/90 text-white rounded-xl">{t("dashboard.createFirst")}</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((l: any) => {
                const StatusIcon = STATUS_CONFIG[l.status]?.icon ?? CheckCircle;
                return (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                    <img src={l.images?.[0] ?? "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=200&q=60"}
                      alt={l.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-white/5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{l.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{l.category} · {l.location}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-white">Rs. {l.price?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                        <Eye className="h-3 w-3" /> {l.viewCount}
                      </p>
                    </div>
                    <Badge className={`${STATUS_CONFIG[l.status]?.color ?? "bg-white/5 text-muted-foreground"} border text-xs font-medium hidden sm:flex`}>
                      {l.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Link href={`/listings/${l.id}`}>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg h-8 w-8" title={t("dashboard.view")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {l.status !== "sold" && (
                        <Link href={`/listings/${l.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg h-8 w-8" title={t("dashboard.edit")}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {l.status === "active" && (
                        <Button variant="ghost" size="icon" onClick={() => handleMarkSold(l.id)}
                          className="text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-lg h-8 w-8" title={t("dashboard.markSold")}>
                          <BadgeCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {l.status === "sold" && (
                        <Button variant="ghost" size="icon" onClick={() => handleRelist(l.id)}
                          className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg h-8 w-8" title={t("dashboard.relist")}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg h-8 w-8" title={t("dashboard.delete")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
