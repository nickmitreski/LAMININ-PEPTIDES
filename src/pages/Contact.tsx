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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Form submitted:', formData);

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
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
                message="Thank you for your message! We'll respond within 24 hours."
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
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>

          <div className="mt-12 pt-10 border-t border-carbon-900/10 text-center space-y-1.5">
            <Text variant="caption" muted>
              <span className="font-medium text-carbon-900">Email:</span>{' '}info@lamininpeptidelab.com.au
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
