
import { Room, Student } from './types';

export const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const downloadCSV = (filename: string, data: any[]) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fix: Corrected property 'boardItems' to 'inventory' and removed non-existent 'room.sentences'
export const formatResultsForExport = (room: Room) => {
  return room.students.map(student => ({
    '학생 이름': student.nickname,
    '남은 코인': student.coins,
    '낙찰된 문장 수': student.inventory.length,
    '활동 결과': student.inventory.map(item => {
        return `[문장: ${item.text}, 메모: ${item.memo || '없음'}, 순서: ${item.orderIndex}]`;
    }).join(' | ')
  }));
};
