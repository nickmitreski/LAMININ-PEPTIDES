import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Text } from '../components/ui/Typography';

export interface FAQItem {
  id: string;
  question: string;
  answer: ReactNode;
}

const P = ({ children }: { children: ReactNode }) => (
  <Text variant="body" className="text-neutral-600 leading-relaxed">
    {children}
  </Text>
);

export const faqItems: FAQItem[] = [
  {
    id: 'intended-use',
    question:
      'What are the compounds supplied by Laminin Peptide Lab intended for?',
    answer: (
      <div className="space-y-3">
        <P>
          All compounds supplied by Laminin Peptide Lab are intended strictly
          for{' '}
          <strong className="font-medium text-carbon-900">
            laboratory research purposes
          </strong>
          .
        </P>
        <P>
          They are{' '}
          <strong className="font-medium text-carbon-900">NOT</strong> intended
          for human consumption, medical use, or therapeutic application.
        </P>
        <P>
          By purchasing from Laminin Peptide Lab, customers acknowledge that
          all products will be handled and used exclusively within a research
          environment.
        </P>
      </div>
    ),
  },
  {
    id: 'coa-available',
    question: 'Are Certificates of Analysis available?',
    answer: (
      <div className="space-y-3">
        <P>
          <strong className="font-medium text-carbon-900">Yes.</strong>
        </P>
        <P>
          Batch-specific Certificates of Analysis (COA) are available to support
          analytical transparency. These documents verify compound identity and
          purity using recognised analytical techniques such as HPLC.
        </P>
        <P>
          Certificates of Analysis can be accessed directly on each product
          page.
        </P>
      </div>
    ),
  },
  {
    id: 'purity-standards',
    question: 'What purity standards do your compounds meet?',
    answer: (
      <div className="space-y-3">
        <P>
          Laminin Peptide Lab maintains a minimum purity standard of{' '}
          <strong className="font-medium text-carbon-900">≥99%</strong> for
          peptide compounds. Analytical verification is conducted prior to
          release to confirm compound purity and identity.
        </P>
        <P>
          Further details are available in the{' '}
          <Link
            to="/guarantee"
            className="text-carbon-900 font-medium underline underline-offset-4 hover:text-carbon-900/70"
          >
            Purity Assurance Guarantee
          </Link>{' '}
          and associated Certificates of Analysis.
        </P>
      </div>
    ),
  },
  {
    id: 'storage',
    question: 'How should peptide compounds be stored?',
    answer: (
      <div className="space-y-3">
        <P>
          Peptide compounds should be stored in accordance with standard
          laboratory handling practices.
        </P>
        <P>
          Many peptides are typically stored under refrigerated conditions prior
          to reconstitution to preserve stability.
        </P>
        <P>
          Researchers should refer to relevant scientific literature and
          laboratory protocols for appropriate storage procedures.
        </P>
      </div>
    ),
  },
  {
    id: 'shipping',
    question: 'Do you ship internationally?',
    answer: (
      <div className="space-y-3">
        <P>
          At present, Laminin Peptide Lab supplies compounds within{' '}
          <strong className="font-medium text-carbon-900">Australia only</strong>
          .
        </P>
        <P>
          Shipping policies and delivery information are available during
          checkout.
        </P>
      </div>
    ),
  },
  {
    id: 'manufacturing-partners',
    question: 'Are your manufacturing partners certified?',
    answer: (
      <div className="space-y-3">
        <P>
          Manufacturing partners operate under recognised quality management
          systems, including GMP-aligned processes and ISO-certified facilities
          (ISO 9001 and ISO 13485).
        </P>
        <P>
          These standards support consistent manufacturing and quality control
          practices.
        </P>
      </div>
    ),
  },
  {
    id: 'purity-guarantee',
    question: 'What is your Purity Assurance Guarantee?',
    answer: (
      <div className="space-y-3">
        <P>
          Laminin Peptide Lab provides a Purity Assurance Guarantee for all
          compounds supplied.
        </P>
        <P>
          If independent analytical testing demonstrates that the purity of a
          compound does not meet the stated specification of{' '}
          <strong className="font-medium text-carbon-900">≥99%</strong>, a
          refund will be issued in accordance with the terms outlined in our{' '}
          <Link
            to="/guarantee"
            className="text-carbon-900 font-medium underline underline-offset-4 hover:text-carbon-900/70"
          >
            Purity Assurance Guarantee
          </Link>{' '}
          policy.
        </P>
      </div>
    ),
  },
];
