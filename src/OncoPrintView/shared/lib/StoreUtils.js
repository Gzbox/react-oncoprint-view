import _ from 'lodash';
import localForage from 'localforage';
import { fetchVariantAnnotationsByMutation as fetchDefaultVariantAnnotationsByMutation, fetchVariantAnnotationsIndexedByGenomicLocation as fetchDefaultVariantAnnotationsIndexedByGenomicLocation, } from 'react-mutation-mapper';
import defaultClient from '../api/cbioportalClientInstance';
import client from '../api/cbioportalClientInstance';
import internalClient from '../api/cbioportalInternalClientInstance';
import g2sClient from '../api/g2sClientInstance';
import { stringListToIndexSet } from 'cbioportal-frontend-commons';
import oncokbClient from '../api/oncokbClientInstance';
import genomeNexusClient from '../api/genomeNexusClientInstance';
import { chunkCalls, isLinearClusterHotspot, } from 'cbioportal-utils';
import { generateAnnotateStructuralVariantQuery, generateCopyNumberAlterationQuery, generateIdToIndicatorMap, generateProteinChangeQuery, generateQueryVariantId, OtherBiomarkersQueryType, } from 'oncokb-frontend-commons';
import { getAlterationString } from './CopyNumberUtils';
import { keywordToCosmic } from './AnnotationUtils';
import { AlterationTypeConstants, CLINICAL_ATTRIBUTE_ID_ENUM, DataTypeConstants, GENOME_NEXUS_ARG_FIELD_ENUM, } from '../constants';
import { normalizeMutations } from '../components/mutationMapper/MutationMapperUtils';
import { getServerConfig } from '../../config/config';
import { REFERENCE_GENOME } from './referenceGenomeUtils';
import { getSurvivalAttributes, RESERVED_SURVIVAL_PLOT_PRIORITY, } from '../../resultsView/survival/SurvivalUtil';
import { annotateMolecularDatum, annotateMutationPutativeDriver, ONCOKB_ONCOGENIC_LOWERCASE, } from '../../resultsView/ResultsViewPageStoreUtils';
import { ASCNAttributes } from '../enums/ASCNEnums';
import { hasASCNProperty, isNotGermlineMutation, } from './MutationUtils';
import { ErrorMessages } from '../errorMessages';
export const MolecularAlterationType_filenameSuffix = {
  MUTATION_EXTENDED: 'mutations',
  COPY_NUMBER_ALTERATION: 'cna',
  MRNA_EXPRESSION: 'mrna',
  METHYLATION: 'methylation',
  METHYLATION_BINARY: 'methylation',
  PROTEIN_LEVEL: 'rppa',
  STRUCTURAL_VARIANT: 'structural_variants',
};
export const ONCOKB_DEFAULT = {
  indicatorMap: {},
};
export const GenePanelIdSpecialValue = {
  UNKNOWN: undefined,
  WHOLE_EXOME_SEQ: 'WES',
  WHOLE_GENOME_SEQ: 'WGS',
};
export function noGenePanelUsed(genePanelId) {
  return (genePanelId === GenePanelIdSpecialValue.UNKNOWN ||
    genePanelId === GenePanelIdSpecialValue.WHOLE_EXOME_SEQ ||
    genePanelId === GenePanelIdSpecialValue.WHOLE_GENOME_SEQ);
}
export async function fetchMutationData(mutationFilter, molecularProfileId, client = defaultClient) {
  if (molecularProfileId) {
    return await client.fetchMutationsInMolecularProfileUsingPOST({
      molecularProfileId,
      mutationFilter,
      projection: 'DETAILED',
    });
  }
  else {
    return [];
  }
}
export async function fetchVariantAnnotationsByMutation(mutations, fields = [GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY], isoformOverrideSource = 'mskcc', client = genomeNexusClient) {
  return fetchDefaultVariantAnnotationsByMutation(normalizeMutations(mutations), fields, isoformOverrideSource, client);
}
export async function fetchVariantAnnotationsIndexedByGenomicLocation(mutations, fields = [GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY], isoformOverrideSource = 'mskcc', client = genomeNexusClient) {
  return fetchDefaultVariantAnnotationsIndexedByGenomicLocation(normalizeMutations(mutations), fields, isoformOverrideSource, client);
}
export async function fetchGenes(hugoGeneSymbols, client = defaultClient) {
  if (hugoGeneSymbols && hugoGeneSymbols.length) {
    const order = stringListToIndexSet(hugoGeneSymbols);
    return _.sortBy(await client.fetchGenesUsingPOST({
      geneIdType: 'HUGO_GENE_SYMBOL',
      geneIds: hugoGeneSymbols.slice(),
      projection: 'SUMMARY',
    }), (gene) => order[gene.hugoGeneSymbol]);
  }
  else {
    return [];
  }
}
export function getAllGenes(client = defaultClient) {
  return client.getAllGenesUsingGET({
    projection: 'SUMMARY',
  });
}
export async function fetchReferenceGenomeGenes(genomeName, hugoGeneSymbols, client = defaultClient) {
  if (hugoGeneSymbols && hugoGeneSymbols.length) {
    const order = stringListToIndexSet(hugoGeneSymbols);
    return _.sortBy(await internalClient.fetchReferenceGenomeGenesUsingPOST({
      genomeName: genomeName,
      geneIds: hugoGeneSymbols.slice(),
    }), (gene) => order[gene.hugoGeneSymbol]);
  }
  else {
    return [];
  }
}
export async function fetchAllReferenceGenomeGenes(genomeName, client = defaultClient) {
  const doCaching = /\.cbioportal\.org|netlify\.app/.test(window.location.hostname);
  // allows us to clear cache when data changes
  const referenceGenomeKey = `referenceGenome-${getServerConfig().referenceGenomeVersion}`;
  const hg19cached = doCaching
    ? await localForage.getItem(referenceGenomeKey)
    : false;
  if (doCaching) {
    if (hg19cached) {
      console.info('using locally cached reference genome data');
      return hg19cached;
    }
    else {
      return await internalClient
        .getAllReferenceGenomeGenesUsingGET({
          genomeName: genomeName,
        })
        .then(d => {
          // this is async, but we can fire and forget
          localForage.setItem(referenceGenomeKey, d);
          return d;
        });
    }
  }
  else {
    if (genomeName) {
      return await internalClient.getAllReferenceGenomeGenesUsingGET({
        genomeName: genomeName,
      });
    }
    else {
      return [];
    }
  }
}
export async function fetchEnsemblTranscriptsByEnsemblFilter(ensemblFilter, client = genomeNexusClient) {
  return await client.fetchEnsemblTranscriptsByEnsemblFilterPOST({
    ensemblFilter: Object.assign(
      // set default to empty array
      {
        geneIds: [],
        hugoSymbols: [],
        proteinIds: [],
        transcriptIds: [],
      }, ensemblFilter),
  });
}
export async function fetchPdbAlignmentData(ensemblId, client = g2sClient) {
  if (ensemblId) {
    return await client.getAlignmentUsingGET({
      idType: 'ensembl',
      id: ensemblId,
    });
  }
  else {
    return [];
  }
}
export async function fetchCanonicalTranscripts(hugoSymbols, isoformOverrideSource, client = genomeNexusClient) {
  return await client.fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST({
    hugoSymbols,
    isoformOverrideSource,
  });
}
export async function getCanonicalTranscriptsByHugoSymbol(hugoSymbols, isoformOverrideSource, client = genomeNexusClient) {
  const transcripts = await fetchCanonicalTranscripts(hugoSymbols, isoformOverrideSource, client);
  return transcripts ? _.zipObject(hugoSymbols, transcripts) : undefined;
}
export async function fetchCanonicalEnsemblGeneIds(hugoSymbols, isoformOverrideSource, client = genomeNexusClient) {
  // TODO: this endpoint should accept isoformOverrideSource
  return await client.fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST({
    hugoSymbols,
  });
}
export async function fetchClinicalData(clinicalDataMultiStudyFilter, client = defaultClient) {
  if (clinicalDataMultiStudyFilter) {
    return await client.fetchClinicalDataUsingPOST({
      clinicalDataType: 'SAMPLE',
      clinicalDataMultiStudyFilter: clinicalDataMultiStudyFilter,
      projection: 'DETAILED',
    });
  }
  else {
    return [];
  }
}
export async function fetchClinicalDataInStudy(studyId, clinicalDataSingleStudyFilter, clinicalDataType, client = defaultClient) {
  if (clinicalDataSingleStudyFilter) {
    return await client.fetchAllClinicalDataInStudyUsingPOST({
      studyId: studyId,
      clinicalDataType: clinicalDataType,
      clinicalDataSingleStudyFilter: clinicalDataSingleStudyFilter,
      projection: 'SUMMARY',
    });
  }
  else {
    return [];
  }
}
export async function fetchClinicalDataForPatient(studyId, patientId, client = defaultClient) {
  if (studyId && patientId) {
    return await client.getAllClinicalDataOfPatientInStudyUsingGET({
      projection: 'DETAILED',
      studyId,
      patientId,
    });
  }
  else {
    return [];
  }
}
export async function fetchCopyNumberSegments(studyId, sampleIds, client = defaultClient) {
  if (studyId && sampleIds.length > 0) {
    return await client.fetchCopyNumberSegmentsUsingPOST({
      sampleIdentifiers: sampleIds.map((sampleId) => ({
        sampleId,
        studyId,
      })),
      projection: 'DETAILED',
    });
  }
  else {
    return [];
  }
}
export function fetchCopyNumberSegmentsForSamples(samples, chromosome, client = defaultClient) {
  if (samples.length > 0) {
    return client.fetchCopyNumberSegmentsUsingPOST({
      sampleIdentifiers: samples.map(sample => ({
        sampleId: sample.sampleId,
        studyId: sample.studyId,
      })),
      chromosome,
      projection: 'DETAILED',
    });
  }
  else {
    return Promise.resolve([]);
  }
}
export async function fetchSamplesForPatient(studyId, patientId, sampleId, client = defaultClient) {
  if (studyId && patientId) {
    return await client.getAllSamplesOfPatientInStudyUsingGET({
      studyId,
      patientId,
      projection: 'DETAILED',
    });
  }
  else if (studyId && sampleId) {
    return await client
      .getSampleInStudyUsingGET({
        studyId,
        sampleId,
      })
      .then((data) => [data]);
  }
  else {
    return [];
  }
}
export async function fetchSamples(sampleIds, studyId, client = defaultClient) {
  if (sampleIds.result && sampleIds.result.length > 0 && studyId) {
    const sampleIdentifiers = sampleIds.result.map((sampleId) => ({
      sampleId,
      studyId,
    }));
    return await client.fetchSamplesUsingPOST({
      sampleFilter: {
        sampleIdentifiers,
      },
    });
  }
  else {
    return [];
  }
}
export async function fetchGermlineConsentedSamples(studyIds, studiesWithGermlineConsentedSamples, client = defaultClient) {
  // no valid config param => feature disabled
  if (!studiesWithGermlineConsentedSamples || !studyIds.result) {
    return [];
  }
  // query API only for the studies provided with the config param
  const studies = studyIds.result.filter(studyId => _.find(studiesWithGermlineConsentedSamples, element => element === studyId));
  if (studies.length > 0) {
    const ids = await Promise.all(studies.map(studyId => {
      return client.getAllSampleIdsInSampleListUsingGET({
        sampleListId: getGermlineSampleListId(studyId),
      });
    }));
    return _.flatten(ids.map((sampleIds, index) => {
      const studyId = studies[index];
      return sampleIds.map(sampleId => ({ sampleId, studyId }));
    }));
  }
  else {
    return [];
  }
}
export function getGermlineSampleListId(studyId) {
  return `${studyId}_germline`;
}
export function findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples) {
  const samplesWithClinicalData = {};
  if (clinicalDataForSamples.result) {
    _.each(clinicalDataForSamples.result, (clinicalData) => {
      if (clinicalData.clinicalAttributeId === 'CANCER_TYPE_DETAILED' ||
        clinicalData.clinicalAttributeId === 'CANCER_TYPE') {
        samplesWithClinicalData[clinicalData.uniqueSampleKey] = true;
      }
    });
  }
  return samplesWithClinicalData;
}
export function findSamplesWithoutCancerTypeClinicalData(samples, clinicalDataForSamples) {
  if (samples.result &&
    samples.result.length > 0 &&
    clinicalDataForSamples.result) {
    const samplesWithClinicalData = findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples);
    return _.filter(samples.result, (sample) => {
      return samplesWithClinicalData[sample.uniqueSampleKey] !== true;
    });
  }
  else {
    return [];
  }
}
export async function fetchSamplesWithoutCancerTypeClinicalData(sampleIds, studyId, clinicalDataForSamples, client = defaultClient) {
  let samples = [];
  if (sampleIds.result &&
    sampleIds.result.length > 0 &&
    clinicalDataForSamples.result) {
    const samplesWithClinicalData = findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples);
    const sampleIdsWithoutClinicalData = _.filter(sampleIds.result, (sampleId) => {
      return samplesWithClinicalData[sampleId] !== true;
    });
    const sampleIdentifierForSamplesWithoutClinicalData = sampleIdsWithoutClinicalData.map(sampleId => ({ sampleId, studyId }));
    if (sampleIdentifierForSamplesWithoutClinicalData.length > 0) {
      samples = await client.fetchSamplesUsingPOST({
        sampleFilter: {
          sampleIdentifiers: sampleIdentifierForSamplesWithoutClinicalData,
        },
      });
    }
  }
  return samples;
}
export async function fetchStudiesForSamplesWithoutCancerTypeClinicalData(samplesWithoutClinicalData, client = defaultClient) {
  let studies = [];
  if (samplesWithoutClinicalData.result &&
    samplesWithoutClinicalData.result.length > 0) {
    const studyIdsForSamplesWithoutClinicalData = _.uniq(samplesWithoutClinicalData.result.map((sample) => sample.studyId));
    studies = await client.fetchStudiesUsingPOST({
      studyIds: studyIdsForSamplesWithoutClinicalData,
      projection: 'DETAILED',
    });
  }
  return studies;
}
export async function fetchCosmicData(mutationData, uncalledMutationData, client = internalClient) {
  const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);
  if (mutationDataResult.length === 0) {
    return undefined;
  }
  // we have to check and see if keyword property is present
  // it is NOT present sometimes
  const queryKeywords = _.chain(mutationDataResult)
    .filter((mutation) => mutation.hasOwnProperty('keyword'))
    .map((mutation) => mutation.keyword)
    .uniq()
    .value();
  if (queryKeywords.length > 0) {
    const cosmicData = await client.fetchCosmicCountsUsingPOST({
      keywords: _.filter(queryKeywords, (query) => query != null),
    });
    return keywordToCosmic(cosmicData);
  }
  else {
    return undefined;
  }
}
export async function fetchMutSigData(studyId, client = internalClient) {
  const mutSigdata = await client.getSignificantlyMutatedGenesUsingGET({
    studyId,
  });
  const byEntrezGeneId = mutSigdata.reduce((map, next) => {
    map[next.entrezGeneId] = { qValue: next.qValue };
    return map;
  }, {});
  return byEntrezGeneId;
}
export async function fetchGisticData(studyId, client = internalClient) {
  if (studyId) {
    const gisticData = await client.getSignificantCopyNumberRegionsUsingGET({ studyId });
    // generate a map of <entrezGeneId, IGisticSummary[]> pairs
    return gisticData.reduce((map, gistic) => {
      gistic.genes.forEach((gene) => {
        if (map[gene.entrezGeneId] === undefined) {
          map[gene.entrezGeneId] = [];
        }
        // we may have more than one entry for a gene, so using array
        map[gene.entrezGeneId].push({
          amp: gistic.amp,
          qValue: gistic.qValue,
          peakGeneCount: gistic.genes.length,
        });
      });
      return map;
    }, {});
  }
  else {
    return {};
  }
}
export async function fetchCopyNumberData(discreteCNAData, molecularProfileIdDiscrete, client = defaultClient) {
  const copyNumberCountIdentifiers = discreteCNAData.result
    ? discreteCNAData.result.map((cnData) => {
      return {
        alteration: cnData.alteration,
        entrezGeneId: cnData.entrezGeneId,
      };
    })
    : [];
  if (molecularProfileIdDiscrete.result &&
    copyNumberCountIdentifiers.length > 0) {
    return await internalClient.fetchCopyNumberCountsUsingPOST({
      molecularProfileId: molecularProfileIdDiscrete.result,
      copyNumberCountIdentifiers,
    });
  }
  else {
    return [];
  }
}
export async function fetchGenePanelData(molecularProfileId, sampleIds = [], sampleListId = '') {
  const filter = {};
  if (sampleIds.length > 0) {
    filter.sampleIds = sampleIds;
  }
  if (sampleListId.length > 0) {
    filter.sampleListId = sampleListId;
  }
  const remoteData = await client.getGenePanelDataUsingPOST({
    molecularProfileId,
    genePanelDataFilter: filter,
  });
  return _.keyBy(remoteData, genePanelData => genePanelData.sampleId);
}
export async function fetchGenePanel(genePanelIds) {
  const genePanels = {};
  const uniquePanelIds = _.uniq(genePanelIds);
  const remoteData = await Promise.all(_.map(uniquePanelIds, async (genePanelId) => await client.getGenePanelUsingGET({ genePanelId })));
  return _.keyBy(remoteData, genePanel => genePanel.genePanelId);
}
export async function fetchOncoKbCancerGenes(client = oncokbClient) {
  return await client.utilsCancerGeneListGetUsingGET_1({}).catch(d => {
    return d;
  });
}
export async function fetchOncoKbInfo(client = oncokbClient) {
  return await client.infoGetUsingGET_1({}).catch(d => {
    return d;
  });
}
export async function fetchOncoKbData(uniqueSampleKeyToTumorType, annotatedGenes, mutationData, evidenceTypes, uncalledMutationData, client = oncokbClient) {
  const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);
  if (annotatedGenes instanceof Error) {
    return new Error();
  }
  else if (mutationDataResult.length === 0) {
    return ONCOKB_DEFAULT;
  }
  const mutationsToQuery = _.filter(mutationDataResult, m => m.mutationType === fusionMutationType ||
    !!annotatedGenes[m.entrezGeneId]);
  return queryOncoKbData(mutationsToQuery.map(mutation => {
    return {
      entrezGeneId: mutation.entrezGeneId,
      alteration: mutation.proteinChange,
      proteinPosStart: mutation.proteinPosStart,
      proteinPosEnd: mutation.proteinPosEnd,
      mutationType: mutation.mutationType,
      tumorType: cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType),
    };
  }), client);
}
export async function fetchCnaOncoKbData(uniqueSampleKeyToTumorType, annotatedGenes, discreteCNAData, client = oncokbClient) {
  if (!discreteCNAData.result || discreteCNAData.result.length === 0) {
    return ONCOKB_DEFAULT;
  }
  else {
    const alterationsToQuery = _.filter(discreteCNAData.result, d => !!annotatedGenes[d.gene.entrezGeneId]);
    const queryVariants = _.uniqBy(_.map(alterationsToQuery, (copyNumberData) => {
      return generateCopyNumberAlterationQuery(copyNumberData.gene.entrezGeneId, cancerTypeForOncoKb(copyNumberData.uniqueSampleKey, uniqueSampleKeyToTumorType), getAlterationString(copyNumberData.alteration));
    }).filter(query => query.copyNameAlterationType), 'id');
    return queryOncoKbCopyNumberAlterationData(queryVariants, client);
  }
}
export async function fetchStructuralVariantOncoKbData(uniqueSampleKeyToTumorType, annotatedGenes, structuralVariantData, client = oncokbClient) {
  if (!structuralVariantData.result ||
    structuralVariantData.result.length === 0) {
    return ONCOKB_DEFAULT;
  }
  else {
    const alterationsToQuery = _.filter(structuralVariantData.result, d => (d.site1EntrezGeneId || d.site2EntrezGeneId) &&
      (!!annotatedGenes[d.site1EntrezGeneId] ||
        !!annotatedGenes[d.site2EntrezGeneId]));
    const queryVariants = _.uniqBy(_.map(alterationsToQuery, datum => {
      return generateAnnotateStructuralVariantQuery(datum, cancerTypeForOncoKb(datum.uniqueSampleKey, uniqueSampleKeyToTumorType));
    }), datum => datum.id);
    return fetchOncoKbStructuralVariantData(queryVariants, client);
  }
}
export async function fetchCnaOncoKbDataWithNumericGeneMolecularData(uniqueSampleKeyToTumorType, annotatedGenes, cnaMolecularData, evidenceTypes, client = oncokbClient) {
  if (!cnaMolecularData.result || cnaMolecularData.result.length === 0) {
    return ONCOKB_DEFAULT;
  }
  else {
    const queryVariants = _.uniqBy(_.map(cnaMolecularData.result, (datum) => {
      return generateCopyNumberAlterationQuery(datum.entrezGeneId, cancerTypeForOncoKb(datum.uniqueSampleKey, uniqueSampleKeyToTumorType), getAlterationString(datum.value));
    }).filter(query => query.copyNameAlterationType), (query) => query.id);
    return queryOncoKbCopyNumberAlterationData(queryVariants, client);
  }
}
export function cancerTypeForOncoKb(uniqueSampleKey, uniqueSampleKeyToTumorType) {
  // first priority is sampleIdToTumorType map (derived either from the clinical data or from the study cancer type).
  // if it is not valid, then we return an empty string and let OncoKB API figure out what to do
  return uniqueSampleKeyToTumorType[uniqueSampleKey] || null;
}
const fusionMutationType = 'Fusion';
export async function queryOncoKbData(annotationQueries, client = oncokbClient, evidenceTypes) {
  const mutationQueryVariants = _.uniqBy(_.map(annotationQueries.filter(mutation => mutation.mutationType !== fusionMutationType), (mutation) => {
    return generateProteinChangeQuery(mutation.entrezGeneId, mutation.tumorType, mutation.alteration, mutation.mutationType, mutation.proteinPosStart, mutation.proteinPosEnd, evidenceTypes);
  }), 'id');
  const mutationQueryResult = await chunkCalls(chunk => client.annotateMutationsByProteinChangePostUsingPOST_1({
    body: chunk,
  }), mutationQueryVariants, 250);
  const oncoKbData = {
    indicatorMap: generateIdToIndicatorMap(mutationQueryResult),
  };
  return oncoKbData;
}
export async function queryOncoKbCopyNumberAlterationData(queryVariants, client = oncokbClient) {
  const oncokbSearch = queryVariants.length === 0
    ? []
    : await client.annotateCopyNumberAlterationsPostUsingPOST_1({
      body: queryVariants,
    });
  return toOncoKbData(oncokbSearch);
}
export async function fetchOncoKbStructuralVariantData(queryVariants, client = oncokbClient) {
  const oncokbSearch = queryVariants.length === 0
    ? []
    : await client.annotateStructuralVariantsPostUsingPOST_1({
      body: queryVariants,
    });
  return toOncoKbData(oncokbSearch);
}
function toOncoKbData(indicatorQueryResps) {
  return {
    indicatorMap: generateIdToIndicatorMap(indicatorQueryResps),
  };
}
export async function fetchDiscreteCNAData(discreteCopyNumberFilter, molecularProfileIdDiscrete, client = defaultClient) {
  if (molecularProfileIdDiscrete.isComplete &&
    molecularProfileIdDiscrete.result) {
    return await client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST({
      projection: 'DETAILED',
      discreteCopyNumberFilter,
      molecularProfileId: molecularProfileIdDiscrete.result,
    });
  }
  else {
    return [];
  }
}
export function findDiscreteMolecularProfile(molecularProfilesInStudy) {
  if (!molecularProfilesInStudy.result) {
    return undefined;
  }
  return molecularProfilesInStudy.result.find((p) => {
    return p.datatype === DataTypeConstants.DISCRETE;
  });
}
export function findMolecularProfileIdDiscrete(molecularProfilesInStudy) {
  const profile = findDiscreteMolecularProfile(molecularProfilesInStudy);
  return profile ? profile.molecularProfileId : undefined;
}
export function isMutationProfile(profile) {
  return profile.molecularAlterationType === 'MUTATION_EXTENDED';
}
export function findMutationMolecularProfile(molecularProfilesInStudy, studyId, type) {
  if (!molecularProfilesInStudy.result) {
    return undefined;
  }
  const profile = molecularProfilesInStudy.result.find((profile) => profile.molecularAlterationType === type);
  return profile;
}
export function findUncalledMutationMolecularProfileId(molecularProfilesInStudy, studyId) {
  const profile = findMutationMolecularProfile(molecularProfilesInStudy, studyId, AlterationTypeConstants.MUTATION_UNCALLED);
  if (profile) {
    return profile.molecularProfileId;
  }
  else {
    return undefined;
  }
}
export function findMrnaRankMolecularProfileId(molecularProfilesInStudy) {
  const regex1 = /^.+rna_seq.*_zscores$/i; // We prefer profiles that look like this
  const preferredProfileId = molecularProfilesInStudy.find(profileId => regex1.test(profileId));
  return preferredProfileId || null;
}
export function generateUniqueSampleKeyToTumorTypeMap(clinicalDataForSamples, studies, samples) {
  const map = {};
  if (clinicalDataForSamples.result) {
    // first priority is CANCER_TYPE_DETAILED in clinical data
    _.each(clinicalDataForSamples.result, (clinicalData) => {
      if (clinicalData.clinicalAttributeId === 'CANCER_TYPE_DETAILED') {
        map[clinicalData.uniqueSampleKey] = clinicalData.value;
      }
    });
    // // second priority is CANCER_TYPE in clinical data
    // _.each(clinicalDataForSamples.result, (clinicalData: ClinicalData) => {
    //     // update map with CANCER_TYPE value only if it is not already updated
    //     if (clinicalData.clinicalAttributeId === "CANCER_TYPE" && map[clinicalData.uniqueSampleKey] === undefined) {
    //         map[clinicalData.uniqueSampleKey] = clinicalData.value;
    //     }
    // });
  }
  // last resort: fall back to the study cancer type
  if (studies && studies.result && samples && samples.result) {
    const studyIdToCancerType = makeStudyToCancerTypeMap(studies.result);
    _.each(samples.result, (sample) => {
      if (map[sample.uniqueSampleKey] === undefined) {
        map[sample.uniqueSampleKey] =
          studyIdToCancerType[sample.studyId];
      }
    });
  }
  return map;
}
export function mergeDiscreteCNAData(discreteCNAData) {
  const idToCNAs = {};
  if (discreteCNAData.result) {
    for (const d of discreteCNAData.result) {
      const cnaId = `${d.entrezGeneId}_${d.alteration}`;
      idToCNAs[cnaId] = idToCNAs[cnaId] || [];
      idToCNAs[cnaId].push(d);
    }
  }
  return Object.keys(idToCNAs).map((id) => idToCNAs[id]);
}
export function mergeMutations(mutationData, generateMutationId = generateMutationIdByGeneAndProteinChangeAndEvent) {
  const idToMutations = {};
  updateIdToMutationsMap(idToMutations, mutationData, generateMutationId, false);
  return Object.keys(idToMutations).map((id) => idToMutations[id]);
}
export function indexPdbAlignmentData(alignmentData) {
  return 'indexPdbAlignmentData'
}
export function mergeMutationsIncludingUncalled(mutationData, uncalledMutationData, generateMutationId = generateMutationIdByGeneAndProteinChangeAndEvent) {
  const idToMutations = {};
  updateIdToMutationsMap(idToMutations, mutationData.result, generateMutationId, false);
  updateIdToMutationsMap(idToMutations, uncalledMutationData.result, generateMutationId, true);
  return Object.keys(idToMutations).map((id) => idToMutations[id]);
}
function updateIdToMutationsMap(idToMutations, mutationData, generateMutationId = generateMutationIdByGeneAndProteinChangeAndEvent, onlyUpdateExistingIds) {
  if (mutationData) {
    for (const mutation of mutationData) {
      const mutationId = generateMutationId(mutation);
      if (!onlyUpdateExistingIds || mutationId in idToMutations) {
        idToMutations[mutationId] = idToMutations[mutationId] || [];
        idToMutations[mutationId].push(mutation);
      }
    }
  }
}
export function concatMutationData(mutationData, uncalledMutationData) {
  const mutationDataResult = mutationData && mutationData.result ? mutationData.result : [];
  const uncalledMutationDataResult = uncalledMutationData && uncalledMutationData.result
    ? uncalledMutationData.result
    : [];
  return mutationDataResult.concat(uncalledMutationDataResult);
}
function mutationEventFields(m) {
  return [
    m.chr,
    m.startPosition,
    m.endPosition,
    m.referenceAllele,
    m.variantAllele,
  ];
}
export function generateMutationIdByEvent(m) {
  return mutationEventFields(m).join('_');
}
export function generateStructuralVariantId(s) {
  // NOTE: We need to sort because
  // data contains inconsistent ordering of
  // site1 and site2
  // we want to treat either ordering as the same variant
  return [
    s.site1HugoSymbol,
    s.site2HugoSymbol,
    s.site1Position,
    s.site2Position,
    s.site1Chromosome,
    s.site2Chromosome,
    s.variantClass,
  ]
    .sort()
    .join('_');
}
export function generateMutationIdByGeneAndProteinChange(m) {
  return `${m.gene.hugoGeneSymbol}_${m.proteinChange}`;
}
export function generateMutationIdByGeneAndProteinChangeAndEvent(m) {
  return [
    m.gene.hugoGeneSymbol,
    m.proteinChange,
    ...mutationEventFields(m),
  ].join('_');
}
export function generateMutationIdByGeneAndProteinChangeSampleIdAndEvent(m) {
  return [
    m.gene.hugoGeneSymbol,
    m.proteinChange,
    m.sampleId,
    ...mutationEventFields(m),
  ].join('_');
}
/** scan a collection of Mutations to see if any contain values for ASCN fields/properties
 *
 * all mutations (whether passed as a simple array or as an array of array)
 * are scanned (once per known ASCN field/property) to see whether any mutation can be found
 * which has a (non-empty) value defined for the field. A map from field name to boolean
 * result is returned.
 *
 * @param mutations - a union type (either array of Mutation or array of array of Mutation)
 * @returns Object/Dictionary with key from {ASCN_field_names} and boolean value per key
 */
