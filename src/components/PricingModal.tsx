import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Crown, Sparkles, Zap, Mic, FileText, MessageSquare, Image as ImageIcon, Infinity, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Feature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  ultra: boolean | string;
}

const allFeatures: Feature[] = [
  { name: 'All AI Models', free: false, pro: true, ultra: true },
  { name: 'Unlimited Chats', free: false, pro: true, ultra: true },
  { name: 'Voice Mode', free: false, pro: true, ultra: true },
  { name: 'File Uploads (100MB)', free: false, pro: true, ultra: true },
  { name: 'Image Generation (500/month)', free: false, pro: true, ultra: false },
  { name: 'Image Generation (2,000/month)', free: false, pro: false, ultra: true },
  { name: 'Priority Support', free: false, pro: true, ultra: false },
  { name: 'Premium 24/7 Support', free: false, pro: false, ultra: true },
  { name: 'Team Collaboration', free: false, pro: false, ultra: true },
  { name: 'Early Access to Models', free: false, pro: false, ultra: true },
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
    monthly: 'price_1SH1jRL8Zm4LqDn4M49yf60W',
    yearly: 'price_1SHinzL8Zm4LqDn4jE1jGyKi'
  },
  ultra: {
    monthly: 'price_1SH1jpL8Zm4LqDn4zN9CGBpC',
    yearly: 'price_1SHioTL8Zm4LqDn41Pd00GWM'
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
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
  const savings = selectedPeriod === 'yearly' ? pricingOptions[selectedPlan].yearly.savings : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Left Panel - Features Comparison */}
            <div className="w-full md:w-5/12 bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6 lg:p-8 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col">
              <div className="mb-4 md:mb-6 flex-shrink-0">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white mb-1 md:mb-2">Plan Comparison</h3>
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                  See what's included in each plan
                </p>
              </div>
              
              {/* Comparison Table */}
              <div className="space-y-0.5 md:space-y-1 flex-1 overflow-y-auto">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-1 md:gap-2 pb-2 md:pb-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                  <div className="text-[10px] md:text-xs font-semibold text-zinc-600 dark:text-zinc-400">Feature</div>
                  <div className="text-[10px] md:text-xs font-semibold text-center text-zinc-600 dark:text-zinc-400">Free</div>
                  <div className="text-[10px] md:text-xs font-semibold text-center text-zinc-900 dark:text-white">
                    {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'}
                  </div>
                </div>
                
                {/* Feature Rows */}
                {allFeatures
                  .filter((feature) => {
                    const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                    return selectedValue !== false;
                  })
                  .map((feature, index) => {
                    const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                    
                    return (
                      <div key={index} className="grid grid-cols-3 gap-1 md:gap-2 py-2 md:py-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="text-[10px] md:text-xs font-medium text-zinc-900 dark:text-white">
                          {feature.name}
                        </div>
                        <div className="flex justify-center items-center">
                          {feature.free === false ? (
                            <X className="w-3 h-3 md:w-4 md:h-4 text-zinc-400 dark:text-zinc-600" />
                          ) : (
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-500" />
                          )}
                        </div>
                        <div className="flex justify-center items-center">
                          {selectedValue === false ? (
                            <X className="w-3 h-3 md:w-4 md:h-4 text-zinc-400 dark:text-zinc-600" />
                          ) : (
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-zinc-900 dark:text-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-7/12 p-4 md:p-6 lg:p-8 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto">
              <div className="mb-4 md:mb-6 lg:mb-8 flex-shrink-0">
                <Badge className="mb-2 md:mb-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-0 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-bold">
                  {selectedPlan === 'pro' ? '⭐ Most Popular' : '👑 For Power Users'}
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 text-zinc-900 dark:text-white">
                  Choose Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base lg:text-lg">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-4 md:mb-6 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2 h-10 md:h-12 lg:h-14 bg-zinc-100 dark:bg-zinc-900 p-1 md:p-1.5 border border-zinc-200 dark:border-zinc-800">
                  <TabsTrigger 
                    value="pro" 
                    className="text-xs md:text-sm lg:text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Pro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-xs md:text-sm lg:text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Ultra Pro
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-2 md:space-y-3 lg:space-y-4 mb-4 md:mb-6 flex-1 overflow-y-auto">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-3 md:p-4 lg:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 text-left group ${
                    selectedPeriod === 'monthly'
                      ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm md:text-lg lg:text-xl mb-0.5 md:mb-1 lg:mb-1.5 text-zinc-900 dark:text-white">Monthly</div>
                      <div className="text-[10px] md:text-xs lg:text-sm text-zinc-600 dark:text-zinc-400">
                        Billed monthly • Flexible
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl md:text-2xl lg:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].monthly.price}</div>
                      <div className="text-[10px] md:text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 md:mt-1">per month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-3 md:p-4 lg:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 text-left relative group ${
                    selectedPeriod === 'yearly'
                      ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-2 md:-top-3 right-4 md:right-6 bg-green-600 text-white shadow-lg px-2 md:px-3 lg:px-4 py-0.5 md:py-1 lg:py-1.5 text-[10px] md:text-xs lg:text-sm font-bold border-0">
                    Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm md:text-lg lg:text-xl mb-0.5 md:mb-1 lg:mb-1.5 text-zinc-900 dark:text-white">Yearly</div>
                      <div className="text-[10px] md:text-xs lg:text-sm text-zinc-600 dark:text-zinc-400">
                        Billed annually • Best value
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1 md:gap-2 justify-end">
                        <div className="font-bold text-xl md:text-2xl lg:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].yearly.price}</div>
                        <div className="text-sm md:text-base lg:text-lg text-zinc-400 dark:text-zinc-600 line-through">€{pricingOptions[selectedPlan].monthly.price}</div>
                      </div>
                      <div className="text-[10px] md:text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 md:mt-1">per month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-12 md:h-14 lg:h-16 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm md:text-base lg:text-lg shadow-lg hover:shadow-xl transition-all rounded-lg md:rounded-xl border-0 flex-shrink-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="hidden md:inline">Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'} Plan</span>
                    <span className="md:hidden">Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'}</span>
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-4 md:mt-6 space-y-2 md:space-y-3 flex-shrink-0">
                {/* Payment Cards */}
                <div className="flex items-center justify-center gap-2 md:gap-3 lg:gap-4 py-1 md:py-2">
                  {/* Visa */}
                  <div className="w-10 h-6 md:w-12 md:h-8 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <svg className="h-3 md:h-4" viewBox="0 0 48 16" fill="none">
                      <path d="M20.8 14.4h-3.2L19.6 1.6h3.2l-2 12.8zm13.2-12.5c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.3 1.7-5.3 4 0 1.8 1.5 2.7 2.7 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-.9 1.2-1.8 1.2-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.4-4.2 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.7.2 2.3.4l.3.1.4-2.3zm5.8-2.3h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11.5h3.3l.7-1.9h4.1l.4 1.9h2.9l-2.4-12.5zm-3.7 8.1l1.7-4.7.9 4.7h-2.6zM15.5 1.6l-3.1 8.7-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.9 10.7h3.3l4.9-12.7h-3.4z" fill="#1434CB"/>
                      <path d="M7.8 1.6H2.6L2.5 2c3.9.9 6.5 3.2 7.5 5.9l-1.1-5.2c-.2-.8-.7-1-.9-1.1z" fill="#F7A600"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-10 h-6 md:w-12 md:h-8 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <svg className="h-4 md:h-5" viewBox="0 0 32 20" fill="none">
                      <circle cx="11" cy="10" r="9" fill="#EB001B"/>
                      <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
                      <path d="M16 14.2c1.1-1.2 1.8-2.7 1.8-4.2 0-1.5-.7-3-1.8-4.2-1.1 1.2-1.8 2.7-1.8 4.2 0 1.5.7 3 1.8 4.2z" fill="#FF5F00"/>
                    </svg>
                  </div>
                  {/* American Express */}
                  <div className="w-10 h-6 md:w-12 md:h-8 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <svg className="h-3 md:h-4" viewBox="0 0 32 20" fill="none">
                      <rect width="32" height="20" rx="2" fill="#006FCF"/>
                      <path d="M8.5 7.5h2.7l-.7 1.8h-2l-.5 1.2h2l-.7 1.8h-2l-.5 1.2h2.7l-.7 1.8H5.5l2.4-6h.6v-1.8zm6.8 0l-1.8 4.8h-.1l-.9-4.8h-2.4l2.4 6h2.4l2.4-6h-2zm6.2 1.8h-2.4l.4-1.8h7.2l-.4 1.8h-2.4l-2 4.2h-2.4l2-4.2z" fill="white"/>
                    </svg>
                  </div>
                </div>

                <p className="text-[10px] md:text-xs text-center text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-md mx-auto px-2">
                  By subscribing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>,{' '}
                  <a href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</a>, and{' '}
                  <a href="/refund-policy" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Refund Policy</a>
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
