import { useParams } from "wouter";
import { MapPin, Star, CheckCircle2, Package, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/ListingCard";
import { useGetUserProfile, getGetUserProfileQueryKey, useGetSellerListings, getGetSellerListingsQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

export default function SellerProfile() {
  const params = useParams<{ clerkId: string }>();
  const clerkId = params.clerkId;
  const { t } = useTranslation();

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(clerkId, {
    query: { queryKey: getGetUserProfileQueryKey(clerkId), enabled: !!clerkId }
  });
  const { data: listings, isLoading: listingsLoading } = useGetSellerListings(clerkId, {
    query: { queryKey: getGetSellerListingsQueryKey(clerkId), enabled: !!clerkId }
  });

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-5 mb-8">
          <Skeleton className="w-20 h-20 rounded-full bg-white/5" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 bg-white/5" />
            <Skeleton className="h-4 w-24 bg-white/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[0,1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-white">{t("seller.notFound")}</h2>
      </div>
    );
  }

  const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-5">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name ?? ""} className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center text-white font-bold text-3xl ring-2 ring-white/10 flex-shrink-0">
                {profile.name?.charAt(0) ?? "S"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{profile.name ?? "Seller"}</h1>
                {profile.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> {t("seller.verified")}
                  </span>
                )}
              </div>
              {profile.bio && <p className="text-muted-foreground mt-2 text-sm">{profile.bio}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {profile.location}
                  </span>
                )}
                {joinDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground/60" />
                    {t("seller.joined")} {joinDate}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground/60" />
                  {(profile as any).listingCount ?? listings?.length ?? 0} {t("seller.listings")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-yellow-400 font-medium">{(profile as any).rating ?? 4.5}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <h2 className="text-xl font-bold text-white mb-5">{t("seller.activeListings")}</h2>
        {listingsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-52 rounded-xl bg-white/5" />)}
          </div>
        ) : !listings?.length ? (
          <div className="text-center py-16 bg-card border border-white/5 rounded-2xl">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">{t("seller.noActiveListings")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(listings ?? []).map((l: any) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
