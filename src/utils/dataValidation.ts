/**
 * Data validation utilities to ensure data consistency across the application
 */

import { peptides } from '../data/peptides';
import { PRODUCT_COPY, PRODUCT_HEADLINE } from '../data/productContent';
import { PRODUCT_VARIANTS, getDisplayPriceForPeptide } from '../data/productPricing';
import { coaPdfFilenameForPeptide } from '../data/coaPdfs';

interface ValidationIssue {
  severity: 'error' | 'warning';
  peptideId: string;
  message: string;
}

export function validateProductData(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  peptides.forEach((peptide) => {
    // Check for missing product copy
    if (!PRODUCT_COPY[peptide.id]) {
      issues.push({
        severity: 'error',
        peptideId: peptide.id,
        message: `Missing product copy in PRODUCT_COPY`,
      });
    }

    // Check for missing headline
    if (!PRODUCT_HEADLINE[peptide.id]) {
      issues.push({
        severity: 'warning',
        peptideId: peptide.id,
        message: `Missing headline in PRODUCT_HEADLINE (will use default)`,
      });
    }

    // Check for missing price
    const price = getDisplayPriceForPeptide(peptide.id);
    if (!price) {
      issues.push({
        severity: 'error',
        peptideId: peptide.id,
        message: `Missing price data`,
      });
    }

    // Check COA availability
    const coaFile = coaPdfFilenameForPeptide(peptide.id);
    if (!coaFile) {
      issues.push({
        severity: 'warning',
        peptideId: peptide.id,
        message: `No COA file linked`,
      });
    }

    // Check image path format
    if (!peptide.image.startsWith('/images/products/')) {
      issues.push({
        severity: 'warning',
        peptideId: peptide.id,
        message: `Image path doesn't match expected format: ${peptide.image}`,
      });
    }

    // Validate library filters include primary category
    if (!peptide.libraryFilters.includes(peptide.category)) {
      issues.push({
        severity: 'error',
        peptideId: peptide.id,
        message: `Primary category "${peptide.category}" not in libraryFilters`,
      });
    }
  });

  // Check for unused product variants
  Object.keys(PRODUCT_VARIANTS).forEach((peptideId) => {
    const peptide = peptides.find((p) => p.id === peptideId);
    if (!peptide) {
      issues.push({
        severity: 'error',
        peptideId,
        message: `Variant configuration exists but no matching peptide found`,
      });
    }
  });

  return issues;
}

export function logValidationIssues(): void {
  const issues = validateProductData();

  if (issues.length === 0) {
    console.log('✅ All product data validation passed!');
    return;
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (errors.length > 0) {
    console.error(`❌ ${errors.length} validation error(s) found:`);
    errors.forEach((issue) => {
      console.error(`  - [${issue.peptideId}] ${issue.message}`);
    });
  }

  if (warnings.length > 0) {
    console.warn(`⚠️  ${warnings.length} validation warning(s) found:`);
    warnings.forEach((issue) => {
      console.warn(`  - [${issue.peptideId}] ${issue.message}`);
    });
  }
}

// Run validation in development
if (import.meta.env.DEV) {
  logValidationIssues();
}
