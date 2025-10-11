import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Sparkles, ChevronDown, Shield, Users, X, Star, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const plans = [{
    name: "Free",
    emoji: "🆓",
    price: 0,
    yearlyPrice: 0,
    icon: Zap,
    description: "Get started free, upgrade anytime.",
    popular: false,
    features: [{
      text: "Access to GPT-4o Mini only",
      included: true
    }, {
      text: "GPT-5, Claude, Gemini, DeepSeek, Grok",
      included: false
    }, {
      text: "Voice mode",
      included: false
    }, {
      text: "Advanced file uploads",
      included: false
    }, {
      text: "Advanced search",
      included: false
    }, {
      text: "Premium features",
      included: false
    }],
    buttonText: "Get Started",
    buttonVariant: "outline" as const
  }, {
    name: "Pro",
    emoji: "⭐",
    price: 19.99,
    yearlyPrice: 15.99,
    icon: Star,
    description: "For professionals",
    popular: true,
    features: [{
      text: "Access to all AI models: GPT-4, GPT-5, Claude, Gemini, DeepSeek, Grok",
      included: true
    }, {
      text: "Unlimited chats & model switching",
      included: true
    }, {
      text: "Voice mode (text-to-speech)",
      included: true
    }, {
      text: "File uploads (up to 100MB)",
      included: true
    }, {
      text: "Chat with PDFs (full access)",
      included: true
    }, {
      text: "Image generation (500 / month)",
      included: true
    }, {
      text: "Priority support",
      included: true
    }],
    buttonText: "Subscribe Now",
    buttonVariant: "default" as const
  }, {
    name: "Ultra Pro",
    emoji: "🚀",
    price: 39.99,
    yearlyPrice: 31.99,
    icon: Crown,
    description: "For teams & power users",
    popular: false,
    features: [{
      text: "Everything in Pro",
      included: true
    }, {
      text: "Extended file & message limits",
      included: true
    }, {
      text: "Premium 24/7 support",
      included: true
    }, {
      text: "Image generation (2,000 / month)",
      included: true
    }, {
      text: "Team collaboration features",
      included: true
    }, {
      text: "Early access to new models",
      included: true
    }],
    buttonText: "Subscribe Now",
    buttonVariant: "outline" as const
  }];
  const getPrice = (plan: typeof plans[0]) => {
    return isYearly ? plan.yearlyPrice : plan.price;
  };
  const getSavings = (plan: typeof plans[0]) => {
    if (plan.price === 0) return 0;
    return Math.round((plan.price - plan.yearlyPrice) / plan.price * 100);
  };

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.price === 0) {
      navigate('/chat');
      return;
    }
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      // Map plan to price ID
      const priceIds = {
        'Pro': 'price_1SH1MWL8Zm4LqDn4q9te9FxZ',
        'Ultra Pro': 'price_1SH1MjL8Zm4LqDn40swOy4Ar'
      };
      
      const priceId = priceIds[plan.name as keyof typeof priceIds];
      
      if (!priceId) {
        toast.error('Invalid plan selected');
        return;
      }
      
      toast.loading('Redirecting to checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) {
        toast.error('Failed to create checkout session');
        console.error('Checkout error:', error);
        return;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Opening checkout in new tab...');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again.');
    }
  };
  const NavBar = () => <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
    </nav>;
  const Footer = () => <footer className="py-16 px-4 bg-gradient-to-b from-muted/30 to-muted/60">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-xl font-bold text-black dark:text-white">ChatLearn</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your gateway to the world's most advanced AI models, unified in one intelligent platform.
            </p>
          </div>
          
          <div className="animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            <h3 className="font-bold mb-6 text-lg">Product</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/features')} className="block text-muted-foreground hover:text-primary transition-colors">Features</button>
              <button onClick={() => navigate('/pricing')} className="block text-muted-foreground hover:text-primary transition-colors">Pricing</button>
              <button onClick={() => navigate('/models')} className="block text-muted-foreground hover:text-primary transition-colors">AI Models</button>
              <a href="/image-generation" className="block text-muted-foreground hover:text-primary transition-colors">Image Generation</a>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <h3 className="font-bold mb-6 text-lg">Company</h3>
            <div className="space-y-3">
              <a href="/help" className="block text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="/explore-tools" className="block text-muted-foreground hover:text-primary transition-colors">Explore Tools</a>
              <a href="/help" className="block text-muted-foreground hover:text-primary transition-colors">Help Center</a>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{
          animationDelay: '0.3s'
        }}>
            <h3 className="font-bold mb-6 text-lg">Legal</h3>
            <div className="space-y-3">
              <a href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="/terms" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              <a href="/cookie-policy" className="block text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
  return <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 text-primary animate-fade-in">
            Flexible Pricing
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-8 animate-fade-in">
            Choose Your <br />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">AI Journey</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            Start free and scale with powerful AI models that grow with your needs.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button onClick={() => setIsYearly(!isYearly)} className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isYearly ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? 'translate-x-8' : 'translate-x-0'}`}></div>
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              {isYearly && <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30 animate-scale-in">
                  Save up to 20%
                </Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 relative">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const currentPrice = getPrice(plan);
            const savings = getSavings(plan);
            return <div key={plan.name} className={`group relative p-8 rounded-3xl transition-all duration-500 hover:scale-105 animate-fade-in ${plan.popular ? 'bg-gradient-to-b from-primary/5 to-primary/10 border-2 border-primary shadow-2xl shadow-primary/20' : 'bg-card border border-border hover:border-primary/30 hover:shadow-xl'}`} style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-1 text-sm font-semibold">
                        Most Popular
                      </Badge>
                    </div>}
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.emoji} {plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold">
                        €{currentPrice}
                      </span>
                      <span className="text-muted-foreground text-lg">
                        / month
                      </span>
                    </div>
                    
                    {isYearly && savings > 0 && <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30 mb-2">
                        Save {savings}%
                      </Badge>}
                    
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-start gap-3">
                        {feature.included ? <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div> : <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>}
                        <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {feature.text}
                        </span>
                      </div>)}
                  </div>
                  
                  <Button className={`w-full h-12 text-lg font-semibold ${plan.popular ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg' : ''}`} variant={plan.buttonVariant} onClick={() => handleSubscribe(plan)}>
                    {plan.buttonText} {plan.price > 0 && '→'}
                  </Button>
                </div>;
          })}
          </div>

          {/* Comparison Table */}
          <div className="bg-gradient-to-br from-card to-muted/20 rounded-3xl border border-border p-10 mb-20 animate-fade-in">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold mb-4">Compare Plans</h3>
              <p className="text-lg text-muted-foreground">Choose the perfect plan for your AI journey</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-6 px-6 font-semibold text-lg">Features</th>
                    <th className="text-center py-6 px-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="h-5 w-5" />
                          <span className="font-bold text-lg">Free</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/chat')}>
                          Get started
                        </Button>
                      </div>
                    </th>
                    <th className="text-center py-6 px-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          <span className="font-bold text-lg">Pro</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs">
                            Popular
                          </Badge>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600" onClick={() => handleSubscribe(plans[1])}>
                          Subscribe
                        </Button>
                      </div>
                    </th>
                    <th className="text-center py-6 px-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="h-5 w-5" />
                          <span className="font-bold text-lg">Ultra Pro</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleSubscribe(plans[2])}>
                          Subscribe
                        </Button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-5 px-6 font-medium text-primary">AI Models</td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">OpenAI GPT-4o</td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">Mini</Badge>
                    </td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Anthropic Claude</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Google Gemini</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">DeepSeek</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-5 px-6 font-medium text-primary">Features</td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Image Generation</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">3.6K/mo</Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/30">14K/mo</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Voice Mode</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Chat with Files</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Extended</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Web Search</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h3 className="text-3xl font-bold mb-6">Frequently Asked Questions</h3>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-3">Can I change plans anytime?</h4>
                <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-3">Is there a free trial?</h4>
                <p className="text-muted-foreground">Our Free plan gives you access to GPT-4.1 Mini with no time limit. Upgrade when ready for more features.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-3">What payment methods do you accept?</h4>
                <p className="text-muted-foreground">We accept all major credit cards, PayPal, and other secure payment methods.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-3">How does billing work?</h4>
                <p className="text-muted-foreground">You'll be charged monthly or yearly based on your chosen plan. No hidden fees or surprises.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          toast.success('Welcome! Please select your plan.');
        }}
      />
    </div>;
};
export default Pricing;