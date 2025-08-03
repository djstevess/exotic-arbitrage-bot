import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database?: 'connected' | 'disconnected' | 'not_configured';
    redis?: 'connected' | 'disconnected' | 'not_configured';
    external_apis?: {
      [key: string]: 'healthy' | 'degraded' | 'down';
    };
  };
  performance: {
    memory_usage: number;
    memory_total: number;
    memory_percentage: number;
  };
  arbitrage_metrics?: {
    total_opportunities_found: number;
    viable_opportunities: number;
    success_rate: number;
    avg_profit_percentage: number;
    active_chains: number;
  };
}

// Simulate checking external DEX APIs
const checkExternalAPIs = async () => {
  const apis = {
    raydium: 'https://api.raydium.io/v2/main/price',
    traderjoe: 'https://api.traderjoexyz.com/priceusd',
    osmosis: 'https://api-osmosis.imperator.co/tokens/v2/all',
    pancakeswap: 'https://api.pancakeswap.info/api/v2/tokens/prices',
  };

  const results: { [key: string]: 'healthy' | 'degraded' | 'down' } = {};

  for (const [name, url] of Object.entries(apis)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to avoid downloading data
        signal: controller.signal,
        headers: {
          'User-Agent': 'Exotic-Arbitrage-Bot/1.0 (Health Check)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        results[name] = 'healthy';
      } else if (response.status >= 400 && response.status < 500) {
        results[name] = 'degraded';
      } else {
        results[name] = 'down';
      }
    } catch (error) {
      results[name] = 'down';
    }
  }

  return results;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {},
      performance: {
        memory_usage: 0,
        memory_total: 0,
        memory_percentage: 0,
      },
    });
    return;
  }

  try {
    const startTime = Date.now();

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Check external APIs (with timeout)
    const externalAPIs = await Promise.race([
      checkExternalAPIs(),
      new Promise<{ [key: string]: 'healthy' | 'degraded' | 'down' }>((resolve) =>
        setTimeout(() => resolve({}), 8000)
      ),
    ]);

    // Determine overall health status
    const externalApiStatuses = Object.values(externalAPIs);
    const healthyApis = externalApiStatuses.filter(status => status === 'healthy').length;
    const totalApis = externalApiStatuses.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (memoryPercentage > 90) {
      overallStatus = 'unhealthy';
    } else if (memoryPercentage > 75 || (totalApis > 0 && healthyApis / totalApis < 0.5)) {
      overallStatus = 'degraded';
    } else if (totalApis > 0 && healthyApis / totalApis < 0.8) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: process.env.DATABASE_URL ? 'not_configured' : 'not_configured',
        redis: process.env.REDIS_URL ? 'not_configured' : 'not_configured',
        external_apis: externalAPIs,
      },
      performance: {
        memory_usage: Math.round(usedMemory / 1024 / 1024), // MB
        memory_total: Math.round(totalMemory / 1024 / 1024), // MB
        memory_percentage: Math.round(memoryPercentage * 100) / 100,
      },
      arbitrage_metrics: {
        total_opportunities_found: 0, // These would come from your app state/database
        viable_opportunities: 0,
        success_rate: 0,
        avg_profit_percentage: 0,
        active_chains: Object.keys(externalAPIs).length,
      },
    };

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    // Add response time header
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    
    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        external_apis: {},
      },
      performance: {
        memory_usage: 0,
        memory_total: 0,
        memory_percentage: 0,
      },
    };

    res.status(503).json(errorStatus);
  }
}