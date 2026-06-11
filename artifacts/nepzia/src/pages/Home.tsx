import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Navigation, ArrowRight,
  MonitorSmartphone, Laptop, Car, Bike, Home as HomeIcon, Building2,
  Gamepad2, TrendingUp, ShieldCheck, MessageCircle, Tag, Zap,
  Camera,
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

const ALL_CATEGORIES = [
  { icon: MonitorSmartphone, label: "Phones",       slug: "phones",          color: "text-sky-400",    iconBg: "bg-sky-500/10",     border: "border-sky-500/20 hover:border-sky-400/50",     emoji: "📱" },
  { icon: Laptop,           label: "Laptops",       slug: "laptops",         color: "text-violet-400", iconBg: "bg-violet-500/10",  border: "border-violet-500/20 hover:border-violet-400/50", emoji: "💻" },
  { icon: Car,              label: "Cars",           slug: "cars",            color: "text-orange-400", iconBg: "bg-orange-500/10",  border: "border-orange-500/20 hover:border-orange-400/50", emoji: "🚗" },
  { icon: Bike,             label: "Bikes",          slug: "bikes",           color: "text-green-400",  iconBg: "bg-green-500/10",   border: "border-green-500/20 hover:border-green-400/50",  emoji: "🏍️" },
  { icon: HomeIcon,         label: "House Rent",     slug: "house-rent",      color: "text-pink-400",   iconBg: "bg-pink-500/10",    border: "border-pink-500/20 hover:border-pink-400/50",    emoji: "🏠" },
  { icon: Building2,        label: "Flat Rent",      slug: "flat-rent",       color: "text-teal-400",   iconBg: "bg-teal-500/10",    border: "border-teal-500/20 hover:border-teal-400/50",    emoji: "🏢" },
  { icon: TrendingUp,       label: "Land Sale",      slug: "land-sale",       color: "text-yellow-400", iconBg: "bg-yellow-500/10",  border: "border-yellow-500/20 hover:border-yellow-400/50",emoji: "🌄" },
  { icon: Gamepad2,         label: "Gaming",         slug: "gaming-consoles", color: "text-indigo-400", iconBg: "bg-indigo-500/10",  border: "border-indigo-500/20 hover:border-indigo-400/50",emoji: "🎮" },
  { icon: Camera,           label: "Cameras",        slug: "cameras",         color: "text-rose-400",   iconBg: "bg-rose-500/10",    border: "border-rose-500/20 hover:border-rose-400/50",    emoji: "📷" },
  { icon: MonitorSmartphone,label: "Electronics",    slug: "phones",          color: "text-blue-400",   iconBg: "bg-blue-500/10",    border: "border-blue-500/20 hover:border-blue-400/50",    emoji: "🔌" },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, titleKey: "home.trust.verified", subKey: "home.trust.verifiedSub", color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  { icon: MessageCircle, titleKey: "home.trust.safe", subKey: "home.trust.safeSub",     color: "text-blue-400",    bg: "bg-blue-500/10",    dot: "bg-blue-400" },
  { icon: Zap,           titleKey: "home.trust.fast", subKey: "home.trust.fastSub",     color: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400" },
  { icon: Tag,           titleKey: "home.trust.free", subKey: "home.trust.freeSub",     color: "text-violet-400",  bg: "bg-violet-500/10",  dot: "bg-violet-400" },
];

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none bg-white/5" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-3/4 bg-white/5" />
        <Skeleton className="h-3.5 w-1/3 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
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
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    setLocation(`/browse?${params.toString()}`);
  };

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://nepzia.replit.app";
  const homeDesc = "Nepal's trusted marketplace for electronics, vehicles, property, rentals and local services. Buy and sell securely across Kathmandu, Pokhara and beyond.";

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>NEPZIA — Find Anything Across Nepal</title>
        <meta name="description" content={homeDesc} />
        <link rel="canonical" href={siteOrigin} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NEPZIA" />
        <meta property="og:title" content="NEPZIA — Find Anything Across Nepal" />
        <meta property="og:description" content={homeDesc} />
        <meta property="og:image" content={`${siteOrigin}/opengraph.jpg`} />
        <meta property="og:url" content={siteOrigin} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NEPZIA — Find Anything Across Nepal" />
        <meta name="twitter:description" content={homeDesc} />
        <meta name="twitter:image" content={`${siteOrigin}/opengraph.jpg`} />
      </Helmet>

      {/* ─── Announcement Bar ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#991B1B] via-[#EF4444] to-[#B91C1C] text-white text-center py-2 px-4 flex items-center justify-center gap-2 text-xs font-medium">
        <span>{t("home.announcement")}</span>
        <Link href="/listings/new" className="font-bold underline underline-offset-2 hover:no-underline">
          {t("home.announcementCta")}
        </Link>
      </div>

      {/* ─── Hero — Compact, Search-First ─────────────────────── */}
      <section className="relative py-10 sm:py-14 overflow-hidden bg-[#07091A]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.10),transparent)]" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              {t("home.badge")}
            </div>

            {/* Headline — purposely smaller than before */}
            <h1 className="text-2xl sm:text-4xl md:text-[2.6rem] font-black text-white leading-tight tracking-tight mb-3">
              {t("home.heroHeadline")}
            </h1>
            <p className="text-sm sm:text-base text-white/50 mb-7 max-w-lg mx-auto leading-relaxed">
              {t("home.heroSub")}
            </p>

            {/* Search Bar ─ full-width, prominent */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex items-center gap-2 bg-white/[0.07] border-2 border-white/[0.12] hover:border-[#3B82F6]/40 focus-within:border-[#3B82F6] rounded-2xl px-4 py-2 shadow-2xl shadow-black/50 transition-colors duration-200">
                <Search className="w-5 h-5 text-white/35 flex-shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 focus-visible:ring-0 h-11 text-base px-1"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm px-5 sm:px-7 h-10 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  {t("home.search")}
                </button>
              </div>
            </form>

            {/* Location strip */}
            <div className="flex items-center justify-center gap-4 min-h-[20px]">
              {geo.city ? (
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <MapPin className="h-3 w-3 text-[#3B82F6]" />
                  {t("home.showingNear")} <span className="text-white/60 font-medium ml-0.5">{geo.city}</span>
                </span>
              ) : (
                <button
                  onClick={geo.request}
                  disabled={geo.loading}
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-[#3B82F6] transition-colors disabled:opacity-50"
                >
                  <Navigation className="h-3 w-3" />
                  {geo.loading ? t("home.detectingLocation") : geo.permissionDenied ? t("home.locationDenied") : t("home.detectLocation")}
                </button>
              )}
              <span className="text-white/15">·</span>
              <Link href="/listings/new" className="flex items-center gap-1 text-xs text-white/35 hover:text-[#EF4444] transition-colors font-medium">
                <Tag className="h-3 w-3" />
                {t("home.sellNow")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ──────────────────────────────────────── */}
      <div className="bg-[#07091A] border-y border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">
            {TRUST_ITEMS.map(({ icon: Icon, titleKey, subKey, color, bg, dot }) => (
              <div key={titleKey} className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold leading-tight truncate">{t(titleKey)}</p>
                  <p className="text-white/40 text-[11px] leading-tight mt-0.5 truncate">{t(subKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Popular Categories ────────────────────────────────── */}
      <section className="py-8 sm:py-10 bg-[#06081A]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-white">{t("home.exploreCategories")}</h2>
            <Link href="/browse" className="flex items-center gap-1 text-[#3B82F6] text-xs font-semibold hover:text-blue-400 transition-colors">
              {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile: horizontal scroll; Desktop: grid */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 scrollbar-hide">
            {ALL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.slug + cat.label} href={`/browse?category=${cat.slug}`} className="flex-shrink-0">
                  <div className={`group flex flex-col items-center gap-2 p-3 sm:p-3.5 rounded-xl border ${cat.border} bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-150 cursor-pointer w-20 sm:w-auto`}>
                    <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-5 h-5 ${cat.color}`} />
                    </div>
                    <span className="text-white/75 font-medium text-[11px] text-center leading-tight">{cat.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Nearby Listings ──────────────────────────────────── */}
      {geo.lat && nearby && nearby.length > 0 && (
        <section className="py-8 sm:py-10 border-t border-white/[0.05]">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#3B82F6]" />
                  {t("home.nearYou")}
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  {t("home.nearYouSub")} <span className="text-white/60 font-medium">{geo.city}</span>
                </p>
              </div>
              <Link href={`/browse?lat=${geo.lat}&lng=${geo.lng}`} className="flex items-center gap-1 text-[#3B82F6] text-xs font-semibold hover:text-blue-400 transition-colors">
                {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {nearby.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured Listings ────────────────────────────────── */}
      <section className="py-8 sm:py-10 border-t border-white/[0.05]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t("home.premiumPicks")}</h2>
              <p className="text-white/40 text-xs mt-0.5">{t("home.premiumPicksSub")}</p>
            </div>
            <Link href="/browse?featured=true" className="flex items-center gap-1 text-[#3B82F6] text-xs font-semibold hover:text-blue-400 transition-colors">
              {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : featured?.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      </section>

      {/* ─── Recently Added ───────────────────────────────────── */}
      <section className="py-8 sm:py-10 border-t border-white/[0.05]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t("home.freshDrops")}</h2>
              <p className="text-white/40 text-xs mt-0.5">{t("home.freshDropsSub")}</p>
            </div>
            <Link href="/browse" className="flex items-center gap-1 text-[#3B82F6] text-xs font-semibold hover:text-blue-400 transition-colors">
              {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentLoading
              ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
              : recent?.slice(0, 8).map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>

          <div className="mt-8 text-center">
            <Link href="/browse">
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 hover:border-white/20 rounded-full px-10 font-semibold"
              >
                {t("home.viewAllListings")} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Sell CTA Banner ──────────────────────────────────── */}
      <section className="py-10 sm:py-12 border-t border-white/[0.05] bg-[#06081A]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#1A1F3A] to-[#0D1020] border border-white/[0.08] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-[#EF4444]" />
                <span className="text-[#EF4444] text-xs font-bold tracking-wider uppercase">Free to List</span>
              </div>
              <h3 className="text-white text-xl sm:text-2xl font-black mb-1">Have something to sell?</h3>
              <p className="text-white/50 text-sm">Post your ad in under 2 minutes. No fees, no commissions.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/browse">
                <button className="px-5 py-2.5 rounded-full border border-white/15 text-white/70 text-sm font-semibold hover:border-white/30 hover:text-white transition-all">
                  Browse First
                </button>
              </Link>
              <Link href="/listings/new">
                <button className="px-6 py-2.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95">
                  Post Free Ad
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
