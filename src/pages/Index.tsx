import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Shield, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export default function Index() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  if (loading) {
    return <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-sidebar-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const handleNewChat = async () => {
    const {
      data,
      error
    } = await supabase.from('chats').insert([{
      user_id: user.id,
      title: 'New Chat'
    }]).select().single();
    if (!error && data) {
      navigate(`/chat/${data.id}`);
    }
  };
  return <div className="flex-1 flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-4xl">
        {/* Main Logo and Title */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-sidebar-primary via-sidebar-primary to-sidebar-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl text-sidebar-primary-foreground font-bold">A</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Welcome to adamGPT
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Your intelligent AI assistant ready to help with any questions, creative projects, or problem-solving tasks
          </p>
        </div>

        {/* CTA Button */}
        <div className="mb-12">
          <Button onClick={handleNewChat} size="lg" className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <MessageSquare className="w-6 h-6 mr-3" />
            Start New Chat
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          

          

          
        </div>

        {/* Sample Prompts */}
        
      </div>
    </div>;
}