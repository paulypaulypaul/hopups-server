export interface Visitor {
  id: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  visitorId: string;
  siteId: string;
  lastActiveAt: Date;
  completedActionIds: string[];
}

export const SESSION_INACTIVITY_WINDOW_MINUTES = 30;

export interface VisitorEvent {
  type: string;
  path?: string;
  payload?: Record<string, unknown>;
  occurredAt: Date;
}
