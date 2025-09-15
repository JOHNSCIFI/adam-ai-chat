import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, '');
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a verification link to complete your signup.",
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
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
          description: "We've sent you a password reset link.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="text-xl font-semibold text-black">AdamGPT</div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="w-full max-w-sm">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-normal text-black mb-3">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-base text-gray-600 leading-relaxed">
              {isSignUp 
                ? 'You\'ll get smarter responses and can upload files, images, and more.'
                : 'Sign in to continue your conversation.'
              }
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isSignUp 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isSignUp 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign in
            </button>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailSubmit} className="mb-4">
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 text-base border border-gray-200 rounded-lg bg-white text-black placeholder-gray-400 focus:border-gray-300 focus:outline-none transition-colors"
              />
            </div>
            <div className="mb-6 relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 text-base border border-gray-200 rounded-lg bg-white text-black placeholder-gray-400 focus:border-gray-300 focus:outline-none transition-colors"
              />
              {!isSignUp && !password && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-gray-500 text-sm font-medium">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-12 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center font-medium"
          >
            {googleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3" />
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
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8">
        <div className="text-center text-sm text-gray-500 space-x-1">
          <a href="#" className="hover:underline">Terms of Use</a>
          <span>|</span>
          <a href="#" className="hover:underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}