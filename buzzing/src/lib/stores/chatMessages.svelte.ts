// Chat message type (matches server-side ChatMessage)
export type ChatMessage = {
  text: string;
  type: "buzz" | "notification" | "warning" | "success";
  target?: string[];
  timestamp: number;
};

// Private state for chat messages
let _chatMessages = $state<ChatMessage[]>([]);

/**
 * Initialize chat messages from page data
 */
export function initChatMessages(messages: ChatMessage[]) {
  _chatMessages = messages;
}

/**
 * Add a new chat message (called when socket receives 'chatMessage' event)
 */
export function addChatMessage(message: ChatMessage) {
  _chatMessages = [..._chatMessages, message];
}

/**
 * Clear chat messages (when leaving game)
 */
export function clearChatMessages() {
  _chatMessages = [];
}

/**
 * Chat messages store - provides reactive access to messages
 */
export const chatMessagesStore = {
  get value(): ChatMessage[] {
    return _chatMessages;
  }
};

// Re-export simplified interface
export default {
  chatMessagesStore,
  initChatMessages,
  addChatMessage,
  clearChatMessages
};
