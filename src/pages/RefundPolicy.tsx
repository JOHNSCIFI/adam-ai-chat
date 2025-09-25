import React from 'react';
import SEO from '@/components/SEO';

const RefundPolicy = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Refund Policy"
        description="AdamGpt refund policy and terms for subscription cancellations and service satisfaction guarantees."
      />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Refund Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">30-Day Money-Back Guarantee</h2>
            <p>
              We're committed to your satisfaction. If you're not completely happy with AdamGpt within the first 30 days 
              of your subscription, we'll provide a full refund, no questions asked.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Refund Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds are available for subscriptions purchased within the last 30 days</li>
              <li>Free trial users are not eligible for refunds as no payment was made</li>
              <li>Refunds apply to the current billing period only</li>
              <li>Previous billing periods are not eligible for refund after 30 days</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our support team at support@adamchat.app</li>
              <li>Include your account email and reason for the refund request</li>
              <li>We'll process your request within 2-3 business days</li>
              <li>Refunds are issued to the original payment method within 5-10 business days</li>
            </ol>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Partial Refunds</h2>
            <p>
              In some cases, we may offer partial refunds for exceptional circumstances beyond the 30-day window. 
              These are evaluated on a case-by-case basis and are at our sole discretion.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cancellation vs Refund</h2>
            <p>
              Canceling your subscription stops future billing but doesn't provide a refund for the current period. 
              You'll continue to have access to AdamGpt until the end of your current billing cycle.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>
              If you have any questions about our refund policy or need assistance with a refund request, 
              please contact our support team at support@adamchat.app or through our live chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;