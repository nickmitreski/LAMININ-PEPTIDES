import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import { Heading, Text } from './ui/Typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen bg-platinum flex items-center justify-center px-6 py-12"
          role="alert"
        >
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4"
                aria-hidden
              >
                <AlertTriangle className="h-8 w-8 text-red-600" strokeWidth={2} />
              </div>
              <Heading level={1} className="mb-3 text-xl sm:text-2xl">
                Something went wrong
              </Heading>
              <Text variant="body" muted className="mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </Text>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left mb-6 p-4 bg-red-50 border border-red-200 rounded-sm">
                  <summary className="cursor-pointer font-medium text-sm mb-2">
                    Error details
                  </summary>
                  <pre className="text-xs overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="md"
                className="min-h-11 touch-manipulation"
                onClick={() => window.location.reload()}
              >
                Refresh page
              </Button>
              <Button
                variant="outline"
                size="md"
                className="min-h-11 touch-manipulation"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Go to home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
