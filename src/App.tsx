import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResetPassword from '@/pages/ResetPassword';
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import ProjectPage from '@/pages/ProjectPage';
import Help from '@/pages/Help';
import Home from '@/pages/Home';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Cookies from '@/pages/Cookies';
import ExploreTools from '@/pages/ExploreTools';
import PricingPlans from '@/pages/PricingPlans';
import ToolPage from '@/pages/ToolPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <Router>
              <Routes>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/home" element={<Home />} />
                <Route path="/" element={
                  <MainLayout>
                    <Index />
                  </MainLayout>
                } />
                <Route path="/chat/:chatId" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Chat />
                    </MainLayout>
                  </ProtectedRoute>
                } />
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
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
            <Toaster />
            <Sonner />
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;