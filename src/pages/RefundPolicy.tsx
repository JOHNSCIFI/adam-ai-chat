import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users } from 'lucide-react';
import SEO from '@/components/SEO';
import ChatLearnLogo from '@/components/ChatLearnLogo';

const RefundPolicy = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Refund Policy"
        description="ChatLearn refund policy and terms for subscription cancellations and service satisfaction guarantees."
      />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Refund Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">30-Day Money-Back Guarantee</h2>
            <p>
              We're committed to your satisfaction. If you're not completely happy with ChatLearn within the first 30 days 
              of your subscription, we'll provide a full refund, no questions asked.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Refund Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds are available for subscriptions purchased within the last 30 days</li>
              <li>Free trial users are not eligible for refunds as no payment was made</li>
              <li>Refunds apply to the current billing period only</li>
              <li>Previous billing periods are not eligible for refund after 30 days</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our support team at support@adamchat.app</li>
              <li>Include your account email and reason for the refund request</li>
              <li>We'll process your request within 2-3 business days</li>
              <li>Refunds are issued to the original payment method within 5-10 business days</li>
            </ol>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Partial Refunds</h2>
            <p>
              In some cases, we may offer partial refunds for exceptional circumstances beyond the 30-day window. 
              These are evaluated on a case-by-case basis and are at our sole discretion.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cancellation vs Refund</h2>
            <p>
              Canceling your subscription stops future billing but doesn't provide a refund for the current period. 
              You'll continue to have access to ChatLearn until the end of your current billing cycle.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>
              If you have any questions about our refund policy or need assistance with a refund request, 
              please contact our support team at support@adamchat.app or through our live chat.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer from Terms page */}
      <footer className="py-12 px-4 bg-muted/20 border-t">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChatLearnLogo className="h-6 w-6" />
                <span className="text-lg font-semibold text-foreground">ChatLearn</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Professional AI solutions for businesses and individuals.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Product</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/features')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</button>
                <button onClick={() => navigate('/pricing')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
                <button onClick={() => navigate('/models')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">AI Models</button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Company</h3>
              <div className="space-y-2">
                <a href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="/explore-tools" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Explore Tools</a>
                <a href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Legal</h3>
              <div className="space-y-2">
                <a href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                <a href="/cookie-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <p className="text-muted-foreground">
                &copy; 2024 ChatLearn. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>10,000+ Users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicy;