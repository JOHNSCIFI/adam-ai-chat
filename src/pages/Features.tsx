import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sparkles, ChevronDown, Shield, Users, Mic, Image as ImageIcon, FileText, Bot, Globe, Zap, Target, ArrowRight, Play, Square, MicIcon } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
const Features = () => {
  const navigate = useNavigate();
  const {
    actualTheme
  } = useTheme();
  const [activeFeature, setActiveFeature] = useState('models');
  const NavBar = () => <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <DropdownMenuItem onClick={() => navigate('/cookie-policy')}>
                Cookie Policy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={() => navigate('/chat')} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
          Sign in
        </Button>
      </div>
    </nav>;
  const Footer = () => <footer className="py-16 px-4 bg-gradient-to-b from-muted/30 to-muted/60">
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
    </footer>;
  return <div className="min-h-screen bg-background">
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
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <Button 
              variant={activeFeature === 'models' ? 'default' : 'outline'} 
              className={`px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeFeature === 'models' 
                  ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg scale-105 border-0' 
                  : 'border-2 border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-105'
              }`}
              onClick={() => setActiveFeature('models')}
            >
              Switch Models
            </Button>
            <Button 
              variant={activeFeature === 'voice' ? 'default' : 'outline'} 
              className={`px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeFeature === 'voice' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105 border-0' 
                  : 'border-2 border-border hover:border-blue-500/50 hover:bg-muted/50 hover:scale-105'
              }`}
              onClick={() => setActiveFeature('voice')}
            >
              Voice Chat
            </Button>
            <Button 
              variant={activeFeature === 'images' ? 'default' : 'outline'} 
              className={`px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeFeature === 'images' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105 border-0' 
                  : 'border-2 border-border hover:border-pink-500/50 hover:bg-muted/50 hover:scale-105'
              }`}
              onClick={() => setActiveFeature('images')}
            >
              Generate Images
            </Button>
            <Button 
              variant={activeFeature === 'files' ? 'default' : 'outline'} 
              className={`px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeFeature === 'files' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105 border-0' 
                  : 'border-2 border-border hover:border-green-500/50 hover:bg-muted/50 hover:scale-105'
              }`}
              onClick={() => setActiveFeature('files')}
            >
              Talk to Files
            </Button>
          </div>

          {/* Switch Models Feature */}
          {activeFeature === 'models' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 animate-fade-in">
                <h2 className="text-4xl font-bold mb-6">Switch Models</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Seamlessly explore top-tier language models including GPT-4o, Claude, DeepSeek, and Gemini. Select the right model for everything from content creation to complex problem-solving.
                </p>
                <Button className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/chat')}>
                  Explore now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="order-1 lg:order-2 grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-8 hover:border-green-500/30 transition-all duration-300 animate-fade-in" style={{
                animationDelay: '0.1s'
              }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                      <img src={actualTheme === 'dark' ? chatgptLogoLight : chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain" />
                    </div>
                    <h3 className="font-bold text-sm mb-2">ChatGPT</h3>
                    <p className="text-xs text-muted-foreground">Advanced reasoning</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300 animate-fade-in" style={{
                animationDelay: '0.3s'
              }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center mb-4">
                      <img src={deepseekLogo} alt="DeepSeek" className="w-10 h-10 object-contain" />
                    </div>
                    <h3 className="font-bold text-sm mb-2">DeepSeek</h3>
                    <p className="text-xs text-muted-foreground">Coding specialist</p>
                  </div>
                </div>
                <div className="space-y-6 pt-8">
                  <div className="bg-card border border-border rounded-2xl p-8 hover:border-orange-500/30 transition-all duration-300 animate-fade-in" style={{
                animationDelay: '0.2s'
              }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl flex items-center justify-center mb-4">
                      <img src={claudeLogo} alt="Claude" className="w-10 h-10 object-contain" />
                    </div>
                    <h3 className="font-bold text-sm mb-2">Claude</h3>
                    <p className="text-xs text-muted-foreground">Creative writing</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300 animate-fade-in" style={{
                animationDelay: '0.4s'
              }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center mb-4">
                      <img src={geminiLogo} alt="Gemini" className="w-10 h-10 object-contain" />
                    </div>
                    <h3 className="font-bold text-sm mb-2">Gemini</h3>
                    <p className="text-xs text-muted-foreground">Multimodal tasks</p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Voice Chat Feature */}
          {activeFeature === 'voice' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 animate-fade-in">
                <h2 className="text-4xl font-bold mb-6">Voice Chat</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Experience hands-free conversations with our AI models using advanced voice recognition and natural speech synthesis. Perfect for multitasking or accessibility needs.
                </p>
                <div className="flex gap-4 mb-8">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <MicIcon className="w-3 h-3 mr-1" />
                    Speech Recognition
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Natural Voice
                  </Badge>
                </div>
                
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="bg-card border border-border rounded-2xl p-8 animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Voice Mode Controls</h3>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Dictation Button */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <Button size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600">
                        <MicIcon className="h-4 w-4" />
                      </Button>
                      <div>
                        <h4 className="font-medium">Dictation Mode</h4>
                        <p className="text-sm text-muted-foreground">Press and hold to speak</p>
                      </div>
                    </div>

                    {/* Voice Mode Button */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600">
                        <Play className="h-4 w-4" />
                      </Button>
                      <div>
                        <h4 className="font-medium">Voice Mode</h4>
                        <p className="text-sm text-muted-foreground">Continuous conversation</p>
                      </div>
                    </div>

                    {/* Stop Button */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <Button size="icon" variant="destructive" className="rounded-full">
                        <Square className="h-4 w-4" />
                      </Button>
                      <div>
                        <h4 className="font-medium">Stop</h4>
                        <p className="text-sm text-muted-foreground">End voice session</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>}

          {/* Generate Images Feature */}
          {activeFeature === 'images' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center animate-pulse">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Generate & Edit Images
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Create, combine, and edit stunning visuals with our advanced AI image models. Generate with DALL-E 3 and nanobanana, edit images with OpenAI, and combine multiple images seamlessly.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <img src={actualTheme === 'dark' ? chatgptLogoLight : chatgptLogo} alt="ChatGPT" className="w-8 h-8" />
                    <div>
                      <span className="font-semibold text-green-700 dark:text-green-300">GPT Image 1</span>
                      <p className="text-sm text-muted-foreground">Generate & edit images</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                    <img src={geminiLogo} alt="Gemini" className="w-8 h-8" />
                    <div>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">nanoBanana</span>
                      <p className="text-sm text-muted-foreground">Generate, combine & edit images</p>
                    </div>
                  </div>
                </div>
                
                <Button className="group bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:from-pink-700 hover:via-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => navigate('/image-generation')}>
                  Generate Images <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Enhanced floating elements background */}
                  <div className="absolute -top-12 -left-12 w-40 h-40 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-tl from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="relative bg-gradient-to-br from-background via-muted/30 to-background/80 border border-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 rounded-3xl p-10 animate-fade-in backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-700">
                    {/* Premium header design */}
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-0.5 shadow-2xl">
                            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-background flex items-center justify-center shadow-lg">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">AI Studio Pro</p>
                          <p className="text-sm text-muted-foreground font-medium">Create • Edit • Transform</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Enhanced image gallery */}
                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="w-full h-36 bg-gradient-to-br from-orange-400 via-yellow-500 to-amber-600 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10"></div>
                          <ImageIcon className="h-12 w-12 text-white/90 z-10 drop-shadow-lg" />
                          <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <Badge variant="secondary" className="absolute bottom-3 left-3 bg-gradient-to-r from-white/90 to-white/70 text-gray-800 border-0 font-semibold text-xs shadow-lg">
                          Generated
                        </Badge>
                      </div>
                      
                      <div className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="w-full h-36 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10"></div>
                          <Bot className="h-12 w-12 text-white/90 z-10 drop-shadow-lg" />
                          <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <Badge variant="secondary" className="absolute bottom-3 left-3 bg-gradient-to-r from-white/90 to-white/70 text-gray-800 border-0 font-semibold text-xs shadow-lg">
                          Edited
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Enhanced status and capabilities */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-center p-5 bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-green-500/15 rounded-2xl border border-green-500/30 shadow-inner">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                            <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                          </div>
                          <span className="text-sm font-semibold text-green-700 dark:text-green-300">Advanced AI Models Ready</span>
                          <Zap className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-muted">
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium text-muted-foreground">Generate</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-muted">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className="text-xs font-medium text-muted-foreground">Edit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>}

          {/* Talk to Files Feature */}
          {activeFeature === 'files' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 animate-fade-in">
                <h2 className="text-4xl font-bold mb-6">Talk to Files</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Upload any document and our AI models will extract, analyze, and understand the content. Ask questions, get summaries, or discuss the material naturally. Supports PDFs, Word docs, presentations, spreadsheets, and more.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="text-sm">PDF Documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Word Files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Spreadsheets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Presentations</span>
                  </div>
                </div>
                <Button className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/chat')}>
                  Upload & Chat <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="bg-card border border-border rounded-2xl p-8 animate-fade-in">
                  <h3 className="text-lg font-semibold mb-6">Document Analysis</h3>
                  
                  {/* Sample conversation */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-medium">U</span>
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                        <p className="text-sm">Can you summarize the key findings from this research paper?</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0 p-1">
                        <img src={claudeLogo} alt="AI" className="w-5 h-5" />
                      </div>
                      <div className="bg-background/50 rounded-2xl rounded-tl-sm p-3 border">
                        <p className="text-sm">Based on the uploaded document, here are the 3 key findings: 1) Market adoption increased 40%, 2) User satisfaction improved significantly, 3) Cost efficiency gains of 25%.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* File types indicator */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
                    <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">10+ file formats supported</span>
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </section>

      <Footer />
    </div>;
};
export default Features;