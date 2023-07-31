import { MolecularProfile } from 'cbioportal-ts-api-client';

export const MOLECULAR_PROFILE_MUTATIONS_SUFFIX = '_mutations';
export const MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX = `${MOLECULAR_PROFILE_MUTATIONS_SUFFIX}_uncalled`;
export const MUTATION_STATUS_GERMLINE = 'Germline';

export const SAMPLE_CANCER_TYPE_UNKNOWN = 'Unknown';

/* cbioportal api request arguments */
export const enum REQUEST_ARG_ENUM {
  PROJECTION_META = 'META',
  PROJECTION_SUMMARY = 'SUMMARY',
  PROJECTION_DETAILED = 'DETAILED',
  CLINICAL_DATA_TYPE_PATIENT = 'PATIENT',
  CLINICAL_DATA_TYPE_SAMPLE = 'SAMPLE',
}

/* cbioportal api responses */

/* cbioportal api responses - general response values */
export const RESPONSE_VALUE_NA = 'NA';

export const enum MIS_TYPE_VALUE {
  INSTABLE = 'Instable',
}

export const MSI_H_THRESHOLD = 10;
export const TMB_H_THRESHOLD = 10;

/* cbioportal api responses - clinical attribute fields and subfields */
export const enum CLINICAL_ATTRIBUTE_FIELD_ENUM {
  ID = 'clinicalAttributeId',
  DATATYPE_NUMBER = 'NUMBER',
  DATATYPE_STRING = 'STRING',
  DATATYPE_COUNTS_MAP = 'COUNTS_MAP',
}

/* cbioportal api responses - mutation data fields and subfields */
export const enum MUTATION_DATA_FIELD_ENUM {
  ASCN_INTEGER_COPY_NUMBER = 'ascnIntegerCopyNumber',
  TOTAL_COPY_NUMBER = 'totalCopyNumber',
  MINOR_COPY_NUMBER = 'minorCopyNumber',
  EXPECTED_ALT_COPIES = 'expectedAltCopies',
}

/* cbioportal api responses - genetic profile fields and subfields */
export const enum GENETIC_PROFILE_FIELD_ENUM {
  MOLECULAR_ALTERATION_TYPE = 'molecularAlterationType',
  STUDY_ID = 'studyId',
}

export const AlterationTypeText: {
  [K in MolecularProfile['molecularAlterationType']]: string;
} = {
  MUTATION_EXTENDED: 'mutations',
  COPY_NUMBER_ALTERATION: 'copy number alterations',
  MRNA_EXPRESSION: 'mRNA expression',
  PROTEIN_LEVEL: 'protein expression',
  STRUCTURAL_VARIANT: 'structural variants',
  GENERIC_ASSAY: 'generic assay',
  GENESET_SCORE: 'geneset score',
  METHYLATION: 'methylation',
  MICRO_RNA_EXPRESSION: 'micro rna expression',
  MRNA_EXPRESSION_NORMALS: 'MRNA expression normals',
  METHYLATION_BINARY: 'methylation binary',
  MUTATION_UNCALLED: 'mutation uncalled',
  PHOSPHORYLATION: 'phosphorylation',
  PROTEIN_ARRAY_PHOSPHORYLATION: 'protein array phosphorylation',
  PROTEIN_ARRAY_PROTEIN_LEVEL: 'protein array protein level',
  RNA_EXPRESSION: 'RNA expression',
};

// TODO: type this like the above so that it contains
// all possible keys (need to figure out FUSION first though, which is no longer a type)
// do we still need to support it?
export const AlterationTypeConstants = {
  MUTATION_EXTENDED: 'MUTATION_EXTENDED',
  COPY_NUMBER_ALTERATION: 'COPY_NUMBER_ALTERATION',
  MRNA_EXPRESSION: 'MRNA_EXPRESSION',
  PROTEIN_LEVEL: 'PROTEIN_LEVEL',
  STRUCTURAL_VARIANT: 'STRUCTURAL_VARIANT',
  FUSION: 'FUSION',
  GENERIC_ASSAY: 'GENERIC_ASSAY',
  GENESET_SCORE: 'GENESET_SCORE',
  METHYLATION: 'METHYLATION',
  MICRO_RNA_EXPRESSION: 'MICRO_RNA_EXPRESSION',
  MRNA_EXPRESSION_NORMALS: 'MRNA_EXPRESSION_NORMALS',
  METHYLATION_BINARY: 'METHYLATION_BINARY',
  MUTATION_UNCALLED: 'MUTATION_UNCALLED',
  PHOSPHORYLATION: 'PHOSPHORYLATION',
  PROTEIN_ARRAY_PHOSPHORYLATION: 'PROTEIN_ARRAY_PHOSPHORYLATION',
  PROTEIN_ARRAY_PROTEIN_LEVEL: 'PROTEIN_ARRAY_PROTEIN_LEVEL',
  RNA_EXPRESSION: 'RNA_EXPRESSION',
};
