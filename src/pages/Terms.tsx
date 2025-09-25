import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Sparkles, Shield, Users } from 'lucide-react';
import AdamGptLogo from '@/components/AdamGptLogo';

export default function Terms() {
  const navigate = useNavigate();

  const NavBar = () => (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="relative">
            <AdamGptLogo className="h-7 w-7" />
            <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1" />
          </div>
          <span className="text-xl font-bold text-foreground">AdamGpt</span>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <button onClick={() => navigate('/models')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Models</button>
          <button onClick={() => navigate('/features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</button>
          <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors">
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
        <Button onClick={() => navigate('/chat')} variant="outline" className="border-2">
          Try Here
        </Button>
      </div>
    </nav>
  );

  const Footer = () => (
    <footer className="py-12 px-4 bg-muted/20 border-t">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <AdamGptLogo className="h-6 w-6" />
              <span className="text-lg font-semibold text-foreground">AdamGpt</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Professional AI solutions for businesses and individuals.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Product</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/features')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</button>
              <button onClick={() => navigate('/pricing')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
              <button onClick={() => navigate('/models')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">AI Models</button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Company</h3>
            <div className="space-y-2">
              <a href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="/explore-tools" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Explore Tools</a>
              <a href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Legal</h3>
            <div className="space-y-2">
              <a href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/cookie-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-muted-foreground">
              &copy; 2024 AdamGpt. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-muted-foreground">
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
      <section className="py-16 px-4 border-b">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-muted-foreground/20 text-muted-foreground">
            Legal Document
          </Badge>
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-6">
            <Card className="border-2 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Agreement to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  By accessing and using Adam AI Chat ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Service Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="mb-4 text-muted-foreground">
                  Adam AI Chat is an artificial intelligence-powered chat service that allows users to:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted">
                    <p className="font-semibold text-foreground">💬 AI Conversations</p>
                    <p className="text-sm mt-2 text-muted-foreground">Engage with multiple AI assistants</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted">
                    <p className="font-semibold text-foreground">📁 File Analysis</p>
                    <p className="text-sm mt-2 text-muted-foreground">Upload and analyze various file types</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted">
                    <p className="font-semibold text-foreground">🎨 Image Generation</p>
                    <p className="text-sm mt-2 text-muted-foreground">Generate and edit images using AI</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted">
                    <p className="font-semibold text-foreground">📊 Project Organization</p>
                    <p className="text-sm mt-2 text-muted-foreground">Organize conversations into projects</p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">
                  The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue the Service at any time.
                </p>
              </CardContent>
            </Card>

            {/* ... keep existing cards with similar conservative styling ... */}

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">User Accounts and Obligations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Account Requirements</h3>
                  <ul className="list-disc pl-6 space-y-2 text-lg">
                    <li>You must provide accurate and complete information when creating an account</li>
                    <li>You are responsible for maintaining the security of your account credentials</li>
                    <li>You must be at least 13 years old to use this Service</li>
                    <li>One person or legal entity may not maintain more than one account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">User Responsibilities</h3>
                  <ul className="list-disc pl-6 space-y-2 text-lg">
                    <li>Use the Service in compliance with all applicable laws and regulations</li>
                    <li>Respect the intellectual property rights of others</li>
                    <li>Maintain the confidentiality of your account information</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Prohibited Content and Conduct</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg">You agree not to use the Service to create, upload, transmit, or distribute content that:</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="font-semibold text-red-600 dark:text-red-400">🚫 Illegal Content</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>Is illegal, harmful, or violates any laws</li>
                        <li>Infringes on intellectual property rights</li>
                        <li>Contains hate speech or discriminatory content</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">⚠️ Harmful Content</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>Promotes violence or illegal activities</li>
                        <li>Contains malware or malicious code</li>
                        <li>Is sexually explicit or inappropriate</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">🔒 Privacy Violations</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>Includes personal information of others without consent</li>
                        <li>Violates privacy or publicity rights</li>
                        <li>Attempts to harm or exploit minors</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="font-semibold text-purple-600 dark:text-purple-400">🎭 Deceptive Content</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>Is spam, fraudulent, or deceptive</li>
                        <li>Impersonates others</li>
                        <li>Contains false information</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4 text-primary">Prohibited Activities</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Attempting to gain unauthorized access to our systems</li>
                      <li>Interfering with or disrupting the Service</li>
                      <li>Using automated tools to access the Service without permission</li>
                    </ul>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Reverse engineering or attempting to extract source code</li>
                      <li>Reselling or redistributing the Service without authorization</li>
                      <li>Violating any applicable laws or regulations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Account Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">Termination by You</h3>
                    <p>You may terminate your account at any time through your account settings. Upon termination, your access to the Service will cease immediately.</p>
                  </div>

                  <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">Termination by Us</h3>
                    <p>We reserve the right to suspend or terminate your account if you:</p>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                      <li>Violate these Terms of Service</li>
                      <li>Engage in prohibited content or conduct</li>
                      <li>Fail to pay applicable fees (if any)</li>
                      <li>Use the Service harmfully</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <h3 className="text-lg font-semibold mb-3">Effect of Termination</h3>
                  <p>Upon termination, your right to use the Service will cease immediately. We may retain certain information as required by law or for legitimate business purposes.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Our IP Rights</h3>
                    <p className="text-sm">
                      The Service and its original content, features, and functionality are owned by Adam AI Chat and are protected by international intellectual property laws.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Your Content</h3>
                    <p className="text-sm">
                      You retain ownership of any content you submit to the Service. By submitting content, you grant us a non-exclusive license to use it for providing the Service.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400">AI-Generated Content</h3>
                    <p className="text-sm">
                      Content generated by our AI systems in response to your prompts is provided to you under a non-exclusive license for your use.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Disclaimers and Limitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-yellow-600 dark:text-yellow-400">Service Disclaimers</h3>
                    <ul className="list-disc pl-4 space-y-2 text-sm">
                      <li>The Service is provided "as is" without warranties</li>
                      <li>AI-generated content may be inaccurate or inappropriate</li>
                      <li>We do not guarantee continuous access</li>
                      <li>We are not responsible for AI response accuracy</li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">Limitation of Liability</h3>
                    <p className="text-sm">
                      To the maximum extent permitted by law, Adam AI Chat shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                  <h3 className="text-lg font-semibold mb-3 text-primary">Indemnification</h3>
                  <p>
                    You agree to defend, indemnify, and hold harmless Adam AI Chat from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from your use of the Service or violation of these Terms.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Privacy and Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  Your privacy is important to us. Please review our{' '}
                  <a href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</a>, which also governs your use of the Service, to understand our practices.
                </p>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p>
                    By using the Service, you consent to the collection and use of information in accordance with our Privacy Policy.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  These Terms shall be interpreted and governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
                </p>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm">
                    If you are a consumer residing in the European Union, you may also have the right to bring proceedings in the courts of your country of residence.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p>
                    Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:border-primary/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">If you have any questions about these Terms of Service, please contact us:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">⚖</span>
                    </div>
                    <div>
                      <p className="font-semibold">Legal</p>
                      <a href="mailto:legal@adamai.chat" className="text-primary hover:underline">legal@adamai.chat</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">💬</span>
                    </div>
                    <div>
                      <p className="font-semibold">Support</p>
                      <a href="mailto:support@adamai.chat" className="text-primary hover:underline">support@adamai.chat</a>
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