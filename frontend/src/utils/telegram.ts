// Telegram WebApp SDK helpers

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        ready: () => void;
        expand: () => void;
        close: () => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export const getTelegramWebApp = () => {
  return window.Telegram?.WebApp;
};

export const isInsideTelegram = (): boolean => {
  return Boolean(window.Telegram?.WebApp?.initData);
};

export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    try {
      tg.expand();
    } catch {
      // Ignored if unsupported
    }
  }
};

export const triggerHaptic = (type: 'impact' | 'success' | 'warning' | 'selection' = 'impact') => {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (type === 'impact') {
      tg.HapticFeedback.impactOccurred('medium');
    } else if (type === 'success') {
      tg.HapticFeedback.notificationOccurred('success');
    } else if (type === 'warning') {
      tg.HapticFeedback.notificationOccurred('warning');
    } else if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    }
  } catch {
    // Graceful fallback for non-mobile environments
  }
};
