
import React, { useState } from 'react';
import { useRoomStore } from '../store.ts';
import { RoomMode, SentenceTemplate } from '../types.ts';
import FileImport from './FileImport.tsx';

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
            { text: "Earth rotates on its axis once every 24 hours.", concept: "Rotation" },
            { text: "Earth travels around the Sun once every 365 days.", concept: "Revolution" },
            { text: "The moon orbits the Earth once every 27.3 days.", concept: "Lunar Orbit" }
        ]);
    } else {
        setItems([
            { text: "First, prepare all the ingredients.", concept: "1" },
            { text: "Second, heat the pan with some oil.", concept: "2" },
            { text: "Third, sauté the onions and garlic.", concept: "3" },
            { text: "Finally, serve and enjoy your meal.", concept: "4" }
        ]);
    }
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
        
        <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => { setRoomMode(RoomMode.MEMO); setItems([{text:'', concept:''}]); }} className={`px-6 py-3 rounded-2xl font-black transition ${roomMode === RoomMode.MEMO ? 'bg-[#2D0A0A] text-[#D4AF37]' : 'bg-gray-100 text-gray-400'}`}>📝 개념 매칭</button>
            <button onClick={() => { setRoomMode(RoomMode.ORDER); setItems([{text:'', concept:'1'}]); }} className={`px-6 py-3 rounded-2xl font-black transition ${roomMode === RoomMode.ORDER ? 'bg-[#2D0A0A] text-[#D4AF37]' : 'bg-gray-100 text-gray-400'}`}>🔢 순서 나열</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
            <FileImport onImport={handleImport} />
            <div className="flex flex-col gap-3">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">빠른 시작</label>
                <button onClick={loadSampleData} className="w-full py-3 bg-gray-100 rounded-3xl font-black text-gray-500 hover:bg-gray-200 transition">💡 샘플 데이터 불러오기</button>
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
