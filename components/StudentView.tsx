
import React, { useState } from 'react';
import { useRoomStore } from '../store';
import { RoomStatus, RoomMode } from '../types';
import { CoinsIcon, GavelIcon } from './Icons';

interface StudentViewProps {
  studentId: string;
}

const StudentView: React.FC<StudentViewProps> = ({ studentId }) => {
  const { room, placeBid, startAuction, updateInventoryItem } = useRoomStore();
  const [bidValue, setBidValue] = useState<number>(0);

  if (!room) return null;
  const student = room.students.find(s => s.id === studentId);
  if (!student) return null;

  const activeAuction = room.activeAuction;
  const isBidding = activeAuction !== null;
  const isSeller = activeAuction?.sellerId === studentId;
  const isHighest = activeAuction?.highestBid?.studentId === studentId;

  const isOrderMode = room.mode === RoomMode.ORDER;

  if (room.status === RoomStatus.LOBBY || room.status === RoomStatus.SETUP) {
      return (
          <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-32 h-32 bg-[#2D0A0A] rounded-full flex items-center justify-center border-4 border-[#D4AF37] mb-8 animate-pulse shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                  <span className="text-5xl">🏛️</span>
              </div>
              <h2 className="text-4xl font-black text-[#D4AF37] mb-2 tracking-tighter">ROYAL AUCTION HOUSE</h2>
              <p className="text-[#D4AF37]/60 font-medium uppercase tracking-widest text-sm mb-12 italic">경매 관리자의 승인을 기다리는 중입니다...</p>
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 w-full max-w-xs shadow-2xl backdrop-blur-md">
                  <p className="text-[10px] text-[#D4AF37] font-black uppercase mb-2 tracking-[0.2em]">Bidder Name</p>
                  <p className="text-2xl font-black text-white">{student.nickname}</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1A1A1A] pb-24 font-sans">
      <div className="bg-white p-6 shadow-xl border-b-2 border-gray-100 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2D0A0A] rounded-2xl flex items-center justify-center text-[#D4AF37] font-black text-xl shadow-lg">
                  {student.nickname[0]}
              </div>
              <div>
                  <h2 className="font-black text-gray-800 text-lg">{student.nickname}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Authorized Bidder
                  </p>
              </div>
          </div>
          <div className="flex items-center gap-3 bg-[#FFFDF5] px-6 py-3 rounded-2xl border-2 border-[#D4AF37] shadow-inner">
              <div className="text-right">
                  <span className="block text-[9px] font-black text-[#D4AF37] uppercase tracking-tighter">Gold Balance</span>
                  <span className="font-black text-[#2D0A0A] text-2xl tracking-tighter">{student.coins}</span>
              </div>
              <span className="text-2xl">💰</span>
          </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8 mt-6">
        {isBidding ? (
            <div className="space-y-6">
                <div className="bg-[#2D0A0A] p-10 rounded-[50px] text-[#D4AF37] shadow-2xl relative overflow-hidden border-4 border-[#D4AF37]">
                    <div className="absolute -right-12 -bottom-12 opacity-5 rotate-12">
                        <GavelIcon className="w-64 h-64"/>
                    </div>
                    <div className="relative z-10 text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-4 block">
                            {isSeller ? "You are Selling" : `Bid for ${activeAuction.sellerNickname}'s Asset`}
                        </span>
                        <p className="text-3xl md:text-4xl font-serif italic leading-snug mb-10 text-white">
                            "{activeAuction.text}"
                        </p>
                        
                        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
                            <div className="bg-white/5 backdrop-blur-md p-5 rounded-[25px] border border-white/10">
                                <span className="text-[9px] opacity-60 block mb-1 uppercase font-bold tracking-widest">High Bid</span>
                                <span className="text-3xl font-black">{activeAuction.highestBid?.amount || 0}</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-5 rounded-[25px] border border-white/10">
                                <span className="text-[9px] opacity-60 block mb-1 uppercase font-bold tracking-widest">Top Bidder</span>
                                <span className="text-xl font-black truncate block">{activeAuction.highestBid?.nickname || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {!isSeller && (
                    <div className="bg-white p-8 rounded-[40px] shadow-2xl border-2 border-gray-100">
                        {isHighest ? (
                            <div className="bg-[#064E3B] p-6 rounded-[30px] text-center border-2 border-[#059669] animate-pulse">
                                <p className="text-[#D1FAE5] font-black">👑 현재 귀하가 최고가 입찰 중입니다!</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight">✋ 응찰하기</h3>
                                    <span className="text-xs font-bold text-gray-400">최소 입찰: {(activeAuction.highestBid?.amount || 0) + 1}</span>
                                </div>
                                <div className="flex gap-4">
                                    <input 
                                        type="number"
                                        min={(activeAuction.highestBid?.amount || 0) + 1}
                                        max={student.coins}
                                        value={bidValue || ''}
                                        onChange={(e) => setBidValue(Number(e.target.value))}
                                        placeholder="입찰액 입력"
                                        className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 focus:border-[#D4AF37] outline-none text-xl font-black"
                                    />
                                    <button 
                                        onClick={() => { placeBid(studentId, bidValue); setBidValue(0); }}
                                        className="bg-[#2D0A0A] text-[#D4AF37] px-10 py-4 rounded-3xl font-black shadow-lg disabled:opacity-30 transition hover:bg-black"
                                        disabled={bidValue <= (activeAuction.highestBid?.amount || 0) || bidValue > student.coins}
                                    >
                                        입찰
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-white/50 border-4 border-dashed border-gray-200 rounded-[50px] py-16 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">현재 진행 중인 경매가 없습니다.</p>
            </div>
        )}

        <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <span className="text-3xl">📦</span> 나의 소유 자산 ({student.inventory.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.inventory.map((item) => (
                    <div key={item.id} className="bg-white rounded-[40px] shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition group">
                        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-b border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="text-[#D4AF37]">✦</span> Knowledge Asset
                            </span>
                            {!isBidding && (
                                <button 
                                    onClick={() => startAuction(studentId, item.id)}
                                    className="text-[10px] font-black bg-[#2D0A0A] text-[#D4AF37] px-4 py-1.5 rounded-full hover:bg-black transition border border-[#D4AF37]/30"
                                >
                                    경매 출품 🔨
                                </button>
                            )}
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <p className="text-xl font-serif italic text-gray-800 leading-relaxed">"{item.text}"</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#D4AF37] uppercase bg-[#2D0A0A] px-2 py-0.5 rounded">
                                        {isOrderMode ? 'ORDER NO.' : 'CONCEPT'}
                                    </span>
                                    <span className={`text-sm font-bold uppercase tracking-tight ${isOrderMode ? 'text-2xl text-[#2D0A0A]' : 'text-gray-500'}`}>
                                        {item.concept}
                                    </span>
                                </div>
                            </div>
                            
                            {(room.mode === RoomMode.MEMO || room.mode === RoomMode.BOTH) && (
                                <textarea 
                                    value={item.memo || ''}
                                    onChange={(e) => updateInventoryItem(studentId, item.id, { memo: e.target.value })}
                                    placeholder="낙찰받은 문장의 핵심을 기록하세요..."
                                    className="w-full bg-gray-50/50 border-2 border-transparent focus:border-[#D4AF37]/30 focus:bg-white rounded-[25px] p-4 text-sm outline-none transition"
                                    rows={2}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
