import { useAppStore } from '../store/useAppStore';

export function useAuthGuard() {
  const { user, setAuthModalOpen } = useAppStore();

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      setAuthModalOpen(true);
    }
  };

  return { requireAuth };
}
