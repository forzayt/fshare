import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('[WakeLock] Screen Wake Lock is active');
          
          wakeLockRef.current.addEventListener('release', () => {
            console.log('[WakeLock] Screen Wake Lock was released');
          });
        }
      } catch (err: any) {
        console.error(`[WakeLock] Failed to acquire wake lock: ${err.name}, ${err.message}`);
      }
    };

    // Initial request
    requestWakeLock();

    // Re-acquire when page becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}
