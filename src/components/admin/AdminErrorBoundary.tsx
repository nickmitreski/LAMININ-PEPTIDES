import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';
import Card from '../ui/Card';
import Section from '../layout/Section';
import AdminNavigation from './AdminNavigation';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Per-page error boundary for admin views. Catches unhandled render errors
 * in a single admin page without taking down the entire admin panel.
 */
export default class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[AdminErrorBoundary${this.props.pageName ? ` — ${this.props.pageName}` : ''}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-page min-h-screen bg-platinum">
          <AdminNavigation onLogout={() => { window.location.href = '/admin/login'; }} />
          <Section spacing="lg">
            <Card padding="lg" className="mx-auto max-w-lg text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-error-muted">
                <AlertTriangle className="h-7 w-7 text-error" />
              </div>
              <Heading level={3} className="mb-2">
                {this.props.pageName ? `${this.props.pageName} error` : 'Page error'}
              </Heading>
              <Text variant="body" muted className="mb-6">
                Something went wrong loading this page. Other admin pages are unaffected.
              </Text>
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 rounded-sm border border-error-border bg-error-light p-3 text-left">
                  <summary className="cursor-pointer text-sm font-medium">Details</summary>
                  <pre className="mt-2 overflow-auto text-xs">{this.state.error.toString()}</pre>
                </details>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => { window.location.href = '/admin'; }}
                >
                  Back to dashboard
                </Button>
              </div>
            </Card>
          </Section>
        </div>
      );
    }

    return this.props.children;
  }
}
