import { useState, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useLocation } from "wouter";
import { Heart, MapPin, Phone, MessageSquare, Flag, Share2, ChevronLeft, ChevronRight, Shield, Star, CheckCircle2, Eye, Tag, Banknote, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/ListingCard";
import { MakeOfferModal } from "@/components/MakeOfferModal";
import { BuyNowModal } from "@/components/BuyNowModal";
import { Show } from "@clerk/react";
import {
  useGetListing, getGetListingQueryKey,
  useGetSimilarListings, getGetSimilarListingsQueryKey,
  useAddToWishlist, useRemoveFromWishlist, getGetWishlistQueryKey,
  useCreateConversation,
  useGetWishlist,
  useReportListing,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const ListingMap = lazy(() => import("@/components/ListingMap").then(m => ({ default: m.ListingMap })));

const CONDITION_COLORS: Record<string, string> = {
  "Brand New": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "New": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Like New": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Excellent": "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "Good": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Fair": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "For Parts": "bg-red-500/15 text-red-400 border-red-500/20",
};

const PAYMENT_OPTIONS = [
  { name: "eSewa", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { name: "Khalti", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  { name: "IME Pay", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { name: "Fonepay", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { name: "Cash Meet", color: "text-white", bg: "bg-white/5 border-white/10" },
];

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [imageIdx, setImageIdx] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const { t } = useTranslation();

  const { data: listing, isLoading } = useGetListing(id, { query: { queryKey: getGetListingQueryKey(id), enabled: !!id } });
  const { data: similar } = useGetSimilarListings(id, { query: { queryKey: getGetSimilarListingsQueryKey(id), enabled: !!id } });
  const { data: wishlist } = useGetWishlist();

  const addToWishlist = useAddToWishlist({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) } });
  const removeFromWishlist = useRemoveFromWishlist({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) } });
  const createConversation = useCreateConversation();
  const reportListing = useReportListing({ mutation: { onSuccess: () => alert("Report submitted. Thank you.") } });

  const isWishlisted = wishlist?.some((l: any) => l.id === id);

  const handleWishlist = () => {
    if (!listing) return;
    if (isWishlisted) removeFromWishlist.mutate({ listingId: id });
    else addToWishlist.mutate({ listingId: id });
  };

  const handleContact = async () => {
    if (!listing) return;
    await createConversation.mutateAsync({
      data: { listingId: id, sellerId: listing.sellerId, initialMessage: `Hi, I'm interested in "${listing.title}". Is it still available?` }
    });
    setLocation("/dashboard/messages");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-white/5" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4 bg-white/5" />
            <Skeleton className="h-10 w-1/2 bg-white/5" />
            <Skeleton className="h-32 w-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{t("listing.notFound")}</h2>
        <Link href="/browse"><Button variant="outline" className="border-white/10 text-white">{t("listing.browseListings")}</Button></Link>
      </div>
    );
  }

  const rawImages = listing.images?.length ? listing.images : [];
  const images = rawImages.length
    ? rawImages.map(p => p.startsWith("/objects/") ? `/api/storage${p}` : p)
    : ["https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=600&q=80"];

  const ogImage = images?.[0] ?? "";
  const ogDesc = `${listing.title} — ${listing.condition} condition, Rs. ${listing.price?.toLocaleString()} in ${listing.location}, Nepal. Listed on NEPZIA.`;

  // BEFORE: hardcoded `nepzia.replit.app` domain — canonical and og:url point to the wrong
  //         host in every non-production environment, causing duplicate-content penalties.
  // AFTER:  window.location.origin ensures the correct domain in dev, staging, and prod.
  //         Added JSON-LD Product structured data so Google can show rich results
  //         (price, availability, condition) directly in search listings.
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://nepzia.replit.app";
  const canonicalUrl = `${siteOrigin}/listings/${id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: ogDesc,
    image: images,
    offers: {
      "@type": "Offer",
      priceCurrency: "NPR",
      price: listing.price,
      availability: listing.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: listing.condition === "Brand New" || listing.condition === "New"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      url: canonicalUrl,
      seller: { "@type": "Person", name: listing.sellerName ?? "NEPZIA Seller" },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{listing.title} — Rs. {listing.price?.toLocaleString()} | NEPZIA</title>
        <meta name="description" content={ogDesc} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="NEPZIA" />
        <meta property="og:title" content={`${listing.title} | NEPZIA`} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listing.title} />
        <meta name="twitter:description" content={ogDesc} />
        <meta name="twitter:image" content={ogImage} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-white transition-colors">{t("listing.home")}</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-white transition-colors">{t("listing.browse")}</Link>
          <span>/</span>
          <Link href={`/browse?category=${listing.category}`} className="hover:text-white transition-colors">{listing.category}</Link>
          <span>/</span>
          <span className="text-white truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Image Gallery */}
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden bg-card border border-white/5 mb-3">
              <img src={images[imageIdx]} alt={listing.title} className="w-full aspect-[4/3] object-cover" />
              {listing.featured && (
                <Badge className="absolute top-4 left-4 bg-primary text-white border-none">{t("listing.featured")}</Badge>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImageIdx(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => setImageIdx(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-white/60 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                <Eye className="h-3 w-3" />
                {t("listing.views", { count: listing.viewCount })}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImageIdx(i)}
                    className={`rounded-xl overflow-hidden aspect-square border-2 transition-all ${i === imageIdx ? "border-primary" : "border-white/5 hover:border-white/20"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-6 bg-card border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">{t("listing.description")}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description ?? t("listing.noDescription")}</p>
            </div>

            {/* Map */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {t("listing.generalLocation")}
              </h2>
              <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl bg-white/5" />}>
                <ListingMap city={listing.location} title={listing.title} />
              </Suspense>
              <p className="text-xs text-muted-foreground/60 mt-2">{t("listing.exactAddressNote")}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Info */}
            <div className="bg-card border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white leading-tight">{listing.title}</h1>
                <button onClick={handleWishlist} className={`flex-shrink-0 mt-1 ${isWishlisted ? "text-red-500" : "text-muted-foreground hover:text-red-400"} transition-colors`}>
                  <Heart className={`h-6 w-6 ${isWishlisted ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="text-4xl font-black text-white mb-4">
                Rs. {listing.price?.toLocaleString()}
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <Badge className={`${CONDITION_COLORS[listing.condition] ?? "bg-white/5 text-muted-foreground"} border text-xs font-medium`}>
                  {listing.condition}
                </Badge>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {listing.location}
                </span>
              </div>

              <Show when="signed-in">
                <div className="space-y-2.5">
                  <Button onClick={() => setShowBuyNow(true)}
                    className="w-full bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 text-white h-12 rounded-xl font-bold shadow-lg shadow-primary/30">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t("listing.buyNow")}
                  </Button>
                  <Button onClick={handleContact} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 h-12 rounded-xl font-semibold">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("listing.messageSeller")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowOfferModal(true)}
                    className="w-full border-white/10 text-white hover:bg-white/5 h-12 rounded-xl font-semibold">
                    <Tag className="h-4 w-4 mr-2 text-yellow-400" />
                    {t("listing.makeOffer")}
                  </Button>
                  {listing.contactPhone && (
                    <Button variant="outline" onClick={() => setShowPhone(true)} className="w-full border-white/10 text-white hover:bg-white/5 h-11 rounded-xl font-semibold">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      {showPhone ? listing.contactPhone : t("listing.showPhone")}
                    </Button>
                  )}
                </div>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-in">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold">
                    {t("listing.signInToContact")}
                  </Button>
                </Link>
              </Show>
            </div>

            {/* Nepal Payment Options */}
            <div className="bg-card border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">{t("listing.paymentOptions")}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map(p => (
                  <span key={p.name} className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${p.bg} ${p.color}`}>
                    {p.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2">{t("listing.negotiatePayment")}</p>
            </div>

            {/* Seller Card */}
            <Link href={`/profile/${listing.sellerId}`}>
              <div className="bg-card border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  {listing.sellerAvatar ? (
                    <img src={listing.sellerAvatar} alt={listing.sellerName ?? ""} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/10">
                      {listing.sellerName?.charAt(0) ?? "S"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{listing.sellerName ?? t("listing.seller")}</span>
                      {listing.sellerVerified && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                      <span className="text-sm text-yellow-400 font-medium">{listing.sellerRating ?? 4.5}</span>
                      <span className="text-xs text-muted-foreground">{t("listing.verifiedSeller")}</span>
                    </div>
                    <p className="text-xs text-primary mt-1 font-medium">{t("listing.viewProfile")}</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Safety Tips */}
            <div className="bg-card border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">{t("listing.safetyTips")}</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>{t("listing.safetyTip1")}</li>
                <li>{t("listing.safetyTip2")}</li>
                <li>{t("listing.safetyTip3")}</li>
                <li>{t("listing.safetyTip4")}</li>
                <li>{t("listing.safetyTip5")}</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5">
                <Share2 className="h-4 w-4 mr-2" />
                {t("listing.share")}
              </Button>
              <Show when="signed-in">
                <Button variant="outline" size="sm" onClick={() => reportListing.mutate({ id, data: { reason: "Suspicious listing", details: "" } })}
                  className="flex-1 border-white/10 text-muted-foreground hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20">
                  <Flag className="h-4 w-4 mr-2" />
                  {t("listing.report")}
                </Button>
              </Show>
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {similar && similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">{t("listing.similarListings")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {(similar as any[]).slice(0, 6).map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <MakeOfferModal
          listingId={id}
          listingTitle={listing.title}
          askingPrice={listing.price}
          onClose={() => setShowOfferModal(false)}
        />
      )}

      {/* Buy Now Modal */}
      {showBuyNow && (
        <BuyNowModal
          listingId={id}
          listingTitle={listing.title}
          price={listing.price}
          sellerId={listing.sellerId}
          onClose={() => setShowBuyNow(false)}
        />
      )}
    </div>
  );
}
