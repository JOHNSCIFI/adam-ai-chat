import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNewChat = async () => {
    if (!user) return;
    
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
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">Welcome to adamGPT</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your intelligent AI assistant is ready to help. Start a conversation to begin chatting!
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="p-6 rounded-lg border bg-card">
            <Zap className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Quick & Intelligent</h3>
            <p className="text-sm text-muted-foreground">
              Get instant responses to your questions and engage in natural conversations
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card">
            <MessageSquare className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Multiple Conversations</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage multiple chat threads for different topics
            </p>
          </div>
        </div>

        <Button onClick={handleNewChat} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Start New Chat
        </Button>
      </div>
    </div>
  );
};

export default Index;
