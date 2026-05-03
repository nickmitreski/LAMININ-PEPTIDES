import { useState, FormEvent } from 'react';
import Section from '../components/layout/Section';
import PageTopBanner from '../components/ui/PageTopBanner';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';
import { Text } from '../components/ui/Typography';
import { sendContactMessage } from '../services/emailService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const MAX_MESSAGE_LENGTH = 5000;

export default function Contact() {
  useDocumentTitle(
    'Contact',
    'Get in touch with Laminin Peptide Lab. Reach our research team via email or this contact form for technical support, supply enquiries, or quality questions.'
  );
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    const result = await sendContactMessage({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      message: formData.message.trim(),
    });

    if (result.success) {
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 12000);
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.error ?? null);
    }

    setIsSubmitting(false);
  };

  const messageLength = formData.message.length;
  const messageOverLimit = messageLength > MAX_MESSAGE_LENGTH;

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageTopBanner title="Contact us" subtitle="Get in touch with our research team." />

        <div className="max-w-lg mx-auto">
          <Text variant="small" muted className="mb-6 block leading-relaxed">
            Fill out the form below and we'll respond within 24 hours during business days. You can also email{' '}
            <a
              href="mailto:info@lamininpeplab.com.au"
              className="font-medium text-carbon-900 underline underline-offset-2 hover:text-accent-dark"
            >
              info@lamininpeplab.com.au
            </a>{' '}
            directly.
          </Text>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
              label="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
            />

            <div>
              <Textarea
                id="message"
                name="message"
                label="Message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="How can we help you?"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <div className="mt-1 flex justify-end">
                <Text
                  variant="caption"
                  muted={!messageOverLimit}
                  className={messageOverLimit ? 'text-red-600' : undefined}
                >
                  {messageLength}/{MAX_MESSAGE_LENGTH}
                </Text>
              </div>
            </div>

            {submitStatus === 'success' && (
              <StatusMessage
                variant="success"
                message="Thanks — we received your message and sent a confirmation to your inbox. Our team will respond within 24 hours."
              />
            )}

            {submitStatus === 'error' && (
              <StatusMessage
                variant="error"
                message={errorMessage ?? "Something went wrong. Please try again or email us directly."}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || messageOverLimit}
              className="w-full"
            >
              {isSubmitting ? 'Sending…' : 'Send message'}
            </Button>
          </form>

          <div className="mt-12 pt-10 border-t border-carbon-900/10 text-center space-y-1.5">
            <Text variant="caption" muted>
              <span className="font-medium text-carbon-900">Email:</span>{' '}
              <a
                href="mailto:info@lamininpeplab.com.au"
                className="text-carbon-900 underline underline-offset-2 hover:text-accent-dark"
              >
                info@lamininpeplab.com.au
              </a>
            </Text>
            <Text variant="caption" muted>
              <span className="font-medium text-carbon-900">Response time:</span>{' '}Within 24 hours
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
