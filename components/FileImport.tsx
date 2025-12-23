
import React, { useCallback } from 'react';

declare const Papa: any;
declare const XLSX: any;

interface FileImportProps {
  onImport: (sentences: string[]) => void;
}

const FileImport: React.FC<FileImportProps> = ({ onImport }) => {
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        Papa.parse(text, {
          header: false,
          complete: (results: any) => {
            const lines = results.data
              .map((row: any) => {
                if (Array.isArray(row)) {
                    const text = row[0]?.toString().trim() || "";
                    const concept = row[1]?.toString().trim() || "";
                    // 구분자를 / 로 변경
                    return text ? `${text} / ${concept}` : null;
                }
                return null;
              })
              .filter((s: any) => s !== null);
            onImport(lines);
          }
        });
      };
      reader.readAsText(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const lines = jsonData
          .map((row: any) => {
             if (Array.isArray(row)) {
                const text = row[0]?.toString().trim() || "";
                const concept = row[1]?.toString().trim() || "";
                return text ? `${text} / ${concept}` : null;
             }
             return null;
          })
          .filter((s: any) => s !== null);
        onImport(lines);
      };
      reader.readAsArrayBuffer(file);
    }
  }, [onImport]);

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">파일에서 일괄 불러오기</label>
      <div className="relative">
        <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-xs text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#2D0A0A] file:text-[#D4AF37] hover:file:bg-black cursor-pointer border-2 border-dashed border-gray-200 rounded-[30px] p-2 shadow-inner"
        />
      </div>
      <p className="text-[10px] text-gray-400 font-medium">* 1열은 <b>문장</b>, 2열은 <b>개념/순서</b>로 자동 매칭됩니다.</p>
    </div>
  );
};

export default FileImport;
