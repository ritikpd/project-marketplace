import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/ListingCard";
import { useListListings } from "@workspace/api-client-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { useTranslation } from "react-i18next";

const CATEGORIES = ["Phones", "Laptops", "Tablets", "Gaming Consoles", "Cameras", "Smart Watches", "Accessories", "Audio Devices", "Drones", "Other Electronics"];
const CONDITIONS = ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];
const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Butwal", "Dharan", "Biratnagar", "Nepalgunj", "Janakpur"];

const CAT_KEYS: Record<string, string> = {
  "Phones": "browse.categories.phones",
  "Laptops": "browse.categories.laptops",
  "Tablets": "browse.categories.tablets",
  "Gaming Consoles": "browse.categories.gaming",
  "Cameras": "browse.categories.cameras",
  "Smart Watches": "browse.categories.watches",
  "Accessories": "browse.categories.accessories",
  "Audio Devices": "browse.categories.audio",
  "Drones": "browse.categories.drones",
  "Other Electronics": "browse.categories.other",
};

const COND_KEYS: Record<string, string> = {
  "Brand New": "browse.conditions.brandNew",
  "Like New": "browse.conditions.likeNew",
  "Excellent": "browse.conditions.excellent",
  "Good": "browse.conditions.good",
  "Fair": "browse.conditions.fair",
  "For Parts": "browse.conditions.forParts",
};

const PAGE_SIZE = 20;

function parseSearch(search: string) {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  return {
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    location: params.get("location") ?? undefined,
  };
}

