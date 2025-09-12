import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Help from '@/pages/Help';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Router>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Index />
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
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;