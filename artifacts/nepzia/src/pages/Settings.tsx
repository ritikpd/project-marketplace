import { useState, useEffect } from "react";
import { User, MapPin, Phone, FileText, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/react";
import { useGetMe, getGetMeQueryKey, useUpdateMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Butwal", "Dharan", "Biratnagar", "Nepalgunj", "Janakpur"];

export default function Settings() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const { data: profile } = useGetMe();
  const { t } = useTranslation();
  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    }
  });

  const [form, setForm] = useState({ name: "", bio: "", phone: "", location: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? user?.fullName ?? "",
        bio: profile.bio ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
      });
    } else if (user) {
      setForm(f => ({ ...f, name: user.fullName ?? "" }));
    }
  }, [profile, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({ data: form });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t("settings.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("settings.subtitle")}</p>

        {/* Avatar Preview */}
        <div className="flex items-center gap-5 mb-8 p-5 bg-card border border-white/5 rounded-2xl">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center text-white font-bold text-2xl ring-2 ring-primary/30">
              {form.name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{user?.fullName ?? form.name}</p>
            <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t("settings.avatarNote")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-white/5 rounded-2xl p-6">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              <User className="h-3.5 w-3.5 inline mr-1.5" />{t("settings.displayName")}
            </label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t("settings.namePlaceholder")} className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              <FileText className="h-3.5 w-3.5 inline mr-1.5" />{t("settings.bio")}
            </label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder={t("settings.bioPlaceholder")} rows={3}
              className="w-full bg-background border border-white/10 text-white placeholder:text-muted-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              <Phone className="h-3.5 w-3.5 inline mr-1.5" />{t("settings.contactPhone")}
            </label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder={t("settings.phonePlaceholder")} className="bg-background border-white/10 text-white placeholder:text-muted-foreground rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              <MapPin className="h-3.5 w-3.5 inline mr-1.5" />{t("settings.location")}
            </label>
            <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full bg-background border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">{t("settings.selectCity")}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Button type="submit" disabled={updateMe.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
            {saved ? (
              <><CheckCircle2 className="h-4 w-4 mr-2" />{t("settings.saved")}</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />{updateMe.isPending ? t("settings.saving") : t("settings.saveChanges")}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
