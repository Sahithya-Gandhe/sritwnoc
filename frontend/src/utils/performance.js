import { useEffect } from 'react';

// Performance monitoring utilities
const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would typically use web-vitals library in production
      console.log('Performance monitoring active');
    }

    // Monitor loading times
    const measurePageLoad = () => {
      if (performance.getEntriesByType && performance.getEntriesByType('navigation').length > 0) {
        const navTiming = performance.getEntriesByType('navigation')[0];
        const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
        
        console.log(`Page load time: ${loadTime}ms`);
        
        // Send to analytics if load time is slow
        if (loadTime > 3000) {
          console.warn('Slow page load detected:', loadTime);
        }
      }
    };

    // Measure after the page is fully loaded
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
    }

    return () => {
      window.removeEventListener('load', measurePageLoad);
    };
  }, []);

  return null; // This component doesn't render anything
};

// Memory usage monitoring
const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memoryInfo = performance.memory;
    console.log('Memory usage:', {
      used: `${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
    });
  }
};

// Performance optimization recommendations
const getOptimizationTips = () => {
  const tips = [];
  
  // Check if user has slow connection
  if (navigator.connection && navigator.connection.effectiveType === 'slow-2g' || navigator.connection.effectiveType === '2g') {
    tips.push('Slow connection detected - enabling data saver mode');
  }
  
  // Check device memory
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
    tips.push('Low memory device detected - reducing features');
  }
  
  return tips;
};

export { PerformanceMonitor, monitorMemoryUsage, getOptimizationTips };