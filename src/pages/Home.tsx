import React from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Brain, Image, FileText, PenTool, Star, Users, Award, Target, Mic, Globe, Check, Shield, Clock, Sparkles, BookOpen, Code } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import SEO from '@/components/SEO';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
const Home = () => {
  const navigate = useNavigate();
  const {
    actualTheme
  } = useTheme();

  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;
  const handleTryNowClick = () => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'try_now_click', {
        event_category: 'engagement',
        event_label: 'homepage_cta'
      });
    }
    navigate('/');
  };
  return <div className="min-h-screen bg-background text-foreground">
      <SEO title="AI Assistant for Everyone" description="Access GPT-4o, Claude, Gemini and more powerful AI models from a single interface. AI chatbot, image generation, PDF analysis and writing tools." canonical="https://adamchat.app/home" />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" role="main">
        <div className="container mx-auto max-w-4xl text-center">
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
            One Platform.
            <br />
            <span className="text-primary">All Your AI Models.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Chat, create images, write, code, and learn with GPT-4, GPT-5, Claude, Gemini, and more – all from a single platform.
          </p>
          
          <div className="flex justify-center">
            <Button size="lg" onClick={() => navigate('/')} className="w-full sm:w-auto text-lg px-8 py-4 h-auto bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200" aria-label="Start using AdamGpt now">
              Start Now
            </Button>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" aria-labelledby="models-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 id="models-heading" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Pick the Right AI for Every Task
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the world's leading AI models and start with the one that fits your goal.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* OpenAI GPT-4/5 */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={chatgptLogoSrc} alt="OpenAI ChatGPT logo" className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">OpenAI<br />GPT-4 / GPT-5</h3>
                <p className="text-sm text-muted-foreground mb-4">Advanced reasoning, problem-solving, and coding power.</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-auto"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'model_select', {
                      model: 'gpt-4o'
                    });
                  }
                  navigate('/', { state: { selectedModel: 'gpt-4o' } });
                }}
                aria-label="Switch to GPT-4o and start a new chat"
              >
                Try with this model
              </Button>
            </div>
            
            {/* Claude */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={claudeLogo} alt="Anthropic Claude logo" className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Anthropic<br />Claude</h3>
                <p className="text-sm text-muted-foreground mb-4">Ideal for writing, analysis, and creative tasks.</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-auto"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'model_select', {
                      model: 'claude-sonnet-4'
                    });
                  }
                  navigate('/', { state: { selectedModel: 'claude-sonnet-4' } });
                }}
                aria-label="Switch to Claude and start a new chat"
              >
                Try with this model
              </Button>
            </div>
            
            {/* Gemini - maps to gpt-4o since not available in dropdown */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={geminiLogo} alt="Google Gemini logo" className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Google<br />Gemini</h3>
                <p className="text-sm text-muted-foreground mb-4">Multimodal AI for text, vision, and analysis.</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-auto"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'model_select', {
                      model: 'gpt-4o'
                    });
                  }
                  navigate('/', { state: { selectedModel: 'gpt-4o' } });
                }}
                aria-label="Switch to GPT-4o and start a new chat"
              >
                Try with this model
              </Button>
            </div>
            
            {/* DeepSeek - maps to gpt-4o since not available in dropdown */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={deepseekLogo} alt="DeepSeek logo" className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">DeepSeek</h3>
                <p className="text-sm text-muted-foreground mb-4">Specialized in technical tasks and data-heavy coding.</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-auto"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'model_select', {
                      model: 'gpt-4o'
                    });
                  }
                  navigate('/', { state: { selectedModel: 'gpt-4o' } });
                }}
                aria-label="Switch to GPT-4o and start a new chat"
              >
                Try with this model
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to enhance your AI experience
            </p>
          </div>
          
          {/* 6 Feature Cards Grid - 3 per row on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Multi-Model Access */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Multi-Model Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Switch between GPT-4, GPT-5, Claude, Gemini, and more – all in one place.</p>
            </div>
            
            {/* Feature 2: AI Image Generation */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Image className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">AI Image Generation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Create stunning visuals instantly with AI-powered tools.</p>
            </div>
            
            {/* Feature 3: Learning & Study Support */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Learning & Study Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Summarize texts, explain concepts, and prepare for exams with AI assistance.</p>
            </div>
            
            {/* Feature 4: Coding & Tech Help */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Coding & Tech Help</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Get instant coding support, debugging, and technical insights.</p>
            </div>
            
            {/* Feature 5: Voice & Language Support */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mic className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Voice & Language Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Chat hands-free with voice commands and over 50 languages.</p>
            </div>
            
            {/* Feature 6: Ask Your Files */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Ask Your Files</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Upload PDFs or docs and extract key insights in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" aria-labelledby="pricing-heading">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Access all features and AI capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2 text-foreground">Biweekly</h3>
                <div className="text-3xl font-bold mb-1 text-foreground">$14.99 <span className="text-lg font-normal text-muted-foreground">/2 weeks</span></div>
                <p className="text-muted-foreground">Perfect for regular users</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">All AI models & features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">Unlimited model switching</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">Voice commands</span>
                </div>
              </div>
              <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Start biweekly plan trial">
                Start $0.99 Trial
              </Button>
            </div>
            
            <div className="group p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2 text-foreground">Monthly</h3>
                <div className="text-3xl font-bold mb-1 text-foreground">$24.99 <span className="text-lg font-normal text-muted-foreground">/month</span></div>
                <p className="text-muted-foreground">Great for professionals</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">All AI models & features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">Unlimited model switching</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">Priority support</span>
                </div>
              </div>
              <Button size="lg" variant="outline" className="w-full border-2 border-muted-foreground/20 text-foreground hover:bg-muted/50 hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Get started with monthly plan">
                Get Started
              </Button>
            </div>
            
            <div className="group relative p-8 rounded-lg bg-card border-2 border-primary hover:border-primary/70 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                  Most Popular
                </Badge>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2 text-foreground">Quarterly</h3>
                <div className="text-3xl font-bold mb-1 text-foreground">$49.99 <span className="text-lg font-normal text-muted-foreground">/3 months</span></div>
                <p className="text-muted-foreground">Best value for teams</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">All AI models & features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">Unlimited model switching</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground">Premium support</span>
                </div>
              </div>
              <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Get started with quarterly plan">
                Get Started
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>30-day money back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>10,000+ satisfied users</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="animate-fade-in">
              <Badge variant="outline" className="mb-6 text-primary border-primary/20">FAQ</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Frequently<br />
                Asked<br />
                Questions
              </h2>
              <p className="text-muted-foreground text-lg">
                Everything you need to know about AdamGpt
              </p>
            </div>
            
            <div className="lg:col-span-2 animate-fade-in" style={{
            animationDelay: '0.1s'
          }}>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Is it free to use?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    We offer a free trial to get you started. After that, you can choose from our flexible subscription plans starting at $14.99 biweekly.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Which AI models are available?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    You get access to all premium AI models including GPT-4, GPT-5, Claude, Gemini, DeepSeek, and more. Switch between models instantly based on your needs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Can I cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Absolutely. We use enterprise-grade security measures to protect your data. Your conversations are encrypted and never used to train AI models.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Do you offer refunds?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      

      {/* Footer */}
      <footer className="py-16 px-4 bg-gradient-to-b from-muted/30 to-muted/60">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="animate-fade-in">
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative">
                  <AdamGptLogo className="h-7 w-7" />
                  <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AdamGpt</span>
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
          
          <div className="border-t border-border pt-8 animate-fade-in" style={{
          animationDelay: '0.4s'
        }}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground">
                &copy; 2024 AdamGpt. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>10,000+ Users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Home;