import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Sparkles, ChevronDown, Shield, Users, X } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const Pricing = () => {
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
          <button onClick={() => navigate('/features')} className="text-sm font-medium hover:text-primary transition-colors">Features</button>
          <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-primary">Pricing</button>
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
          <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-600 dark:text-green-400">
            Pricing
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Get started with <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Chatbot App</span> today
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
            Unlock the full potential of Chatbot App with advanced plans.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-sm font-medium">Monthly</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
              <span className="text-sm font-medium">Quarterly</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">-70%</Badge>
            </div>
            <span className="text-sm font-medium">Yearly</span>
          </div>

          <p className="text-lg text-muted-foreground mb-16">Save 70% with yearly</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-2">$0</div>
                <p className="text-muted-foreground">Start free, upgrade anytime.</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Access to OpenAI's GPT-4o Mini</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Access to multiple top AI models</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Chat with all Models</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Custom bots built for specific use cases</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Unlimited file uploads</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Advanced web search capabilities</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Image Generation</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span>Chat with PDF files</span>
                </div>
              </div>
              
              <Button className="w-full" variant="outline" onClick={() => navigate('/chat')}>
                Get started →
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="group relative p-8 rounded-2xl bg-card border-2 border-primary hover:border-primary/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                Popular
              </Badge>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-1">$19.99</div>
                <p className="text-sm text-muted-foreground mb-2">$0.67 Per day</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm">save on annual billings</span>
                  <div className="w-8 h-4 bg-primary rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0 top-0 shadow"></div>
                  </div>
                </div>
                <p className="text-muted-foreground">month/billed monthly</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Access to multiple AI models, including OpenAI GPT-4o, Anthropic Claude, Google Gemini, Grok, and DeepSeek</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Chat with all Models</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Extended limits on messages, file uploads, advanced data analysis, and image generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Text-to-speech voice mode</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Custom bots built for specific use cases</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited file uploads</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Advanced web search capabilities</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Chat with PDF files</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Access to image analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>3,600 image generations per month</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/chat')}>
                Subscribe
              </Button>
            </div>

            {/* Ultra Pro Plan */}
            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Ultra Pro</h3>
                <div className="text-4xl font-bold mb-1">$39.99</div>
                <p className="text-sm text-muted-foreground mb-2">$1.33 Per day</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm">save on annual billings</span>
                  <div className="w-8 h-4 bg-primary rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0 top-0 shadow"></div>
                  </div>
                </div>
                <p className="text-muted-foreground">month/billed monthly</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Access to multiple AI models, including OpenAI GPT-4o, Anthropic Claude, Google Gemini, Grok, and DeepSeek</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Chat with all Models</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Extended limits on messages, file uploads, advanced data analysis, and image generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Text-to-speech voice mode</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Custom bots built for specific use cases</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited file uploads</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Advanced web search capabilities</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Extended limits for Chat with PDF files</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Access to image analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>14,000 image generations per month</span>
                </div>
              </div>
              
              <Button className="w-full" variant="outline" onClick={() => navigate('/chat')}>
                Subscribe →
              </Button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-card rounded-2xl border border-border p-8 mb-16 animate-fade-in">
            <h3 className="text-3xl font-bold text-center mb-8">Compare plans</h3>
            <p className="text-center text-muted-foreground mb-12">Get an overview of what is included.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6"></th>
                    <th className="text-center py-4 px-6">
                      <div className="space-y-2">
                        <div className="font-bold text-lg">Free</div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/chat')}>Get started →</Button>
                      </div>
                    </th>
                    <th className="text-center py-4 px-6">
                      <div className="space-y-2">
                        <div className="font-bold text-lg">Pro</div>
                        <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600" onClick={() => navigate('/chat')}>Subscribe</Button>
                      </div>
                    </th>
                    <th className="text-center py-4 px-6">
                      <div className="space-y-2">
                        <div className="font-bold text-lg">Ultra Pro</div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/chat')}>Subscribe →</Button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6 font-medium">Core</td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">OpenAI GPT-4o</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">Anthropic Claude</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">Google Gemini</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">DeepSeek</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">Image Generation</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center">3,600/month</td>
                    <td className="py-4 px-6 text-center">14,000/month</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">Image Analysis</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center">Advanced</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">Chat with PDF files</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center">Extended Limits</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-6">AI Search Engine</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;