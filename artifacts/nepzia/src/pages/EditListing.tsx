import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { DollarSign, MapPin, Phone, Type, Cpu, Car, Home, Briefcase, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetListing, getGetListingQueryKey, useUpdateListing, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { useTranslation } from "react-i18next";
import {
  CATEGORY_GROUPS, CONDITIONS, CITIES, getCategoryType,
  STORAGE_OPTIONS, RAM_OPTIONS, FUEL_TYPES, OWNERSHIP_OPTIONS,
  VEHICLE_YEARS, BEDROOM_OPTIONS, BATHROOM_OPTIONS, FURNISHED_OPTIONS,
  EXPERIENCE_OPTIONS, type CategoryType,
} from "@/lib/categories";

const TYPE_ICONS: Record<CategoryType, typeof Cpu> = {
  electronics: Cpu, vehicles: Car, property: Home, jobs: Briefcase, services: Wrench,
};
const TYPE_LABELS: Record<CategoryType, string> = {
  electronics: "Device Details", vehicles: "Vehicle Details", property: "Property Details",
  jobs: "Job Details", services: "Service Details",
};

const selectClass = "w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary h-10";
const inputClass = "bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-muted-foreground mb-2">{children}</label>;
}

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
  const [form, setForm] = useState({
    title: "", description: "", price: "", condition: "Good",
    category: "", location: "", contactPhone: "", status: "active",
  });
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const { t } = useTranslation();

  const { data: listing, isLoading } = useGetListing(id, {
    query: { queryKey: getGetListingQueryKey(id), enabled: !!id },
  });

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
      const rawDetails = (listing as any).details;
      if (rawDetails && typeof rawDetails === "object") {
        setDetails(rawDetails as Record<string, string>);
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
      },
    },
  });

  const isUploading = images.some((i) => i.uploading);
  const catType: CategoryType | null = form.category ? getCategoryType(form.category) : null;

  const setF = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setD = (key: string, value: string) => setDetails((d) => ({ ...d, [key]: value }));

  const handleCategoryChange = (cat: string) => {
    setF("category", cat);
    if (cat !== form.category) setDetails({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imagePaths = images.filter((i) => i.objectPath && !i.error).map((i) => i.objectPath);
    const detailsPayload = Object.keys(details).length > 0 ? details : undefined;
    updateListing.mutate({
      id,
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        condition: catType === "electronics" ? form.condition : "N/A",
        category: form.category,
        location: form.location,
        images: imagePaths,
        contactPhone: form.contactPhone || undefined,
        status: form.status,
        details: detailsPayload as any,
      },
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
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">{t("create.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t("edit.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("edit.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="bg-card border border-white/5 rounded-2xl p-5">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">{t("create.categoryLabel")}</h2>
            <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)} required className={selectClass}>
              <option value="">{t("create.selectCategory")}</option>
              {CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.type} label={`${group.emoji} ${group.label}`}>
                  {group.subcategories.map((sub) => (
                    <option key={sub.name} value={sub.name}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Basic Info */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">{t("create.basicInfo")}</h2>
            <div>
              <FieldLabel>{t("create.titleLabel")}</FieldLabel>
              <Input value={form.title} onChange={(e) => setF("title", e.target.value)} required className={inputClass} />
            </div>
            <div>
              <FieldLabel>{t("create.descriptionLabel")}</FieldLabel>
              <textarea value={form.description} onChange={(e) => setF("description", e.target.value)}
                rows={4} className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">{t("create.photos")}</h2>
            <ImageUploader images={images} onChange={setImages} disabled={updateListing.isPending} />
          </div>

          {/* Price + Location + Condition */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">{t("create.details")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t("create.priceLabel")}</FieldLabel>
                <Input type="number" value={form.price} onChange={(e) => setF("price", e.target.value)} required min="0" className={inputClass} />
              </div>
              <div>
                <FieldLabel><MapPin className="h-3.5 w-3.5 inline mr-1" />{t("create.locationLabel")}</FieldLabel>
                <select value={form.location} onChange={(e) => setF("location", e.target.value)} required className={selectClass}>
                  <option value="">{t("create.selectCity")}</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {catType === "electronics" && (
              <div>
                <FieldLabel>{t("create.conditionLabel")}</FieldLabel>
                <select value={form.condition} onChange={(e) => setF("condition", e.target.value)} className={selectClass}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel><Phone className="h-3.5 w-3.5 inline mr-1" />{t("create.contactPhoneLabel")}</FieldLabel>
                <Input value={form.contactPhone} onChange={(e) => setF("contactPhone", e.target.value)}
                  placeholder={t("create.contactPhonePlaceholder")} className={inputClass} />
              </div>
              <div>
                <FieldLabel>{t("edit.statusLabel")}</FieldLabel>
                <select value={form.status} onChange={(e) => setF("status", e.target.value)} className={selectClass}>
                  <option value="active">{t("edit.statusActive")}</option>
                  <option value="draft">{t("edit.statusDraft")}</option>
                  <option value="sold">{t("edit.statusSold")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Details */}
          {catType && (
            <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
              {(() => {
                const Icon = TYPE_ICONS[catType];
                return (
                  <h2 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {TYPE_LABELS[catType]}
                  </h2>
                );
              })()}

              {catType === "electronics" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Brand</FieldLabel>
                    <Input value={details.brand ?? ""} onChange={(e) => setD("brand", e.target.value)} placeholder="e.g. Samsung, Apple" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Model</FieldLabel>
                    <Input value={details.model ?? ""} onChange={(e) => setD("model", e.target.value)} placeholder="e.g. Galaxy S24 Ultra" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Storage</FieldLabel>
                    <select value={details.storage ?? ""} onChange={(e) => setD("storage", e.target.value)} className={selectClass}>
                      <option value="">Select storage</option>
                      {STORAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>RAM</FieldLabel>
                    <select value={details.ram ?? ""} onChange={(e) => setD("ram", e.target.value)} className={selectClass}>
                      <option value="">Select RAM</option>
                      {RAM_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {catType === "vehicles" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Brand / Make</FieldLabel>
                    <Input value={details.brand ?? ""} onChange={(e) => setD("brand", e.target.value)} placeholder="e.g. Toyota, Honda" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Year</FieldLabel>
                    <select value={details.year ?? ""} onChange={(e) => setD("year", e.target.value)} className={selectClass}>
                      <option value="">Select year</option>
                      {VEHICLE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Fuel Type</FieldLabel>
                    <select value={details.fuelType ?? ""} onChange={(e) => setD("fuelType", e.target.value)} className={selectClass}>
                      <option value="">Select fuel type</option>
                      {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Mileage (km)</FieldLabel>
                    <Input type="number" value={details.mileage ?? ""} onChange={(e) => setD("mileage", e.target.value)} placeholder="e.g. 45000" min="0" className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>Ownership</FieldLabel>
                    <select value={details.ownership ?? ""} onChange={(e) => setD("ownership", e.target.value)} className={selectClass}>
                      <option value="">Select ownership</option>
                      {OWNERSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {catType === "property" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Bedrooms</FieldLabel>
                    <select value={details.bedrooms ?? ""} onChange={(e) => setD("bedrooms", e.target.value)} className={selectClass}>
                      <option value="">Select bedrooms</option>
                      {BEDROOM_OPTIONS.map((b) => <option key={b} value={b}>{b === "Studio" ? "Studio" : `${b} BHK`}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Bathrooms</FieldLabel>
                    <select value={details.bathrooms ?? ""} onChange={(e) => setD("bathrooms", e.target.value)} className={selectClass}>
                      <option value="">Select bathrooms</option>
                      {BATHROOM_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Area (sq ft)</FieldLabel>
                    <Input type="number" value={details.area ?? ""} onChange={(e) => setD("area", e.target.value)} placeholder="e.g. 1200" min="0" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Furnished</FieldLabel>
                    <select value={details.furnished ?? ""} onChange={(e) => setD("furnished", e.target.value)} className={selectClass}>
                      <option value="">Select option</option>
                      {FURNISHED_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Parking</FieldLabel>
                    <select value={details.parking ?? ""} onChange={(e) => setD("parking", e.target.value)} className={selectClass}>
                      <option value="">Select option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              )}

              {catType === "jobs" && (
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Company Name</FieldLabel>
                    <Input value={details.company ?? ""} onChange={(e) => setD("company", e.target.value)} placeholder="e.g. ABC Technologies Pvt. Ltd." className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Salary</FieldLabel>
                      <Input value={details.salary ?? ""} onChange={(e) => setD("salary", e.target.value)} placeholder="e.g. Rs. 25,000-35,000" className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel>Experience Required</FieldLabel>
                      <select value={details.experience ?? ""} onChange={(e) => setD("experience", e.target.value)} className={selectClass}>
                        <option value="">Select experience</option>
                        {EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {catType === "services" && (
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Service Type</FieldLabel>
                    <Input value={details.serviceType ?? ""} onChange={(e) => setD("serviceType", e.target.value)} placeholder="e.g. Mobile Phone Repair" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Pricing</FieldLabel>
                      <Input value={details.pricing ?? ""} onChange={(e) => setD("pricing", e.target.value)} placeholder="e.g. Rs. 500/hour" className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel>Availability</FieldLabel>
                      <Input value={details.availability ?? ""} onChange={(e) => setD("availability", e.target.value)} placeholder="e.g. Mon–Fri, 9am–6pm" className={inputClass} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation(`/listings/${id}`)}
              className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 h-12 rounded-xl font-semibold">
              {t("edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateListing.isPending || isUploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
              {isUploading ? t("edit.uploadingPhotos") : updateListing.isPending ? t("edit.saving") : t("edit.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
