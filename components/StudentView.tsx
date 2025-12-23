
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus, RoomMode } from '../types.ts';

interface StudentViewProps { studentId: string; }
const StudentView: React.FC<StudentViewProps> = ({ studentId }) => {
  const { room, placeBid, startAuction, updateWorksheet } = useRoomStore();
  const [bidValue, setBidValue] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  if (!room) return null;
  const student = room.students.find(s => s.id === studentId);
  if (!student) return null;

  const activeAuction = room.activeAuction;

  if (room.status === RoomStatus.LOBBY || room.status === RoomStatus.SETUP) {
      return (
        <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-32 h-32 bg-[#2D0A0A] rounded-full flex items-center justify-center border-4 border-[#D4AF37] mb-8 animate-pulse shadow-lg">
                <span className="text-5xl">🏛️</span>
            </div>
            <h2 className="text-4xl font-black text-[#D4AF37] mb-2">ROYAL AUCTION</h2>
            <p className="text-[#D4AF37]/60 font-medium tracking-widest text-sm mb-12 italic">개장을 기다리는 중...</p>
            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 w-full max-w-xs shadow-2xl backdrop-blur-md">
                <p className="text-[10px] text-[#D4AF37] font-black uppercase mb-2">Bidder</p>
                <p className="text-2xl font-black text-white">{student.nickname}</p>
            </div>
        </div>
      );
  }

  // 학습지 슬롯 렌더링
  const renderWorksheet = () => {
    return (
      <div className="mt-12 space-y-6">
        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">📝 나의 디지털 학습지</h3>
        <div className="space-y-4">
          {room.templates.map((_, idx) => {
            const assignedItem = student.inventory.find(i => i.assignedSlot === idx);
            return (
              <div key={idx} className={`bg-white rounded-[30px] p-6 shadow-md border-2 transition-all ${selectedSlot === idx ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100'}`}>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex items-center gap-3 min-w-[100px]">
                    <span className="bg-gray-100 text-gray-400 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">{idx + 1}</span>
                    <button 
                      onClick={() => setSelectedSlot(selectedSlot === idx ? null : idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition ${assignedItem ? 'bg-green-100 text-green-700' : 'bg-blue-500 text-white shadow-lg shadow-blue-200'}`}
                    >
                      {assignedItem ? '문장 교체' : '문장 배정'}
                    </button>
                  </div>
                  
                  <div className="flex-1 w-full">
                    {assignedItem ? (
                      <p className="text-gray-800 font-serif italic text-lg">"{assignedItem.text}"</p>
                    ) : (
                      <p className="text-gray-300 font-bold italic">낙찰받은 문장을 여기에 배정하세요...</p>
                    )}
                  </div>

                  <div className="w-full md:w-48">
                    <input 
                      type="text"
                      placeholder={room.mode === RoomMode.ORDER ? "순서 입력" : "개념 입력"}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[#D4AF37]"
                      value={student.worksheetAnswers[idx] || ''}
                      onChange={(e) => updateWorksheet(studentId, idx, { answer: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1A1A1A] pb-32 font-sans">
      <div className="bg-white p-6 shadow-xl border-b-2 border-gray-100 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2D0A0A] rounded-2xl flex items-center justify-center text-[#D4AF37] font-black text-xl shadow-lg">{student.nickname[0]}</div>
            <div>
                <h2 className="font-black text-gray-800 text-lg">{student.nickname}</h2>
                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Authorized</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#FFFDF5] px-6 py-3 rounded-2xl border-2 border-[#D4AF37] shadow-inner">
            <div className="text-right">
                <span className="block text-[9px] font-black text-[#D4AF37] uppercase tracking-tighter">Gold Assets</span>
                <span className="font-black text-[#2D0A0A] text-2xl leading-none">{student.coins}</span>
            </div>
            <span className="text-2xl">💰</span>
          </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8 mt-6">
        {/* 경매판 */}
        {activeAuction ? (
            <div className="space-y-6">
                <div className="bg-[#2D0A0A] p-10 rounded-[50px] text-[#D4AF37] shadow-2xl relative overflow-hidden border-4 border-[#D4AF37]">
                    <div className="relative z-10 text-center">
                        <span className="text-[10px] font-black uppercase mb-4 block tracking-[0.3em]">{activeAuction.sellerId === studentId ? "👑 My Item on Sale" : `🔨 Auction for ${activeAuction.sellerNickname}`}</span>
                        <p className="text-3xl font-serif italic text-white mb-10 leading-relaxed">"{activeAuction.text}"</p>
                        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
                            <div className="bg-white/5 p-5 rounded-[25px] border border-white/10 shadow-inner">
                                <span className="text-[9px] opacity-60 uppercase font-black block mb-1">High Bid</span>
                                <span className="text-3xl font-black block">{activeAuction.highestBid?.amount || 0}</span>
                            </div>
                            <div className="bg-white/5 p-5 rounded-[25px] border border-white/10 shadow-inner">
                                <span className="text-[9px] opacity-60 uppercase font-black block mb-1">Top Bidder</span>
                                <span className="text-xl font-black block truncate">{activeAuction.highestBid?.nickname || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {activeAuction.sellerId !== studentId && (
                    <div className="bg-white p-8 rounded-[40px] shadow-2xl border-2 border-gray-100 transform -translate-y-4">
                        {activeAuction.highestBid?.studentId === studentId ? (
                            <div className="bg-[#064E3B] p-6 rounded-[30px] text-center border-2 border-[#059669] animate-pulse">
                                <p className="text-[#D1FAE5] font-black">👑 현재 최고가 입찰 중입니다!</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <input 
                                    type="number" 
                                    min={(activeAuction.highestBid?.amount || 0) + 1} 
                                    max={student.coins} 
                                    value={bidValue || ''} 
                                    onChange={(e) => setBidValue(Number(e.target.value))} 
                                    placeholder="입찰액 입력" 
                                    className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 outline-none text-xl font-black text-center" 
                                />
                                <button 
                                    onClick={() => { placeBid(studentId, bidValue); setBidValue(0); }} 
                                    className="bg-[#2D0A0A] text-[#D4AF37] px-10 py-4 rounded-3xl font-black shadow-lg hover:bg-black transition" 
                                    disabled={bidValue <= (activeAuction.highestBid?.amount || 0) || bidValue > student.coins}
                                >
                                    입찰
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-white/50 border-4 border-dashed border-gray-200 rounded-[50px] py-16 text-center text-gray-400 font-bold uppercase tracking-widest">
                진행 중인 경매 없음
            </div>
        )}

        {/* 내 자산 목록 */}
        <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">📦 내 자산 ({student.inventory.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.inventory.map((item) => (
                    <div key={item.id} className={`bg-white rounded-[40px] shadow-lg border-2 transition-all ${item.assignedSlot !== null ? 'opacity-50 grayscale scale-95 border-gray-100' : 'border-gray-100 hover:shadow-2xl'}`}>
                        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-b border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</span>
                            <div className="flex gap-2">
                                {selectedSlot !== null && item.assignedSlot === null && (
                                    <button 
                                      onClick={() => { updateWorksheet(studentId, selectedSlot, { instanceId: item.id }); setSelectedSlot(null); }}
                                      className="text-[10px] font-black bg-blue-500 text-white px-4 py-1.5 rounded-full shadow-lg"
                                    >
                                      여기에 배정 🎯
                                    </button>
                                )}
                                {!activeAuction && item.assignedSlot === null && (
                                    <button onClick={() => startAuction(studentId, item.id)} className="text-[10px] font-black bg-[#2D0A0A] text-[#D4AF37] px-4 py-1.5 rounded-full">경매 출품 🔨</button>
                                )}
                                {item.assignedSlot !== null && <span className="text-[10px] font-black text-green-600">배정 완료 (Slot {item.assignedSlot + 1})</span>}
                            </div>
                        </div>
                        <div className="p-8">
                            <p className="text-xl font-serif italic text-gray-800 leading-relaxed mb-4">"{item.text}"</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#D4AF37] uppercase bg-[#2D0A0A] px-2 py-0.5 rounded">CONCEPT</span>
                                <span className="text-sm font-bold text-gray-400">{item.concept}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 학습지 영역 */}
        {renderWorksheet()}
      </div>
    </div>
  );
};

export default StudentView;
