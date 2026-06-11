import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Navigation, ArrowRight,
  MonitorSmartphone, Laptop, Car, Bike, Home as HomeIcon, Building2,
  Gamepad2, TrendingUp, ShieldCheck, MessageCircle, Tag,
  Zap, CheckCircle2, Camera,
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

const SEARCH_TABS = [
  { key: "tabs.electronics", emoji: "📱", category: "phones" },
  { key: "tabs.vehicles", emoji: "🚗", category: "cars" },
  { key: "tabs.property", emoji: "🏠", category: "flat-rent" },
  { key: "tabs.rentals", emoji: "🔑", category: "house-rent" },
];

const ALL_CATEGORIES = [
  {
    icon: MonitorSmartphone,
    key: "categories.phones",
    slug: "phones",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    color: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  {
    icon: Laptop,
    key: "categories.laptops",
    slug: "laptops",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20 hover:border-violet-500/40",
    color: "text-violet-400",
    iconBg: "bg-violet-500/15",
  },
  {
    icon: Car,
    key: "categories.cars",
    slug: "cars",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20 hover:border-orange-500/40",
    color: "text-orange-400",
    iconBg: "bg-orange-500/15",
  },
  {
    icon: Bike,
    key: "categories.bikes",
    slug: "bikes",
    bg: "bg-green-500/10",
    border: "border-green-500/20 hover:border-green-500/40",
    color: "text-green-400",
    iconBg: "bg-green-500/15",
  },
  {
    icon: HomeIcon,
    key: "categories.houseRent",
    slug: "house-rent",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20 hover:border-pink-500/40",
    color: "text-pink-400",
    iconBg: "bg-pink-500/15",
  },
  {
    icon: Building2,
    key: "categories.flatRent",
    slug: "flat-rent",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20 hover:border-teal-500/40",
    color: "text-teal-400",
    iconBg: "bg-teal-500/15",
  },
  {
    icon: TrendingUp,
    key: "categories.landSale",
    slug: "land-sale",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20 hover:border-yellow-500/40",
    color: "text-yellow-400",
    iconBg: "bg-yellow-500/15",
  },
  {
    icon: Gamepad2,
    key: "categories.gaming",
    slug: "gaming-consoles",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    color: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Camera,
    step: "01",
    titleKey: "home.step1Title",
    subKey: "home.step1Sub",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: MessageCircle,
    step: "02",
    titleKey: "home.step2Title",
    subKey: "home.step2Sub",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: CheckCircle2,
    step: "03",
    titleKey: "home.step3Title",
    subKey: "home.step3Sub",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
];

const TRUST_ITEMS = [
  {
    icon: Tag,
    titleKey: "home.trust.free",
    subKey: "home.trust.freeSub",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: MessageCircle,
    titleKey: "home.trust.secure",
    subKey: "home.trust.secureSub",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: ShieldCheck,
    titleKey: "home.trust.moderated",
    subKey: "home.trust.moderatedSub",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
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

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://nepzia.replit.app";
  const homeDesc = "Nepal's trusted marketplace for electronics, vehicles, property, rentals and local services. Buy and sell securely across Kathmandu, Pokhara and beyond.";

  return (
    <div>
      <Helmet>
        <title>NEPZIA — Buy, Sell & Rent Anything Across Nepal</title>
        <meta name="description" content={homeDesc} />
        <link rel="canonical" href={siteOrigin} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NEPZIA" />
        <meta property="og:title" content="NEPZIA — Trusted Marketplace For Nepal" />
        <meta property="og:description" content={homeDesc} />
        <meta property="og:image" content={`${siteOrigin}/opengraph.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={siteOrigin} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@nepzia" />
        <meta name="twitter:title" content="NEPZIA — Trusted Marketplace For Nepal" />
        <meta name="twitter:description" content={homeDesc} />
        <meta name="twitter:image" content={`${siteOrigin}/opengraph.jpg`} />
      </Helmet>

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#3B4FD4] via-primary to-[#0DCAF0] text-white text-center py-2.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <Zap className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{t("home.announcement")}</span>
        <Link href="/sell" className="ml-2 font-bold underline underline-offset-2 hover:no-underline flex-shrink-0">
          {t("home.announcementCta")}
        </Link>
      </div>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(232,28,68,0.18),transparent)]" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-primary mb-7 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
            {t("home.badge")}
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-2">
            {t("home.hero1")}
          </h1>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-300">
              {t("home.hero2")}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            {t("home.heroSub")}
          </p>

          {/* Search Block */}
          <div className="max-w-2xl mx-auto">
            {/* Category Tabs */}
            <div className="flex items-center justify-center flex-wrap gap-1.5 mb-3">
              {SEARCH_TABS.map((tab, i) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    activeTab === i
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-sm">{tab.emoji}</span>
                  {t(`home.${tab.key}`)}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center bg-[#080d1a]/90 border border-white/12 rounded-2xl p-1.5 shadow-2xl shadow-black/60 backdrop-blur-md gap-2">
                <Search className="w-5 h-5 text-muted-foreground ml-3 flex-shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  className="flex-1 bg-transparent border-none text-sm sm:text-base text-white placeholder:text-muted-foreground/50 focus-visible:ring-0 px-2 h-11"
                />
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/40 text-xs mr-1 border-l border-white/8 pl-3 flex-shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{t("home.allNepal")}</span>
                </div>
                <Button
                  type="submit"
                  className="rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 sm:px-7 h-11 shadow-md shadow-primary/20 flex-shrink-0 transition-all"
                >
                  {t("home.search")}
                </Button>
              </div>
            </form>

            {/* Location strip */}
            <div className="mt-3 flex items-center justify-center min-h-[22px]">
              {geo.city ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  {t("home.showingNear")}{" "}
                  <span className="text-white font-medium ml-0.5">{geo.city}</span>
                </span>
              ) : (
                <button
                  onClick={geo.request}
                  disabled={geo.loading}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-primary transition-colors disabled:opacity-50"
                >
                  <Navigation className="h-3 w-3" />
                  {geo.loading
                    ? t("home.detectingLocation")
                    : geo.permissionDenied
                    ? t("home.locationDenied")
                    : t("home.detectLocation")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-[#030710]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t("home.exploreCategories")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{t("home.categoriesSub")}</p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
            >
              {t("home.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {ALL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.slug} href={`/browse?category=${cat.slug}`}>
                  <div
                    className={`group ${cat.bg} border ${cat.border} rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${cat.iconBg} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform duration-150`}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${cat.color}`} />
                    </div>
                    <span className="text-white font-medium text-xs sm:text-sm leading-snug">
                      {t(`home.${cat.key}`)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 text-center sm:hidden">
            <Link href="/browse" className="text-primary text-sm font-semibold flex items-center justify-center gap-1">
              {t("home.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Nearby Listings ──────────────────────────────────── */}
      {geo.lat && nearby && nearby.length > 0 && (
        <section className="py-12 sm:py-16 border-y border-white/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t("home.nearYou")}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("home.nearYouSub")}{" "}
                  <span className="text-white font-medium">{geo.city}</span>
                </p>
              </div>
              <Link
                href={`/browse?lat=${geo.lat}&lng=${geo.lng}`}
                className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm"
              >
                {t("home.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
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

      {/* ─── Featured Listings ────────────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t("home.premiumPicks")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{t("home.premiumPicksSub")}</p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm"
            >
              {t("home.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : featured?.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-[#030710]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              {t("home.howItWorks")}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              {t("home.howItWorksSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto relative">
            {/* Connector line (desktop only) */}
            <div className="hidden sm:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-primary/30 via-blue-500/30 to-green-500/30" />

            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex flex-col items-center text-center relative">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center mb-4 relative z-10`}
                  >
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color}`} />
                    <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full ${item.bg} border ${item.border} flex items-center justify-center text-[10px] font-black ${item.color}`}>
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{t(item.titleKey)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(item.subKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Recent Listings ──────────────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t("home.freshDrops")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{t("home.freshDropsSub")}</p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm"
            >
              {t("home.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentLoading
              ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
              : recent?.slice(0, 8).map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
          <div className="mt-10 text-center">
            <Link href="/browse">
              <Button
                size="lg"
                variant="outline"
                className="border-white/15 text-white hover:bg-white/5 hover:border-white/25 rounded-full px-8 font-semibold"
              >
                {t("home.viewAllListings")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Trust & Safety ───────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-[#030710]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-[11px] font-semibold text-green-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("home.trust.badge")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              {t("home.trust.title")}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              {t("home.trust.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.titleKey}
                  className={`${item.bg} border ${item.border} rounded-2xl p-6 sm:p-7 flex flex-col items-start gap-4`}
                >
                  <div className={`w-11 h-11 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base mb-1">{t(item.titleKey)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(item.subKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
