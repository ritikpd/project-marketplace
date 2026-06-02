import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#050811] border-t border-white/5 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.svg" alt="NEPZIA" className="h-8 w-auto grayscale brightness-200" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Nepal's premium marketplace for buying and selling tech. Fast, secure, and built for enthusiasts.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Marketplace</h3>
            <ul className="space-y-3">
              <li><Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors text-sm">All Listings</Link></li>
              <li><Link href="/browse?category=phones" className="text-muted-foreground hover:text-primary transition-colors text-sm">Phones</Link></li>
              <li><Link href="/browse?category=laptops" className="text-muted-foreground hover:text-primary transition-colors text-sm">Laptops</Link></li>
              <li><Link href="/browse?category=gaming" className="text-muted-foreground hover:text-primary transition-colors text-sm">Gaming</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-muted-foreground hover:text-primary transition-colors text-sm">Help Center</Link></li>
              <li><Link href="/safety" className="text-muted-foreground hover:text-primary transition-colors text-sm">Safety Guidelines</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} NEPZIA. Crafted in Kathmandu.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span>Kathmandu</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Pokhara</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Chitwan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
