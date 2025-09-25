import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';
import SEO from '@/components/SEO';

const CancelSubscription = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Cancel Subscription"
        description="Cancel your AdamGpt subscription easily. Learn about cancellation process, billing cycles, and alternative options."
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Cancel Subscription</h1>
          <p className="text-xl text-muted-foreground">
            We're sorry to see you go. Let us know how we can improve.
          </p>
        </div>
        
        {/* Before you cancel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Before you cancel
            </CardTitle>
            <CardDescription>
              Consider these alternatives that might address your concerns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Pause your subscription</h3>
                <p className="text-sm text-muted-foreground">
                  Temporarily pause billing for up to 3 months while keeping your account active
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Talk to support</h3>
                <p className="text-sm text-muted-foreground">
                  Our team can help resolve issues or find a plan that better fits your needs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cancellation options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pause Subscription</CardTitle>
              <CardDescription>
                Take a break without losing your account data and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Pause for 1-3 months
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Let us help you find a solution before canceling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Chat with support
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cancel Subscription</CardTitle>
              <CardDescription>
                Cancel your subscription and stop future billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">What happens when you cancel:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your subscription will remain active until the end of your current billing period</li>
                  <li>• You'll continue to have full access to all features until then</li>
                  <li>• No future charges will be made to your payment method</li>
                  <li>• Your account data will be preserved for 30 days after cancellation</li>
                </ul>
              </div>
              
              <Button variant="destructive" className="w-full">
                Cancel My Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@adamchat.app" className="text-primary hover:underline">
              support@adamchat.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscription;