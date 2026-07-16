import type { ChangeEvent } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { Heading } from '../ui/Typography';
import type { FieldErrors, ShippingFormData } from '../../features/checkout/checkoutForm';

interface CheckoutShippingFormProps {
  formData: ShippingFormData;
  fieldErrors: FieldErrors;
  isSubmitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function CheckoutShippingForm({
  formData,
  fieldErrors,
  isSubmitting,
  onChange,
}: CheckoutShippingFormProps) {
  return (
    <Card padding="lg">
      <Heading level={5} className="mb-6">
        Shipping address
      </Heading>
      <div className="space-y-4">
        <Input
          id="address"
          name="address"
          label="Street address"
          value={formData.address}
          onChange={onChange}
          required
          autoComplete="street-address"
          disabled={isSubmitting}
          error={fieldErrors.address}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="city"
            name="city"
            label="City"
            value={formData.city}
            onChange={onChange}
            required
            autoComplete="address-level2"
            disabled={isSubmitting}
            error={fieldErrors.city}
          />
          <Input
            id="state"
            name="state"
            label="State"
            value={formData.state}
            onChange={onChange}
            required
            autoComplete="address-level1"
            disabled={isSubmitting}
            error={fieldErrors.state}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="postcode"
            name="postcode"
            label="Postcode"
            value={formData.postcode}
            onChange={onChange}
            required
            autoComplete="postal-code"
            inputMode="numeric"
            disabled={isSubmitting}
            error={fieldErrors.postcode}
          />
          <div>
            <label
              htmlFor="country"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-carbon-900"
            >
              Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={onChange}
              required
              disabled={isSubmitting}
              className="min-h-11 w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-base transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900 md:min-h-0 md:text-sm"
            >
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
}
