// Core arbitrage types

export interface TokenPrice {
  symbol: string;
  price: number;
  liquidity?: number;
  volume24h?: number;
  source: string;
  timestamp?: Date;
  spread?: number;
}

export interface Opportunity {
  id: number;
  exchange: string;
  pairs: string;
  profit: number;
  route: string;
  timestamp: Date;
  liquidity: {
    pair1: number;
    pair2: number;
    pair3: number;
  };
  fees: number;
  viable: boolean;
  priceData: {
    token1Price: number;
    token2Price: number;
    crossRate: number;
    inefficiency: number;
  };
  gasEstimate?: number;
  executionRisk?: 'low' | 'medium' | 'high';
  slippageImpact?: number;
}

export interface Analytics {
  totalOpportunities: number;
  averageProfit: number;
  topPairs: Array<{ 
    pair: string; 
    count: number; 
    avgProfit: number;
    maxProfit?: number;
    successRate?: number;
  }>;
  topExchanges: Array<{ 
    exchange: string; 
    count: number; 
    avgProfit: number;
    chain?: string;
    avgGasCost?: number;
  }>;
  totalVolume: number;
  totalPotentialProfit?: number;
  avgExecutionTime?: number;
}

export interface Settings {
  minProfitThreshold: number;
  minLiquidity: number;
  updateInterval: number;
  enabledExchanges: string[];
  focusedPairs: string[];
  maxGasPrice: number;
  slippageTolerance?: number;
  maxExecutionTime?: number;
  riskLevel?: 'conservative' | 'moderate' | 'aggressive';
}

// Exchange configuration types
export interface ExchangeConfig {
  name: string;
  apiUrl: string;
  priceUrl: string;
  fee: number;
  color: string;
  type: 'DEX' | 'CEX';
  chain: ChainName;
  minLiquidity: number;
  gasMultiplier?: number;
  supportedTokens?: string[];
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export type ChainName = 
  | 'Arbitrum'
  | 'Solana' 
  | 'Avalanche'
  | 'Cosmos'
  | 'Fantom'
  | 'BSC'
  | 'Blast'
  | 'Base'
  | 'Optimism'
  | 'Mode';

export type ConnectionStatus = 
  | 'offline'
  | 'connecting' 
  | 'connected'
  | 'error'
  | 'rate_limited';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  rateLimit?: {
    remaining: number;
    reset: Date;
  };
}

export interface PriceApiResponse {
  prices: Record<string, TokenPrice>;
  lastUpdate: Date;
  source: string;
}

// Trading route types
export interface TradingRoute {
  path: string[];
  expectedOutput: number;
  priceImpact: number;
  gasEstimate: number;
  executionTime: number;
  confidence: number; // 0-1
}

export interface ArbitrageExecution {
  opportunityId: number;
  route: TradingRoute;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  actualProfit?: number;
  executionTime?: number;
  gasUsed?: number;
  failureReason?: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number; // opportunities per minute
  uptime: number; // percentage
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface ChainMetrics {
  chain: ChainName;
  blockTime: number;
  gasPrice: number;
  networkCongestion: 'low' | 'medium' | 'high';
  lastBlockNumber?: number;
  syncStatus: boolean;
}

// Risk assessment types
export interface RiskAssessment {
  liquidityRisk: number; // 0-1
  slippageRisk: number; // 0-1
  executionRisk: number; // 0-1
  marketRisk: number; // 0-1
  overallRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Historical data types
export interface HistoricalOpportunity {
  opportunity: Opportunity;
  marketConditions: {
    volatility: number;
    volume: number;
    spread: number;
  };
  outcome?: {
    executed: boolean;
    actualProfit?: number;
    slippage?: number;
  };
}

export interface TrendData {
  timestamp: Date;
  totalOpportunities: number;
  avgProfit: number;
  marketVolatility: number;
  chainMetrics: Record<ChainName, ChainMetrics>;
}

// Export aggregation types
export interface ExportData {
  opportunities: Opportunity[];
  analytics: Analytics;
  settings: Settings;
  exchangeConfigs: Record<string, ExchangeConfig>;
  timestamp: Date;
  summary: {
    totalViable: number;
    avgProfitViable: number;
    bestOpportunity: Opportunity | { profit: number };
    totalPotentialProfit: number;
    riskDistribution: Record<string, number>;
  };
  performance?: PerformanceMetrics;
  historicalTrends?: TrendData[];
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Constants
export const SUPPORTED_CHAINS: ChainName[] = [
  'Arbitrum',
  'Solana',
  'Avalanche', 
  'Cosmos',
  'Fantom',
  'BSC',
  'Blast',
  'Base',
  'Optimism',
  'Mode'
];

export const DEFAULT_SETTINGS: Settings = {
  minProfitThreshold: 0.08,
  minLiquidity: 1500,
  updateInterval: 8000,
  enabledExchanges: [],
  focusedPairs: [],
  maxGasPrice: 20,
  slippageTolerance: 0.5,
  maxExecutionTime: 30000,
  riskLevel: 'moderate'
};

export const CHAIN_COLORS: Record<ChainName, string> = {
  Arbitrum: 'bg-blue-500',
  Solana: 'bg-green-500',
  Avalanche: 'bg-red-500',
  Cosmos: 'bg-purple-500',
  Fantom: 'bg-blue-600',
  BSC: 'bg-yellow-500',
  Blast: 'bg-yellow-600',
  Base: 'bg-blue-600',
  Optimism: 'bg-red-500',
  Mode: 'bg-gray-600'
};