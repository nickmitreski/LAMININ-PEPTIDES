import type { ReactNode } from 'react';
import { Text } from '../ui/Typography';

export default function FaqParagraph({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" className="text-carbon-900 leading-relaxed">
      {children}
    </Text>
  );
}
