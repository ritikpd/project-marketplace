export type CategoryType = "electronics" | "vehicles" | "property";

export interface SubCategory {
  name: string;
  slug: string;
}

export interface CategoryGroup {
  type: CategoryType;
  label: string;
  emoji: string;
  subcategories: SubCategory[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    type: "electronics",
    label: "Electronics",
    emoji: "📱",
    subcategories: [
      { name: "Phones", slug: "phones" },
      { name: "Laptops", slug: "laptops" },
      { name: "Tablets", slug: "tablets" },
      { name: "Smart Watches", slug: "smart-watches" },
      { name: "Cameras", slug: "cameras" },
      { name: "Gaming Consoles", slug: "gaming-consoles" },
      { name: "Accessories", slug: "accessories" },
    ],
  },
  {
    type: "vehicles",
    label: "Vehicles",
    emoji: "🚗",
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "Bikes", slug: "bikes" },
      { name: "Scooters", slug: "scooters" },
      { name: "Electric Vehicles", slug: "electric-vehicles" },
    ],
  },
  {
    type: "property",
    label: "Property",
    emoji: "🏠",
    subcategories: [
      { name: "House Sale", slug: "house-sale" },
      { name: "House Rent", slug: "house-rent" },
      { name: "Flat Sale", slug: "flat-sale" },
      { name: "Flat Rent", slug: "flat-rent" },
      { name: "Land Sale", slug: "land-sale" },
      { name: "Commercial Property", slug: "commercial-property" },
    ],
  },
];

export const ALL_FLAT_CATEGORIES = CATEGORY_GROUPS.flatMap((g) =>
  g.subcategories.map((s) => ({ ...s, type: g.type, groupLabel: g.label, emoji: g.emoji })),
);

export function getCategoryType(nameOrSlug: string): CategoryType {
  const lower = nameOrSlug.toLowerCase();
  for (const group of CATEGORY_GROUPS) {
    for (const sub of group.subcategories) {
      if (sub.name === nameOrSlug || sub.slug === lower || sub.name.toLowerCase() === lower) {
        return group.type;
      }
    }
  }
  return "electronics";
}

export function getNameFromSlug(slug: string): string | undefined {
  const lower = slug.toLowerCase();
  for (const group of CATEGORY_GROUPS) {
    const sub = group.subcategories.find(
      (s) => s.slug === lower || s.name.toLowerCase() === lower,
    );
    if (sub) return sub.name;
  }
  return undefined;
}

export const CONDITIONS = ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];

export const CITIES = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
  "Butwal", "Dharan", "Biratnagar", "Nepalgunj", "Janakpur",
];

export const STORAGE_OPTIONS = ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];
export const RAM_OPTIONS = ["2 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "32 GB"];
export const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
export const OWNERSHIP_OPTIONS = ["1st Owner", "2nd Owner", "3rd Owner", "4th+ Owner"];
export const VEHICLE_YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
export const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4", "5", "6+"];
export const BATHROOM_OPTIONS = ["1", "2", "3", "4", "5+"];
export const FURNISHED_OPTIONS = ["Fully Furnished", "Semi-Furnished", "Unfurnished"];
