import type { ChangeEvent } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { Heading } from '../ui/Typography';
import type { FieldErrors, ShippingFormData } from '../../features/checkout/checkoutForm';

interface CheckoutContactFormProps {
  formData: ShippingFormData;
  fieldErrors: FieldErrors;
  isSubmitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function CheckoutContactForm({
  formData,
  fieldErrors,
  isSubmitting,
  onChange,
}: CheckoutContactFormProps) {
  return (
    <Card padding="lg">
      <Heading level={5} className="mb-6">
        Contact information
      </Heading>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            name="firstName"
            label="First name"
            value={formData.firstName}
            onChange={onChange}
            required
            autoComplete="given-name"
            disabled={isSubmitting}
            error={fieldErrors.firstName}
          />
          <Input
            id="lastName"
            name="lastName"
            label="Last name"
            value={formData.lastName}
            onChange={onChange}
            required
            autoComplete="family-name"
            disabled={isSubmitting}
            error={fieldErrors.lastName}
          />
        </div>
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={onChange}
          required
          autoComplete="email"
          disabled={isSubmitting}
          error={fieldErrors.email}
          helperText="For order updates and receipts."
        />
        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Mobile number"
          value={formData.phone}
          onChange={onChange}
          autoComplete="tel"
          required
          disabled={isSubmitting}
          error={fieldErrors.phone}
          helperText="Required for delivery updates."
        />
      </div>
    </Card>
  );
}
