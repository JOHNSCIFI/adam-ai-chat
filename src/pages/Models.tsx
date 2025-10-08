import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sparkles, ChevronDown, Shield, Users, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ChatLearnLogo from '@/components/ChatLearnLogo';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import chatlearnLogoLight from '@/assets/chatlearn-logo-light.png';
import chatlearnLogoDark from '@/assets/chatlearn-logo-dark.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';
const Models = () => {
  const navigate = useNavigate();
  const {
    actualTheme
  } = useTheme();
  const NavBar = () => <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
    </nav>;
  const Footer = () => <footer className="py-16 px-4 bg-gradient-to-b from-muted/30 to-muted/60">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative">
                <ChatLearnLogo className="h-7 w-7" />
                <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">ChatLearn</span>
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
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"></div>
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Built on the latest state-of-the-art <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">AI technologies</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-16 max-w-4xl mx-auto animate-fade-in leading-relaxed">
            Experience the capabilities of multiple AI models integrated into a single application. Effortlessly engage in conversations, generate content, and create with a user-friendly platform designed for versatility.
          </p>
        </div>
      </section>

      {/* Models Showcase */}
      

      {/* Models Grid */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-white border border-border rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={actualTheme === 'dark' ? chatlearnLogoDark : chatlearnLogoLight} alt="OpenAI GPT-4o" className={`w-6 h-6 ${actualTheme === 'light' ? 'brightness-0' : 'brightness-0 invert'}`} />
                </div>
                <div className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={geminiLogo} alt="Google Gemini" className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={claudeLogo} alt="Anthropic Claude" className="w-6 h-6" />
                </div>
                <div className={`w-8 h-8 ${actualTheme === 'dark' ? 'bg-background' : 'bg-gray-800'} border border-border rounded-lg flex items-center justify-center p-1 shadow-sm`}>
                  <img src={deepseekLogo} alt="DeepSeek" className="w-6 h-6" style={actualTheme === 'light' ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(2618%) hue-rotate(221deg) brightness(98%) contrast(101%)' } : {}} />
                </div>
                <div className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <img src={grokLogo} alt="Grok" className={`w-6 h-6 ${actualTheme === 'light' ? 'brightness-0' : ''}`} />
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
              <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in shadow-lg">
                {/* User Message */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-medium">U</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                      <p className="text-sm">I'd like to buy a new car. Start by asking me about my budget and which features I care most about, then provide a recommendation.</p>
                    </div>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center flex-shrink-0 p-1">
                    <img src={geminiLogo} alt="Gemini" className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
                        <img src={geminiLogo} alt="Gemini" className="w-3 h-3 mr-1" />
                        Gemini
                      </Badge>
                    </div>
                    <div className="bg-background/50 rounded-2xl rounded-tl-sm p-4 border">
                      <p className="text-sm mb-3">
                        Great! Let's start by narrowing down some details. What's your budget range for the new car? Once I know these details, I can recommend the best car options for you!
                      </p>
                      
                      
                    </div>
                  </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10 hover:border-green-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img src={actualTheme === 'dark' ? chatlearnLogoDark : chatlearnLogoLight} alt="OpenAI ChatGPT" className={`w-full h-full object-contain ${actualTheme === 'light' ? 'brightness-0' : 'brightness-0 invert'}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">OpenAI GPT-4o</h3>
                <p className="text-muted-foreground">Most advanced reasoning and problem-solving capabilities</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{
            animationDelay: '0.1s'
          }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img src={geminiLogo} alt="Google Gemini" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold mb-3">Google Gemini</h3>
                <p className="text-muted-foreground">Excellent for multimodal tasks and analysis</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{
            animationDelay: '0.2s'
          }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img src={claudeLogo} alt="Anthropic Claude" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold mb-3">Anthropic Claude</h3>
                <p className="text-muted-foreground">Best for writing and creative tasks</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{
            animationDelay: '0.3s'
          }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img src={deepseekLogo} alt="DeepSeek" className="w-full h-full object-contain" style={actualTheme === 'light' ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(2618%) hue-rotate(221deg) brightness(98%) contrast(101%)' } : {}} />
                </div>
                <h3 className="text-xl font-bold mb-3">DeepSeek</h3>
                <p className="text-muted-foreground">Specialized in coding and technical analysis</p>
              </div>
            </div>
            
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-slate-500/5 to-gray-500/5 border border-slate-500/10 hover:border-slate-500/30 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in" style={{
            animationDelay: '0.4s'
          }}>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 to-gray-500/0 group-hover:from-slate-500/5 group-hover:to-gray-500/5 rounded-2xl transition-all duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-2">
                  <img src={grokLogo} alt="Grok" className={`w-full h-full object-contain ${actualTheme === 'light' ? 'brightness-0' : ''}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">Grok</h3>
                <p className="text-muted-foreground">Real-time knowledge and conversational AI</p>
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
    </div>;
};
export default Models;