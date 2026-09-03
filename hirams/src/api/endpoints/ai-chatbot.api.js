import api from "../axios.js";

export const AIChatBotAPI = {
  send: async (messages) => {
    const response = await api.post("/ai-chatbot/send", { messages });
    return response.reply;
  },
};

export default AIChatBotAPI;
