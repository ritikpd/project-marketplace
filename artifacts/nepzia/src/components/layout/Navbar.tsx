import { useState } from "react";
import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Menu, X, User, Plus, Heart, MessageSquare, LogOut, Settings, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

const NAV_LINKS = [
  { key: "nav.electronics", href: "/browse?category=phones" },
  { key: "nav.vehicles", href: "/browse?category=cars" },
  { key: "nav.property", href: "/browse?category=flat-rent" },
  { key: "nav.browse", href: "/browse" },
];

export function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ne" : "en");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <img
                src="/logo.png"
                alt="NEPZIA"
                className="h-8 sm:h-10 w-auto object-contain"
                style={{ imageRendering: "crisp-edges" }}
              />
              <span className="text-white font-black text-base sm:text-lg tracking-widest">
                NEPZIA
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  {t(key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="hidden sm:flex text-xs font-bold tracking-wider text-muted-foreground hover:text-white px-3"
            >
              {t("nav.switchLang")}
            </Button>

            <Show when="signed-in">
              <NotificationsBell />
              <Link href="/dashboard/messages">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white rounded-full">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/wishlist">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white rounded-full hidden sm:flex">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/listings/new">
                <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("nav.sell")}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full border border-white/10 overflow-hidden bg-muted">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt={user.fullName || "User"} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0a0f1d]/95 border-white/10 text-white backdrop-blur-xl">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{t("nav.dashboard")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/settings">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{t("nav.settings")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
                      <ShieldAlert className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-primary font-medium">{t("nav.adminPanel")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-400" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("nav.logOut")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>

            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-white hidden sm:inline-flex">
                  {t("nav.logIn")}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20">
                  {t("nav.signUp")}
                </Button>
              </Link>
            </Show>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <Link key={key} href={href} onClick={() => setMobileOpen(false)}>
                <div className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  {t(key)}
                </div>
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleLang} className="text-xs font-bold text-muted-foreground">
                {t("nav.switchLang")}
              </Button>
              <Show when="signed-in">
                <Link href="/listings/new" onClick={() => setMobileOpen(false)} className="ml-auto">
                  <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t("nav.sell")}
                  </Button>
                </Link>
              </Show>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
