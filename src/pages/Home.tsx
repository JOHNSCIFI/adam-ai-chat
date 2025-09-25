import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Check, Bot, Image, FileText, PenTool, Mic, Globe, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">use.ai</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#models" className="text-sm font-medium hover:text-primary">Models</a>
            <a href="#features" className="text-sm font-medium hover:text-primary">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary">Pricing</a>
          </div>
          <Button onClick={() => navigate('/chat')}>Sign in</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              25+ AI models available
              <Badge variant="outline" className="ml-2">New</Badge>
            </Badge>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">G</span>
                </div>
                <span className="text-sm">Powered by <strong>GPT-4</strong></span>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">C</span>
                </div>
                <span className="text-sm">Powered by <strong>Claude</strong></span>
              </div>
            </Card>
            <Card className="p-3 hidden sm:flex">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">A</span>
                </div>
                <span className="text-sm">Powered by <strong>Anthropic</strong></span>
              </div>
            </Card>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your <span className="text-primary">Multi-Model</span> AI Chat<br />
            Assistant
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Access GPT-4, Claude, Grok and more — all under one roof
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/chat')} className="text-lg px-8 py-6">
              Start Now →
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing-plans')} className="text-lg px-8 py-6">
              See pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI Models</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from the best AI models for your specific needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">G</span>
                </div>
                <CardTitle>OpenAI GPT-4o</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Most advanced reasoning and problem-solving</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">G</span>
                </div>
                <CardTitle>Google Gemini</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Excellent for multimodal tasks and analysis</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">C</span>
                </div>
                <CardTitle>Anthropic Claude</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Best for writing and creative tasks</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">D</span>
                </div>
                <CardTitle>DeepSeek</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Specialized in coding and technical analysis</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need <span className="text-primary">in one place</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to enhance your AI experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Multi-LLM Access</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Tap into the power of multiple AI models from one place
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="p-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Model Selection by Task</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Pick the best LLM for research, coding, writing, image generation, or any other task
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="p-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Voice-Enabled Commands</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Use your voice to interact with any AI model
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="p-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">5+ Languages Supported</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Speak your language — literally
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card className="text-center p-6">
              <CardHeader>
                <Bot className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">AI Chatbot</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Intelligent conversations with multiple AI models</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardHeader>
                <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">AI Image Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Create stunning visuals with AI-powered tools</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardHeader>
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Ask PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Extract insights from documents instantly</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardHeader>
                <PenTool className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">AI Writing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Generate content with advanced writing assistance</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose the plan that's<br />right for you
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Biweekly subscription</CardTitle>
                <div className="text-3xl font-bold">$14.99 <span className="text-sm font-normal text-muted-foreground">/biweekly</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Access to 25+ LLM models</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited switching between models</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Billed every 2 weeks</span>
                </div>
                <Button className="w-full mt-6">Start $0.99 Trial</Button>
              </CardContent>
            </Card>
            
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Monthly subscription</CardTitle>
                <div className="text-3xl font-bold">$24.99 <span className="text-sm font-normal text-muted-foreground">/monthly</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Access to 25+ LLM models</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited switching between models</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Billed every month</span>
                </div>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>
            
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white">Most popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Quarterly subscription</CardTitle>
                <div className="text-3xl font-bold">$49.99 <span className="text-sm font-normal text-muted-foreground">/3 months</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Access to 25+ LLM models</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited switching between models</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Billed every 3 months</span>
                </div>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">
              See our detailed pricing
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently<br />
                Asked<br />
                Questions
              </h2>
            </div>
            
            <div className="lg:col-span-2">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Is it free to use?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We offer a free trial to get you started. After that, you can choose from our flexible subscription plans.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    What if I'm not satisfied with the product?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    How do I cancel my subscription?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can cancel your subscription anytime from your account settings. No cancellation fees or hidden charges.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    What are the main features of the app?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Our app offers multi-model AI access, voice commands, image generation, PDF analysis, and AI writing assistance.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Which AI models are available on the app?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We provide access to 25+ AI models including GPT-4, Claude, Gemini, DeepSeek, and many others.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Are there any hidden fees?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No hidden fees. What you see is what you pay. All pricing is transparent and clearly displayed.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-7" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, we use enterprise-grade security to protect your data. All conversations are encrypted and never shared.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to supercharge your productivity?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already using AI to work smarter, not harder.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/chat')} className="text-lg px-8 py-6">
            Start free / Try now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-background border-t">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">use.ai</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Copyright © 2024-2025 Use AI Inc™
              </p>
              <p className="text-sm text-muted-foreground">
                Use AI Inc, 1032 E Brandon Blvd #2825,<br />
                Brandon, FL 33511, USA
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Customer Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Cancel Subscription</a></li>
                <li><a href="#" className="hover:text-primary">Customer Support</a></li>
                <li className="text-xs">24/7/365</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-primary">Terms & Conditions</a></li>
                <li><a href="/cookies" className="hover:text-primary">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary">Refund Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Help Center</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/help" className="hover:text-primary">Help Center</a></li>
                <li><a href="/pricing-plans" className="hover:text-primary">Pricing</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              © 2025 Use AI Inc. All rights reserved. All trademarks referenced herein are the properties of their respective owners. 
              We are not affiliated with any owners or companies that developed the LLM models provided on this website.
            </p>
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Select Language:</span>
              <select className="text-sm bg-background border rounded px-2 py-1">
                <option>English</option>
              </select>
            </div>
            <div className="flex justify-center gap-4">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">AMEX</div>
              <div className="w-12 h-8 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">DISC</div>
              <div className="w-12 h-8 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>
              <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;