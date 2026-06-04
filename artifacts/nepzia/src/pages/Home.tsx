import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Navigation, ArrowRight, MonitorSmartphone, Laptop,
  Car, Bike, Home as HomeIcon, Building2,
  Gamepad2, TrendingUp, ShieldCheck, UserCheck,
  MessageCircle, AlertOctagon, MapPinned, Zap, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ListingCard";
import {
  useGetFeaturedListings,
  useGetRecentListings,
  useGetNearbyListings,
} from "@workspace/api-client-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const STATS = [
  { value: "100K+", key: "stats.listings" },
  { value: "50K+", key: "stats.users" },
  { value: "75+", key: "stats.cities" },
  { value: "24/7", key: "stats.support" },
];

const SEARCH_TABS = [
  { key: "tabs.electronics", emoji: "📱", category: "phones" },
  { key: "tabs.vehicles", emoji: "🚗", category: "cars" },
  { key: "tabs.property", emoji: "🏠", category: "flat-rent" },
  { key: "tabs.rentals", emoji: "🔑", category: "house-rent" },
];

const ALL_CATEGORIES = [
  { icon: MonitorSmartphone, key: "categories.phones", slug: "phones", bg: "bg-blue-500/10", border: "border-blue-500/20 hover:border-blue-500/50", color: "text-blue-400", glow: "group-hover:shadow-blue-500/20" },
  { icon: Laptop, key: "categories.laptops", slug: "laptops", bg: "bg-violet-500/10", border: "border-violet-500/20 hover:border-violet-500/50", color: "text-violet-400", glow: "group-hover:shadow-violet-500/20" },
  { icon: Car, key: "categories.cars", slug: "cars", bg: "bg-orange-500/10", border: "border-orange-500/20 hover:border-orange-500/50", color: "text-orange-400", glow: "group-hover:shadow-orange-500/20" },
  { icon: Bike, key: "categories.bikes", slug: "bikes", bg: "bg-green-500/10", border: "border-green-500/20 hover:border-green-500/50", color: "text-green-400", glow: "group-hover:shadow-green-500/20" },
  { icon: HomeIcon, key: "categories.houseRent", slug: "house-rent", bg: "bg-pink-500/10", border: "border-pink-500/20 hover:border-pink-500/50", color: "text-pink-400", glow: "group-hover:shadow-pink-500/20" },
  { icon: Building2, key: "categories.flatRent", slug: "flat-rent", bg: "bg-teal-500/10", border: "border-teal-500/20 hover:border-teal-500/50", color: "text-teal-400", glow: "group-hover:shadow-teal-500/20" },
  { icon: TrendingUp, key: "categories.landSale", slug: "land-sale", bg: "bg-yellow-500/10", border: "border-yellow-500/20 hover:border-yellow-500/50", color: "text-yellow-400", glow: "group-hover:shadow-yellow-500/20" },
  { icon: Gamepad2, key: "categories.gaming", slug: "gaming-consoles", bg: "bg-indigo-500/10", border: "border-indigo-500/20 hover:border-indigo-500/50", color: "text-indigo-400", glow: "group-hover:shadow-indigo-500/20" },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, key: "trust.verified", subKey: "trust.verifiedSub", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  { icon: UserCheck, key: "trust.identity", subKey: "trust.identitySub", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { icon: MessageCircle, key: "trust.secureChat", subKey: "trust.secureChatSub", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
  { icon: AlertOctagon, key: "trust.scamProtection", subKey: "trust.scamProtectionSub", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  { icon: MapPinned, key: "trust.locationVerified", subKey: "trust.locationVerifiedSub", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
];

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none bg-white/5" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        <Skeleton className="h-4 w-1/2 bg-white/5" />
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const geo = useGeolocation();
  const { t } = useTranslation();

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedListings({ limit: 4 });
  const { data: recent, isLoading: recentLoading } = useGetRecentListings({ limit: 8 });
  const nearbyParams = { lat: geo.lat ?? 0, lng: geo.lng ?? 0, radius: 80, limit: 4 };
  const { data: nearby } = useGetNearbyListings(nearbyParams, {
    query: {
      queryKey: ["nearby", geo.lat, geo.lng],
      enabled: !!(geo.lat && geo.lng),
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const category = SEARCH_TABS[activeTab].category;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    params.set("category", category);
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <div>
      <Helmet>
        <title>NEPZIA — Buy. Sell. Rent. Everything In Nepal.</title>
        <meta name="description" content="Nepal's #1 marketplace for electronics, vehicles, property, and rentals. Verified sellers across Kathmandu, Pokhara and 75+ cities." />
        <meta property="og:title" content="NEPZIA — Nepal's #1 Marketplace" />
        <meta property="og:image" content="/og-image.png" />
      </Helmet>

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-primary via-[#c91439] to-pink-600 text-white text-center py-2.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <Zap className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
        <span>{t("home.announcement")}</span>
        <Link href="/sign-up" className="ml-2 font-bold underline underline-offset-2 hover:no-underline flex-shrink-0">
          {t("home.announcementCta")}
        </Link>
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(232,28,68,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_90%,rgba(255,107,157,0.06),transparent)]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-primary mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("home.badge")}
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tight leading-none mb-3">
            {t("home.hero1")}
          </h1>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-400 to-white">
              {t("home.hero2")}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t("home.heroSub")}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center flex-wrap mb-10">
            {STATS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className="px-4 sm:px-6 py-3 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{t(`home.${s.key}`)}</div>
                </div>
                {i < STATS.length - 1 && <div className="w-px h-10 bg-white/10 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* Search Block */}
          <div className="max-w-3xl mx-auto">
            {/* Category Tabs */}
            <div className="flex items-center justify-center flex-wrap gap-1.5 mb-3">
              {SEARCH_TABS.map((tab, i) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeTab === i
                      ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                      : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  {t(`home.${tab.key}`)}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch}>
              <div className="relative flex items-center bg-[#080d1a]/90 border border-white/15 rounded-2xl p-2 shadow-2xl shadow-black/50 backdrop-blur-md gap-2">
                <Search className="w-5 h-5 text-muted-foreground ml-3 flex-shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  className="flex-1 bg-transparent border-none text-base text-white placeholder:text-muted-foreground/60 focus-visible:ring-0 px-2 h-11"
                />
                <div className="hidden sm:flex items-center gap-1 text-muted-foreground/50 text-xs mr-1 border-l border-white/10 pl-3 flex-shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{t("home.allNepal")}</span>
                </div>
                <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11 shadow-lg shadow-primary/20 flex-shrink-0 transition-all">
                  {t("home.search")}
                </Button>
              </div>
            </form>

            {/* Location strip */}
            <div className="mt-3 flex items-center justify-center">
              {geo.city ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {t("home.showingNear")} <span className="text-white font-medium ml-1">{geo.city}</span>
                </span>
              ) : (
                <button
                  onClick={geo.request}
                  disabled={geo.loading}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {geo.loading ? t("home.detectingLocation") : geo.permissionDenied ? t("home.locationDenied") : t("home.detectLocation")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-14 bg-[#030710]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("home.exploreCategories")}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t("home.categoriesSub")}</p>
            </div>
            <Link href="/browse" className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm transition-colors">
              {t("home.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.slug} href={`/browse?category=${cat.slug}`}>
                  <div className={`group relative ${cat.bg} border ${cat.border} rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl ${cat.glow}`}>
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <Icon className={`w-6 h-6 ${cat.color}`} />
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-tight">{t(`home.${cat.key}`)}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Nearby Listings */}
      {geo.lat && nearby && nearby.length > 0 && (
        <section className="py-16 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  {t("home.nearYou")}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("home.nearYouSub")} <span className="text-white font-medium">{geo.city}</span>
                </p>
              </div>
              <Link href={`/browse?lat=${geo.lat}&lng=${geo.lng}`} className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm">
                {t("home.viewAll")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearby.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Listings */}
      <section className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("home.premiumPicks")}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t("home.premiumPicksSub")}</p>
            </div>
            <Link href="/browse" className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm">
              {t("home.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : featured?.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("home.freshDrops")}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t("home.freshDropsSub")}</p>
            </div>
            <Link href="/browse" className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm">
              {t("home.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentLoading
              ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
              : recent?.slice(0, 8).map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
          <div className="mt-10 text-center">
            <Link href="/browse">
              <Button size="lg" variant="outline" className="border-white/15 text-white hover:bg-white/5 hover:border-white/25 rounded-full px-8 font-semibold">
                {t("home.viewAllListings")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 bg-[#030710]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-green-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("home.trust.badge")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">{t("home.trust.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("home.trust.sub")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className={`border ${item.bg} rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform duration-200`}>
                  <div className={`w-12 h-12 rounded-xl border ${item.bg} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{t(`home.${item.key}`)}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t(`home.${item.subKey}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* App CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-pink-900/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">{t("home.appCta.title")}</h2>
            <p className="text-muted-foreground mb-8 text-lg">{t("home.appCta.sub")}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" className="bg-white text-[#030710] hover:bg-white/90 font-bold rounded-xl px-6 gap-2 transition-all hover:scale-105">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.33.19.7.24 1.06.14l12.12-6.99-2.84-2.85-10.34 9.7zm16.32-10.22L16.94 12l2.56-1.54-12.12-6.99c-.36-.21-.75-.25-1.08-.13l10.2 10.2zM2.24 2.46A1.5 1.5 0 002 3.3v17.4c0 .3.08.57.24.84l10.2-9.54-10.2-9.54zm13.15 8.02L4.31 1.24c-.32-.19-.67-.22-1-.1L16.94 12l-1.55-1.52z"/></svg>
                {t("home.appCta.android")}
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold rounded-xl px-6 gap-2 transition-all hover:scale-105">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                {t("home.appCta.ios")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
