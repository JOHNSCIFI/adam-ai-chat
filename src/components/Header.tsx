import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Text Only */}
          <Link to="/home" className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm">
            <span className="text-xl font-bold text-foreground">AdamGpt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/models" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              AI Tools
            </Link>
            <Link 
              to="/features" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              What You Can Do
            </Link>
            <Link 
              to="/pricing" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              Plans
            </Link>
            <Link 
              to="/contact" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              Contact Us
            </Link>
          </nav>

          {/* Theme Toggle & CTA Button */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full p-0 hover:bg-muted transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 transition-transform" />
              ) : (
                <Sun className="h-4 w-4 transition-transform" />
              )}
            </Button>
            
            {!user ? (
              <>
                <Button 
                  onClick={() => setShowAuthModal(true)} 
                  className="hidden md:inline-flex bg-foreground text-background hover:bg-foreground/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Log in
                </Button>
                <Button 
                  onClick={() => setShowAuthModal(true)} 
                  variant="outline"
                  className="hidden md:inline-flex focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Sign up for free
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate('/')} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onMouseEnter={() => {
                  const link = document.createElement('link');
                  link.rel = 'prefetch';
                  link.href = '/';
                  document.head.appendChild(link);
                }}
              >
                Start Now
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-9 w-9 rounded-full p-0 hover:bg-muted transition-colors"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                  >
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <nav className="flex flex-col space-y-4">
                  <Link 
                    to="/models" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    AI Tools
                  </Link>
                  <Link 
                    to="/features" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    What You Can Do
                  </Link>
                  <Link 
                    to="/pricing" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Plans
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact Us
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </header>
  );
};

export default Header;