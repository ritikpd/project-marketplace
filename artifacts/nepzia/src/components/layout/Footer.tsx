import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Twitter, Youtube, Smartphone, Download } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-[#030710] border-t border-white/5 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-14">
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-5">
              <img src="/logo.svg" alt="NEPZIA" className="h-8 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-3 mb-6">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Youtube, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a key={i} href={href} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <a href="#" className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-white transition-all w-fit">
                <Smartphone className="h-4 w-4 text-primary" />
                {t("footer.getAndroid")}
              </a>
              <a href="#" className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-white transition-all w-fit">
                <Download className="h-4 w-4 text-primary" />
                {t("footer.getIos")}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-xs tracking-widest uppercase">{t("footer.marketplace")}</h3>
            <ul className="space-y-2.5">
              {[
                ["/browse", t("footer.allListings")],
                ["/browse?category=phones", t("footer.phones")],
                ["/browse?category=laptops", t("footer.laptops")],
                ["/browse?category=gaming-consoles", t("footer.gaming")],
                ["/browse?category=cameras", t("footer.cameras")],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-xs tracking-widest uppercase">{t("footer.vehicles")}</h3>
            <ul className="space-y-2.5">
              {[
                ["/browse?category=cars", t("footer.cars")],
                ["/browse?category=bikes", t("footer.bikes")],
                ["/browse?category=scooters", t("footer.scooters")],
                ["/browse?category=electric", t("footer.electric")],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-xs tracking-widest uppercase">{t("footer.property")}</h3>
            <ul className="space-y-2.5">
              {[
                ["/browse?category=flat-rent", t("footer.flatRent")],
                ["/browse?category=house-rent", t("footer.houseRent")],
                ["/browse?category=land-sale", t("footer.landSale")],
                ["/browse?category=commercial", t("footer.commercial")],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-xs tracking-widest uppercase">{t("footer.company")}</h3>
            <ul className="space-y-2.5">
              {[
                ["/about", t("footer.aboutUs")],
                ["/careers", t("footer.careers")],
                ["/help", t("footer.helpCenter")],
                ["/safety", t("footer.safetyGuidelines")],
                ["/contact", t("footer.contactUs")],
                ["/terms", t("footer.terms")],
                ["/privacy", t("footer.privacy")],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span>{t("footer.kathmandu")}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{t("footer.pokhara")}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{t("footer.chitwan")}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{t("footer.biratnagar")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
