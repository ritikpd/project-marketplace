import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30 selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col relative z-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
