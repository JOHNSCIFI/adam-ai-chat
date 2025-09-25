import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MainLayout from '@/layouts/MainLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResetPassword from '@/pages/ResetPassword';
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import ProjectPage from '@/pages/ProjectPage';
import Help from '@/pages/Help';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import Features from '@/pages/Features';
import Models from '@/pages/Models';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Cookies from '@/pages/Cookies';
import ExploreTools from '@/pages/ExploreTools';
import PricingPlans from '@/pages/PricingPlans';
import ToolPage from '@/pages/ToolPage';
import NotFound from '@/pages/NotFound';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import HelpCenter from '@/pages/HelpCenter';
import RefundPolicy from '@/pages/RefundPolicy';
import CancelSubscription from '@/pages/CancelSubscription';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <ThemeProvider>
              <Router>
                <Routes>
                  {/* Root route - shows Chat */}
                  <Route path="/" element={
                    <MainLayout>
                      <Index />
                    </MainLayout>
                  } />
                  
                  {/* Chat routes */}
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Chat />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/chat/:chatId" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Chat />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Marketing homepage */}
                  <Route path="/home" element={
                    <PublicLayout>
                      <Home />
                    </PublicLayout>
                  } />
                  
                  {/* Public pages with header/footer */}
                  <Route path="/pricing" element={
                    <PublicLayout>
                      <Pricing />
                    </PublicLayout>
                  } />
                  <Route path="/features" element={
                    <PublicLayout>
                      <Features />
                    </PublicLayout>
                  } />
                  <Route path="/models" element={
                    <PublicLayout>
                      <Models />
                    </PublicLayout>
                  } />
                  <Route path="/about" element={
                    <PublicLayout>
                      <About />
                    </PublicLayout>
                  } />
                  <Route path="/contact" element={
                    <PublicLayout>
                      <Contact />
                    </PublicLayout>
                  } />
                  <Route path="/help-center" element={
                    <PublicLayout>
                      <HelpCenter />
                    </PublicLayout>
                  } />
                  <Route path="/terms" element={
                    <PublicLayout>
                      <Terms />
                    </PublicLayout>
                  } />
                  <Route path="/privacy" element={
                    <PublicLayout>
                      <Privacy />
                    </PublicLayout>
                  } />
                  <Route path="/refund-policy" element={
                    <PublicLayout>
                      <RefundPolicy />
                    </PublicLayout>
                  } />
                  <Route path="/cookie-policy" element={
                    <PublicLayout>
                      <Cookies />
                    </PublicLayout>
                  } />
                  <Route path="/cancel-subscription" element={
                    <PublicLayout>
                      <CancelSubscription />
                    </PublicLayout>
                  } />
                  
                  {/* Existing protected routes */}
                  <Route path="/project/:projectId" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProjectPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/help" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Help />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/explore-tools" element={
                    <MainLayout>
                      <ExploreTools />
                    </MainLayout>
                  } />
                  <Route path="/pricing-plans" element={
                    <MainLayout>
                      <PricingPlans />
                    </MainLayout>
                  } />
                  <Route path="/:toolName/:toolId" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ToolPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Auth pages */}
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
              <Toaster />
              <Sonner />
            </ThemeProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;