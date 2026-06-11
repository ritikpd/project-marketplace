import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Youtube, Shield, MessageSquare, Zap, Users, Lock } from "lucide-react";

const TRUST_BADGES = [
  { icon: Shield, label: "Verified Listings" },
  { icon: MessageSquare, label: "Secure Messaging" },
  { icon: Zap, label: "Fast Posting" },
  { icon: Users, label: "Community Driven" },
];

const FOOTER_COLS = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse Listings", href: "/browse" },
      { label: "Categories", href: "/browse" },
      { label: "Post Ad", href: "/listings/new" },
      { label: "Featured Ads", href: "/browse?featured=true" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Safety Tips", href: "/safety" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="relative bg-[#05081A] border-t border-white/5 mt-auto overflow-hidden">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-24 bg-primary/5 blur-3xl" />

      {/* Trust Badges Strip */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <img
                src="/logo.png"
                alt="NEPZIA"
                className="h-10 w-auto object-contain"
                style={{ imageRendering: "crisp-edges" }}
              />
              <span className="text-white font-black text-xl tracking-widest">NEPZIA</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              Buy, Sell &amp; Rent Anything Across Nepal.
            </p>
            <p className="text-muted-foreground/60 text-xs leading-relaxed mb-6">
              Safe Deals. Verified Listings. Trusted Community.
            </p>
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-white font-semibold mb-4 text-xs tracking-widest uppercase">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-150 text-sm hover:translate-x-0.5 inline-block"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Security badges */}
            <div className="flex items-center gap-4 order-2 sm:order-1">
              {[
                { icon: Lock, label: "SSL Secured" },
                { icon: Shield, label: "Verified Users" },
                { icon: Users, label: "Safe Transactions" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-muted-foreground/60 text-xs">
                  <Icon className="h-3 w-3 text-primary/60" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Copyright */}
            <div className="flex items-center gap-3 text-muted-foreground/50 text-xs order-1 sm:order-2 text-center sm:text-right">
              <span>© {new Date().getFullYear()} NEPZIA. All rights reserved.</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span className="hidden sm:inline">Made for Nepal 🇳🇵</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
