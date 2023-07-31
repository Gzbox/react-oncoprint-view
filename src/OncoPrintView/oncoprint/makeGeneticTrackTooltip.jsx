import $ from 'jquery';
import { deriveStructuralVariantType } from 'oncokb-frontend-commons';
import hotspotsImg from '../rootImages/cancer-hotspots.svg';
import customDriverImg from '../rootImages/driver.svg';
import customDriverTiersImg from '../rootImages/driver_tiers.png';
import oncokbImg from '../rootImages/oncogenic.svg';
import { AlterationTypeConstants } from '../shared/constants';
import { ListIndexedMapOfCounts } from '../shared/lib/ListIndexedMap';
import { isNotGermlineMutation } from '../shared/lib/MutationUtils';
import { PUTATIVE_DRIVER, PUTATIVE_PASSENGER } from '../shared/lib/StoreUtils';
import {
  getCaseViewElt,
  makeGenePanelPopupLink,
  makeGeneticTrackTooltip_getCoverageInformation,
  TOOLTIP_DIV_CLASS,
} from './TooltipUtils';
const disp_cna = {
  '-2': 'HOMODELETED',
  '-1': 'HETLOSS',
  1: 'GAIN',
  2: 'AMPLIFIED',
};

function listOfMutationDataToHTML(data, multipleSamplesUnderMouse) {
  const countsMap = new ListIndexedMapOfCounts();
  for (const d of data) {
    countsMap.increment(
      d.hugo_gene_symbol,
      d.amino_acid_change,
      d.cancer_hotspots_hotspot,
      d.oncokb_oncogenic,
      d.driver_filter,
      d.driver_filter_annotation,
      d.driver_tiers_filter,
      d.driver_tiers_filter_annotation,
      d.germline,
    );
  }
  return countsMap
    .entries()
    .map(
      ({
        key: [
          hugo_gene_symbol,
          amino_acid_change,
          cancer_hotspots_hotspot,
          oncokb_oncogenic,
          driver_filter,
          driver_filter_annotation,
          driver_tiers_filter,
          driver_tiers_filter_annotation,
          germline,
        ],
        value: count,
      }) => {
        let ret = $('<span>').addClass('nobreak');
        ret.append(
          `<b class="nobreak">${hugo_gene_symbol} ${amino_acid_change}</b>`,
        );
        if (cancer_hotspots_hotspot) {
          ret.append(
            `<img src="${hotspotsImg}" title="Hotspot" style="height:11px; width:11px; margin-left:3px"/>`,
          );
        }
        if (oncokb_oncogenic) {
          ret.append(
            `<img src="${oncokbImg}" title="${oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
        if (driver_filter && driver_filter === PUTATIVE_DRIVER) {
          ret.append(
            `<img src="${customDriverImg}" title="${driver_filter}: ${driver_filter_annotation}" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
        else if (driver_filter && driver_filter === PUTATIVE_PASSENGER) {
          ret.append(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="height:16px; width:16px; margin-bottom:-2px; margin-right:-2px">
                                <title>"${driver_filter}: ${driver_filter_annotation}"</title>
                                <circle cx="10" cy="10" r="5" stroke="#bebebe" stroke-width="2" fill="none"/>
                            </svg>`);
        }
        //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
        if (driver_tiers_filter) {
          ret.append(
            `<img src="${customDriverTiersImg}" title="${driver_tiers_filter}: ${driver_tiers_filter_annotation}" alt="driver tiers filter" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        // AT THE END, append germline symbol if necessary
        if (germline) {
          ret.append(generateGermlineLabel());
        }
        // finally, add the number of samples with this, if multipleSamplesUnderMouse
        if (multipleSamplesUnderMouse) {
          ret.append(`&nbsp;(${count})`);
        }
        return ret;
      },
    );
}
function listOfStructuralVariantDataToHTML(data, multipleSamplesUnderMouse) {
  const countsMap = new ListIndexedMapOfCounts();
  for (const d of data) {
    countsMap.increment(
      d.site1HugoSymbol,
      d.site2HugoSymbol,
      d.eventInfo,
      deriveStructuralVariantType(d),
      d.oncokb_oncogenic,
    );
  }
  return countsMap
    .entries()
    .map(
      ({
        key: [
          site1HugoSymbol,
          site2HugoSymbol,
          eventInfo,
          variantClass,
          oncokb_oncogenic,
        ],
        value: count,
      }) => {
        let ret = $('<span>').addClass('nobreak');
        ret.append(
          `<b class="nobreak">${site1HugoSymbol || ''}${
            site2HugoSymbol ? '-' + site2HugoSymbol : ''
          }${
            variantClass && variantClass !== 'NA'
              ? ', ' + variantClass + ','
              : ''
          } Event Info: ${eventInfo}</b>`,
        );
        if (oncokb_oncogenic) {
          ret.append(
            `<img src="${oncokbImg}" title="${oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        // finally, add the number of samples with this, if multipleSamplesUnderMouse
        if (multipleSamplesUnderMouse) {
          ret.append(`&nbsp;(${count})`);
        }
        return ret;
      },
    );
}
function listOfCNAToHTML(data, multipleSamplesUnderMouse) {
  const countsMap = new ListIndexedMapOfCounts();
  for (const d of data) {
    countsMap.increment(
      d.hugo_gene_symbol,
      d.cna,
      d.oncokb_oncogenic,
      d.driver_filter,
      d.driver_filter_annotation,
      d.driver_tiers_filter,
      d.driver_tiers_filter_annotation,
    );
  }
  return countsMap
    .entries()
    .map(
      ({
        key: [
          hugo_gene_symbol,
          cna,
          oncokb_oncogenic,
          driver_filter,
          driver_filter_annotation,
          driver_tiers_filter,
          driver_tiers_filter_annotation,
        ],
        value: count,
      }) => {
        let ret = $('<span>').addClass('nobreak');
        ret.append(`<b class="nobreak">${hugo_gene_symbol} ${cna}</b>`);
        if (oncokb_oncogenic) {
          ret.append(
            `<img src=${oncokbImg} title="${oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
        if (driver_filter && driver_filter === PUTATIVE_DRIVER) {
          ret.append(
            `<img src="${customDriverImg}" title="${driver_filter}: ${driver_filter_annotation}" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
        if (driver_tiers_filter) {
          ret.append(
            `<img src="${customDriverTiersImg}" title="${driver_tiers_filter}: ${driver_tiers_filter_annotation}" alt="driver tiers filter" style="height:11px; width:11px;margin-left:3px"/>`,
          );
        }
        // finally, add the number of samples with this, if multipleSamplesUnderMouse
        if (multipleSamplesUnderMouse) {
          ret.append(`&nbsp;(${count})`);
        }
        return ret;
      },
    );
}
function listOfMRNAOrPROTToHTML(data, multipleSamplesUnderMouse) {
  const countsMap = new ListIndexedMapOfCounts();
  for (const d of data) {
    countsMap.increment(d.hugo_gene_symbol, d.direction);
  }
  return countsMap
    .entries()
    .map(({ key: [hugo_gene_symbol, direction], value: count }) => {
      let ret = $('<span>').addClass('nobreak');
      ret.append(`<b class="nobreak">${hugo_gene_symbol} ${direction}</b>`);
      // finally, add the number of samples with this, if multipleSamplesUnderMouse
      if (multipleSamplesUnderMouse) {
        ret.append(`&nbsp;(${count})`);
      }
      return ret;
    });
}
function generateGermlineLabel() {
  const ret = $('<small style="color: #ff0000">');
  ret.append('&nbsp;Germline');
  return ret;
}
export function makeGeneticTrackTooltip(
  caseViewLinkout,
  getMolecularProfileMap,
  alterationTypesInQuery,
) {
  return function (dataUnderMouse) {
    const ret = $('<div>').addClass(TOOLTIP_DIV_CLASS);
    // add a link to patient view page
    ret.append(getCaseViewElt(dataUnderMouse, caseViewLinkout)).append('<br/>');
    const alterations = groupAlterationsByType(dataUnderMouse);
    let mutations = alterations.mutations;
    let cna = alterations.cna;
    let mrna = alterations.mrna;
    let prot = alterations.prot;
    let structuralVariants = alterations.structuralVariants;
    if (structuralVariants.length > 0) {
      ret.append('Structural Variant: ');
      structuralVariants = listOfStructuralVariantDataToHTML(
        structuralVariants,
        dataUnderMouse.length > 1,
      );
      for (let i = 0; i < structuralVariants.length; i++) {
        if (i > 0) {
          ret.append(',');
        }
        ret.append(structuralVariants[i]);
      }
      ret.append('<br>');
    }
    if (mutations.length > 0) {
      ret.append('Mutation: ');
      mutations = listOfMutationDataToHTML(
        mutations,
        dataUnderMouse.length > 1,
      );
      for (let i = 0; i < mutations.length; i++) {
        if (i > 0) {
          ret.append(', ');
        }
        ret.append(mutations[i]);
      }
      ret.append('<br>');
    }
    if (cna.length > 0) {
      ret.append('Copy Number Alteration: ');
      cna = listOfCNAToHTML(cna, dataUnderMouse.length > 1);
      for (let i = 0; i < cna.length; i++) {
        if (i > 0) {
          ret.append(', ');
        }
        ret.append(cna[i]);
      }
      ret.append('<br>');
    }
    if (mrna.length > 0) {
      ret.append('MRNA: ');
      mrna = listOfMRNAOrPROTToHTML(mrna, dataUnderMouse.length > 1);
      for (let i = 0; i < mrna.length; i++) {
        if (i > 0) {
          ret.append(', ');
        }
        ret.append(mrna[i]);
      }
      ret.append('<br>');
    }
    if (prot.length > 0) {
      ret.append('PROT: ');
      prot = listOfMRNAOrPROTToHTML(prot, dataUnderMouse.length > 1);
      for (let i = 0; i < prot.length; i++) {
        if (i > 0) {
          ret.append(', ');
        }
        ret.append(prot[i]);
      }
      ret.append('<br>');
    }
    // Gene panel coverage
    const molecularProfileMap =
      getMolecularProfileMap && getMolecularProfileMap();
    const {
      profiledGenePanelCounts,
      notProfiledGenePanelCounts,
      profiledMolecularProfileCounts,
      notProfiledMolecularProfileCounts,
      allProfiledCount,
      noneProfiledCount,
    } = getProfileCounts(
      dataUnderMouse,
      molecularProfileMap,
      alterationTypesInQuery,
    );
    const profiledGenePanelEntries = profiledGenePanelCounts.entries();
    const notProfiledGenePanelEntries = notProfiledGenePanelCounts.entries();
    if (profiledGenePanelEntries.length || notProfiledGenePanelEntries.length) {
      ret.append('Gene Panels: ');
      let needsCommaFirst = false;
      for (const entry of profiledGenePanelEntries) {
        if (needsCommaFirst) {
          ret.append(',&nbsp;');
        }
        needsCommaFirst = true;
        ret.append(
          makeGenePanelPopupLink(
            entry.key[0],
            true,
            dataUnderMouse.length > 1 ? entry.value : undefined,
          ),
        );
      }
      for (const entry of notProfiledGenePanelEntries) {
        if (profiledGenePanelCounts.has(...entry.key)) {
          // only add again, as "not profiled", if we didn't already add it as "profiled"
          continue;
        }
        if (needsCommaFirst) {
          ret.append(',&nbsp;');
        }
        needsCommaFirst = true;
        ret.append(
          makeGenePanelPopupLink(
            entry.key[0],
            false,
            dataUnderMouse.length > 1 ? entry.value : undefined,
          ),
        );
      }
      ret.append('<br>');
    }
    // Molecular profile coverage
    const profiledInEntries = profiledMolecularProfileCounts.entries();
    const notProfiledInEntries = notProfiledMolecularProfileCounts.entries();
    // only show specifics if not all profiled or all unprofiled
    if (allProfiledCount === dataUnderMouse.length) {
      ret.append(
        'Profiled in all selected molecular profiles.' +
          (dataUnderMouse.length > 1 ? ` (${allProfiledCount})` : ''),
      );
      ret.append('<br>');
    } else if (noneProfiledCount === dataUnderMouse.length) {
      // the moused over sample/case is not profiled
      // but there IS a structural variant
      // it means that the fusion partner of the structural variant
      // is profiled
      if (
        (profiledGenePanelEntries.length ||
          notProfiledGenePanelEntries.length) &&
        structuralVariants.length
      ) {
        // there is assumption that if the above condition is true
        // the gene must be a fusion partner of a gene which IS profiled
        ret.append(
          `${dataUnderMouse[0].trackLabel} is not in the gene panels of the selected molecular profiles, but detected as a fusion partner`,
        );
      } else {
        ret.append(
          'Not profiled in selected molecular profiles.' +
            (dataUnderMouse.length > 1 ? ` (${noneProfiledCount})` : ''),
        );
      }
      ret.append('<br>');
    } else {
      if (profiledInEntries.length) {
        ret.append(
          'Profiled in: ' +
            profiledInEntries
              .map((e) => {
                const molecularProfileId = e.key[0];
                let displayName = molecularProfileId;
                if (
                  molecularProfileMap &&
                  molecularProfileId in molecularProfileMap
                ) {
                  displayName = molecularProfileMap[molecularProfileId].name;
                }
                return `<span class="nobreak">${displayName}${
                  dataUnderMouse.length > 1 ? ` (${e.value})` : ''
                }</span>`;
              })
              .join(', '),
        );
        ret.append('<br>');
      }
      if (notProfiledInEntries.length) {
        ret.append(
          `<span class="nobreak" style='color:red; font-weight:bold'>Not profiled in: ` +
            notProfiledInEntries
              .map((e) => {
                const molecularProfileId = e.key[0];
                let displayName = molecularProfileId;
                if (
                  molecularProfileMap &&
                  molecularProfileId in molecularProfileMap
                ) {
                  displayName = molecularProfileMap[molecularProfileId].name;
                }
                return `<span class="nobreak">${displayName}${
                  dataUnderMouse.length > 1 ? ` (${e.value})` : ''
                }</span>`;
              })
              .join(', ') +
            '</span>',
        );
        ret.append('<br>');
      }
      if (allProfiledCount > 0) {
        ret.append(
          'Profiled in all selected molecular profiles.' +
            (dataUnderMouse.length > 1 ? ` (${allProfiledCount})` : ''),
        );
        ret.append('<br>');
      }
      if (noneProfiledCount > 0) {
        ret.append(
          'Not profiled in selected molecular profiles.' +
            (dataUnderMouse.length > 1 ? ` (${noneProfiledCount})` : ''),
        );
        ret.append('<br>');
      }
    }
    return ret;
  };
}
function groupAlterationsByType(dataUnderMouse) {
  let mutations = [];
  let cna = [];
  let mrna = [];
  let prot = [];
  let structuralVariants = [];
  // collect all data under mouse
  for (const d of dataUnderMouse) {
    for (let i = 0; i < d.data.length; i++) {
      const datum = d.data[i];
      const molecularAlterationType = datum.molecularProfileAlterationType;
      const hugoGeneSymbol = datum.hugoGeneSymbol;
      switch (molecularAlterationType) {
        case AlterationTypeConstants.MUTATION_EXTENDED: {
          const tooltip_datum = {};
          tooltip_datum.hugo_gene_symbol = hugoGeneSymbol;
          tooltip_datum.amino_acid_change = datum.proteinChange;
          tooltip_datum.driver_filter = datum.driverFilter;
          tooltip_datum.driver_filter_annotation = datum.driverFilterAnnotation;
          tooltip_datum.driver_tiers_filter = datum.driverTiersFilter;
          tooltip_datum.driver_tiers_filter_annotation =
            datum.driverTiersFilterAnnotation;
          if (datum.isHotspot) {
            tooltip_datum.cancer_hotspots_hotspot = true;
          }
          if (!isNotGermlineMutation(datum)) {
            tooltip_datum.germline = true;
          }
          const oncokb_oncogenic = datum.oncoKbOncogenic;
          if (oncokb_oncogenic) {
            tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
          }
          mutations.push(tooltip_datum);
          break;
        }
        case AlterationTypeConstants.STRUCTURAL_VARIANT: {
          const tooltip_datum = {};
          const structuralVariantDatum = datum;
          tooltip_datum.site1HugoSymbol =
            structuralVariantDatum.site1HugoSymbol;
          tooltip_datum.site2HugoSymbol =
            structuralVariantDatum.site2HugoSymbol;
          tooltip_datum.eventInfo = structuralVariantDatum.eventInfo;
          tooltip_datum.variantClass = structuralVariantDatum.variantClass;
          const oncokb_oncogenic = datum.oncoKbOncogenic;
          if (oncokb_oncogenic) {
            tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
          }
          structuralVariants.push(tooltip_datum);
          break;
        }
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
          if (disp_cna.hasOwnProperty(datum.value)) {
            const tooltip_datum = {
              cna: disp_cna[datum.value],
              hugo_gene_symbol: hugoGeneSymbol,
            };
            tooltip_datum.driver_filter = datum.driverFilter;
            tooltip_datum.driver_filter_annotation =
              datum.driverFilterAnnotation;
            tooltip_datum.driver_tiers_filter = datum.driverTiersFilter;
            tooltip_datum.driver_tiers_filter_annotation =
              datum.driverTiersFilterAnnotation;
            const oncokb_oncogenic = datum.oncoKbOncogenic;
            if (oncokb_oncogenic) {
              tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
            }
            cna.push(tooltip_datum);
          }
          break;
        case AlterationTypeConstants.MRNA_EXPRESSION:
        case AlterationTypeConstants.PROTEIN_LEVEL:
          // eslint-disable-next-line no-case-declarations
          let direction = datum.alterationSubType;
          // eslint-disable-next-line no-case-declarations
          let array =
            molecularAlterationType === AlterationTypeConstants.MRNA_EXPRESSION
              ? mrna
              : prot;
          if (direction === 'high') {
            array.push({
              hugo_gene_symbol: hugoGeneSymbol,
              direction: 'HIGH',
            });
          } else if (direction === 'low') {
            array.push({
              hugo_gene_symbol: hugoGeneSymbol,
              direction: 'LOW',
            });
          }
          break;
      }
    }
  }
  return {
    mutations,
    cna,
    prot,
    mrna,
    structuralVariants,
  };
}
function getProfileCounts(
  dataUnderMouse,
  molecularProfileMap,
  alterationTypesInQuery,
) {
  // Gene panel coverage
  const profiledGenePanelCounts = new ListIndexedMapOfCounts();
  const notProfiledGenePanelCounts = new ListIndexedMapOfCounts();
  const profiledMolecularProfileCounts = new ListIndexedMapOfCounts();
  const notProfiledMolecularProfileCounts = new ListIndexedMapOfCounts();
  let allProfiledCount = 0;
  let noneProfiledCount = 0;
  for (const d of dataUnderMouse) {
    const coverageInformation = makeGeneticTrackTooltip_getCoverageInformation(
      d.profiled_in,
      d.not_profiled_in,
      alterationTypesInQuery,
      molecularProfileMap,
    );
    for (const genePanelId of coverageInformation.dispProfiledGenePanelIds) {
      profiledGenePanelCounts.increment(genePanelId);
    }
    for (const genePanelId of coverageInformation.dispNotProfiledGenePanelIds) {
      notProfiledGenePanelCounts.increment(genePanelId);
    }
    if (coverageInformation.dispProfiledIn) {
      for (const molecularProfileId of coverageInformation.dispProfiledIn) {
        profiledMolecularProfileCounts.increment(molecularProfileId);
      }
    }
    if (coverageInformation.dispNotProfiledIn) {
      for (const molecularProfileId of coverageInformation.dispNotProfiledIn) {
        notProfiledMolecularProfileCounts.increment(molecularProfileId);
      }
    }
    if (coverageInformation.dispAllProfiled) {
      allProfiledCount += 1;
    } else if (coverageInformation.dispNotProfiled) {
      noneProfiledCount += 1;
    }
  }
  return {
    profiledGenePanelCounts,
    notProfiledGenePanelCounts,
    profiledMolecularProfileCounts,
    notProfiledMolecularProfileCounts,
    allProfiledCount,
    noneProfiledCount,
  };
}
