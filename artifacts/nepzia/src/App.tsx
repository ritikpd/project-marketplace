import { lazy, Suspense, useEffect, useRef } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout from "./components/layout/AppLayout";

// BEFORE: static imports — every page is bundled into a single JS chunk, forcing the browser
//         to download and parse the entire application on first load (~AdminPanel, Dashboard, etc.).
// AFTER:  React.lazy() + Suspense — each page becomes its own async chunk; only the code needed
//         for the current route is downloaded, reducing initial bundle size significantly.
const Home = lazy(() => import("./pages/Home"));
const Browse = lazy(() => import("./pages/Browse"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Settings = lazy(() => import("./pages/Settings"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/not-found"));

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(348 83% 53%)",
    colorForeground: "hsl(0 0% 100%)",
    colorMutedForeground: "hsl(215 20.2% 65.1%)",
    colorDanger: "hsl(0 84.2% 60.2%)",
    colorBackground: "hsl(226 47% 8%)",
    colorInput: "hsl(226 30% 16%)",
    colorInputForeground: "hsl(0 0% 100%)",
    colorNeutral: "hsl(226 30% 18%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#080d1a] border border-[#1d243a] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-black/50",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold text-2xl tracking-tight",
    headerSubtitle: "text-gray-400 text-sm",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-gray-300 font-medium",
    footerActionLink: "text-[#e81c44] hover:text-[#ff335b] font-semibold",
    footerActionText: "text-gray-400",
    dividerText: "text-gray-500",
    identityPreviewEditButton: "text-[#e81c44] hover:text-[#ff335b]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-[#1d243a] hover:bg-[#151b2b] transition-colors",
    formButtonPrimary: "bg-[#e81c44] hover:bg-[#ff335b] text-white shadow-lg shadow-red-500/20 transition-all",
    formFieldInput: "bg-[#151b2b] border-[#1d243a] text-white focus:border-[#e81c44] focus:ring-[#e81c44]/20",
    footerAction: "mt-6",
    dividerLine: "bg-[#1d243a]",
    alert: "border-[#e81c44]/50 bg-[#e81c44]/10",
    otpCodeFieldInput: "bg-[#151b2b] border-[#1d243a] text-white",
    formFieldRow: "mb-4",
    main: "mt-4",
  },
};

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome to NEPZIA",
            subtitle: "Sign in to buy and sell premium tech",
          },
        },
        signUp: {
          start: {
            title: "Join NEPZIA",
            subtitle: "The marketplace for Nepal's tech enthusiasts",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />

              <Route path="/">
                <AppLayout><HomeRedirect /></AppLayout>
              </Route>
              <Route path="/browse">
                <AppLayout><Browse /></AppLayout>
              </Route>
              <Route path="/profile/:clerkId">
                <AppLayout><SellerProfile /></AppLayout>
              </Route>

              {/* Protected Routes */}
              <Route path="/listings/new">
                <AppLayout><ProtectedRoute component={CreateListing} /></AppLayout>
              </Route>
              <Route path="/listings/:id/edit">
                <AppLayout><ProtectedRoute component={EditListing} /></AppLayout>
              </Route>
              <Route path="/listings/:id">
                <AppLayout><ListingDetail /></AppLayout>
              </Route>
              <Route path="/dashboard">
                <AppLayout><ProtectedRoute component={Dashboard} /></AppLayout>
              </Route>
              <Route path="/dashboard/messages">
                <AppLayout><ProtectedRoute component={Messages} /></AppLayout>
              </Route>
              <Route path="/dashboard/wishlist">
                <AppLayout><ProtectedRoute component={Wishlist} /></AppLayout>
              </Route>
              <Route path="/dashboard/settings">
                <AppLayout><ProtectedRoute component={Settings} /></AppLayout>
              </Route>
              <Route path="/admin">
                <AppLayout><ProtectedRoute component={AdminPanel} /></AppLayout>
              </Route>

              <Route path="*">
                <AppLayout><NotFound /></AppLayout>
              </Route>
            </Switch>
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
