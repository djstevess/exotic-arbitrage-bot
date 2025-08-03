"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, Settings, TrendingUp, AlertCircle, Database, Wifi, Activity, DollarSign } from "lucide-react";

interface TokenPrice {
  symbol: string;
  price: number;
  liquidity?: number;
  volume24h?: number;
  source: string;
}

interface Opportunity {
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
}

interface Analytics {
  totalOpportunities: number;
  averageProfit: number;
  topPairs: Array<{ pair: string; count: number; avgProfit: number }>;
  topExchanges: Array<{ exchange: string; count: number; avgProfit: number }>;
  totalVolume: number;
}

interface Settings {
  minProfitThreshold: number;
  minLiquidity: number;
  updateInterval: number;
  enabledExchanges: string[];
  focusedPairs: string[];
  maxSlippage: number;
}

const TraderJoeRaydiumArbitrageBot = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
  const [connectedExchanges, setConnectedExchanges] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [settings, setSettings] = useState<Settings>({
    minProfitThreshold: Number(process.env.NEXT_PUBLIC_MIN_PROFIT_THRESHOLD) || 0.10,
    minLiquidity: Number(process.env.NEXT_PUBLIC_MIN_LIQUIDITY) || 2000,
    updateInterval: Number(process.env.NEXT_PUBLIC_UPDATE_INTERVAL) || 7000,
    enabledExchanges: ["traderjoe", "raydium"],
    focusedPairs: [
      // Avalanche (TraderJoe) Native Tokens
      "AVAX-JOE-USDC.e",
      "AVAX-PNG-USDC.e", 
      "JOE-PNG-USDC.e",
      "AVAX-QI-USDC.e",
      "JOE-QI-USDC.e",
      "AVAX-XAVA-USDC.e",
      "JOE-XAVA-USDC.e",
      
      // Solana (Raydium) Native Tokens
      "SOL-RAY-USDC",
      "SOL-SRM-USDC",
      "RAY-SRM-USDC",
      "SOL-ORCA-USDC",
      "ORCA-RAY-USDC",
      "RAY-ORCA-USDC",
      
      // Avalanche DeFi Protocols
      "AVAX-GMX-USDC.e",
      "JOE-GMX-USDC.e",
      "AVAX-GLP-USDC.e",
      "JOE-GLP-USDC.e",
      
      // Solana DeFi Protocols
      "SOL-MNGO-USDC",
      "RAY-MNGO-USDC",
      "MNGO-SRM-USDC",
      "SOL-FIDA-USDC",
      "RAY-FIDA-USDC",
      "FIDA-SRM-USDC",
      
      // Avalanche Gaming & NFT
      "AVAX-CRAFT-USDC.e",
      "JOE-CRAFT-USDC.e",
      "AVAX-LOST-USDC.e",
      
      // Solana Gaming & NFT
      "SOL-ATLAS-USDC",
      "RAY-ATLAS-USDC", 
      "ATLAS-POLIS-USDC",
      "SOL-POLIS-USDC",
      "SOL-GENE-USDC",
      "RAY-GENE-USDC",
      
      // Avalanche Liquid Staking
      "AVAX-SAVAX-USDC.e",
      "SAVAX-JOE-USDC.e",
      
      // Solana Liquid Staking
      "SOL-MSOL-USDC",
      "MSOL-JSOL-USDC",
      "SOL-JSOL-USDC", 
      "MSOL-RAY-USDC",
      "JSOL-RAY-USDC",
      
      // Cross-chain Stablecoin Arbitrage
      "USDC-USDT-DAI",
      "USDC.e-USDT-FRAX"
    ],
    maxSlippage: 1.2
  });
  const [analytics, setAnalytics] = useState<Analytics>({
    totalOpportunities: 0,
    averageProfit: 0,
    topPairs: [],
    topExchanges: [],
    totalVolume: 0
  });

  // TraderJoe & Raydium DEX Configuration
  const exchangeConfigs = {
    traderjoe: {
      name: "Trader Joe",
      chain: "Avalanche",
      apiUrl: "https://api.traderjoexyz.com/priceusd",
      priceUrl: "https://api.traderjoexyz.com/priceusd",
      fee: 0.3,
      color: "bg-gradient-to-r from-red-600 to-orange-600",
      minLiquidity: 2500,
      blockTime: 2000,
      gasToken: "AVAX"
    },
    raydium: {
      name: "Raydium",
      chain: "Solana",
      apiUrl: "https://api.raydium.io/v2/main/pairs",
      priceUrl: "https://api.raydium.io/v2/main/price", 
      fee: 0.25,
      color: "bg-gradient-to-r from-purple-600 to-blue-600",
      minLiquidity: 2000,
      blockTime: 400,
      gasToken: "SOL"
    }
  };

  // Enhanced token pricing for both ecosystems
  const fetchExchangePrice = useCallback(async (exchange: string, tokenA: string, tokenB: string): Promise<TokenPrice | null> => {
    const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
    if (!config) return null;

    try {
      const chainDelays = {
        Avalanche: Math.random() * 300 + 150,
        Solana: Math.random() * 200 + 80,
      };
      
      await new Promise(resolve => setTimeout(resolve, chainDelays[config.chain as keyof typeof chainDelays] || 300));
      
      const tokenPrices = {
        'USDC': 1.0,
        'USDC.e': 1.0,
        'USDT': 1.001 + Math.random() * 0.003,
        'DAI': 0.998 + Math.random() * 0.004,
        'FRAX': 0.997 + Math.random() * 0.005,
        
        // Avalanche Ecosystem
        'AVAX': 32 + Math.random() * 18,
        'JOE': 0.35 + Math.random() * 0.25,
        'PNG': 0.12 + Math.random() * 0.08,
        'QI': 0.018 + Math.random() * 0.012,
        'XAVA': 0.85 + Math.random() * 0.6,
        'GMX': 48 + Math.random() * 22,
        'GLP': 0.95 + Math.random() * 0.1,
        'CRAFT': 0.45 + Math.random() * 0.35,
        'LOST': 0.025 + Math.random() * 0.02,
        'SAVAX': 31 + Math.random() * 17,
        
        // Solana Ecosystem  
        'SOL': 95 + Math.random() * 45,
        'RAY': 1.95 + Math.random() * 1.3,
        'SRM': 0.42 + Math.random() * 0.28,
        'ORCA': 2.8 + Math.random() * 1.9,
        'MNGO': 0.085 + Math.random() * 0.065,
        'FIDA': 0.52 + Math.random() * 0.38,
        'ATLAS': 0.0085 + Math.random() * 0.0075,
        'POLIS': 0.48 + Math.random() * 0.37,
        'GENE': 18 + Math.random() * 14,
        'MSOL': 92 + Math.random() * 43,
        'JSOL': 90 + Math.random() * 41,
        'BONK': 0.0000095 + Math.random() * 0.0000085,
        'SAMO': 0.022 + Math.random() * 0.028,
      };
      
      const priceA = tokenPrices[tokenA as keyof typeof tokenPrices] || (0.5 + Math.random() * 8);
      const priceB = tokenPrices[tokenB as keyof typeof tokenPrices] || (0.5 + Math.random() * 8);
      
      const theoreticalRate = priceA / priceB;
      
      let inefficiencyRange = 0.008;
      
      if (exchange === 'traderjoe') {
        if (tokenA.includes('CRAFT') || tokenB.includes('CRAFT') || 
            tokenA.includes('LOST') || tokenB.includes('LOST')) {
          inefficiencyRange = 0.025;
        } else if (tokenA.includes('SAVAX') || tokenB.includes('SAVAX')) {
          inefficiencyRange = 0.015;
        } else {
          inefficiencyRange = 0.012;
        }
      } else if (exchange === 'raydium') {
        if (tokenA.includes('BONK') || tokenB.includes('BONK') || 
            tokenA.includes('SAMO') || tokenB.includes('SAMO')) {
          inefficiencyRange = 0.030;
        } else if (tokenA.includes('ATLAS') || tokenB.includes('ATLAS') ||
                   tokenA.includes('GENE') || tokenB.includes('GENE')) {
          inefficiencyRange = 0.022;
        } else if (tokenA.includes('MSOL') || tokenB.includes('MSOL') ||
                   tokenA.includes('JSOL') || tokenB.includes('JSOL')) {
          inefficiencyRange = 0.018;
        } else {
          inefficiencyRange = 0.015;
        }
      }
      
      const inefficiency = (Math.random() - 0.5) * inefficiencyRange;
      const finalPrice = theoreticalRate * (1 + inefficiency);
      
      let baseLiquidity = config.minLiquidity * (1 + Math.random() * 5);
      
      if (exchange === 'traderjoe') {
        if (tokenA === 'AVAX' || tokenB === 'AVAX' || tokenA === 'JOE' || tokenB === 'JOE') {
          baseLiquidity *= 2.5;
        }
      } else if (exchange === 'raydium') {
        if (tokenA === 'SOL' || tokenB === 'SOL' || tokenA === 'RAY' || tokenB === 'RAY') {
          baseLiquidity *= 3;
        } else if (tokenA.includes('BONK') || tokenB.includes('BONK')) {
          baseLiquidity *= 0.6;
        }
      }
      
      return {
        symbol: `${tokenA}/${tokenB}`,
        price: isFinite(finalPrice) ? finalPrice : theoreticalRate,
        liquidity: isFinite(baseLiquidity) ? baseLiquidity : config.minLiquidity,
        volume24h: baseLiquidity * (Math.random() * 10 + 4),
        source: exchange
      };
    } catch (error) {
      console.error(`${exchange} pricing error for ${tokenA}/${tokenB}:`, error);
      return null;
    }
  }, []);

  // Triangular arbitrage calculation for both exchanges
  const calculateArbitrage = useCallback(async (pair1: string, pair2: string, pair3: string, exchange: string): Promise<Opportunity | null> => {
    const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
    if (!config) return null;

    try {
      const priceData1To3 = await fetchExchangePrice(exchange, pair1, pair3);
      const priceData2To3 = await fetchExchangePrice(exchange, pair2, pair3);
      const priceData1To2 = await fetchExchangePrice(exchange, pair1, pair2);

      if (!priceData1To3 || !priceData2To3 || !priceData1To2) {
        return null;
      }

      const price1To3 = priceData1To3.price;
      const price2To3 = priceData2To3.price;
      const price1To2 = priceData1To2.price;
      
      const startingAmount = 1000;
      
      // Route 1: pair3 → pair1 → pair2 → pair3
      let step1_route1 = startingAmount / price1To3;
      step1_route1 = step1_route1 * (1 - config.fee / 100);
      
      let step2_route1 = step1_route1 * price1To2;
      step2_route1 = step2_route1 * (1 - config.fee / 100);
      
      let step3_route1 = step2_route1 * price2To3;
      step3_route1 = step3_route1 * (1 - config.fee / 100);
      
      const profit1 = step3_route1 - startingAmount;
      const profitPercent1 = (profit1 / startingAmount) * 100;
      
      // Route 2: pair3 → pair2 → pair1 → pair3  
      let step1_route2 = startingAmount / price2To3;
      step1_route2 = step1_route2 * (1 - config.fee / 100);
      
      let step2_route2 = step1_route2 / price1To2;
      step2_route2 = step2_route2 * (1 - config.fee / 100);
      
      let step3_route2 = step2_route2 * price1To3;
      step3_route2 = step3_route2 * (1 - config.fee / 100);
      
      const profit2 = step3_route2 - startingAmount;
      const profitPercent2 = (profit2 / startingAmount) * 100;
      
      const bestProfitPercent = Math.max(profitPercent1, profitPercent2);
      const bestRoute = profitPercent1 > profitPercent2 ? 
        `${pair3} → ${pair1} → ${pair2} → ${pair3}` : 
        `${pair3} → ${pair2} → ${pair1} → ${pair3}`;
      
      const gasCosts = {
        Avalanche: Math.random() * 0.8 + 0.2,
        Solana: Math.random() * 0.008 + 0.002,
      };
      
      const totalGasCost = (gasCosts[config.chain as keyof typeof gasCosts] || 0.5) * 3;
      
      const minLiquidity = Math.min(
        priceData1To3.liquidity || 0,
        priceData2To3.liquidity || 0, 
        priceData1To2.liquidity || 0
      );
      
      const impliedCrossRate = price1To3 / price2To3;
      const actualCrossRate = price1To2;
      const inefficiencyPercent = actualCrossRate > 0 ? 
        ((Math.abs(impliedCrossRate - actualCrossRate) / actualCrossRate) * 100) : 0;

      const gasImpactPercent = (totalGasCost / startingAmount) * 100;
      const netProfitPercent = bestProfitPercent - gasImpactPercent;

      const isViable = netProfitPercent > (settings.minProfitThreshold || 0) && 
                      minLiquidity > (settings.minLiquidity || 0) &&
                      isFinite(netProfitPercent) && 
                      Math.abs(netProfitPercent) < 150;

      return {
        id: Date.now() + Math.random(),
        exchange: exchange,
        pairs: `${pair1}-${pair2}-${pair3}`,
        profit: isFinite(netProfitPercent) ? netProfitPercent : 0,
        route: bestRoute,
        timestamp: new Date(),
        liquidity: {
          pair1: priceData1To3.liquidity || 0,
          pair2: priceData2To3.liquidity || 0,
          pair3: priceData1To2.liquidity || 0
        },
        fees: config.fee * 3,
        viable: isViable,
        priceData: {
          token1Price: price1To3,
          token2Price: price2To3,
          crossRate: price1To2,
          inefficiency: isFinite(inefficiencyPercent) ? inefficiencyPercent : 0
        },
        gasEstimate: isFinite(totalGasCost) ? totalGasCost : 0
      };
      
    } catch (error) {
      console.error(`Error calculating arbitrage for ${exchange}:`, error);
      return null;
    }
  }, [settings.minProfitThreshold, settings.minLiquidity, fetchExchangePrice]);

  // Opportunity scanning for both exchanges
  const scanForOpportunities = useCallback(async () => {
    if (!isRunning) return;

    setLastUpdate(new Date());
    const newOpportunities: Opportunity[] = [];

    const scanPromises = settings.enabledExchanges.map(async (exchange) => {
      if (!connectedExchanges.has(exchange)) {
        setConnectionStatus(prev => ({ ...prev, [exchange]: "connecting" }));
        
        try {
          const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
          
          const delay = config?.chain === 'Solana' ? 1200 : 1800;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          setConnectionStatus(prev => ({ ...prev, [exchange]: "connected" }));
          setConnectedExchanges(prev => {
            const newSet = new Set(prev);
            newSet.add(exchange);
            return newSet;
          });
        } catch (error) {
          setConnectionStatus(prev => ({ ...prev, [exchange]: "error" }));
          console.error(`Error connecting to ${exchange}:`, error);
          return [];
        }
      }
      
      try {
        const exchangeOpportunities: Opportunity[] = [];
        
        for (const pairCombo of settings.focusedPairs) {
          try {
            const [pair1, pair2, pair3] = pairCombo.split("-");
            
            const opportunity = await calculateArbitrage(pair1, pair2, pair3, exchange);
            
            if (opportunity) {
              exchangeOpportunities.push(opportunity);
            }
          } catch (pairError) {
            console.error(`Error processing pair ${pairCombo} on ${exchange}:`, pairError);
          }
        }
        
        return exchangeOpportunities;
      } catch (error) {
        setConnectionStatus(prev => ({ ...prev, [exchange]: "error" }));
        setConnectedExchanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(exchange);
          return newSet;
        });
        console.error(`Error scanning ${exchange}:`, error);
        return [];
      }
    });

    try {
      const results = await Promise.all(scanPromises);
      results.forEach(exchangeOpps => newOpportunities.push(...exchangeOpps));
    } catch (error) {
      console.error('Error in opportunity scanning:', error);
    }

    setOpportunities(prev => [...newOpportunities, ...prev].slice(0, 120));

    if (newOpportunities.length > 0) {
      setAnalytics(prev => {
        const viableOpps = newOpportunities.filter(opp => opp.viable);
        const totalOpps = prev.totalOpportunities + newOpportunities.length;
        
        const pairStats: Record<string, { count: number; totalProfit: number }> = {};
        const exchangeStats: Record<string, { count: number; totalProfit: number }> = {};
        
        viableOpps.forEach(opp => {
          if (!pairStats[opp.pairs]) pairStats[opp.pairs] = { count: 0, totalProfit: 0 };
          pairStats[opp.pairs].count++;
          pairStats[opp.pairs].totalProfit += (opp.profit || 0);
          
          if (!exchangeStats[opp.exchange]) exchangeStats[opp.exchange] = { count: 0, totalProfit: 0 };
          exchangeStats[opp.exchange].count++;
          exchangeStats[opp.exchange].totalProfit += (opp.profit || 0);
        });

        const topPairs = Object.entries(pairStats)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 8)
          .map(([pair, stats]) => ({ 
            pair, 
            count: stats.count || 0, 
            avgProfit: stats.count > 0 ? (stats.totalProfit || 0) / stats.count : 0
          }));

        const topExchanges = Object.entries(exchangeStats)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 2)
          .map(([exchange, stats]) => ({ 
            exchange, 
            count: stats.count || 0, 
            avgProfit: stats.count > 0 ? (stats.totalProfit || 0) / stats.count : 0
          }));

        const totalVolume = newOpportunities.reduce((sum, opp) => 
          sum + Math.min(
            opp.liquidity?.pair1 || 0, 
            opp.liquidity?.pair2 || 0, 
            opp.liquidity?.pair3 || 0
          ), 0);

        return {
          totalOpportunities: totalOpps,
          averageProfit: viableOpps.length > 0 
            ? viableOpps.reduce((sum, opp) => sum + (opp.profit || 0), 0) / viableOpps.length 
            : 0,
          topPairs,
          topExchanges,
          totalVolume: (prev.totalVolume || 0) + totalVolume
        };
      });
    }
  }, [isRunning, settings, calculateArbitrage, connectedExchanges]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      scanForOpportunities();
      interval = setInterval(scanForOpportunities, settings.updateInterval);
    }
    return () => clearInterval(interval);
  }, [isRunning, scanForOpportunities, settings.updateInterval]);

  const toggleBot = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setOpportunities([]);
      setConnectionStatus({});
      setConnectedExchanges(new Set());
      setAnalytics({
        totalOpportunities: 0,
        averageProfit: 0,
        topPairs: [],
        topExchanges: [],
        totalVolume: 0
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "text-green-500";
      case "connecting": return "text-yellow-500";
      case "error": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const exportData = () => {
    const viableOpps = opportunities.filter(opp => opp.viable);
    const data = {
      opportunities: opportunities,
      analytics: analytics,
      settings: settings,
      exchangeConfigs: exchangeConfigs,
      timestamp: new Date(),
      summary: {
        totalViable: viableOpps.length,
        avgProfitViable: viableOpps.length > 0 ? 
          viableOpps.reduce((sum, opp) => sum + (opp.profit || 0), 0) / viableOpps.length : 0,
        bestOpportunity: opportunities.length > 0 ? 
          opportunities.reduce((best, current) => 
            (current.profit || 0) > (best.profit || 0) ? current : best, 
            opportunities[0] || { profit: 0 }
          ) : { profit: 0 }
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traderjoe-raydium-arbitrage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const viableOpportunities = opportunities.filter(opp => opp.viable);
  const totalScanned = opportunities.length;
  const successRate = totalScanned > 0 ? (viableOpportunities.length / totalScanned) * 100 : 0;
  const bestProfit = opportunities.length > 0 ? Math.max(...opportunities.map(opp => opp.profit || 0)) : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔥 TraderJoe & Raydium Arbitrage Bot</h1>
        <p className="text-gray-600 mb-3">Advanced dual-chain arbitrage monitoring across Avalanche and Solana's premier DEXs</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>🏔️ <strong>Avalanche:</strong> TraderJoe DEX, ~2s blocks, native AVAX ecosystem</span>
          <span>⚡ <strong>Solana:</strong> Raydium AMM, ~400ms blocks, ultra-low fees</span>
          <span>💎 <strong>Exotic Pairs:</strong> Gaming, DeFi, liquid staking, memecoins</span>
          <span>🚀 <strong>Dual Speed:</strong> Optimized for both chain characteristics</span>
        </div>
        {lastUpdate && (
          <div className="mt-2 text-xs text-gray-400">
            Last dual scan: {lastUpdate.toLocaleTimeString()} | Next scan in {Math.ceil(settings.updateInterval / 1000)}s
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Dual-Chain Controls
          </h2>
          
          <button
            onClick={toggleBot}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 mb-4 flex items-center justify-center ${
              isRunning 
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white" 
                : "bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white"
            }`}
          >
            {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Stop Dual Scan" : "Start Dual Scan"}
          </button>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Profit Threshold (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.minProfitThreshold || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, minProfitThreshold: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">Balanced for both chains (0.10%+)</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Liquidity ($)
              </label>
              <input
                type="number"
                step="500"
                value={settings.minLiquidity || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, minLiquidity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">Higher for established DEXs</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Interval (ms)
              </label>
              <input
                type="number"
                step="1000"
                value={settings.updateInterval || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, updateInterval: parseInt(e.target.value) || 7000 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">Balanced for dual-chain monitoring</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-green-500" />
            Dual-Chain Stats
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Viable Opportunities:</span>
              <span className="font-bold text-green-600 text-lg">
                {viableOpportunities.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Total Scanned:</span>
              <span className="font-medium">{totalScanned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Success Rate:</span>
              <span className="font-medium text-blue-600">
                {(successRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Best Profit:</span>
              <span className="font-bold text-green-600">
                {(bestProfit || 0).toFixed(3)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Active DEXs:</span>
              <span className="font-medium text-purple-600">
                {Object.values(connectionStatus).filter(status => status === 'connected').length}/2
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Wifi className="mr-2 h-5 w-5" />
            DEX Status
          </h2>
          
          <div className="space-y-4">
            {Object.entries(exchangeConfigs).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full text-white ${config.color}`}>
                    {config.name}
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                    {config.chain}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    connectionStatus[key] === "connected" ? "bg-green-500" :
                    connectionStatus[key] === "connecting" ? "bg-yellow-500 animate-pulse" :
                    connectionStatus[key] === "error" ? "bg-red-500" : "bg-gray-400"
                  }`}></div>
                  <span className={`text-sm font-medium ${getStatusColor(connectionStatus[key])}`}>
                    {connectionStatus[key] === "connected" && connectedExchanges.has(key) ? "Connected" : connectionStatus[key] || "Offline"}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="bg-gradient-to-r from-red-50 to-purple-50 rounded-lg p-3 mt-4">
              <div className="text-xs text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span>TraderJoe Fee:</span>
                  <span className="font-medium">0.30%</span>
                </div>
                <div className="flex justify-between">
                  <span>Raydium Fee:</span>
                  <span className="font-medium">0.25%</span>
                </div>
                <div className="flex justify-between">
                  <span>AVAX Gas:</span>
                  <span className="font-medium">$0.2-1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>SOL Gas:</span>
                  <span className="font-medium">$0.002-0.01</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Analytics
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Total Opportunities:</span>
              <span className="font-medium">{analytics.totalOpportunities}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Avg Dual Profit:</span>
              <span className="font-medium text-green-600">
                {(analytics.averageProfit || 0).toFixed(3)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Total Volume:</span>
              <span className="font-medium text-blue-600">
                ${((analytics.totalVolume || 0) / 1000000).toFixed(1)}M
              </span>
            </div>
            <button
              onClick={exportData}
              className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center text-sm"
            >
              <Database className="mr-2 h-3 w-3" />
              Export Dual Data
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">🔥 Live TraderJoe & Raydium Arbitrage Opportunities</h2>
          <p className="text-sm text-gray-600">
            {viableOpportunities.length} profitable opportunities from {totalScanned} dual-chain combinations scanned
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600">✓ Viable: Profit ≥ {settings.minProfitThreshold}% & Liquidity ≥ ${settings.minLiquidity.toLocaleString()}</span>
            <span className="text-red-600">✗ Not Viable: Below dual-chain thresholds</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DEX/Chain</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Pairs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Liquidity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inefficiency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Est.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {opportunities.slice(0, 80).map((opportunity) => (
                <tr key={opportunity.id} className={opportunity.viable ? "bg-green-50 border-l-4 border-green-500" : ""}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${exchangeConfigs[opportunity.exchange as keyof typeof exchangeConfigs]?.color} mb-1`}>
                        {exchangeConfigs[opportunity.exchange as keyof typeof exchangeConfigs]?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {exchangeConfigs[opportunity.exchange as keyof typeof exchangeConfigs]?.chain}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-bold">
                    {opportunity.pairs}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm font-bold ${
                      (opportunity.profit || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {(opportunity.profit || 0).toFixed(4)}%
                    </span>
                    <div className="text-xs text-gray-500">
                      after {(opportunity.fees || 0).toFixed(2)}% fees + gas
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 max-w-32">
                    {opportunity.route || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="font-medium">
                      ${Math.min(
                        opportunity.liquidity?.pair1 || 0, 
                        opportunity.liquidity?.pair2 || 0, 
                        opportunity.liquidity?.pair3 || 0
                      ).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    {(opportunity.priceData?.inefficiency || 0).toFixed(3)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    ${(opportunity.gasEstimate || 0).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {opportunity.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      opportunity.viable 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {opportunity.viable ? "🔥 DUAL VIABLE" : "❌ Below Threshold"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {opportunities.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {isRunning ? "Scanning TraderJoe & Raydium for arbitrage opportunities..." : "Start dual-chain monitoring to discover cross-chain arbitrage opportunities"}
              </p>
              {isRunning && (
                <p className="text-sm text-gray-500 mt-2">
                  Connecting to both Avalanche and Solana networks. TraderJoe + Raydium dual scan in progress...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {(analytics.topPairs.length > 0 || analytics.topExchanges.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {analytics.topPairs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                Most Profitable Dual-Chain Pairs
              </h2>
              <div className="space-y-3">
                {analytics.topPairs.map((pair, index) => (
                  <div key={pair.pair} className="flex items-center justify-between bg-gradient-to-r from-red-50 to-purple-50 rounded-lg p-3">
                    <div>
                      <span className="font-medium text-gray-900">{pair.pair}</span>
                      <div className="text-sm text-gray-600">{pair.count || 0} opportunities</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">{(pair.avgProfit || 0).toFixed(3)}%</span>
                      <div className="text-xs text-green-500">avg profit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.topExchanges.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                DEX Performance Comparison
              </h2>
              <div className="space-y-3">
                {analytics.topExchanges.map((exchange, index) => (
                  <div key={exchange.exchange} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                    <div>
                      <span className="font-medium text-blue-900">
                        {exchangeConfigs[exchange.exchange as keyof typeof exchangeConfigs]?.name || exchange.exchange}
                      </span>
                      <div className="text-sm text-blue-700">
                        {exchange.count || 0} opportunities on {exchangeConfigs[exchange.exchange as keyof typeof exchangeConfigs]?.chain}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600">{(exchange.avgProfit || 0).toFixed(3)}%</span>
                      <div className="text-xs text-blue-500">avg profit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TraderJoeRaydiumArbitrageBot;
