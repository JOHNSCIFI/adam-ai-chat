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
  { name: 'AI Models Access', free: 'GPT-4o Mini only', pro: 'All models: GPT-4, GPT-5, Claude 3.5, Gemini 2.5, DeepSeek V3, Grok 2', ultra: 'All models: GPT-4, GPT-5, Claude 3.5, Gemini 2.5, DeepSeek V3, Grok 2' },
  { name: 'Messages per Day', free: '10 messages/day', pro: 'Unlimited messages', ultra: 'Unlimited messages' },
  { name: 'Chat History', free: '7 days', pro: 'Unlimited history', ultra: 'Unlimited history' },
  { name: 'Switch Models Mid-Chat', free: false, pro: true, ultra: true },
  { name: 'Voice Mode (Text-to-Speech)', free: false, pro: 'Unlimited voice messages', ultra: 'Unlimited voice messages' },
  { name: 'Speech-to-Text', free: false, pro: 'Unlimited audio transcription', ultra: 'Unlimited audio transcription' },
  { name: 'File Upload Size', free: false, pro: 'Up to 100MB per file', ultra: 'Up to 100MB per file' },
  { name: 'Files per Message', free: false, pro: 'Up to 10 files', ultra: 'Up to 10 files' },
  { name: 'PDF Analysis', free: false, pro: 'Full document analysis', ultra: 'Full document analysis + OCR' },
  { name: 'Image Generation', free: false, pro: '500 images/month', ultra: '2,000 images/month' },
  { name: 'Image Editing', free: false, pro: 'Unlimited edits', ultra: 'Unlimited edits + Advanced tools' },
  { name: 'Project Organization', free: '1 project', pro: 'Unlimited projects', ultra: 'Unlimited projects + Templates' },
  { name: 'Response Time', free: 'Standard', pro: 'Priority queue', ultra: 'Highest priority' },
  { name: 'Support', free: 'Community forums', pro: 'Email support (24h)', ultra: 'Premium 24/7 live chat' },
  { name: 'Team Collaboration', free: false, pro: false, ultra: 'Up to 10 team members' },
  { name: 'Custom Branding', free: false, pro: false, ultra: true },
  { name: 'API Access', free: false, pro: false, ultra: true },
  { name: 'Early Access to New Models', free: false, pro: false, ultra: true },
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
        <DialogContent className="max-w-4xl p-0 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden">
          <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden">
            {/* Left Panel - Features Comparison */}
            <div className="w-full md:w-5/12 bg-zinc-50 dark:bg-zinc-900 p-10 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Plan Comparison</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  See what's included in each plan
                </p>
              </div>
              
              {/* Comparison Table */}
              <div className="space-y-1">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Feature</div>
                  <div className="text-xs font-semibold text-center text-zinc-600 dark:text-zinc-400">Free</div>
                  <div className="text-xs font-semibold text-center text-zinc-900 dark:text-white">
                    {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'}
                  </div>
                </div>
                
                {/* Feature Rows */}
                {allFeatures
                  .filter((feature) => {
                    const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                    // Hide features where the selected plan doesn't have access
                    return selectedValue !== false;
                  })
                  .map((feature, index) => {
                    const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                    
                    return (
                      <div key={index} className="grid grid-cols-3 gap-2 py-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="text-xs font-medium text-zinc-900 dark:text-white">
                          {feature.name}
                        </div>
                        <div className="flex justify-center items-center">
                          {feature.free === false ? (
                            <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                          ) : (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
                          )}
                        </div>
                        <div className="flex justify-center items-center">
                          {selectedValue === false ? (
                            <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                          ) : (
                            <Check className="w-4 h-4 text-zinc-900 dark:text-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-7/12 p-10 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto">
              <div className="mb-10">
                <Badge className="mb-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-0 px-4 py-1.5 text-sm font-bold">
                  {selectedPlan === 'pro' ? '⭐ Most Popular' : '👑 For Power Users'}
                </Badge>
                <h2 className="text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
                  Choose Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-8">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-zinc-100 dark:bg-zinc-900 p-1.5 border border-zinc-200 dark:border-zinc-800">
                  <TabsTrigger 
                    value="pro" 
                    className="text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Pro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
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
                      ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xl mb-1.5 text-zinc-900 dark:text-white">Monthly</div>
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
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left relative group ${
                    selectedPeriod === 'yearly'
                      ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-3 right-6 bg-green-600 text-white shadow-lg px-4 py-1.5 text-sm font-bold border-0">
                    Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xl mb-1.5 text-zinc-900 dark:text-white">Yearly</div>
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
                className="w-full h-16 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-lg shadow-lg hover:shadow-xl transition-all rounded-xl border-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
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
              <div className="mt-8 space-y-4">
                {/* Payment Cards */}
                <div className="flex items-center justify-center gap-4 py-2">
                  {/* Visa */}
                  <div className="w-12 h-8 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <svg className="h-4" viewBox="0 0 48 16" fill="none">
                      <path d="M20.8 14.4h-3.2L19.6 1.6h3.2l-2 12.8zm13.2-12.5c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.3 1.7-5.3 4 0 1.8 1.5 2.7 2.7 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-.9 1.2-1.8 1.2-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.4-4.2 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.7.2 2.3.4l.3.1.4-2.3zm5.8-2.3h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11.5h3.3l.7-1.9h4.1l.4 1.9h2.9l-2.4-12.5zm-3.7 8.1l1.7-4.7.9 4.7h-2.6zM15.5 1.6l-3.1 8.7-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.9 10.7h3.3l4.9-12.7h-3.4z" fill="#1434CB"/>
                      <path d="M7.8 1.6H2.6L2.5 2c3.9.9 6.5 3.2 7.5 5.9l-1.1-5.2c-.2-.8-.7-1-.9-1.1z" fill="#F7A600"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-12 h-8 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <svg className="h-5" viewBox="0 0 32 20" fill="none">
                      <circle cx="11" cy="10" r="9" fill="#EB001B"/>
                      <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
                      <path d="M16 14.2c1.1-1.2 1.8-2.7 1.8-4.2 0-1.5-.7-3-1.8-4.2-1.1 1.2-1.8 2.7-1.8 4.2 0 1.5.7 3 1.8 4.2z" fill="#FF5F00"/>
                    </svg>
                  </div>
                  {/* American Express */}
                  <div className="w-12 h-8 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <svg className="h-4" viewBox="0 0 32 20" fill="none">
                      <rect width="32" height="20" rx="2" fill="#006FCF"/>
                      <path d="M8.5 7.5h2.7l-.7 1.8h-2l-.5 1.2h2l-.7 1.8h-2l-.5 1.2h2.7l-.7 1.8H5.5l2.4-6h.6v-1.8zm6.8 0l-1.8 4.8h-.1l-.9-4.8h-2.4l2.4 6h2.4l2.4-6h-2zm6.2 1.8h-2.4l.4-1.8h7.2l-.4 1.8h-2.4l-2 4.2h-2.4l2-4.2z" fill="white"/>
                    </svg>
                  </div>
                </div>

                <p className="text-xs text-center text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-md mx-auto">
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
