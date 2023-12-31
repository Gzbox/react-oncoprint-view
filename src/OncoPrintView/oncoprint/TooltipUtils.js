import $ from 'jquery';
import _ from 'lodash';
import {
  AlterationTypeConstants,
  AlterationTypeText,
} from '../shared/constants';
import { deriveDisplayTextFromGenericAssayType } from '../shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import './styles.scss';
export const TOOLTIP_DIV_CLASS = 'oncoprint__tooltip';
const tooltipTextElementNaN = 'N/A';

export function getSampleViewUrl(studyId, sampleId, navIds) {
  console.log(
    'getSampleViewUrl',
    studyId,
    sampleId,
    navIds,
    '跳转到样本详情页面',
  );
}
export function getPatientViewUrl(studyId, caseId, navIds) {
  console.log(
    'getPatientViewUrl',
    studyId,
    caseId,
    navIds,
    '跳转到患者详情页面',
  );
}

function sampleViewAnchorTag(study_id, sample_id) {
  return `<a class="nobreak" href="${getSampleViewUrl(
    study_id,
    sample_id,
  )}" target="_blank">${sample_id}</a>`;
}
function patientViewAnchorTag(study_id, patient_id) {
  return `<a class="nobreak" href="${getPatientViewUrl(
    study_id,
    patient_id,
  )}" target="_blank">${patient_id}</a>`;
}
export function makeGenePanelPopupLink(gene_panel_id, profiled, numSamples) {
  let anchor = $(
    `<span class="nobreak"><a href="#" ${
      !profiled ? 'style="color:red;"' : ''
    } oncontextmenu="return false;">${gene_panel_id}</a>${
      numSamples ? ` (${numSamples})` : ''
    }</span>`,
  );
  anchor.ready(() => {
    anchor.click(function () {
      console.log('我点击了这里', gene_panel_id);
    });
  });
  return anchor;
}
export function linebreakGenesetId(genesetId) {
  return (
    // encode the string as the textual contents of an HTML element
    $('<div>')
      .text(genesetId)
      .html()
      // Include zero-width spaces to allow line breaks after punctuation in
      // (typically long) gs names
      .replace(/_/g, '_&#8203;')
      .replace(/\./g, '.&#8203;')
  );
}
export function makeCategoricalTrackTooltip(track, link_id) {
  return function (dataUnderMouse) {
    let ret = '';
    let attr_val_counts = {};
    for (const d of dataUnderMouse) {
      if (d.attr_val_counts) {
        for (const key of Object.keys(d.attr_val_counts)) {
          attr_val_counts[key] = attr_val_counts[key] || 0;
          attr_val_counts[key] += d.attr_val_counts[key];
        }
      }
    }
    const attr_vals = Object.keys(attr_val_counts);
    if (attr_vals.length > 1) {
      ret += track.label + ':<br>';
      for (let i = 0; i < attr_vals.length; i++) {
        const val = attr_vals[i];
        ret +=
          '<span class="nobreak"><b>' +
          val +
          '</b>: ' +
          attr_val_counts[val] +
          ` sample${attr_val_counts[val] === 1 ? '' : 's'}</span><br>`;
      }
    } else if (attr_vals.length === 1) {
      let displayVal = attr_vals[0];
      ret +=
        track.label +
        ': <span class="nobreak"><b>' +
        displayVal +
        `</b>${
          dataUnderMouse.length > 1
            ? ` (${attr_val_counts[attr_vals[0]]} samples)`
            : ''
        }</span><br>`;
    }
    let naCount = 0;
    for (const d of dataUnderMouse) {
      if (d.na) {
        naCount += 1;
      }
    }
    if (naCount > 0) {
      ret += `${track.label}: <b>N/A</b>${
        dataUnderMouse.length > 1 ? ` (${naCount} samples)` : ''
      }<br/>`;
    }
    return $('<div>')
      .addClass(TOOLTIP_DIV_CLASS)
      .append(getCaseViewElt(dataUnderMouse, !!link_id))
      .append('<br/>')
      .append(ret);
  };
}
export function makeClinicalTrackTooltip(track, link_id) {
  return function (dataUnderMouse) {
    let ret = '';
    if (track.datatype === 'counts') {
      const d = dataUnderMouse[0];
      for (let i = 0; i < track.countsCategoryLabels.length; i++) {
        ret +=
          '<span class="nobreak" style="color:' +
          track.countsCategoryFills[i] +
          ';font-weight:bold;">' +
          track.countsCategoryLabels[i] +
          '</span>: ' +
          d.attr_val_counts[track.countsCategoryLabels[i]] +
          '<br>';
      }
    } else {
      let attr_val_counts = {};
      for (const d of dataUnderMouse) {
        if (d.attr_val_counts) {
          for (const key of Object.keys(d.attr_val_counts)) {
            attr_val_counts[key] = attr_val_counts[key] || 0;
            attr_val_counts[key] += d.attr_val_counts[key];
          }
        }
      }
      const attr_vals = Object.keys(attr_val_counts);
      if (track.datatype === 'number') {
        // average
        let sum = 0;
        let count = 0;
        for (const attr_val of attr_vals) {
          const numSamplesWithVal = attr_val_counts[attr_val];
          sum += numSamplesWithVal * parseFloat(attr_val);
          count += numSamplesWithVal;
        }
        let displayVal = (sum / count).toFixed(2);
        if (displayVal.substring(displayVal.length - 3) === '.00') {
          displayVal = displayVal.substring(0, displayVal.length - 3);
        }
        ret +=
          track.label +
          ': <span class="nobreak"><b>' +
          displayVal +
          `${count > 1 ? ` (average of ${count} values)` : ''}</b></span><br>`;
      } else {
        if (attr_vals.length > 1) {
          ret += track.label + ':<br>';
          for (let i = 0; i < attr_vals.length; i++) {
            const val = attr_vals[i];
            ret +=
              '<span class="nobreak"><b>' +
              val +
              '</b>: ' +
              attr_val_counts[val] +
              ` sample${attr_val_counts[val] === 1 ? '' : 's'}</span><br>`;
          }
        } else if (attr_vals.length === 1) {
          let displayVal = attr_vals[0];
          ret +=
            track.label +
            ': <span class="nobreak"><b>' +
            displayVal +
            `</b>${
              dataUnderMouse.length > 1
                ? ` (${attr_val_counts[attr_vals[0]]} samples)`
                : ''
            }</span><br>`;
        }
      }
    }
    let naCount = 0;
    for (const d of dataUnderMouse) {
      if (d.na) {
        naCount += 1;
      }
    }
    if (naCount > 0 && track.na_tooltip_value) {
      ret += `${track.label}: <b>${track.na_tooltip_value}</b>${
        dataUnderMouse.length > 1 ? ` (${naCount} samples)` : ''
      }<br/>`;
    }
    return $('<div>')
      .addClass(TOOLTIP_DIV_CLASS)
      .append(getCaseViewElt(dataUnderMouse, !!link_id))
      .append('<br/>')
      .append(ret);
  };
}
export function makeHeatmapTrackTooltip(trackSpec, link_id) {
  return function (dataUnderMouse) {
    let data_header = '';
    let valueTextElement = tooltipTextElementNaN;
    let categoryTextElement = '';
    if (trackSpec.tooltipValueLabel) {
      data_header = `${trackSpec.tooltipValueLabel}: `;
    } else {
      switch (trackSpec.molecularAlterationType) {
        case AlterationTypeConstants.MRNA_EXPRESSION:
          data_header = 'MRNA: ';
          break;
        case AlterationTypeConstants.PROTEIN_LEVEL:
          data_header = 'PROT: ';
          break;
        case AlterationTypeConstants.METHYLATION:
          data_header = 'METHYLATION: ';
          break;
        case AlterationTypeConstants.GENERIC_ASSAY:
          // track for GENERIC_ASSAY type always has the genericAssayType
          data_header = `${deriveDisplayTextFromGenericAssayType(
            trackSpec.genericAssayType,
          )}: `;
          break;
        default:
          data_header = 'Value: ';
          break;
      }
    }
    let profileDataSum = 0;
    const profileCategories = [];
    let profileDataCount = 0;
    let categoryCount = 0;
    for (const d of dataUnderMouse) {
      if (d.profile_data !== null && typeof d.profile_data !== 'undefined') {
        if (
          trackSpec.molecularAlterationType ===
            AlterationTypeConstants.GENERIC_ASSAY &&
          d.category
        ) {
          profileCategories.push(d.category);
          categoryCount += 1;
        } else {
          profileDataSum += d.profile_data;
          profileDataCount += 1;
        }
      }
    }
    if (profileDataCount > 0) {
      const profileDisplayValue = (profileDataSum / profileDataCount).toFixed(
        2,
      );
      if (profileDataCount === 1) {
        valueTextElement = profileDisplayValue;
      } else {
        valueTextElement = `${profileDisplayValue} (average of ${profileDataCount} values)`;
      }
    }
    if (categoryCount > 0) {
      if (profileDataCount === 0 && categoryCount === 1) {
        categoryTextElement = profileCategories[0];
      } else if (profileDataCount > 0 && categoryCount === 1) {
        categoryTextElement = `${profileCategories[0]}`;
      } else {
        categoryTextElement = `${_.uniq(profileCategories).join(
          ', ',
        )} (${categoryCount} data points)`;
      }
    }
    let ret = data_header;
    if (valueTextElement !== tooltipTextElementNaN || categoryCount === 0) {
      ret += '<b>' + valueTextElement + '</b>';
    }
    if (valueTextElement !== tooltipTextElementNaN && categoryCount > 0) {
      ret += ' and ';
    }
    if (categoryCount > 0) {
      ret += '<b>' + categoryTextElement + '</b>';
    }
    ret += '<br />';
    return $('<div>')
      .addClass(TOOLTIP_DIV_CLASS)
      .append(getCaseViewElt(dataUnderMouse, !!link_id))
      .append('<br/>')
      .append(ret);
  };
}
export function makeGeneticTrackTooltip_getCoverageInformation(
  profiled_in,
  not_profiled_in,
  alterationTypesInQuery,
  molecularProfileIdToMolecularProfile,
) {
  let dispProfiledGenePanelIds = [];
  let dispProfiledGenePanelIdsMap = {};
  let dispProfiledIn = undefined;
  let dispProfiledInMap = {};
  let dispNotProfiledIn = undefined;
  let dispNotProfiledGenePanelIds = [];
  let profiledInTypes = undefined;
  if (profiled_in) {
    dispProfiledGenePanelIds = _.uniq(
      profiled_in.map((x) => x.genePanelId).filter((x) => !!x),
    );
    dispProfiledIn = _.uniq(profiled_in.map((x) => x.molecularProfileId));
    if (molecularProfileIdToMolecularProfile) {
      profiledInTypes = _.keyBy(
        dispProfiledIn,
        (molecularProfileId) =>
          molecularProfileIdToMolecularProfile[molecularProfileId]
            .molecularAlterationType,
      );
    }
    dispProfiledInMap = _.keyBy(dispProfiledIn);
    dispProfiledGenePanelIdsMap = _.keyBy(dispProfiledGenePanelIds);
  }
  if (not_profiled_in) {
    dispNotProfiledIn = _.uniq(
      not_profiled_in.map((x) => x.molecularProfileId),
    ).filter((x) => !dispProfiledInMap[x]); // filter out profiles in profiled_in to avoid confusing tooltip (this occurs e.g. w multiple samples, one profiled one not)
    if (
      profiledInTypes &&
      alterationTypesInQuery &&
      molecularProfileIdToMolecularProfile
    ) {
      let notProfiledInTypes = _.keyBy(
        dispNotProfiledIn,
        (molecularProfileId) =>
          molecularProfileIdToMolecularProfile[molecularProfileId]
            .molecularAlterationType,
      );
      // add an entry to 'not profiled in' for each alteration type in the query iff the sample is not profiled in a profile of that type, and that type is not already accounted for.
      // This is for the case of multiple study query - eg one study has CNA profile, the other doesnt, and we want to show in a tooltip from the other study that
      //      the sample is not profiled for CNA. If the study actually has a CNA profile, then we wont show "not profiled for copy number alterations" because
      //      that will be filtered out below because its in profiledInTypes or notProfiledInTypes. Otherwise, CNA will be in alterationTypesInQuery,
      //      and it wont be covered in profiledInTypes or notProfiledInTypes, so it will make sense to say "copy number alterations" in that generality.
      dispNotProfiledIn = dispNotProfiledIn.concat(
        alterationTypesInQuery
          .filter((t) => !profiledInTypes[t] && !notProfiledInTypes[t])
          .map((t) => AlterationTypeText[t]),
      );
    }
    dispNotProfiledGenePanelIds = _.uniq(
      not_profiled_in.map((x) => x.genePanelId),
    ).filter((x) => !!x && !dispProfiledGenePanelIdsMap[x]);
  }
  const dispAllProfiled = !!(
    dispProfiledIn &&
    dispProfiledIn.length &&
    dispNotProfiledIn &&
    !dispNotProfiledIn.length
  );
  const dispNotProfiled = !!(
    dispNotProfiledIn &&
    dispNotProfiledIn.length &&
    dispProfiledIn &&
    !dispProfiledIn.length
  );
  return {
    dispProfiledGenePanelIds,
    dispNotProfiledGenePanelIds,
    dispProfiledIn,
    dispNotProfiledIn,
    dispAllProfiled,
    dispNotProfiled,
  };
}
export function getCaseViewElt(dataUnderMouse, caseViewLinkout) {
  if (!dataUnderMouse.length) {
    return '';
  }
  let caseIdElt;
  if (dataUnderMouse[0].sample) {
    if (dataUnderMouse.length > 1) {
      caseIdElt = caseViewLinkout
        ? `<a class="nobreak" href=${getSampleViewUrl(
            dataUnderMouse[0].study_id,
            dataUnderMouse[0].sample,
            dataUnderMouse.map((d) => ({
              studyId: d.study_id,
              patientId: d.patient,
            })),
          )} target="_blank">View these ${dataUnderMouse.length} samples<a/>`
        : `<span class="nobreak">${dataUnderMouse.length} samples</span>`;
    } else {
      caseIdElt = caseViewLinkout
        ? sampleViewAnchorTag(
            dataUnderMouse[0].study_id,
            dataUnderMouse[0].sample,
          )
        : `<span class="nobreak">${dataUnderMouse[0].sample}</span>`;
    }
  } else if (dataUnderMouse[0].patient) {
    if (dataUnderMouse.length > 1) {
      caseIdElt = caseViewLinkout
        ? `<a class="nobreak" href=${getPatientViewUrl(
            dataUnderMouse[0].study_id,
            dataUnderMouse[0].patient,
            dataUnderMouse.map((d) => ({
              studyId: d.study_id,
              patientId: d.patient,
            })),
          )} target="_blank">View these ${dataUnderMouse.length} patients<a/>`
        : `<span class="nobreak">${dataUnderMouse.length} patients</span>`;
    } else {
      caseIdElt = caseViewLinkout
        ? patientViewAnchorTag(
            dataUnderMouse[0].study_id,
            dataUnderMouse[0].patient,
          )
        : `<span class="nobreak">${dataUnderMouse[0].patient}</span>`;
    }
  } else {
    caseIdElt = '';
  }
  return caseIdElt;
}
