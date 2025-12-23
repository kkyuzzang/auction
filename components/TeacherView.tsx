
import React from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus, RoomMode } from '../types.ts';

const TeacherView: React.FC = () => {
  const { room, startGame, closeAuction, addTime, finishRoom } = useRoomStore();

  if (!room) return null;

  if (room.status === RoomStatus.FINISHED) {
    // 승자 계산
    const sortedByScore = [...room.students].sort((a, b) => b.score - a.score);
    const sortedByCoins = [...room.students].sort((a, b) => b.coins - a.coins);
    const topScorer = sortedByScore[0];
    const topRichest = sortedByCoins[0];
    const isGod = topScorer.id === topRichest.id;

    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6 font-sans">
        <div className="max-w-4xl w-full bg-white rounded-[60px] p-12 text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] border-t-[15px] border-[#D4AF37]">
            {isGod ? (
                <div className="space-y-6">
                    <span className="text-8xl block animate-bounce">👑</span>
                    <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#F5E6AD] via-[#D4AF37] to-[#8A6E2F]">경매의 신</h2>
                    <p className="text-4xl font-black text-[#2D0A0A]">{topScorer.nickname}</p>
                    <p className="text-gray-400 font-bold uppercase tracking-widest">지식과 자산 모든 부문 석권</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-10">
                    <div className="bg-[#FFFDF5] p-10 rounded-[40px] border-2 border-[#D4AF37] relative">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl">🏅</span>
                        <h3 className="text-2xl font-black text-[#8A6E2F] mb-4">최고 득점왕</h3>
                        <p className="text-4xl font-black mb-2">{topScorer.nickname}</p>
                        <p className="text-lg font-bold text-[#D4AF37]">{topScorer.score} PTS</p>
                    </div>
                    <div className="bg-[#F5F5F5] p-10 rounded-[40px] border-2 border-gray-200 relative">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl">💰</span>
                        <h3 className="text-2xl font-black text-gray-500 mb-4">최고 자산가</h3>
                        <p className="text-4xl font-black mb-2">{topRichest.nickname}</p>
                        <p className="text-lg font-bold text-gray-400">{topRichest.coins.toLocaleString()}c</p>
                    </div>
                </div>
            )}
            <button onClick={() => window.location.reload()} className="mt-16 bg-[#2D0A0A] text-white px-10 py-4 rounded-full font-black">메인으로</button>
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

      <main className="max-w-6xl mx-auto p-10 space-y-10">
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
                        <button onClick={addTime} className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-105 transition">+ 1초 추가</button>
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

        <div className="grid grid-cols-4 gap-6">
            {room.students.map(s => (
                <div key={s.id} className={`p-6 rounded-[35px] border-2 transition-all ${currentSeller?.id === s.id ? 'bg-[#2D0A0A] border-[#D4AF37] shadow-2xl scale-105' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`font-black text-xl ${currentSeller?.id === s.id ? 'text-[#D4AF37]' : 'text-gray-800'}`}>{s.nickname}</span>
                        {currentSeller?.id === s.id && <span className="text-[10px] font-black bg-[#D4AF37] text-black px-2 py-1 rounded-lg animate-pulse">SELLER</span>}
                    </div>
                    <div className={`text-2xl font-black ${currentSeller?.id === s.id ? 'text-white' : 'text-[#D4AF37]'}`}>{s.coins.toLocaleString()}c</div>
                    <div className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inventory: {s.inventory.length} items</div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};

export default TeacherView;
