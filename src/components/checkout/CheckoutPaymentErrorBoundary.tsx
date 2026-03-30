import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class CheckoutPaymentErrorBoundary extends Component<
  Props,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[checkout-payment-boundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-sm border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0 space-y-2">
              <Text variant="small" weight="medium" className="text-red-900">
                Checkout could not continue
              </Text>
              <Text variant="caption" className="text-red-800">
                {this.state.message ?? 'Something went wrong. Please refresh and try again.'}
              </Text>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  this.setState({ hasError: false, message: undefined })
                }
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
