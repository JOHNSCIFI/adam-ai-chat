import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Chrome, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [availableAuthMethods, setAvailableAuthMethods] = useState<{
    email: boolean;
    google: boolean;
  }>({ email: true, google: true });
  
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if this is a password recovery callback
    const recoveryMode = searchParams.get('mode');
    if (recoveryMode === 'recovery') {
      setMode('reset');
    }
    checkAuthMethods();
  }, [email, searchParams]);

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
      if (mode === 'reset') {
        if (password !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure both passwords are the same.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          toast({
            title: "Password update failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password updated successfully!",
            description: "You can now log in with your new password.",
          });
          setMode('login');
        }
      } else if (mode === 'forgot') {
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
      case 'reset': return 'Set New Password';
      default: return 'adamGPT';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to continue your conversation';
      case 'signup': return 'Join thousands of users already using adamGPT';
      case 'forgot': return 'Enter your email to reset your password';
      case 'reset': return 'Enter your new password below';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/30 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-2xl ring-1 ring-primary/20">
            {mode === 'reset' ? (
              <Shield className="w-8 h-8 text-primary-foreground" />
            ) : (
              <span className="text-3xl font-bold text-primary-foreground">A</span>
            )}
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground leading-relaxed">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 p-8">
          {(mode === 'forgot' || mode === 'reset') && (
            <Button
              variant="ghost"
              onClick={() => setMode('login')}
              className="w-full mb-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-semibold text-foreground/90">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-14 px-4 rounded-2xl border-border/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-200 bg-background/50"
                />
              </div>
            )}
            
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground/90">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 px-4 rounded-2xl border-border/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-200 bg-background/50"
                />
              </div>
            )}
            
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground/90">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === 'reset' ? "Enter your new password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 px-4 pr-12 rounded-2xl border-border/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-200 bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-accent/30 rounded-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground/90">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-14 px-4 pr-12 rounded-2xl border-border/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-200 bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-accent/30 rounded-xl transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
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
                  className="text-sm text-muted-foreground hover:text-primary p-0 h-auto font-normal transition-colors"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
            
            {((mode === 'login' && availableAuthMethods.email) || mode !== 'login') && (
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary/90 hover:to-primary/85 text-primary-foreground font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Please wait...
                  </div>
                ) : (
                  mode === 'login' ? 'Sign In' : 
                  mode === 'signup' ? 'Create Account' : 
                  mode === 'reset' ? 'Update Password' :
                  'Send Reset Link'
                )}
              </Button>
            )}
          </form>
          
          {mode !== 'forgot' && mode !== 'reset' && (
            <>
              {((mode === 'login' && availableAuthMethods.email) || mode === 'signup') && (
                <div className="relative my-8">
                  <Separator className="bg-border/30" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    or continue with
                  </span>
                </div>
              )}
              
              {((mode === 'login' && availableAuthMethods.google) || mode === 'signup') && (
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-border/30 hover:bg-accent/30 hover:border-primary/20 transition-all duration-200 hover:scale-[1.01] shadow-md font-medium" 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  <Chrome className="w-5 h-5 mr-3 text-primary" />
                  {googleLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      Connecting...
                    </div>
                  ) : 'Continue with Google'}
                </Button>
              )}
              
              {mode === 'login' && !availableAuthMethods.email && (
                <div className="text-center p-6 bg-accent/5 rounded-2xl border border-border/20 backdrop-blur-sm">
                  <Chrome className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium text-foreground/90 mb-2">
                    This account was created with Google
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please use Google sign-in to access your account
                  </p>
                </div>
              )}
              
              <Separator className="bg-border/20 my-6" />
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
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