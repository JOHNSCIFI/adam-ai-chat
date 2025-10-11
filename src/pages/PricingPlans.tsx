import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  Star, 
  Gem, 
  Bot,
  ImageIcon,
  FileText,
  Search,
  Mic,
  Upload,
  Palette,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  ultraPro: boolean | string;
}

const features: PlanFeature[] = [
  {
    name: 'Access to OpenAI GPT-4.1 Mini',
    free: true,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Access to multiple AI models',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Unlimited chats with all models',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Custom bots built for specific use cases',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Unlimited file uploads',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Advanced web search capabilities',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Image Generation',
    free: '3,600/ month',
    pro: true,
    ultraPro: true
  },
  {
    name: 'Image Analysis',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Chat with PDF files',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'AI Search Engine',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Text-to-speech voice mode',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Extended limits on messages, file uploads, advanced data analysis, and image generation',
    free: false,
    pro: true,
    ultraPro: true
  }
];

const faqData = [
  {
    question: 'What are the main features of Chatbot App?',
    answer: 'Chatbot App provides access to multiple AI models including OpenAI GPT-5, Anthropic Claude, Google Gemini, and DeepSeek. You can chat with AI, generate and analyze images, upload and analyze files, use advanced web search, and access custom AI tools for specific tasks.'
  },
  {
    question: 'How do I access the AI models?',
    answer: 'Once you have a subscription, you can access different AI models through the chat interface. Simply select your preferred model from the available options and start chatting. Each model has its own strengths and specializations.'
  },
  {
    question: 'Which AI models are available on Chatbot App?',
    answer: 'We offer access to the latest and most powerful AI models including OpenAI GPT-4o, GPT-4.1, Anthropic Claude, Google Gemini, DeepSeek, DeepSeek R1, Grok-3 Mini, and Grok-4. Free users get access to OpenAI GPT-4.1 Mini.'
  },
  {
    question: 'What file types can I upload and analyze?',
    answer: 'You can upload various file types including PDFs, images (JPG, PNG, WEBP), documents (DOCX, TXT), spreadsheets, and more. Our AI can analyze content, extract information, summarize documents, and answer questions about your files.'
  },
  {
    question: 'How does the image generation work?',
    answer: 'Our image generation feature uses advanced AI models to create stunning images from text descriptions. Pro users get unlimited access, while free users get 3,600 images per month. You can specify styles, dimensions, and detailed prompts.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period, after which you\'ll be moved to the free plan.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'We offer a free plan that includes access to OpenAI GPT-4.1 Mini with limited messages per month. This allows you to try our platform before upgrading to a paid plan for full access to all features.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. All payments are processed securely through our payment partners.'
  }
];

