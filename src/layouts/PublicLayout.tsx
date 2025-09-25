import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsentBanner from '@/components/CookieConsentBanner';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
};

export default PublicLayout;