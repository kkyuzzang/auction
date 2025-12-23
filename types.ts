
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
  timeLeft: number; // 5초 카운트다운
}

export interface Student {
  id: string;
  nickname: string;
  coins: number;
  inventory: SentenceInstance[];
  worksheetAnswers: { [key: number]: string };
  score: number;
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
  currentSellerIdx: number; // 현재 판매 차례인 학생 인덱스
}
