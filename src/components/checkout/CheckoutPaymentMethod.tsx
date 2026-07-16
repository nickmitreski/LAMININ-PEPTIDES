import Card from '../ui/Card';
import { Heading, Text } from '../ui/Typography';

export default function CheckoutPaymentMethod() {
  return (
    <Card padding="lg">
      <Heading level={5} className="mb-4">
        Payment method
      </Heading>
      <Text
        variant="caption"
        muted
        className="mb-4 block text-sm leading-relaxed sm:text-xs"
      >
        Payment is made via bank transfer. After placing your order, you will receive detailed
        payment instructions including our bank account details and your unique order reference
        number.
      </Text>
      <div className="rounded-sm border border-carbon-900/10 bg-neutral-50 px-4 py-3">
        <p className="text-sm font-medium text-carbon-900">Bank transfer / PayID</p>
        <p className="mt-1 text-xs text-carbon-900">
          Complete payment using your banking app
        </p>
      </div>
    </Card>
  );
}
