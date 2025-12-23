
import { useState, useEffect, useCallback } from 'react';
import { Room, RoomStatus, RoomMode, Student, SentenceInstance, SentenceTemplate } from './types.ts';

declare const Peer: any;

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
    if (typeof Peer === 'undefined') return null;

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
    peerInstance.on('open', () => { setIsPeerReady(true); notify(); });
    peerInstance.on('connection', (conn: any) => {
      connections.push(conn);
      conn.on('data', (data: any) => handleStudentAction(data, conn));
      conn.on('open', () => { if (globalRoom) conn.send({ type: 'SYNC', room: globalRoom }); });
    });
    return room;
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

  const handleStudentAction = (data: any, conn: any) => {
    if (!globalRoom) return;
    const student = globalRoom.students.find(s => s.id === data.studentId);
    
    switch (data.type) {
      case 'JOIN':
        if (!globalRoom.students.find(s => s.nickname === data.nickname)) {
          globalRoom.students.push({
            id: generateId(),
            nickname: data.nickname,
            coins: globalRoom.initialCoins,
            inventory: [],
            worksheetAnswers: {}
          });
        }
        notify();
        break;
      case 'BID':
        if (globalRoom.activeAuction && student && student.coins >= data.amount) {
          if (!globalRoom.activeAuction.highestBid || data.amount > globalRoom.activeAuction.highestBid.amount) {
            globalRoom.activeAuction.highestBid = { studentId: data.studentId, nickname: student.nickname, amount: data.amount, timestamp: Date.now() };
            notify();
          }
        }
        break;
      case 'START_AUCTION':
        const item = student?.inventory.find(i => i.id === data.instanceId);
        if (student && item && !globalRoom.activeAuction) {
          globalRoom.activeAuction = { instanceId: data.instanceId, sellerId: data.studentId, sellerNickname: student.nickname, text: item.text, concept: item.concept, highestBid: null };
          notify();
        }
        break;
      case 'UPDATE_WORKSHEET':
        if (student) {
          if (data.slotIndex !== undefined && data.instanceId !== undefined) {
             // 기존에 이 슬롯에 있던 아이템 해제
             student.inventory.forEach(i => { if(i.assignedSlot === data.slotIndex) i.assignedSlot = null; });
             // 새 아이템 배정
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

  const finalizeSetup = useCallback((rawInput: string, mode: RoomMode, initialCoins: number) => {
    if (!globalRoom) return;
    globalRoom.templates = rawInput.split('\n').map(line => line.trim()).filter(l => l).map(line => {
      const [text, concept] = line.split('/').map(s => s.trim());
      return { text: text || "내용 없음", concept: concept || "미지정" };
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
      student.worksheetAnswers = {};
      // 초기 2개 랜덤 지급
      for (let i = 0; i < 2; i++) {
        const randomIdx = Math.floor(Math.random() * templates.length);
        const template = templates[randomIdx];
        student.inventory.push({ id: generateId(), text: template.text, concept: template.concept, ownerId: student.id, ownerNickname: student.nickname, orderIndex: i, isSold: false, assignedSlot: null });
      }
    });
    globalRoom.status = RoomStatus.MARKET;
    notify();
  }, []);

  const transferCoins = useCallback((studentId: string, amount: number) => {
    if (!globalRoom) return;
    const student = globalRoom.students.find(s => s.id === studentId);
    if (student) {
      student.coins += amount;
      notify();
    }
  }, []);

  const updateWorksheet = useCallback((studentId: string, slotIndex: number, data: { instanceId?: string | null, answer?: string }) => {
    if (studentConn) {
      studentConn.send({ type: 'UPDATE_WORKSHEET', studentId, slotIndex, ...data });
    }
  }, []);

  const startAuction = useCallback((studentId: string, instanceId: string) => {
    if (studentConn) studentConn.send({ type: 'START_AUCTION', studentId, instanceId });
    else handleStudentAction({ type: 'START_AUCTION', studentId, instanceId }, null);
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
          item.assignedSlot = null; // 주인 바뀌면 배정 해제
          buyer.inventory.push(item);
          buyer.coins -= highestBid.amount;
          seller.coins += highestBid.amount;
        }
      }
    }
    globalRoom.activeAuction = null;
    notify();
  }, []);

  const resetStore = useCallback(() => {
    if (peerInstance) peerInstance.destroy();
    globalRoom = null;
    connections = [];
    studentConn = null;
    notify();
    window.location.reload();
  }, []);

  return { room: globalRoom, isPeerReady, createRoom, finalizeSetup, joinRoom, startGame, startAuction, placeBid, closeAuction, transferCoins, updateWorksheet, resetStore };
};
