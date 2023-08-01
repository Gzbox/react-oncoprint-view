import _ from 'lodash';
export const GenericAssayTypeConstants = {
  TREATMENT_RESPONSE: 'TREATMENT_RESPONSE',
  MUTATIONAL_SIGNATURE: 'MUTATIONAL_SIGNATURE',
  ARMLEVEL_CNA: 'ARMLEVEL_CNA',
  METHYLATION: 'METHYLATION',
};
// We have some customizations for Gene related Generic Assay profiles (e.g. Methylation)
// One can add new GenericAssayTypes at here to enable those customization for added types
const geneRelatedGenericAssayTypes = [GenericAssayTypeConstants.METHYLATION];
const DEFAULT_GENE_RELATED_CONFIG = {
  genericAssayConfigByType: Object.assign(
    {},
    _.reduce(
      geneRelatedGenericAssayTypes,
      (acc, type) => {
        acc[type] = {
          globalConfig: {
            geneRelatedGenericAssayType: true,
          },
        };
        return acc;
      },
      {},
    ),
  ),
};
const DEFAULT_GENERIC_ASSAY_CONFIG = {
  genericAssayConfigByType: {
    [GenericAssayTypeConstants.METHYLATION]: {
      globalConfig: {
        entityTitle: 'Gene / Probe',
      },
      selectionConfig: {
        placeHolderText: 'Search for Gene / Probe...',
        formatChartNameUsingCompactLabel: true,
      },
      oncoprintTrackConfig: {
        formatDescriptionUsingCommonLabel: true,
        formatNameUsingCompactLabel: true,
      },
      plotsTabConfig: {
        plotsTabUsecompactLabel: true,
      },
      downloadTabConfig: {
        formatDownloadHeaderUsingCompactLabel: true,
      },
    },
  },
};
export const GENERIC_ASSAY_CONFIG = _.merge(
  DEFAULT_GENE_RELATED_CONFIG,
  DEFAULT_GENERIC_ASSAY_CONFIG,
);
