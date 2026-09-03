import api from "../axios.js";

export const MappingAPI = {
  getMappings: () => api.get("mappings"),
};

export default MappingAPI;