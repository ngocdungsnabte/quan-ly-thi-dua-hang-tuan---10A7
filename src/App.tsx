import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Users, 
  Trophy, 
  BarChart3, 
  ClipboardList, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  Copy, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  UserPlus,
  X,
  FileDown,
  RefreshCw,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  Student, 
  Log, 
  ActionType, 
  ClassInfo 
} from './types';
import { 
  DEFAULT_STUDENTS, 
  CRITERIA, 
  CLASS_BASE_POINTS, 
  GROUP_BASE_POINTS, 
  MAX_WEEKS 
} from './constants';

type View = 'input' | 'summary' | 'stats';

export default function App() {
  const [view, setView] = useState<View>('input');
  const [currentWeek, setCurrentWeek] = useState(() => Number(localStorage.getItem('thi-dua-week')) || 1);
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('thi-dua-students');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
  });
  const [logs, setLogs] = useState<Log[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo>(() => {
    const saved = localStorage.getItem('thi-dua-class');
    return saved ? JSON.parse(saved) : { size: 44, absent: 0, startDate: '', endDate: '' };
  });

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>('minus');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [modalGroupFilter, setModalGroupFilter] = useState<number | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<Record<string, number>>({});
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(() => localStorage.getItem('thi-dua-gs-url') || 'https://script.google.com/macros/s/AKfycbzpc5FxdQ7Z7D8WkmGYQYAYl01IYu9DhUwma9PCH9-PaxOKOvyjrbcu4Ulo77UASYxXdA/exec');
  const [isSyncing, setIsSyncing] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('thi-dua-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('thi-dua-class', JSON.stringify(classInfo));
  }, [classInfo]);

  useEffect(() => {
    localStorage.setItem('thi-dua-gs-url', googleSheetsUrl);
  }, [googleSheetsUrl]);

  useEffect(() => {
    localStorage.setItem('thi-dua-week', currentWeek.toString());
  }, [currentWeek]);

  // Derived Data
  const weekLogs = useMemo(() => logs.filter(l => l.week === currentWeek), [logs, currentWeek]);

  const groupStats = useMemo(() => {
    const stats: Record<number, { p: number; m: number }> = { 
      1: { p: 0, m: 0 }, 
      2: { p: 0, m: 0 }, 
      3: { p: 0, m: 0 }, 
      4: { p: 0, m: 0 } 
    };
    weekLogs.forEach(l => {
      const group = l.group as keyof typeof stats;
      if (l.type === 'plus') stats[group].p += l.score;
      else stats[group].m += l.score;
    });
    return stats;
  }, [weekLogs]);

  const rankings = useMemo(() => {
    return [1, 2, 3, 4].map(num => ({
      id: num,
      score: GROUP_BASE_POINTS + groupStats[num as keyof typeof groupStats].p - groupStats[num as keyof typeof groupStats].m
    })).sort((a, b) => b.score - a.score);
  }, [groupStats]);

  const studentPerformance = useMemo(() => {
    return students.map(s => {
      const sLogs = weekLogs.filter(l => l.studentId === s.id);
      const plus = sLogs.filter(l => l.type === 'plus').reduce((acc, l) => acc + l.score, 0);
      const minus = sLogs.filter(l => l.type === 'minus').reduce((acc, l) => acc + l.score, 0);
      return { ...s, diff: plus - minus };
    });
  }, [students, weekLogs]);

  const topStudents = useMemo(() => 
    [...studentPerformance].filter(s => s.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5),
  [studentPerformance]);

  const bottomStudents = useMemo(() => 
    [...studentPerformance].filter(s => s.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5),
  [studentPerformance]);

  // Handlers
  const handleAddLog = () => {
    if (!selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newLogs: Log[] = [];
    const now = new Date();
    const timeStr = format(now, 'HH:mm');
    const dateStr = format(now, 'yyyy-MM-dd');

    (Object.entries(selectedCriteria) as [string, number][]).forEach(([cid, count]) => {
      if (count <= 0) return;
      const criteria = CRITERIA[actionType].find(c => c.id === cid);
      if (!criteria) return;

      newLogs.push({
        id: Math.random().toString(36).substr(2, 9),
        studentId: student.id,
        studentName: student.name,
        group: student.group,
        criteria: criteria.name,
        unitScore: criteria.score,
        count,
        score: criteria.score * count,
        type: actionType,
        week: currentWeek,
        time: timeStr,
        date: dateStr
      });
    });

    setLogs(prev => [...newLogs, ...prev]);
    setIsActionModalOpen(false);
    setSelectedCriteria({});
    setSelectedStudentId(null);
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const addStudent = (name: string, group: number) => {
    if (!name) return;
    setStudents(prev => [...prev, { id: Date.now(), name, group }]);
  };

  const deleteStudent = (id: number) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const generateReportText = () => {
    const present = Math.max(0, classInfo.size - classInfo.absent);
    const statsValues = Object.values(groupStats) as { p: number; m: number }[];
    const totalPlus = statsValues.reduce((acc, g) => acc + g.p, 0);
    const totalMinus = statsValues.reduce((acc, g) => acc + g.m, 0);
    const finalScore = CLASS_BASE_POINTS + totalPlus - totalMinus;

    let text = `BÁO CÁO THI ĐUA LỚP 10A7 - TUẦN ${currentWeek}\n`;
    if (classInfo.startDate && classInfo.endDate) {
      text += `Từ ngày ${classInfo.startDate} đến ngày ${classInfo.endDate}\n`;
    }
    text += `Sĩ số: ${classInfo.size} | Vắng: ${classInfo.absent} | Hiện diện: ${present}\n`;
    text += `Quỹ điểm ban đầu: ${CLASS_BASE_POINTS}\n`;
    text += `-------------------------------------------\n\n`;
    
    text += `I. XẾP HẠNG TỔ (Bắt đầu từ 0)\n`;
    rankings.forEach((g, idx) => {
      text += `Hạng ${idx + 1}. Tổ ${g.id}: ${g.score >= 0 ? '+' : ''}${g.score}đ\n`;
    });
    
    text += `\nII. KẾT QUẢ LỚP: ${finalScore}đ\n`;
    text += `(Cách tính: 40 + ${totalPlus} - ${totalMinus})\n`;
    
    text += `\nIII. CHI TIẾT GHI NHẬN\n`;
    if (weekLogs.length === 0) {
      text += `- (Trống)\n`;
    } else {
      weekLogs.forEach((l, idx) => {
        text += `${idx + 1}. [Tổ ${l.group}] ${l.studentName}: ${l.type === 'plus' ? '+' : '-'}${l.score}đ - ${l.criteria} (x${l.count})\n`;
      });
    }
    return text;
  };

  const copyToClipboard = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text);
    alert('Đã sao chép báo cáo vào bộ nhớ tạm!');
  };

  const exportToExcel = () => {
    // 1. Group Rankings
    const groupData = rankings.map((g, idx) => ({
      'Hạng': idx + 1,
      'Tổ': `Tổ ${g.id}`,
      'Điểm Cộng': groupStats[g.id].p,
      'Điểm Trừ': groupStats[g.id].m,
      'Tổng Điểm': g.score
    }));

    // 2. Detailed Logs
    const logData = weekLogs.map((l, idx) => ({
      'STT': idx + 1,
      'Học sinh': l.studentName,
      'Tổ': `Tổ ${l.group}`,
      'Loại': l.type === 'plus' ? 'Cộng' : 'Trừ',
      'Nội dung': l.criteria,
      'Số lượng': l.count,
      'Điểm': l.score,
      'Ngày': l.date,
      'Giờ': l.time
    }));

    // 3. Student Performance
    const studentData = studentPerformance.map((s, idx) => ({
      'STT': idx + 1,
      'Học sinh': s.name,
      'Tổ': `Tổ ${s.group}`,
      'Tổng Điểm': s.diff
    }));

    const wb = XLSX.utils.book_new();
    
    const wsGroup = XLSX.utils.json_to_sheet(groupData);
    XLSX.utils.book_append_sheet(wb, wsGroup, "Xếp hạng tổ");

    const wsLogs = XLSX.utils.json_to_sheet(logData);
    XLSX.utils.book_append_sheet(wb, wsLogs, "Chi tiết ghi nhận");

    const wsStudents = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(wb, wsStudents, "Thống kê học sinh");

    XLSX.writeFile(wb, `Bao_Cao_Thi_Dua_10A7_Tuan_${currentWeek}.xlsx`);
  };

  const syncToGoogleSheets = async () => {
    if (!googleSheetsUrl) {
      alert('Vui lòng nhập URL Google Apps Script trong phần cài đặt bên dưới.');
      return;
    }

    setIsSyncing(true);
    try {
      const data = {
        week: currentWeek,
        logs: weekLogs,
        rankings: rankings,
        groupStats: groupStats,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors for simple POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Since we use no-cors, we can't see the response body, but we can assume success if no error thrown
      alert('Đã gửi yêu cầu đồng bộ! Vui lòng kiểm tra Google Sheets của bạn.');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Lỗi đồng bộ: ' + (error instanceof Error ? error.message : 'Không rõ nguyên nhân'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-700 font-sans pb-20 text-[1.05rem]">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 text-xl">
                10A7
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">QUẢN LÝ THI ĐUA HÀNG TUẦN</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Năm học 2025 - 2026</p>
              </div>
            </div>

            <nav className="flex gap-1 sm:gap-6">
              {[
                { id: 'input', label: 'Ghi Nhận', icon: ClipboardList },
                { id: 'summary', label: 'Tổng Kết', icon: Trophy },
                { id: 'stats', label: 'Thống Kê', icon: BarChart3 },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id as View)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all uppercase tracking-wide",
                    view === t.id 
                      ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <select 
                value={currentWeek} 
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                {Array.from({ length: MAX_WEEKS }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Class Info Banner */}
        <section className="mb-8">
          <div className="bg-white border border-indigo-100 rounded-[24px] shadow-sm p-6 flex flex-wrap items-center justify-between gap-6 bg-gradient-to-r from-white to-indigo-50/30">
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={classInfo.startDate}
                    onChange={(e) => setClassInfo(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                  <span className="text-slate-400 text-xs font-bold">đến</span>
                  <input 
                    type="date"
                    value={classInfo.endDate}
                    onChange={(e) => setClassInfo(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sĩ số:</span>
                <input 
                  type="number" 
                  value={classInfo.size}
                  onChange={(e) => setClassInfo(prev => ({ ...prev, size: Number(e.target.value) }))}
                  className="w-10 text-sm font-bold text-indigo-600 border-none bg-transparent text-center focus:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vắng:</span>
                <input 
                  type="number" 
                  value={classInfo.absent}
                  onChange={(e) => setClassInfo(prev => ({ ...prev, absent: Number(e.target.value) }))}
                  className="w-10 text-sm font-bold text-rose-500 border-none bg-transparent text-center focus:ring-0"
                />
              </div>
              <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
              <div className="text-[10px] font-bold py-1.5 px-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                Hiện diện: {Math.max(0, classInfo.size - classInfo.absent)}
              </div>
            </div>
          </div>
        </section>

        {/* View Content */}
        <AnimatePresence mode="wait">
          {view === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-orange-600 uppercase tracking-tight">GHI NHẬN THI ĐUA</h2>
                  <p className="text-slate-400 text-sm">Cập nhật vi phạm và thành tích của học sinh.</p>
                </div>
                <button 
                  onClick={() => setIsStudentModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Quản Lý Học Sinh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => { 
                    setActionType('minus'); 
                    setSelectedStudentId(null);
                    setModalGroupFilter(null);
                    setSelectedCriteria({});
                    setIsActionModalOpen(true); 
                  }}
                  className="group p-8 bg-white border border-rose-100 rounded-[32px] text-left hover:border-rose-400 transition-all shadow-sm flex items-start gap-6 border-l-4 border-l-rose-500"
                >
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Minus className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 text-slate-800">Thêm Vi Phạm</h3>
                    <p className="text-slate-400 text-sm">Ghi nhận các điểm trừ (-) của học sinh.</p>
                  </div>
                </button>

                <button 
                  onClick={() => { 
                    setActionType('plus'); 
                    setSelectedStudentId(null);
                    setModalGroupFilter(null);
                    setSelectedCriteria({});
                    setIsActionModalOpen(true); 
                  }}
                  className="group p-8 bg-white border border-emerald-100 rounded-[32px] text-left hover:border-emerald-400 transition-all shadow-sm flex items-start gap-6 border-l-4 border-l-emerald-500"
                >
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 text-slate-800">Thêm Thành Tích</h3>
                    <p className="text-slate-400 text-sm">Ghi nhận các điểm cộng (+) của học sinh.</p>
                  </div>
                </button>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi nhận gần đây (Tuần {currentWeek})</h3>
                  <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{weekLogs.length} bản ghi</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/30 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học sinh</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổ</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nội dung</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Số lượng</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Điểm</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                        <th className="px-8 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {weekLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-8 py-16 text-center text-slate-300 text-sm italic">Không có dữ liệu ghi nhận trong tuần này.</td>
                        </tr>
                      ) : (
                        weekLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-4">
                              <p className="text-sm font-bold text-slate-800">{log.studentName}</p>
                            </td>
                            <td className="px-8 py-4">
                              <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[11px] font-bold">Tổ {log.group}</span>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex flex-col">
                                <p className="text-[13px] font-bold text-slate-700">{log.criteria}</p>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase",
                                  log.type === 'plus' ? "text-emerald-500" : "text-rose-500"
                                )}>
                                  {log.type === 'plus' ? 'Thành tích' : 'Vi phạm'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">x{log.count}</span>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className={cn(
                                "text-sm font-extrabold",
                                log.type === 'plus' ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {log.type === 'plus' ? '+' : '-'}{log.score}
                              </span>
                            </td>
                            <td className="px-8 py-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{log.time}</p>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <button 
                                onClick={() => deleteLog(log.id)}
                                className="text-slate-200 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'summary' && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-orange-600 uppercase tracking-tight">TỔNG KẾT THI ĐUA TUẦN {currentWeek}</h2>
                  <p className="text-slate-400 text-sm">Kết quả thi đua và xếp hạng của lớp.</p>
                </div>
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  <ClipboardList className="w-4 h-4" />
                  Xem Báo Cáo
                </button>
              </div>

              {/* Class Summary Stats (Moved to Top) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Quỹ điểm ban đầu', value: CLASS_BASE_POINTS, color: 'slate' },
                  { label: 'Tổng cộng (+)', value: `+${(Object.values(groupStats) as {p: number, m: number}[]).reduce((acc, g) => acc + g.p, 0)}`, color: 'emerald' },
                  { label: 'Tổng trừ (-)', value: `-${(Object.values(groupStats) as {p: number, m: number}[]).reduce((acc, g) => acc + g.m, 0)}`, color: 'rose' },
                  { 
                    label: 'Tổng điểm', 
                    value: CLASS_BASE_POINTS + (Object.values(groupStats) as {p: number, m: number}[]).reduce((acc, g) => acc + g.p, 0) - (Object.values(groupStats) as {p: number, m: number}[]).reduce((acc, g) => acc + g.m, 0), 
                    color: 'rose',
                    highlight: true
                  },
                ].map((s, i) => (
                  <div key={i} className={cn(
                    "bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm transition-all",
                    s.highlight && "border-b-4 border-b-rose-500 scale-[1.02] bg-rose-50/20"
                  )}>
                    <p className={cn("text-[10px] font-bold uppercase mb-2", `text-${s.color}-500`)}>{s.label}</p>
                    <p className={cn(
                      "font-black", 
                      s.highlight ? "text-4xl text-rose-600" : "text-2xl text-slate-700",
                      !s.highlight && `text-${s.color}-700`
                    )}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Group Details (Breakdown) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng kết thi đua các tổ</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((num) => {
                    const stats = groupStats[num as keyof typeof groupStats];
                    const final = GROUP_BASE_POINTS + stats.p - stats.m;
                    return (
                      <div key={num} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800">Tổ {num}</h4>
                          <span className={cn(
                            "text-sm font-black",
                            final >= 0 ? "text-indigo-600" : "text-rose-600"
                          )}>
                            {final >= 0 ? '+' : ''}{final}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                            <span>Cộng (+)</span>
                            <span className="text-emerald-500">+{stats.p}</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                            <span>Trừ (-)</span>
                            <span className="text-rose-500">-{stats.m}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group Rankings (Moved to Bottom) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Xếp hạng các tổ</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {rankings.map((g, idx) => (
                    <div key={g.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-slate-200"
                      )} />
                      <div className="flex justify-between items-start">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                          idx === 0 ? "bg-amber-50 text-amber-600" : 
                          idx === 1 ? "bg-slate-50 text-slate-600" : 
                          idx === 2 ? "bg-amber-50 text-amber-800" : 
                          "bg-slate-50 text-slate-400"
                        )}>
                          {idx + 1}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổ {g.id}</p>
                          <p className={cn(
                            "text-xl font-black",
                            g.score >= 0 ? "text-indigo-600" : "text-rose-600"
                          )}>
                            {g.score >= 0 ? '+' : ''}{g.score}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-black text-orange-600 uppercase tracking-tight">THỐNG KÊ CHI TIẾT</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-widest">Biểu đồ hiệu số cá nhân</h3>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="diff" radius={[4, 4, 0, 0]}>
                          {studentPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.diff >= 0 ? '#6366f1' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Top Tích Cực</h3>
                    </div>
                    <div className="space-y-3">
                      {topStudents.length === 0 ? (
                        <p className="text-center text-slate-300 py-4 text-xs italic">Chưa có thành tích.</p>
                      ) : (
                        topStudents.map((s, i) => (
                          <div key={s.id} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <span className="text-xs font-bold text-slate-700">{i + 1}. {s.name}</span>
                            <span className="text-xs font-black text-emerald-600">+{s.diff}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingDown className="w-5 h-5 text-rose-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Cần Nhắc Nhở</h3>
                    </div>
                    <div className="space-y-3">
                      {bottomStudents.length === 0 ? (
                        <p className="text-center text-slate-300 py-4 text-xs italic">Chưa có vi phạm.</p>
                      ) : (
                        bottomStudents.map((s, i) => (
                          <div key={s.id} className="flex justify-between items-center p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                            <span className="text-xs font-black text-rose-600">{s.diff}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Action Modal */}
      <AnimatePresence>
        {isActionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-8 relative z-10 border-t-8",
                actionType === 'plus' ? "border-emerald-500" : "border-rose-500"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">
                  {actionType === 'plus' ? 'Ghi Nhận Thành Tích' : 'Ghi Nhận Vi Phạm'}
                </h3>
                <button onClick={() => setIsActionModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chọn Tổ</label>
                    <select 
                      value={modalGroupFilter || ''} 
                      onChange={(e) => {
                        setModalGroupFilter(e.target.value ? Number(e.target.value) : null);
                        setSelectedStudentId(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Tất cả các tổ</option>
                      {[1, 2, 3, 4].map(g => (
                        <option key={g} value={g}>Tổ {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chọn Học Sinh</label>
                    <select 
                      value={selectedStudentId || ''} 
                      onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Chọn học sinh...</option>
                      {students
                        .filter(s => !modalGroupFilter || s.group === modalGroupFilter)
                        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} (Tổ {s.group})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nội dung & Số lần</label>
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {CRITERIA[actionType].map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={!!selectedCriteria[c.id]}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCriteria(prev => ({ ...prev, [c.id]: 1 }));
                              else setSelectedCriteria(prev => {
                                const next = { ...prev };
                                delete next[c.id];
                                return next;
                              });
                            }}
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-700">{c.name}</p>
                            <p className={cn("text-[10px] font-bold", actionType === 'plus' ? "text-emerald-500" : "text-rose-400")}>
                              Đơn vị: {actionType === 'plus' ? '+' : '-'}{c.score}đ
                            </p>
                          </div>
                        </div>
                        {selectedCriteria[c.id] !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Lần:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={selectedCriteria[c.id]}
                              onChange={(e) => setSelectedCriteria(prev => ({ ...prev, [c.id]: Math.max(1, Number(e.target.value)) }))}
                              className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsActionModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleAddLog}
                    disabled={!selectedStudentId || Object.keys(selectedCriteria).length === 0}
                    className={cn(
                      "flex-[2] py-4 rounded-2xl text-sm font-bold text-white shadow-xl transition-all disabled:opacity-50 disabled:shadow-none",
                      actionType === 'plus' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100" : "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                    )}
                  >
                    Ghi Nhận
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Management Modal */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStudentModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-8 relative z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Danh Sách Học Sinh</h3>
                <button onClick={() => setIsStudentModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      id="new-student-name"
                      type="text" 
                      placeholder="Tên học sinh..." 
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          const group = Number((document.getElementById('new-student-group') as HTMLSelectElement).value);
                          addStudent(input.value, group);
                          input.value = '';
                        }
                      }}
                    />
                    <select 
                      id="new-student-group"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-600 outline-none"
                    >
                      {[1, 2, 3, 4].map(g => <option key={g} value={g}>Tổ {g}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      const nameInput = document.getElementById('new-student-name') as HTMLInputElement;
                      const groupSelect = document.getElementById('new-student-group') as HTMLSelectElement;
                      addStudent(nameInput.value, Number(groupSelect.value));
                      nameInput.value = '';
                    }}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm Học Sinh
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {students.sort((a, b) => a.group - b.group || a.name.localeCompare(b.name, 'vi')).map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{s.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổ {s.group}</p>
                      </div>
                      <button 
                        onClick={() => deleteStudent(s.id)}
                        className="p-2 text-slate-200 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl p-8 relative z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Báo Cáo Tổng Kết</h3>
                <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar max-h-[50vh]">
                {generateReportText()}
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Sao Chép
                </button>
                <button 
                  onClick={exportToExcel}
                  className="py-3.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Xuất Excel
                </button>
                <button 
                  onClick={syncToGoogleSheets}
                  disabled={isSyncing}
                  className={cn(
                    "py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2",
                    isSyncing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                  {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Sheets'}
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
