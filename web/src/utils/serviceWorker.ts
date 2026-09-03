export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const registration = await navigator.serviceWorker.ready;
  
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    return subscription;
  } catch (err) {
    console.error('Failed to subscribe to push', err);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    return await subscription.unsubscribe();
  }
  return false;
}

export async function sendPushNotification(subscription: PushSubscription, title: string, body: string, icon?: string): Promise<void> {
  // In a real app this would send to the backend which sends via Web Push protocol
  console.log('Mock send to backend:', { subscription, title, body, icon });
}

export async function syncOfflineActions(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await (registration as any).sync.register('sync-emails');
    } catch (err) {
      console.error('Sync registration failed', err);
    }
  }
}

export async function cacheStrategy(request: Request): Promise<Response> {
  // This logic is usually in sw.js, provided here as a utility interface placeholder
  return fetch(request);
}
