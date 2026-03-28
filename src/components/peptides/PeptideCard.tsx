import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Heading, Label } from '../ui/Typography';
import IconTile from '../ui/IconTile';
import { Peptide } from '../../data/peptides';
import { ArrowRight, CheckCircle, Beaker } from 'lucide-react';

interface PeptideCardProps {
  peptide: Peptide;
}

export default function PeptideCard({ peptide }: PeptideCardProps) {
  return (
    <Card padding="lg" hover>
      <div className="flex items-start justify-between mb-4">
        <div>
          <Label className="mb-2 block">
            {peptide.category}
          </Label>
          <Heading level={5}>
            {peptide.name}
          </Heading>
        </div>
        <IconTile>
          <Beaker className="w-4 h-4 text-accent" strokeWidth={1.5} />
        </IconTile>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <Badge variant="accent" size="sm" icon={<CheckCircle className="w-3 h-3" strokeWidth={1.5} />}>
          {peptide.purity} Purity
        </Badge>
        {peptide.coaVerified && (
          <Badge variant="success" size="sm" icon={<CheckCircle className="w-3 h-3" strokeWidth={1.5} />}>
            COA Verified
          </Badge>
        )}
      </div>

      <Link to="/coa">
        <Button variant="outline" size="sm" className="w-full group">
          View Details
          <ArrowRight className="inline-block ml-2 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </Link>
    </Card>
  );
}
