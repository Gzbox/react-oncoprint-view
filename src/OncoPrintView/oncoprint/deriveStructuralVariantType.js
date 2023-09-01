export function deriveStructuralVariantType(structuralVariant) {
  const validTypes = [
    'DELETION',
    'TRANSLOCATION',
    'DUPLICATION',
    'INSERTION',
    'INVERSION',
    'FUSION',
  ];
  // SVs will sometimes have only 1 gene (intragenic).
  // could be site1 or site 2
  const genes = [];
  structuralVariant.site1HugoSymbol &&
    genes.push(structuralVariant.site1HugoSymbol);
  structuralVariant.site2HugoSymbol &&
    genes.push(structuralVariant.site2HugoSymbol);
  // this is default
  let structuralVariantType = 'FUSION';
  // if we only have one gene, we want to use the variantClass field of
  // structural variant IF it contains a valid type (above)
  // and if not, just pass unknown
  if (genes.length < 2) {
    structuralVariantType = validTypes.includes(structuralVariant.variantClass)
      ? structuralVariant.variantClass
      : 'UNKNOWN';
  }
  return structuralVariantType;
}
