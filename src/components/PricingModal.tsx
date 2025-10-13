import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Crown, Sparkles, Zap, Mic, FileText, MessageSquare, Image as ImageIcon, Infinity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Feature {
  icon: React.ElementType;
  name: string;
  free: boolean;
  pro: boolean;
  ultra: boolean;
}

const features: Feature[] = [
  { icon: Sparkles, name: 'Access to GPT-4o, GPT-5', free: false, pro: true, ultra: true },
  { icon: Sparkles, name: 'Access to Claude 3.5 Sonnet', free: false, pro: true, ultra: true },
  { icon: Sparkles, name: 'Access to Google Gemini', free: false, pro: true, ultra: true },
  { icon: Sparkles, name: 'Access to DeepSeek V3', free: false, pro: true, ultra: true },
  { icon: Sparkles, name: 'Access to Grok', free: false, pro: true, ultra: true },
  { icon: MessageSquare, name: 'Unlimited Chats', free: false, pro: true, ultra: true },
  { icon: Mic, name: 'Voice Mode', free: false, pro: true, ultra: true },
  { icon: FileText, name: 'File Uploads (100MB)', free: false, pro: true, ultra: true },
  { icon: ImageIcon, name: 'Image Generation (100/month)', free: false, pro: true, ultra: false },
  { icon: ImageIcon, name: 'Image Generation (Unlimited)', free: false, pro: false, ultra: true },
  { icon: Infinity, name: 'No Limits', free: false, pro: false, ultra: true },
];

const pricingOptions = {
  pro: {
    monthly: { price: 19.99, perDay: 0.67 },
    quarterly: { price: 39.99, perDay: 0.44, savings: 33 },
    yearly: { price: 59.99, perDay: 0.16, savings: 75 }
  },
  ultra: {
    monthly: { price: 29.99, perDay: 1.00 },
    quarterly: { price: 59.99, perDay: 0.67, savings: 33 },
    yearly: { price: 99.99, perDay: 0.27, savings: 72 }
  }
};

// Stripe price IDs
const priceIds = {
  pro: {
    monthly: 'price_1QiRUzJUJwxjDZUk0YgC0p9u',
    quarterly: 'price_1QiRVJJUJwxjDZUk5kVq39rI',
    yearly: 'price_1QiRVYJUJwxjDZUkW9nM6Rnf'
  },
  ultra: {
    monthly: 'price_1QiRWPJUJwxjDZUkXKwWQmLn',
    quarterly: 'price_1QiRWgJUJwxjDZUkFZ8d7Kky',
    yearly: 'price_1QiRWxJUJwxjDZUkE3zV8nLm'
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const priceId = priceIds[selectedPlan][selectedPeriod];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrice = pricingOptions[selectedPlan][selectedPeriod];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Left Panel - Features */}
            <div className="w-full md:w-2/5 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-r">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Features</h3>
              </div>
              
              <div className="space-y-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isIncluded = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                  
                  return (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-foreground/80">{feature.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 flex justify-center">
                          {feature.free ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="w-8 flex justify-center">
                          {isIncluded ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-6 text-xs font-medium text-muted-foreground">
                <div className="flex-1 text-center">Free</div>
                <div className="w-8 text-center">{selectedPlan === 'pro' ? 'Pro' : 'Ultra'}</div>
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-3/5 p-8">
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>

              <div className="mb-6">
                <Badge className="mb-3">Pricing Plan</Badge>
                <h2 className="text-2xl font-bold mb-2">Upgrade to ChatL Pro</h2>
                <p className="text-muted-foreground text-sm">Unlock the full potential of ChatL</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pro">Pro</TabsTrigger>
                  <TabsTrigger value="ultra">Ultra Pro</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPeriod === 'monthly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">1 Month</div>
                      <div className="text-sm text-muted-foreground">
                        ${currentPrice.price}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${currentPrice.perDay.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Per Day</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('quarterly')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                    selectedPeriod === 'quarterly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {pricingOptions[selectedPlan].quarterly.savings && (
                    <Badge className="absolute -top-2 right-4 bg-orange-500 hover:bg-orange-600">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">3 Months</div>
                      <div className="text-sm text-muted-foreground">
                        ${pricingOptions[selectedPlan].quarterly.price}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${pricingOptions[selectedPlan].quarterly.perDay.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Per Day</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                    selectedPeriod === 'yearly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {pricingOptions[selectedPlan].yearly.savings && (
                    <Badge className="absolute -top-2 right-4 bg-green-500 hover:bg-green-600">
                      Save {pricingOptions[selectedPlan].yearly.savings}%
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">1 Year</div>
                      <div className="text-sm text-muted-foreground">
                        ${pricingOptions[selectedPlan].yearly.price}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${pricingOptions[selectedPlan].yearly.perDay.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Per Day</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </Button>

              {/* Footer */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  By continuing an account, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>,{' '}
                  <a href="/privacy" className="underline hover:text-foreground">Privacy & Cookie Statement</a>, and{' '}
                  <a href="/refund-policy" className="underline hover:text-foreground">Refund & Cancellation Policy</a>
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-green-600">
                  <Check className="w-3 h-3" />
                  <span>Pay safe & secure</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};
