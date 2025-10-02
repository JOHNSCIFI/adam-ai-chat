import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface UserTokenUsage {
  user_id: string;
  email: string;
  display_name: string;
  total_tokens: number;
  total_cost: number;
  message_count: number;
  models_used: string[];
}

interface TokenUsageByModel {
  model: string;
  total_tokens: number;
  total_cost: number;
  usage_count: number;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUsages, setUserUsages] = useState<UserTokenUsage[]>([]);
  const [modelUsages, setModelUsages] = useState<TokenUsageByModel[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

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

      // Aggregate by user
      const userMap = new Map<string, UserTokenUsage>();
      const modelMap = new Map<string, TokenUsageByModel>();
      let totalCostSum = 0;
      let totalTokensSum = 0;

      tokenData?.forEach((usage: any) => {
        const userId = usage.user_id;
        const profile = usage.profiles;

        // Aggregate by user
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            email: profile?.email || 'Unknown',
            display_name: profile?.display_name || 'Unknown User',
            total_tokens: 0,
            total_cost: 0,
            message_count: 0,
            models_used: []
          });
        }

        const userUsage = userMap.get(userId)!;
        userUsage.total_tokens += usage.total_tokens || 0;
        userUsage.total_cost += parseFloat(usage.cost_usd || 0);
        userUsage.message_count += 1;
        if (!userUsage.models_used.includes(usage.model)) {
          userUsage.models_used.push(usage.model);
        }

        // Aggregate by model
        const model = usage.model;
        if (!modelMap.has(model)) {
          modelMap.set(model, {
            model,
            total_tokens: 0,
            total_cost: 0,
            usage_count: 0
          });
        }

        const modelUsage = modelMap.get(model)!;
        modelUsage.total_tokens += usage.total_tokens || 0;
        modelUsage.total_cost += parseFloat(usage.cost_usd || 0);
        modelUsage.usage_count += 1;

        // Overall totals
        totalCostSum += parseFloat(usage.cost_usd || 0);
        totalTokensSum += usage.total_tokens || 0;
      });

      setUserUsages(Array.from(userMap.values()).sort((a, b) => b.total_cost - a.total_cost));
      setModelUsages(Array.from(modelMap.values()).sort((a, b) => b.total_cost - a.total_cost));
      setTotalCost(totalCostSum);
      setTotalTokens(totalTokensSum);
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor token usage and costs across all users</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userUsages.length}</div>
            <p className="text-xs text-muted-foreground">With token usage</p>
          </CardContent>
        </Card>
      </div>

      {/* User Token Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage by User</CardTitle>
          <CardDescription>Detailed breakdown of token consumption and costs per user</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead className="text-right">Total Tokens</TableHead>
                <TableHead className="text-right">Cost (USD)</TableHead>
                <TableHead>Models Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userUsages.map((usage) => (
                <TableRow key={usage.user_id}>
                  <TableCell className="font-medium">{usage.display_name}</TableCell>
                  <TableCell>{usage.email}</TableCell>
                  <TableCell className="text-right">{usage.message_count}</TableCell>
                  <TableCell className="text-right">{usage.total_tokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${usage.total_cost.toFixed(4)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {usage.models_used.map((model) => (
                        <Badge key={model} variant="secondary" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {userUsages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No token usage data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Model Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage by Model</CardTitle>
          <CardDescription>Breakdown of token consumption and costs per AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Usage Count</TableHead>
                <TableHead className="text-right">Total Tokens</TableHead>
                <TableHead className="text-right">Cost (USD)</TableHead>
                <TableHead className="text-right">Avg Cost/Use</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelUsages.map((usage) => (
                <TableRow key={usage.model}>
                  <TableCell className="font-medium">{usage.model}</TableCell>
                  <TableCell className="text-right">{usage.usage_count}</TableCell>
                  <TableCell className="text-right">{usage.total_tokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${usage.total_cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${(usage.total_cost / usage.usage_count).toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
              {modelUsages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No model usage data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
