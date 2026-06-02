import { useState } from "react";
import { useLocation } from "wouter";
import { DollarSign, Tag, MapPin, Phone, AlignLeft, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateListing, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { useTranslation } from "react-i18next";

const CATEGORIES = ["Phones", "Laptops", "Tablets", "Gaming Consoles", "Cameras", "Smart Watches", "Accessories", "Audio Devices", "Drones", "Other Electronics"];
const CONDITIONS = ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];
const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Butwal", "Dharan", "Biratnagar", "Nepalgunj", "Janakpur"];

export default function CreateListing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const { t } = useTranslation();

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

  const isUploading = images.some(i => i.uploading);

  const handleSubmit = (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    const imagePaths = images.filter(i => i.objectPath && !i.error).map(i => i.objectPath);
    createListing.mutate({
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        condition: form.condition,
        category: form.category,
        location: form.location,
        images: imagePaths,
        contactPhone: form.contactPhone || undefined,
        status: asDraft ? "draft" : "active",
      }
    });
  };

  const isValid = form.title && form.price && form.category && form.location;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t("create.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("create.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">{t("create.basicInfo")}</h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Type className="h-3.5 w-3.5 inline mr-1.5" />{t("create.titleLabel")}
              </label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                placeholder={t("create.titlePlaceholder")}
                className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <AlignLeft className="h-3.5 w-3.5 inline mr-1.5" />{t("create.descriptionLabel")}
              </label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t("create.descriptionPlaceholder")}
                rows={4} className="w-full bg-background border border-white/10 text-white placeholder:text-muted-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">{t("create.photos")}</h2>
            <ImageUploader
              images={images}
              onChange={setImages}
              disabled={createListing.isPending}
            />
          </div>

          {/* Pricing & Details */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">{t("create.details")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t("create.priceLabel")}
                </label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0"
                  placeholder="0"
                  className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">{t("create.conditionLabel")}</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} required
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="h-3.5 w-3.5 inline mr-1.5" />{t("create.categoryLabel")}
                </label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  <option value="">{t("create.selectCategory")}</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5 inline mr-1.5" />{t("create.locationLabel")}
                </label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10">
                  <option value="">{t("create.selectCity")}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Phone className="h-3.5 w-3.5 inline mr-1.5" />{t("create.contactPhoneLabel")}
              </label>
              <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                placeholder={t("create.contactPhonePlaceholder")}
                className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" disabled={createListing.isPending || isUploading}
              onClick={e => handleSubmit(e as any, true)}
              className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 h-12 rounded-xl font-semibold">
              {t("create.saveDraft")}
            </Button>
            <Button type="submit" disabled={!isValid || createListing.isPending || isUploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
              {isUploading ? t("create.uploadingPhotos") : createListing.isPending ? t("create.publishing") : t("create.publish")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
