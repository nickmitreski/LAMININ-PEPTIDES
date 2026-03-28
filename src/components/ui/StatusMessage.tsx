import Card from './Card';
import { Text } from './Typography';

interface StatusMessageProps {
  variant: 'success' | 'error';
  message: string;
  className?: string;
}

export default function StatusMessage({
  variant,
  message,
  className = '',
}: StatusMessageProps) {
  const toneClass = variant === 'success'
    ? 'bg-accent/10 border-accent/20 text-carbon-900'
    : 'bg-red-50 border-red-200 text-red-800';

  return (
    <Card padding="sm" variant="default" className={`${toneClass} ${className}`}>
      <Text variant="caption" className="text-current">
        {message}
      </Text>
    </Card>
  );
}
