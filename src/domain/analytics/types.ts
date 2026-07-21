export type RollupInterval = "minute" | "hour" | "day";

export interface ActionEvent {
  id: string;
  siteId: string;
  hopupId: string;
  actionId: string;
  visitorId: string;
  sessionId: string;
  shownAt: Date;
}

export interface RollupBucket {
  siteId: string;
  hopupId: string;
  interval: RollupInterval;
  intervalStart: Date;
  count: number;
}
