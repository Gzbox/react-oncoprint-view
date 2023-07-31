export function normalizeMutation(mutation) {
  return Object.assign({ chromosome: mutation.chr }, mutation);
}
export function normalizeMutations(mutations) {
  return mutations.map(normalizeMutation);
}
