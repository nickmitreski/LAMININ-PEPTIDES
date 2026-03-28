export interface TrustBadge {
  label: string;
  description: string;
  icon: string;
}

export const trustBadges: TrustBadge[] = [
  {
    label: "ISO Certified Labs",
    description: "Verified by accredited laboratories",
    icon: "shield-check"
  },
  {
    label: "Third-Party Tested",
    description: "Independent verification on every batch",
    icon: "check-circle"
  },
  {
    label: "99%+ Purity",
    description: "HPLC verified compound purity",
    icon: "award"
  },
  {
    label: "Full Traceability",
    description: "Complete batch tracking and documentation",
    icon: "file-check"
  },
  {
    label: "GMP Standards",
    description: "Good Manufacturing Practice compliance",
    icon: "building"
  },
  {
    label: "Secure Shipping",
    description: "Temperature-controlled logistics",
    icon: "package"
  }
];
