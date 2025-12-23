
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

  // 타이머 핸들러 (선생님 사이드에서만 동작)
  useEffect(() => {
    const shouldRun = !studentConn && globalRoom?.activeAuction && globalRoom.activeAuction.timeLeft > 0;
    
    if (shouldRun) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (globalRoom?.activeAuction && globalRoom.activeAuction.timeLeft > 0) {
          globalRoom.activeAuction.timeLeft -= 1;
          if (globalRoom.activeAuction.timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            closeAuction();
          }
          notify();
        }
      }, 1000);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [globalRoom?.activeAuction?.timeLeft, !!studentConn]);

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
            inventory: [], worksheetAnswers: {}, score: 0
          });
        }
        notify();
        break;
      case 'BID':
        if (globalRoom.activeAuction && student && student.coins >= data.amount) {
          const currentMax = globalRoom.activeAuction.highestBid?.amount || 1000;
          if (data.amount >= currentMax) {
            globalRoom.activeAuction.highestBid = { studentId: data.studentId, nickname: student.nickname, amount: data.amount, timestamp: Date.now() };
            globalRoom.activeAuction.timeLeft = 5; // 입찰 시 5초 리셋
            notify();
          }
        }
        break;
      case 'START_AUCTION':
        const item = student?.inventory.find(i => i.id === data.instanceId);
        if (student && item && !globalRoom.activeAuction) {
          globalRoom.activeAuction = { 
            instanceId: data.instanceId, sellerId: data.studentId, sellerNickname: student.nickname, 
            text: item.text, concept: item.concept, highestBid: null, timeLeft: 5 
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
             student.inventory.forEach(i => { if(i.assignedSlot === data.slotIndex) i.assignedSlot = null; });
             const targetItem = student.inventory.find(i => i.id === data.instanceId);
             if (targetItem) targetItem.assignedSlot = data.slotIndex;
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
    
    // 1. 모든 문장을 학생 수만큼 복제하여 거대 풀 생성
    let allInstances: SentenceInstance[] = [];
    templates.forEach((temp, tempIdx) => {
      for (let i = 0; i < numStudents; i++) {
        allInstances.push({
          id: generateId(),
          text: temp.text,
          concept: temp.concept,
          ownerId: null,
          ownerNickname: null,
          orderIndex: tempIdx,
          assignedSlot: null
        });
      }
    });

    // 2. 풀을 섞기
    allInstances = shuffleArray(allInstances);

    // 3. 학생들에게 동일한 개수(템플릿 개수만큼) 배분
    globalRoom.students.forEach((student, sIdx) => {
      student.inventory = [];
      student.worksheetAnswers = {};
      student.coins = globalRoom!.initialCoins;
      
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

  const finishRoom = useCallback(() => {
    if (!globalRoom) return;
    globalRoom.students.forEach(student => {
        let score = student.inventory.length * 10;
        globalRoom!.templates.forEach((temp, idx) => {
            const answer = student.worksheetAnswers[idx];
            const assigned = student.inventory.find(i => i.assignedSlot === idx);
            if (assigned && assigned.text === temp.text && answer === temp.concept) {
                score += 50;
            }
        });
        student.score = score;
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
    startAuction, placeBid, closeAuction, addTime, skipTurn, updateWorksheet, finishRoom, resetStore: () => window.location.reload() 
  };
};
