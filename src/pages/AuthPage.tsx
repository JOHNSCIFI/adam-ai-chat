import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Chrome, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableAuthMethods, setAvailableAuthMethods] = useState<{
    email: boolean;
    google: boolean;
  }>({ email: true, google: true });
  
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthMethods();
  }, [email]);

  const checkAuthMethods = async () => {
    if (!email || mode !== 'login') {
      setAvailableAuthMethods({ email: true, google: true });
      return;
    }

    try {
      // Check if user exists and how they signed up
      const { data, error } = await supabase
        .from('profiles')
        .select('signup_method')
        .eq('email', email)
        .maybeSingle();

      if (!error && data) {
        // User exists, show methods based on their signup method
        if (data.signup_method === 'google') {
          setAvailableAuthMethods({ email: false, google: true });
        } else {
          setAvailableAuthMethods({ email: true, google: true });
        }
      } else {
        // User doesn't exist, show all methods
        setAvailableAuthMethods({ email: true, google: true });
      }
    } catch (error) {
      console.error('Error checking auth methods:', error);
      setAvailableAuthMethods({ email: true, google: true });
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Reset failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check your email",
            description: "Password reset link has been sent to your email address.",
          });
          setMode('login');
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      default: return 'adamGPT';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to continue your conversation';
      case 'signup': return 'Join thousands of users already using adamGPT';
      case 'forgot': return 'Enter your email to reset your password';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">A</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {mode === 'forgot' && (
            <Button
              variant="ghost"
              onClick={() => setMode('login')}
              className="w-full mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 px-4 rounded-xl border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4 rounded-xl border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 pr-12 rounded-xl border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent/50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {mode === 'login' && availableAuthMethods.email && (
              <div className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-muted-foreground hover:text-primary p-0 h-auto font-normal"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
            
            {((mode === 'login' && availableAuthMethods.email) || mode !== 'login') && (
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? 'Please wait...' : (
                  mode === 'login' ? 'Sign In' : 
                  mode === 'signup' ? 'Create Account' : 
                  'Send Reset Link'
                )}
              </Button>
            )}
          </form>
          
          {mode !== 'forgot' && (
            <>
              {((mode === 'login' && availableAuthMethods.email) || mode === 'signup') && (
                <div className="relative">
                  <Separator className="bg-border/50" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                    or continue with
                  </span>
                </div>
              )}
              
              {((mode === 'login' && availableAuthMethods.google) || mode === 'signup') && (
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-border/50 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] shadow-sm" 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  <Chrome className="w-5 h-5 mr-3" />
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>
              )}
              
              {mode === 'login' && !availableAuthMethods.email && (
                <div className="text-center p-4 bg-accent/10 rounded-xl border border-border/30">
                  <p className="text-sm text-muted-foreground mb-2">
                    This account was created with Google
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please use Google sign-in to access your account
                  </p>
                </div>
              )}
              
              <Separator className="bg-border/30" />
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary font-normal"
                >
                  {mode === 'login' 
                    ? "Don't have an account? Create one" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}