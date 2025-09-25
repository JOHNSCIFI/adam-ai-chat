import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Sparkles, Shield, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import AdamGptLogo from '@/components/AdamGptLogo';

export default function Privacy() {
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
            Privacy Policy
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
                <CardTitle className="text-xl text-foreground">Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  This Privacy Policy describes how Adam AI Chat ("we," "our," or "us") collects, uses, and protects your personal information when you use our AI chat service. We are committed to protecting your privacy and ensuring transparency about our data practices.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Controller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Data Controller:</strong> Adam AI Chat</p>
                <p><strong>Contact Email:</strong> privacy@adamai.chat</p>
                <p><strong>Data Protection Officer:</strong> dpo@adamai.chat</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Account Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Email address (required for account creation)</li>
                    <li>Display name</li>
                    <li>Profile avatar (if provided)</li>
                    <li>Authentication method (email or Google OAuth)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Chat and Content Data</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Chat messages and conversations</li>
                    <li>File attachments (documents, images, audio, video)</li>
                    <li>Image analyses and AI-generated content</li>
                    <li>Project titles and descriptions</li>
                    <li>Message timestamps and metadata</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Technical Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Usage patterns and preferences</li>
                    <li>Session information</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* ... keep existing cards with similar conservative styling ... */}

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Legal Bases and Purposes:</h3>
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <p className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">Contract Performance:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Providing AI chat services</li>
                      <li>Processing your messages and files</li>
                      <li>Maintaining your account and preferences</li>
                    </ul>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <p className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Legitimate Interest:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Improving our AI models and services</li>
                      <li>Ensuring platform security and preventing abuse</li>
                      <li>Technical maintenance and optimization</li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <p className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Consent:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Non-essential cookies and analytics (where applicable)</li>
                      <li>Marketing communications (if opted in)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Third-Party Processors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                    <h3 className="text-lg font-semibold mb-3">Supabase</h3>
                    <p className="text-sm text-muted-foreground mb-2">Location: United States</p>
                    <p className="text-sm mb-2">Purpose: Database hosting, authentication, file storage</p>
                    <p className="text-sm">Privacy Policy: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">supabase.com/privacy</a></p>
                  </div>

                  <div className="p-6 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                    <h3 className="text-lg font-semibold mb-3">OpenAI</h3>
                    <p className="text-sm text-muted-foreground mb-2">Location: United States</p>
                    <p className="text-sm mb-2">Purpose: AI chat responses, image generation and analysis</p>
                    <p className="text-sm">Privacy Policy: <a href="https://openai.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">openai.com/privacy</a></p>
                  </div>

                  <div className="p-6 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3">Google OAuth</h3>
                    <p className="text-sm text-muted-foreground mb-2">Location: Global</p>
                    <p className="text-sm mb-2">Purpose: Google sign-in authentication</p>
                    <p className="text-sm">Privacy Policy: <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">policies.google.com/privacy</a></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-semibold mb-2">Account Data</p>
                    <p className="text-sm">Retained while your account is active and for 30 days after deletion</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="font-semibold mb-2">Chat Messages</p>
                    <p className="text-sm">Retained while your account is active, deleted when you delete chats or account</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="font-semibold mb-2">File Uploads</p>
                    <p className="text-sm">Retained for the lifetime of associated chats</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="font-semibold mb-2">Usage Logs</p>
                    <p className="text-sm">Retained for 90 days for security and performance monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg">Under GDPR and CCPA, you have the following rights:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-primary">Access & Portability</h3>
                    <p className="text-sm text-muted-foreground mt-2">Request a copy of your personal data</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-primary">Rectification</h3>
                    <p className="text-sm text-muted-foreground mt-2">Correct inaccurate personal data</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-primary">Erasure</h3>
                    <p className="text-sm text-muted-foreground mt-2">Delete your personal data</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-primary">Restrict Processing</h3>
                    <p className="text-sm text-muted-foreground mt-2">Limit how we use your data</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-primary">Object</h3>
                    <p className="text-sm text-muted-foreground mt-2">Object to certain processing activities</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-primary">Withdraw Consent</h3>
                    <p className="text-sm text-muted-foreground mt-2">Withdraw consent for optional processing</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                  <h3 className="font-semibold mb-3 text-primary">How to Exercise Your Rights</h3>
                  <p className="mb-4">To exercise any of these rights, please contact us at:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Email: <a href="mailto:privacy@adamai.chat" className="text-primary hover:underline">privacy@adamai.chat</a></li>
                    <li>Account Settings: Use the delete account feature in your profile</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    We will respond to your request within 30 days and may need to verify your identity before processing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">We use minimal cookies to provide our service:</p>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="font-semibold text-green-600 dark:text-green-400">Essential Cookies:</p>
                    <p className="text-sm mt-2">Required for authentication, security, and basic functionality</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Preference Cookies:</p>
                    <p className="text-sm mt-2">Remember your theme and interface preferences</p>
                  </div>
                </div>
                <p className="text-lg">
                  For detailed information about cookies, please see our{' '}
                  <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">International Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  Your data may be transferred to and processed in the United States and other countries where our service providers operate. We ensure appropriate safeguards are in place, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard Contractual Clauses (SCCs)</li>
                  <li>Adequate country decisions</li>
                  <li>Vendor security and privacy certifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  We implement appropriate technical and organizational measures to protect your personal data, including:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-semibold">🔐 Encryption</p>
                    <p className="text-sm mt-2">In transit and at rest</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-semibold">🔑 Access Controls</p>
                    <p className="text-sm mt-2">Authentication and authorization</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-semibold">🛡️ Security Assessments</p>
                    <p className="text-sm mt-2">Regular security reviews</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-semibold">👥 Employee Training</p>
                    <p className="text-sm mt-2">Data protection education</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. For significant changes, we may also send you a notification via email.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:border-primary/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                <div className="space-y-3">
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
                      <span className="text-white text-sm">🛡</span>
                    </div>
                    <div>
                      <p className="font-semibold">Data Protection Officer</p>
                      <a href="mailto:dpo@adamai.chat" className="text-primary hover:underline">dpo@adamai.chat</a>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-6 p-4 rounded-lg bg-muted/50">
                  You also have the right to lodge a complaint with your local data protection authority if you believe we have not handled your personal data in accordance with applicable law.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
