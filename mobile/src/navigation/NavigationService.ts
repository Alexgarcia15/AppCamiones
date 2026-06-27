import { createNavigationContainerRef, NavigationState } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
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
