import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { RootLayout } from "@/components/layout/root-layout";
import { SearchProvider } from "@/context/search-context";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import "./i18n";

// Pages
import Dashboard from "@/pages/dashboard";
import CustomerSearch from "@/pages/customer-search";
import CustomerList from "@/pages/customer-list";
import Profile from "@/pages/profile";
import Calls from "@/pages/calls";
import AutoCalls from "@/pages/auto-calls";
import InstantVoiceCloning from "@/pages/voice/ivc";
import ProfessionalVoiceCloning from "@/pages/voice/pvc";
import Assistant from "@/pages/assistant";
import EmailPage from "@/pages/marketing/email";
import CalendarPage from "@/pages/marketing/calendar";
import SocialMediaPage from "@/pages/marketing/social";
import LanguageSettings from "@/pages/settings/language";
import ThemeSettings from "@/pages/settings/theme";
import ProfileSettings from "@/pages/settings/profile";
import SubscriptionSettings from "@/pages/settings/subscription";
import PrivacySettings from "@/pages/settings/privacy";
import HelpSettings from "@/pages/settings/help";
import Simulator from "@/pages/simulator";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import CompanyInformation from "@/pages/company/information"; // Import the new component

// Company Pages
import Portfolio from "@/pages/company/portfolio";
import Pricing from "@/pages/company/pricing";
import Revenue from "@/pages/company/revenue";
import Invoices from "@/pages/company/invoices";


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SearchProvider>
            <Switch>
              <Route path="/auth" component={AuthPage} />

              <Route>
                <ProtectedRoute>
                  <RootLayout>
                    <Switch>
                      <Route path="/" component={Dashboard} />

                      {/* Company Routes */}
                      <Route path="/company/portfolio" component={Portfolio} />
                      <Route path="/company/pricing" component={Pricing} />
                      <Route path="/company/revenue" component={Revenue} />
                      <Route path="/company/invoices" component={Invoices} />
                      <Route path="/company/information" component={CompanyInformation} /> {/* New route */}

                      <Route path="/customer-search" component={CustomerSearch} />
                      <Route path="/customer-list" component={CustomerList} />
                      <Route path="/profile" component={Profile} />
                      <Route path="/calls" component={Calls} />
                      <Route path="/auto-calls" component={AutoCalls} />
                      <Route path="/voice/ivc" component={InstantVoiceCloning} />
                      <Route path="/voice/pvc" component={ProfessionalVoiceCloning} />
                      <Route path="/assistant" component={Assistant} />
                      <Route path="/marketing/email" component={EmailPage} />
                      <Route path="/marketing/calendar" component={CalendarPage} />
                      <Route path="/marketing/social" component={SocialMediaPage} />
                      <Route path="/settings/language" component={LanguageSettings} />
                      <Route path="/settings/theme" component={ThemeSettings} />
                      <Route path="/settings/profile" component={ProfileSettings} />
                      <Route path="/settings/subscription" component={SubscriptionSettings} />
                      <Route path="/settings/privacy" component={PrivacySettings} />
                      <Route path="/settings/help" component={HelpSettings} />
                      <Route component={NotFound} />
                    </Switch>
                  </RootLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/simulator" component={Simulator} />
            </Switch>
            <Toaster />
          </SearchProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;