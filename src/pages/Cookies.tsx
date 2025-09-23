import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Cookies() {
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
          <h1 className="text-4xl font-bold tracking-tight">Cookie Policy</h1>
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
            <CardTitle>What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold">Essential Cookies</h3>
                <Badge variant="destructive">Required</Badge>
              </div>
              <p className="mb-4">These cookies are necessary for the website to function properly and cannot be disabled.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Cookie Name</th>
                      <th className="border border-border p-3 text-left">Purpose</th>
                      <th className="border border-border p-3 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 font-mono text-sm">supabase-auth-token</td>
                      <td className="border border-border p-3">Maintains your login session</td>
                      <td className="border border-border p-3">Session</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-mono text-sm">sb-refresh-token</td>
                      <td className="border border-border p-3">Refreshes your authentication</td>
                      <td className="border border-border p-3">30 days</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-mono text-sm">cookie-consent</td>
                      <td className="border border-border p-3">Remembers your cookie preferences</td>
                      <td className="border border-border p-3">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold">Functional Cookies</h3>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <p className="mb-4">These cookies enable enhanced functionality and personalization.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Cookie Name</th>
                      <th className="border border-border p-3 text-left">Purpose</th>
                      <th className="border border-border p-3 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 font-mono text-sm">theme-preference</td>
                      <td className="border border-border p-3">Remembers your theme setting (light/dark)</td>
                      <td className="border border-border p-3">1 year</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-mono text-sm">sidebar-state</td>
                      <td className="border border-border p-3">Remembers sidebar open/closed state</td>
                      <td className="border border-border p-3">30 days</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-mono text-sm">user-preferences</td>
                      <td className="border border-border p-3">Stores your interface preferences</td>
                      <td className="border border-border p-3">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Google OAuth</h3>
              <p>When you sign in with Google, Google may set cookies for authentication purposes. These are governed by Google's privacy policy.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Learn more: <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Google Privacy Policy</a>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Supabase</h3>
              <p>Our infrastructure provider may set cookies for security and performance monitoring.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Learn more: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Supabase Privacy Policy</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managing Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Cookie Consent</h3>
              <p>
                When you first visit our website, you'll see a cookie banner where you can choose to accept all cookies, reject non-essential cookies, or manage your preferences in detail.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Browser Settings</h3>
              <p>You can also control cookies through your browser settings:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Impact of Disabling Cookies</h3>
              <p>Please note that disabling certain cookies may affect the functionality of our service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Essential cookies: The service will not function properly</li>
                <li>Functional cookies: You may lose personalization and preferences</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>If you have any questions about our use of cookies, please contact us:</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> <a href="mailto:privacy@adamai.chat" className="text-primary hover:underline">privacy@adamai.chat</a></p>
              <p><strong>Privacy:</strong> <a href="/privacy" className="text-primary hover:underline">View our Privacy Policy</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}