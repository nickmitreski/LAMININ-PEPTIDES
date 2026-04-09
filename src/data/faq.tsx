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
  {
    id: 'payment-methods',
    question: 'What payment methods do you accept?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Laminin Peptide Lab accepts all major credit and debit cards through our secure payment platform, CoreForge Payments, which is integrated with Square.
        </FaqParagraph>
        <FaqParagraph>
          All transactions are protected with{' '}
          <strong className="font-medium text-carbon-900">
            end-to-end encryption, two-factor authentication (2FA), and PCI-compliant security standards
          </strong>{' '}
          to ensure your payment information remains completely secure.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'order-tracking',
    question: 'How can I track my order?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Once your order has been dispatched, you will receive a confirmation email with tracking information.
        </FaqParagraph>
        <FaqParagraph>
          Orders are typically processed and shipped within{' '}
          <strong className="font-medium text-carbon-900">1-2 business days</strong>.
          Delivery times vary depending on your location within Australia.
        </FaqParagraph>
        <FaqParagraph>
          For specific delivery timeframes and shipping rates, please refer to our{' '}
          <Link
            to="/shipping"
            className="font-medium text-carbon-900 underline underline-offset-4 hover:text-carbon-900/70"
          >
            Shipping Terms &amp; Policy
          </Link>.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'bulk-orders',
    question: 'Do you offer bulk or institutional pricing?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          For bulk orders or institutional procurement inquiries, please{' '}
          <Link
            to="/contact"
            className="font-medium text-carbon-900 underline underline-offset-4 hover:text-carbon-900/70"
          >
            contact our team
          </Link>{' '}
          with details of your requirements.
        </FaqParagraph>
        <FaqParagraph>
          We work with research institutions and laboratories to provide competitive pricing for larger volume orders.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'product-appearance',
    question: 'What form do the peptides arrive in?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Most peptide compounds are supplied as{' '}
          <strong className="font-medium text-carbon-900">
            lyophilised (freeze-dried) powder
          </strong>, which is the standard for research-grade peptides.
        </FaqParagraph>
        <FaqParagraph>
          Lyophilised peptides offer superior stability during storage and transport. Researchers can reconstitute the powder using appropriate solvents according to their specific research protocols.
        </FaqParagraph>
        <FaqParagraph>
          Some ancillary products may be supplied in liquid form where indicated on the product page.
        </FaqParagraph>
      </div>
    ),
  },
  {
    id: 'reconstitution',
    question: 'How do I reconstitute lyophilised peptides?',
    answer: (
      <div className="space-y-3">
        <FaqParagraph>
          Reconstitution procedures depend on the specific peptide and intended research application.
        </FaqParagraph>
        <FaqParagraph>
          Common solvents include sterile water, bacteriostatic water, or buffered solutions. Researchers should refer to{' '}
          <strong className="font-medium text-carbon-900">
            relevant scientific literature and established laboratory protocols
          </strong>{' '}
          for appropriate reconstitution methods.
        </FaqParagraph>
        <FaqParagraph>
          After reconstitution, peptides should be stored according to standard laboratory practices and used within appropriate timeframes as determined by stability data and research requirements.
        </FaqParagraph>
      </div>
    ),
  },
];
