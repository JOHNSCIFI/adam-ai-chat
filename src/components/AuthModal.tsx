import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    }
  }, [isOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: "Email or password is incorrect",
          variant: "destructive",
        });
      }
      // If sign in succeeds, the useEffect will handle closing the modal and redirecting
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
      <DialogContent className="w-full max-w-md mx-auto my-4 sm:my-0 px-4 sm:px-0 bg-background border border-border shadow-2xl rounded-2xl data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0 duration-300">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-xl font-semibold">
            ChatLearn
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Title Section */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-normal mb-2 sm:mb-3">
              {mode === 'reset' ? 'Reset your password' : 'Welcome to ChatLearn'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed px-2 sm:px-0">
              {mode === 'reset' 
                ? 'Enter your email and we\'ll send you a reset link.'
                : <>You'll get smarter responses and can upload<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>files, images, and more.</>
              }
            </p>
          </div>

          {/* Auth Form */}
          {mode !== 'reset' && (
            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="mb-4">
              {/* Sign In / Sign Up Toggle Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  onClick={() => setMode('signin')}
                  variant={mode === 'signin' ? 'default' : 'outline'}
                  className="flex-1 h-11 sm:h-12 rounded-xl font-medium"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  onClick={() => setMode('signup')}
                  variant={mode === 'signup' ? 'default' : 'outline'}
                  className="flex-1 h-11 sm:h-12 rounded-xl font-medium"
                >
                  Sign Up
                </Button>
              </div>

              {/* Email and Password Inputs */}
              <div className="mb-4 space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 text-base border border-input rounded-xl bg-background text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none transition-colors"
                />
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 text-base border border-input rounded-xl bg-background text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none transition-colors"
                />
              </div>

              {/* Forgot Password Link - Only show in Sign In mode */}
              {mode === 'signin' && (
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-sm text-primary hover:underline px-1"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !email || !password || (mode === 'signup' && signupCooldown > 0)}
                className="w-full h-11 sm:h-12 rounded-xl font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    {mode === 'signin' ? 'Signing in...' : 'Sending verification...'}
                  </>
                ) : mode === 'signup' && signupCooldown > 0 ? (
                  `Wait ${signupCooldown}s`
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Sign Up'
                )}
              </Button>

              {/* Cooldown Message for Sign Up */}
              {mode === 'signup' && signupCooldown > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  You can request a new link in {signupCooldown} seconds
                </p>
              )}
            </form>
          )}

          {/* Password Reset Form */}
          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="mb-4">
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 text-base border border-input rounded-xl bg-background text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setEmail('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 px-1"
              >
                ← Back to sign in
              </button>
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-11 sm:h-12 rounded-xl font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}

          {/* OR Divider - only show when not in reset mode */}
          {mode !== 'reset' && (
            <>
              <div className="relative my-5 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-background text-muted-foreground text-sm font-medium">OR</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || appleLoading || loading}
                variant="outline"
                className="w-full h-11 sm:h-12 font-medium rounded-xl mb-3"
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

              {/* Apple Sign In */}
              <Button
                onClick={handleAppleSignIn}
                disabled={googleLoading || appleLoading || loading}
                variant="outline"
                className="w-full h-11 sm:h-12 font-medium rounded-xl"
              >
            {appleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                Continue with Apple
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </>
            )}
          </Button>
            </>
          )}

          {/* Footer */}
          <div className="mt-5 sm:mt-6">
            <div className="text-center text-xs text-muted-foreground space-x-1">
              <button 
                onClick={() => {
                  onClose();
                  navigate('/terms');
                }}
                className="hover:underline cursor-pointer"
              >
                Terms of Use
              </button>
              <span>|</span>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/privacy');
                }}
                className="hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}