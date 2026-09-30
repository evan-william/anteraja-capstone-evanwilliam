import { useLocation, useNavigate } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    refresh: () => window.dispatchEvent(new Event('anteraja:refresh')),
    back: () => navigate(-1),
  };
}

export function usePathname() { return useLocation().pathname; }
