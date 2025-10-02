import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ModelUsageDetail {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

interface UserTokenUsage {
  user_id: string;
  email: string;
  display_name: string;
  model_usages: ModelUsageDetail[];
}

interface TokenUsageByModel {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
}

// Token pricing per 1M tokens (in USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-5': { input: 1.25, output: 10.00 },
  'gpt-5-mini': { input: 1.25, output: 10.00 },
  'gpt-5-nano': { input: 1.25, output: 10.00 },
  'google/gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'google/gemini-flash': { input: 0.30, output: 2.50 },
  'gemini-flash': { input: 0.30, output: 2.50 },
  'google/gemini-2.0-flash-exp': { input: 0.30, output: 2.50 },
};

const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
  const pricing = MODEL_PRICING[model] || { input: 0, output: 0 };
  return (inputTokens / 1_000_000 * pricing.input) + (outputTokens / 1_000_000 * pricing.output);
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUsages, setUserUsages] = useState<UserTokenUsage[]>([]);
  const [modelUsages, setModelUsages] = useState<TokenUsageByModel[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchTokenUsageData();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      toast.error('Please log in to access admin panel');
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Access denied: Admin privileges required');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    }
  };

  const fetchTokenUsageData = async () => {
    try {
      setLoading(true);

      // Fetch all token usage data with user profiles
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_usage')
        .select(`
          *,
          profiles:user_id (
            email,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (tokenError) throw tokenError;

      // Aggregate by user and model
      const userMap = new Map<string, UserTokenUsage>();
      const modelMap = new Map<string, TokenUsageByModel>();

      tokenData?.forEach((usage: any) => {
        const userId = usage.user_id;
        const profile = usage.profiles;
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const model = usage.model;
        const cost = calculateCost(model, inputTokens, outputTokens);

        // Aggregate by user with model breakdown
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            email: profile?.email || 'Unknown',
            display_name: profile?.display_name || 'Unknown User',
            model_usages: []
          });
        }

        const userUsage = userMap.get(userId)!;
        userUsage.model_usages.push({
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost
        });

        // Aggregate by model
        if (!modelMap.has(model)) {
          modelMap.set(model, {
            model,
            input_tokens: 0,
            output_tokens: 0,
            total_cost: 0
          });
        }

        const modelUsage = modelMap.get(model)!;
        modelUsage.input_tokens += inputTokens;
        modelUsage.output_tokens += outputTokens;
        modelUsage.total_cost += cost;
      });

      setUserUsages(Array.from(userMap.values()));
      setModelUsages(Array.from(modelMap.values()).sort((a, b) => b.total_cost - a.total_cost));
    } catch (error) {
      console.error('Error fetching token usage:', error);
      toast.error('Failed to load token usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-lg">Monitor AI model usage and token consumption across your platform</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        </div>

        {/* Stats Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{userUsages.length}</div>
              <p className="text-xs text-muted-foreground mt-1">With token usage</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Models</CardTitle>
              <Badge variant="secondary" className="h-5 px-2">{modelUsages.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{modelUsages.length}</div>
              <p className="text-xs text-muted-foreground mt-1">AI models in use</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              <span className="text-primary text-lg font-bold">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${modelUsages.reduce((sum, m) => sum + m.total_cost, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all models</p>
            </CardContent>
          </Card>
        </div>

        {/* User Token Usage Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-xl">Token Usage by User</CardTitle>
            </div>
            <CardDescription className="text-base">Detailed breakdown of token consumption per user and model</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">User</TableHead>
                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                    <TableHead className="font-semibold text-foreground">Model</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Input Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Output Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userUsages.flatMap((usage) => 
                    usage.model_usages.map((modelUsage, idx) => (
                      <TableRow key={`${usage.user_id}-${modelUsage.model}`} className="hover:bg-muted/50 transition-colors">
                        {idx === 0 && (
                          <>
                            <TableCell className="font-semibold text-foreground" rowSpan={usage.model_usages.length}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary/60" />
                                {usage.display_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground" rowSpan={usage.model_usages.length}>
                              {usage.email}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
                            {modelUsage.model}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {modelUsage.input_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {modelUsage.output_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-foreground">
                          ${modelUsage.cost.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {userUsages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 opacity-20" />
                          <p>No token usage data available</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Model Usage Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-xl">Token Usage by Model</CardTitle>
            </div>
            <CardDescription className="text-base">Aggregated token consumption and costs per AI model</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Model</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Input Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Output Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelUsages.map((usage) => (
                    <TableRow key={usage.model} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary/60" />
                          <span className="font-mono">{usage.model}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {usage.input_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {usage.output_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground text-lg">
                        ${usage.total_cost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {modelUsages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 opacity-20">
                            <span className="text-xs">AI</span>
                          </Badge>
                          <p>No model usage data available</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
