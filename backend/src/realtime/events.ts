// Socket.io event contract shared between the gateway and whatever client (mobile/web) connects.
export const RideEvents = {
  NEW: 'ride:new',
  TAKEN: 'ride:taken',
  ACCEPTED: 'ride:accepted',
  ARRIVED: 'ride:arrived',
  COMPLETED: 'ride:completed',
  CANCELLED: 'ride:cancelled',
} as const;

export const ChatEvents = {
  NEW_MESSAGE: 'message:new',
} as const;
