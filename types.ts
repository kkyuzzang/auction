
export enum RoomMode {
  MEMO = 'memo',
  ORDER = 'order',
  BOTH = 'both'
}

export enum RoomStatus {
  SETUP = 'setup',
  LOBBY = 'lobby',
  MARKET = 'market', 
  FINISHED = 'finished'
}

export interface SentenceTemplate {
  text: string;
  concept: string;
}

export interface SentenceInstance {
  id: string;
  text: string;
  concept: string;
  ownerId: string | null;
  ownerNickname: string | null;
  memo?: string;
  orderIndex: number;
  isSold: boolean;
}

export interface Bid {
  studentId: string;
  nickname: string;
  amount: number;
  timestamp: number;
}

export interface ActiveAuction {
  instanceId: string;
  sellerId: string;
  sellerNickname: string;
  text: string;
  concept: string;
  highestBid: Bid | null;
}

export interface Student {
  id: string;
  nickname: string;
  coins: number;
  inventory: SentenceInstance[];
}

export interface Room {
  id: string;
  code: string;
  teacherId: string;
  mode: RoomMode;
  status: RoomStatus;
  templates: SentenceTemplate[]; 
  students: Student[];
  activeAuction: ActiveAuction | null;
  initialCoins: number;
}
