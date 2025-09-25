import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import SEO from '@/components/SEO';

const Contact = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Contact Us"
        description="Get in touch with AdamGpt support team. We're here to help with any questions about our AI platform and services."
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            We're here to help! Reach out to our team with any questions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Send us a message</h2>
            
            <form className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" placeholder="Your name" />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" type="text" placeholder="How can we help?" />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  rows={6} 
                  placeholder="Tell us more about your question or feedback..."
                />
              </div>
              
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Get in touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">Email</h3>
                  <p className="text-muted-foreground">support@adamchat.app</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <MessageSquare className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">Live Chat</h3>
                  <p className="text-muted-foreground">Available 24/7 through our platform</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">Support</h3>
                  <p className="text-muted-foreground">24/7/365 Customer Support</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-muted/30 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Quick Response</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond to all inquiries within 24 hours. For urgent matters, 
                please use our live chat feature for immediate assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;