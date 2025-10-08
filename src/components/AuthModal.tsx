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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [userSignupMethod, setUserSignupMethod] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close modal and call onSuccess when user is authenticated
  useEffect(() => {
    if (user && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [user, isOpen, onClose, onSuccess]);

  const checkUserSignupMethod = async (email: string) => {
    if (!email) return;
    
    setCheckingUser(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('signup_method')
        .eq('email', email)
        .single();
      
      if (data) {
        setUserSignupMethod(data.signup_method);
      } else {
        setUserSignupMethod(null);
      }
    } catch (error) {
      setUserSignupMethod(null);
    } finally {
      setCheckingUser(false);
    }
  };

  useEffect(() => {
    if (email) {
      const timeoutId = setTimeout(() => {
        checkUserSignupMethod(email);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUserSignupMethod(null);
    }
  }, [email]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    if (!showPassword) {
      setShowPassword(true);
      return;
    }
    
    if (!password) return;
    
    setLoading(true);
    try {
      // Try to sign in first
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        // If sign in fails with "Invalid login credentials", user doesn't exist - sign them up
        if (signInError.message.includes('Invalid login credentials') || 
            signInError.message.includes('Invalid')) {
          const { error: signUpError } = await signUp(email, password, '');
          
          if (!signUpError) {
            // Sign up successful - show confirmation email notification
            toast({
              title: "Check your email",
              description: "We've sent you a confirmation link to complete your sign up. Please check your inbox.",
              duration: 8000,
            });
            // Keep modal open so user can see the notification
          } else {
            // Sign up failed
            toast({
              title: "Sign up failed",
              description: signUpError.message,
              variant: "destructive",
            });
          }
        } else {
          // Sign in failed for other reasons
          toast({
            title: "Sign in failed",
            description: signInError.message,
            variant: "destructive",
          });
        }
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setResetLoading(true);
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
        setResetMode(false);
        setEmail('');
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
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
              {resetMode ? 'Reset your password' : 'Log in or sign up'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed px-2 sm:px-0">
              {resetMode 
                ? 'Enter your email and we\'ll send you a reset link.'
                : <>You'll get smarter responses and can upload<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>files, images, and more.</>
              }
            </p>
          </div>

          {/* Email/Password Form or Reset Form */}
          <form onSubmit={resetMode ? handlePasswordReset : handleEmailSubmit} className="mb-4">
            <div className="mb-4 space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={showPassword && !resetMode}
                className="w-full h-11 sm:h-12 px-3 sm:px-4 text-base border border-input rounded-xl bg-background text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none transition-colors disabled:opacity-50"
              />
              {showPassword && !resetMode && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 text-base border border-input rounded-xl bg-background text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none transition-colors"
                  autoFocus
                />
              )}
              {email && userSignupMethod && !showPassword && !resetMode && (
                <p className="text-sm text-muted-foreground mt-2 px-1">
                  {userSignupMethod === 'google' 
                    ? 'This email is registered with Google. Please use Google sign-in.'
                    : 'This email is registered with email/password. You can sign in with email or Google.'
                  }
                </p>
              )}
            </div>
            {showPassword && !resetMode && (
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(false);
                    setPassword('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground px-1"
                >
                  ← Back to email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setShowPassword(false);
                    setPassword('');
                  }}
                  className="text-sm text-primary hover:underline px-1"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {resetMode && (
              <button
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setEmail('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 px-1"
              >
                ← Back to login
              </button>
            )}
            <Button
              type="submit"
              disabled={
                resetMode 
                  ? resetLoading || !email 
                  : loading || !email || (userSignupMethod === 'google' && !showPassword) || (showPassword && !password)
              }
              className="w-full h-11 sm:h-12 rounded-xl font-medium"
            >
              {resetMode ? (
                resetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )
              ) : loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {showPassword ? 'Signing in...' : 'Continue'}
                </>
              ) : (
                showPassword ? 'Continue' : 'Continue'
              )}
            </Button>
          </form>

          {/* OR Divider - only show if not in reset mode */}
          {!resetMode && (
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
                disabled={googleLoading || loading}
                variant="outline"
                className="w-full h-11 sm:h-12 font-medium rounded-xl"
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