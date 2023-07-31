import { MUTATION_STATUS_GERMLINE } from '../constants';

export const GERMLINE_REGEXP = new RegExp(MUTATION_STATUS_GERMLINE, 'i');

export function isNotGermlineMutation(m: { mutationStatus?: string }) {
  return !m.mutationStatus || !GERMLINE_REGEXP.test(m.mutationStatus);
}
