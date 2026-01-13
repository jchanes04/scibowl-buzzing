export type ChatMessage = {
    text: string;
    type: "buzz" | "notification" | "warning" | "success";
  };
  
  let messages = $state<ChatMessage[]>([]);
  
  const chatMessagesStore = {
    get value() {
      return messages;
    },
    set(newMessages: ChatMessage[]) {
      messages = newMessages;
    },
    add(message: ChatMessage) {
      messages = [...messages, message];
    },
    clear() {
      messages = [];
    },
  };
  
  export default chatMessagesStore;