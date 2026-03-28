import { Link } from 'react-router-dom';

interface TextLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export default function TextLink({ to, children, className = '' }: TextLinkProps) {
  return (
    <Link
      to={to}
      className={`text-xs font-medium tracking-wider uppercase text-carbon-900/50 hover:text-carbon-900 transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}
