import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, X, ImagePlus, DollarSign, Tag, MapPin, Phone, AlignLeft, Type, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateListing, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["Phones", "Laptops", "Tablets", "Gaming Consoles", "Cameras", "Smart Watches", "Accessories", "Audio Devices", "Drones", "Other Electronics"];
const CONDITIONS = ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];
const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Butwal", "Dharan", "Biratnagar", "Nepalgunj", "Janakpur"];

export default function CreateListing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  const [form, setForm] = useState({
    title: "", description: "", price: "", condition: "Good",
    category: "", location: "", contactPhone: "", status: "active",
  });

  const createListing = useCreateListing({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        setLocation(`/listings/${data.id}`);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    const images = imageUrls.filter(u => u.trim());
    createListing.mutate({
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        condition: form.condition,
        category: form.category,
        location: form.location,
        images,
        contactPhone: form.contactPhone || undefined,
        status: asDraft ? "draft" : "active",
      }
    });
  };

  const addImage = () => setImageUrls(u => [...u, ""]);
  const removeImage = (i: number) => setImageUrls(u => u.filter((_, idx) => idx !== i));
  const updateImage = (i: number, v: string) => setImageUrls(u => u.map((url, idx) => idx === i ? v : url));

  const isValid = form.title && form.price && form.category && form.location;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Listing</h1>
        <p className="text-muted-foreground mb-8">List your tech item for sale on NEPZIA</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Type className="h-3.5 w-3.5 inline mr-1.5" />Title *
              </label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium"
                className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <AlignLeft className="h-3.5 w-3.5 inline mr-1.5" />Description
              </label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the item's condition, what's included, reason for selling..."
                rows={4} className="w-full bg-background border border-white/10 text-white placeholder:text-muted-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Price (Rs.) *
                </label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0"
                  placeholder="0"
                  className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Condition *</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} required
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="h-3.5 w-3.5 inline mr-1.5" />Category *
                </label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5 inline mr-1.5" />Location *
                </label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Phone className="h-3.5 w-3.5 inline mr-1.5" />Contact Phone
              </label>
              <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+977-98XXXXXXXX"
                className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
            </div>
          </div>

          {/* Images */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider">
                <ImagePlus className="h-4 w-4 inline mr-1.5 text-primary" />Images (URL)
              </h2>
              <button type="button" onClick={addImage}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />Add more
              </button>
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={url} onChange={e => updateImage(i, e.target.value)}
                    placeholder={`https://... (image ${i + 1})`}
                    className="flex-1 bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl text-sm" />
                  {imageUrls.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(i)}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-xl flex-shrink-0 h-10 w-10">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {imageUrls.some(u => u.trim()) && (
              <div className="flex gap-2 flex-wrap">
                {imageUrls.filter(u => u.trim()).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10 bg-white/5"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" disabled={createListing.isPending}
              onClick={e => handleSubmit(e as any, true)}
              className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 h-12 rounded-xl font-semibold">
              Save Draft
            </Button>
            <Button type="submit" disabled={!isValid || createListing.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
              {createListing.isPending ? "Publishing..." : "Publish Listing"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
