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
        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-background border-2">
          <div className="flex flex-col md:flex-row min-h-[700px]">
            {/* Left Panel - Features */}
            <div className="w-full md:w-5/12 bg-gradient-to-br from-muted/30 via-background to-muted/20 p-10 border-r relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    {selectedPlan === 'pro' ? (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Pro Plan</h3>
                          <p className="text-sm text-muted-foreground">Professional Features</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Crown className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Ultra Pro Plan</h3>
                          <p className="text-sm text-muted-foreground">Maximum Power</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isIncluded = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                    
                    return (
                      <div key={index} className="flex items-start gap-3 group animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                          isIncluded 
                            ? 'bg-primary/10 group-hover:bg-primary/15 group-hover:scale-110' 
                            : 'bg-muted/50'
                        }`}>
                          {isIncluded ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`text-sm leading-relaxed transition-colors ${
                          isIncluded 
                            ? 'text-foreground font-medium' 
                            : 'text-muted-foreground/60 line-through'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-7/12 p-10 flex flex-col bg-gradient-to-br from-background to-muted/10">
              <DialogClose className="absolute right-6 top-6 rounded-full p-2 hover:bg-muted/50 transition-colors">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogClose>

              <div className="mb-10">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
                  {selectedPlan === 'pro' ? '⭐ Most Popular' : '🚀 For Power Users'}
                </Badge>
                <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Choose Your Plan
                </h2>
                <p className="text-muted-foreground text-lg">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-8">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/30 p-1.5">
                  <TabsTrigger 
                    value="pro" 
                    className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Pro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Ultra Pro
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-4 mb-10 flex-1">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left group ${
                    selectedPeriod === 'monthly'
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/40 hover:shadow-md bg-background'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xl mb-1.5">Monthly</div>
                      <div className="text-sm text-muted-foreground">
                        Billed monthly • Flexible
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-3xl">€{currentPrice.price}</div>
                      <div className="text-sm text-muted-foreground mt-1">per month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left relative group ${
                    selectedPeriod === 'yearly'
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/40 hover:shadow-md bg-background'
                  }`}
                >
                  {savings > 0 && (
                    <Badge className="absolute -top-3 right-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg px-4 py-1.5 text-sm font-bold">
                      Save {savings}%
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xl mb-1.5">Yearly</div>
                      <div className="text-sm text-muted-foreground">
                        Billed annually • Best value
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-3xl">€{currentPrice.price}</div>
                      <div className="text-sm text-muted-foreground mt-1">per month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'} Plan
                    <Zap className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-8 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg py-2.5 px-4">
                  <Check className="w-4 h-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  By subscribing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-foreground transition-colors font-medium">Terms</a>,{' '}
                  <a href="/privacy" className="underline hover:text-foreground transition-colors font-medium">Privacy Policy</a>, and{' '}
                  <a href="/refund-policy" className="underline hover:text-foreground transition-colors font-medium">Refund Policy</a>
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
