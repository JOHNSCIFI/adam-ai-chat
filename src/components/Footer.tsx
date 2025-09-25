import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Sparkles } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
const Footer = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AdamGptLogo className="h-8 w-8" />
              <span className="text-lg font-bold text-foreground">AdamGpt</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Experience the next generation of AI assistance with our advanced conversational AI platform.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/features')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/models')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Models
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/help')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/contact')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/about')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/privacy')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/terms')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/cookies')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 AdamGpt. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Trusted by Thousands</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;