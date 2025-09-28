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
        description="Find answers to frequently asked questions about AdamGpt, tutorials, and comprehensive guides for using our AI platform."
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to your questions and learn how to make the most of AdamGpt
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
            <AccordionItem value="what-is-adamgpt" className="border border-border rounded-lg px-6">
              <AccordionTrigger>What is AdamGpt?</AccordionTrigger>
              <AccordionContent>
                AdamGpt is a comprehensive AI platform that provides access to multiple advanced AI models including GPT-4o, Claude, Gemini, and DeepSeek through a single, unified interface.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="which-models" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Which AI models are available?</AccordionTrigger>
              <AccordionContent>
                We offer access to OpenAI GPT-4o, Google Gemini, Anthropic Claude, and DeepSeek. Each model has unique strengths - GPT-4o for general tasks, Gemini for multimodal analysis, Claude for writing, and DeepSeek for coding.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="how-to-start" className="border border-border rounded-lg px-6">
              <AccordionTrigger>How do I get started?</AccordionTrigger>
              <AccordionContent>
                Simply click "Try now" to access our chat interface. You can start using AI models immediately. For advanced features, you can create an account and choose a subscription plan that fits your needs.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="pricing" className="border border-border rounded-lg px-6">
              <AccordionTrigger>What are the pricing plans?</AccordionTrigger>
              <AccordionContent>
                We offer flexible pricing plans including a free tier for basic usage, plus paid plans with additional features and higher usage limits. Visit our pricing page for detailed information.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="image-generation" className="border border-border rounded-lg px-6">
              <AccordionTrigger>Can I generate images?</AccordionTrigger>
              <AccordionContent>
                Yes! Our platform includes AI image generation capabilities. You can create, edit, and enhance images using text prompts through our integrated image generation tools.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="pdf-analysis" className="border border-border rounded-lg px-6">
              <AccordionTrigger>How does PDF analysis work?</AccordionTrigger>
              <AccordionContent>
                Upload any PDF document and ask questions about its content. Our AI can extract information, summarize key points, and answer specific questions about your documents.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;