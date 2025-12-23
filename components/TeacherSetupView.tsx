
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomMode } from '../types.ts';
import FileImport from './FileImport.tsx';

const TeacherSetupView: React.FC = () => {
  const { room, finalizeSetup, resetStore } = useRoomStore();
  const [sentencesInput, setSentencesInput] = useState('');
  const [roomMode, setRoomMode] = useState<RoomMode>(RoomMode.BOTH);
  const [initialCoins, setInitialCoins] = useState(1000);

  const loadSample = () => {
    const sample = [
      "사과는 빨갛다 / 과일",
      "사자는 백수의 왕이다 / 동물",
      "하늘은 푸른색이다 / 자연",
      "지구는 둥글다 / 과학",
      "1 더하기 1은 2다 / 수학"
    ].join('\n');
    setSentencesInput(sample);
  };

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
            <div className="relative">
                <label className="block text-xs font-black text-[#D4AF37] uppercase mb-2">문장 목록 (문장 / 정답)</label>
                <textarea className="w-full h-40 bg-gray-50 border-2 border-gray-100 rounded-[30px] p-6 outline-none text-sm font-medium" placeholder="예: 문장 / 개념" value={sentencesInput} onChange={(e) => setSentencesInput(e.target.value)} />
                <button onClick={loadSample} className="absolute top-8 right-4 bg-[#D4AF37] text-[#2D0A0A] px-3 py-1 rounded-full text-[10px] font-black hover:bg-black hover:text-white transition">샘플 불러오기</button>
            </div>
            
            <div className="bg-[#FFFDF5] p-6 rounded-[30px] border-2 border-[#D4AF37]/20">
                <FileImport onImport={(lines) => setSentencesInput(lines.join('\n'))} />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">경매 모드 선택</label>
                    <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black" value={roomMode} onChange={(e) => setRoomMode(e.target.value as RoomMode)}>
                        <option value={RoomMode.MEMO}>📝 개념 매칭</option>
                        <option value={RoomMode.ORDER}>🔢 논리 정렬</option>
                        <option value={RoomMode.BOTH}>⚖️ 종합 학습</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">학생 초기 지급 금액</label>
                    <input type="number" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black" value={initialCoins} onChange={(e) => setInitialCoins(Number(e.target.value))} />
                </div>
            </div>
        </div>
        <div className="mt-12 flex gap-4">
            <button onClick={resetStore} className="px-8 py-5 text-gray-400 font-bold uppercase hover:text-red-500 transition">Reset</button>
            <button onClick={handleStart} className="flex-1 bg-[#2D0A0A] text-[#D4AF37] font-black py-5 rounded-[30px] shadow-2xl text-xl hover:bg-black transition border-b-4 border-[#8A6E2F]">🏛️ 개장하기</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetupView;
