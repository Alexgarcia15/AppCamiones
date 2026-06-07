import { createNavigationContainerRef, NavigationState } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetRoot(state: Partial<NavigationState>) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(state as any);
  }
}
