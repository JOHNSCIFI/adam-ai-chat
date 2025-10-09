import React from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Brain, Image, FileText, PenTool, Star, Users, Award, Target, Mic, Globe, Check, Shield, Clock, Sparkles, BookOpen, Code, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import SEO from '@/components/SEO';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';
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
            <Button size="lg" onClick={() => navigate('/')} className="w-full sm:w-auto text-lg px-8 py-4 h-auto bg-black text-white hover:bg-black/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200" aria-label="Start using ChatLearn now">
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* OpenAI GPT-4/5 */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={chatgptLogoSrc} alt="OpenAI ChatGPT logo" className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">OpenAI<br />GPT-4 / GPT-5</h3>
                <p className="text-sm text-muted-foreground mb-4">Advanced reasoning, problem-solving, and coding power.</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'gpt-4o'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'gpt-4o'
                }
              });
            }} aria-label="Switch to GPT-4o and start a new chat">
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
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'claude-sonnet-4'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'claude-sonnet-4'
                }
              });
            }} aria-label="Switch to Claude and start a new chat">
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
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'gemini-2.5-flash'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'gemini-2.5-flash'
                }
              });
            }} aria-label="Switch to Gemini and start a new chat">
                Try with this model
              </Button>
            </div>
            
            {/* DeepSeek - maps to gpt-4o since not available in dropdown */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img 
                    src={deepseekLogo} 
                    alt="DeepSeek logo" 
                    className="w-12 h-12 object-contain"
                    style={actualTheme === 'light' ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(2618%) hue-rotate(221deg) brightness(98%) contrast(101%)' } : {}}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">DeepSeek</h3>
                <p className="text-sm text-muted-foreground mb-4">Specialized in technical tasks and data-heavy coding.</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'deepseekv3'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'deepseekv3'
                }
              });
            }} aria-label="Switch to DeepSeek and start a new chat">
                Try with this model
              </Button>
            </div>
            
            {/* Grok */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img 
                    src={grokLogo} 
                    alt="Grok logo" 
                    className="w-12 h-12 object-contain"
                    style={actualTheme === 'light' ? { filter: 'brightness(0)' } : {}}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Grok</h3>
                <p className="text-sm text-muted-foreground mb-4">Real-time knowledge and conversational AI.</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'grok-4'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'grok-4'
                }
              });
            }} aria-label="Switch to Grok and start a new chat">
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
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Choose Your Plan. Unlock the Power of AI.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free with GPT-4 and upgrade anytime for full access to GPT-5, Claude, Gemini, DeepSeek, Grok, and more.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="group p-8 rounded-lg bg-white dark:bg-card border-2 border-black/10 dark:border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground">🆓 Free</h3>
                <div className="text-4xl font-bold mb-2 text-foreground">€0 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
                <p className="text-muted-foreground text-sm">Get started free, upgrade anytime.</p>
              </div>
              
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Access to GPT-4o Mini only</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-muted-foreground text-sm">GPT-5, Claude, Gemini, DeepSeek, Grok</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-muted-foreground text-sm">Voice mode</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-muted-foreground text-sm">Advanced file uploads</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-muted-foreground text-sm">Advanced search</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-muted-foreground text-sm">Premium features</span>
                </div>
              </div>
              
              <Button size="lg" variant="outline" className="w-full border-2 border-muted-foreground/20 text-foreground hover:bg-muted/50 hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Get started with free plan">
                Get Started
              </Button>
            </div>
            
            {/* Pro Plan - Most Popular */}
            <div className="group relative p-8 rounded-lg bg-white dark:bg-card border-2 border-primary hover:border-primary/70 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                  Most Popular
                </Badge>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground">⭐ Pro</h3>
                <div className="text-4xl font-bold mb-2 text-foreground">€19.99 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
                <p className="text-muted-foreground text-sm">For professionals</p>
              </div>
              
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Access to all AI models: GPT-4, GPT-5, Claude, Gemini, DeepSeek, Grok</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Unlimited chats & model switching</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Voice mode (text-to-speech)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">File uploads (up to 100MB)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Chat with PDFs (full access)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Image generation (500 / month)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Priority support</span>
                </div>
              </div>
              
              <Button size="lg" className="w-full bg-black dark:bg-primary text-white dark:text-primary-foreground hover:bg-black/90 dark:hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Subscribe to Pro plan">
                Subscribe Now
              </Button>
            </div>
            
            {/* Ultra Pro Plan */}
            <div className="group p-8 rounded-lg bg-white dark:bg-card border-2 border-black/10 dark:border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground">🚀 Ultra Pro</h3>
                <div className="text-4xl font-bold mb-2 text-foreground">€39.99 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
                <p className="text-muted-foreground text-sm">For teams & power users</p>
              </div>
              
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Everything in Pro</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Extended file & message limits</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Premium 24/7 support</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Image generation (2,000 / month)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Team collaboration features</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-foreground text-sm">Early access to new models</span>
                </div>
              </div>
              
              <Button size="lg" className="w-full bg-black dark:bg-primary text-white dark:text-primary-foreground hover:bg-black/90 dark:hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Subscribe to Ultra Pro plan">
                Subscribe Now
              </Button>
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
                Everything you need to know about ChatLearn
              </p>
            </div>
            
            <div className="lg:col-span-2 animate-fade-in" style={{
            animationDelay: '0.1s'
          }}>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    What can I do with this AI?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    You can chat, create images, write texts, learn new things, and even get coding help — all in one place.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Is it easy to use?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes. Just start typing or speaking — no setup needed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Can it help me study or learn?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Absolutely. The AI can explain topics, summarize notes, and answer your questions like a study buddy.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Can I create images with it?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes. You can generate unique images instantly from your ideas.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Does it work in different languages?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes. You can chat naturally in 50+ languages.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Can it help with writing?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes. From short messages to full articles, the AI helps you write faster and better.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Can I talk to it with my voice?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes. You can use voice commands for hands-free conversations.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-xl px-6 hover:border-primary/30 transition-colors">
                  <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                    Is it good for fun too?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Definitely. Chat casually, ask for jokes, or just have fun conversations.
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
      </footer>
    </div>;
};
export default Home;