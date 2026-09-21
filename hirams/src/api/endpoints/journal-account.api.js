import api from "../axios.js";

export const JournalAccountAPI = {
  // ✅ UNTOUCHED URL / response — literally the same string
  getParents: () => api.get("journal-accounts?onlyParents=1"),

  // ✅ UNTOUCHED URL / response — literally the same string
  getChildren: (accountId) => api.get(`journal-accounts?nParentAccountId=${accountId}`),

  getAll: () => api.get("journal-accounts"),
  getExcludingDescendantsOf: (id) =>
    api.get(`journal-accounts?excludeDescendantsOf=${id}`),
  create: (payload) => api.post("journal-accounts", payload),
  update: (id, payload) => api.put(`journal-accounts/${id}`, payload),

  getAvailableSuppliersForImport: (accountId) =>
    api.get(`journal-accounts/${accountId}/available-suppliers-for-import`),
  flashImportSuppliers: (accountId, payload) =>
    api.post(`journal-accounts/${accountId}/flash-import-suppliers`, payload),

  getAvailableClientsForImport: (accountId) =>
    api.get(`journal-accounts/${accountId}/available-clients-for-import`),
  flashImportClients: (accountId, payload) =>
    api.post(`journal-accounts/${accountId}/flash-import-clients`, payload),
  delete: (id) => api.delete(`journal-accounts/${id}`),
  move: (id, nParentAccountId) =>
  api.patch(`/journal-accounts/${id}/move`, { nParentAccountId }),
};

export default JournalAccountAPI;