import App from '@/components/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSplash from '@/components/LoadingSplash';

export default function Home() {
  return (
    <ErrorBoundary>
      <LoadingSplash>
        <App />
      </LoadingSplash>
    </ErrorBoundary>
  );
}
