import type { ReactNode } from 'react';
import { Text } from '../ui/Typography';

export default function FaqParagraph({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" className="text-neutral-600 leading-relaxed">
      {children}
    </Text>
  );
}
