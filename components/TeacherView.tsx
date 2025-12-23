
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomStatus } from '../types.ts';
import { GavelIcon, DashboardIcon } from './Icons.tsx';
import { downloadCSV, formatResultsForExport } from '../utils.ts';

const TeacherView: React.FC = () => {
  const { room, startGame, closeAuction, transferCoins, resetStore } = useRoomStore();
  const [expandedStudents, setExpandedStudents] = useState<{ [key: string]: boolean }>({});

  if (!room) return null;

  const toggleStudent = (id: string) => {
    setExpandedStudents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReward = (id: string) => {
    const amount = parseInt(prompt("하사할 코인 양을 입력하세요:", "100") || "0");
    if (amount > 0) transferCoins(id, amount);
  };

  const handleExportResults = () => {
    const data = formatResultsForExport(room);
    downloadCSV(`auction_results_${room.code}.csv`, data);
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
            <button onClick={handleExportResults} className="bg-[#1A1A1A] text-[#D4AF37] px-8 py-3 rounded-xl font-black border border-[#D4AF37]">결과 보고서</button>
            <button onClick={resetStore} className="text-rose-200/50 hover:text-rose-200 text-xs font-bold uppercase">Reset</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        <div className="lg:col-span-3 space-y-8">
            {/* 경매 진행 화면 */}
            <div className="bg-white rounded-[40px] shadow-2xl border-2 border-gray-100 overflow-hidden">
                <div className="p-12 text-center min-h-[400px] flex flex-col justify-center bg-gradient-to-b from-white to-gray-50">
                    {room.activeAuction ? (
                        <>
                            <p className="text-4xl md:text-6xl font-serif italic text-gray-800 leading-tight mb-12 px-10">"{room.activeAuction.text}"</p>
                            <div className="flex justify-center gap-8">
                                <div className="bg-[#FFFDF5] p-8 rounded-3xl border-2 border-[#D4AF37]/30 shadow-sm">
                                    <span className="text-[10px] text-[#D4AF37] font-black uppercase mb-2 block">Highest Bidder</span>
                                    <p className="text-3xl font-black text-[#2D0A0A]">{room.activeAuction.highestBid?.nickname || '입찰자 없음'}</p>
                                </div>
                                <div className="bg-[#2D0A0A] p-8 rounded-3xl border border-white/10 text-[#D4AF37] shadow-xl">
                                    <span className="text-[10px] opacity-50 font-black uppercase mb-2 block tracking-widest">Current Price</span>
                                    <p className="text-5xl font-black">{room.activeAuction.highestBid?.amount || 0}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-300 animate-pulse">
                            <span className="text-8xl block mb-6">⚖️</span>
                            <p className="text-2xl font-black uppercase tracking-[0.5em]">입찰 대기 중</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 학생 현황 (접기/펴기 적용) */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border-2 border-purple-50">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><DashboardIcon className="w-6 h-6 text-purple-600"/> 학생 현황 (실시간)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {room.students.map(student => (
                        <div key={student.id} className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
                            <div className="p-6 flex justify-between items-center bg-white border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-gray-800 text-lg">{student.nickname}</span>
                                    <span className="bg-[#FFFDF5] text-[#D4AF37] px-3 py-1 rounded-full text-xs font-black border border-[#D4AF37]/20">{student.coins}c</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleReward(student.id)} className="text-[10px] font-black text-white bg-blue-500 px-3 py-1.5 rounded-xl hover:bg-blue-600 transition">💰 하사</button>
                                    <button onClick={() => toggleStudent(student.id)} className="text-[10px] font-black text-gray-400 hover:text-gray-800">
                                        {expandedStudents[student.id] ? '접기 ▲' : '자산 보기 ▼'}
                                    </button>
                                </div>
                            </div>
                            {expandedStudents[student.id] && (
                                <div className="p-6 space-y-3 bg-gray-50/50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Inventory ({student.inventory.length})</p>
                                    {student.inventory.length > 0 ? (
                                        student.inventory.map(item => (
                                            <div key={item.id} className="text-[11px] bg-white p-3 rounded-xl border border-gray-100 shadow-sm italic leading-tight">
                                                "{item.text}" <span className="text-[#D4AF37] font-black ml-1">[{item.concept}]</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-gray-300 italic">보유 문장 없음</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
            <div className="bg-[#2D0A0A] p-8 rounded-[40px] shadow-2xl border-t-4 border-[#D4AF37] text-[#D4AF37]">
                <h2 className="text-xl font-black mb-6 flex items-center gap-3">🎩 Attendees ({room.students.length})</h2>
                <div className="space-y-4">
                    {room.students.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="font-bold text-white">{s.nickname}</span>
                            <span className="text-xs font-black bg-[#D4AF37] text-[#2D0A0A] px-2 py-0.5 rounded-lg">{s.inventory.length}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherView;
