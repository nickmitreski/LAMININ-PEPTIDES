export interface Testimonial {
  name: string;
  role: string;
  institution: string;
  content: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Principal Investigator",
    institution: "University of Melbourne",
    content: "The consistency and purity of compounds from Laminin Peptide Lab has been exceptional. Their third-party verification gives us the confidence we need for our research protocols.",
    rating: 5
  },
  {
    name: "Prof. James Chen",
    role: "Research Director",
    institution: "Queensland Institute of Medical Research",
    content: "Working with Laminin has streamlined our procurement process. The comprehensive COAs and transparent testing results are exactly what serious research requires.",
    rating: 5
  },
  {
    name: "Dr. Emma Richardson",
    role: "Laboratory Manager",
    institution: "Sydney Research Institute",
    content: "Outstanding quality and reliability. We've tested multiple batches and the purity levels are consistently above 99%. Their customer service is also top-tier.",
    rating: 5
  },
  {
    name: "Dr. Michael Torres",
    role: "Senior Researcher",
    institution: "Monash Biomedical Research",
    content: "The detailed documentation and batch consistency make Laminin our go-to supplier. Every shipment meets or exceeds specifications.",
    rating: 5
  }
];
