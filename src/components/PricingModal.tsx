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

const proFeatures: Feature[] = [
  { icon: Sparkles, name: 'All AI models: GPT-4, GPT-5, Claude, Gemini, DeepSeek, Grok', free: false, pro: true, ultra: true },
  { icon: MessageSquare, name: 'Unlimited chats & model switching', free: false, pro: true, ultra: true },
  { icon: Mic, name: 'Voice mode (text-to-speech)', free: false, pro: true, ultra: true },
  { icon: FileText, name: 'File uploads (up to 100MB)', free: false, pro: true, ultra: true },
  { icon: FileText, name: 'Chat with PDFs (full access)', free: false, pro: true, ultra: true },
  { icon: ImageIcon, name: 'Image generation (500/month)', free: false, pro: true, ultra: false },
  { icon: Check, name: 'Priority support', free: false, pro: true, ultra: true },
];

const ultraFeatures: Feature[] = [
  { icon: Sparkles, name: 'All AI models: GPT-4, GPT-5, Claude, Gemini, DeepSeek, Grok', free: false, pro: true, ultra: true },
  { icon: MessageSquare, name: 'Unlimited chats & model switching', free: false, pro: true, ultra: true },
  { icon: Mic, name: 'Voice mode (text-to-speech)', free: false, pro: true, ultra: true },
  { icon: FileText, name: 'File uploads (up to 100MB)', free: false, pro: true, ultra: true },
  { icon: FileText, name: 'Chat with PDFs (full access)', free: false, pro: true, ultra: true },
  { icon: ImageIcon, name: 'Image generation (2,000/month)', free: false, pro: false, ultra: true },
  { icon: Zap, name: 'Extended file & message limits', free: false, pro: false, ultra: true },
  { icon: Crown, name: 'Premium 24/7 support', free: false, pro: false, ultra: true },
  { icon: Infinity, name: 'Team collaboration features', free: false, pro: false, ultra: true },
  { icon: Sparkles, name: 'Early access to new models', free: false, pro: false, ultra: true },
];

const pricingOptions = {
  pro: {
    monthly: { price: 19.99, perDay: 0.67 },
    yearly: { price: 15.99, perDay: 0.53, savings: 20 }
  },
  ultra: {
    monthly: { price: 39.99, perDay: 1.33 },
    yearly: { price: 31.99, perDay: 1.07, savings: 20 }
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
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const features = selectedPlan === 'pro' ? proFeatures : ultraFeatures;

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
  const savings = selectedPeriod === 'yearly' ? pricingOptions[selectedPlan].yearly.savings : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[650px]">
            {/* Left Panel - Features */}
            <div className="w-full md:w-2/5 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 border-r">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  {selectedPlan === 'pro' ? (
                    <>
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold">Pro Features</h3>
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold">Ultra Pro Features</h3>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan === 'pro' 
                    ? 'Everything you need for professional AI work' 
                    : 'Maximum power for teams and power users'}
                </p>
              </div>
              
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isIncluded = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                  
                  return (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isIncluded 
                          ? 'bg-primary/10 group-hover:bg-primary/20' 
                          : 'bg-muted'
                      }`}>
                        {isIncluded ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <X className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm leading-relaxed ${
                        isIncluded 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground line-through'
                      }`}>
                        {feature.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-3/5 p-8 flex flex-col">
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>

              <div className="mb-8">
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                  {selectedPlan === 'pro' ? '⭐ Most Popular' : '🚀 Power Users'}
                </Badge>
                <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-muted-foreground">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-8">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="pro" className="text-base font-semibold">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Pro
                  </TabsTrigger>
                  <TabsTrigger value="ultra" className="text-base font-semibold">
                    <Crown className="w-4 h-4 mr-2" />
                    Ultra Pro
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-4 mb-8 flex-1">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                    selectedPeriod === 'monthly'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg mb-1">Monthly</div>
                      <div className="text-sm text-muted-foreground">
                        Billed monthly
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-2xl">€{currentPrice.price}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left relative hover:shadow-md ${
                    selectedPeriod === 'yearly'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {savings > 0 && (
                    <Badge className="absolute -top-3 right-4 bg-green-500 hover:bg-green-600 shadow-md">
                      Save {savings}%
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg mb-1">Yearly</div>
                      <div className="text-sm text-muted-foreground">
                        Billed annually • Best value
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-2xl">€{currentPrice.price}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Subscribe to ${selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'} →`
                )}
              </Button>

              {/* Footer */}
              <div className="mt-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-500">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Secure payment with Stripe</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By subscribing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-foreground transition-colors">Terms</a>,{' '}
                  <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>, and{' '}
                  <a href="/refund-policy" className="underline hover:text-foreground transition-colors">Refund Policy</a>
                </p>
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
