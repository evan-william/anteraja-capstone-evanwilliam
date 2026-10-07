export type AssistantOption =
  | { kind: 'ask'; label: string; prompt: string }
  | { kind: 'link'; label: string; href: string }
  | { kind: 'ticket_status'; label: string; ticketId: string; ticketNumber: string; status: 'in_progress' | 'resolved' };

export type AssistantReply = {
  answer: string;
  options: AssistantOption[];
  mode: 'gemini' | 'data';
  notice: string | null;
  checkedAt: string;
};

export type AssistantHistoryItem = { role: 'user' | 'assistant'; text: string };
