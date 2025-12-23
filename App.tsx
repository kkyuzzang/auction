
import React, { useState, useEffect } from 'react';
import { useRoomStore } from './store';
import { RoomStatus } from './types';
import TeacherView from './components/TeacherView';
import TeacherSetupView from './components/TeacherSetupView';
import StudentView from './components/StudentView';

const App: React.FC = () => {
  const { room, isPeerReady, createRoom, joinRoom } = useRoomStore();
  const [role, setRole] = useState<'teacher' | 'student' | null>(() => {
    return (sessionStorage.getItem('auction_role') as any) || null;
  });
  const [studentId, setStudentId] = useState<string | null>(() => {
    return sessionStorage.getItem('auction_student_id') || null;
  });
  
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [studentNicknameInput, setStudentNicknameInput] = useState('');
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (role) sessionStorage.setItem('auction_role', role);
    if (studentId) sessionStorage.setItem('auction_student_id', studentId);
  }, [role, studentId]);

  const handleCreateRoom = () => {
    const code = teacherCodeInput.trim();
    if (!code || code.length < 4) {
      alert('방 코드는 4자리 이상 입력해 주세요.');
      return;
    }
    createRoom('teacher-id', code);
    setRole('teacher');
  };

  const handleJoinRoom = async () => {
    if (!studentNicknameInput.trim() || !studentCodeInput.trim()) {
        alert('이름과 입장 코드를 모두 입력해 주세요.');
        return;
    }
    
    setIsConnecting(true);
    try {
      const id = await joinRoom(studentCodeInput, studentNicknameInput);
      if (id) {
        setStudentId(id);
        setRole('student');
      }
    } catch (e) {
      alert('접속에 실패했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExit = () => {
    if(confirm('모든 세션 정보를 삭제하고 메인으로 돌아가시겠습니까?')) {
        sessionStorage.clear();
        window.location.reload();
    }
  };

  // 실시간 연결 상태 표시 줄
  const StatusBadge = () => (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <span className={`w-2 h-2 rounded-full ${isPeerReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {isPeerReady ? 'Live Connected' : 'Connecting...'}
        </span>
    </div>
  );

  if (role === 'teacher' && room) {
    if (room.status === RoomStatus.SETUP) return <><StatusBadge /><TeacherSetupView /></>;
    return <><StatusBadge /><TeacherView /></>;
  }

  if (role === 'student' && studentId) {
    if (!room) return (
        <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">선생님과 연결이 끊어졌습니다.</h2>
            <button onClick={handleExit} className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold">메인 화면으로 이동</button>
        </div>
    );
    return <><StatusBadge /><StudentView studentId={studentId} /></>;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 font-sans text-white">
      <div className="text-center mb-12 relative">
          <div className="text-4xl mb-2 opacity-80">🏛️</div>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#F5E6AD] via-[#D4AF37] to-[#8A6E2F] tracking-tighter mb-4">
              AUCTION
          </h1>
          <p className="text-[#D4AF37] font-bold text-lg md:text-2xl tracking-widest uppercase">
              Value Your Knowledge
          </p>
          <div className="mt-4 flex justify-center gap-2">
              <span className="w-12 h-[1px] bg-[#D4AF37] self-center"></span>
              <span className="text-xs text-[#D4AF37] font-serif italic">REAL-TIME P2P EDITION</span>
              <span className="w-12 h-[1px] bg-[#D4AF37] self-center"></span>
          </div>
      </div>

      <div className="w-full max-w-md space-y-10">
        <div className="bg-[#2D0A0A] p-8 rounded-[40px] shadow-2xl border-2 border-[#4A0E0E] relative overflow-hidden group">
            <h3 className="text-[#D4AF37] font-bold text-lg mb-4 text-center">⚖️ 선생님 (Host)</h3>
            <div className="space-y-4">
                <input 
                    type="text" 
                    placeholder="방 코드 설정 (예: CLASS1)"
                    className="w-full bg-[#3D0F0F] border-2 border-[#4A0E0E] rounded-2xl px-6 py-4 focus:border-[#D4AF37] focus:outline-none transition text-white text-center uppercase tracking-widest"
                    value={teacherCodeInput}
                    onChange={(e) => setTeacherCodeInput(e.target.value)}
                />
                <button 
                    onClick={handleCreateRoom}
                    className="w-full bg-gradient-to-r from-[#800000] to-[#4A0E0E] text-[#D4AF37] font-black py-5 rounded-2xl transition shadow-xl text-xl border border-[#D4AF37]/30"
                >
                    경매장 개설하기
                </button>
            </div>
        </div>

        <div className="bg-[#1E1E1E] p-8 rounded-[40px] shadow-2xl border-2 border-white/5 relative overflow-hidden group">
            <h3 className="text-[#FCD34D] font-bold text-lg mb-4 text-center">🙋‍♂️ 학생 (Bidder)</h3>
            <div className="space-y-4">
                <input 
                    type="text" 
                    placeholder="사용할 이름"
                    className="w-full bg-[#2A2A2A] border-2 border-white/5 rounded-2xl px-6 py-4 focus:border-[#FCD34D] outline-none text-white font-medium"
                    value={studentNicknameInput}
                    onChange={(e) => setStudentNicknameInput(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="입장 코드 (선생님이 설정한 코드)"
                    className="w-full bg-[#2A2A2A] border-2 border-white/5 rounded-2xl px-6 py-4 focus:border-[#FCD34D] outline-none text-white text-center uppercase tracking-widest"
                    value={studentCodeInput}
                    onChange={(e) => setStudentCodeInput(e.target.value)}
                />
                <button 
                    onClick={handleJoinRoom}
                    disabled={isConnecting}
                    className="w-full bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1A1A1A] font-black py-5 rounded-2xl transition shadow-xl text-xl disabled:opacity-50"
                >
                    {isConnecting ? '접속 시도 중...' : '경매 참여하기'}
                </button>
            </div>
        </div>
      </div>

      <footer className="mt-16 text-gray-600 text-xs font-bold uppercase tracking-[0.3em] flex flex-col items-center gap-2">
          <span>👑 ROYAL SENTENCE AUCTION HOUSE 👑</span>
          <span className="text-[10px] text-gray-700">Powered by PeerJS (No External Server Needed)</span>
      </footer>
    </div>
  );
};

export default App;
