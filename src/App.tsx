import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HolographicLayout from './components/layout/HolographicLayout';
import AnimatedRoutes from './components/layout/AnimatedRoutes';
import { SiteConfigProvider } from './contexts/SiteConfigContext';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteConfigProvider>
        <Router>
          <HolographicLayout>
            <AnimatedRoutes />
          </HolographicLayout>
        </Router>
      </SiteConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
