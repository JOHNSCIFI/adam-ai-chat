import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
              <Link to="/help-center" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </Link>
            </nav>
          </div>

          {/* Models */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Models</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                GPT-4o
              </Link>
              <Link to="/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Gemini
              </Link>
              <Link to="/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Claude
              </Link>
              <Link to="/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                DeepSeek
              </Link>
            </nav>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Features</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                AI Chatbot
              </Link>
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                AI Image Generation
              </Link>
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Ask PDF
              </Link>
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                AI Writing
              </Link>
            </nav>
          </div>

          {/* Terms & Policies */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Terms & Policies</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Use
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/refund-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Refund Policy
              </Link>
              <Link to="/cookie-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
            </nav>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Customer Support</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/cancel-subscription" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel Subscription
              </Link>
              <span className="text-sm text-muted-foreground">Support 24/7/365</span>
            </nav>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Language Selector */}
            <div className="flex items-center space-x-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select defaultValue="en">
                <SelectTrigger className="w-24 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>

            {/* Payment Icons */}
            <div className="flex items-center space-x-3">
              <div className="text-xs text-muted-foreground font-medium px-2 py-1 bg-card border border-border rounded">
                AMEX
              </div>
              <div className="text-xs text-muted-foreground font-medium px-2 py-1 bg-card border border-border rounded">
                DISCOVER
              </div>
              <div className="text-xs text-muted-foreground font-medium px-2 py-1 bg-card border border-border rounded">
                MASTERCARD
              </div>
              <div className="text-xs text-muted-foreground font-medium px-2 py-1 bg-card border border-border rounded">
                VISA
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AdamGpt. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;