export default function PricingPlans() {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_RrCXJVxkfxu4Bq': 'Pro',
    'prod_RrCXvFp6H5sSUv': 'Ultra Pro',
  };

  const handleSubscribe = async (plan: 'pro' | 'ultra_pro') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      // TEST MODE price IDs
      const priceIds = {
        'pro': 'price_1SH1jRL8Zm4LqDn4M49yf60W',
        'ultra_pro': 'price_1SH1jpL8Zm4LqDn4zN9CGBpC'
      };
      
      const priceId = priceIds[plan];
      
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


  const getPricing = (plan: 'pro' | 'ultra_pro') => {
    const prices = {
      pro: {
        monthly: { price: 19.99, period: 'month' },
        quarterly: { price: 16.99, period: 'month', note: 'billed quarterly' },
        yearly: { price: 14.99, period: 'month', note: 'billed annually' }
      },
      ultra_pro: {
        monthly: { price: 39.99, period: 'month' },
        quarterly: { price: 34.99, period: 'month', note: 'billed quarterly' },
        yearly: { price: 29.99, period: 'month', note: 'billed annually' }
      }
    };
    
    const pricing = prices[plan][billingPeriod];
    return {
      ...pricing,
      note: 'note' in pricing ? pricing.note : undefined
    };
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pricing Plan</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Unlock the full potential of Chatbot App with advanced plans.
        </p>

        {/* Billing Period Selector */}
        <div className="inline-flex bg-muted rounded-lg p-1 mb-8">
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('monthly')}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={billingPeriod === 'quarterly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('quarterly')}
            className="rounded-md"
          >
            Quarterly
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('yearly')}
            className="rounded-md"
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {/* Free Plan */}
        <Card className="relative border border-border/40 bg-background/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Free</CardTitle>
            <div className="text-3xl font-bold mt-4">$0</div>
            <CardDescription className="mt-2">
              Start free, upgrade anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full mb-6"
              disabled
            >
              Current Plan
            </Button>

            <div className="space-y-4">
              <h4 className="font-semibold">What's included:</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Access to OpenAI GPT-4.1 Mini
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Access to multiple top AI models
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Unlimited chats with all models
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Custom bots built for specific use cases
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Unlimited file uploads
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Advanced web search capabilities
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Image Generation
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Chat with PDF files
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border border-primary/40 bg-background/50 backdrop-blur-sm">
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
            Most Popular
          </Badge>
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                ${(getPricing('pro').price / 30 * 1).toFixed(2)} Per Day
              </span>
            </div>
            <div className="text-3xl font-bold">${getPricing('pro').price}</div>
            <CardDescription className="mt-2">
              {getPricing('pro').note ? `${getPricing('pro').period}/${getPricing('pro').note}` : `${getPricing('pro').period}/billed ${billingPeriod}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleSubscribe('pro')}
              className="w-full mb-6 bg-primary hover:bg-primary/90"
              disabled={subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Pro'}
            >
              {subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Pro' 
                ? '✓ Current Plan'
                : 'Subscribe'}
            </Button>

            <div className="space-y-4">
              <h4 className="font-semibold">What's included:</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Access to multiple AI models, including OpenAI GPT-5, Anthropic Claude, Google Gemini and DeepSeek
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited chats with all models
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Extended limits on messages, file uploads, advanced data analysis, and image generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Text-to-speech voice mode
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Custom bots built for specific use cases
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited file uploads
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Advanced web search capabilities
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Ultra Pro Plan */}
        <Card className="relative border border-border/40 bg-background/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Gem className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Ultra Pro</CardTitle>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                ${(getPricing('ultra_pro').price / 30 * 1).toFixed(2)} Per Day
              </span>
            </div>
            <div className="text-3xl font-bold">${getPricing('ultra_pro').price}</div>
            <CardDescription className="mt-2">
              {getPricing('ultra_pro').note ? `${getPricing('ultra_pro').period}/${getPricing('ultra_pro').note}` : `${getPricing('ultra_pro').period}/billed ${billingPeriod}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleSubscribe('ultra_pro')}
              className="w-full mb-6 bg-primary hover:bg-primary/90"
              disabled={subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Ultra Pro'}
            >
              {subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Ultra Pro'
                ? '✓ Current Plan'
                : 'Subscribe'}
            </Button>

            <div className="space-y-4">
              <h4 className="font-semibold">What's included:</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Access to multiple AI models, including OpenAI GPT-5, Anthropic Claude, Google Gemini and DeepSeek
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited chats with all models
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Extended limits on messages, file uploads, advanced data analysis, and image generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Text-to-speech voice mode
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Custom bots built for specific use cases
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited file uploads
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Advanced web search capabilities
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compare Plans Table */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-background rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4 font-semibold">Features</th>
                <th className="text-center p-4 font-semibold">Free</th>
                <th className="text-center p-4 font-semibold">Pro</th>
                <th className="text-center p-4 font-semibold">Ultra Pro</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-border/20">
                  <td className="p-4 font-medium">{feature.name}</td>
                  <td className="text-center p-4">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">{feature.free}</span>
                    )}
                  </td>
                  <td className="text-center p-4">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm">{feature.pro}</span>
                    )}
                  </td>
                  <td className="text-center p-4">
                    {typeof feature.ultraPro === 'boolean' ? (
                      feature.ultraPro ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm">{feature.ultraPro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <p className="text-center text-muted-foreground mb-8">
          Find answers to your questions about plans, pricing, and features.
        </p>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          toast.success('Welcome! Please select your plan.');
        }}
      />
    </div>
  );
}