import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, X, Star, Sparkles, Crown, Bot, Search, FileText, MessageSquare, Upload, Mic, Zap } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: React.ComponentType<any>;
  features: Array<{
    name: string;
    included: boolean;
    details?: string;
  }>;
  buttonText: string;
  popular?: boolean;
  current?: boolean;
}

interface ComparisonFeature {
  name: string;
  icon: React.ComponentType<any>;
  free: boolean | string;
  pro: boolean | string;
  ultraPro: boolean | string;
}

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const getPrice = (basePrice: number): number => {
    switch (billingCycle) {
      case 'quarterly':
        return Math.round(basePrice * 0.9 * 100) / 100; // 10% discount
      case 'yearly':
        return Math.round(basePrice * 0.8 * 100) / 100; // 20% discount
      default:
        return basePrice;
    }
  };

  const getPeriodText = (): string => {
    switch (billingCycle) {
      case 'quarterly':
        return 'billed quarterly';
      case 'yearly':
        return 'billed yearly';
      default:
        return 'billed monthly';
    }
  };

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Start free, upgrade anytime.',
      icon: Star,
      features: [
        { name: 'Access to OpenAI GPT-4o Mini', included: true },
        { name: 'Access to multiple top AI models', included: false },
        { name: 'Unlimited chats with all models', included: false },
        { name: 'Custom bots built for specific use cases', included: false },
        { name: 'Unlimited file uploads', included: false },
        { name: 'Advanced web search capabilities', included: false },
        { name: 'Image Generation', included: false },
        { name: 'Chat with PDF files', included: false }
      ],
      buttonText: 'Current Plan',
      current: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      period: 'month',
      description: 'month/billed monthly',
      icon: Sparkles,
      features: [
        { name: 'Access to multiple AI models', included: true, details: 'including OpenAI GPT-5, Anthropic Claude, Google Gemini and DeepSeek' },
        { name: 'Unlimited chats with all models', included: true },
        { name: 'Extended limits on messages, file uploads, advanced data analysis, and image generation', included: true },
        { name: 'Text-to-speech voice mode', included: true },
        { name: 'Custom bots built for specific use cases', included: true },
        { name: 'Unlimited file uploads', included: true },
        { name: 'Advanced web search capabilities', included: true }
      ],
      buttonText: 'Subscribe',
      popular: true
    },
    {
      id: 'ultra-pro',
      name: 'Ultra Pro',
      price: 39.99,
      period: 'month',
      description: 'month/billed monthly',
      icon: Crown,
      features: [
        { name: 'Access to multiple AI models', included: true, details: 'including OpenAI GPT-5, Anthropic Claude, Google Gemini and DeepSeek' },
        { name: 'Unlimited chats with all models', included: true },
        { name: 'Extended limits on messages, file uploads, advanced data analysis, and image generation', included: true },
        { name: 'Text-to-speech voice mode', included: true },
        { name: 'Custom bots built for specific use cases', included: true },
        { name: 'Unlimited file uploads', included: true },
        { name: 'Advanced web search capabilities', included: true }
      ],
      buttonText: 'Subscribe'
    }
  ];

  const comparisonFeatures: ComparisonFeature[] = [
    {
      name: 'OpenAI GPT-4o mini',
      icon: Bot,
      free: true,
      pro: true,
      ultraPro: true
    },
    {
      name: 'Anthropic Claude',
      icon: Bot,
      free: false,
      pro: true,
      ultraPro: true
    },
    {
      name: 'Google Gemini',
      icon: Bot,
      free: false,
      pro: true,
      ultraPro: true
    },
    {
      name: 'DeepSeek',
      icon: Bot,
      free: false,
      pro: true,
      ultraPro: true
    },
    {
      name: 'Image Generation',
      icon: Sparkles,
      free: false,
      pro: '3,600/ month',
      ultraPro: true
    },
    {
      name: 'Image Analysis',
      icon: Search,
      free: false,
      pro: true,
      ultraPro: true
    },
    {
      name: 'Chat with PDF files',
      icon: FileText,
      free: false,
      pro: true,
      ultraPro: true
    },
    {
      name: 'AI Search Engine',
      icon: Search,
      free: false,
      pro: true,
      ultraPro: true
    }
  ];

  const faqs = [
    {
      question: 'What are the main features of Chatbot App?',
      answer: 'Chatbot App provides access to multiple AI models including OpenAI GPT-5, Anthropic Claude, Google Gemini, and DeepSeek. Features include unlimited chats, image generation and analysis, file uploads, advanced web search, and custom bot creation.'
    },
    {
      question: 'How do I access the AI models?',
      answer: 'Simply select the AI model you want to use from the Explore Tools section. Free users have access to GPT-4o Mini, while Pro and Ultra Pro users can access all premium models.'
    },
    {
      question: 'Which AI models are available on Chatbot App?',
      answer: 'We offer OpenAI GPT-4o Mini (Free), plus OpenAI GPT-5, Anthropic Claude, Google Gemini, DeepSeek, and DeepSeek R1 for Pro and Ultra Pro subscribers.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.'
    },
    {
      question: 'What happens if I exceed my usage limits?',
      answer: 'Free users are limited to 15 messages before needing to upgrade. Pro and Ultra Pro users have significantly higher limits and extended capabilities.'
    },
    {
      question: 'Do you offer student discounts?',
      answer: 'We currently do not offer student discounts, but we do provide quarterly and yearly billing options with savings up to 20%.'
    }
  ];

  const renderCheckmark = (included: boolean | string) => {
    if (included === true) {
      return <Check className="h-4 w-4 text-green-600" />;
    } else if (included === false) {
      return <X className="h-4 w-4 text-gray-400" />;
    } else {
      return <span className="text-sm text-muted-foreground">{included}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Pricing Plan</h1>
        <p className="text-muted-foreground">
          Unlock the full potential of Chatbot App with advanced plans.
        </p>

        {/* Billing Toggle */}
        <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as any)} className="w-fit mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">
              Quarterly
              <Badge variant="secondary" className="ml-1 text-xs">10% off</Badge>
            </TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge variant="secondary" className="ml-1 text-xs">20% off</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto p-3 rounded-full bg-primary/10">
                  <PlanIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      ${plan.id === 'free' ? '0' : getPrice(plan.price)}
                    </span>
                    {plan.id !== 'free' && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {getPeriodText()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.id === 'free' ? plan.description : `$${(getPrice(plan.price) / (billingCycle === 'yearly' ? 12 : billingCycle === 'quarterly' ? 3 : 1)).toFixed(2)} Per Day`}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button 
                  className="w-full" 
                  variant={plan.current ? "secondary" : "default"}
                  disabled={plan.current}
                >
                  {plan.buttonText}
                </Button>

                <div className="space-y-2">
                  <p className="font-medium text-sm">What's included:</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="text-sm">
                          <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                            {feature.name}
                          </span>
                          {feature.details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {feature.details}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Compare Plans</h2>
          <p className="text-muted-foreground">
            Detailed comparison of features across all plans
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Features</th>
                  <th className="text-center p-4 font-semibold">Free</th>
                  <th className="text-center p-4 font-semibold">Pro</th>
                  <th className="text-center p-4 font-semibold">Ultra Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FeatureIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{feature.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {renderCheckmark(feature.free)}
                      </td>
                      <td className="p-4 text-center">
                        {renderCheckmark(feature.pro)}
                      </td>
                      <td className="p-4 text-center">
                        {renderCheckmark(feature.ultraPro)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Find answers to your questions about plans, pricing, and features.
          </p>
        </div>

        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}