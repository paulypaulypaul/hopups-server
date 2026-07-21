export interface PhoneNumberPool {
  siteId: string;
  numbers: string[];
  defaultNumber: string | null;
}

export interface PhoneNumberAllocation {
  id: string;
  siteId: string;
  sessionId: string;
  phoneNumber: string;
  allocatedAt: Date;
}
