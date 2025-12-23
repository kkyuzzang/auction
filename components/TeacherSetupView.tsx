
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomMode } from '../types.ts';
import FileImport from './FileImport.tsx';
import { downloadCSV } from '../utils.ts';

const TeacherSetupView: React.FC = () => {
  const { room, finalizeSetup, resetStore } = useRoomStore();
  const [sentencesInput, setSentencesInput] = useState('');
  const [roomMode, setRoomMode] = useState<RoomMode>(RoomMode.BOTH);
  const [initialCoins, setInitialCoins] = useState(1000);
  if (!room) return null;
  const handleStart = () => {
    if (!sentencesInput.trim()) { alert('데이터를 입력해 주세요.'); return; }
    finalizeSetup(sentencesInput, roomMode, initialCoins);
  };
  return (
    <div className="min-h-screen bg-[#1A1A1A] p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-[50px] shadow-2xl p-12 border-t-[10px] border-[#D4AF37]">
        <h2 className="text-4xl font-black text-[#2D0A0A] mb-10 text-center">경매장 세팅</h2>
        <div className="space-y-8">
            <textarea className="w-full h-40 bg-gray-50 border-2 border-gray-100 rounded-[30px] p-6 outline-none text-sm" placeholder="문장 / 정답 (순서)" value={sentencesInput} onChange={(e) => setSentencesInput(e.target.value)} />
            <div className="bg-[#FFFDF5] p-6 rounded-[30px] border-2 border-[#D4AF37]/20"><FileImport onImport={(lines) => setSentencesInput(lines.join('\n'))} /></div>
            <div className="grid grid-cols-2 gap-6">
                <select className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black" value={roomMode} onChange={(e) => setRoomMode(e.target.value as RoomMode)}>
                    <option value={RoomMode.MEMO}>📝 개념 매칭</option>
                    <option value={RoomMode.ORDER}>🔢 논리 정렬</option>
                    <option value={RoomMode.BOTH}>⚖️ 종합 학습</option>
                </select>
                <input type="number" className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black" value={initialCoins} onChange={(e) => setInitialCoins(Number(e.target.value))} />
            </div>
        </div>
        <div className="mt-12 flex gap-4">
            <button onClick={resetStore} className="px-8 py-5 text-gray-400 font-bold uppercase">Reset</button>
            <button onClick={handleStart} className="flex-1 bg-[#2D0A0A] text-[#D4AF37] font-black py-5 rounded-[30px] shadow-2xl text-xl">🏛️ 개장하기</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetupView;
