/**
 * Local Browser Notifications and Mobile Haptic Vibrate controller for PaintOps.
 * Alerts referees at 60s, 30s, and 0s even if the tab is in background or screen is partially locked.
 */

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

const TACTICAL_ICON_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ff5e00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`;

class TacticalNotificationManager {
  private inAppToastListeners: Array<(message: { title: string; body: string; type: 'warning' | 'urgent' | 'danger' }) => void> = [];

  /**
   * Check current browser permission status
   */
  public getPermissionStatus(): NotificationPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Request permission from user
   */
  public async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.sendNotification('🎯 PaintOps: Notificações Ativadas', {
          body: 'Você receberá alertas sonoros e táteis do cronômetro aos 60s, 30s e término de round.',
          tag: 'paintops-welcome',
        });
      }
      return result as NotificationPermissionStatus;
    } catch {
      // In some sandboxed iframes or browsers, requestPermission may reject or fail
      return this.getPermissionStatus();
    }
  }

  /**
   * Subscribe to in-app toast alerts
   */
  public onInAppToast(listener: (message: { title: string; body: string; type: 'warning' | 'urgent' | 'danger' }) => void) {
    this.inAppToastListeners.push(listener);
    return () => {
      this.inAppToastListeners = this.inAppToastListeners.filter((l) => l !== listener);
    };
  }

  private dispatchInAppToast(title: string, body: string, type: 'warning' | 'urgent' | 'danger') {
    this.inAppToastListeners.forEach((listener) => {
      try {
        listener({ title, body, type });
      } catch {
        // ignore
      }
    });
  }

  /**
   * Send local browser notification + mobile vibration
   */
  public sendNotification(title: string, options: NotificationOptions & { toastType?: 'warning' | 'urgent' | 'danger' } = {}) {
    const { toastType = 'warning', ...notifOptions } = options;

    // 1. In-app floating toast (always available inside the app)
    this.dispatchInAppToast(title, notifOptions.body || '', toastType);

    // 2. Mobile Haptic Vibration (if supported by device)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (toastType === 'danger') {
          navigator.vibrate([300, 150, 300, 150, 500]); // Long urgent vibration on round end
        } else if (toastType === 'urgent') {
          navigator.vibrate([200, 100, 200]); // 30s alert
        } else {
          navigator.vibrate([150, 80, 150]); // 60s alert
        }
      } catch {
        // ignore
      }
    }

    // 3. System Native Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notificationOptions: NotificationOptions & { renotify?: boolean } = {
            icon: TACTICAL_ICON_SVG,
            badge: TACTICAL_ICON_SVG,
            tag: 'paintops-match-timer',
            renotify: true,
            requireInteraction: toastType === 'danger',
            ...notifOptions,
          };
          const notification = new Notification(title, notificationOptions as NotificationOptions);

          // Auto close after 6 seconds unless danger (0s end of round)
          if (toastType !== 'danger') {
            setTimeout(() => {
              try {
                notification.close();
              } catch {
                // ignore
              }
            }, 6000);
          }

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch {
          // Fallback if browser prevents Notification constructor in current context
        }
      }
    }
  }

  /**
   * Alert at 60 seconds
   */
  public notify60Seconds(scenarioName: string = 'Missão') {
    this.sendNotification('⚠️ PaintOps: 60 Segundos Restantes!', {
      body: `${scenarioName}: Atenção, 1 minuto final para conclusão do combate!`,
      toastType: 'warning',
    });
  }

  /**
   * Alert at 30 seconds
   */
  public notify30Seconds(scenarioName: string = 'Missão') {
    this.sendNotification('🚨 PaintOps: 30 Segundos Restantes!', {
      body: `${scenarioName}: Reta final da rodada! Contagem regressiva tática.`,
      toastType: 'urgent',
    });
  }

  /**
   * Alert at 0 seconds (Round End)
   */
  public notifyRoundEnd(scenarioName: string = 'Missão') {
    this.sendNotification('🛑 PaintOps: TEMPO ESGOTADO!', {
      body: `${scenarioName}: Fim de round! Apito final do árbitro. Cessar-fogo em campo!`,
      toastType: 'danger',
    });
  }
}

export const tacticalNotifications = new TacticalNotificationManager();
