import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Mail, ExternalLink, FileText, Shield, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Help() {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Help & Support</h1>
          <p className="text-muted-foreground">Get help with adamGPT and find answers to common questions</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/privacy')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span>Privacy Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6 ml-13">
                Learn how we collect, use, and protect your personal information
              </p>
              <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Read Policy
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/terms')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span>Terms of Service</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6 ml-13">
                Review the terms and conditions for using adamGPT services
              </p>
              <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Read Terms
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/cookies')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <span>Cookie Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6 ml-13">
                Understand how we use cookies and manage your preferences
              </p>
              <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                View Cookies
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is adamGPT?</AccordionTrigger>
                <AccordionContent>
                  adamGPT is an AI-powered chat assistant that helps you with various tasks, questions, and conversations. 
                  It's designed to be helpful, harmless, and honest in all interactions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How do I start a new conversation?</AccordionTrigger>
                <AccordionContent>
                  Click the "New Chat" button in the sidebar to start a fresh conversation. You can have multiple 
                  conversations and switch between them using the sidebar.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent>
                  Yes, your data is secure. All conversations are encrypted and stored securely. We never share your 
                  personal information or conversation history with third parties.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can I delete my chat history?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can delete individual conversations by right-clicking on them in the sidebar. You can also 
                  export or delete all your data from the Settings page.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>How do I change my profile information?</AccordionTrigger>
                <AccordionContent>
                  Go to your Profile page using the sidebar navigation. There you can update your display name, 
                  email address, and profile picture.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>What features are coming soon?</AccordionTrigger>
                <AccordionContent>
                  We're working on adding Google sign-in, file uploads, voice messages, different AI models, 
                  and advanced customization options. Stay tuned for updates!
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Can't find what you're looking for? We're here to help! Contact us using one of the methods above 
                or check out our community forums.
              </p>
              
              <div className="flex gap-4">
                <Button variant="outline" disabled>
                  Community Forum (Coming Soon)
                </Button>
                <Button variant="outline" disabled>
                  Feature Requests (Coming Soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}