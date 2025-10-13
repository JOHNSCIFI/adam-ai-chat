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
        <DialogContent className="max-w-7xl w-[95vw] h-[92vh] p-0 bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 border-2 border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Panel - Features Comparison */}
            <div className="w-full md:w-7/12 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6 md:p-8 border-r-2 border-zinc-700 dark:border-zinc-800 flex flex-col relative">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>
              
              <div className="mb-6 flex-shrink-0 relative z-10">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                    What's Included
                  </h3>
                </div>
                <p className="text-sm md:text-base text-zinc-300">
                  Compare features across all plans
                </p>
              </div>
              
              {/* Comparison Table */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-4 pb-4 border-b-2 border-zinc-700/50 mb-2 flex-shrink-0">
                  <div className="text-sm md:text-base font-bold text-zinc-400">Feature</div>
                  <div className="text-sm md:text-base font-bold text-center text-zinc-400">Free</div>
                  <div className="text-sm md:text-base font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {selectedPlan === 'pro' ? '⭐ Pro' : '👑 Ultra Pro'}
                  </div>
                </div>
                
                {/* Feature Rows - Scrollable if needed but try to fit */}
                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                  {allFeatures
                    .filter((feature) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      return selectedValue !== false;
                    })
                    .map((feature, index) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      
                      return (
                        <div key={index} className="grid grid-cols-3 gap-4 py-3 px-3 rounded-lg hover:bg-white/5 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-zinc-700/50">
                          <div className="text-sm md:text-base font-medium text-white flex items-center">
                            {feature.name}
                          </div>
                          <div className="flex justify-center items-center">
                            {feature.free === false ? (
                              <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <X className="w-4 h-4 text-zinc-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-center items-center">
                            {selectedValue === false ? (
                              <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <X className="w-4 h-4 text-zinc-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-blue-400/30">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-5/12 p-6 md:p-8 flex flex-col bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/30">
              <div className="mb-6 flex-shrink-0">
                <Badge className="mb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-1.5 text-sm font-bold shadow-lg">
                  {selectedPlan === 'pro' ? '⭐ Most Popular' : '👑 For Power Users'}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                  Choose Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-base">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-5 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-zinc-100 dark:bg-zinc-900 p-1.5 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <TabsTrigger 
                    value="pro" 
                    className="text-sm font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Pro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-sm font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Ultra Pro
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-3 mb-5 flex-1 min-h-0">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${
                    selectedPeriod === 'monthly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  {selectedPeriod === 'monthly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="font-bold text-lg mb-1 text-zinc-900 dark:text-white">Monthly</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Billed monthly • Flexible
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].monthly.price}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">per month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left relative group overflow-hidden ${
                    selectedPeriod === 'yearly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg px-3 py-1 text-xs font-bold border-0">
                    Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  {selectedPeriod === 'yearly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="font-bold text-lg mb-1 text-zinc-900 dark:text-white">Yearly</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Billed annually • Best value
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-2 justify-end">
                        <div className="font-bold text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].yearly.price}</div>
                        <div className="text-lg text-zinc-400 dark:text-zinc-600 line-through">€{pricingOptions[selectedPlan].monthly.price}</div>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">per month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base shadow-2xl hover:shadow-blue-500/50 transition-all rounded-xl border-0 flex-shrink-0 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'} Plan
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-5 space-y-3 flex-shrink-0">
                {/* Payment Cards */}
                <div className="flex items-center justify-center gap-3 py-2">
                  {/* Visa */}
                  <div className="w-12 h-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-4" viewBox="0 0 48 16" fill="none">
                      <path d="M20.8 14.4h-3.2L19.6 1.6h3.2l-2 12.8zm13.2-12.5c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.3 1.7-5.3 4 0 1.8 1.5 2.7 2.7 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-.9 1.2-1.8 1.2-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.4-4.2 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.7.2 2.3.4l.3.1.4-2.3zm5.8-2.3h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11.5h3.3l.7-1.9h4.1l.4 1.9h2.9l-2.4-12.5zm-3.7 8.1l1.7-4.7.9 4.7h-2.6zM15.5 1.6l-3.1 8.7-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.9 10.7h3.3l4.9-12.7h-3.4z" fill="#1434CB"/>
                      <path d="M7.8 1.6H2.6L2.5 2c3.9.9 6.5 3.2 7.5 5.9l-1.1-5.2c-.2-.8-.7-1-.9-1.1z" fill="#F7A600"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-12 h-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-5" viewBox="0 0 32 20" fill="none">
                      <circle cx="11" cy="10" r="9" fill="#EB001B"/>
                      <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
                      <path d="M16 14.2c1.1-1.2 1.8-2.7 1.8-4.2 0-1.5-.7-3-1.8-4.2-1.1 1.2-1.8 2.7-1.8 4.2 0 1.5.7 3 1.8 4.2z" fill="#FF5F00"/>
                    </svg>
                  </div>
                  {/* American Express */}
                  <div className="w-12 h-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-4" viewBox="0 0 32 20" fill="none">
                      <rect width="32" height="20" rx="2" fill="#006FCF"/>
                      <path d="M8.5 7.5h2.7l-.7 1.8h-2l-.5 1.2h2l-.7 1.8h-2l-.5 1.2h2.7l-.7 1.8H5.5l2.4-6h.6v-1.8zm6.8 0l-1.8 4.8h-.1l-.9-4.8h-2.4l2.4 6h2.4l2.4-6h-2zm6.2 1.8h-2.4l.4-1.8h7.2l-.4 1.8h-2.4l-2 4.2h-2.4l2-4.2z" fill="white"/>
                    </svg>
                  </div>
                </div>

                <p className="text-xs text-center text-zinc-500 dark:text-zinc-500 leading-relaxed">
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
