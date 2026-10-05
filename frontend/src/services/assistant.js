import api from "./api";

export function sendAssistantMessage(message, history = []) {
  return api.post("/assistant/chat", { message, history });
}
