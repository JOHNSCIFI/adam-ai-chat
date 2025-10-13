import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0);
  const [signupCooldown, setSignupCooldown] = useState<number>(0);
  const [error, setError] = useState<string>('');
  
  const { user, signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close modal and call onSuccess when user is authenticated
  useEffect(() => {
    if (user && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [user, isOpen, onClose, onSuccess]);

  // Countdown timer for signup cooldown
  useEffect(() => {
    if (signupCooldown > 0) {
      const timer = setTimeout(() => {
        setSignupCooldown(signupCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [signupCooldown]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setMode('signin');
      setSignupCooldown(0);
      setError('');
    }
  }, [isOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError("Email or password is incorrect");
      }
      // If sign in succeeds, the useEffect will handle closing the modal and redirecting
    } catch (error) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    // Check cooldown
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttempt;
    
    if (timeSinceLastAttempt < 60000) { // 60 seconds = 1 minute
      const remainingSeconds = Math.ceil((60000 - timeSinceLastAttempt) / 1000);
      setSignupCooldown(remainingSeconds);
      toast({
        title: "Please wait",
        description: `You can request a new sign up link in ${remainingSeconds} seconds`,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await signUp(email, password, '');
      
      if (!error) {
        setLastSignupAttempt(now);
        setSignupCooldown(60);
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your sign up. Please check your inbox.",
          duration: 8000,
        });
      } else {
        // Check if user already exists
        if (error.message?.toLowerCase().includes('already registered') || 
            error.message?.toLowerCase().includes('user already registered')) {
          toast({
            title: "Account already exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
          // Switch to sign in mode
          setMode('signin');
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
          duration: 8000,
        });
        setMode('signin');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
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
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast({
          title: "Apple sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[70vw] p-0 bg-background border border-border shadow-2xl rounded-3xl overflow-hidden mx-auto my-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>ChatLearn Authentication</DialogTitle>
          <DialogDescription>
            {mode === 'reset' ? 'Reset your password' : 'Sign in or sign up to ChatLearn'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row min-h-[420px]">
          {/* Left Panel - Social Proof */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-background to-muted/30 p-5 md:p-7 flex flex-col items-center justify-center border-r border-border">
            {/* Badge and Rating */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 mb-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">#1</div>
                  <div className="text-base font-bold">ChatLearn</div>
                </div>
              </div>
              
              <div className="flex gap-1 justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              
              <div className="text-2xl font-bold mb-1">35M+ users</div>
            </div>

            {/* Available On */}
            <div className="text-center mb-5">
              <div className="text-xs text-muted-foreground mb-2">Available on</div>
              <div className="flex gap-1.5 justify-center items-center flex-wrap">
                <div className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                  <img src="/chrome-icon.svg" alt="Chrome" className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                  <img src="/firefox-icon.svg" alt="Firefox" className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                  <img src="/edge-icon-new.svg" alt="Edge" className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                  <img src="/safari-icon-new-final.svg" alt="Safari" className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Trusted by Millions */}
            <div className="text-center">
              <h3 className="text-xl font-bold">Trusted by Millions</h3>
            </div>
          </div>

          {/* Right Panel - Auth Form */}
          <div className="w-full md:w-1/2 p-5 md:p-7 flex flex-col">
            {/* Powered By */}
            <div className="mb-4">
              <div className="text-xs text-muted-foreground text-right mb-2">Powered By</div>
              <div className="flex gap-3 justify-end items-center">
                <div className="flex items-center gap-1.5">
                  <img src="/chatgpt-logo.png" alt="ChatGPT" className="w-4 h-4" />
                  <span className="text-xs font-medium">OpenAI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src="/anthropic-icon.svg" alt="Anthropic" className="w-4 h-4" />
                  <span className="text-xs font-medium">Anthropic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-xs font-medium">Google</span>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold leading-tight">
                Join Millions of Happy Users
              </h2>
            </div>

            {/* Auth Buttons */}
            <div className="flex-1 flex flex-col">
              {mode === 'reset' ? (
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div className="text-xs text-muted-foreground mb-3">
                    Enter your email and we'll send you a reset link.
                  </div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-10"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setEmail('');
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    ← Back to sign in
                  </button>
                </form>
              ) : (
                <>
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || appleLoading || loading}
                    className="w-full h-10 mb-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    {googleLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                        Continue with Google
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleAppleSignIn}
                    disabled={googleLoading || appleLoading || loading}
                    variant="outline"
                    className="w-full h-10 mb-3"
                  >
                    {appleLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                        Continue with Apple
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </>
                    )}
                  </Button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-background text-xs text-muted-foreground">or</span>
                    </div>
                  </div>

                   <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-2">
                     <Input
                       type="email"
                       placeholder="Enter your email"
                       value={email}
                       onChange={(e) => {
                         setEmail(e.target.value);
                         setError('');
                       }}
                       required
                       className="h-10"
                     />
                     <Input
                       type="password"
                       placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                       value={password}
                       onChange={(e) => {
                         setPassword(e.target.value);
                         setError('');
                       }}
                       required
                       minLength={6}
                       className="h-10"
                     />
                     {error && (
                       <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                         {error}
                       </div>
                     )}
                     <Button
                       type="submit"
                       disabled={loading || !email || !password || (mode === 'signup' && signupCooldown > 0)}
                       className="w-full h-10"
                     >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          {mode === 'signin' ? 'Signing in...' : 'Sending verification...'}
                        </>
                      ) : mode === 'signup' && signupCooldown > 0 ? (
                        `Wait ${signupCooldown}s`
                      ) : (
                        'Continue with Email'
                      )}
                    </Button>
                  </form>

                  <div className="mt-3 text-center space-x-2 text-xs">
                    {mode === 'signin' ? (
                      <>
                        <span className="text-muted-foreground">Don't have an account?</span>
                        <button
                          onClick={() => setMode('signup')}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign up
                        </button>
                        <span className="text-muted-foreground">|</span>
                        <button
                          onClick={() => setMode('reset')}
                          className="text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Already have an account?</span>
                        <button
                          onClick={() => setMode('signin')}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                By proceeding, you agree to our{' '}
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/terms');
                  }}
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </button>
                {' '}and read our{' '}
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/privacy');
                  }}
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}