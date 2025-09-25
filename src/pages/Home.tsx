import React from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Brain, Image, FileText, PenTool, Mic, Globe, Zap, Target, ChevronDown, Sparkles, Users, Shield, Clock, Bot } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';

const Home = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <AdamGptLogo className="h-7 w-7" />
              <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AdamGpt</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => navigate('/models')} className="text-sm font-medium hover:text-primary transition-colors">Models</button>
            <button onClick={() => navigate('/features')} className="text-sm font-medium hover:text-primary transition-colors">Features</button>
            <button onClick={() => navigate('/pricing')} className="text-sm font-medium hover:text-primary transition-colors">Pricing</button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium hover:text-primary transition-colors">
                Terms <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border shadow-lg">
                <DropdownMenuItem onClick={() => navigate('/privacy')}>
                  Privacy Policy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/terms')}>
                  Terms of Service
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/cookie-policy')}>
                  Cookie Policy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        <Button onClick={() => navigate('/chat')} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
          Try Here
        </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8 animate-fade-in">
            <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 hover:scale-105 transition-transform">
              <Zap className="h-3 w-3 mr-1 text-primary" />
              25+ AI models available
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-600 dark:text-green-400">New</Badge>
            </Badge>
          </div>
          
          <div className="flex justify-center gap-3 mb-12 animate-scale-in">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">G</span>
              </div>
              <span className="text-sm font-medium">GPT-4</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="text-sm font-medium">Claude</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hidden sm:flex">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">G</span>
              </div>
              <span className="text-sm font-medium">Gemini</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 animate-fade-in">
            Your <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Multi-Model</span><br />
            AI Assistant
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in leading-relaxed">
            Access GPT-4, Claude, Gemini and more — all under one intelligent interface
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Button 
              size="lg" 
              onClick={() => navigate('/chat')} 
              className="text-lg px-12 py-4 h-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Now →
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/pricing-plans')} 
              className="text-lg px-12 py-4 h-auto border-2 hover:bg-primary/5 hover:border-primary/50 hover:scale-105 transition-all duration-300"
            >
              See pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <Badge variant="outline" className="mb-6 text-primary border-primary/20">AI Models</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your <span className="text-primary">AI Companion</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Select from the world's most advanced AI models, each optimized for different tasks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10 hover:border-green-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img 
                    src={chatgptLogoSrc} 
                    alt="OpenAI ChatGPT" 
                    className="w-12 h-12 object-contain" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">OpenAI GPT-4o</h3>
                <p className="text-muted-foreground">Most advanced reasoning and problem-solving capabilities</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img 
                    src={geminiLogo} 
                    alt="Google Gemini" 
                    className="w-12 h-12 object-contain" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">Google Gemini</h3>
                <p className="text-muted-foreground">Excellent for multimodal tasks and analysis</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img 
                    src={claudeLogo} 
                    alt="Anthropic Claude" 
                    className="w-12 h-12 object-contain" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">Anthropic Claude</h3>
                <p className="text-muted-foreground">Best for writing and creative tasks</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img 
                    src={deepseekLogo} 
                    alt="DeepSeek" 
                    className="w-12 h-12 object-contain" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">DeepSeek</h3>
                <p className="text-muted-foreground">Specialized in coding and technical analysis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <Badge variant="outline" className="mb-6 text-primary border-primary/20">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">in one place</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful features designed to enhance your AI experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-purple-500/0 group-hover:from-primary/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Multi-LLM Access</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Tap into the power of multiple AI models from one unified interface
                </p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Smart Model Selection</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Pick the best LLM for research, coding, writing, image generation, or any other task
                </p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mic className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Voice Commands</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Use your voice to interact naturally with any AI model
                </p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Global Language Support</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Communicate in over 50+ languages with natural understanding
                </p>
              </div>
            </div>
          </div>

          {/* Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-105 hover:shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Chatbot</h3>
              <p className="text-muted-foreground">Intelligent conversations with multiple AI models</p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-pink-500/5 to-rose-500/5 border border-pink-500/10 hover:border-pink-500/30 transition-all duration-500 hover:scale-105 hover:shadow-lg animate-fade-in" style={{animationDelay: '0.5s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Image className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Image Generation</h3>
              <p className="text-muted-foreground">Create stunning visuals with AI-powered tools</p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 hover:scale-105 hover:shadow-lg animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ask PDF</h3>
              <p className="text-muted-foreground">Extract insights from documents instantly</p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-violet-500/10 hover:border-violet-500/30 transition-all duration-500 hover:scale-105 hover:shadow-lg animate-fade-in" style={{animationDelay: '0.7s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <PenTool className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Writing</h3>
              <p className="text-muted-foreground">Generate content with advanced writing assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <Badge variant="outline" className="mb-6 text-primary border-primary/20">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose the plan that's<br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">right for you</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible pricing options to suit your AI needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border hover:border-primary/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-purple-500/0 group-hover:from-primary/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">Biweekly</h3>
                  <div className="text-4xl font-bold mb-1">$14.99 <span className="text-lg font-normal text-muted-foreground">/2 weeks</span></div>
                  <p className="text-muted-foreground">Perfect for regular users</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Access to 25+ LLM models</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Unlimited model switching</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Voice commands</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 group-hover:scale-105 transition-transform duration-300">
                  Start $0.99 Trial
                </Button>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border hover:border-primary/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-purple-500/0 group-hover:from-primary/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">Monthly</h3>
                  <div className="text-4xl font-bold mb-1">$24.99 <span className="text-lg font-normal text-muted-foreground">/month</span></div>
                  <p className="text-muted-foreground">Great for professionals</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Access to 25+ LLM models</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Unlimited model switching</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Priority support</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-2 hover:bg-primary/5 hover:border-primary/50 group-hover:scale-105 transition-all duration-300">
                  Get Started
                </Button>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/30 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 text-sm font-medium">
                  Most Popular
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-purple-500/0 group-hover:from-primary/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">Quarterly</h3>
                  <div className="text-4xl font-bold mb-1">$49.99 <span className="text-lg font-normal text-muted-foreground">/3 months</span></div>
                  <p className="text-muted-foreground">Best value for teams</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Access to 25+ LLM models</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Unlimited model switching</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>Premium support</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 group-hover:scale-105 transition-transform duration-300">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>30-day money back</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>24/7 support</span>
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
            
            <div className="lg:col-span-2 animate-fade-in" style={{animationDelay: '0.1s'}}>
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
                    You get access to 25+ premium AI models including GPT-4, Claude, Gemini, DeepSeek, and many more. Switch between models instantly based on your needs.
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
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="container max-w-4xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to unlock AI's potential?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who are already transforming their work with AdamGpt
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate('/chat')}
              className="text-lg px-12 py-4 h-auto bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start free trial →
            </Button>
          </div>
        </div>
      </section>

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
            
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
              <h3 className="font-bold mb-6 text-lg">Product</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/features')} className="block text-muted-foreground hover:text-primary transition-colors">Features</button>
                <button onClick={() => navigate('/pricing')} className="block text-muted-foreground hover:text-primary transition-colors">Pricing</button>
                <button onClick={() => navigate('/models')} className="block text-muted-foreground hover:text-primary transition-colors">AI Models</button>
                <a href="/image-generation" className="block text-muted-foreground hover:text-primary transition-colors">Image Generation</a>
              </div>
            </div>
            
            <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h3 className="font-bold mb-6 text-lg">Company</h3>
              <div className="space-y-3">
                <a href="/help" className="block text-muted-foreground hover:text-primary transition-colors">About</a>
                <a href="/explore-tools" className="block text-muted-foreground hover:text-primary transition-colors">Explore Tools</a>
                <a href="/help" className="block text-muted-foreground hover:text-primary transition-colors">Help Center</a>
              </div>
            </div>
            
            <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
              <h3 className="font-bold mb-6 text-lg">Legal</h3>
              <div className="space-y-3">
                <a href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
                <a href="/terms" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
                <a href="/cookie-policy" className="block text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
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
    </div>
  );
};

export default Home;