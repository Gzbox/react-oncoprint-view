import { AlterationTypeConstants } from '../shared/constants';
import { isSample, isSampleList } from '../shared/lib/CBioPortalAPIUtils';
import { getSimplifiedMutationType } from '../shared/lib/oql/AccessorsForOqlFilter';
import _ from 'lodash';
import { MUTATION_STATUS_GERMLINE } from '../shared/constants';
import { SpecialAttribute } from '../shared/cache/ClinicalDataCache';
import { stringListToIndexSet } from 'cbioportal-frontend-commons';
const cnaDataToString = {
  '-2': 'homdel',
  '-1': 'hetloss',
  '0': undefined,
  '1': 'gain',
  '2': 'amp',
};
const mutRenderPriority = stringListToIndexSet([
  'trunc_rec',
  'splice_rec',
  'inframe_rec',
  'promoter_rec',
  'missense_rec',
  'other_rec',
  'trunc',
  'splice',
  'inframe',
  'promoter',
  'missense',
  'other',
]);
const svRenderPriority = {
  sv_rec: 0,
  sv: 1,
};
const cnaRenderPriority = {
  amp: 0,
  homdel: 0,
  gain: 1,
  hetloss: 1,
};
const mrnaRenderPriority = {
  high: 0,
  low: 0,
};
const protRenderPriority = {
  high: 0,
  low: 0,
};
export var OncoprintMutationTypeEnum;
(function (OncoprintMutationTypeEnum) {
  OncoprintMutationTypeEnum["MISSENSE"] = "missense";
  OncoprintMutationTypeEnum["INFRAME"] = "inframe";
  OncoprintMutationTypeEnum["FUSION"] = "fusion";
  OncoprintMutationTypeEnum["PROMOTER"] = "promoter";
  OncoprintMutationTypeEnum["TRUNC"] = "trunc";
  OncoprintMutationTypeEnum["SPLICE"] = "splice";
  OncoprintMutationTypeEnum["OTHER"] = "other";
  OncoprintMutationTypeEnum["STRUCTURAL_VARIANT"] = "structuralVariant";
})(OncoprintMutationTypeEnum || (OncoprintMutationTypeEnum = {}));
export function getOncoprintMutationType(d) {
  if ((d.proteinChange || '').toLowerCase() === 'promoter') {
    // promoter mutations aren't labeled as such in mutationType, but in proteinChange, so we must detect it there
    return 'promoter';
  }
  else {
    const simplifiedMutationType = getSimplifiedMutationType(d.mutationType);
    switch (simplifiedMutationType) {
      case 'missense':
      case 'inframe':
      case 'splice':
      case 'other':
        return simplifiedMutationType;
      default:
        return 'trunc';
    }
  }
}
export function selectDisplayValue(counts, priority) {
  const options = Object.keys(counts).map(k => ({
    key: k,
    value: counts[k],
  }));
  if (options.length > 0) {
    options.sort(function (kv1, kv2) {
      const rendering_priority_diff = priority[kv1.key] - priority[kv2.key];
      if (rendering_priority_diff < 0) {
        return -1;
      }
      else if (rendering_priority_diff > 0) {
        return 1;
      }
      else {
        if (kv1.value < kv2.value) {
          return 1;
        }
        else if (kv1.value > kv2.value) {
          return -1;
        }
        else {
          return 0;
        }
      }
    });
    return options[0].key;
  }
  else {
    return undefined;
  }
}
export function fillGeneticTrackDatum(
  // must already have all non-disp* fields except trackLabel and data
  newDatum, trackLabel, data) {
  newDatum.trackLabel = trackLabel;
  newDatum.data = data;
  const dispCnaCounts = {};
  const dispMrnaCounts = {};
  const dispProtCounts = {};
  const dispMutCounts = {};
  const dispGermline = {};
  const dispSvCounts = {};
  let structuralVariantCounts = 0;
  const caseInsensitiveGermlineMatch = new RegExp(MUTATION_STATUS_GERMLINE, 'i');
  for (const event of data) {
    const molecularAlterationType = event.molecularProfileAlterationType;
    switch (molecularAlterationType) {
      case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
        let oncoprintCnaType = cnaDataToString[event.value];
        if (oncoprintCnaType) {
          if (event.putativeDriver) {
            oncoprintCnaType += '_rec';
          }
          // not diploid
          dispCnaCounts[oncoprintCnaType] =
            dispCnaCounts[oncoprintCnaType] || 0;
          dispCnaCounts[oncoprintCnaType] += 1;
        }
        break;
      case AlterationTypeConstants.MRNA_EXPRESSION:
        if (event.alterationSubType) {
          const mrnaEvent = event.alterationSubType;
          dispMrnaCounts[mrnaEvent] = dispMrnaCounts[mrnaEvent] || 0;
          dispMrnaCounts[mrnaEvent] += 1;
        }
        break;
      case AlterationTypeConstants.PROTEIN_LEVEL:
        if (event.alterationSubType) {
          const protEvent = event.alterationSubType;
          dispProtCounts[protEvent] = dispProtCounts[protEvent] || 0;
          dispProtCounts[protEvent] += 1;
        }
        break;
      case AlterationTypeConstants.MUTATION_EXTENDED:
        let oncoprintMutationType = getOncoprintMutationType(event);
        if (event.putativeDriver) {
          oncoprintMutationType += '_rec';
        }
        dispGermline[oncoprintMutationType] =
          dispGermline[oncoprintMutationType] ||
          caseInsensitiveGermlineMatch.test(event.mutationStatus);
        dispMutCounts[oncoprintMutationType] =
          dispMutCounts[oncoprintMutationType] || 0;
        dispMutCounts[oncoprintMutationType] += 1;
        break;
      case AlterationTypeConstants.STRUCTURAL_VARIANT:
        let type;
        if (event.putativeDriver) {
          type = 'sv_rec';
        }
        else {
          type = 'sv';
        }
        dispSvCounts[type] = dispSvCounts[type] || 0;
        dispSvCounts[type] += 1;
        break;
    }
  }
  newDatum.disp_structuralVariant = selectDisplayValue(dispSvCounts, svRenderPriority);
  newDatum.disp_cna = selectDisplayValue(dispCnaCounts, cnaRenderPriority);
  newDatum.disp_mrna = selectDisplayValue(dispMrnaCounts, mrnaRenderPriority);
  newDatum.disp_prot = selectDisplayValue(dispProtCounts, protRenderPriority);
  newDatum.disp_mut = selectDisplayValue(dispMutCounts, mutRenderPriority);
  newDatum.disp_germ = newDatum.disp_mut
    ? dispGermline[newDatum.disp_mut]
    : undefined;
  return newDatum; // return for convenience, even though changes made in place
}
export function makeGeneticTrackData(caseAggregatedAlterationData, hugoGeneSymbols, cases, genePanelInformation, selectedMolecularProfiles) {
  if (!cases.length) {
    return [];
  }
  const geneSymbolArray = hugoGeneSymbols instanceof Array ? hugoGeneSymbols : [hugoGeneSymbols];
  const _selectedMolecularProfiles = _.keyBy(selectedMolecularProfiles, p => p.molecularProfileId);
  const ret = [];
  if (isSampleList(cases)) {
    // case: Samples
    for (const sample of cases) {
      const newDatum = {};
      newDatum.sample = sample.sampleId;
      newDatum.patient = sample.patientId;
      newDatum.study_id = sample.studyId;
      newDatum.uid = sample.uniqueSampleKey;
      const sampleSequencingInfo = genePanelInformation.samples[sample.uniqueSampleKey];
      newDatum.profiled_in = _.flatMap(geneSymbolArray, hugoGeneSymbol => sampleSequencingInfo.byGene[hugoGeneSymbol] || []);
      newDatum.profiled_in = newDatum.profiled_in
        .concat(sampleSequencingInfo.allGenes)
        .filter(p => !!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
      if (!newDatum.profiled_in.length) {
        newDatum.na = true;
      }
      newDatum.not_profiled_in = _.flatMap(geneSymbolArray, hugoGeneSymbol => sampleSequencingInfo.notProfiledByGene[hugoGeneSymbol] || []);
      newDatum.not_profiled_in = newDatum.not_profiled_in
        .concat(sampleSequencingInfo.notProfiledAllGenes)
        .filter(p => !!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
      const sampleData = caseAggregatedAlterationData[sample.uniqueSampleKey] || [];
      ret.push(fillGeneticTrackDatum(newDatum, geneSymbolArray.join(' / '), sampleData));
    }
  }
  else {
    // case: Patients
    for (const patient of cases) {
      const newDatum = {};
      newDatum.patient = patient.patientId;
      newDatum.study_id = patient.studyId;
      newDatum.uid = patient.uniquePatientKey;
      const patientSequencingInfo = genePanelInformation.patients[patient.uniquePatientKey];
      newDatum.profiled_in = _.flatMap(geneSymbolArray, hugoGeneSymbol => patientSequencingInfo.byGene[hugoGeneSymbol] || []);
      newDatum.profiled_in = newDatum.profiled_in
        .concat(patientSequencingInfo.allGenes)
        .filter(p => !!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
      if (!newDatum.profiled_in.length) {
        newDatum.na = true;
      }
      newDatum.not_profiled_in = _.flatMap(geneSymbolArray, hugoGeneSymbol => patientSequencingInfo.notProfiledByGene[hugoGeneSymbol] ||
        []);
      newDatum.not_profiled_in = newDatum.not_profiled_in
        .concat(patientSequencingInfo.notProfiledAllGenes)
        .filter(p => !!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
      const patientData = caseAggregatedAlterationData[patient.uniquePatientKey] || [];
      ret.push(fillGeneticTrackDatum(newDatum, geneSymbolArray.join(' / '), patientData));
    }
  }
  return ret;
}
export function fillHeatmapTrackDatum(trackDatum, featureKey, featureId, case_, data, sortOrder) {
  trackDatum[featureKey] = featureId;
  trackDatum.study_id = case_.studyId;
  // remove data points of which `value` is NaN
  const dataWithValue = _.filter(data, d => !isNaN(d.value));
  if (!dataWithValue || !dataWithValue.length) {
    trackDatum.profile_data = null;
    trackDatum.na = true;
  }
  else if (dataWithValue.length === 1) {
    trackDatum.profile_data = dataWithValue[0].value;
    if (dataWithValue[0].thresholdType) {
      trackDatum.thresholdType = dataWithValue[0].thresholdType;
      trackDatum.category =
        trackDatum.profile_data && trackDatum.thresholdType
          ? `${trackDatum.thresholdType}${trackDatum.profile_data.toFixed(2)}`
          : undefined;
    }
  }
  else {
    if (isSample(case_)) {
      throw Error('Unexpectedly received multiple heatmap profile data for one sample');
    }
    else {
      // aggregate samples for this patient by selecting the highest absolute (Z-)score
      // default: the most extreme value (pos. or neg.) is shown for data
      // sortOrder=ASC: the smallest value is shown for data
      // sortOrder=DESC: the largest value is shown for data
      let representingDatum;
      let bestValue;
      switch (sortOrder) {
        case 'ASC':
          bestValue = _(dataWithValue)
            .map((d) => d.value)
            .min();
          representingDatum = selectRepresentingDataPoint(bestValue, dataWithValue, false);
          break;
        case 'DESC':
          bestValue = _(dataWithValue)
            .map((d) => d.value)
            .max();
          representingDatum = selectRepresentingDataPoint(bestValue, dataWithValue, false);
          break;
        default:
          bestValue = _.maxBy(dataWithValue, (d) => Math.abs(d.value)).value;
          representingDatum = selectRepresentingDataPoint(bestValue, dataWithValue, true);
          break;
      }
      // `data` can contain data points with only NaN values
      // this is detected by `representingDatum` to be undefined
      // in that case select the first element as representing datum
      if (representingDatum === undefined) {
        representingDatum = dataWithValue[0];
      }
      trackDatum.profile_data = representingDatum.value;
      if (representingDatum.thresholdType) {
        trackDatum.thresholdType = representingDatum.thresholdType;
        trackDatum.category = trackDatum.thresholdType
          ? `${trackDatum.thresholdType}${trackDatum.profile_data.toFixed(2)}`
          : undefined;
      }
    }
  }
  return trackDatum;
}
function selectRepresentingDataPoint(bestValue, data, useAbsolute) {
  const fFilter = useAbsolute
    ? (d) => Math.abs(d.value) === bestValue
    : (d) => d.value === bestValue;
  const selData = _.filter(data, fFilter);
  const selDataNoTreshold = _.filter(selData, (d) => !d.thresholdType);
  if (selDataNoTreshold.length > 0) {
    return selDataNoTreshold[0];
  }
  else {
    return selData[0];
  }
}
function fillCategoricalTrackDatum(newDatum, data, entityId, profile) {
  newDatum.profile_name = profile.name;
  newDatum.study_id = profile.studyId;
  newDatum.entity = entityId;
  newDatum.attr_val_counts = _.countBy(data, d => d.value);
  const attr_vals = Object.keys(newDatum.attr_val_counts);
  switch (attr_vals.length) {
    case 0:
      newDatum.na = true;
      break;
    case 1:
      newDatum.attr_val = attr_vals[0];
      break;
    default:
      newDatum.attr_val = 'Mixed';
      break;
  }
}
export function makeCategoricalTrackData(profile, entityId, cases, data) {
  let ret;
  let keyToData;
  if (isSampleList(cases)) {
    // if sample list, then make one oncoprint datum per sample
    keyToData = _.groupBy(data, (d) => d.uniqueSampleKey);
    ret = cases.map(c => {
      const trackDatum = {};
      trackDatum.sample = c.sampleId;
      trackDatum.patient = c.patientId;
      trackDatum.uid = c.uniqueSampleKey;
      fillCategoricalTrackDatum(trackDatum, keyToData[c.uniqueSampleKey], entityId, profile);
      return trackDatum;
    });
  }
  else {
    // if patient list, then make one oncoprint datum per patient
    keyToData = _.groupBy(data, (d) => d.uniquePatientKey);
    ret = cases.map(c => {
      const trackDatum = {};
      trackDatum.patient = c.patientId;
      trackDatum.uid = c.uniquePatientKey;
      fillCategoricalTrackDatum(trackDatum, keyToData[c.uniquePatientKey], entityId, profile);
      return trackDatum;
    });
  }
  return ret;
}
export function makeHeatmapTrackData(featureKey, featureId, cases, data, sortOrder) {
  if (!cases.length) {
    return [];
  }
  const sampleData = isSampleList(cases);
  let keyToData;
  let ret;
  if (isSampleList(cases)) {
    keyToData = _.groupBy(data, d => d.uniqueSampleKey);
    ret = cases.map(c => {
      const trackDatum = {};
      trackDatum.sample = c.sampleId;
      trackDatum.uid = c.uniqueSampleKey;
      const caseData = keyToData[c.uniqueSampleKey];
      fillHeatmapTrackDatum(trackDatum, featureKey, featureId, c, caseData);
      return trackDatum;
    });
  }
  else {
    keyToData = _.groupBy(data, d => d.uniquePatientKey);
    ret = cases.map(c => {
      const trackDatum = {};
      trackDatum.patient = c.patientId;
      trackDatum.uid = c.uniquePatientKey;
      const caseData = keyToData[c.uniquePatientKey];
      fillHeatmapTrackDatum(trackDatum, featureKey, featureId, c, caseData, sortOrder);
      return trackDatum;
    });
  }
  return ret;
}
function fillNoDataValue(trackDatum, attribute) {
  if (attribute.clinicalAttributeId === 'MUTATION_COUNT') {
    trackDatum.attr_val = 0;
  }
  else {
    trackDatum.na = true;
  }
}
export function fillClinicalTrackDatum(trackDatum, attribute, case_, data) {
  trackDatum.attr_id = attribute.clinicalAttributeId;
  trackDatum.study_id = case_.studyId;
  trackDatum.attr_val_counts = {};
  if (!data || !data.length) {
    fillNoDataValue(trackDatum, attribute);
  }
  else {
    if (attribute.datatype.toLowerCase() === 'number') {
      let values = [];
      for (const x of data) {
        const newVal = parseFloat(x.value + '');
        if (!isNaN(newVal)) {
          values.push(newVal);
        }
      }
      if (values.length === 0) {
        fillNoDataValue(trackDatum, attribute);
      }
      else {
        switch (attribute.clinicalAttributeId) {
          case 'MUTATION_COUNT':
            // max
            trackDatum.attr_val = values.reduce((max, nextVal) => Math.max(max, nextVal), Number.NEGATIVE_INFINITY);
            break;
          default:
            // average
            trackDatum.attr_val =
              values.reduce((sum, nextVal) => sum + nextVal, 0) /
              values.length;
            break;
        }
        trackDatum.attr_val_counts[trackDatum.attr_val] = 1;
      }
    }
    else if (attribute.datatype.toLowerCase() === 'string') {
      const attr_val_counts = trackDatum.attr_val_counts;
      for (const datum of data) {
        attr_val_counts[datum.value] =
          attr_val_counts[datum.value] || 0;
        attr_val_counts[datum.value] += 1;
      }
      const attr_vals = Object.keys(attr_val_counts);
      if (attr_vals.length > 1) {
        trackDatum.attr_val = 'Mixed';
      }
      else {
        trackDatum.attr_val = attr_vals[0];
      }
    }
    else if (attribute.clinicalAttributeId === SpecialAttribute.MutationSpectrum) {
      const spectrumData = data;
      // add up vectors
      const attr_val_counts = trackDatum.attr_val_counts;
      attr_val_counts['C>A'] = 0;
      attr_val_counts['C>G'] = 0;
      attr_val_counts['C>T'] = 0;
      attr_val_counts['T>A'] = 0;
      attr_val_counts['T>C'] = 0;
      attr_val_counts['T>G'] = 0;
      for (const datum of spectrumData) {
        attr_val_counts['C>A'] += datum.CtoA;
        attr_val_counts['C>G'] += datum.CtoG;
        attr_val_counts['C>T'] += datum.CtoT;
        attr_val_counts['T>A'] += datum.TtoA;
        attr_val_counts['T>C'] += datum.TtoC;
        attr_val_counts['T>G'] += datum.TtoG;
      }
      // if all 0, then NA
      if (attr_val_counts['C>A'] === 0 &&
        attr_val_counts['C>G'] === 0 &&
        attr_val_counts['C>T'] === 0 &&
        attr_val_counts['T>A'] === 0 &&
        attr_val_counts['T>C'] === 0 &&
        attr_val_counts['T>G'] === 0) {
        fillNoDataValue(trackDatum, attribute);
      }
      trackDatum.attr_val = trackDatum.attr_val_counts;
    }
  }
  return trackDatum;
}
function makeGetDataForCase(attribute, queryBy, data) {
  if (attribute.patientAttribute) {
    const uniqueKeyToData = _.groupBy(data, datum => datum.uniquePatientKey);
    return function (case_) {
      return uniqueKeyToData[case_.uniquePatientKey];
    };
  }
  else {
    const getKey = queryBy === 'sample'
      ? (x) => x.uniqueSampleKey
      : (x) => x.uniquePatientKey;
    const uniqueKeyToData = _.groupBy(data, getKey);
    return function (case_) {
      return uniqueKeyToData[getKey(case_)];
    };
  }
}
export function makeClinicalTrackData(attribute, cases, data) {
  // First collect all the data by id
  const uniqueKeyToData = _.groupBy(data, isSampleList(cases)
    ? datum => datum.uniqueSampleKey
    : datum => datum.uniquePatientKey);
  // Create oncoprint data
  const getDataForCase = makeGetDataForCase(attribute, isSampleList(cases) ? 'sample' : 'patient', data);
  let ret;
  if (isSampleList(cases)) {
    ret = cases.map(sample => {
      const trackDatum = {};
      trackDatum.uid = sample.uniqueSampleKey;
      trackDatum.sample = sample.sampleId;
      fillClinicalTrackDatum(trackDatum, attribute, sample, getDataForCase(sample));
      return trackDatum;
    });
  }
  else {
    ret = cases.map(patient => {
      const trackDatum = {};
      trackDatum.uid = patient.uniquePatientKey;
      trackDatum.patient = patient.patientId;
      fillClinicalTrackDatum(trackDatum, attribute, patient, getDataForCase(patient));
      return trackDatum;
    });
  }
  return ret;
}
