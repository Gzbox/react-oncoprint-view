import _ from 'lodash';
import { RuleSetType } from 'oncoprintjs';
import { AlterationTypeConstants } from '../shared/constants';
import {
  hexToRGBA,
  RESERVED_CLINICAL_VALUE_COLORS,
} from '../shared/lib/Colors';
import ifNotDefined from '../shared/lib/ifNotDefined';
import {
  genetic_rule_set_different_colors_no_recurrence,
  genetic_rule_set_different_colors_recurrence,
  genetic_rule_set_same_color_for_all_no_recurrence,
  genetic_rule_set_same_color_for_all_recurrence,
  germline_rule_params,
} from './geneticrules';

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
export function getClinicalTrackRuleSetParams(track) {
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
