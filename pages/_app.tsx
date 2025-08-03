import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Performance monitoring
    if (typeof window !== 'undefined') {
      // Log page load performance
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
      });

      // Handle errors globally
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // Could integrate with error tracking service like Sentry here
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // Could integrate with error tracking service like Sentry here
      });
    }
  }, []);

  return (
    <>
      {/* Global app wrapper with error boundary equivalent */}
      <div id="app-root" className="min-h-screen">
        <Component {...pageProps} />
      </div>

      {/* Global styles and scripts can be added here */}
      <style jsx global>{`
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Focus styles for accessibility */
        *:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Custom selection colors */
        ::selection {
          background-color: #3b82f6;
          color: white;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}