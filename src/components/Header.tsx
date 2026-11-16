import React from 'react';
import { Student } from '../types/exam';
import { GraduationCap, UserCheck, ShieldCheck, LogOut, LayoutDashboard, FileText } from 'lucide-react';

interface HeaderProps {
  currentUser: Student | null;
  currentView: 'login' | 'exams' | 'exam' | 'result' | 'teacher';
  onNavigate: (view: 'login' | 'exams' | 'teacher') => void;
  onLogout: () => void;
  onSwitchUser: (student: Student) => void;
  allStudents: Student[];
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onSwitchUser,
  allStudents,
  onOpenProfile
}) => {
  const isAdmin = currentUser?.role === 'docente';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={() => currentUser && onNavigate(isAdmin ? 'teacher' : 'exams')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-500 transition-colors">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-300 font-semibold font-mono">
              Instituto Superior Politécnico
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              Sistema de Provas Online <span className="text-xs font-normal text-slate-400">· Gestão Estratégica</span>
            </h1>
          </div>
        </div>

        {/* User state and actions */}
        {currentUser ? (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Navigation toggle - ONLY ADMIN has access to teacher dashboard */}
            {isAdmin && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => onNavigate('exams')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentView === 'exams' || currentView === 'exam' || currentView === 'result'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Visualização Aluno
                </button>

                <button
                  onClick={() => onNavigate('teacher')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentView === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Painel de Gestão (ADM)
                </button>
              </div>
            )}

            {/* Individual Student Profile Pill (Click to open personal profile) */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs transition-all cursor-pointer group shadow-2xs"
              title="Clique para ver o seu perfil pessoal"
            >
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <UserCheck className="w-4 h-4 text-blue-400" />
                )}
                <span className="font-mono font-bold text-slate-400">[{currentUser.studentId}]</span>
                <span className="font-semibold text-slate-200 max-w-[140px] truncate">{currentUser.nome}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Meu Perfil
              </span>
            </button>

            {/* Quick user switcher - RESTRICTED: ONLY VISIBLE TO ADM */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  ADM Simulação:
                </span>
                <select
                  aria-label="Trocar utilizador activo (Apenas ADM)"
                  value={currentUser.studentId}
                  onChange={(e) => {
                    const s = allStudents.find((st) => st.studentId === e.target.value);
                    if (s) onSwitchUser(s);
                  }}
                  className="bg-slate-900 text-slate-200 text-xs border border-slate-700 rounded px-1.5 py-0.5 outline-none focus:border-blue-500"
                >
                  {allStudents.map((st) => (
                    <option key={st.studentId} value={st.studentId}>
                      {st.role === 'docente' ? '👨‍🏫 [ADM]' : '🎓'} {st.nome} ({st.studentId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Terminar sessão"
              className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono">
            Ambiente Seguro de Avaliação
          </div>
        )}
      </div>
    </header>
  );
};
