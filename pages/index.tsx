import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';

// Dynamic import to avoid SSR issues with the Raydium arbitrage bot
const RaydiumArbitrageBot = dynamic(
  () => import('@/components/ArbitrageBot'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Raydium Arbitrage Bot...</p>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Raydium Arbitrage Bot - Real-time Solana Triangular Arbitrage Monitor</title>
        <meta 
          name="description" 
          content="Advanced monitoring of triangular arbitrage opportunities on Raydium DEX across exotic Solana token pairs. High-speed execution with ultra-low fees." 
        />
        <meta name="keywords" content="raydium, arbitrage, solana, DeFi, trading, exotic pairs, triangular arbitrage, AMM" />
        <meta name="author" content="Raydium Arbitrage Bot" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://raydium-arbitrage-bot.vercel.app/" />
        <meta property="og:title" content="Raydium Arbitrage Bot - Real-time Solana DEX Monitor" />
        <meta property="og:description" content="Monitor triangular arbitrage opportunities on Raydium DEX across exotic Solana token pairs." />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://raydium-arbitrage-bot.vercel.app/" />
        <meta property="twitter:title" content="Raydium Arbitrage Bot - Real-time Solana DEX Monitor" />
        <meta property="twitter:description" content="Monitor triangular arbitrage opportunities on Raydium DEX across exotic Solana token pairs." />
        <meta property="twitter:image" content="/twitter-image.png" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://api.raydium.io" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <RaydiumArbitrageBot />
      </main>

      {/* Vercel Analytics */}
      <Analytics />
    </>
  );
}