import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Phone, Sparkles, Shield, Users } from 'lucide-react';
import SEO from '@/components/SEO';
import ChatLearnLogo from '@/components/ChatLearnLogo';

const Contact = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Contact Us"
        description="Get in touch with ChatLearn support team. We're here to help with any questions about our AI platform and services."
      />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're here to help! Reach out to our team with any questions about ChatLearn.
          </p>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="group">
              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  Send us a message
                </h2>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-foreground font-medium">Name</Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="Your name" 
                        className="mt-2 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com"
                        className="mt-2 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject" className="text-foreground font-medium">Subject</Label>
                    <Input 
                      id="subject" 
                      type="text" 
                      placeholder="How can we help?"
                      className="mt-2 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message" className="text-foreground font-medium">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={6} 
                      placeholder="Tell us more about your question or feedback..."
                      className="mt-2 border-muted-foreground/20 focus:border-primary resize-none"
                    />
                  </div>
                  
                  <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <Phone className="h-6 w-6 text-primary" />
                  Contact Information
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
                      <p className="text-muted-foreground mb-2">Get help via email</p>
                      <p className="text-sm font-medium text-primary">support@adamchat.app</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Live Chat</h3>
                      <p className="text-muted-foreground mb-2">Real-time assistance</p>
                      <p className="text-sm font-medium text-primary">Available 24/7 through our platform</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Customer Support</h3>
                      <p className="text-muted-foreground mb-2">Comprehensive assistance</p>
                      <p className="text-sm font-medium text-primary">24/7/365 Customer Support</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Quick Response Promise
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We typically respond to all inquiries within 24 hours. For urgent matters, 
                  please use our live chat feature for immediate assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer from Home page */}
      <footer className="py-16 px-4 bg-gradient-to-b from-muted/30 to-muted/60">
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
      </footer>
    </div>
  );
};

export default Contact;