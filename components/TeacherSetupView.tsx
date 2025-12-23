
import React, { useState } from 'react';
import { useRoomStore } from '../store';
import { RoomMode } from '../types';
import FileImport from './FileImport';
import { downloadCSV } from '../utils';

const TeacherSetupView: React.FC = () => {
  const { room, finalizeSetup, resetStore } = useRoomStore();
  const [sentencesInput, setSentencesInput] = useState('');
  const [roomMode, setRoomMode] = useState<RoomMode>(RoomMode.BOTH);
  const [initialCoins, setInitialCoins] = useState(1000);

  if (!room) return null;

  const handleStart = () => {
    if (!sentencesInput.trim()) {
      alert('최소 하나 이상의 데이터를 입력해 주세요.');
      return;
    }
    finalizeSetup(sentencesInput, roomMode, initialCoins);
  };

  const downloadSample = () => {
    let sampleData;
    if (roomMode === RoomMode.ORDER) {
        sampleData = [
            { '문장': '첫 번째로, 문제를 정의합니다.', '순서': '1' },
            { '문장': '두 번째로, 데이터를 수집합니다.', '순서': '2' },
            { '문장': '세 번째로, 결과를 분석합니다.', '순서': '3' },
            { '문장': '마지막으로, 보고서를 작성합니다.', '순서': '4' }
        ];
    } else {
        sampleData = [
            { '문장': '너 자신을 알라', '개념': '소크라테스' },
            { '문장': '인생은 멀리서 보면 희극이다', '개념': '찰리 채플린' },
            { '문장': '주사위는 던져졌다', '개념': '율리우스 카이사르' },
            { '문장': '내일 지구의 종말이 오더라도...', '개념': '스피노자' }
        ];
    }
    downloadCSV(`경매_양식_${roomMode === RoomMode.ORDER ? '순서' : '개념'}.csv`, sampleData);
  };

  const getModeDescription = () => {
    switch (roomMode) {
      case RoomMode.MEMO:
        return "낙찰받은 문장에 대해 학습한 개념이나 근거를 메모로 기록하는 활동에 집중합니다.";
      case RoomMode.ORDER:
        return "여러 문장을 낙찰받아 올바른 순서(번호)대로 재배열하는 논리 구성 활동에 집중합니다.";
      case RoomMode.BOTH:
        return "개념 기록과 순서 재배열을 병행하는 심화 학습 모드입니다.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-[50px] shadow-2xl p-12 border-t-[10px] border-[#D4AF37]">
        <div className="mb-10 text-center">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2 block">Curriculum Backstage</span>
            <h2 className="text-4xl font-black text-[#2D0A0A] mb-2">경매장 세팅 및 규칙</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">ROOM CODE: {room.code}</p>
        </div>

        <div className="space-y-8">
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <span>📜</span> {roomMode === RoomMode.ORDER ? '문장 / 순서' : '문장 / 개념'} 입력
                    </label>
                    <button onClick={downloadSample} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition">
                        📥 샘플 양식 다운로드
                    </button>
                </div>
                <div className="relative">
                    <textarea 
                        className="w-full h-40 bg-gray-50 border-2 border-gray-100 rounded-[30px] p-6 focus:border-[#D4AF37] focus:bg-white outline-none transition text-sm leading-relaxed"
                        placeholder={roomMode === RoomMode.ORDER ? "문장 / 순서번호 (예: 첫 번째 단계 / 1)" : "문장 / 개념 (예: 지구가 멸망하더라도 / 스피노자)"}
                        value={sentencesInput}
                        onChange={(e) => setSentencesInput(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-6 text-[10px] text-gray-300 font-bold uppercase">
                        Separator: "/" (Slash)
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 px-4">
                    * 한 줄에 하나씩 <b>문장 / {roomMode === RoomMode.ORDER ? '순서번호' : '개념'}</b> 형식으로 입력하세요.
                </p>
            </div>

            <div className="bg-[#FFFDF5] p-6 rounded-[30px] border-2 border-[#D4AF37]/20">
                <FileImport onImport={(lines) => {
                    setSentencesInput(lines.join('\n'));
                }} />
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Auction Rule</label>
                        <select 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-[#D4AF37] outline-none font-black text-gray-700 transition"
                            value={roomMode}
                            onChange={(e) => setRoomMode(e.target.value as RoomMode)}
                        >
                            <option value={RoomMode.MEMO}>📝 개념 매칭 (메모)</option>
                            <option value={RoomMode.ORDER}>🔢 논리 정렬 (순서)</option>
                            <option value={RoomMode.BOTH}>⚖️ 종합 학습 모드</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Initial Capital</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-[#D4AF37] outline-none font-black text-gray-700"
                            value={initialCoins}
                            onChange={(e) => setInitialCoins(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        <span className="font-black mr-2">💡 규칙 설명:</span>
                        {getModeDescription()}
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4">
            <button onClick={resetStore} className="px-8 py-5 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-rose-500 transition">Reset</button>
            <button 
                onClick={handleStart}
                className="flex-1 bg-[#2D0A0A] hover:bg-black text-[#D4AF37] font-black py-5 rounded-[30px] transition shadow-2xl text-xl border-b-4 border-black active:translate-y-1 active:border-b-0"
            >
                🏛️ 경매장 오픈하기
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetupView;
