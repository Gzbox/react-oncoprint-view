import _ from 'lodash';
import * as Pluralize from 'pluralize';
import { GENERIC_ASSAY_CONFIG } from './GenericAssayConfig';
export function deriveDisplayTextFromGenericAssayType(
  genericAssayType,
  plural,
) {
  let derivedDisplayText = '';
  if (
    genericAssayType in GENERIC_ASSAY_CONFIG.genericAssayConfigByType &&
    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
      .displayTitleText
  ) {
    derivedDisplayText =
      GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
        .displayTitleText;
  } else {
    const textArray = genericAssayType.split('_');
    const capitalizeTextArray = textArray.map((text) =>
      _.capitalize(text.toLowerCase()),
    );
    derivedDisplayText = capitalizeTextArray.join(' ');
  }
  if (plural) {
    return Pluralize.plural(derivedDisplayText);
  }
  return derivedDisplayText;
}
