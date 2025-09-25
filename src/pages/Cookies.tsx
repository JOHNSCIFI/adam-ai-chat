import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Sparkles, Shield, Users } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';

export default function Cookies() {
  const navigate = useNavigate();

  const NavBar = () => (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
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
  );

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="container max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 text-primary animate-fade-in">
            Legal Information
          </Badge>
          <h1 className="text-6xl font-bold mb-8 animate-fade-in">
            Cookie <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-xl text-muted-foreground animate-fade-in" style={{animationDelay: '0.1s'}}>
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-8">
            <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-primary/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed">
                  Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <h3 className="text-xl font-semibold">Essential Cookies</h3>
                    <Badge variant="destructive">Required</Badge>
                  </div>
                  <p className="mb-6 text-lg">These cookies are necessary for the website to function properly and cannot be disabled.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-primary/10 to-purple-500/10">
                          <th className="border border-border p-4 text-left font-semibold">Cookie Name</th>
                          <th className="border border-border p-4 text-left font-semibold">Purpose</th>
                          <th className="border border-border p-4 text-left font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border border-border p-4 font-mono text-sm bg-muted/20">supabase-auth-token</td>
                          <td className="border border-border p-4">Maintains your login session</td>
                          <td className="border border-border p-4">Session</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border border-border p-4 font-mono text-sm bg-muted/20">sb-refresh-token</td>
                          <td className="border border-border p-4">Refreshes your authentication</td>
                          <td className="border border-border p-4">30 days</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border border-border p-4 font-mono text-sm bg-muted/20">cookie-consent</td>
                          <td className="border border-border p-4">Remembers your cookie preferences</td>
                          <td className="border border-border p-4">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">⚙</span>
                    </div>
                    <h3 className="text-xl font-semibold">Functional Cookies</h3>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                  <p className="mb-6 text-lg">These cookies enable enhanced functionality and personalization.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                          <th className="border border-border p-4 text-left font-semibold">Cookie Name</th>
                          <th className="border border-border p-4 text-left font-semibold">Purpose</th>
                          <th className="border border-border p-4 text-left font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border border-border p-4 font-mono text-sm bg-muted/20">theme-preference</td>
                          <td className="border border-border p-4">Remembers your theme setting (light/dark)</td>
                          <td className="border border-border p-4">1 year</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border border-border p-4 font-mono text-sm bg-muted/20">sidebar-state</td>
                          <td className="border border-border p-4">Remembers sidebar open/closed state</td>
                          <td className="border border-border p-4">30 days</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border border-border p-4 font-mono text-sm bg-muted/20">user-preferences</td>
                          <td className="border border-border p-4">Stores your interface preferences</td>
                          <td className="border border-border p-4">90 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors">
                    <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">Google OAuth</h3>
                    <p className="mb-3">When you sign in with Google, Google may set cookies for authentication purposes. These are governed by Google's privacy policy.</p>
                    <p className="text-sm text-muted-foreground">
                      Learn more: <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Google Privacy Policy</a>
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-colors">
                    <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">Supabase</h3>
                    <p className="mb-3">Our infrastructure provider may set cookies for security and performance monitoring.</p>
                    <p className="text-sm text-muted-foreground">
                      Learn more: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Supabase Privacy Policy</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Managing Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                    <h3 className="text-lg font-semibold mb-3 text-primary">Cookie Consent</h3>
                    <p className="text-sm">
                      When you first visit our website, you'll see a cookie banner where you can choose to accept all cookies, reject non-essential cookies, or manage your preferences in detail.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Browser Settings</h3>
                    <p className="text-sm mb-3">You can also control cookies through your browser settings:</p>
                    <ul className="text-xs space-y-1">
                      <li><strong>Chrome:</strong> Settings → Privacy and security</li>
                      <li><strong>Firefox:</strong> Preferences → Privacy & Security</li>
                      <li><strong>Safari:</strong> Preferences → Privacy</li>
                      <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400">Impact of Disabling</h3>
                    <p className="text-sm mb-3">Disabling certain cookies may affect functionality:</p>
                    <ul className="text-xs space-y-1">
                      <li><strong>Essential cookies:</strong> Service won't work properly</li>
                      <li><strong>Functional cookies:</strong> You may lose personalization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:border-primary/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">If you have any questions about our use of cookies, please contact us:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">✉</span>
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <a href="mailto:privacy@adamai.chat" className="text-primary hover:underline">privacy@adamai.chat</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🔒</span>
                    </div>
                    <div>
                      <p className="font-semibold">Privacy Policy</p>
                      <a href="/privacy" className="text-primary hover:underline">View our Privacy Policy</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}