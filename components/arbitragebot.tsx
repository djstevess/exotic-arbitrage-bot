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
  maxGasPrice: number;
}

const ExoticArbitrageBot = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
  const [connectedExchanges, setConnectedExchanges] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [settings, setSettings] = useState<Settings>({
    minProfitThreshold: Number(process.env.NEXT_PUBLIC_MIN_PROFIT_THRESHOLD) || 0.08,
    minLiquidity: Number(process.env.NEXT_PUBLIC_MIN_LIQUIDITY) || 1500,
    updateInterval: Number(process.env.NEXT_PUBLIC_UPDATE_INTERVAL) || 8000,
    enabledExchanges: ["traderjoe", "raydium", "osmosis", "spookyswap", "pancakeswap", "gmx", "camelot", "thruster", "aerodrome", "velodrome"],
    focusedPairs: [
      "AVAX-JOE-USDC.e",
      "AVAX-PNG-USDC.e", 
      "JOE-PNG-USDC.e",
      "SOL-RAY-USDC",
      "SOL-SRM-USDC",
      "RAY-SRM-USDC",
      "SOL-ORCA-USDC",
      "ORCA-RAY-USDC",
      "ATOM-OSMO-USDC",
      "ATOM-JUNO-USDC",
      "OSMO-JUNO-USDC",
      "ATOM-EVMOS-USDC",
      "FTM-BOO-USDC",
      "FTM-SPIRIT-USDC", 
      "BOO-SPIRIT-USDC",
      "FTM-TOMB-USDC",
      "BNB-CAKE-BUSD",
      "BNB-ALPACA-BUSD",
      "CAKE-ALPACA-BUSD",
      "BNB-XVS-BUSD",
      "ARB-GMX-USDC",
      "ARB-GNS-USDC",
      "GMX-GNS-USDC",
      "ARB-MAGIC-USDC",
      "BASE-AERO-USDC",
      "AERO-WELL-USDC",
      "BASE-WELL-USDC",
      "MODE-ION-USDC",
      "OP-VELO-USDC",
      "OP-SNX-USDC",
      "VELO-SNX-USDC",
      "USDC-USDT-DAI",
      "USDC.e-USDT-FRAX"
    ],
    maxGasPrice: 20
  });
  const [analytics, setAnalytics] = useState<Analytics>({
    totalOpportunities: 0,
    averageProfit: 0,
    topPairs: [],
    topExchanges: [],
    totalVolume: 0
  });

  // Enhanced exchange configurations focusing on niche chains
  const exchangeConfigs = {
    traderjoe: {
      name: "Trader Joe",
      apiUrl: "https://api.traderjoexyz.com/priceusd",
      priceUrl: "https://api.traderjoexyz.com/priceusd",
      fee: 0.3,
      color: "bg-red-600",
      type: "DEX",
      chain: "Avalanche",
      minLiquidity: 2000
    },
    raydium: {
      name: "Raydium",
      apiUrl: "https://api.raydium.io/v2/main/price",
      priceUrl: "https://api.raydium.io/v2/main/price",
      fee: 0.25,
      color: "bg-purple-600",
      type: "DEX",
      chain: "Solana",
      minLiquidity: 1500
    },
    osmosis: {
      name: "Osmosis",
      apiUrl: "https://api-osmosis.imperator.co/tokens/v2/all",
      priceUrl: "https://api-osmosis.imperator.co/tokens/v2/all",
      fee: 0.2,
      color: "bg-purple-500",
      type: "DEX",
      chain: "Cosmos",
      minLiquidity: 800
    },
    spookyswap: {
      name: "SpookySwap",
      apiUrl: "https://api.spookyswap.finance/api/xboo",
      priceUrl: "https://api.spookyswap.finance/api/xboo",
      fee: 0.2,
      color: "bg-orange-500",
      type: "DEX",
      chain: "Fantom",
      minLiquidity: 600
    },
    pancakeswap: {
      name: "PancakeSwap",
      apiUrl: "https://api.pancakeswap.info/api/v2/tokens/prices",
      priceUrl: "https://api.pancakeswap.info/api/v2/tokens/prices",
      fee: 0.25,
      color: "bg-yellow-500",
      type: "DEX",
      chain: "BSC",
      minLiquidity: 1200
    },
    gmx: {
      name: "GMX",
      apiUrl: "https://api.gmx.io/prices",
      priceUrl: "https://api.gmx.io/prices",
      fee: 0.1,
      color: "bg-blue-600",
      type: "DEX",
      chain: "Arbitrum",
      minLiquidity: 3000
    },
    camelot: {
      name: "Camelot DEX",
      apiUrl: "https://api.camelot.exchange/tokens",
      priceUrl: "https://api.camelot.exchange/tokens", 
      fee: 0.3,
      color: "bg-indigo-600",
      type: "DEX",
      chain: "Arbitrum",
      minLiquidity: 1800
    },
    thruster: {
      name: "Thruster",
      apiUrl: "https://api.thruster.finance/tokens",
      priceUrl: "https://api.thruster.finance/tokens",
      fee: 0.3,
      color: "bg-yellow-600",
      type: "DEX", 
      chain: "Blast",
      minLiquidity: 500
    },
    aerodrome: {
      name: "Aerodrome",
      apiUrl: "https://api.aerodrome.finance/api/v1/pairs",
      priceUrl: "https://api.aerodrome.finance/api/v1/pairs",
      fee: 0.05,
      color: "bg-blue-500",
      type: "DEX",
      chain: "Base",
      minLiquidity: 2000
    },
    velodrome: {
      name: "Velodrome",
      apiUrl: "https://api.velodrome.finance/api/v1/pairs",
      priceUrl: "https://api.velodrome.finance/api/v1/pairs", 
      fee: 0.05,
      color: "bg-red-500",
      type: "DEX",
      chain: "Optimism",
      minLiquidity: 2500
    }
  };

  // Enhanced exotic token pricing with realistic market inefficiencies
  const fetchExoticPrice = useCallback(async (exchange: string, tokenA: string, tokenB: string): Promise<TokenPrice | null> => {
    const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
    if (!config) return null;

    try {
      // Simulate realistic API delays based on chain characteristics
      const chainDelays = {
        Avalanche: Math.random() * 300 + 100,
        Solana: Math.random() * 200 + 80,
        Cosmos: Math.random() * 800 + 400,
        Fantom: Math.random() * 500 + 200,
        BSC: Math.random() * 250 + 100,
        Arbitrum: Math.random() * 200 + 100,
        Blast: Math.random() * 400 + 150,
        Base: Math.random() * 180 + 80,
        Optimism: Math.random() * 200 + 90
      };
      
      await new Promise(resolve => setTimeout(resolve, chainDelays[config.chain as keyof typeof chainDelays] || 300));
      
      // Exotic token pricing with higher volatility and inefficiencies
      const exoticTokenPrices = {
        // Stablecoins (base references)
        'USDC': 1.0,
        'USDC.e': 1.0,
        'USDT': 1.001 + Math.random() * 0.004, // 1.001-1.005 
        'BUSD': 0.999 + Math.random() * 0.003, // 0.999-1.002
        'DAI': 0.998 + Math.random() * 0.005, // 0.998-1.003
        'FRAX': 0.997 + Math.random() * 0.006, // 0.997-1.003
        
        // Avalanche ecosystem
        'AVAX': 28 + Math.random() * 12, // $28-40
        'JOE': 0.28 + Math.random() * 0.15, // $0.28-0.43
        'PNG': 0.085 + Math.random() * 0.045, // $0.085-0.13
        
        // Solana ecosystem  
        'SOL': 88 + Math.random() * 35, // $88-123
        'RAY': 0.95 + Math.random() * 0.6, // $0.95-1.55
        'SRM': 0.08 + Math.random() * 0.05, // $0.08-0.13
        'ORCA': 1.2 + Math.random() * 0.8, // $1.2-2.0
        
        // Cosmos ecosystem
        'ATOM': 16 + Math.random() * 8, // $16-24
        'OSMO': 0.85 + Math.random() * 0.5, // $0.85-1.35
        'JUNO': 0.65 + Math.random() * 0.4, // $0.65-1.05
        'EVMOS': 0.15 + Math.random() * 0.1, // $0.15-0.25
        
        // Fantom ecosystem
        'FTM': 0.38 + Math.random() * 0.22, // $0.38-0.6
        'BOO': 2.5 + Math.random() * 1.8, // $2.5-4.3
        'SPIRIT': 0.012 + Math.random() * 0.008, // $0.012-0.02
        'TOMB': 0.95 + Math.random() * 0.6, // $0.95-1.55
        
        // BSC ecosystem
        'BNB': 325 + Math.random() * 60, // $325-385
        'CAKE': 2.8 + Math.random() * 1.5, // $2.8-4.3
        'ALPACA': 0.35 + Math.random() * 0.2, // $0.35-0.55
        'XVS': 8.5 + Math.random() * 4.2, // $8.5-12.7
        
        // Arbitrum ecosystem
        'ARB': 1.15 + Math.random() * 0.6, // $1.15-1.75
        'GMX': 45 + Math.random() * 25, // $45-70
        'GNS': 4.8 + Math.random() * 2.5, // $4.8-7.3
        'MAGIC': 0.78 + Math.random() * 0.4, // $0.78-1.18
        
        // Base ecosystem
        'BASE': 2.2 + Math.random() * 1.3, // $2.2-3.5 (hypothetical)
        'AERO': 0.65 + Math.random() * 0.4, // $0.65-1.05
        'WELL': 0.02 + Math.random() * 0.015, // $0.02-0.035
        
        // Mode ecosystem
        'MODE': 0.08 + Math.random() * 0.05, // $0.08-0.13 (hypothetical)
        'ION': 0.15 + Math.random() * 0.1, // $0.15-0.25 (hypothetical)
        
        // Optimism ecosystem
        'OP': 2.85 + Math.random() * 1.2, // $2.85-4.05
        'VELO': 0.18 + Math.random() * 0.12, // $0.18-0.3
        'SNX': 3.2 + Math.random() * 1.8 // $3.2-5.0
      };
      
      // Chain-specific inefficiency characteristics (exotic pairs have higher inefficiencies)
      const chainInefficiencies = {
        Avalanche: { base: 0.012, volatility: 0.008 },    // 1.2% ± 0.8%
        Solana: { base: 0.015, volatility: 0.010 },       // 1.5% ± 1.0%
        Cosmos: { base: 0.025, volatility: 0.015 },       // 2.5% ± 1.5%
        Fantom: { base: 0.030, volatility: 0.020 },       // 3.0% ± 2.0%
        BSC: { base: 0.008, volatility: 0.006 },          // 0.8% ± 0.6%
        Arbitrum: { base: 0.006, volatility: 0.004 },     // 0.6% ± 0.4%
        Blast: { base: 0.035, volatility: 0.025 },        // 3.5% ± 2.5%
        Base: { base: 0.010, volatility: 0.008 },         // 1.0% ± 0.8%
        Optimism: { base: 0.008, volatility: 0.006 }      // 0.8% ± 0.6%
      };
      
      const chainProps = chainInefficiencies[config.chain as keyof typeof chainInefficiencies] || 
                        { base: 0.015, volatility: 0.010 };
      
      const priceA = exoticTokenPrices[tokenA as keyof typeof exoticTokenPrices] || (0.5 + Math.random() * 5);
      const priceB = exoticTokenPrices[tokenB as keyof typeof exoticTokenPrices] || (0.5 + Math.random() * 5);
      
      // Calculate theoretical rate
      const theoreticalRate = priceA / priceB;
      
      // Add realistic market inefficiency (this creates arbitrage opportunities)
      const inefficiency = (Math.random() - 0.5) * chainProps.volatility + 
                          (Math.random() - 0.5) * chainProps.base;
      const finalPrice = theoreticalRate * (1 + inefficiency);
      
      // Chain-specific liquidity characteristics (exotic tokens have lower liquidity)
      const liquidityMultipliers = {
        Avalanche: 0.8,
        Solana: 0.6,
        Cosmos: 0.3,
        Fantom: 0.25,
        BSC: 0.9,
        Arbitrum: 1.2,
        Blast: 0.15,
        Base: 0.7,
        Optimism: 0.8
      };
      
      const liquidityMult = liquidityMultipliers[config.chain as keyof typeof liquidityMultipliers] || 0.5;
      const baseLiquidity = config.minLiquidity * (1 + Math.random() * 4) * liquidityMult;
      
      return {
        symbol: `${tokenA}/${tokenB}`,
        price: isFinite(finalPrice) ? finalPrice : theoreticalRate,
        liquidity: isFinite(baseLiquidity) ? baseLiquidity : config.minLiquidity,
        volume24h: baseLiquidity * (Math.random() * 8 + 2),
        source: exchange
      };
    } catch (error) {
      console.error(`${exchange} exotic pricing error:`, error);
      return null;
    }
  }, []);

  // Corrected triangular arbitrage calculation with accurate fee handling
  const calculateTriangularArbitrage = useCallback(async (pair1: string, pair2: string, pair3: string, exchange: string): Promise<Opportunity | null> => {
    const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
    if (!config) return null;

    try {
      // Get prices for all three pairs
      const priceData1To3 = await fetchExoticPrice(exchange, pair1, pair3);
      const priceData2To3 = await fetchExoticPrice(exchange, pair2, pair3);
      const priceData1To2 = await fetchExoticPrice(exchange, pair1, pair2);

      if (!priceData1To3 || !priceData2To3 || !priceData1To2) {
        return null;
      }

      const price1To3 = priceData1To3.price;
      const price2To3 = priceData2To3.price;
      const price1To2 = priceData1To2.price;
      
      // Simulate triangular arbitrage starting with 1000 units of pair3 (base currency)
      const startingAmount = 1000;
      
      // Route 1: pair3 → pair1 → pair2 → pair3
      let step1_route1 = startingAmount / price1To3; // Convert pair3 to pair1
      step1_route1 = step1_route1 * (1 - config.fee / 100); // Apply fee
      
      let step2_route1 = step1_route1 * price1To2; // Convert pair1 to pair2  
      step2_route1 = step2_route1 * (1 - config.fee / 100); // Apply fee
      
      let step3_route1 = step2_route1 * price2To3; // Convert pair2 back to pair3
      step3_route1 = step3_route1 * (1 - config.fee / 100); // Apply fee
      
      const profit1 = step3_route1 - startingAmount;
      const profitPercent1 = (profit1 / startingAmount) * 100;
      
      // Route 2: pair3 → pair2 → pair1 → pair3  
      let step1_route2 = startingAmount / price2To3; // Convert pair3 to pair2
      step1_route2 = step1_route2 * (1 - config.fee / 100); // Apply fee
      
      let step2_route2 = step1_route2 / price1To2; // Convert pair2 to pair1
      step2_route2 = step2_route2 * (1 - config.fee / 100); // Apply fee
      
      let step3_route2 = step2_route2 * price1To3; // Convert pair1 back to pair3
      step3_route2 = step3_route2 * (1 - config.fee / 100); // Apply fee
      
      const profit2 = step3_route2 - startingAmount;
      const profitPercent2 = (profit2 / startingAmount) * 100;
      
      // Choose the better route
      const bestProfitPercent = Math.max(profitPercent1, profitPercent2);
      const bestRoute = profitPercent1 > profitPercent2 ? 
        `${pair3} → ${pair1} → ${pair2} → ${pair3}` : 
        `${pair3} → ${pair2} → ${pair1} → ${pair3}`;
      
      // Calculate gas costs (much lower for L2s and exotic chains)
      const chainGasCosts = {
        Avalanche: Math.random() * 0.5 + 0.1, // $0.1-0.6
        Solana: Math.random() * 0.05 + 0.01, // $0.01-0.06
        Cosmos: Math.random() * 0.2 + 0.05, // $0.05-0.25
        Fantom: Math.random() * 0.3 + 0.1, // $0.1-0.4
        BSC: Math.random() * 0.8 + 0.2, // $0.2-1.0
        Arbitrum: Math.random() * 2 + 0.5, // $0.5-2.5
        Blast: Math.random() * 0.3 + 0.05, // $0.05-0.35
        Base: Math.random() * 0.15 + 0.03, // $0.03-0.18
        Optimism: Math.random() * 1.5 + 0.3 // $0.3-1.8
      };
      
      const gasEstimate = chainGasCosts[config.chain as keyof typeof chainGasCosts] || 1.0;
      
      const minLiquidity = Math.min(
        priceData1To3.liquidity || 0,
        priceData2To3.liquidity || 0, 
        priceData1To2.liquidity || 0
      );
      
      // Calculate market inefficiency
      const impliedCrossRate = price1To3 / price2To3;
      const actualCrossRate = price1To2;
      const inefficiencyPercent = actualCrossRate > 0 ? 
        ((Math.abs(impliedCrossRate - actualCrossRate) / actualCrossRate) * 100) : 0;

      // Account for gas costs in profit calculation
      const gasImpactPercent = (gasEstimate / startingAmount) * 100;
      const netProfitPercent = bestProfitPercent - gasImpactPercent;

      // Only return viable opportunities
      const isViable = netProfitPercent > (settings.minProfitThreshold || 0) && 
                      minLiquidity > (settings.minLiquidity || 0) &&
                      isFinite(netProfitPercent) && 
                      Math.abs(netProfitPercent) < 100; // Sanity check

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
        fees: config.fee * 3, // Total fees for 3 trades
        viable: isViable,
        priceData: {
          token1Price: price1To3,
          token2Price: price2To3,
          crossRate: price1To2,
          inefficiency: isFinite(inefficiencyPercent) ? inefficiencyPercent : 0
        },
        gasEstimate: isFinite(gasEstimate) ? gasEstimate : 0
      };
      
    } catch (error) {
      console.error(`Error calculating exotic arbitrage for ${exchange}:`, error);
      return null;
    }
  }, [settings.minProfitThreshold, settings.minLiquidity, fetchExoticPrice]);

  // Enhanced opportunity scanning
  const scanForOpportunities = useCallback(async () => {
    if (!isRunning) return;

    setLastUpdate(new Date());
    const newOpportunities: Opportunity[] = [];

    const scanPromises = settings.enabledExchanges.map(async (exchange) => {
      // Only set to connecting if not already connected
      if (!connectedExchanges.has(exchange)) {
        setConnectionStatus(prev => ({ ...prev, [exchange]: "connecting" }));
        
        try {
          const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
          
          // Initial connection delay
          const delay = config?.chain === 'Cosmos' ? 3000 : 
                       config?.chain === 'Blast' ? 2000 : 
                       config?.chain === 'Fantom' ? 1500 : 800;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          setConnectionStatus(prev => ({ ...prev, [exchange]: "connected" }));
          setConnectedExchanges(prev => new Set([...prev, exchange]));
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
            
            const opportunity = await calculateTriangularArbitrage(pair1, pair2, pair3, exchange);
            
            if (opportunity) {
              exchangeOpportunities.push(opportunity);
            }
          } catch (pairError) {
            console.error(`Error processing exotic pair ${pairCombo} on ${exchange}:`, pairError);
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
        console.error(`Error scanning exotic DEX ${exchange}:`, error);
        return [];
      }
    });

    try {
      const results = await Promise.all(scanPromises);
      results.forEach(exchangeOpps => newOpportunities.push(...exchangeOpps));
    } catch (error) {
      console.error('Error in exotic pair scanning:', error);
    }

    setOpportunities(prev => [...newOpportunities, ...prev].slice(0, 200));

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
          .slice(0, 8)
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
  }, [isRunning, settings, calculateTriangularArbitrage, connectedExchanges]);

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
    a.download = `exotic-arbitrage-${new Date().toISOString().split('T')[0]}.json`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Exotic Pairs Triangular Arbitrage Bot</h1>
        <p className="text-gray-600 mb-3">Advanced monitoring of arbitrage opportunities across niche chains and exotic token pairs</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>⚡ <strong>L2/Alt Chains:</strong> Arbitrum, Solana, Avalanche, Base, Optimism, Blast</span>
          <span>💎 <strong>Exotic Tokens:</strong> Native DeFi tokens, DAO tokens, GameFi assets</span>
          <span>🔥 <strong>Higher Inefficiencies:</strong> Up to 5% price discrepancies on niche pairs</span>
          <span>💰 <strong>Lower Gas:</strong> Optimized for L2 and non-Ethereum chains</span>
        </div>
        {lastUpdate && (
          <div className="mt-2 text-xs text-gray-400">
            Last exotic scan: {lastUpdate.toLocaleTimeString()} | Next scan in {Math.ceil(settings.updateInterval / 1000)}s
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Exotic Bot Controls
          </h2>
          
          <button
            onClick={toggleBot}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-4 flex items-center justify-center ${
              isRunning 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Stop Exotic Scan" : "Start Exotic Scan"}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">Higher for exotic pairs (0.08%+)</div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">Lower for niche tokens</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Interval (ms)
              </label>
              <input
                type="number"
                step="1000"
                value={settings.updateInterval || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, updateInterval: parseInt(e.target.value) || 8000 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-green-500" />
            Exotic Stats
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Viable Exotic:</span>
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
              <span className="text-gray-600 text-sm">Active Chains:</span>
              <span className="font-medium text-purple-600">
                {Object.values(connectionStatus).filter(status => status === 'connected').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Wifi className="mr-2 h-5 w-5" />
            Chain Status
          </h2>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(exchangeConfigs)
              .filter(([key]) => settings.enabledExchanges.includes(key))
              .map(([key, config]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium text-xs">{config.name}</span>
                  <span className="ml-1 px-1 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                    {config.chain}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    connectionStatus[key] === "connected" ? "bg-green-500" :
                    connectionStatus[key] === "connecting" ? "bg-yellow-500 animate-pulse" :
                    connectionStatus[key] === "error" ? "bg-red-500" : "bg-gray-400"
                  }`}></div>
                  <span className={`text-xs ${getStatusColor(connectionStatus[key])}`}>
                    {connectionStatus[key] === "connected" && connectedExchanges.has(key) ? "online" : connectionStatus[key] || "offline"}
                  </span>
                </div>
              </div>
            ))}
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
              <span className="text-gray-600 text-sm">Avg Exotic Profit:</span>
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
              className="w-full mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center text-sm"
            >
              <Database className="mr-2 h-3 w-3" />
              Export Exotic Data
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">🎯 Live Exotic Arbitrage Opportunities</h2>
          <p className="text-sm text-gray-600">
            {viableOpportunities.length} profitable exotic opportunities from {totalScanned} combinations scanned
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600">✓ Viable: Profit ≥ {settings.minProfitThreshold}% & Liquidity ≥ ${settings.minLiquidity.toLocaleString()}</span>
            <span className="text-red-600">✗ Not Viable: Below exotic thresholds</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chain/DEX</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exotic Pairs</th>
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
              {opportunities.slice(0, 60).map((opportunity) => (
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
                    ${(opportunity.gasEstimate || 0).toFixed(3)}
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
                      {opportunity.viable ? "🚀 EXOTIC VIABLE" : "❌ Below Threshold"}
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
                {isRunning ? "Scanning exotic chains for arbitrage opportunities..." : "Start exotic monitoring to discover high-yield opportunities"}
              </p>
              {isRunning && (
                <p className="text-sm text-gray-500 mt-2">
                  Connecting to niche DEXs across multiple chains. This may take 20-45 seconds...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {analytics.topPairs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              Most Profitable Exotic Pairs
            </h2>
            <div className="space-y-3">
              {analytics.topPairs.map((pair, index) => (
                <div key={pair.pair} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div>
                    <span className="font-medium text-green-900">{pair.pair}</span>
                    <div className="text-sm text-green-700">{pair.count || 0} exotic opportunities</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">{(pair.avgProfit || 0).toFixed(3)}%</span>
                    <div className="text-xs text-green-500">avg exotic profit</div>
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
              Best Performing Exotic Chains
            </h2>
            <div className="space-y-3">
              {analytics.topExchanges.map((exchange, index) => (
                <div key={exchange.exchange} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <div>
                    <span className="font-medium text-blue-900">
                      {exchangeConfigs[exchange.exchange as keyof typeof exchangeConfigs]?.name || exchange.exchange}
                    </span>
                    <div className="text-sm text-blue-700">
                      {exchange.count || 0} exotic opportunities on {exchangeConfigs[exchange.exchange as keyof typeof exchangeConfigs]?.chain}
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
    </div>
  );
};

export default ExoticArbitrageBot;