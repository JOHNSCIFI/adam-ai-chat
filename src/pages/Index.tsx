import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Shield, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-sidebar-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleNewChat = async () => {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single();

    if (!error && data) {
      navigate(`/chat/${data.id}`);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background p-6 overflow-hidden">
      <div className="text-center max-w-4xl">
        {/* Main Logo and Title */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-sidebar-primary via-sidebar-primary to-sidebar-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl text-sidebar-primary-foreground font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Welcome to adamGPT
          </h1>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
            Your intelligent AI assistant ready to help with any questions, creative projects, or problem-solving tasks
          </p>
        </div>

        {/* CTA Button */}
        <div className="mb-6">
          <Button 
            onClick={handleNewChat}
            size="default" 
            className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground px-6 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Start New Chat
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 text-center hover:bg-card/80 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Intelligent Conversations</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Engage in natural, context-aware conversations that understand your needs
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 text-center hover:bg-card/80 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get instant responses powered by advanced AI technology
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 text-center hover:bg-card/80 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Secure & Private</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your conversations are encrypted and stored securely
            </p>
          </div>
        </div>

        {/* Sample Prompts */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Try asking me about...</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              "Creative writing help",
              "Code optimization",
              "Business strategy", 
              "Learning new skills"
            ].map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={handleNewChat}
                className="h-auto p-3 text-left border-2 hover:border-sidebar-primary hover:bg-sidebar-primary/5 transition-colors rounded-lg"
              >
                <div className="text-xs font-medium text-foreground">{prompt}</div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}