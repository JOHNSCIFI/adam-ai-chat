import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Send, Mic } from 'lucide-react';

export default function Index() {
  const [input, setInput] = React.useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // For now, just clear the input
    // In a real implementation, this would create a new chat
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main chat area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Welcome message */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-sidebar-primary rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-sidebar-primary-foreground" />
            </div>
            <h1 className="text-4xl font-semibold text-foreground">
              What's on your mind today?
            </h1>
            <p className="text-lg text-muted-foreground">
              Start a conversation with adamGPT
            </p>
          </div>

          {/* Input area */}
          <Card className="border-input shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="pr-12 border-0 focus-visible:ring-0 text-base"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-sidebar-primary hover:bg-sidebar-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}