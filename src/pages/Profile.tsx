import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  display_name: string;
  email: string;
  avatar_url?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile({
        display_name: data.display_name || '',
        email: data.email || user.email || '',
        avatar_url: data.avatar_url
      });
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          email: profile.email
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg">
                {profile.display_name ? getInitials(profile.display_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" disabled>
                Change Avatar (Coming Soon)
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a profile picture
              </p>
            </div>
          </div>

          <form onSubmit={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>

          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">Account Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>User ID: {user?.id}</p>
              <p>Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}