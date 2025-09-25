import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sparkles, ChevronDown, Shield, Users, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';

const Models = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  
  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;

  const NavBar = () => (
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
          <button onClick={() => navigate('/models')} className="text-sm font-medium text-primary">Models</button>
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
              <DropdownMenuItem onClick={() => navigate('/cookies')}>
                Cookie Policy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={() => navigate('/chat')} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
          Sign in
        </Button>
      </div>
    </nav>
  );

  const Footer = () => (
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
              <a href="/cookies" className="block text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a>
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
  );

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"></div>
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Built on the latest state-of-the-art <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">AI technologies</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-16 max-w-4xl mx-auto animate-fade-in leading-relaxed">
            Experience the capabilities of multiple AI models integrated into a single application. Effortlessly engage in conversations, generate content, and create with a user-friendly platform designed for versatility.
          </p>

          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4 mb-16">
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => {
              const modelsSection = document.querySelector('#models-grid');
              if (modelsSection) {
                modelsSection.scrollBy({ left: -300, behavior: 'smooth' });
              }
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => {
              const modelsSection = document.querySelector('#models-grid');
              if (modelsSection) {
                modelsSection.scrollBy({ left: 300, behavior: 'smooth' });
              }
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Models Showcase */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div id="models-grid" className="overflow-x-auto">
            <div className="flex gap-8 min-w-max px-4 mb-16">
              {/* OpenAI GPT-4o */}
              <div className="text-center animate-fade-in flex-shrink-0 w-64">
                <h3 className="text-2xl font-bold mb-8">OpenAI GPT-4o</h3>
                <div className="w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src={chatgptLogoSrc} alt="OpenAI GPT-4o" className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Google Gemini */}
              <div className="text-center animate-fade-in flex-shrink-0 w-64" style={{animationDelay: '0.1s'}}>
                <h3 className="text-2xl font-bold mb-8">Google Gemini</h3>
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src={geminiLogo} alt="Google Gemini" className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Anthropic Claude */}
              <div className="text-center animate-fade-in flex-shrink-0 w-64" style={{animationDelay: '0.2s'}}>
                <h3 className="text-2xl font-bold mb-8">Anthropic Claude</h3>
                <div className="w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-orange-500/20">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src={claudeLogo} alt="Anthropic Claude" className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* DeepSeek */}
              <div className="text-center animate-fade-in flex-shrink-0 w-64" style={{animationDelay: '0.3s'}}>
                <h3 className="text-2xl font-bold mb-8">DeepSeek</h3>
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-purple-500/20">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src={deepseekLogo} alt="DeepSeek" className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* OpenAI o-3 mini */}
              <div className="text-center animate-fade-in flex-shrink-0 w-64" style={{animationDelay: '0.4s'}}>
                <h3 className="text-2xl font-bold mb-8">OpenAI o-3 mini</h3>
                <div className="w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src={chatgptLogoSrc} alt="OpenAI o-3 mini" className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Grok */}
              <div className="text-center animate-fade-in flex-shrink-0 w-64" style={{animationDelay: '0.5s'}}>
                <h3 className="text-2xl font-bold mb-8">Grok</h3>
                <div className="w-32 h-32 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-gray-500/20">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <div className="text-2xl font-bold text-gray-800">X</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <p className="text-lg text-muted-foreground">
              Access the world's most advanced AI models in one platform
            </p>
          </div>
        </div>
      </section>

      {/* Models Grid */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={chatgptLogoSrc} alt="OpenAI GPT-4o" className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={geminiLogo} alt="Google Gemini" className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={claudeLogo} alt="Anthropic Claude" className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={deepseekLogo} alt="DeepSeek" className="w-6 h-6" />
                </div>
              </div>
              
              <h2 className="text-4xl font-bold mb-6">
                Switch between different AI models, easily.
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Access 10+ top AI models from different providers in a single chat. Compare answers to the same question across models to reduce hallucination and fact-check effectively.
              </p>
            </div>
            
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl p-8 animate-fade-in">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <p className="text-sm">I'd like to buy a new car. Start by asking me about my budget and which features I care most about, then provide a recommendation.</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <span className="mr-1">🔽</span>
                    Gemini
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Great! Let's start by narrowing down some details. What's your budget range for the new car? Once I know these details, I can recommend the best car options for you!
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>👍</span>
                  <span>👎</span>
                  <span>🔄</span>
                  <span>2.5 Flash ⚡</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="text-xs">
                    Switch model
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Models Section */}
      <section className="py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
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

          <div className="text-center mt-16">
            <Button className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/chat')}>
              Start chatting with AI models <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Models;