import { remoteData } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { RuleSetType } from 'oncoprintjs';
import {
  clinicalAttributeIsPROFILEDIN,
  MUTATION_SPECTRUM_CATEGORIES,
  MUTATION_SPECTRUM_FILLS,
  SpecialAttribute,
} from '../shared/cache/ClinicalDataCache';
import { AlterationTypeConstants } from '../shared/constants';
import {
  hexToRGBA,
  RESERVED_CLINICAL_VALUE_COLORS,
} from '../shared/lib/Colors';
import ifNotDefined from '../shared/lib/ifNotDefined';
import { isMergedTrackFilter } from '../shared/lib/oql/oqlfilter';
import { makeClinicalTrackData, makeGeneticTrackData } from './DataUtils';
import {
  genetic_rule_set_different_colors_no_recurrence,
  genetic_rule_set_different_colors_recurrence,
  genetic_rule_set_same_color_for_all_no_recurrence,
  genetic_rule_set_same_color_for_all_recurrence,
  germline_rule_params,
} from './geneticrules';

function formatGeneticTrackSublabel(oqlFilter) {
  if (isMergedTrackFilter(oqlFilter)) {
    return ''; // no oql sublabel for merged tracks - too cluttered
  } else {
    return oqlFilter.oql_line.substring(oqlFilter.gene.length).replace(';', ''); // get rid of gene in beginning of OQL line, and semicolon at end
  }
}
function formatGeneticTrackLabel(oqlFilter) {
  return isMergedTrackFilter(oqlFilter)
    ? oqlFilter.label ||
        oqlFilter.list.map((geneLine) => geneLine.gene).join(' / ')
    : oqlFilter.gene;
}
function formatGeneticTrackOql(oqlFilter) {
  return isMergedTrackFilter(oqlFilter)
    ? `[${oqlFilter.list.map((geneLine) => geneLine.oql_line).join(' ')}]`
    : oqlFilter.oql_line;
}
export function getHeatmapTrackRuleSetParams(trackSpec) {
  let value_range;
  let legend_label;
  let colors;
  let value_stop_points;
  let null_legend_label = '';
  let na_legend_label = '';
  switch (trackSpec.molecularAlterationType) {
    case AlterationTypeConstants.GENERIC_ASSAY:
      return getGenericAssayTrackRuleSetParams(trackSpec);
      break;
    case AlterationTypeConstants.METHYLATION:
      value_range = [0, 1];
      legend_label = trackSpec.legendLabel || 'Methylation Heatmap';
      value_stop_points = [0, 0.35, 1];
      colors = [
        [0, 0, 255, 1],
        [255, 255, 255, 1],
        [255, 0, 0, 1],
      ];
      break;
    case AlterationTypeConstants.MUTATION_EXTENDED:
      value_range = [0, 1];
      legend_label = trackSpec.legendLabel || 'VAF Heatmap';
      null_legend_label = 'Not mutated/no VAF data';
      na_legend_label = 'Not sequenced';
      value_stop_points = [0, 1];
      colors = [
        [241, 242, 181, 1],
        [19, 80, 88, 1],
      ];
      break;
    default:
      value_range = [-3, 3];
      legend_label = trackSpec.legendLabel || 'Expression Heatmap';
      value_stop_points = [-3, 0, 3];
      colors = [
        [0, 0, 255, 1],
        [0, 0, 0, 1],
        [255, 0, 0, 1],
      ];
      break;
  }
  return {
    type: RuleSetType.GRADIENT,
    legend_label,
    value_key: 'profile_data',
    value_range,
    colors,
    value_stop_points,
    null_color: [224, 224, 224, 1],
    null_legend_label,
    na_legend_label,
    na_shapes: trackSpec.customNaShapes,
  };
}
export const legendColorDarkBlue = [0, 114, 178, 1];
export const legendColorLightBlue = [204, 236, 255, 1];
export const legendColorDarkRed = [213, 94, 0, 1];
export const legendColorLightRed = [255, 226, 204, 1];
export function getGenericAssayTrackRuleSetParams(trackSpec) {
  let value_range;
  let legend_label;
  let colors;
  let value_stop_points;
  let category_to_color;
  // - Legends for generic assay entities can be configured in two ways:
  //      1. Smaller values are `important` and darker blue (a.k.a. ASC sort order)
  //      2. Larger values are `important` and darker blue (a.k.a. DESC sort order)
  // - The pivot threshold denotes an arbitrary boundary between important (in red)
  //   and unimportant (in blue) values. When a pivot threshold is defined blue
  //   and red gradient to white at the pivotThreshold value.
  // - The most extreme value in the legend is should be the largest value in the
  //   current track group. It is passed in alongside other track specs (if possible).
  // - When the most extreme value does not reach the pivotThreshold (if defined),
  //   the pivotThreshold is included in the legend as the most extreme value.
  legend_label = trackSpec.legendLabel || `${trackSpec.molecularProfileName}`;
  const dataPoints = trackSpec.data;
  const pivotThreshold = trackSpec.pivotThreshold;
  const sortOrder = trackSpec.sortOrder;
  const categoryColorOptions = [
    [240, 228, 66, 1],
    [0, 158, 115, 1],
    [204, 121, 167, 1],
    [0, 0, 0, 1],
  ];
  let maxValue = trackSpec.maxProfileValue;
  let minValue = trackSpec.minProfileValue;
  if (maxValue === undefined || minValue === undefined) {
    let dataMax = Number.NEGATIVE_INFINITY;
    let dataMin = Number.POSITIVE_INFINITY;
    for (const d of trackSpec.data) {
      if (d.profile_data !== null) {
        dataMax = Math.max(d.profile_data, dataMax);
        dataMin = Math.min(d.profile_data, dataMin);
      }
    }
    maxValue = ifNotDefined(maxValue, dataMax);
    minValue = ifNotDefined(minValue, dataMin);
  }
  if (pivotThreshold !== undefined) {
    maxValue = Math.max(maxValue, pivotThreshold);
    minValue = Math.min(minValue, pivotThreshold);
  }
  // When all observed values are negative or positive
  // assume that 0 should be used in the legend.
  const rightBoundaryValue = Math.max(0, maxValue);
  const leftBoundaryValue = Math.min(0, minValue);
  value_range = [leftBoundaryValue, rightBoundaryValue]; // smaller concentrations are more `important` (ASC)
  value_stop_points = [leftBoundaryValue, rightBoundaryValue];
  if (pivotThreshold === undefined || maxValue === pivotThreshold) {
    // all values are smaller than pivot threshold
    colors = [legendColorDarkBlue, legendColorLightBlue];
  } else if (minValue === pivotThreshold) {
    // all values are larger than pivot threshold
    colors = [legendColorLightRed, legendColorDarkRed];
  } else {
    // pivot threshold lies in the middle of al values
    colors = [
      legendColorDarkBlue,
      legendColorLightBlue,
      legendColorLightRed,
      legendColorDarkRed,
    ];
    if (pivotThreshold <= leftBoundaryValue) {
      // when data points do not bracket the pivotThreshold, add an artificial left boundary in the legend
      value_stop_points = [
        pivotThreshold - (rightBoundaryValue - pivotThreshold),
        pivotThreshold,
        pivotThreshold,
        rightBoundaryValue,
      ];
    } else if (pivotThreshold >= rightBoundaryValue) {
      // when data points do not bracket the pivotThreshold, add an artificial right boundary in the legend
      value_stop_points = [
        leftBoundaryValue,
        pivotThreshold,
        pivotThreshold,
        pivotThreshold + (pivotThreshold - leftBoundaryValue),
      ];
    } else {
      value_stop_points = [
        leftBoundaryValue,
        pivotThreshold,
        pivotThreshold,
        rightBoundaryValue,
      ];
    }
  }
  if (sortOrder === 'DESC') {
    // larger concentrations are more `important` (DESC)
    colors = _.reverse(colors);
  }
  let counter = 0;
  const categories = _(dataPoints)
    .filter((d) => !!d.category)
    .map((d) => d.category)
    .uniq()
    .value();
  categories.forEach((d) => {
    if (category_to_color === undefined) {
      category_to_color = {};
    }
    category_to_color[d] = categoryColorOptions[counter++];
    if (counter === categoryColorOptions.length) {
      counter = 0;
    }
  });
  return {
    type: RuleSetType.GRADIENT_AND_CATEGORICAL,
    legend_label,
    value_key: 'profile_data',
    value_range,
    colors,
    value_stop_points,
    null_color: [224, 224, 224, 1],
    category_key: 'category',
    category_to_color: category_to_color,
  };
}
export function getGenesetHeatmapTrackRuleSetParams() {
  return {
    type: RuleSetType.GRADIENT,
    legend_label: 'Gene Set Heatmap',
    value_key: 'profile_data',
    value_range: [-1, 1],
    /*
     * The PiYG colormap is based on color specifications and designs
     * developed by Cynthia Brewer (http://colorbrewer.org).
     * The palette has been included under the terms
     * of an Apache-style license.
     */
    colors: [
      [39, 100, 25, 1],
      [77, 146, 33, 1],
      [127, 188, 65, 1],
      [184, 225, 134, 1],
      [230, 245, 208, 1],
      [247, 247, 247, 1],
      [253, 224, 239, 1],
      [241, 182, 218, 1],
      [222, 119, 174, 1],
      [197, 27, 125, 1],
      [142, 1, 82, 1],
    ],
    value_stop_points: [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1],
    null_color: [224, 224, 224, 1],
  };
}
export function getGeneticTrackRuleSetParams(
  distinguishMutationType,
  distinguishDrivers,
  distinguishGermlineMutations,
) {
  let rule_set;
  if (!distinguishMutationType && !distinguishDrivers) {
    rule_set = genetic_rule_set_same_color_for_all_no_recurrence;
  } else if (!distinguishMutationType && distinguishDrivers) {
    rule_set = genetic_rule_set_same_color_for_all_recurrence;
  } else if (distinguishMutationType && !distinguishDrivers) {
    rule_set = genetic_rule_set_different_colors_no_recurrence;
  } else {
    rule_set = genetic_rule_set_different_colors_recurrence;
  }
  rule_set = _.cloneDeep(rule_set);
  if (distinguishGermlineMutations) {
    Object.assign(rule_set.rule_params.conditional, germline_rule_params);
  }
  return rule_set;
}
export function getClinicalTrackRuleSetParamsFn(track) {
  let params;
  switch (track.datatype) {
    case 'number':
      params = {
        type: RuleSetType.BAR,
        value_key: 'attr_val',
        value_range: track.numberRange,
        log_scale: track.numberLogScale,
      };
      break;
    case 'counts':
      params = {
        type: RuleSetType.STACKED_BAR,
        value_key: 'attr_val',
        categories: track.countsCategoryLabels,
        fills: track.countsCategoryFills,
      };
      break;
    case 'string':
    default:
      params = {
        type: RuleSetType.CATEGORICAL,
        category_key: 'attr_val',
        category_to_color: Object.assign(
          {},
          track.category_to_color,
          _.mapValues(RESERVED_CLINICAL_VALUE_COLORS, hexToRGBA),
        ),
        universal_rule_categories: track.universal_rule_categories,
      };
      break;
  }
  return params;
}
export function getCategoricalTrackRuleSetParams(track) {
  return {
    type: RuleSetType.CATEGORICAL,
    legend_label: track.molecularProfileName,
    category_key: 'attr_val',
    category_to_color: _.mapValues(RESERVED_CLINICAL_VALUE_COLORS, hexToRGBA),
  };
}
export function percentAltered(altered, sequenced) {
  if (sequenced === 0) {
    return 'N/P';
  }
  const p = altered / sequenced;
  const percent = 100 * p;
  let fixed;
  if (p < 0.03) {
    // if less than 3%, use one decimal digit
    fixed = percent.toFixed(1);
    // if last digit is a 0, use no decimal digits
    if (fixed[fixed.length - 1] === '0') {
      fixed = percent.toFixed();
    }
  } else {
    fixed = percent.toFixed();
  }
  return fixed + '%';
}
function getAlterationInfoSequenced(
  sampleMode,
  oql,
  sequencedSampleKeysByGene,
  sequencedPatientKeysByGene,
) {
  const geneSymbolArray = oql instanceof Array ? oql : [oql.gene];
  const sequenced = sampleMode
    ? _.uniq(
        _.flatMap(
          geneSymbolArray,
          (symbol) => sequencedSampleKeysByGene[symbol],
        ),
      ).length
    : _.uniq(
        _.flatMap(
          geneSymbolArray,
          (symbol) => sequencedPatientKeysByGene[symbol],
        ),
      ).length;
  return sequenced;
}
export function alterationInfoForOncoprintTrackData(
  sampleMode,
  data,
  sequencedSampleKeysByGene,
  sequencedPatientKeysByGene,
) {
  const sequenced = getAlterationInfoSequenced(
    sampleMode,
    data.oql,
    sequencedSampleKeysByGene,
    sequencedPatientKeysByGene,
  );
  const altered = _.sumBy(data.trackData, (d) => +isAltered(d));
  const percent = percentAltered(altered, sequenced);
  return {
    sequenced,
    altered,
    percent,
  };
}
export function alterationInfoForCaseAggregatedDataByOQLLine(
  sampleMode,
  data,
  sequencedSampleKeysByGene,
  sequencedPatientKeysByGene,
) {
  const sequenced = getAlterationInfoSequenced(
    sampleMode,
    data.oql,
    sequencedSampleKeysByGene,
    sequencedPatientKeysByGene,
  );
  const altered = sampleMode
    ? Object.keys(data.cases.samples).filter(
        (k) => !!data.cases.samples[k].length,
      ).length
    : Object.keys(data.cases.patients).filter(
        (k) => !!data.cases.patients[k].length,
      ).length;
  const percent = percentAltered(altered, sequenced);
  return {
    sequenced,
    altered,
    percent,
  };
}
function isAltered(d) {
  return d.data.length > 0;
}
export function getAlteredUids(tracks) {
  const isAlteredMap = {};
  for (const track of tracks) {
    for (const d of track.data) {
      if (isAltered(d)) {
        isAlteredMap[d.uid] = true;
      }
    }
  }
  return Object.keys(isAlteredMap);
}
export function getAlterationData(
  samples,
  patients,
  coverageInformation,
  sequencedSampleKeysByGene,
  sequencedPatientKeysByGene,
  selectedMolecularProfiles,
  caseData,
  isQueriedGeneSampling,
  queryGenes,
) {
  const sampleMode = false;
  const oql = caseData.oql;
  const geneSymbolArray = isMergedTrackFilter(oql)
    ? oql.list.map(({ gene }) => gene)
    : [oql.gene];
  const dataByCase = caseData.cases;
  const data = makeGeneticTrackData(
    dataByCase.patients,
    geneSymbolArray,
    patients,
    coverageInformation,
    selectedMolecularProfiles,
  );
  const alterationInfo = alterationInfoForOncoprintTrackData(
    sampleMode,
    { trackData: data, oql: geneSymbolArray },
    sequencedSampleKeysByGene,
    sequencedPatientKeysByGene,
  );
  if (
    isQueriedGeneSampling ||
    !queryGenes.map((gene) => gene.hugoGeneSymbol).includes(oql.gene)
  ) {
    return {
      gene: oql.gene,
      altered: alterationInfo.altered,
      sequenced: alterationInfo.sequenced,
      percentAltered: alterationInfo.percent,
    };
  } else {
    return undefined;
  }
}
export function getUnalteredUids(tracks) {
  const allUids = _.chain(tracks)
    .map((spec) => spec.data.map((d) => d.uid))
    .flatten()
    .uniq()
    .value();
  return _.difference(allUids, getAlteredUids(tracks));
}
export function makeGeneticTrackWith({
  sampleMode,
  oncoprint,
  samples,
  patients,
  coverageInformation,
  sequencedSampleKeysByGene,
  sequencedPatientKeysByGene,
  selectedMolecularProfiles,
  expansionIndexMap,
}) {
  return function makeTrack(
    caseData, // the & is to get around annoying TS error -- its never passed in, as the `never` type indicates
    index,
    parentKey,
  ) {
    const oql = caseData.oql;
    const geneSymbolArray = isMergedTrackFilter(oql)
      ? oql.list.map(({ gene }) => gene)
      : [oql.gene];
    const dataByCase = caseData.cases;
    const data = sampleMode
      ? makeGeneticTrackData(
          dataByCase.samples,
          geneSymbolArray,
          samples,
          coverageInformation,
          selectedMolecularProfiles,
        )
      : makeGeneticTrackData(
          dataByCase.patients,
          geneSymbolArray,
          patients,
          coverageInformation,
          selectedMolecularProfiles,
        );
    const alterationInfo = alterationInfoForOncoprintTrackData(
      sampleMode,
      { trackData: data, oql: geneSymbolArray },
      sequencedSampleKeysByGene,
      sequencedPatientKeysByGene,
    );
    const trackKey =
      parentKey === undefined
        ? `GENETICTRACK_${index}`
        : `${parentKey}_EXPANSION_${index}`;
    const expansionCallback = isMergedTrackFilter(oql)
      ? () => {
          expansionIndexMap.set(trackKey, _.range(oql.list.length));
        }
      : undefined;
    const removeCallback =
      parentKey !== undefined
        ? () => {
            expansionIndexMap.get(parentKey).remove(index);
          }
        : undefined;
    let expansions = [];
    if (caseData.mergedTrackOqlList) {
      const subTrackData = caseData.mergedTrackOqlList;
      expansions = (expansionIndexMap.get(trackKey) || []).map(
        (expansionIndex) =>
          makeTrack(subTrackData[expansionIndex], expansionIndex, trackKey),
      );
    }
    let info = alterationInfo.percent;
    let infoTooltip = undefined;
    if (alterationInfo.sequenced !== 0) {
      // show tooltip explaining percent calculation, as long as its not N/P
      infoTooltip = `altered / profiled = ${alterationInfo.altered} / ${alterationInfo.sequenced}`;
    }
    if (
      alterationInfo.sequenced > 0 &&
      alterationInfo.sequenced < (sampleMode ? samples : patients).length
    ) {
      // add asterisk to percentage if not all samples/patients are profiled for this track
      // dont add asterisk if none are profiled
      info = `${info}*`;
    }
    return {
      key: trackKey,
      label:
        (parentKey !== undefined ? '  ' : '') + formatGeneticTrackLabel(oql),
      sublabel: formatGeneticTrackSublabel(oql),
      labelColor: parentKey !== undefined ? 'grey' : undefined,
      oql: formatGeneticTrackOql(oql),
      info,
      infoTooltip,
      data,
      expansionCallback,
      removeCallback,
      expansionTrackList: expansions.length ? expansions : undefined,
      customOptions: [
        { separator: true },
        {
          label: 'Sort by genes',
          onClick: oncoprint.clearSortDirectionsAndSortByData,
        },
      ],
    };
  };
}
export function makeGeneticTracksMobxPromise(oncoprint, sampleMode) {
  return remoteData({
    await: () => [
      oncoprint.props.store.filteredSamples,
      oncoprint.props.store.filteredPatients,
      oncoprint.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
      oncoprint.props.store.coverageInformation,
      oncoprint.props.store.filteredSequencedSampleKeysByGene,
      oncoprint.props.store.filteredSequencedPatientKeysByGene,
      oncoprint.props.store.selectedMolecularProfiles,
    ],
    invoke: async () => {
      const trackFunction = makeGeneticTrackWith({
        sampleMode,
        oncoprint,
        samples: oncoprint.props.store.filteredSamples.result,
        patients: oncoprint.props.store.filteredPatients.result,
        coverageInformation: oncoprint.props.store.coverageInformation.result,
        sequencedSampleKeysByGene:
          oncoprint.props.store.filteredSequencedSampleKeysByGene.result,
        sequencedPatientKeysByGene:
          oncoprint.props.store.filteredSequencedPatientKeysByGene.result,
        selectedMolecularProfiles:
          oncoprint.props.store.selectedMolecularProfiles.result,
        expansionIndexMap: oncoprint.expansionsByGeneticTrackKey,
      });
      return oncoprint.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result.map(
        (alterationData, trackIndex) =>
          trackFunction(alterationData, trackIndex, undefined),
      );
    },
    default: [],
  });
}
export function makeClinicalTracksMobxPromise(oncoprint, sampleMode) {
  return remoteData({
    await: () => {
      let ret = [
        oncoprint.props.store.filteredSamples,
        oncoprint.props.store.filteredPatients,
        oncoprint.props.store.clinicalAttributeIdToClinicalAttribute,
        oncoprint.alteredKeys,
      ];
      if (
        oncoprint.props.store.clinicalAttributeIdToClinicalAttribute.isComplete
      ) {
        const attributes = Array.from(
          _.keys(oncoprint.selectedClinicalTrackConfig),
        )
          .map((attrId) => {
            return oncoprint.props.store.clinicalAttributeIdToClinicalAttribute
              .result[attrId];
          })
          .filter((x) => !!x);
        ret = ret.concat(
          oncoprint.props.store.clinicalDataCache.getAll(attributes),
        );
      }
      return ret;
    },
    invoke: async () => {
      if (!_.keys(oncoprint.selectedClinicalTrackConfig).length) {
        return [];
      }
      const attributes = Array.from(
        _.keys(oncoprint.selectedClinicalTrackConfig),
      )
        .map(
          (attrId) =>
            oncoprint.props.store.clinicalAttributeIdToClinicalAttribute.result[
              attrId
            ],
        )
        // filter out nonexistent attributes:
        .filter((x) => !!x);
      return attributes.map((attribute) => {
        const dataAndColors =
          oncoprint.props.store.clinicalDataCache.get(attribute).result;
        let altered_uids = undefined;
        if (oncoprint.onlyShowClinicalLegendForAlteredCases) {
          altered_uids = oncoprint.alteredKeys.result;
        }
        const ret = {
          key: oncoprint.clinicalAttributeIdToTrackKey(
            attribute.clinicalAttributeId,
          ),
          attributeId: attribute.clinicalAttributeId,
          label: attribute.displayName,
          description: attribute.description,
          data: makeClinicalTrackData(
            attribute,
            sampleMode
              ? oncoprint.props.store.filteredSamples.result
              : oncoprint.props.store.filteredPatients.result,
            dataAndColors.data,
          ),
          altered_uids,
        };
        if (clinicalAttributeIsPROFILEDIN(attribute)) {
          // For "Profiled-In" clinical attribute: show "No" on N/A items
          ret.na_tooltip_value = 'No';
          ret.na_legend_label = 'No';
          // For "Profiled-In", it's just 'Yes' or 'N/A' so as an optimization
          //  make 'Yes' universal
          ret.universal_rule_categories = {
            Yes: true,
          };
        }
        if (attribute.datatype === 'NUMBER') {
          ret.datatype = 'number';
          if (attribute.clinicalAttributeId === 'FRACTION_GENOME_ALTERED') {
            ret.numberRange = [0, 1];
          } else if (attribute.clinicalAttributeId === 'MUTATION_COUNT') {
            ret.numberLogScale = true;
          } else if (
            attribute.clinicalAttributeId ===
            SpecialAttribute.NumSamplesPerPatient
          ) {
            ret.numberRange = [0, undefined];
            ret.custom_options = sampleMode
              ? [
                  {
                    label: 'Show one column per patient.',
                    onClick: () =>
                      oncoprint.controlsHandlers.onSelectColumnType('patient'),
                  },
                ]
              : [
                  {
                    label: 'Show one column per sample.',
                    onClick: () =>
                      oncoprint.controlsHandlers.onSelectColumnType('sample'),
                  },
                ];
          }
        } else if (attribute.datatype === 'STRING') {
          ret.datatype = 'string';
          ret.category_to_color = _.mapValues(
            dataAndColors.categoryToColor,
            hexToRGBA,
          );
        } else if (
          attribute.clinicalAttributeId === SpecialAttribute.MutationSpectrum
        ) {
          ret.datatype = 'counts';
          ret.countsCategoryLabels = MUTATION_SPECTRUM_CATEGORIES;
          ret.countsCategoryFills = MUTATION_SPECTRUM_FILLS;
        }
        const trackConfig =
          oncoprint.selectedClinicalTrackConfig[attribute.clinicalAttributeId];
        ret.sortOrder = trackConfig.sortOrder || undefined;
        ret.gapOn = trackConfig.gapOn || undefined;
        return ret;
      });
    },
    default: [],
  });
}

export function splitHeatmapTextField(text) {
  let newText = _.cloneDeep(text);
  newText = newText.replace(/[,\s\n]+/g, ' ').trim();
  return _.uniq(newText.split(/[,\s\n]+/));
}
