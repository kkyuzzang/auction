
import { useState, useEffect, useCallback } from 'react';
import { Room, RoomStatus, RoomMode, Student, SentenceInstance, SentenceTemplate } from './types.ts';

declare const Peer: any;

// UUID 생성 폴백 (crypto.randomUUID 미지원 브라우저 대비)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

let globalRoom: Room | null = null;
const listeners: Array<() => void> = [];
let peerInstance: any = null;
let connections: any[] = [];
let studentConn: any = null;

const notify = () => {
  listeners.forEach(l => l());
  if (peerInstance && !studentConn && globalRoom) {
    connections.forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'SYNC', room: globalRoom });
      }
    });
  }
};

export const useRoomStore = () => {
  const [, setTick] = useState(0);
  const [isPeerReady, setIsPeerReady] = useState(false);

  useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.push(l);
    return () => {
      const idx = listeners.indexOf(l);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const createRoom = useCallback((teacherId: string, customCode: string) => {
    const code = customCode.toUpperCase().trim();
    if (typeof Peer === 'undefined') {
      alert('네트워크 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return null;
    }

    const room: Room = {
      id: generateId(),
      code,
      teacherId,
      mode: RoomMode.BOTH,
      status: RoomStatus.SETUP,
      templates: [],
      students: [],
      activeAuction: null,
      initialCoins: 1000,
    };
    
    globalRoom = room;

    if (peerInstance) peerInstance.destroy();
    peerInstance = new Peer(`RSA-${code}`);
    
    peerInstance.on('open', () => {
      setIsPeerReady(true);
      notify();
    });

    peerInstance.on('connection', (conn: any) => {
      connections.push(conn);
      conn.on('data', (data: any) => {
        handleStudentAction(data, conn);
      });
      conn.on('open', () => {
        if (globalRoom) conn.send({ type: 'SYNC', room: globalRoom });
      });
    });

    peerInstance.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        alert('이미 사용 중인 룸코드입니다. 다른 코드를 사용해 주세요.');
        resetStore();
      }
    });

    return room;
  }, []);

  const joinRoom = useCallback((code: string, nickname: string) => {
    const targetCode = code.toUpperCase().trim();
    if (typeof Peer === 'undefined') {
      alert('네트워크 라이브러리 로딩 중입니다.');
      return Promise.resolve(null);
    }
    
    if (peerInstance) peerInstance.destroy();
    peerInstance = new Peer(); 
    
    return new Promise<string | null>((resolve) => {
      peerInstance.on('open', () => {
        const conn = peerInstance.connect(`RSA-${targetCode}`);
        studentConn = conn;

        conn.on('open', () => {
          conn.send({ type: 'JOIN', nickname });
          setIsPeerReady(true);
        });

        conn.on('data', (data: any) => {
          if (data.type === 'SYNC') {
            globalRoom = data.room;
            const myInfo = globalRoom?.students.find(s => s.nickname === nickname);
            notify();
            if (myInfo) resolve(myInfo.id);
          }
        });

        conn.on('error', () => {
          alert('방을 찾을 수 없습니다.');
          resolve(null);
        });
      });
    });
  }, []);

  const handleStudentAction = (data: any, conn: any) => {
    if (!globalRoom) return;
    switch (data.type) {
      case 'JOIN':
        const existing = globalRoom.students.find(s => s.nickname === data.nickname);
        if (!existing) {
          globalRoom.students.push({
            id: generateId(),
            nickname: data.nickname,
            coins: globalRoom.initialCoins,
            inventory: [],
          });
        }
        notify();
        break;
      case 'BID':
        if (globalRoom.activeAuction) {
          const student = globalRoom.students.find(s => s.id === data.studentId);
          if (student && student.coins >= data.amount) {
            if (!globalRoom.activeAuction.highestBid || data.amount > globalRoom.activeAuction.highestBid.amount) {
              globalRoom.activeAuction.highestBid = {
                studentId: data.studentId,
                nickname: student.nickname,
                amount: data.amount,
                timestamp: Date.now()
              };
              notify();
            }
          }
        }
        break;
      case 'START_AUCTION':
        const seller = globalRoom.students.find(s => s.id === data.studentId);
        const item = seller?.inventory.find(i => i.id === data.instanceId);
        if (seller && item && !globalRoom.activeAuction) {
          globalRoom.activeAuction = {
            instanceId: data.instanceId,
            sellerId: data.studentId,
            sellerNickname: seller.nickname,
            text: item.text,
            concept: item.concept,
            highestBid: null
          };
          notify();
        }
        break;
      case 'UPDATE_MEMO':
        const targetStudent = globalRoom.students.find(s => s.id === data.studentId);
        const targetItem = targetStudent?.inventory.find(i => i.id === data.instanceId);
        if (targetItem) {
          targetItem.memo = data.memo;
          notify();
        }
        break;
    }
  };

  const finalizeSetup = useCallback((rawInput: string, mode: RoomMode, initialCoins: number) => {
    if (!globalRoom) return;
    globalRoom.templates = rawInput.split('\n').map(line => line.trim()).filter(l => l).map(line => {
      const [text, concept] = line.split('/').map(s => s.trim());
      return { text: text || "내용 없음", concept: concept || (mode === RoomMode.ORDER ? "0" : "미지정") };
    });
    globalRoom.mode = mode;
    globalRoom.initialCoins = initialCoins;
    globalRoom.status = RoomStatus.LOBBY;
    notify();
  }, []);

  const startGame = useCallback(() => {
    if (!globalRoom || globalRoom.students.length === 0) return;
    const templates = globalRoom.templates;
    globalRoom.students.forEach(student => {
      student.inventory = [];
      for (let i = 0; i < 2; i++) {
        const randomIdx = Math.floor(Math.random() * templates.length);
        const template = templates[randomIdx];
        student.inventory.push({
          id: generateId(),
          text: template.text,
          concept: template.concept,
          ownerId: student.id,
          ownerNickname: student.nickname,
          orderIndex: i,
          isSold: false
        });
      }
    });
    globalRoom.status = RoomStatus.MARKET;
    notify();
  }, []);

  const startAuction = useCallback((studentId: string, instanceId: string) => {
    if (studentConn) studentConn.send({ type: 'START_AUCTION', studentId, instanceId });
    else {
      const seller = globalRoom?.students.find(s => s.id === studentId);
      const item = seller?.inventory.find(i => i.id === instanceId);
      if (globalRoom && seller && item) {
        globalRoom.activeAuction = { instanceId, sellerId: studentId, sellerNickname: seller.nickname, text: item.text, concept: item.concept, highestBid: null };
        notify();
      }
    }
  }, []);

  const placeBid = useCallback((studentId: string, amount: number) => {
    if (studentConn) studentConn.send({ type: 'BID', studentId, amount });
  }, []);

  const closeAuction = useCallback(() => {
    if (!globalRoom || !globalRoom.activeAuction) return;
    const { sellerId, instanceId, highestBid } = globalRoom.activeAuction;
    if (highestBid) {
      const seller = globalRoom.students.find(s => s.id === sellerId);
      const buyer = globalRoom.students.find(s => s.id === highestBid.studentId);
      if (seller && buyer) {
        const itemIdx = seller.inventory.findIndex(i => i.id === instanceId);
        if (itemIdx > -1) {
          const item = seller.inventory.splice(itemIdx, 1)[0];
          item.ownerId = buyer.id;
          item.ownerNickname = buyer.nickname;
          buyer.inventory.push(item);
          buyer.coins -= highestBid.amount;
          seller.coins += highestBid.amount;
        }
      }
    }
    globalRoom.activeAuction = null;
    notify();
  }, []);

  const updateInventoryItem = useCallback((studentId: string, instanceId: string, updates: Partial<SentenceInstance>) => {
    if (studentConn && updates.memo !== undefined) {
      studentConn.send({ type: 'UPDATE_MEMO', studentId, instanceId, memo: updates.memo });
    }
  }, []);

  const finishRoom = useCallback(() => {
    if (globalRoom) { globalRoom.status = RoomStatus.FINISHED; notify(); }
  }, []);

  const resetStore = useCallback(() => {
    if (peerInstance) peerInstance.destroy();
    globalRoom = null;
    connections = [];
    studentConn = null;
    notify();
    window.location.reload();
  }, []);

  return { room: globalRoom, isPeerReady, createRoom, finalizeSetup, joinRoom, startGame, startAuction, placeBid, closeAuction, updateInventoryItem, finishRoom, resetStore };
};
