import type { ReactNode } from 'react';
import { Text } from '../ui/Typography';

export default function FaqParagraph({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" weight="medium" className="text-neutral-600 leading-relaxed">
      {children}
    </Text>
  );
}
