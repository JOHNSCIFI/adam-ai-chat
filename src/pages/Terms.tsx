import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
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
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By accessing and using Adam AI Chat ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Adam AI Chat is an artificial intelligence-powered chat service that allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Engage in conversations with AI assistants</li>
              <li>Upload and analyze various file types</li>
              <li>Generate and edit images using AI</li>
              <li>Organize conversations into projects</li>
              <li>Store and manage chat history</li>
            </ul>
            <p>
              The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue the Service at any time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Accounts and Obligations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Account Requirements</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 13 years old to use this Service</li>
                <li>One person or legal entity may not maintain more than one account</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">User Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service in compliance with all applicable laws and regulations</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Maintain the confidentiality of your account information</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prohibited Content and Conduct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You agree not to use the Service to create, upload, transmit, or distribute content that:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>Is illegal, harmful, or violates any laws</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains hate speech or discriminatory content</li>
                <li>Includes personal information of others without consent</li>
                <li>Contains malware or malicious code</li>
              </ul>
              <ul className="list-disc pl-6 space-y-2">
                <li>Promotes violence or illegal activities</li>
                <li>Is spam, fraudulent, or deceptive</li>
                <li>Violates privacy or publicity rights</li>
                <li>Is sexually explicit or inappropriate</li>
                <li>Attempts to harm or exploit minors</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Prohibited Activities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Interfering with or disrupting the Service</li>
                <li>Using automated tools to access the Service without permission</li>
                <li>Reverse engineering or attempting to extract source code</li>
                <li>Reselling or redistributing the Service without authorization</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Termination by You</h3>
              <p>You may terminate your account at any time through your account settings. Upon termination, your access to the Service will cease immediately.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Termination by Us</h3>
              <p>We reserve the right to suspend or terminate your account if you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate these Terms of Service</li>
                <li>Engage in prohibited content or conduct</li>
                <li>Fail to pay applicable fees (if any)</li>
                <li>Use the Service in a manner that could harm our operations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Effect of Termination</h3>
              <p>Upon termination, your right to use the Service will cease immediately. We may retain certain information as required by law or for legitimate business purposes.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Our IP Rights</h3>
              <p>
                The Service and its original content, features, and functionality are owned by Adam AI Chat and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Your Content</h3>
              <p>
                You retain ownership of any content you submit to the Service. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, modify, and distribute your content solely for the purpose of providing and improving the Service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">AI-Generated Content</h3>
              <p>
                Content generated by our AI systems in response to your prompts is provided to you under a non-exclusive license. You may use AI-generated content subject to these terms and applicable law.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disclaimers and Limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Service Disclaimers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Service is provided "as is" without warranties of any kind</li>
                <li>AI-generated content may be inaccurate, incomplete, or inappropriate</li>
                <li>We do not guarantee continuous, uninterrupted access to the Service</li>
                <li>We are not responsible for the accuracy of AI responses</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Adam AI Chat shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Indemnification</h3>
              <p>
                You agree to defend, indemnify, and hold harmless Adam AI Chat from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from your use of the Service or violation of these Terms.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy and Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your privacy is important to us. Please review our{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which also governs your use of the Service, to understand our practices.
            </p>
            <p>
              By using the Service, you consent to the collection and use of information in accordance with our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              These Terms shall be interpreted and governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved in the courts of Delaware.
            </p>
            <p>
              If you are a consumer residing in the European Union, you may also have the right to bring proceedings in the courts of your country of residence.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
            <p>
              Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> <a href="mailto:legal@adamai.chat" className="text-primary hover:underline">legal@adamai.chat</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@adamai.chat" className="text-primary hover:underline">support@adamai.chat</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}