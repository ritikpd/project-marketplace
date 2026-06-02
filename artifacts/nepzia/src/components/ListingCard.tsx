import { Link } from "wouter";
import { Listing } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ListingCard({ listing }: { listing: Listing }) {
  const rawImage = listing.images?.[0];
  const imageUrl = rawImage
    ? (rawImage.startsWith("/objects/") ? `/api/storage${rawImage}` : rawImage)
    : "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=400";
  
  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group relative rounded-xl border border-white/5 bg-[#080d1a] overflow-hidden hover-elevate transition-all duration-300 shadow-lg hover:shadow-primary/5 cursor-pointer flex flex-col h-full">
        {listing.featured && (
          <Badge className="absolute top-3 left-3 z-10 bg-primary text-white border-none shadow-md">
            Featured
          </Badge>
        )}
        
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-primary text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="h-4 w-4" />
        </Button>

        <div className="aspect-[4/3] w-full overflow-hidden bg-[#050811]">
          <img 
            src={imageUrl} 
            alt={listing.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-semibold text-white line-clamp-2 leading-tight">{listing.title}</h3>
            <span className="font-bold text-primary whitespace-nowrap">Rs. {listing.price.toLocaleString()}</span>
          </div>
          
          <div className="mt-auto pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </span>
              <span className="bg-white/5 px-2 py-1 rounded-md">{listing.condition}</span>
            </div>
            
            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
              {listing.sellerAvatar ? (
                <img src={listing.sellerAvatar} alt={listing.sellerName || "Seller"} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                  {listing.sellerName?.charAt(0) || "S"}
                </div>
              )}
              <span className="text-xs text-gray-300 truncate">{listing.sellerName}</span>
              {listing.sellerRating && (
                <span className="text-[10px] text-yellow-400 flex items-center gap-0.5 ml-auto">
                  <Star className="h-3 w-3 fill-current" />
                  {listing.sellerRating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
