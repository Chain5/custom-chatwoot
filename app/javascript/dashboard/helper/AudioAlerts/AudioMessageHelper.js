export const getAssignee = message => message?.conversation?.assignee_id;
export const isConversationUnassigned = message => !getAssignee(message);
export const isConversationAssignedToMe = (message, currentUserId) =>
  getAssignee(message) === currentUserId;
// Contacts and agents have separate ID sequences, so the sender type must match too
export const isMessageFromCurrentUser = (message, currentUserId) =>
  message?.sender_type === 'User' && message?.sender_id === currentUserId;
