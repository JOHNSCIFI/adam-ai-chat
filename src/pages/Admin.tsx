import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
  subscription_status?: {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  };
}
interface TokenUsageByModel {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
}

// Token pricing per 1M tokens (in USD)
// For image generation models, output tokens are stored as (price * 100)
const MODEL_PRICING: Record<string, {
  input: number;
  output: number;
  inputTier2?: number; // For models with tiered pricing (e.g., Claude >200k tokens)
  tier2Threshold?: number; // Token threshold for tier 2 pricing
}> = {
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.60
  },
  'gpt-4o': {
    input: 2.50,
    output: 10.00
  },
  'gpt-4o-latest': {
    input: 2.50,
    output: 10.00
  },
  'gpt-5': {
    input: 1.25,
    output: 10.00
  },
  'gpt-5-mini': {
    input: 0.25,
    output: 2.00
  },
  'gpt-5-nano': {
    input: 0.05,
    output: 0.40
  },
  'claude-sonnet-4': {
    input: 3.00,
    output: 15.00,
    inputTier2: 6.00, // >200k tokens rate
    tier2Threshold: 200000
  },
  'grok-4': {
    input: 3.00,
    output: 15.00
  },
  'deepseek-chat': {
    input: 0.07,
    output: 1.10
  },
  'deepseek-reasoner': {
    input: 0.14,
    output: 2.19
  },
  'deepseek-v2': { // Alias for deepseek-chat
    input: 0.07,
    output: 1.10
  },
  'google/gemini-2.5-pro': {
    input: 1.25,
    output: 5.00
  },
  'google/gemini-2.5-flash': {
    input: 0.30,
    output: 2.50
  },
  'google/gemini-2.5-flash-lite': {
    input: 0.15,
    output: 1.00
  },
  'gemini-2.5-pro': {
    input: 1.25,
    output: 5.00
  },
  'gemini-2.5-flash': {
    input: 0.30,
    output: 2.50
  },
  'gemini-2.5-flash-lite': {
    input: 0.15,
    output: 1.00
  },
  'google/gemini-flash': {
    input: 0.30,
    output: 2.50
  },
  'gemini-flash': {
    input: 0.30,
    output: 2.50
  },
  'google/gemini-2.0-flash-exp': {
    input: 0.30,
    output: 2.50
  },
  'generate-image': {
    input: 0,
    output: 0
  },
  // Image generation model (stored as price * 100)
  'dall-e-3': {
    input: 0,
    output: 0
  } // Image generation model (stored as price * 100)
};
const formatModelName = (model: string): string => {
  if (model === 'generate-image' || model === 'dall-e-3') return 'DALL-E-3';
  return model;
};
const isImageGenerationModel = (model: string): boolean => {
  return model === 'generate-image' || model === 'dall-e-3';
};
const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
  const pricing = MODEL_PRICING[model] || {
    input: 0,
    output: 0
  };

  // For image generation models, output tokens are stored as (price * 100)
  // So we divide by 100 to get the actual dollar cost
  if (isImageGenerationModel(model)) {
    return outputTokens / 100;
  }

  // Handle tiered pricing (e.g., Claude Sonnet 4 with >200k tokens)
  let inputCost = 0;
  if (pricing.tier2Threshold && pricing.inputTier2 && inputTokens > pricing.tier2Threshold) {
    // Tokens up to threshold use tier 1 rate, tokens above use tier 2 rate
    const tier1Tokens = pricing.tier2Threshold;
    const tier2Tokens = inputTokens - pricing.tier2Threshold;
    inputCost = (tier1Tokens / 1_000_000 * pricing.input) + (tier2Tokens / 1_000_000 * pricing.inputTier2);
  } else {
    inputCost = inputTokens / 1_000_000 * pricing.input;
  }

  const outputCost = outputTokens / 1_000_000 * pricing.output;
  return inputCost + outputCost;
};
export default function Admin() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUsages, setUserUsages] = useState<UserTokenUsage[]>([]);
  const [modelUsages, setModelUsages] = useState<TokenUsageByModel[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserTokenUsage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
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
      const {
        data,
        error
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
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

      // Fetch all token usage data
      const {
        data: tokenData,
        error: tokenError
      } = await supabase.from('token_usage').select('*').order('created_at', {
        ascending: false
      });
      if (tokenError) throw tokenError;

      // Get unique user IDs
      const userIds = [...new Set(tokenData?.map(usage => usage.user_id) || [])];

      // Fetch all profiles for these users
      const {
        data: profilesData,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, email, display_name').in('user_id', userIds);
      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

      // Aggregate by user and model
      const userMap = new Map<string, UserTokenUsage>();
      const modelMap = new Map<string, TokenUsageByModel>();
      tokenData?.forEach((usage: any) => {
        const userId = usage.user_id;
        const profile = profilesMap.get(userId);
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

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_RrCXJVxkfxu4Bq': 'Pro',
    'prod_RrCXvFp6H5sSUv': 'Ultra Pro',
  };

  // Fetch subscription status for a specific user
  const fetchUserSubscription = async (userId: string) => {
    setLoadingSubscription(true);
    try {
      // TODO: Create an admin-specific edge function to fetch user subscriptions
      // For now, this is a placeholder that shows "Free Plan" for all users
      // You'll need to create an admin endpoint that:
      // 1. Verifies the caller is an admin
      // 2. Fetches the target user's email
      // 3. Queries Stripe for their subscription status
      
      setLoadingSubscription(false);
      
      // Placeholder - mark all users as free plan for now
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          subscription_status: {
            subscribed: false,
            product_id: null,
            subscription_end: null
          }
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoadingSubscription(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>;
  }
  if (!isAdmin) {
    return null;
  }
  return <div className="min-h-full w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile & Tablet Navbar */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center h-14 px-4">
          <SidebarTrigger className="h-8 w-8 p-0 bg-transparent hover:bg-sidebar-accent text-sidebar-foreground rounded-lg" />
          <h2 className="ml-4 text-lg font-semibold">Admin Dashboard</h2>
        </div>
      </div>

      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
        {/* Header Section */}
        

        {/* Stats Card */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{userUsages.length}</div>
              <p className="text-xs text-muted-foreground mt-1">With token usage</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Models</CardTitle>
              <Badge variant="secondary" className="h-4 px-2 text-xs sm:h-5">{modelUsages.length}</Badge>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{modelUsages.length}</div>
              <p className="text-xs text-muted-foreground mt-1">AI models in use</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              <span className="text-primary text-base sm:text-lg font-bold">$</span>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                ${modelUsages.reduce((sum, m) => sum + m.total_cost, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all models</p>
            </CardContent>
          </Card>
        </div>

        {/* User Token Usage Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-base sm:text-lg md:text-xl">Token Usage by User</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm md:text-base">Click on a user to view detailed breakdown</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="hidden sm:table-cell font-semibold text-foreground text-xs sm:text-sm">User</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs sm:text-sm">Email</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Cost</TableHead>
                    <TableHead className="w-[60px] sm:w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userUsages.map(usage => {
                  const totalCost = usage.model_usages.reduce((sum, m) => sum + m.cost, 0);
                  return <TableRow key={usage.user_id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={async () => {
                    setSelectedUser(usage);
                    setIsModalOpen(true);
                    await fetchUserSubscription(usage.user_id);
                  }}>
                        <TableCell className="hidden sm:table-cell font-semibold text-foreground text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/60" />
                            <span className="truncate max-w-[150px] md:max-w-none">{usage.display_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm">
                          <span className="truncate block max-w-[140px] sm:max-w-[180px] md:max-w-none">{usage.email}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground text-xs sm:text-sm whitespace-nowrap">
                          ${totalCost.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 sm:px-3">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="ml-1 hidden sm:inline text-xs">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>;
                })}
                  {userUsages.length === 0 && <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 opacity-20" />
                          <p className="text-xs sm:text-sm">No token usage data available</p>
                        </div>
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                {selectedUser?.display_name}
              </DialogTitle>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm sm:text-base font-medium text-foreground break-all">
                  {selectedUser?.email}
                </p>
              </div>
              
              {/* Subscription Status */}
              <div className="space-y-1 pt-2">
                <p className="text-xs text-muted-foreground">Subscription Status</p>
                {loadingSubscription ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : selectedUser?.subscription_status?.subscribed ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
                      {productToPlanMap[selectedUser.subscription_status.product_id || ''] || 'Subscribed'}
                    </Badge>
                    {selectedUser.subscription_status.subscription_end && (
                      <span className="text-xs text-muted-foreground">
                        Until {new Date(selectedUser.subscription_status.subscription_end).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Free Plan
                  </Badge>
                )}
              </div>
            </DialogHeader>
            
            {selectedUser && <div className="space-y-4 mt-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-2">
                  <Card className="border-border/50">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm text-muted-foreground">Models Used</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <div className="text-xl sm:text-2xl font-bold">{selectedUser.model_usages.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm text-muted-foreground">Total Cost</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        ${selectedUser.model_usages.reduce((sum, m) => sum + m.cost, 0).toFixed(4)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile Card Layout */}
                <div className="space-y-3 md:hidden">
                  <h3 className="text-sm font-semibold text-foreground">Model Breakdown</h3>
                  {selectedUser.model_usages.map((modelUsage, idx) => <Card key={idx} className="border-border/50 bg-muted/20">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
                            {formatModelName(modelUsage.model)}
                          </Badge>
                          <span className="text-base font-bold text-primary">
                            {isImageGenerationModel(modelUsage.model) ? `$${(modelUsage.output_tokens / 100).toFixed(2)}` : `$${modelUsage.cost.toFixed(4)}`}
                          </span>
                        </div>
                        {!isImageGenerationModel(modelUsage.model) && <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                            <div>
                              <p className="text-xs text-muted-foreground">Input</p>
                              <p className="text-sm font-mono font-medium">{modelUsage.input_tokens.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Output</p>
                              <p className="text-sm font-mono font-medium">{modelUsage.output_tokens.toLocaleString()}</p>
                            </div>
                          </div>}
                      </CardContent>
                    </Card>)}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-sm">Model</TableHead>
                        <TableHead className="text-right text-sm">Input Tokens</TableHead>
                        <TableHead className="text-right text-sm">Output Tokens</TableHead>
                        <TableHead className="text-right text-sm">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUser.model_usages.map((modelUsage, idx) => <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
                              {formatModelName(modelUsage.model)}
                            </Badge>
                          </TableCell>
                          {isImageGenerationModel(modelUsage.model) ? <>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">-</TableCell>
                              <TableCell className="text-right font-mono font-semibold text-sm">
                                ${(modelUsage.output_tokens / 100).toFixed(2)}
                              </TableCell>
                            </> : <>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">
                                {modelUsage.input_tokens.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">
                                {modelUsage.output_tokens.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-sm">
                                ${modelUsage.cost.toFixed(4)}
                              </TableCell>
                            </>}
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </div>}
          </DialogContent>
        </Dialog>

        {/* Model Usage Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-base sm:text-lg md:text-xl">Token Usage by Model</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm md:text-base">Aggregated token consumption per AI model</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground text-xs sm:text-sm">Model</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Input Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Output Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelUsages.map(usage => <TableRow key={usage.model} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-semibold text-foreground text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/60" />
                          <span className="font-mono text-xs sm:text-sm">{formatModelName(usage.model)}</span>
                        </div>
                      </TableCell>
                      {isImageGenerationModel(usage.model) ? <>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">-</TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground text-sm sm:text-base md:text-lg">
                            ${(usage.output_tokens / 100).toFixed(2)}
                          </TableCell>
                        </> : <>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">
                            {usage.input_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">
                            {usage.output_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground text-sm sm:text-base md:text-lg">
                            ${usage.total_cost.toFixed(4)}
                          </TableCell>
                        </>}
                    </TableRow>)}
                  {modelUsages.length === 0 && <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 opacity-20">
                            <span className="text-xs">AI</span>
                          </Badge>
                          <p>No model usage data available</p>
                        </div>
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}