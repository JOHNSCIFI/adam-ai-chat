import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
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
      case 'login': return 'Welcome back';
      case 'signup': return 'Create your account';
      case 'forgot': return 'Reset your password';
      case 'reset': return 'Set new password';
      default: return 'ChatGPT';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Enter your details to sign in to your account';
      case 'signup': return 'Create an account to get started';
      case 'forgot': return 'Enter your email to reset your password';
      case 'reset': return 'Enter your new password';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getSubtitle()}
          </p>
        </div>
        
        <div className="space-y-6">
          {(mode === 'forgot' || mode === 'reset') && (
            <Button
              variant="ghost"
              onClick={() => setMode('login')}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to sign in
            </Button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            )}
            
            {mode !== 'reset' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            )}
            
            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  {mode === 'reset' ? 'New password' : 'Password'}
                </label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === 'reset' ? "Enter new password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

            {mode === 'reset' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                  Confirm new password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {mode === 'login' && availableAuthMethods.email && (
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </div>
            )}
            
            {((mode === 'login' && availableAuthMethods.email) || mode !== 'login') && (
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Please wait...
                  </div>
                ) : (
                  mode === 'login' ? 'Continue' : 
                  mode === 'signup' ? 'Create account' : 
                  mode === 'reset' ? 'Update password' :
                  'Continue'
                )}
              </Button>
            )}
          </form>
          
          {mode !== 'forgot' && mode !== 'reset' && (
            <>
              {((mode === 'login' && availableAuthMethods.email) || mode === 'signup') && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
              )}
              
              {((mode === 'login' && availableAuthMethods.google) || mode === 'signup') && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Connecting...
                    </div>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              )}
              
              {mode === 'login' && !availableAuthMethods.email && (
                <div className="rounded-lg border border-border p-4 text-center">
                  <svg className="mx-auto mb-2 h-6 w-6 text-primary" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-foreground">
                    This account uses Google sign-in
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please use Google to sign in to your account
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground"
                >
                  {mode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}