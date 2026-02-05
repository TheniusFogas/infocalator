import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import Index from "./pages/Index";
import Atractii from "./pages/Atractii";
import AtractieDetail from "./pages/AtractieDetail";
import Localitati from "./pages/Localitati";
import LocalitateDetail from "./pages/LocalitateDetail";
import Vremea from "./pages/Vremea";
import EvenimentDetail from "./pages/EvenimentDetail";
import CazareDetail from "./pages/CazareDetail";
import CazariList from "./pages/CazariList";
import AtractieAIDetail from "./pages/AtractieAIDetail";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
 import FuelPrices from "./pages/FuelPrices";
 import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/atractii" element={<Atractii />} />
            <Route path="/atractii/:id" element={<AtractieDetail />} />
            <Route path="/atractii-ai/:slug" element={<AtractieAIDetail />} />
            <Route path="/localitati" element={<Localitati />} />
            <Route path="/localitati/:id" element={<LocalitateDetail />} />
            <Route path="/cazari" element={<CazariList />} />
            <Route path="/cazari/:slug" element={<CazareDetail />} />
            <Route path="/vremea" element={<Vremea />} />
             <Route path="/preturi-carburanti" element={<FuelPrices />} />
            <Route path="/evenimente/:slug" element={<EvenimentDetail />} />
             <Route path="/autentificare" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
