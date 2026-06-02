import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { Search, MonitorSmartphone, Laptop, Gamepad2, Headphones, Camera, Watch, ArrowRight, MapPin, Mic, MicOff, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ListingCard";
import { useGetFeaturedListings, useGetRecentListings, useGetMarketplaceStats, useGetNearbyListings } from "@workspace/api-client-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const CATEGORY_ICONS = [
  { key: "phones" as const, icon: MonitorSmartphone, slug: "phones" },
  { key: "laptops" as const, icon: Laptop, slug: "laptops" },
  { key: "gaming" as const, icon: Gamepad2, slug: "gaming-consoles" },
  { key: "audio" as const, icon: Headphones, slug: "audio-devices" },
  { key: "cameras" as const, icon: Camera, slug: "cameras" },
  { key: "watches" as const, icon: Watch, slug: "smart-watches" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const geo = useGeolocation();
  const { t } = useTranslation();
  
  const { data: featured } = useGetFeaturedListings({ limit: 4 });
  const { data: recent } = useGetRecentListings({ limit: 8 });
  const { data: stats } = useGetMarketplaceStats();
  const nearbyParams = { lat: geo.lat ?? 0, lng: geo.lng ?? 0, radius: 80, limit: 8 };
  const { data: nearby } = useGetNearbyListings(nearbyParams, {
    query: {
      queryKey: ["nearby", geo.lat, geo.lng],
      enabled: !!(geo.lat && geo.lng),
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex-col">
      <Helmet>
        <title>NEPZIA — Nepal's Tech Marketplace | Buy &amp; Sell Phones, Laptops &amp; More</title>
        <meta name="description" content="Nepal's premium marketplace for buying and selling used and new tech products — phones, laptops, cameras, gaming consoles, and more. Verified sellers across Kathmandu, Pokhara and beyond." />
        <meta property="og:title" content="NEPZIA — Nepal's Premier Tech Marketplace" />
        <meta property="og:description" content="Buy and sell verified electronics in Nepal. Trusted sellers, secure meetups, Nepal payment methods." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nepzia.replit.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NEPZIA — Nepal's Tech Marketplace" />
        <meta name="twitter:description" content="Buy and sell verified electronics in Nepal." />
        <link rel="canonical" href="https://nepzia.replit.app/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="mb-6 bg-white/5 text-primary border-white/10 hover:bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            {t("home.badge")}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            {t("home.hero1")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-primary">
              {t("home.hero2")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium">
            {t("home.heroSub")}
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors" />
            <div className="relative flex items-center bg-[#080d1a] border border-white/10 rounded-full p-2 shadow-2xl backdrop-blur-md">
              <Search className="w-6 h-6 text-muted-foreground ml-4" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("home.searchPlaceholder")}
                className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-muted-foreground focus-visible:ring-0 px-4 h-12"
              />
              <Button type="submit" size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white px-8 h-12">
                {t("home.search")}
              </Button>
            </div>
          </form>

          {/* Location strip */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {geo.city ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {t("home.showingNear")} <span className="text-white font-medium">{geo.city}</span>
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
      </section>

      {/* Categories */}
      <section className="py-16 bg-[#050811]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">{t("home.exploreCategories")}</h2>
            <Link href="/browse" className="text-primary hover:text-primary/80 font-medium flex items-center text-sm">
              {t("home.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORY_ICONS.map((cat) => (
              <Link key={cat.slug} href={`/browse?category=${cat.slug}`}>
                <div className="bg-[#0a0f1d] border border-white/5 rounded-xl p-6 text-center hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group">
                  <cat.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-3 transition-colors" />
                  <h3 className="text-white font-medium">{t(`home.categories.${cat.key}`)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Listings */}
      {geo.lat && nearby && nearby.length > 0 && (
        <section className="py-20 border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  {t("home.nearYou")}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">{t("home.nearYouSub")} <span className="text-white">{geo.city}</span></p>
              </div>
              <Link href={`/browse?location=${geo.city}`} className="text-primary hover:text-primary/80 font-medium flex items-center text-sm">
                {t("home.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(nearby as any[]).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby skeleton if loading */}
      {geo.loading && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 bg-white/5 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0,1,2,3].map(i => (
                <div key={i} className="rounded-xl border border-white/5 bg-card overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full bg-white/5" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Listings */}
      {featured && featured.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">{t("home.premiumPicks")}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Listings */}
      {recent && recent.length > 0 && (
        <section className="py-20 bg-[#050811] border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">{t("home.freshDrops")}</h2>
              <Link href="/browse" className="text-primary hover:text-primary/80 font-medium flex items-center text-sm">
                {t("home.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(recent as any[]).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-white mb-2">{stats?.totalListings || "1,200+"}</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("home.statActiveTech")}</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">{stats?.totalUsers || "5,000+"}</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("home.statEnthusiasts")}</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">100%</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("home.statVerified")}</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">24/7</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("home.statSupport")}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>{children}</span>;
}
