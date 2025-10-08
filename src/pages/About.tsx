import React from 'react';
import SEO from '@/components/SEO';

const About = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="About Us"
        description="Learn about ChatLearn, your complete AI assistant platform offering access to multiple AI models including GPT-4o, Claude, Gemini and DeepSeek."
      />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">About ChatLearn</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p className="text-xl mb-6">
            ChatLearn is your gateway to the world's most advanced AI models, all in one unified platform.
          </p>
          
          <p className="mb-6">
            We believe that artificial intelligence should be accessible to everyone, regardless of technical expertise. 
            That's why we've created a single, intuitive interface that connects you to multiple state-of-the-art AI models 
            including OpenAI's GPT-4o, Google's Gemini, Anthropic's Claude, and DeepSeek.
          </p>
          
          <p className="mb-6">
            Our platform offers comprehensive AI capabilities including intelligent conversations, image generation, 
            document analysis, and AI-powered writing assistance. Whether you're a creative professional, researcher, 
            student, or business owner, ChatLearn provides the tools you need to enhance your productivity and creativity.
          </p>
          
          <p>
            Join thousands of users who trust ChatLearn for their daily AI needs and discover the power of having 
            multiple AI assistants at your fingertips.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;