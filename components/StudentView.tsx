
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus, RoomMode } from '../types.ts';

const StudentView: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { room, placeBid, startAuction, skipTurn, updateWorksheet } = useRoomStore();
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  if (!room) return null;
  const student = room.students.find(s => s.id === studentId);
  if (!student) return null;

  const isMyTurn = room.students[room.currentSellerIdx]?.id === studentId;
  const activeAuction = room.activeAuction;

  if (room.status === RoomStatus.LOBBY) return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-10 text-white">
        <div className="text-8xl mb-10 animate-pulse">🏛️</div>
        <h2 className="text-4xl font-black text-[#D4AF37] mb-2 tracking-widest uppercase">RSA {room.code}</h2>
        <p className="text-gray-400 font-bold italic mb-10">경매 개장을 기다리는 중...</p>
        <div className="bg-white/5 px-10 py-6 rounded-full border border-white/10 font-black text-xl">
            {student.nickname} (Ready)
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1A1A1A] pb-40">
      {/* 상단바 */}
      <div className="sticky top-0 z-50 bg-white shadow-xl p-6 border-b-2 border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2D0A0A] rounded-2xl flex items-center justify-center text-[#D4AF37] font-black shadow-lg">{student.nickname[0]}</div>
            <div>
                <p className="font-black text-gray-800 text-lg">{student.nickname}</p>
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Authorized Bidder</p>
            </div>
        </div>
        <div className="bg-[#FFFDF5] border-2 border-[#D4AF37] px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="text-right">
                <span className="block text-[9px] font-black text-[#D4AF37] uppercase">Gold Balance</span>
                <span className="text-2xl font-black leading-none">{student.coins.toLocaleString()}</span>
            </div>
            <span className="text-2xl">💰</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-10">
        {/* 경매 진행 및 컨트롤 */}
        {activeAuction ? (
            <div className="bg-[#2D0A0A] p-10 rounded-[50px] shadow-2xl relative overflow-hidden border-4 border-[#D4AF37] text-center">
                <div className="absolute top-6 right-10 text-6xl font-black text-[#D4AF37] opacity-20">{activeAuction.timeLeft}s</div>
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em] block mb-4">
                    {activeAuction.sellerId === studentId ? "★ 판매 중 ★" : `🔨 ${activeAuction.sellerNickname}의 매물`}
                </span>
                <p className="text-3xl font-serif italic text-white mb-10 leading-relaxed px-10">"{activeAuction.text}"</p>
                
                {activeAuction.sellerId !== studentId && (
                    <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 max-w-sm mx-auto">
                        <div className="flex justify-between items-end mb-6">
                            <div className="text-left">
                                <span className="text-[9px] font-black text-[#D4AF37] uppercase block mb-1">Max Bid</span>
                                <p className="text-3xl font-black text-white">{activeAuction.highestBid?.amount.toLocaleString() || "1,000"}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-500">{activeAuction.highestBid?.nickname || "-"}</span>
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="number" 
                                className="flex-1 bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 font-black text-xl outline-none"
                                placeholder="금액"
                                value={bidAmount || ''}
                                onChange={(e) => setBidAmount(Number(e.target.value))}
                            />
                            <button 
                                onClick={() => { placeBid(studentId, bidAmount); setBidAmount(0); }}
                                className="bg-[#D4AF37] text-black px-8 py-3 rounded-2xl font-black shadow-lg disabled:opacity-50"
                                disabled={bidAmount <= (activeAuction.highestBid?.amount || 1000) || bidAmount > student.coins}
                            >
                                입찰
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-white p-10 rounded-[50px] shadow-xl border-2 border-gray-100 text-center relative overflow-hidden">
                {isMyTurn ? (
                    <div className="space-y-6 animate-in slide-in-from-top duration-500">
                        <div className="text-5xl mb-4">🛎️</div>
                        <h3 className="text-2xl font-black text-[#2D0A0A]">나의 판매 차례입니다!</h3>
                        <p className="text-sm text-gray-400 font-bold italic">팔고 싶은 문장을 선택하거나 차례를 넘기세요.</p>
                        <button onClick={() => skipTurn(studentId)} className="bg-gray-100 text-gray-400 px-10 py-4 rounded-3xl font-black hover:bg-red-50 hover:text-red-500 transition">입찰 포기 (Pass)</button>
                    </div>
                ) : (
                    <div className="py-10 opacity-30 grayscale">
                        <div className="text-6xl mb-6">⏳</div>
                        <p className="text-xl font-black uppercase tracking-widest">다음 경매를 기다리는 중...</p>
                    </div>
                )}
            </div>
        )}

        {/* 내 문장 창고 */}
        <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">📦 내 문장 창고 ({student.inventory.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.inventory.map(item => (
                    <div key={item.id} className={`bg-white rounded-[40px] shadow-lg border-2 p-8 transition-all ${item.assignedSlot !== null ? 'opacity-40 grayscale-0 border-green-500' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</span>
                            {!activeAuction && isMyTurn && item.assignedSlot === null && (
                                <button onClick={() => startAuction(studentId, item.id)} className="bg-[#2D0A0A] text-[#D4AF37] px-4 py-1.5 rounded-full text-[10px] font-black">이 매물 올리기</button>
                            )}
                            {selectedSlot !== null && item.assignedSlot === null && (
                                <button onClick={() => { updateWorksheet(studentId, selectedSlot, { instanceId: item.id }); setSelectedSlot(null); }} className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg">슬롯에 배정</button>
                            )}
                        </div>
                        <p className="text-xl font-serif italic text-gray-800 mb-4 leading-relaxed">"{item.text}"</p>
                        {item.assignedSlot !== null && <p className="text-[10px] font-black text-green-600 uppercase">학습지 {item.assignedSlot + 1}번에 사용 중</p>}
                    </div>
                ))}
            </div>
        </div>

        {/* 모드별 학습지 */}
        <div className="mt-16 space-y-8">
            <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-black text-gray-800">📝 나의 디지털 학습지</h3>
                <span className="text-xs font-bold text-[#D4AF37] uppercase">{room.mode === RoomMode.MEMO ? 'Concept Matching' : 'Sequence Ordering'}</span>
            </div>
            <div className="space-y-4">
                {room.templates.map((_, idx) => {
                    const assigned = student.inventory.find(i => i.assignedSlot === idx);
                    return (
                        <div key={idx} className={`bg-white p-6 rounded-[35px] shadow-md border-2 transition-all ${selectedSlot === idx ? 'border-blue-500 ring-8 ring-blue-50' : 'border-gray-50'}`}>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-400 text-sm">{idx + 1}</span>
                                <button 
                                    onClick={() => setSelectedSlot(selectedSlot === idx ? null : idx)}
                                    className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition ${assigned ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}
                                >
                                    {assigned ? '배정됨' : '문장 선택'}
                                </button>
                                <div className="flex-1 text-center md:text-left">
                                    {assigned ? <p className="text-lg font-serif italic">"{assigned.text}"</p> : <p className="text-gray-300 font-bold italic">문장을 배치하세요</p>}
                                </div>
                                {room.mode === RoomMode.MEMO && (
                                    <input 
                                        placeholder="개념/정답 입력"
                                        className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold w-full md:w-40 outline-none focus:border-[#D4AF37]"
                                        value={student.worksheetAnswers[idx] || ''}
                                        onChange={(e) => updateWorksheet(studentId, idx, { answer: e.target.value })}
                                    />
                                )}
                                {room.mode === RoomMode.ORDER && (
                                    <div className="bg-[#2D0A0A] text-[#D4AF37] px-4 py-2 rounded-xl font-black text-sm">순번: {idx + 1}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
