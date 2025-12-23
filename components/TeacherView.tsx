
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus, RoomMode, Student } from '../types.ts';

const TeacherView: React.FC = () => {
  const { room, startGame, closeAuction, addTime, finishRoom, sendCoins } = useRoomStore();
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  if (!room) return null;

  if (room.status === RoomStatus.FINISHED) {
    const sortedByScore = [...room.students].sort((a, b) => b.score - a.score);
    const sortedByCoins = [...room.students].sort((a, b) => b.coins - a.coins);
    const topScorer = sortedByScore[0];
    const topRichest = sortedByCoins[0];
    const isGod = topScorer.id === topRichest.id;

    return (
      <div className="min-h-screen bg-[#1A1A1A] p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <h2 className="text-6xl font-black text-[#D4AF37] text-center mb-16 tracking-tighter">🏆 HALL OF FAME</h2>

            {/* 명예의 전당 카드 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
                {isGod ? (
                    <div className="md:col-span-2 bg-gradient-to-b from-[#FFFDF5] to-[#F5E6AD] rounded-[60px] p-16 text-center shadow-[0_0_100px_rgba(212,175,55,0.4)] border-4 border-[#D4AF37] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <span className="text-9xl block mb-6 animate-bounce">👑</span>
                        <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#8A6E2F] via-[#D4AF37] to-[#8A6E2F] mb-4">경매의 신</h3>
                        <p className="text-4xl font-black text-[#2D0A0A] mb-2">{topScorer.nickname}</p>
                        <p className="text-lg font-bold text-[#8A6E2F] uppercase tracking-[0.3em]">Perfect Domination: Score & Wealth</p>
                    </div>
                ) : (
                    <React.Fragment>
                        <div className="bg-[#FFFDF5] p-12 rounded-[50px] border-4 border-[#D4AF37] text-center shadow-2xl relative group hover:scale-[1.02] transition">
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl">🏅</span>
                            <h3 className="text-2xl font-black text-[#8A6E2F] mb-4 uppercase tracking-widest">최고 득점왕</h3>
                            <p className="text-5xl font-black text-[#2D0A0A] mb-2">{topScorer.nickname}</p>
                            <p className="text-xl font-bold text-[#D4AF37]">{topScorer.score.toLocaleString()} PTS</p>
                        </div>
                        <div className="bg-[#F5F5F5] p-12 rounded-[50px] border-4 border-gray-300 text-center shadow-2xl relative group hover:scale-[1.02] transition">
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl">💰</span>
                            <h3 className="text-2xl font-black text-gray-500 mb-4 uppercase tracking-widest">최고 자산가</h3>
                            <p className="text-5xl font-black text-[#2D0A0A] mb-2">{topRichest.nickname}</p>
                            <p className="text-xl font-bold text-gray-400">{topRichest.coins.toLocaleString()}c</p>
                        </div>
                    </React.Fragment>
                )}
            </div>

            {/* 전체 랭킹 리스트 */}
            <div className="space-y-6">
                <h3 className="text-2xl font-black text-white/40 uppercase tracking-widest text-center mb-10">전체 랭킹 리포트</h3>
                {sortedByScore.map((s, idx) => {
                    let correctCount = 0;
                    room.templates.forEach((temp, tIdx) => {
                        const answer = s.worksheetAnswers[tIdx];
                        const assigned = s.inventory.find(i => i.assignedSlot === tIdx);
                        if (room.mode === RoomMode.MEMO) {
                            if (assigned && assigned.text === temp.text && answer === temp.concept) correctCount++;
                        } else {
                            if (assigned && assigned.text === temp.text) correctCount++;
                        }
                    });

                    return (
                        <div key={s.id} className="bg-white rounded-[40px] p-8 flex items-center gap-10 shadow-2xl border-l-[15px] border-[#D4AF37] hover:translate-x-2 transition">
                            <span className="text-4xl font-black text-gray-200">#{idx + 1}</span>
                            <div className="flex-1">
                                <p className="text-2xl font-black text-[#2D0A0A]">{s.nickname}</p>
                                <p className="text-sm font-bold text-gray-400 mt-1 italic">
                                    수식: ({s.inventory.length}문장 × 10) + ({correctCount}정답 × 50) + ({s.bidCount}입찰 × 5)
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Total Score</p>
                                <p className="text-5xl font-black text-[#D4AF37] leading-tight">{s.score} <span className="text-xs">PTS</span></p>
                                <p className="text-xs font-bold text-gray-300">잔액: {s.coins.toLocaleString()}c</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="pt-10">
                <button onClick={() => window.location.reload()} className="w-full bg-[#2D0A0A] text-[#D4AF37] font-black py-6 rounded-3xl text-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#D4AF37]/30 hover:bg-black transition">처음으로 돌아가기</button>
            </div>
        </div>
      </div>
    );
  }

  const currentSeller = room.students[room.currentSellerIdx];

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1A1A1A]">
      <header className="bg-[#2D0A0A] text-[#D4AF37] p-6 shadow-2xl flex justify-between items-center border-b-4 border-[#D4AF37]">
        <div className="flex items-center gap-4">
            <span className="bg-[#D4AF37] text-black p-2 rounded-lg font-black tracking-widest uppercase">RSA-{room.code}</span>
            <h1 className="text-xl font-black uppercase">Master Console</h1>
        </div>
        <div className="flex gap-4">
            {room.status === RoomStatus.LOBBY && <button onClick={startGame} className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-black">게임 시작</button>}
            {room.status === RoomStatus.MARKET && <button onClick={finishRoom} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black">최종 결과 발표</button>}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-9 space-y-10">
            {/* 메인 경매 판넬 */}
            <div className="bg-white rounded-[50px] shadow-2xl border-2 border-gray-100 p-12 text-center relative overflow-hidden">
                {room.activeAuction ? (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="text-[120px] font-black leading-none text-[#D4AF37] animate-pulse drop-shadow-2xl">
                            {room.activeAuction.timeLeft}
                        </div>
                        <p className="text-5xl font-serif italic text-gray-800">"{room.activeAuction.text}"</p>
                        <div className="flex justify-center gap-10">
                            <div className="text-left">
                                <span className="text-xs font-black text-gray-400 block mb-1">CURRENT BID</span>
                                <p className="text-4xl font-black text-[#2D0A0A]">{room.activeAuction.highestBid?.amount.toLocaleString() || "1,000"}c</p>
                                <span className="text-sm font-bold text-[#D4AF37]">{room.activeAuction.highestBid?.nickname || "입찰 대기"}</span>
                            </div>
                            <div className="h-16 w-[2px] bg-gray-100"></div>
                            <div className="text-left">
                                <span className="text-xs font-black text-gray-400 block mb-1">SELLER</span>
                                <p className="text-4xl font-black text-gray-400">{room.activeAuction.sellerNickname}</p>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-10">
                            <button onClick={addTime} className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition">+ 1초 추가</button>
                            <button onClick={closeAuction} className="bg-[#2D0A0A] text-[#D4AF37] px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition">🔨 즉시 마감</button>
                        </div>
                    </div>
                ) : (
                    <div className="py-20">
                        <div className="text-8xl mb-6">⚖️</div>
                        <p className="text-2xl font-black text-gray-300 uppercase tracking-widest mb-4">현재 판매 순번</p>
                        {currentSeller ? (
                            <div className="bg-[#FFFDF5] inline-block px-10 py-5 rounded-[30px] border-4 border-[#D4AF37] shadow-xl">
                                <p className="text-4xl font-black text-[#2D0A0A]">{currentSeller.nickname} 님</p>
                                <p className="text-sm font-bold text-[#D4AF37] mt-1">경매에 올릴 문장을 선택하거나 패스해주세요.</p>
                            </div>
                        ) : (
                            <p className="text-gray-400">참여 중인 학생이 없습니다.</p>
                        )}
                    </div>
                )}
            </div>

            {/* 학생 리스트 아코디언 대시보드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {room.students.map(s => {
                    const isExpanded = expandedStudentId === s.id;
                    const isSeller = currentSeller?.id === s.id;
                    return (
                        <div 
                          key={s.id} 
                          className={`rounded-[40px] border-2 transition-all cursor-pointer overflow-hidden ${isSeller ? 'border-[#D4AF37] shadow-2xl bg-[#2D0A0A]' : 'border-gray-100 bg-white shadow-lg'}`}
                          onClick={() => setExpandedStudentId(isExpanded ? null : s.id)}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`font-black text-xl ${isSeller ? 'text-[#D4AF37]' : 'text-gray-800'}`}>{s.nickname}</span>
                                    {isSeller && <span className="bg-[#D4AF37] text-black px-2 py-1 rounded text-[10px] font-black animate-pulse">SELLING</span>}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className={`text-2xl font-black ${isSeller ? 'text-white' : 'text-[#D4AF37]'}`}>{s.coins.toLocaleString()}c</div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] font-black text-gray-400 uppercase">Bids / Sales</span>
                                        <span className={`text-xs font-bold ${isSeller ? 'text-gray-300' : 'text-gray-600'}`}>{s.bidCount} / {s.saleCount}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className={`p-6 border-t-2 ${isSeller ? 'bg-[#3D1A1A] border-[#4D2A2A]' : 'bg-gray-50 border-gray-100'} animate-in slide-in-from-top duration-300`}>
                                    <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Inventory ({s.inventory.length})</p>
                                    <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                                        {s.inventory.map(item => (
                                            <div key={item.id} className="text-[11px] font-medium bg-white/10 p-2 rounded-lg border border-white/5 truncate">
                                                {item.text}
                                            </div>
                                        ))}
                                        {s.inventory.length === 0 && <p className="text-xs text-gray-400 italic">보유 문장 없음</p>}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); sendCoins(s.id, 1000); }}
                                        className="w-full bg-[#D4AF37] text-black py-3 rounded-2xl font-black text-xs hover:bg-yellow-500 transition shadow-lg"
                                    >
                                        💸 1,000c 송금하기
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 판매 대기열 */}
        <div className="lg:col-span-3 bg-white rounded-[40px] shadow-xl border-2 border-gray-100 p-8 flex flex-col max-h-[800px]">
            <h3 className="text-xl font-black text-[#2D0A0A] mb-6 flex items-center gap-2">🔄 판매 순번</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {room.students.map((s, idx) => {
                    const isActive = room.currentSellerIdx === idx;
                    return (
                        <div key={s.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition ${isActive ? 'bg-[#FFFDF5] border-[#D4AF37]' : 'bg-gray-50 border-transparent opacity-60'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isActive ? 'bg-[#D4AF37] text-black' : 'bg-gray-200 text-gray-400'}`}>{idx + 1}</span>
                            <div className="flex-1">
                                <p className={`font-black text-sm ${isActive ? 'text-[#2D0A0A]' : 'text-gray-500'}`}>{s.nickname}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherView;
