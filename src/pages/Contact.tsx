import { useState, FormEvent } from 'react';
import Section from '../components/layout/Section';
import PageTopBanner from '../components/ui/PageTopBanner';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';
import { Heading, Text } from '../components/ui/Typography';
import { sendContactMessage } from '../services/emailService';
import { Mail, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
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

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Left column — contact info */}
          <div className="lg:col-span-2">
            <Heading level={4} className="mb-4">
              How can we help?
            </Heading>
            <Text variant="small" muted className="mb-8 block leading-relaxed">
              Whether you have a question about our compounds, need help sourcing a
              specific peptide, or want to discuss a bulk order — our team is here to
              help.
            </Text>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-dark ring-1 ring-accent-200">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <Text variant="caption" muted className="uppercase tracking-wide">
                    Email
                  </Text>
                  <a
                    href="mailto:info@lamininpeplab.com.au"
                    className="mt-1 block text-sm font-medium text-carbon-900 underline underline-offset-2 hover:text-accent-dark"
                  >
                    info@lamininpeplab.com.au
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-dark ring-1 ring-accent-200">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <Text variant="caption" muted className="uppercase tracking-wide">
                    Response time
                  </Text>
                  <Text variant="small" weight="medium" className="mt-1">
                    Within 24 hours
                  </Text>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-dark ring-1 ring-accent-200">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div>
                  <Text variant="caption" muted className="uppercase tracking-wide">
                    Enquiries
                  </Text>
                  <Text variant="small" weight="medium" className="mt-1">
                    Technical, supply &amp; quality
                  </Text>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-dark ring-1 ring-accent-200">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <Text variant="caption" muted className="uppercase tracking-wide">
                    Guarantee
                  </Text>
                  <Text variant="small" weight="medium" className="mt-1">
                    {'\u2265'}99% purity assured
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — form */}
          <div className="lg:col-span-3">
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
                {isSubmitting ? 'Sending\u2026' : 'Send message'}
              </Button>
            </form>
          </div>
        </div>
      </Section>
    </div>
  );
}
