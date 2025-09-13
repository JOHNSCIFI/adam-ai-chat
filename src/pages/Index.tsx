import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Automatically create a new chat and redirect
  React.useEffect(() => {
    const createNewChat = async () => {
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          user_id: user.id,
          title: 'New Chat'
        }])
        .select()
        .single();

      if (!error && data) {
        navigate(`/chat/${data.id}`, { replace: true });
      }
    };

    createNewChat();
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        <span className="text-gray-600">Creating new chat...</span>
      </div>
    </div>
  );
}