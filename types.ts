
export enum RoomMode {
  MEMO = 'memo', // 개념 매칭
  ORDER = 'order' // 순서 매칭
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
  orderIndex: number;
  assignedSlot?: number | null;
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
  timeLeft: number; 
}

export interface Student {
  id: string;
  nickname: string;
  coins: number;
  inventory: SentenceInstance[];
  worksheetAnswers: { [key: number]: string };
  score: number;
  bidCount: number; 
  saleCount: number; // 판매 성공 횟수 추가
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
  currentSellerIdx: number; 
}
