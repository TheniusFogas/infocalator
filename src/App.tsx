import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Atractii from "./pages/Atractii";
import AtractieDetail from "./pages/AtractieDetail";
import Localitati from "./pages/Localitati";
import LocalitateDetail from "./pages/LocalitateDetail";
import Vremea from "./pages/Vremea";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/atractii" element={<Atractii />} />
          <Route path="/atractii/:id" element={<AtractieDetail />} />
          <Route path="/localitati" element={<Localitati />} />
          <Route path="/localitati/:id" element={<LocalitateDetail />} />
          <Route path="/vremea" element={<Vremea />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
