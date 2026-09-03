import api from "../axios.js";
export const UserAPI = {
  checkExists: (payload) => api.post("users/check-exist", payload),
  getUsers: (params) => api.get(`users?${params}`),
  getAllUsers: () => api.get("users"), // new
  getById: (id) => api.get(`users/${id}`),
  createUser: (payload) => api.post("users", payload),
  updateUser: (id, payload) => api.put(`users/${id}`, payload),
  updateStatus: (id, payload) => api.patch(`users/${id}/status`, payload),
  updatePassword: (id, payload) => api.patch(`users/${id}/password`, payload),
  deleteUser: (id) => api.delete(`users/${id}`),
  getActiveAccountOfficers: () => api.get("users/active-account-officers"), // new
  getActiveProcurement: () => api.get("users/active-procurement"),
  uploadProfileImage: (id, formData) =>
    api.post(`users/${id}/profile-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default UserAPI;
