import { useState } from "react";
import { Shield, Users, Package, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetMarketplaceStats, getGetMarketplaceStatsQueryKey,
  useAdminListUsers, getAdminListUsersQueryKey,
  useAdminListListings, getAdminListListingsQueryKey,
  useAdminUpdateListingStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const STATUS_CONFIG: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  draft: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  sold: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  removed: "text-red-400 bg-red-400/10 border-red-400/20",
};

type AdminTab = "overview" | "listings" | "users";

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: stats } = useGetMarketplaceStats({ query: { queryKey: getGetMarketplaceStatsQueryKey() } });
  const { data: users, isLoading: usersLoading } = useAdminListUsers({ query: { queryKey: getAdminListUsersQueryKey(), enabled: tab === "users" } });
  const { data: listings, isLoading: listingsLoading } = useAdminListListings(undefined, { query: { queryKey: getAdminListListingsQueryKey(), enabled: tab === "listings" } });

  const updateStatus = useAdminUpdateListingStatus({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListListingsQueryKey() }) }
  });

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status } });
  };

  const TAB_LABELS: Record<AdminTab, string> = {
    overview: t("admin.tabOverview"),
    listings: t("admin.tabListings"),
    users: t("admin.tabUsers"),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-black text-white tracking-tight">{t("admin.title")}</h1>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 bg-card/60 border border-white/5 rounded-xl p-1 mb-8 w-fit">
          {(["overview", "listings", "users"] as AdminTab[]).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === tabKey ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}>
              {TAB_LABELS[tabKey]}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: t("admin.totalListings"), value: stats?.totalListings, icon: Package, color: "text-blue-400" },
              { label: t("admin.activeListings"), value: stats?.activeListings, icon: CheckCircle, color: "text-emerald-400" },
              { label: t("admin.totalUsers"), value: stats?.totalUsers, icon: Users, color: "text-purple-400" },
              { label: t("admin.categories"), value: stats?.totalCategories, icon: TrendingUp, color: "text-yellow-400" },
              { label: t("admin.today"), value: stats?.listingsToday, icon: Clock, color: "text-primary" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-white/5 rounded-2xl p-5">
                <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
                <div className="text-3xl font-black text-white">{s.value ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Listings Management */}
        {tab === "listings" && (
          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-bold text-white">{t("admin.allListings")}</h2>
            </div>
            {listingsLoading ? (
              <div className="p-6 space-y-3">
                {[0,1,2,3].map(i => <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />)}
              </div>
            ) : (
              <div className="divide-y divide-white/5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left px-6 py-3">{t("admin.colListing")}</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">{t("admin.colCategory")}</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">{t("admin.colPrice")}</th>
                      <th className="text-left px-4 py-3">{t("admin.colStatus")}</th>
                      <th className="text-left px-4 py-3">{t("admin.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(listings ?? []).map((l: any) => (
                      <tr key={l.id} className="hover:bg-white/2">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img src={l.images?.[0] ?? "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=80&q=60"}
                              alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/5" />
                            <span className="text-white font-medium truncate max-w-[180px]">{l.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{l.category}</td>
                        <td className="px-4 py-3 text-white font-medium hidden md:table-cell">Rs. {l.price?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${STATUS_CONFIG[l.status] ?? "bg-white/5 text-muted-foreground"} border text-xs font-medium`}>
                            {l.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {l.status !== "active" && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(l.id, "active")}
                                className="text-emerald-400 hover:bg-emerald-400/10 h-7 px-2 text-xs">
                                {t("admin.activate")}
                              </Button>
                            )}
                            {l.status !== "removed" && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(l.id, "removed")}
                                className="text-red-400 hover:bg-red-400/10 h-7 px-2 text-xs">
                                {t("admin.remove")}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        {tab === "users" && (
          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-bold text-white">{t("admin.allUsers")}</h2>
            </div>
            {usersLoading ? (
              <div className="p-6 space-y-3">
                {[0,1,2,3].map(i => <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left px-6 py-3">{t("admin.colUser")}</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">{t("admin.colLocation")}</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">{t("admin.colJoined")}</th>
                      <th className="text-left px-4 py-3">{t("admin.colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(users ?? []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-white/2">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {u.name?.charAt(0) ?? "?"}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{u.name ?? "—"}</p>
                              <p className="text-muted-foreground text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.location ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {u.isVerified && (
                              <Badge className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20 border text-xs">{t("admin.verified")}</Badge>
                            )}
                            {u.isAdmin && (
                              <Badge className="text-primary bg-primary/10 border-primary/20 border text-xs">{t("admin.adminBadge")}</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