export function existsSomeMutationWithAscnPropertyInCollection(mutations) {
  const existsSomeMutationWithAscnPropertyMap = {};
  for (let p of Object.values(ASCNAttributes)) {
    if (mutations.length == 0) {
      existsSomeMutationWithAscnPropertyMap[p] = false;
      continue;
    }
    existsSomeMutationWithAscnPropertyMap[p] = _.some(mutations, mutationElement => {
      if (mutationElement.hasOwnProperty('variantAllele')) {
        // element is a single mutation
        return hasASCNProperty(mutationElement, p);
      }
      else {
        // element is a mutation array
        return _.some(mutationElement, m => {
          return hasASCNProperty(m, p);
        });
      }
    });
  }
  return existsSomeMutationWithAscnPropertyMap;
}
export function generateDataQueryFilter(sampleListId, sampleIds) {
  let filter = {};
  if (sampleListId) {
    filter = {
      sampleListId,
    };
  }
  else if (sampleIds) {
    filter = {
      sampleIds,
    };
  }
  return filter;
}
export function makeStudyToCancerTypeMap(studies) {
  return studies.reduce((map, next) => {
    map[next.studyId] = next.cancerType.name;
    return map;
  }, {});
}
export function groupBySampleId(sampleIds, clinicalDataArray) {
  return _.map(sampleIds, (k) => ({
    id: k,
    clinicalData: clinicalDataArray.filter((cd) => cd.sampleId === k),
  }));
}
export function mapSampleIdToClinicalData(clinicalDataGroupedBySampleId) {
  const sampleIdToClinicalDataMap = _.chain(clinicalDataGroupedBySampleId)
    .keyBy('id')
    .mapValues(o => o.clinicalData)
    .value();
  return sampleIdToClinicalDataMap;
}
export function groupBy(data, keyFn, defaultKeys = []) {
  const ret = {};
  for (const key of defaultKeys) {
    ret[key] = [];
  }
  for (const datum of data) {
    const key = keyFn(datum);
    ret[key] = ret[key] || [];
    ret[key].push(datum);
  }
  return ret;
}
export async function getHierarchyData(geneticProfileId, percentile, scoreThreshold, pvalueThreshold, sampleListId, client = internalClient) {
  return await client.fetchGenesetHierarchyInfoUsingPOST({
    geneticProfileId,
    percentile,
    scoreThreshold,
    pvalueThreshold,
    sampleListId,
  });
}
export function getGenomeBuildFromStudies(studies) {
  // default reference genome is hg19(GRCh37)
  // if the all studies are based on hg38, return hg38(GRCh38)
  if (studies) {
    if (_.every(studies, study => new RegExp(REFERENCE_GENOME.grch38.NCBI, 'i').test(study.referenceGenome) ||
      new RegExp(REFERENCE_GENOME.grch38.UCSC, 'i').test(study.referenceGenome))) {
      return REFERENCE_GENOME.grch38.UCSC;
    }
  }
  return REFERENCE_GENOME.grch37.UCSC;
}
export function getGenomeNexusUrl(studies) {
  // default reference genome is GRCh37
  // if the study is based on GRCh38, return GRCh38 genome nexus url
  const genomeBuild = getGenomeBuildFromStudies(studies);
  if (genomeBuild === REFERENCE_GENOME.grch38.UCSC) {
    return getServerConfig().genomenexus_url_grch38;
  }
  return getServerConfig().genomenexus_url;
}
export function getSurvivalClinicalAttributesPrefix(clinicalAttributes) {
  const attributes = getSurvivalAttributes(clinicalAttributes);
  // get paired attributes
  const attributePrefixes = _.reduce(attributes, (attributePrefixes, attribute) => {
    let prefix = attribute.substring(0, attribute.indexOf('_STATUS'));
    if (!attributePrefixes.includes(prefix)) {
      if (attributes.includes(`${prefix}_MONTHS`)) {
        attributePrefixes.push(prefix);
      }
    }
    return attributePrefixes;
  }, []);
  // change prefix order based on priority
  // determine priority by using survival status priority
  const statusAttributes = _.filter(clinicalAttributes, attribute => /_STATUS$/i.test(attribute.clinicalAttributeId));
  const priorityByPrefix = _.chain(statusAttributes)
    .keyBy(attribute => attribute.clinicalAttributeId.substring(0, attribute.clinicalAttributeId.indexOf('_STATUS')))
    .mapValues(attribute => Number(attribute.priority))
    .value();
  // return attribute prefixes by desc order based on priority
  return attributePrefixes.sort((attr1, attr2) => {
    const attr1Priority = RESERVED_SURVIVAL_PLOT_PRIORITY[attr1] || priorityByPrefix[attr1];
    const attr2Priority = RESERVED_SURVIVAL_PLOT_PRIORITY[attr2] || priorityByPrefix[attr2];
    return attr2Priority - attr1Priority;
  });
}
export async function fetchSurvivalDataExists(samples, survivalClinicalAttributesPrefix) {
  if (samples.length === 0) {
    return false;
  }
  const attributeNames = _.reduce(survivalClinicalAttributesPrefix, (attributeNames, prefix) => {
    attributeNames.push(prefix + '_STATUS');
    attributeNames.push(prefix + '_MONTHS');
    return attributeNames;
  }, []);
  if (attributeNames.length === 0) {
    return false;
  }
  const filter = {
    attributeIds: attributeNames,
    identifiers: samples.map((s) => ({
      entityId: s.patientId,
      studyId: s.studyId,
    })),
  };
  const count = await client
    .fetchClinicalDataUsingPOSTWithHttpInfo({
      clinicalDataType: 'PATIENT',
      clinicalDataMultiStudyFilter: filter,
      projection: 'META',
    })
    .then(function (response) {
      return parseInt(response.header['total-count'], 10);
    });
  return count > 0;
}
export function getAlterationTypesInOql(parsedQueryLines) {
  let haveMutInQuery = false;
  let haveStructuralVariantInQuery = false;
  let haveCnaInQuery = false;
  let haveMrnaInQuery = false;
  let haveProtInQuery = false;
  for (const queryLine of parsedQueryLines) {
    for (const alteration of queryLine.alterations || []) {
      haveMutInQuery =
        haveMutInQuery || alteration.alteration_type === 'mut';
      haveStructuralVariantInQuery =
        haveStructuralVariantInQuery ||
        alteration.alteration_type === 'fusion';
      haveCnaInQuery =
        haveCnaInQuery || alteration.alteration_type === 'cna';
      haveMrnaInQuery =
        haveMrnaInQuery || alteration.alteration_type === 'exp';
      haveProtInQuery =
        haveProtInQuery || alteration.alteration_type === 'prot';
    }
  }
  return {
    haveMutInQuery,
    haveStructuralVariantInQuery,
    haveCnaInQuery,
    haveMrnaInQuery,
    haveProtInQuery,
  };
}
export function getOqlMessages(parsedLines) {
  const unrecognizedMutations = _.flatten(parsedLines.map(result => {
    return (result.alterations || []).filter(alt => alt.alteration_type === 'mut' &&
      alt.info.unrecognized);
  }));
  return unrecognizedMutations.map(mutCommand => {
    return `Unrecognized input "${mutCommand.constr_val}" is interpreted as a mutation code.`;
  });
}
export function getDefaultProfilesForOql(profiles) {
  return _.mapValues(_.keyBy([
    AlterationTypeConstants.MUTATION_EXTENDED,
    AlterationTypeConstants.STRUCTURAL_VARIANT,
    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    AlterationTypeConstants.MRNA_EXPRESSION,
    AlterationTypeConstants.PROTEIN_LEVEL,
  ]), alterationType => profiles.find(profile => {
    return (profile.showProfileInAnalysisTab &&
      profile.molecularAlterationType === alterationType);
  }));
}
export function makeIsHotspotForOncoprint(remoteData) {
  // have to do it like this so that an error doesnt cause chain reaction of errors and app crash
  if (remoteData.isComplete) {
    const indexedHotspotData = remoteData.result;
    if (indexedHotspotData) {
      return Promise.resolve((mutation) => {
        return isLinearClusterHotspot(mutation, indexedHotspotData);
      });
    }
    else {
      return Promise.resolve(((mutation) => false));
    }
  }
  else if (remoteData.isError) {
    return Promise.resolve(new Error());
  }
  else {
    // pending: return endless promise to keep isHotspotForOncoprint pending
    return new Promise(() => { });
  }
}
export async function fetchOncoKbDataForOncoprint(oncoKbAnnotatedGenes, mutations) {
  if (getServerConfig().show_oncokb) {
    let result;
    try {
      result = await fetchOncoKbData({}, oncoKbAnnotatedGenes.result, mutations, 'ONCOGENIC');
    }
    catch (e) {
      result = new Error(ErrorMessages.ONCOKB_LOAD_ERROR);
    }
    return result;
  }
  else {
    return ONCOKB_DEFAULT;
  }
}
export async function fetchCnaOncoKbDataForOncoprint(oncoKbAnnotatedGenes, cnaMolecularData) {
  if (getServerConfig().show_oncokb) {
    let result;
    try {
      result = await fetchCnaOncoKbDataWithNumericGeneMolecularData({}, oncoKbAnnotatedGenes.result, cnaMolecularData, 'ONCOGENIC');
    }
    catch (e) {
      result = new Error();
    }
    return result;
  }
  else {
    return ONCOKB_DEFAULT;
  }
}
export function makeGetOncoKbMutationAnnotationForOncoprint(remoteData) {
  const oncoKbDataForOncoprint = remoteData.result;
  if (oncoKbDataForOncoprint instanceof Error) {
    return Promise.resolve(new Error());
  }
  else {
    return Promise.resolve((mutation) => {
      const uniqueSampleKeyToTumorType = {};
      const id = generateQueryVariantId(mutation.entrezGeneId, cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType), mutation.proteinChange, mutation.mutationType);
      return oncoKbDataForOncoprint.indicatorMap[id];
    });
  }
}
export function makeGetOncoKbCnaAnnotationForOncoprint(remoteData, oncoKb) {
  const cnaOncoKbDataForOncoprint = remoteData.result;
  if (cnaOncoKbDataForOncoprint instanceof Error) {
    return Promise.resolve(new Error());
  }
  else {
    return Promise.resolve((data) => {
      if (oncoKb) {
        const uniqueSampleKeyToTumorType = {};
        const id = generateQueryVariantId(data.entrezGeneId, cancerTypeForOncoKb(data.uniqueSampleKey, uniqueSampleKeyToTumorType), getAlterationString(data.value));
        return cnaOncoKbDataForOncoprint.indicatorMap[id];
      }
      else {
        return undefined;
      }
    });
  }
}
export function getSampleClinicalDataMapByThreshold(clinicalData, clinicalAttributeId, threshold) {
  return _.reduce(clinicalData, (acc, next) => {
    if (next.clinicalAttributeId === clinicalAttributeId) {
      const value = getNumericalClinicalDataValue(next);
      if (value && value >= threshold) {
        acc[next.sampleId] = next;
      }
    }
    return acc;
  }, {});
}
export function getSampleClinicalDataMapByKeywords(clinicalData, clinicalAttributeId, keywords) {
  return _.reduce(clinicalData, (acc, next) => {
    if (next.clinicalAttributeId === clinicalAttributeId) {
      if (keywords.includes(next.value)) {
        acc[next.sampleId] = next;
      }
    }
    return acc;
  }, {});
}
export function getNumericalClinicalDataValue(clinicalData) {
  if (Number.isNaN(clinicalData.value)) {
    return undefined;
  }
  else {
    return Number(clinicalData.value);
  }
}
export function getSampleNumericalClinicalDataValue(clinicalData, sampleId, clinicalAttributeId) {
  const sampleMsiData = clinicalData.find(clinical => clinical.clinicalAttributeId === clinicalAttributeId &&
    clinical.sampleId === sampleId);
  if (sampleMsiData) {
    return getNumericalClinicalDataValue(sampleMsiData);
  }
  return undefined;
}
export const OTHER_BIOMARKERS_CLINICAL_ATTR = {
  [OtherBiomarkersQueryType.MSIH]: CLINICAL_ATTRIBUTE_ID_ENUM.MSI_SCORE,
  [OtherBiomarkersQueryType.TMBH]: CLINICAL_ATTRIBUTE_ID_ENUM.TMB_SCORE,
};
export const OTHER_BIOMARKERS_QUERY_ID_SEPARATOR = '-&-';
export function getOtherBiomarkersQueryId(query) {
  return query.sampleId + OTHER_BIOMARKERS_QUERY_ID_SEPARATOR + query.type;
}
// Follow the format from method getOtherBiomarkersQueryId
export function parseOtherBiomarkerQueryId(queryId) {
  const queryIdParts = queryId.split(OTHER_BIOMARKERS_QUERY_ID_SEPARATOR);
  return {
    sampleId: queryIdParts[0],
    type: queryIdParts[1],
  };
}
export function getSampleTumorTypeMap(sampleClinicalData, studyCancerType) {
  const cancerType = sampleClinicalData.find(attr => attr.clinicalAttributeId === CLINICAL_ATTRIBUTE_ID_ENUM.CANCER_TYPE);
  const cancerTypeDetailed = sampleClinicalData.find(attr => attr.clinicalAttributeId ===
    CLINICAL_ATTRIBUTE_ID_ENUM.CANCER_TYPE_DETAILED);
  return {
    cancerType: cancerType === null || cancerType === void 0 ? void 0 : cancerType.value,
    cancerTypeDetailed: cancerTypeDetailed === null || cancerTypeDetailed === void 0 ? void 0 : cancerTypeDetailed.value,
    studyCancerType,
  };
}
export function tumorTypeResolver(cancerTypeMap) {
  return ((cancerTypeMap === null || cancerTypeMap === void 0 ? void 0 : cancerTypeMap.cancerTypeDetailed) ||
    (cancerTypeMap === null || cancerTypeMap === void 0 ? void 0 : cancerTypeMap.cancerType) ||
    (cancerTypeMap === null || cancerTypeMap === void 0 ? void 0 : cancerTypeMap.studyCancerType));
}
export const PUTATIVE_DRIVER = 'Putative_Driver';
export const PUTATIVE_PASSENGER = 'Putative_Passenger';
export function getOncoKbOncogenic(response) {
  if (ONCOKB_ONCOGENIC_LOWERCASE.indexOf((response.oncogenic || '').toLowerCase()) > -1) {
    return response.oncogenic;
  }
  else {
    return '';
  }
}
export function evaluatePutativeDriverInfoWithHotspots(event, oncoKbDatum, customDriverAnnotationsActive, customDriverTierSelection, hotspotInfo) {
  const hotspots = hotspotInfo.hotspotAnnotationsActive && hotspotInfo.hotspotDriver;
  return Object.assign(Object.assign({}, evaluatePutativeDriverInfo(event, oncoKbDatum, customDriverAnnotationsActive, customDriverTierSelection)), { hotspots });
}
export function evaluatePutativeDriverInfo(event, oncoKbDatum, customDriverAnnotationsActive, customDriverTierSelection) {
  const oncoKb = oncoKbDatum ? getOncoKbOncogenic(oncoKbDatum) : '';
  // Set driverFilter to true when:
  // (1) custom drivers active in settings menu
  // (2) the datum has a custom driver annotation
  const customDriverBinary = (customDriverAnnotationsActive &&
    event.driverFilter === PUTATIVE_DRIVER) ||
    false;
  // Set tier information to the tier name when the tiers checkbox
  // is selected for the corresponding tier of the datum in settings menu.
  // This forces the Mutation to be counted as a driver mutation.
  const customDriverTier = event.driverTiersFilter &&
    customDriverTierSelection &&
    customDriverTierSelection.get(event.driverTiersFilter)
    ? event.driverTiersFilter
    : undefined;
  return {
    oncoKb,
    customDriverBinary,
    customDriverTier,
  };
}
export function filterAndAnnotateMolecularData(molecularData, getPutativeDriverInfo, entrezGeneIdToGene, discreteCnaProfileIds) {
  const vus = [];
  const filteredAnnotatedCnaData = [];
  // will it work not to filter for molecular profile here?
  for (const datum of molecularData) {
    const annotatedDatum = annotateMolecularDatum(datum, getPutativeDriverInfo(datum), discreteCnaProfileIds);
    annotatedDatum.hugoGeneSymbol = (entrezGeneIdToGene[datum.entrezGeneId] || datum.gene).hugoGeneSymbol;
    const isVus = !annotatedDatum.putativeDriver;
    if (isVus) {
      vus.push(annotatedDatum);
    }
    else {
      filteredAnnotatedCnaData.push(annotatedDatum);
    }
  }
  return {
    data: filteredAnnotatedCnaData,
    vus,
  };
}
export function filterAndAnnotateMutations(mutations, getPutativeDriverInfo, entrezGeneIdToGene) {
  const vus = [];
  const germline = [];
  const vusAndGermline = [];
  const filteredAnnotatedMutations = [];
  for (const mutation of mutations) {
    const annotatedMutation = annotateMutationPutativeDriver(mutation, getPutativeDriverInfo(mutation)); // annotate
    annotatedMutation.hugoGeneSymbol = (entrezGeneIdToGene[mutation.entrezGeneId] || mutation.gene).hugoGeneSymbol;
    const isGermline = !isNotGermlineMutation(mutation);
    const isVus = !annotatedMutation.putativeDriver;
    if (isGermline && isVus) {
      vusAndGermline.push(annotatedMutation);
    }
    else if (isGermline) {
      germline.push(annotatedMutation);
    }
    else if (isVus) {
      vus.push(annotatedMutation);
    }
    else {
      filteredAnnotatedMutations.push(annotatedMutation);
    }
  }
  return {
    data: filteredAnnotatedMutations,
    vus,
    germline,
    vusAndGermline,
  };
}
export function buildProteinChange(sv) {
  const genes = [];
  if (sv.site1HugoSymbol) {
    genes.push(sv.site1HugoSymbol);
  }
  if (sv.site2HugoSymbol && sv.site1HugoSymbol !== sv.site2HugoSymbol) {
    genes.push(sv.site2HugoSymbol);
  }
  if (genes.length === 2) {
    return `${genes[0]}-${genes[1]} Fusion`;
  }
  else {
    return `${genes[0]} intragenic`;
  }
}
