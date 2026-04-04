import { useState, FormEvent } from 'react';
import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';
import { Text } from '../components/ui/Typography';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const subject = encodeURIComponent(`Website enquiry from ${formData.name}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || '(not provided)'}\n\n${formData.message}`
      );
      window.location.href = `mailto:info@lamininpeptab.com.au?subject=${subject}&body=${body}`;
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
      setTimeout(() => setSubmitStatus('idle'), 8000);
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Section background="white">
        <SectionTitle
          title="Get in Touch"
          subtitle="Have a question about our products or need assistance with an order? Our team is here to help."
        />

        <div className="max-w-lg mx-auto">
          <Text variant="small" muted className="mb-6 block leading-relaxed">
            Send opens your email app with this message addressed to us. You can also email{' '}
            <a
              href="mailto:info@lamininpeptab.com.au"
              className="font-medium text-carbon-900 underline underline-offset-2 hover:text-accent-dark"
            >
              info@lamininpeptab.com.au
            </a>{' '}
            directly.
          </Text>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              name="name"
              type="text"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />

            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Phone (Optional)"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
            />

            <Textarea
              id="message"
              name="message"
              label="Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              placeholder="How can we help you?"
            />

            {submitStatus === 'success' && (
              <StatusMessage
                variant="success"
                message="If your email app opened, send the message there. We'll respond within 24 hours."
              />
            )}

            {submitStatus === 'error' && (
              <StatusMessage
                variant="error"
                message="Something went wrong. Please try again or email us directly."
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Opening…' : 'Send via email app'}
            </Button>
          </form>

          <div className="mt-12 pt-10 border-t border-carbon-900/10 text-center space-y-1.5">
            <Text variant="caption" muted>
              <span className="font-medium text-carbon-900">Email:</span>{' '}
              <a
                href="mailto:info@lamininpeptab.com.au"
                className="text-carbon-900 underline underline-offset-2 hover:text-accent-dark"
              >
                info@lamininpeptab.com.au
              </a>
            </Text>
            <Text variant="caption" muted>
              <span className="font-medium text-carbon-900">Response Time:</span>{' '}Within 24 hours
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
