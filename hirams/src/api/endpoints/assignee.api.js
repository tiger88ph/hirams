import api from "../axios.js";

export const AssigneeAPI = {
  checkExists: (payload) => api.post("assignees/check-exist", payload),
  getAssignees: (params = "") => api.get(`assignees${params ? `?${params}` : ""}`),
  createAssignee: (payload) => api.post("assignees", payload),
  updateAssignee: (id, payload) => api.put(`assignees/${id}`, payload),
  updateStatus: (id, payload) => api.patch(`assignees/${id}/status`, payload),
  deleteAssignee: (id) => api.delete(`assignees/${id}`),
};

export default AssigneeAPI;