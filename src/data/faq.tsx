import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import FaqParagraph from '../components/faq/FaqParagraph';

export interface FAQItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export const faqItems: FAQItem[] = [
  {
    id: 'intended-use',
    question:
      'What are the compounds supplied by Laminin Peptide Lab intended for?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          All compounds supplied by Laminin Peptide Lab are intended strictly
          for{' '}
          <strong className="font-medium text-carbon-900">
            laboratory research purposes
          </strong>
          .
        </FaqParagraph>
        <FaqParagraph>
          They are{' '}
          <strong className="font-medium text-carbon-900">NOT</strong> intended
          for human consumption, medical use, or therapeutic application.
        </FaqParagraph>
        <FaqParagraph>
          By purchasing from Laminin Peptide Lab, customers acknowledge that
          all products will be handled and used exclusively within a research
          environment.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'coa-available',
    question: 'Are Certificates of Analysis available?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          <strong className="font-medium text-carbon-900">Yes.</strong>
        </FaqParagraph>
        <FaqParagraph>
          Batch-specific Certificates of Analysis (COA) are available to support
          analytical transparency. These documents verify compound identity and
          purity using recognised analytical techniques such as HPLC.
        </FaqParagraph>
        <FaqParagraph>
          Certificates of Analysis can be accessed directly on each product
          page.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'purity-standards',
    question: 'What purity standards do your compounds meet?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Laminin Peptide Lab maintains a minimum purity standard of{' '}
          <strong className="font-medium text-carbon-900">≥99%</strong> for
          peptide compounds. Analytical verification is conducted prior to
          release to confirm compound purity and identity.
        </FaqParagraph>
        <FaqParagraph>
          Further details are available in the{' '}
          <Link
            to="/guarantee"
            className="text-carbon-900 font-medium underline underline-offset-4 hover:text-carbon-900/70"
          >
            Purity Assurance Guarantee
          </Link>{' '}
          and associated Certificates of Analysis.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'storage',
    question: 'How should peptide compounds be stored?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Peptide compounds should be stored in accordance with standard
          laboratory handling practices.
        </FaqParagraph>
        <FaqParagraph>
          Many peptides are typically stored under refrigerated conditions prior
          to reconstitution to preserve stability.
        </FaqParagraph>
        <FaqParagraph>
          Researchers should refer to relevant scientific literature and
          laboratory protocols for appropriate storage procedures.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'shipping',
    question: 'Do you ship internationally?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          At present, Laminin Peptide Lab supplies compounds within{' '}
          <strong className="font-medium text-carbon-900">Australia only</strong>
          .
        </FaqParagraph>
        <FaqParagraph>
          See our{' '}
          <Link
            to="/shipping"
            className="font-medium text-carbon-900 underline underline-offset-4 hover:text-carbon-900/70"
          >
            Shipping Terms &amp; Policy
          </Link>{' '}
          for rates, dispatch, delivery (including authority to leave), and discreet packaging. Final
          charges are confirmed at checkout.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'manufacturing-partners',
    question: 'Are your manufacturing partners certified?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Manufacturing partners operate under recognised quality management
          systems, including GMP-aligned processes and ISO-certified facilities
          (ISO 9001 and ISO 13485).
        </FaqParagraph>
        <FaqParagraph>
          These standards support consistent manufacturing and quality control
          practices.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'purity-guarantee',
    question: 'What is your Purity Assurance Guarantee?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Laminin Peptide Lab provides a Purity Assurance Guarantee for all
          compounds supplied.
        </FaqParagraph>
        <FaqParagraph>
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
        </FaqParagraph>
      </div>
    ),
  },
];
