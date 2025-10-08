import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Star, Wrench, CreditCard } from 'lucide-react';
import SEO from '@/components/SEO';

const HelpCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Help Center"
        description="Find answers to frequently asked questions about ChatLearn, tutorials, and comprehensive guides for using our AI platform."
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to your questions and learn how to make the most of ChatLearn
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search for help..." 
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Categories - Updated */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div 
            onClick={() => navigate('/chat')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">AI Chat</h3>
          </div>
          <div 
            onClick={() => navigate('/features')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <Star className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">Features</h3>
          </div>
          <div 
            onClick={() => navigate('/explore-tools')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <Wrench className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">AI Tools</h3>
          </div>
          <div 
            onClick={() => navigate('/pricing')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">Pricing & Plans</h3>
          </div>
        </div>
        
        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="what-can-i-do" className="border border-border rounded-lg px-6">
              <AccordionTrigger>What can I do with this AI?</AccordionTrigger>
              <AccordionContent>
                You can chat, create images, write texts, learn new things, and even get coding help — all in one place.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="easy-to-use" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Is it easy to use?</AccordionTrigger>
              <AccordionContent>
                Yes. Just start typing or speaking — no setup needed.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="study-learn" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Can it help me study or learn?</AccordionTrigger>
              <AccordionContent>
                Absolutely. The AI can explain topics, summarize notes, and answer your questions like a study buddy.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="create-images" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Can I create images with it?</AccordionTrigger>
              <AccordionContent>
                Yes. You can generate unique images instantly from your ideas.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="languages" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Does it work in different languages?</AccordionTrigger>
              <AccordionContent>
                Yes. You can chat naturally in 50+ languages.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="writing-help" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Can it help with writing?</AccordionTrigger>
              <AccordionContent>
                Yes. From short messages to full articles, the AI helps you write faster and better.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="voice-commands" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Can I talk to it with my voice?</AccordionTrigger>
              <AccordionContent>
                Yes. You can use voice commands for hands-free conversations.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="for-fun" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Is it good for fun too?</AccordionTrigger>
              <AccordionContent>
                Definitely. Chat casually, ask for jokes, or just have fun conversations.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;