import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Initialize Android native features (Status Bar, Splash Screen, Back Button)
 */
export async function initializeNativeAndroid(onHardwareBack?: () => boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Status Bar styling (Android)
    if (Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#070a12' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }

    // 2. Hide Splash Screen after hydration
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      await SplashScreen.hide();
    }

    // 3. Hardware Back Button Listener (Android)
    if (Capacitor.isPluginAvailable('App') && onHardwareBack) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        const handled = onHardwareBack();
        if (!handled && canGoBack) {
          window.history.back();
        } else if (!handled && !canGoBack) {
          CapApp.exitApp();
        }
      });
    }
  } catch (err) {
    console.warn('Native Capacitor initialization error:', err);
  }
}
