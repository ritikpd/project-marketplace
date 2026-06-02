import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetListing, getGetListingQueryKey, useUpdateListing, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";

const CATEGORIES = ["Phones", "Laptops", "Tablets", "Gaming Consoles", "Cameras", "Smart Watches", "Accessories", "Audio Devices", "Drones", "Other Electronics"];
const CONDITIONS = ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];
const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Butwal", "Dharan", "Biratnagar", "Nepalgunj", "Janakpur"];

function pathToUploadedImage(path: string): UploadedImage {
  const previewUrl = path.startsWith("/objects/") ? `/api/storage${path}` : path;
  return { objectPath: path, previewUrl, name: path.split("/").pop() ?? "image" };
}

export default function EditListing() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [form, setForm] = useState({ title: "", description: "", price: "", condition: "Good", category: "", location: "", contactPhone: "", status: "active" });
  const [loaded, setLoaded] = useState(false);

  const { data: listing, isLoading } = useGetListing(id, { query: { queryKey: getGetListingQueryKey(id), enabled: !!id } });

  useEffect(() => {
    if (listing && !loaded) {
      setForm({
        title: listing.title ?? "",
        description: listing.description ?? "",
        price: String(listing.price ?? ""),
        condition: listing.condition ?? "Good",
        category: listing.category ?? "",
        location: listing.location ?? "",
        contactPhone: listing.contactPhone ?? "",
        status: listing.status ?? "active",
      });
      if (listing.images?.length) {
        setImages(listing.images.map(pathToUploadedImage));
      }
      setLoaded(true);
    }
  }, [listing, loaded]);

  const updateListing = useUpdateListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        setLocation(`/listings/${id}`);
      }
    }
  });

  const isUploading = images.some(i => i.uploading);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imagePaths = images.filter(i => i.objectPath && !i.error).map(i => i.objectPath);
    updateListing.mutate({
      id,
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        condition: form.condition,
        category: form.category,
        location: form.location,
        images: imagePaths,
        contactPhone: form.contactPhone || undefined,
        status: form.status,
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-64 w-full bg-white/5 rounded-2xl" />
        <Skeleton className="h-40 w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!listing) {
    return <div className="container mx-auto px-4 py-24 text-center"><p className="text-muted-foreground">Listing not found</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Edit Listing</h1>
        <p className="text-muted-foreground mb-8">Update your listing details</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="bg-background border-white/10 text-white rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4} className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Photos</h2>
            <ImageUploader
              images={images}
              onChange={setImages}
              disabled={updateListing.isPending}
            />
          </div>

          {/* Details */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Price (Rs.) *</label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0"
                  className="bg-background border-white/10 text-white rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Condition</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Location</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Contact Phone</label>
                <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  className="bg-background border-white/10 text-white rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation(`/listings/${id}`)}
              className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 h-12 rounded-xl font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={updateListing.isPending || isUploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
              {isUploading ? "Uploading photos..." : updateListing.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
