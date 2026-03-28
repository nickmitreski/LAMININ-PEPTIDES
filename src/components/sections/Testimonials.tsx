import { Star, Quote } from 'lucide-react';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import Card from '../ui/Card';
import { Text, Label } from '../ui/Typography';
import { testimonials } from '../../data/testimonials';

export default function Testimonials() {
  return (
    <Section background="neutral">
      <SectionTitle
        label="Trusted by Researchers"
        title="What Scientists Say About Our Work"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <Card key={index} padding="lg" className="relative">
            <div className="absolute top-6 right-6 text-grey">
              <Quote className="w-7 h-7" strokeWidth={1.5} />
            </div>

            <div className="flex gap-0.5 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-accent text-accent" />
              ))}
            </div>

            <Text variant="small" className="mb-6 relative z-10">
              "{testimonial.content}"
            </Text>

            <div className="border-t border-carbon-900/10 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-carbon-900/10 flex items-center justify-center text-carbon-900/60 font-medium text-xs">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <Label inheritColor className="text-carbon-900 block">
                    {testimonial.name}
                  </Label>
                  <Text variant="caption" muted>
                    {testimonial.role} · {testimonial.institution}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
