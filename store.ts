
import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomStatus, RoomMode, Student, SentenceInstance, SentenceTemplate } from './types.ts';

declare const Peer: any;

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

let globalRoom: Room | null = null;
const listeners: Array<() => void> = [];
let peerInstance: any = null;
let connections: any[] = [];
let studentConn: any = null;
let timerInterval: any = null;

const notify = () => {
  listeners.forEach(l => l());
  if (peerInstance && !studentConn && globalRoom) {
    connections.forEach(conn => {
      if (conn.open) conn.send({ type: 'SYNC', room: globalRoom });
    });
  }
};

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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

  useEffect(() => {
    // 교사(서버) 사이드에서만 타이머를 동작시킴
    if (studentConn) return;

    if (globalRoom?.activeAuction && globalRoom.activeAuction.timeLeft > 0) {
      if (!timerInterval) {
        timerInterval = setInterval(() => {
          if (globalRoom?.activeAuction) {
            if (globalRoom.activeAuction.timeLeft > 0) {
              globalRoom.activeAuction.timeLeft -= 1;
              if (globalRoom.activeAuction.timeLeft <= 0) {
                // 시간이 다 되면 즉시 마감 처리
                clearInterval(timerInterval);
                timerInterval = null;
                closeAuction();
              } else {
                notify();
              }
            }
          }
        }, 1000);
      }
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
    return () => {}; 
  }, [globalRoom?.activeAuction, !!studentConn]);

  const createRoom = useCallback((teacherId: string, customCode: string) => {
    const code = customCode.toUpperCase().trim();
    if (typeof Peer === 'undefined') return null;

    const room: Room = {
      id: generateId(),
      code,
      teacherId,
      mode: RoomMode.MEMO,
      status: RoomStatus.SETUP,
      templates: [],
      students: [],
      activeAuction: null,
      initialCoins: 100000,
      currentSellerIdx: 0,
    };
    
    globalRoom = room;
    if (peerInstance) peerInstance.destroy();
    peerInstance = new Peer(`RSA-${code}`);
    peerInstance.on('open', () => { setIsPeerReady(true); notify(); });
    peerInstance.on('connection', (conn: any) => {
      connections.push(conn);
      conn.on('data', (data: any) => handleAction(data));
      conn.on('open', () => { if (globalRoom) conn.send({ type: 'SYNC', room: globalRoom }); });
    });
    return room;
  }, []);

  const handleAction = (data: any) => {
    if (!globalRoom) return;
    const student = globalRoom.students.find(s => s.id === data.studentId);
    
    switch (data.type) {
      case 'JOIN':
        if (!globalRoom.students.find(s => s.nickname === data.nickname)) {
          globalRoom.students.push({
            id: generateId(), nickname: data.nickname, coins: globalRoom.initialCoins,
            inventory: [], worksheetAnswers: {}, score: 0, bidCount: 0, saleCount: 0
          });
        }
        notify();
        break;
      case 'BID':
        if (globalRoom.activeAuction && student && student.coins >= data.amount) {
          const currentMax = globalRoom.activeAuction.highestBid?.amount || 1000;
          if (data.amount >= currentMax) {
            globalRoom.activeAuction.highestBid = { studentId: data.studentId, nickname: student.nickname, amount: data.amount, timestamp: Date.now() };
            globalRoom.activeAuction.timeLeft = 10; 
            student.bidCount += 1;
            notify();
          }
        }
        break;
      case 'START_AUCTION':
        const item = student?.inventory.find(i => i.id === data.instanceId);
        if (student && item && !globalRoom.activeAuction) {
          globalRoom.activeAuction = { 
            instanceId: data.instanceId, sellerId: data.studentId, sellerNickname: student.nickname, 
            text: item.text, concept: item.concept, highestBid: null, timeLeft: 10 
          };
          notify();
        }
        break;
      case 'SKIP_TURN':
        if (globalRoom.status === RoomStatus.MARKET) {
            globalRoom.currentSellerIdx = (globalRoom.currentSellerIdx + 1) % globalRoom.students.length;
            notify();
        }
        break;
      case 'UPDATE_WORKSHEET':
        if (student) {
          if (data.slotIndex !== undefined && data.instanceId !== undefined) {
             if (data.instanceId === null) {
                student.inventory.forEach(i => { if(i.assignedSlot === data.slotIndex) i.assignedSlot = null; });
             } else {
                student.inventory.forEach(i => { if(i.assignedSlot === data.slotIndex) i.assignedSlot = null; });
                const targetItem = student.inventory.find(i => i.id === data.instanceId);
                if (targetItem) targetItem.assignedSlot = data.slotIndex;
             }
          }
          if (data.slotIndex !== undefined && data.answer !== undefined) {
             student.worksheetAnswers[data.slotIndex] = data.answer;
          }
          notify();
        }
        break;
    }
  };

  const finalizeSetup = useCallback((templates: SentenceTemplate[], mode: RoomMode, initialCoins: number) => {
    if (!globalRoom) return;
    globalRoom.templates = templates;
    globalRoom.mode = mode;
    globalRoom.initialCoins = initialCoins;
    globalRoom.status = RoomStatus.LOBBY;
    notify();
  }, []);

  const startGame = useCallback(() => {
    if (!globalRoom || globalRoom.students.length === 0) return;
    const templates = globalRoom.templates;
    const numStudents = globalRoom.students.length;
    
    let allInstances: SentenceInstance[] = [];
    templates.forEach((temp, tempIdx) => {
      for (let i = 0; i < numStudents; i++) {
        allInstances.push({
          id: generateId(), text: temp.text, concept: temp.concept, 
          ownerId: null, ownerNickname: null, orderIndex: tempIdx, assignedSlot: null
        });
      }
    });

    allInstances = shuffleArray(allInstances);

    globalRoom.students.forEach((student, sIdx) => {
      student.inventory = [];
      student.worksheetAnswers = {};
      student.coins = globalRoom!.initialCoins;
      student.bidCount = 0;
      student.saleCount = 0;
      
      const startIdx = sIdx * templates.length;
      const myItems = allInstances.slice(startIdx, startIdx + templates.length);
      
      myItems.forEach(item => {
        item.ownerId = student.id;
        item.ownerNickname = student.nickname;
      });
      student.inventory = myItems;
    });

    globalRoom.status = RoomStatus.MARKET;
    globalRoom.currentSellerIdx = 0;
    notify();
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
          item.assignedSlot = null;
          buyer.inventory.push(item);
          buyer.coins -= highestBid.amount;
          seller.coins += highestBid.amount;
          seller.saleCount += 1; // 판매 성공 기록
        }
      }
    }
    globalRoom.activeAuction = null;
    globalRoom.currentSellerIdx = (globalRoom.currentSellerIdx + 1) % globalRoom.students.length;
    notify();
  }, []);

  const addTime = useCallback(() => {
    if (globalRoom?.activeAuction) {
        globalRoom.activeAuction.timeLeft += 1;
        notify();
    }
  }, []);

  const sendCoins = useCallback((studentId: string, amount: number) => {
    if (!globalRoom) return;
    const student = globalRoom.students.find(s => s.id === studentId);
    if (student) {
        student.coins += amount;
        notify();
    }
  }, []);

  const finishRoom = useCallback(() => {
    if (!globalRoom) return;
    globalRoom.students.forEach(student => {
        let correctCount = 0;
        globalRoom!.templates.forEach((temp, idx) => {
            const answer = student.worksheetAnswers[idx];
            const assigned = student.inventory.find(i => i.assignedSlot === idx);
            if (globalRoom!.mode === RoomMode.MEMO) {
              if (assigned && assigned.text === temp.text && answer === temp.concept) correctCount++;
            } else {
              if (assigned && assigned.text === temp.text) correctCount++;
            }
        });
        // 점수 공식: 인벤토리*10 + 정답*50 + 입찰*5
        student.score = (student.inventory.length * 10) + (correctCount * 50) + (student.bidCount * 5);
    });
    globalRoom.status = RoomStatus.FINISHED;
    notify();
  }, []);

  const joinRoom = useCallback((code: string, nickname: string) => {
    const targetCode = code.toUpperCase().trim();
    if (peerInstance) peerInstance.destroy();
    peerInstance = new Peer(); 
    return new Promise<string | null>((resolve) => {
      peerInstance.on('open', () => {
        const conn = peerInstance.connect(`RSA-${targetCode}`);
        studentConn = conn;
        conn.on('open', () => { conn.send({ type: 'JOIN', nickname }); setIsPeerReady(true); });
        conn.on('data', (data: any) => {
          if (data.type === 'SYNC') {
            globalRoom = data.room;
            const myInfo = globalRoom?.students.find(s => s.nickname === nickname);
            notify();
            if (myInfo) resolve(myInfo.id);
          }
        });
      });
    });
  }, []);

  const placeBid = (studentId: string, amount: number) => {
    if (studentConn) studentConn.send({ type: 'BID', studentId, amount });
  };
  const startAuction = (studentId: string, instanceId: string) => {
    if (studentConn) studentConn.send({ type: 'START_AUCTION', studentId, instanceId });
  };
  const skipTurn = (studentId: string) => {
    if (studentConn) studentConn.send({ type: 'SKIP_TURN', studentId });
  };
  const updateWorksheet = (studentId: string, slotIndex: number, data: any) => {
    if (studentConn) studentConn.send({ type: 'UPDATE_WORKSHEET', studentId, slotIndex, ...data });
  };

  return { 
    room: globalRoom, isPeerReady, createRoom, finalizeSetup, joinRoom, startGame, 
    startAuction, placeBid, closeAuction, addTime, skipTurn, updateWorksheet, finishRoom, sendCoins, resetStore: () => window.location.reload() 
  };
};