export default function Browse() {
  const { t } = useTranslation();
  const initial = parseSearch(typeof window !== "undefined" ? window.location.search : "");
  const [q, setQ] = useState(initial.q ?? "");
  const [search, setSearch] = useState(initial.q ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [condition, setCondition] = useState("");
  const [loc, setLoc] = useState(initial.location ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useListListings({
    q: search || undefined,
    category: category || undefined,
    condition: condition || undefined,
    location: loc || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sort as any,
    page,
    limit: PAGE_SIZE,
  });

  const total = data?.total ?? 0;

  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setAllListings(data.listings ?? []);
    } else {
      setAllListings(prev => [...prev, ...(data.listings ?? [])]);
    }
    setHasMore((data.listings?.length ?? 0) === PAGE_SIZE);
  }, [data]);

  const resetPages = () => { setPage(1); setAllListings([]); setHasMore(true); };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore && !isFetching) {
        setPage(p => p + 1);
      }
    }, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(q);
    resetPages();
  };

  const { isListening, supported: voiceSupported, start: startVoice, stop: stopVoice } = useVoiceSearch(
    useCallback((transcript: string) => {
      setQ(transcript);
      setSearch(transcript);
      resetPages();
    }, [])
  );

  const clearFilter = (key: string) => {
    if (key === "category") setCategory("");
    if (key === "condition") setCondition("");
    if (key === "location") setLoc("");
    if (key === "price") { setMinPrice(""); setMaxPrice(""); }
    resetPages();
  };

  const activeFilters = [
    category && { key: "category", label: category },
    condition && { key: "condition", label: condition },
    loc && { key: "location", label: loc },
    (minPrice || maxPrice) && { key: "price", label: `Rs. ${minPrice || "0"} - ${maxPrice || "∞"}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const SORT_OPTIONS = [
    { label: t("browse.sortNewest"), value: "newest" },
    { label: t("browse.sortOldest"), value: "oldest" },
    { label: t("browse.sortPriceAsc"), value: "price_asc" },
    { label: t("browse.sortPriceDesc"), value: "price_desc" },
  ];

  const pageTitle = search
    ? `"${search}" — NEPZIA Search`
    : category
    ? `${category} for Sale in Nepal | NEPZIA`
    : t("browse.title");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Find ${category || "tech products"} for sale in Nepal. ${total} listings available. Filter by condition, location, and price on NEPZIA.`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://nepzia.replit.app/browse${category ? `?category=${category}` : ""}`} />
      </Helmet>

      {/* Search Header */}
      <div className="border-b border-white/5 bg-card/40 backdrop-blur-xl py-6">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("browse.searchPlaceholder")}
                className="pl-12 pr-12 h-12 bg-card border-white/10 text-white placeholder:text-muted-foreground rounded-xl"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopVoice : startVoice}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${isListening ? "text-primary animate-pulse bg-primary/10" : "text-muted-foreground hover:text-white"}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-semibold">
              {t("browse.search")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-4 rounded-xl border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 sm:hidden">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </form>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((f) => (
                <Badge key={f.key} variant="secondary" className="bg-primary/10 text-primary border-primary/20 pl-3 pr-2 py-1 flex items-center gap-1">
                  {f.label}
                  <button onClick={() => clearFilter(f.key)} className="hover:text-white ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button onClick={() => { setCategory(""); setCondition(""); setLoc(""); setMinPrice(""); setMaxPrice(""); resetPages(); }}
                className="text-xs text-muted-foreground hover:text-white underline">
                {t("browse.clearAll")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-64 flex-shrink-0 ${showFilters ? "block" : "hidden sm:block"}`}>
            <div className="sticky top-24 space-y-6">
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  {t("browse.filters")}
                </h3>

                <div className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">{t("browse.category")}</label>
                    <div className="space-y-1.5">
                      {CATEGORIES.map((cat) => (
                        <button key={cat} onClick={() => { setCategory(category === cat ? "" : cat); resetPages(); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${category === cat ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
                          {t(CAT_KEYS[cat] ?? cat)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="border-t border-white/5 pt-5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">{t("browse.condition")}</label>
                    <div className="flex flex-wrap gap-2">
                      {CONDITIONS.map((c) => (
                        <button key={c} onClick={() => { setCondition(condition === c ? "" : c); resetPages(); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${condition === c ? "bg-primary border-primary text-white" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"}`}>
                          {t(COND_KEYS[c] ?? c)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="border-t border-white/5 pt-5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">{t("browse.location")}</label>
                    <select value={loc} onChange={(e) => { setLoc(e.target.value); resetPages(); }}
                      className="w-full bg-card border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                      <option value="">{t("browse.allCities")}</option>
                      {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="border-t border-white/5 pt-5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">{t("browse.priceRange")}</label>
                    <div className="flex gap-2">
                      <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={t("browse.min")}
                        className="bg-card border-white/10 text-white text-sm h-9 rounded-lg" />
                      <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t("browse.max")}
                        className="bg-card border-white/10 text-white text-sm h-9 rounded-lg" />
                    </div>
                    <Button onClick={() => resetPages()} size="sm" variant="outline"
                      className="mt-2 w-full border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 h-9 rounded-lg text-xs">
                      {t("browse.apply")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground text-sm">
                {isLoading && page === 1
                  ? t("browse.loading")
                  : t("browse.listingsFound", { count: total })}
                {search && <span className="text-white font-medium"> {t("browse.forSearch", { query: search })}</span>}
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">{t("browse.sort")}</label>
                <select value={sort} onChange={(e) => { setSort(e.target.value); resetPages(); }}
                  className="bg-card border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {isLoading && page === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full bg-white/5" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allListings.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">{t("browse.noListings")}</h3>
                <p className="text-muted-foreground mb-6">{t("browse.noListingsSub")}</p>
                <Button onClick={() => { setSearch(""); setQ(""); setCategory(""); setCondition(""); setLoc(""); setMinPrice(""); setMaxPrice(""); resetPages(); }}
                  variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  {t("browse.clearAllFilters")}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {allListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-6">
                  {isFetching && page > 1 && (
                    <div className="flex gap-1.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                  {!hasMore && allListings.length > 0 && (
                    <p className="text-xs text-muted-foreground/50">{t("browse.allLoaded")}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
