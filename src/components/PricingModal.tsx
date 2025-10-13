import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Crown, Sparkles, Zap, MessageSquare, Mic, FileText, Image as ImageIcon, Users, Clock, Shield } from 'lucide-react';
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

interface FeatureGroup {
  category: string;
  icon: React.ReactNode;
  features: Feature[];
}

const featureGroups: FeatureGroup[] = [
  {
    category: 'AI & Models',
    icon: <Sparkles className="w-4 h-4" />,
    features: [
      { name: 'AI Models', free: 'GPT-4o Mini', pro: 'All Premium Models', ultra: 'All Premium Models' },
      { name: 'Model Switching', free: false, pro: true, ultra: true },
      { name: 'Early Access', free: false, pro: false, ultra: true },
    ]
  },
  {
    category: 'Usage',
    icon: <MessageSquare className="w-4 h-4" />,
    features: [
      { name: 'Chats & Messages', free: 'Limited', pro: 'Unlimited', ultra: 'Unlimited' },
      { name: 'Image Generation', free: false, pro: '500/month', ultra: '2,000/month' },
    ]
  },
  {
    category: 'Features',
    icon: <Zap className="w-4 h-4" />,
    features: [
      { name: 'Voice Mode (TTS)', free: false, pro: true, ultra: true },
      { name: 'File Uploads', free: false, pro: 'Up to 100MB', ultra: 'Up to 100MB+' },
      { name: 'Chat with PDFs', free: false, pro: true, ultra: true },
    ]
  },
  {
    category: 'Support & Extras',
    icon: <Shield className="w-4 h-4" />,
    features: [
      { name: 'Support', free: 'Community', pro: 'Priority', ultra: 'Premium 24/7' },
      { name: 'Team Features', free: false, pro: false, ultra: true },
    ]
  }
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row min-h-[700px]">
            {/* Left Panel - Features Comparison */}
            <div className="w-full md:w-5/12 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-8 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
              <div className="mb-6 sticky top-0 bg-zinc-50 dark:bg-zinc-900 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-zinc-900 dark:text-white" />
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">What's Included</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Compare Free vs {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'}
                </p>
              </div>
              
              {/* Feature Groups */}
              <div className="space-y-6">
                {featureGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                        {group.icon}
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                        {group.category}
                      </h4>
                    </div>
                    
                    {/* Features in Category */}
                    {group.features.map((feature, featureIndex) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      
                      return (
                        <div key={featureIndex} className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                              {feature.name}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {/* Free Tier */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500 dark:text-zinc-500 min-w-[40px]">Free:</span>
                              {typeof feature.free === 'boolean' ? (
                                feature.free ? (
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                                ) : (
                                  <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
                                )
                              ) : (
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                  {feature.free}
                                </span>
                              )}
                            </div>
                            
                            {/* Selected Plan */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500 dark:text-zinc-500 min-w-[40px]">
                                {selectedPlan === 'pro' ? 'Pro:' : 'Ultra:'}
                              </span>
                              {typeof selectedValue === 'boolean' ? (
                                selectedValue ? (
                                  <Check className="w-4 h-4 text-zinc-900 dark:text-white flex-shrink-0" />
                                ) : (
                                  <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
                                )
                              ) : (
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                                  {selectedValue}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-7/12 p-8 flex flex-col bg-white dark:bg-zinc-950">
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-200 text-white dark:text-zinc-900 border-0 px-4 py-2 text-sm font-bold shadow-lg">
                    {selectedPlan === 'pro' ? '⭐ Most Popular' : '👑 Premium Choice'}
                  </Badge>
                </div>
                <h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">
                  Select Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">Unlock unlimited AI conversations & features</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 h-16 bg-zinc-100 dark:bg-zinc-900 p-1 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <TabsTrigger 
                    value="pro" 
                    className="text-base font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Pro Plan
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-base font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Ultra Pro
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-3 mb-6 flex-1">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left group ${
                    selectedPeriod === 'monthly'
                      ? 'border-zinc-900 dark:border-white bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-lg text-zinc-900 dark:text-white">Monthly Plan</div>
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Billed monthly • Cancel anytime
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-2xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].monthly.price}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">/month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left relative group ${
                    selectedPeriod === 'yearly'
                      ? 'border-zinc-900 dark:border-white bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-2.5 right-4 bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg px-3 py-1 text-xs font-bold border-0">
                    💰 Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-lg text-zinc-900 dark:text-white">Yearly Plan</div>
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Billed annually • Best value
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-baseline gap-2 justify-end mb-1">
                        <div className="font-bold text-2xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].yearly.price}</div>
                        <div className="text-sm text-zinc-400 dark:text-zinc-600 line-through">€{pricingOptions[selectedPlan].monthly.price}</div>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">/month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Subscribe Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-200 hover:from-zinc-800 hover:to-zinc-600 dark:hover:from-zinc-100 dark:hover:to-zinc-300 text-white dark:text-zinc-900 font-bold text-base shadow-xl hover:shadow-2xl transition-all rounded-xl border-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-6 space-y-4">
                {/* Secure Payment Badge */}
                <div className="flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs mb-3">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Secure SSL Encrypted Payment</span>
                </div>
                
                {/* Payment Methods */}
                <div className="space-y-3">
                  {/* Credit Cards */}
                  <div className="flex items-center justify-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    {/* Visa */}
                    <div className="w-14 h-9 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <svg className="h-4" viewBox="0 0 48 16" fill="none">
                        <path d="M20.8 14.4h-3.2L19.6 1.6h3.2l-2 12.8zm13.2-12.5c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.3 1.7-5.3 4 0 1.8 1.5 2.7 2.7 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-.9 1.2-1.8 1.2-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.4-4.2 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.7.2 2.3.4l.3.1.4-2.3zm5.8-2.3h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11.5h3.3l.7-1.9h4.1l.4 1.9h2.9l-2.4-12.5zm-3.7 8.1l1.7-4.7.9 4.7h-2.6zM15.5 1.6l-3.1 8.7-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.9 10.7h3.3l4.9-12.7h-3.4z" fill="#1434CB"/>
                        <path d="M7.8 1.6H2.6L2.5 2c3.9.9 6.5 3.2 7.5 5.9l-1.1-5.2c-.2-.8-.7-1-.9-1.1z" fill="#F7A600"/>
                      </svg>
                    </div>
                    {/* Mastercard */}
                    <div className="w-14 h-9 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <svg className="h-5" viewBox="0 0 32 20" fill="none">
                        <circle cx="11" cy="10" r="9" fill="#EB001B"/>
                        <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
                        <path d="M16 14.2c1.1-1.2 1.8-2.7 1.8-4.2 0-1.5-.7-3-1.8-4.2-1.1 1.2-1.8 2.7-1.8 4.2 0 1.5.7 3 1.8 4.2z" fill="#FF5F00"/>
                      </svg>
                    </div>
                    {/* American Express */}
                    <div className="w-14 h-9 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <svg className="h-4" viewBox="0 0 32 20" fill="none">
                        <rect width="32" height="20" rx="2" fill="#006FCF"/>
                        <path d="M8.5 7.5h2.7l-.7 1.8h-2l-.5 1.2h2l-.7 1.8h-2l-.5 1.2h2.7l-.7 1.8H5.5l2.4-6h.6v-1.8zm6.8 0l-1.8 4.8h-.1l-.9-4.8h-2.4l2.4 6h2.4l2.4-6h-2zm6.2 1.8h-2.4l.4-1.8h7.2l-.4 1.8h-2.4l-2 4.2h-2.4l2-4.2z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Digital Wallets */}
                  <div className="flex items-center justify-center gap-3">
                    {/* Google Pay */}
                    <div className="w-16 h-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <svg className="h-5" viewBox="0 0 50 20" fill="none">
                        <path d="M23.8 9.6v5.6h-1.7V2.1h4.5c1.1 0 2.1.4 2.8 1.1.8.7 1.2 1.6 1.2 2.7 0 1.1-.4 2-1.2 2.7-.8.7-1.7 1.1-2.8 1.1h-2.8v-.1zm0-6v4.3h2.8c.7 0 1.3-.2 1.8-.7.5-.5.7-1.1.7-1.8 0-.7-.2-1.3-.7-1.8-.5-.5-1.1-.7-1.8-.7h-2.8v-.3zm11.3 1.8c1.2 0 2.1.3 2.9 1 .7.7 1.1 1.6 1.1 2.8v5.9h-1.6v-1.3h-.1c-.7.9-1.6 1.4-2.7 1.4-.9 0-1.7-.3-2.3-.8-.6-.5-1-1.2-1-2.1 0-.9.3-1.6 1-2.1.6-.5 1.5-.8 2.5-.8 1 0 1.7.2 2.3.5v-.4c0-.6-.2-1.1-.7-1.5-.4-.4-1-.6-1.6-.6-.9 0-1.6.4-2.1 1.1l-1.5-.9c.8-1.2 2-1.8 3.8-1.8v.6zm-2.2 6.8c0 .4.2.8.5 1.1.4.3.8.5 1.3.5.7 0 1.4-.3 1.9-.8.6-.5.8-1.1.8-1.8-.5-.4-1.2-.6-2.1-.6-.7 0-1.2.2-1.6.5-.5.3-.8.7-.8 1.1zm11.8-10.8h1.7l-5.4 13.1h-1.7l2-4.5-3.5-8.6h1.8l2.5 6.6h.1l2.5-6.6z" fill="#5F6368"/>
                        <path d="M15.6 8.3c0-.5 0-.9-.1-1.3H8v2.5h4.3c-.2 1-.7 1.8-1.5 2.4v2h2.4c1.4-1.3 2.2-3.2 2.2-5.4l.2-.2z" fill="#4285F4"/>
                        <path d="M8 16c2 0 3.7-.7 4.9-1.8l-2.4-1.9c-.7.5-1.5.7-2.5.7-1.9 0-3.6-1.3-4.1-3H1.4v2c1.3 2.5 3.9 4 6.6 4z" fill="#34A853"/>
                        <path d="M3.9 9.7c-.3-.9-.3-1.9 0-2.8v-2H1.4c-1 2-1 4.3 0 6.3l2.5-1.5z" fill="#FBBC04"/>
                        <path d="M8 3.9c1.1 0 2.1.4 2.8 1.2l2.1-2.1C11.7 1.7 10 1 8 1 5.3 1 2.7 2.5 1.4 5l2.5 2c.5-1.7 2.2-3.1 4.1-3.1z" fill="#EA4335"/>
                      </svg>
                    </div>
                    {/* Apple Pay */}
                    <div className="w-16 h-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <svg className="h-6" viewBox="0 0 48 20" fill="none">
                        <path d="M7.8 5.1c.5-.6.8-1.5.7-2.4-.7 0-1.6.5-2.1 1.1-.4.5-.8 1.4-.7 2.2.8.1 1.6-.4 2.1-1zm.7 1.1c-1.2-.1-2.2.7-2.7.7-.6 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.3.9 7 .6.9 1.3 1.8 2.2 1.8.9 0 1.2-.6 2.3-.6 1.1 0 1.3.6 2.3.6.9 0 1.5-.9 2.1-1.7.7-.9 1-1.9 1-2 0 0-2-.8-2-3-.1-1.9 1.5-2.7 1.6-2.8-.9-1.3-2.2-1.4-2.7-1.4l.2.2zm9.3-1.3h-1.5l-1.4 4.5h-.1l-1.4-4.5h-1.6l2.2 6.5-.1.4c-.2.5-.4.7-.9.7h-.8v1.2h.9c.4 0 .8 0 1.1-.2.4-.2.6-.5.8-1.2l2.8-7.4zm3.5 8.3c1.3 0 2.5-.7 3.1-1.8h.1v1.7h1.4V7.8c0-1.4-1.1-2.4-2.8-2.4-1.6 0-2.7.9-2.8 2.2h1.4c.1-.6.6-1 1.4-1 .9 0 1.4.4 1.4 1.2v.5l-1.8.1c-1.7.1-2.6.8-2.6 2.1-.1 1.3.9 2.2 2.2 2.2zm.4-1.1c-.8 0-1.3-.4-1.3-1 0-.6.5-1 1.4-1h1.7v.5c0 .9-.7 1.5-1.8 1.5zm5.9 3.5c1.5 0 2.2-.6 2.8-2.4l2.7-7.5h-1.5l-1.8 5.9h-.1l-1.8-5.9H26l2.5 7c.1.3.1.5 0 .7-.2.5-.5.7-1 .7h-.9v1.2h1l.1.3zm12.4-6.7c0-2.5-1.3-4.1-3.3-4.1-1.5 0-2.6.8-3 1.9h-.1v-1.8h-1.4v10.4h1.5V11c0-1.6.9-2.7 2.3-2.7 1.4 0 2.3 1 2.3 2.6v4.4h1.5v-4.4h.2z" fill="currentColor" className="fill-zinc-900 dark:fill-white"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-md mx-auto pt-2">
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
