import Section from '../layout/Section';
import { Heading, Text } from '../ui/Typography';
import IconTile from '../ui/IconTile';
import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <Section background="white">
      <div className="max-w-5xl mx-auto">
        <div className="bg-carbon-900 rounded-xl p-8 md:p-10">
          <div className="flex items-start gap-5">
            <IconTile tone="light" className="bg-white/10 border-white/20">
              <AlertTriangle className="w-4 h-4 text-accent" strokeWidth={1.5} />
            </IconTile>
            <div>
              <Heading level={5} className="mb-3 text-white">
                Research Use Only
              </Heading>
              <div className="space-y-2">
                <Text variant="small" weight="medium" className="text-white">
                  All products supplied by Laminin Peptide Lab are intended for laboratory research purposes only.
                </Text>
                <Text variant="small" className="text-white/70">
                  These compounds are not intended for human consumption, medical use, or any therapeutic application.
                  No claims are made or implied regarding the treatment, prevention, cure, or diagnosis of any disease or medical condition.
                </Text>
                <Text variant="small" className="text-white/70">
                  Products are supplied in lyophilised form with third-party Certificates of Analysis and must be handled
                  by qualified research professionals in appropriate laboratory settings.
                </Text>
                <Text variant="small" className="text-white/70">
                  By purchasing from this site, you acknowledge that you are a qualified researcher and will use these
                  compounds solely for approved research purposes in compliance with all applicable laws and regulations.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
