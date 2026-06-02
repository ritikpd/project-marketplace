import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/ListingCard";
import { useGetWishlist, getGetWishlistQueryKey, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Wishlist() {
  const queryClient = useQueryClient();
  const { data: wishlist, isLoading } = useGetWishlist();
  const remove = useRemoveFromWishlist({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) } });
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-primary fill-current" />
          <h1 className="text-3xl font-black text-white tracking-tight">{t("wishlist.title")}</h1>
          {wishlist && <span className="text-muted-foreground text-sm">({wishlist.length})</span>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-card overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full bg-white/5" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : !wishlist?.length ? (
          <div className="text-center py-24">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-white mb-2">{t("wishlist.empty")}</h2>
            <p className="text-muted-foreground mb-6">{t("wishlist.emptySub")}</p>
            <Link href="/browse">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold">{t("wishlist.browse")}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlist.map((listing: any) => (
              <div key={listing.id} className="relative group">
                <ListingCard listing={listing} />
                <Button
                  variant="ghost" size="icon"
                  onClick={() => remove.mutate({ listingId: listing.id })}
                  className="absolute top-2 right-2 z-20 bg-black/40 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
