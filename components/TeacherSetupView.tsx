
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomMode, SentenceTemplate } from '../types.ts';
import FileImport from './FileImport.tsx';
import { downloadCSV } from '../utils.ts';

const TeacherSetupView: React.FC = () => {
  const { room, finalizeSetup } = useRoomStore();
  const [roomMode, setRoomMode] = useState<RoomMode>(RoomMode.MEMO);
  const [initialCoins, setInitialCoins] = useState(100000);
  const [items, setItems] = useState<SentenceTemplate[]>([{ text: '', concept: '' }]);

  const addItem = () => setItems([...items, { text: '', concept: (roomMode === RoomMode.ORDER ? (items.length + 1).toString() : '') }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof SentenceTemplate, val: string) => {
    const next = [...items];
    next[idx][field] = val;
    setItems(next);
  };

  const handleImport = (lines: string[]) => {
    const newItems = lines.map((line, idx) => {
        const parts = line.split(' / ');
        return {
            text: parts[0] || "",
            concept: parts[1] || (roomMode === RoomMode.ORDER ? (idx + 1).toString() : "")
        };
    });
    setItems(newItems);
  };

  const loadSampleData = () => {
    if (roomMode === RoomMode.MEMO) {
        setItems([
            { text: "지구는 24시간마다 한 번씩 제자리에서 돕니다.", concept: "자전" },
            { text: "지구는 태양 주위를 1년에 한 번씩 돕니다.", concept: "공전" },
            { text: "달은 지구 주위를 약 27.3일마다 한 번씩 돕니다.", concept: "달의 공전" }
        ]);
    } else {
        setItems([
            { text: "먼저, 신선한 재료를 깨끗하게 씻어 준비합니다.", concept: "1" },
            { text: "팬에 기름을 두르고 중불에서 예열합니다.", concept: "2" },
            { text: "준비한 재료를 넣고 골고루 볶아줍니다.", concept: "3" },
            { text: "마지막으로 접시에 담아 맛있게 먹습니다.", concept: "4" }
        ]);
    }
  };

  const downloadSampleExcel = () => {
    const data = roomMode === RoomMode.MEMO ? [
        { "문장": "꽃이 피는 계절은 언제인가요?", "정답(개념)": "봄" },
        { "문장": "지구에서 가장 가까운 항성은?", "정답(개념)": "태양" }
    ] : [
        { "문장": "뿌리가 내립니다.", "정답(순서)": "1" },
        { "문장": "줄기가 자랍니다.", "정답(순서)": "2" },
        { "문장": "꽃이 핍니다.", "정답(순서)": "3" }
    ];
    downloadCSV(`sample_${roomMode}.csv`, data);
  };

  const handleStart = () => {
    const filtered = items.filter(i => i.text.trim() !== '');
    if (filtered.length === 0) { alert('최소 1개 이상의 문장을 입력하세요.'); return; }
    finalizeSetup(filtered, roomMode, initialCoins);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-[50px] shadow-2xl p-10 border-t-[12px] border-[#D4AF37]">
        <h2 className="text-3xl font-black text-[#2D0A0A] mb-2 text-center">경매 시나리오 설계</h2>
        
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex gap-4">
                <button onClick={() => { setRoomMode(RoomMode.MEMO); setItems([{text:'', concept:''}]); }} className={`px-8 py-3 rounded-2xl font-black transition ${roomMode === RoomMode.MEMO ? 'bg-[#2D0A0A] text-[#D4AF37] shadow-lg' : 'bg-gray-100 text-gray-400'}`}>📝 개념 매칭 모드</button>
                <button onClick={() => { setRoomMode(RoomMode.ORDER); setItems([{text:'', concept:'1'}]); }} className={`px-8 py-3 rounded-2xl font-black transition ${roomMode === RoomMode.ORDER ? 'bg-[#2D0A0A] text-[#D4AF37] shadow-lg' : 'bg-gray-100 text-gray-400'}`}>🔢 순서 나열 모드</button>
            </div>
            <p className="text-xs font-bold text-gray-400 italic bg-gray-50 px-6 py-2 rounded-full">
                {roomMode === RoomMode.MEMO 
                    ? "각 문장과 어울리는 '개념(키워드)'을 맞추는 학습 모드입니다." 
                    : "각 문장을 올바른 '논리적 순서'대로 배치하는 학습 모드입니다."}
            </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
            <FileImport onImport={handleImport} />
            <div className="flex flex-col gap-3">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">빠른 시작</label>
                <button onClick={loadSampleData} className="w-full py-3 bg-blue-50 text-blue-600 rounded-3xl font-black text-xs hover:bg-blue-100 transition border border-blue-100">💡 한글 샘플 로드</button>
            </div>
            <div className="flex flex-col gap-3">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">전용 양식</label>
                <button 
                    onClick={downloadSampleExcel} 
                    className={`w-full py-3 rounded-3xl font-black text-xs transition border ${roomMode === RoomMode.MEMO ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                >
                    📥 {roomMode === RoomMode.MEMO ? '개념 매칭용' : '순서 나열용'} 양식 받기
                </button>
            </div>
        </div>

        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 mb-10 border-y border-gray-100 py-6">
            {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-6 rounded-3xl border border-gray-100 relative group">
                    <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-gray-300 border-2 border-gray-100">{idx + 1}</span>
                    <div className="flex-1 space-y-3">
                        <input 
                            placeholder="문장을 입력하세요" 
                            className="w-full bg-white border-2 border-gray-100 rounded-xl px-5 py-3 outline-none focus:border-[#D4AF37] font-serif" 
                            value={item.text} 
                            onChange={(e) => updateItem(idx, 'text', e.target.value)}
                        />
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase">{roomMode === RoomMode.ORDER ? '순서' : '개념(정답)'}</label>
                            <input 
                                placeholder={roomMode === RoomMode.ORDER ? "숫자" : "정답 개념"} 
                                className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[#D4AF37]" 
                                value={item.concept} 
                                readOnly={roomMode === RoomMode.ORDER}
                                onChange={(e) => updateItem(idx, 'concept', e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 transition text-red-300 hover:text-red-500 font-black">✕</button>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-black hover:bg-gray-50 transition">+ 항목 추가</button>
        </div>

        <div className="grid grid-cols-2 gap-8 items-end">
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase ml-2">초기 자금 (Step 1,000)</label>
                <div className="flex items-center bg-gray-50 rounded-2xl p-1 border-2 border-gray-100">
                    <button onClick={() => setInitialCoins(c => Math.max(0, c - 1000))} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl hover:bg-gray-100 transition">-</button>
                    <input type="number" step="1000" className="flex-1 bg-transparent text-center font-black text-xl outline-none" value={initialCoins} onChange={(e) => setInitialCoins(Number(e.target.value))} />
                    <button onClick={() => setInitialCoins(c => c + 1000)} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl hover:bg-gray-100 transition">+</button>
                </div>
            </div>
            <button onClick={handleStart} className="bg-[#2D0A0A] text-[#D4AF37] font-black py-5 rounded-3xl shadow-2xl text-xl hover:scale-[1.02] active:scale-[0.98] transition">🏛️ 경매장 개설</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetupView;
