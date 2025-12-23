
import React from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus } from '../types.ts';
import { GavelIcon, DashboardIcon } from './Icons.tsx';
import { downloadCSV, formatResultsForExport } from '../utils.ts';

const TeacherView: React.FC = () => {
  const { room, startGame, closeAuction, finishRoom, resetStore } = useRoomStore();
  if (!room) return null;
  const handleExportResults = () => {
    if (room) {
      const data = formatResultsForExport(room);
      downloadCSV(`auction_results_${room.code}.csv`, data);
    }
  };
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1A1A1A] font-sans pb-20">
      <header className="bg-[#2D0A0A] text-[#D4AF37] p-6 shadow-2xl sticky top-0 z-50 border-b-4 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#D4AF37] text-[#2D0A0A] p-2 rounded-lg font-black text-xl">🏛️ {room.code}</div>
            <h1 className="text-xl font-black tracking-tight uppercase">Master Console</h1>
          </div>
          <div className="flex gap-3">
            {room.status === RoomStatus.LOBBY && <button onClick={startGame} className="bg-[#D4AF37] text-[#2D0A0A] px-8 py-3 rounded-xl font-black hover:bg-white transition shadow-lg">옥션 개장</button>}
            {room.activeAuction && <button onClick={closeAuction} className="bg-[#064E3B] text-white px-8 py-3 rounded-xl font-black hover:bg-[#065F46] transition shadow-lg border border-white/20">🔨 낙찰 마감</button>}
            {room.status === RoomStatus.MARKET && <button onClick={finishRoom} className="bg-[#4A0E0E] text-white px-8 py-3 rounded-xl font-black hover:bg-black transition shadow-lg">수업 종료</button>}
            {room.status === RoomStatus.FINISHED && <button onClick={handleExportResults} className="bg-[#1A1A1A] text-[#D4AF37] px-8 py-3 rounded-xl font-black border border-[#D4AF37]">결과 보고서</button>}
            <button onClick={resetStore} className="text-rose-200/50 hover:text-rose-200 text-xs font-bold uppercase">Reset</button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[40px] shadow-2xl border-2 border-gray-100 overflow-hidden">
                <div className="p-12 text-center min-h-[400px] flex flex-col justify-center">
                    {room.activeAuction ? (
                        <>
                            <p className="text-4xl md:text-5xl font-serif italic text-gray-800 leading-tight mb-12 px-10">"{room.activeAuction.text}"</p>
                            <div className="flex justify-center gap-8">
                                <div className="bg-[#FFFDF5] p-8 rounded-3xl border-2 border-[#D4AF37]/30">
                                    <span className="text-xs text-[#D4AF37] font-black uppercase mb-2 block">Highest Bidder</span>
                                    <p className="text-3xl font-black text-[#2D0A0A]">{room.activeAuction.highestBid?.nickname || '입찰자 없음'}</p>
                                </div>
                                <div className="bg-[#2D0A0A] p-8 rounded-3xl border border-white/10 text-[#D4AF37]">
                                    <span className="text-xs opacity-50 font-black uppercase mb-2 block">Current Price</span>
                                    <p className="text-4xl font-black">{room.activeAuction.highestBid?.amount || 0}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-300"><span className="text-6xl block mb-6">⚖️</span><p className="text-2xl font-black uppercase tracking-widest">입찰 대기 중...</p></div>
                    )}
                </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-xl border-2 border-purple-50">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><DashboardIcon className="w-6 h-6 text-purple-600"/> 학생 현황</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {room.students.map(student => (
                        <div key={student.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="flex justify-between items-center mb-4"><span className="font-black text-gray-800 text-lg">{student.nickname}</span><span className="font-black text-[#D4AF37]">{student.coins}c</span></div>
                            <div className="space-y-2">{student.inventory.map(item => <div key={item.id} className="text-[10px] bg-white p-2 rounded-lg border border-gray-100 truncate italic">"{item.text}"</div>)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="space-y-6">
            <div className="bg-[#2D0A0A] p-8 rounded-[40px] shadow-2xl border-t-4 border-[#D4AF37] text-[#D4AF37]">
                <h2 className="text-xl font-black mb-6 flex items-center gap-3">🎩 Attendees ({room.students.length})</h2>
                <div className="space-y-4">{room.students.map(student => <div key={student.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10"><span className="font-bold text-white">{student.nickname}</span><span className="text-sm font-black text-[#D4AF37]">{student.inventory.length} items</span></div>)}</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherView;
