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
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-semibold">Help & Support</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Get help with adamGPT and find answers to common questions</p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/privacy')}>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span>Privacy Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Learn how we collect, use, and protect your personal information
              </p>
              <Button size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Read Policy
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/terms')}>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span>Terms of Service</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Review the terms and conditions for using adamGPT services
              </p>
              <Button size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Read Terms
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/cookies')}>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Cookie className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span>Cookie Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Understand how we use cookies and manage your preferences
              </p>
              <Button size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                View Cookies
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Frequently Asked Questions</CardTitle>
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
            <CardTitle className="text-lg sm:text-xl">Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm sm:text-base">
                Can't find what you're looking for? We're here to help! Contact us using one of the methods above 
                or check out our community forums.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                  Community Forum (Coming Soon)
                </Button>
                <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
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