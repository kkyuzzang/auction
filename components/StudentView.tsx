
import React, { useState, useEffect } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus, RoomMode, SentenceInstance } from '../types.ts';

const WorksheetSlotInput = ({ value, onChange, placeholder, disabled }: { value: string, onChange: (val: string) => void, placeholder: string, disabled?: boolean }) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <input 
      placeholder={placeholder}
      className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold w-full md:w-40 outline-none focus:border-[#D4AF37] disabled:bg-white disabled:border-transparent"
      value={localValue}
      disabled={disabled}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
    />
  );
};

const StudentView: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { room, placeBid, startAuction, skipTurn, updateWorksheet } = useRoomStore();
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [selectedItemToAssign, setSelectedItemToAssign] = useState<SentenceInstance | null>(null);

  if (!room) return null;
  const student = room.students.find(s => s.id === studentId);
  if (!student) return null;

  useEffect(() => {
    if (room.activeAuction) {
        setBidAmount((room.activeAuction.highestBid?.amount || 1000) + 1000);
    }
  }, [room.activeAuction?.highestBid?.amount, !!room.activeAuction]);

  const isMyTurn = room.students[room.currentSellerIdx]?.id === studentId;
  const activeAuction = room.activeAuction;

  if (room.status === RoomStatus.FINISHED) {
    return (
        <div className="min-h-screen bg-[#FFFDF5] p-6 pb-20 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="text-center space-y-4 py-10">
                    <h2 className="text-4xl font-black text-[#2D0A0A]">최종 학습 리포트</h2>
                    <div className="inline-block bg-[#2D0A0A] text-[#D4AF37] px-8 py-3 rounded-full font-black text-2xl shadow-xl">
                        최종 점수: {student.score} PTS
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">점수 계산 수식</p>
                    <p className="text-xl font-black text-[#2D0A0A]">
                        ({student.inventory.length} × 10) + ({room.templates.filter((t, idx) => {
                            const ans = student.worksheetAnswers[idx];
                            const ass = student.inventory.find(i => i.assignedSlot === idx);
                            if (room.mode === RoomMode.MEMO) return ass && ass.text === t.text && ans === t.concept;
                            return ass && ass.text === t.text;
                        }).length} × 50) + ({student.bidCount} × 5) = {student.score}
                    </p>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-gray-800">📊 나의 채점 결과</h3>
                    {room.templates.map((temp, idx) => {
                        const assigned = student.inventory.find(i => i.assignedSlot === idx);
                        const myAnswer = student.worksheetAnswers[idx] || "";
                        let isCorrect = false;
                        if (room.mode === RoomMode.MEMO) {
                            isCorrect = assigned && assigned.text === temp.text && myAnswer === temp.concept;
                        } else {
                            isCorrect = assigned && assigned.text === temp.text;
                        }
                        
                        return (
                            <div key={idx} className={`bg-white p-8 rounded-[40px] border-4 shadow-lg ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="bg-gray-100 text-gray-500 w-10 h-10 rounded-full flex items-center justify-center font-black">{idx + 1}</span>
                                    <span className={`text-4xl font-black ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{isCorrect ? 'O' : 'X'}</span>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xl font-serif italic text-gray-800">"{assigned?.text || "(미배치)"}"</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-gray-400 mb-1">나의 입력</p>
                                            <p className="font-bold text-[#2D0A0A]">{room.mode === RoomMode.ORDER ? (assigned ? "배치 완료" : "-") : (myAnswer || "-")}</p>
                                        </div>
                                        <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                            <p className="text-[10px] font-black text-yellow-600 mb-1">정답({room.mode === RoomMode.ORDER ? "순서" : "개념"})</p>
                                            <p className="font-bold text-yellow-700">{temp.concept}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => window.location.reload()} className="w-full bg-[#2D0A0A] text-[#D4AF37] font-black py-5 rounded-3xl text-xl shadow-2xl">메인으로</button>
            </div>
        </div>
    );
  }

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
                    <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 max-w-md mx-auto">
                        <div className="flex justify-between items-end mb-6">
                            <div className="text-left">
                                <span className="text-[9px] font-black text-[#D4AF37] uppercase block mb-1">Max Bid</span>
                                <p className="text-3xl font-black text-white">{activeAuction.highestBid?.amount.toLocaleString() || "1,000"}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-500">{activeAuction.highestBid?.nickname || "입찰 대기"}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-1 items-center bg-white rounded-3xl p-1 shadow-lg border-2 border-gray-100 overflow-hidden">
                                <button 
                                  onClick={() => setBidAmount(a => Math.max(0, a - 1000))} 
                                  className="w-16 h-14 bg-gray-50 text-gray-600 font-black text-3xl hover:bg-gray-200 transition flex items-center justify-center shrink-0"
                                >-</button>
                                <input 
                                    type="number" 
                                    className="flex-1 bg-transparent text-center font-black text-2xl outline-none min-w-0"
                                    value={bidAmount || ''}
                                    onChange={(e) => setBidAmount(Number(e.target.value))}
                                />
                                <button 
                                  onClick={() => setBidAmount(a => a + 1000)} 
                                  className="w-16 h-14 bg-gray-50 text-gray-600 font-black text-3xl hover:bg-gray-200 transition flex items-center justify-center shrink-0"
                                >+</button>
                            </div>
                            <button 
                                onClick={() => placeBid(studentId, bidAmount)}
                                className="bg-[#D4AF37] text-black h-16 px-10 rounded-3xl font-black shadow-xl disabled:opacity-50 active:scale-95 transition whitespace-nowrap"
                                disabled={bidAmount <= (activeAuction.highestBid?.amount || 1000) || bidAmount > student.coins}
                            >
                                입찰하기
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
                    <div className="py-10 opacity-30 grayscale text-center">
                        <p className="text-xl font-black uppercase tracking-widest">다음 경매 대기 중...</p>
                    </div>
                )}
            </div>
        )}

        {/* 내 문장 창고 */}
        <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-800">📦 내 문장 창고 ({student.inventory.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.inventory.map(item => (
                    <div 
                      key={item.id} 
                      className={`bg-white rounded-[40px] shadow-lg border-2 p-8 transition-all ${item.assignedSlot !== null ? 'opacity-40 border-green-500' : (selectedItemToAssign?.id === item.id ? 'border-blue-500 ring-8 ring-blue-50 scale-105' : 'border-gray-100 hover:border-blue-200 cursor-pointer')}`}
                      onClick={() => item.assignedSlot === null && setSelectedItemToAssign(selectedItemToAssign?.id === item.id ? null : item)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedItemToAssign?.id === item.id ? "선택됨 🎯" : "Asset"}</span>
                            {!activeAuction && isMyTurn && item.assignedSlot === null && (
                                <button onClick={(e) => { e.stopPropagation(); startAuction(studentId, item.id); }} className="bg-[#2D0A0A] text-[#D4AF37] px-4 py-1.5 rounded-full text-[10px] font-black">이 매물 올리기</button>
                            )}
                        </div>
                        <p className="text-xl font-serif italic text-gray-800 mb-4 leading-relaxed">"{item.text}"</p>
                    </div>
                ))}
            </div>
        </div>

        {/* 디지털 학습지 */}
        <div className="mt-16 space-y-8">
            <h3 className="text-2xl font-black text-gray-800">📝 나의 디지털 학습지</h3>
            <div className="space-y-4">
                {room.templates.map((_, idx) => {
                    const assigned = student.inventory.find(i => i.assignedSlot === idx);
                    return (
                        <div 
                          key={idx} 
                          className={`bg-white p-6 rounded-[35px] shadow-md border-2 transition-all ${selectedItemToAssign ? 'border-blue-300 hover:border-blue-600 cursor-pointer scale-[1.01]' : 'border-gray-50'}`}
                          onClick={() => {
                            if (selectedItemToAssign) {
                              updateWorksheet(studentId, idx, { instanceId: selectedItemToAssign.id });
                              setSelectedItemToAssign(null);
                            }
                          }}
                        >
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-400 text-sm">{idx + 1}</span>
                                <div className="flex-1 text-center md:text-left">
                                    {assigned ? (
                                      <div className="flex items-center gap-4">
                                        <p className="text-lg font-serif italic flex-1">"{assigned.text}"</p>
                                        <button onClick={(e) => { e.stopPropagation(); updateWorksheet(studentId, idx, { instanceId: null }); }} className="text-[10px] text-red-400 font-bold hover:text-red-600">제거</button>
                                      </div>
                                    ) : (
                                      <p className="text-gray-300 font-bold italic">{selectedItemToAssign ? "여기에 배치하기" : "문장을 선택하여 배치하세요"}</p>
                                    )}
                                </div>
                                {room.mode === RoomMode.MEMO && (
                                    <WorksheetSlotInput 
                                      value={student.worksheetAnswers[idx] || ''}
                                      placeholder="개념/정답 입력"
                                      onChange={(val) => updateWorksheet(studentId, idx, { answer: val })}
                                    />
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
