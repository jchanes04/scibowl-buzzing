export type ChatMessage = {
    text: string;
    type: "buzz" | "notification" | "warning" | "success";
};

const chatMessages: ChatMessage[] = $state([]);
export default chatMessages;
