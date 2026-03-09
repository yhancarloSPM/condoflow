export interface Block {
  id: number;
  name: string;
  description?: string;
}

export interface Apartment {
  id: number;
  number: string;
  blockId: number;
  blockName: string;
  ownerId?: string;
  ownerName?: string;
}

export interface Status {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Priority {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface EventType {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface PaymentConcept {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Provider {
  id: number;
  name: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
}
