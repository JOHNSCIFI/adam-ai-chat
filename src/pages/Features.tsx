import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sparkles, ChevronDown, Shield, Users, Mic, Image as ImageIcon, FileText, Bot, Globe, Zap, Target, ArrowRight } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

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
          <button onClick={() => navigate('/models')} className="text-sm font-medium hover:text-primary transition-colors">Models</button>
          <button onClick={() => navigate('/features')} className="text-sm font-medium text-primary">Features</button>
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
            Explore more features in <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Chatbot App</span>
          </h1>
        </div>
      </section>

      {/* Feature Tabs */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button variant="secondary" className="px-8 py-3 rounded-full">Switch Models</Button>
            <Button variant="outline" className="px-8 py-3 rounded-full">Voice Chat</Button>
            <Button variant="outline" className="px-8 py-3 rounded-full">Generate Images</Button>
            <Button variant="outline" className="px-8 py-3 rounded-full">Talk to PDF</Button>
          </div>

          {/* Main Feature Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 animate-fade-in">
              <h2 className="text-4xl font-bold mb-6">Switch Models</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Seamlessly explore top-tier language models including GPT-4o, Claude, DeepSeek, Grok, and Gemini. Select the right model for everything from content creation to complex problem-solving.
              </p>
              <Button className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/chat')}>
                Explore now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="order-1 lg:order-2 grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-600/20 to-black/20 rounded-2xl flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="space-y-6 pt-8">
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">★</span>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-blue-400/20 rounded-2xl flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">🐋</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Generation Feature */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <h2 className="text-4xl font-bold mb-6">Generate Images</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Generate images instantly using just your words. Choose from multiple available image generation models and refine results with follow-up prompts as needed.
              </p>
              <Button className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/image-generation')}>
                Explore now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl p-8 animate-fade-in">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                    <div>
                      <p className="text-sm text-muted-foreground">A cozy living room with golden light, a tabby cat on an armchair, and a black cat by the window.</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Flux
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Here is the visual generated based on the prompt. Let me know if you'd like any adjustments!
                </p>
                
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-yellow-600 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PDF Chat Feature */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-card border border-border rounded-2xl p-8 animate-fade-in">
                <h3 className="text-2xl font-bold mb-6">Chat with Any Document</h3>
                <p className="text-muted-foreground mb-8">
                  Upload and Ask Questions About Any Document. Our built-in document editor supports over 10 file types for seamless interaction.
                </p>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Try Chatbot App
                </Button>
              </div>
              
              {/* Floating document icons */}
              <div className="relative mt-8">
                <div className="absolute -top-4 right-16 animate-float">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-8 right-8 animate-float" style={{animationDelay: '0.5s'}}>
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-16 right-24 animate-float" style={{animationDelay: '1s'}}>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 animate-fade-in">
              <h2 className="text-4xl font-bold mb-6">Access on the go</h2>
              <h3 className="text-3xl font-bold mb-6">
                Access Chatbot App on Multiple Platforms
              </h3>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                You can access your Chatbot App account on any platform, whether desktop or mobile, through any browser. Your messages and chat history sync across all sessions.
              </p>
              <Button className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                Start using now
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;