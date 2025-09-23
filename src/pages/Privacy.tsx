import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Privacy() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/help')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help
        </Button>
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>
      
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This Privacy Policy describes how Adam AI Chat ("we," "our," or "us") collects, uses, and protects your personal information when you use our AI chat service. We are committed to protecting your privacy and ensuring transparency about our data practices.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controller Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Data Controller:</strong> Adam AI Chat</p>
            <p><strong>Contact Email:</strong> privacy@adamai.chat</p>
            <p><strong>Data Protection Officer:</strong> dpo@adamai.chat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email address (required for account creation)</li>
                <li>Display name</li>
                <li>Profile avatar (if provided)</li>
                <li>Authentication method (email or Google OAuth)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Chat and Content Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chat messages and conversations</li>
                <li>File attachments (documents, images, audio, video)</li>
                <li>Image analyses and AI-generated content</li>
                <li>Project titles and descriptions</li>
                <li>Message timestamps and metadata</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and preferences</li>
                <li>Session information</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Legal Bases and Purposes:</h3>
            <div className="space-y-4">
              <div>
                <p><strong>Contract Performance:</strong></p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Providing AI chat services</li>
                  <li>Processing your messages and files</li>
                  <li>Maintaining your account and preferences</li>
                </ul>
              </div>
              
              <div>
                <p><strong>Legitimate Interest:</strong></p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Improving our AI models and services</li>
                  <li>Ensuring platform security and preventing abuse</li>
                  <li>Technical maintenance and optimization</li>
                </ul>
              </div>

              <div>
                <p><strong>Consent:</strong></p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Non-essential cookies and analytics (where applicable)</li>
                  <li>Marketing communications (if opted in)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Processors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Supabase (Database & Infrastructure)</h3>
                <p>Location: United States</p>
                <p>Purpose: Database hosting, authentication, file storage</p>
                <p>Privacy Policy: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">supabase.com/privacy</a></p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">OpenAI (AI Processing)</h3>
                <p>Location: United States</p>
                <p>Purpose: AI chat responses, image generation and analysis</p>
                <p>Privacy Policy: <a href="https://openai.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">openai.com/privacy</a></p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Google OAuth (Authentication)</h3>
                <p>Location: Global</p>
                <p>Purpose: Google sign-in authentication</p>
                <p>Privacy Policy: <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">policies.google.com/privacy</a></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
              <li><strong>Chat Messages:</strong> Retained while your account is active, deleted when you delete chats or account</li>
              <li><strong>File Uploads:</strong> Retained for the lifetime of associated chats</li>
              <li><strong>Usage Logs:</strong> Retained for 90 days for security and performance monitoring</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Under GDPR and CCPA, you have the following rights:</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-semibold">Access & Portability</h3>
                <p className="text-sm text-muted-foreground">Request a copy of your personal data</p>
              </div>
              <div>
                <h3 className="font-semibold">Rectification</h3>
                <p className="text-sm text-muted-foreground">Correct inaccurate personal data</p>
              </div>
              <div>
                <h3 className="font-semibold">Erasure</h3>
                <p className="text-sm text-muted-foreground">Delete your personal data</p>
              </div>
              <div>
                <h3 className="font-semibold">Restrict Processing</h3>
                <p className="text-sm text-muted-foreground">Limit how we use your data</p>
              </div>
              <div>
                <h3 className="font-semibold">Object</h3>
                <p className="text-sm text-muted-foreground">Object to certain processing activities</p>
              </div>
              <div>
                <h3 className="font-semibold">Withdraw Consent</h3>
                <p className="text-sm text-muted-foreground">Withdraw consent for optional processing</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="font-semibold mb-2">How to Exercise Your Rights</h3>
              <p>To exercise any of these rights, please contact us at:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Email: <a href="mailto:privacy@adamai.chat" className="text-primary hover:underline">privacy@adamai.chat</a></li>
                <li>Account Settings: Use the delete account feature in your profile</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                We will respond to your request within 30 days and may need to verify your identity before processing.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use minimal cookies to provide our service:</p>
            <div className="space-y-3">
              <div>
                <p><strong>Essential Cookies:</strong> Required for authentication, security, and basic functionality</p>
              </div>
              <div>
                <p><strong>Preference Cookies:</strong> Remember your theme and interface preferences</p>
              </div>
            </div>
            <p>
              For detailed information about cookies, please see our{' '}
              <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>International Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your data may be transferred to and processed in the United States and other countries where our service providers operate. We ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Adequate country decisions</li>
              <li>Vendor security and privacy certifications</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We implement appropriate technical and organizational measures to protect your personal data, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit and at rest</li>
              <li>Access controls and authentication</li>
              <li>Regular security assessments</li>
              <li>Employee training on data protection</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. For significant changes, we may also send you a notification via email.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> <a href="mailto:privacy@adamai.chat" className="text-primary hover:underline">privacy@adamai.chat</a></p>
              <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@adamai.chat" className="text-primary hover:underline">dpo@adamai.chat</a></p>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              You also have the right to lodge a complaint with your local data protection authority if you believe we have not handled your personal data in accordance with applicable law.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}