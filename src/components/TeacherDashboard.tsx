import React, { useState } from 'react';
import { Attempt, ExamDefinition, ExamResult, Student } from '../types/exam';
import { calcularCaminhoCritico, mapaAtividades } from '../utils/gradingEngine';
import { OfficialGradeSheetModal } from './OfficialGradeSheetModal';
import { ExamScheduleModal } from './ExamScheduleModal';
import { RestartStudentExamModal } from './RestartStudentExamModal';
import { ClearDataModal } from './ClearDataModal';
import { StudentAccessModal } from './StudentAccessModal';
import { StudentProfileModal } from './StudentProfileModal';
import { ImportStudentsExcelModal } from './ImportStudentsExcelModal';
import {
  Users,
  Award,
  Download,
  Printer,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Plus,
  GitBranch,
  X,
  FileSpreadsheet,
  Calendar,
  Lock,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
  Sliders,
  Filter,
  Pencil,
  MapPin,
  KeyRound,
  Upload,
  UserPlus
} from 'lucide-react';

interface TeacherDashboardProps {
  exams: ExamDefinition[];
  results: ExamResult[];
  attempts: Attempt[];
  students: Student[];
  onUpdateResults: () => void;
  onAddStudent: (student: Student) => void;
  onSaveStudent?: (student: Student) => void;
  onBulkImportStudents?: (students: Student[]) => void;
  onDeleteStudent?: (studentId: string) => void;
  onUpdateExamSchedule: (
    examId: string,
    updates: {
      disponivelEm: string;
      horaInicio: string;
      horaFim: string;
      aberturaImediata: boolean;
      tempoLimiteMin: number;
    }
  ) => void;
  onRestartExam: (studentId: string, examId: string) => void;
  onClearData: (scope: 'attempts' | 'all') => void;
  onUpdateStudentAccess: (studentId: string, updates: Partial<Student>) => void;
  onBatchStudentAccess: (allowAll: boolean) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  exams,
  results,
  students,
  onUpdateResults,
  onAddStudent,
  onSaveStudent,
  onBulkImportStudents,
  onDeleteStudent,
  onUpdateExamSchedule,
  onRestartExam,
  onClearData,
  onUpdateStudentAccess,
  onBatchStudentAccess
}) => {
  const [activeTab, setActiveTab] = useState<'pauta' | 'submissoes' | 'alunos' | 'gabarito'>('pauta');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nota-desc' | 'nota-asc' | 'nome-asc' | 'nome-desc' | 'id-asc'>('nota-desc');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  // Modals state
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartTarget, setRestartTarget] = useState<{ studentId?: string; examId?: string }>({});
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [selectedStudentForAccess, setSelectedStudentForAccess] = useState<Student | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Student Profile & Excel Import Modals state
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentProvinciaFilter, setStudentProvinciaFilter] = useState('all');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Student Access tab filtering states
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentTurmaFilter, setStudentTurmaFilter] = useState('all');
  const [studentAccessFilter, setStudentAccessFilter] = useState<'all' | 'autorizado' | 'bloqueado'>('all');

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Calculate high level metrics
  const totalSubmissions = results.length;
  const officialSubmissions = results.filter((r) => !r.ensaio);
  const averageOfficialGrade =
    officialSubmissions.length > 0
      ? officialSubmissions.reduce((acc, r) => acc + r.nota20, 0) / officialSubmissions.length
      : 0;
  const approvedOfficialCount = officialSubmissions.filter((r) => r.nota20 >= 9.5).length;
  const approvalRate =
    officialSubmissions.length > 0
      ? Math.round((approvedOfficialCount / officialSubmissions.length) * 100)
      : 0;

  // Student turma lookup helper
  const getStudentTurma = (studentId: string) => {
    const s = students.find((st) => st.studentId === studentId);
    return s?.turma || 'GE-2026';
  };

  const getStatusText = (nota20: number) => {
    if (nota20 >= 16) return 'Aprovado com Distinção';
    if (nota20 >= 14) return 'Aprovado com Bom';
    if (nota20 >= 9.5) return 'Aprovado';
    return 'Não Aprovado';
  };

  // Filtered and sorted results
  const filteredResults = results
    .filter((r) => {
      const matchesSearch =
        r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExam = filterExam === 'all' || r.examId === filterExam;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'aprovado' && r.nota20 >= 9.5) ||
        (filterStatus === 'reprovado' && r.nota20 < 9.5);
      return matchesSearch && matchesExam && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nota-desc':
          return b.nota20 - a.nota20;
        case 'nota-asc':
          return a.nota20 - b.nota20;
        case 'nome-asc':
          return a.nome.localeCompare(b.nome, 'pt-PT');
        case 'nome-desc':
          return b.nome.localeCompare(a.nome, 'pt-PT');
        case 'id-asc':
          return a.studentId.localeCompare(b.studentId);
        default:
          return b.nota20 - a.nota20;
      }
    });

  // Handle direct restart trigger
  const handleTriggerRestart = (studentId: string, examId: string) => {
    setRestartTarget({ studentId, examId });
    setShowRestartModal(true);
  };

  const handleExecuteRestart = (studentId: string, examId: string) => {
    onRestartExam(studentId, examId);
    setFeedbackMsg(`Prova ${examId} reiniciada com sucesso para o aluno ${studentId}.`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleExecuteSaveSchedule = (
    examId: string,
    updates: {
      disponivelEm: string;
      horaInicio: string;
      horaFim: string;
      aberturaImediata: boolean;
      tempoLimiteMin: number;
    }
  ) => {
    onUpdateExamSchedule(examId, updates);
    const dataPT = updates.disponivelEm.split('-').reverse().join('/');
    setFeedbackMsg(
      updates.aberturaImediata
        ? `Prova ${examId} aberta para realização imediata.`
        : `Data de abertura da prova ${examId} definida para ${dataPT} às ${updates.horaInicio}.`
    );
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  // Export to CSV / Excel spreadsheet with precise "Nome Completo" and "Valores Obtidos"
  const handleExportCSV = () => {
    if (!results.length) {
      alert('Não existem resultados para exportar.');
      return;
    }

    const targetList = filteredResults.length > 0 ? filteredResults : results;

    const headers = [
      'Nº de Estudante',
      'Nome Completo',
      'Valores Obtidos (0-20)',
      'Pontos Obtidos',
      'Pontos Máximos',
      'Percentagem',
      'Situação / Menção',
      'Turma',
      'Exame / Prova',
      'Data de Conclusão'
    ];

    const rows = targetList.map((r) => {
      const pct = r.notaMax > 0 ? `${Math.round((r.notaTotal / r.notaMax) * 100)}%` : '0%';
      const formattedGrade = r.nota20.toFixed(1).replace('.', ',');
      const formattedPoints = r.notaTotal.toString().replace('.', ',');
      const situacao = getStatusText(r.nota20);
      const turma = getStudentTurma(r.studentId);
      const dataHora = `${new Date(r.fimEm).toLocaleDateString('pt-PT')} ${new Date(r.fimEm).toLocaleTimeString('pt-PT').slice(0, 5)}`;

      return [
        `"${r.studentId}"`,
        `"${r.nome.replace(/"/g, '""')}"`,
        `"${formattedGrade}"`,
        `"${formattedPoints}"`,
        `"${r.notaMax}"`,
        `"${pct}"`,
        `"${situacao}"`,
        `"${turma}"`,
        `"${r.tituloExame.replace(/"/g, '""')}"`,
        `"${dataHora}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const examName = filterExam !== 'all' ? `_${filterExam}` : '';
    link.setAttribute('download', `Pauta_Oficial_Valores_Obtidos${examName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CPM Solver information
  const getOfficialCPMInfo = (exam: ExamDefinition) => {
    const pertItem = exam.partes
      .flatMap((p) => p.questoes)
      .flatMap((q) => q.itens)
      .find((it) => it.widget === 'pert');
    if (!pertItem) return null;
    const ref = (pertItem.correcao || []).find((c) => c.tipo === 'pertRede')?.referencia || pertItem.config?.atividades || [];
    const mapa = mapaAtividades(ref);
    const solucao = calcularCaminhoCritico(mapa);
    return { solucao, atividades: ref };
  };



  const selectedExamDef = exams.find((e) => e.examId === filterExam) || exams[0];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top dashboard banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo Docente & Administração</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-slate-100">
            Painel de Gestão e Pauta Académica
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controlo de datas de abertura, reinício de provas de estudantes e relatório da pauta com nomes e valores.
          </p>
        </div>

        {/* Primary Teacher Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button to set exam opening schedule */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Data de Abertura da Prova
          </button>

          {/* Button to restart student exam */}
          <button
            type="button"
            onClick={() => {
              setRestartTarget({});
              setShowRestartModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar Prova de Aluno
          </button>

          {/* Button to clear data / reset exam session */}
          <button
            type="button"
            onClick={() => setShowClearDataModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Limpar submissões, notas e histórico de tentativas"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Dados
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            Excel (.CSV)
          </button>

          <button
            type="button"
            onClick={() => setShowOfficialModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Pauta A4
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Submissões</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalSubmissions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {officialSubmissions.length} oficiais · {totalSubmissions - officialSubmissions.length} ensaios
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Média Oficial</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {averageOfficialGrade.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 20</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Média dos exames oficiais submetidos
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Aprovação</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {approvalRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {approvedOfficialCount} de {officialSubmissions.length} alunos com nota ≥ 9.5
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Data de Abertura</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 font-mono mt-1">
            {exams.find((e) => e.tipo === 'oficial')?.aberturaImediata ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Aberta Agora
              </span>
            ) : (
              <span>
                {exams.find((e) => e.tipo === 'oficial')?.disponivelEm?.split('-').reverse().join('/') || 'Hoje'} às{' '}
                {exams.find((e) => e.tipo === 'oficial')?.horaInicio || '08:00'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="text-[11px] text-indigo-600 font-bold hover:underline mt-1 block"
          >
            Alterar data / horário →
          </button>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('pauta')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pauta'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Pauta da Planilha (Nomes Completos & Valores Obtidos)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('submissoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'submissoes'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Submissões & Reinício
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alunos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'alunos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Atribuição de Acesso aos Alunos
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'alunos' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {students.filter((s) => s.role !== 'docente').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gabarito')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'gabarito'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Gabarito PERT / CPM
        </button>
      </div>

      {/* TAB 1: Pauta da Planilha (Nomes Completos & Valores Obtidos) */}
      {activeTab === 'pauta' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Relatório da Planilha: Nomes Completos e Valores Obtidos
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualização oficial de notas na escala de 0 a 20 valores com botão directo para reiniciar a prova de qualquer estudante.
              </p>
            </div>

            {/* Filter and sorting controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-44 sm:w-56 focus:border-blue-600 outline-none"
                />
              </div>

              {/* Exam filter */}
              <select
                value={filterExam}
                onChange={(e) => setFilterExam(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-blue-600 outline-none bg-white text-slate-800"
              >
                <option value="all">Todas as Provas</option>
                {exams.map((ex) => (
                  <option key={ex.examId} value={ex.examId}>
                    {ex.tipo === 'ensaio' ? 'Ensaio: ' : 'Oficial: '} {ex.examId}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-blue-600 outline-none bg-white text-slate-800"
              >
                <option value="all">Todos os Estados</option>
                <option value="aprovado">Aprovados (≥ 9.5)</option>
                <option value="reprovado">Não Aprovados (&lt; 9.5)</option>
              </select>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 text-xs font-bold focus:border-blue-600 outline-none"
              >
                <option value="nota-desc">Valores Obtidos: Maior → Menor</option>
                <option value="nota-asc">Valores Obtidos: Menor → Maior</option>
                <option value="nome-asc">Nome Completo: A → Z</option>
                <option value="nome-desc">Nome Completo: Z → A</option>
                <option value="id-asc">Nº de Estudante (ID)</option>
              </select>
            </div>
          </div>

          {/* Clean Spreadsheet Report Table */}
          <div className="overflow-x-auto border-2 border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center text-slate-400">#</th>
                  <th className="py-3 px-3 w-20 font-mono text-slate-700 border-r border-slate-200">
                    Nº Aluno
                  </th>
                  {/* Highlighted Full Name Column */}
                  <th className="py-3 px-4 border-r border-slate-200 bg-blue-50/40 text-blue-950 font-black text-sm">
                    Nome Completo do Aluno
                  </th>
                  <th className="py-3 px-3 w-28 text-center border-r border-slate-200">
                    Turma
                  </th>
                  {/* Highlighted Values Obtained Column */}
                  <th className="py-3 px-4 w-40 text-center border-r border-slate-200 bg-blue-100/60 text-blue-950 font-black text-sm">
                    Valores Obtidos (0–20)
                  </th>
                  <th className="py-3 px-3 w-32 text-center border-r border-slate-200 font-mono text-slate-700">
                    Pontos Brutos
                  </th>
                  <th className="py-3 px-3 w-36 text-center border-r border-slate-200">
                    Situação / Menção
                  </th>
                  <th className="py-3 px-3 text-right w-44">
                    Acções do Docente
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 italic">
                      Nenhum aluno encontrado para os critérios de pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r, idx) => {
                    const isAprovado = r.nota20 >= 9.5;
                    const isDist = r.nota20 >= 14;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-800 border-r border-slate-100">
                          {r.studentId}
                        </td>
                        {/* Prominent Full Name Column */}
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm border-r border-slate-100 bg-blue-50/20">
                          <div className="flex items-center gap-2">
                            <span>{r.nome}</span>
                            {isDist && (
                              <span title="Distinção / Bom">
                                <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-normal font-sans">
                            {r.tituloExame}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium border-r border-slate-100">
                          {getStudentTurma(r.studentId)}
                        </td>
                        {/* Prominent Values Obtained Column */}
                        <td className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/40">
                          <span
                            className={`font-mono font-black text-base px-3 py-1 rounded-lg inline-block border ${
                              isDist
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isAprovado
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {r.nota20.toFixed(1)}{' '}
                            <span className="text-xs font-normal text-slate-600">val</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 border-r border-slate-100">
                          {r.notaTotal} <span className="font-normal text-slate-400">/ {r.notaMax}</span>
                        </td>
                        <td className="py-3 px-3 text-center border-r border-slate-100">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-block ${
                              isDist
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isAprovado
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {getStatusText(r.nota20)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedResult(r)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                              title="Ver correcção detalhada"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Prominent Reset Button */}
                            <button
                              type="button"
                              onClick={() => handleTriggerRestart(r.studentId, r.examId)}
                              title="Reiniciar a prova deste estudante (nova tentativa e reset do tempo)"
                              className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 text-amber-600" />
                              <span>Reiniciar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-xs text-slate-500">
            <span>
              Total exibido: <strong>{filteredResults.length}</strong> de {results.length} resultados.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descarregar esta pauta em Excel (.CSV)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setShowOfficialModal(true)}
                className="font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Ver pauta formal para impressão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Gestão de Submissões e Reabertura */}
      {activeTab === 'submissoes' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Histórico de Tentativas e Reinício de Provas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permite ao docente inspecionar respostas e reiniciar a prova para qualquer aluno ter uma nova tentativa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRestartTarget({});
                setShowRestartModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar Prova de Aluno
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <th className="py-3 px-3 w-16">ID</th>
                  <th className="py-3 px-3">Nome Completo</th>
                  <th className="py-3 px-3">Prova Realizada</th>
                  <th className="py-3 px-3 text-center w-28">Valores (0–20)</th>
                  <th className="py-3 px-3 text-center w-28">Estado</th>
                  <th className="py-3 px-3 text-center w-36">Conclusão</th>
                  <th className="py-3 px-3 text-right w-44">Acção Docente</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{r.studentId}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{r.nome}</td>
                    <td className="py-3 px-3 text-slate-600">{r.tituloExame}</td>
                    <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-900">
                      {r.nota20.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                        {r.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {new Date(r.fimEm).toLocaleDateString('pt-PT')} {new Date(r.fimEm).toLocaleTimeString('pt-PT').slice(0, 5)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedResult(r)}
                          title="Ver respostas"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriggerRestart(r.studentId, r.examId)}
                          className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                          Reiniciar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Gabarito Analítico PERT / CPM */}
      {activeTab === 'gabarito' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <GitBranch className="w-4 h-4 text-blue-600" />
              <span>Gabarito Analítico PERT / CPM das Provas (Caminho Crítico & Folgas)</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Algoritmo autoritativo executado pelo motor de correcção
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => {
              const info = getOfficialCPMInfo(ex);
              if (!info) return null;
              return (
                <div
                  key={ex.examId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">{ex.titulo}</span>
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {ex.examId}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Duração Crítica:{' '}
                    <strong className="text-slate-900 font-mono text-sm">
                      {info.solucao.duracao} dias
                    </strong>
                  </div>
                  <div>
                    Caminho(s) Crítico(s):{' '}
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      {info.solucao.caminhos.map((c) => c.join(' – ')).join(' | ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Actividades na rede: {info.atividades.map((a: any) => a.id).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB: ALUNOS & ATRIBUIÇÃO DE ACESSO --- */}
      {activeTab === 'alunos' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Total de Alunos
              </span>
              <span className="text-xl font-mono font-black text-slate-900 mt-1 block">
                {students.filter((s) => s.role !== 'docente').length}
              </span>
              <span className="text-[10px] text-slate-500">Inscritos no sistema</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Acessos Autorizados
              </span>
              <span className="text-xl font-mono font-black text-emerald-700 mt-1 block">
                {students.filter((s) => s.role !== 'docente' && s.acessoPermitido !== false).length}
              </span>
              <span className="text-[10px] text-emerald-600">Podem realizar provas</span>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                Acessos Bloqueados
              </span>
              <span className="text-xl font-mono font-black text-rose-700 mt-1 block">
                {students.filter((s) => s.role !== 'docente' && s.acessoPermitido === false).length}
              </span>
              <span className="text-[10px] text-rose-600">Entrada impedida</span>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
                Turmas Activas
              </span>
              <span className="text-xl font-mono font-black text-blue-700 mt-1 block">
                {Array.from(new Set(students.filter((s) => s.role !== 'docente').map((s) => s.turma))).length}
              </span>
              <span className="text-[10px] text-blue-600">Grupos de avaliação</span>
            </div>
          </div>

          {/* Controls toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, matrícula..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>

              {/* Filter Turma */}
              <select
                value={studentTurmaFilter}
                onChange={(e) => setStudentTurmaFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todas as Turmas</option>
                {Array.from(new Set(students.filter((s) => s.role !== 'docente').map((s) => s.turma))).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Filter Provincia */}
              <select
                value={studentProvinciaFilter}
                onChange={(e) => setStudentProvinciaFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todas as Províncias</option>
                {Array.from(
                  new Set(
                    students
                      .filter((s) => s.role !== 'docente' && Boolean(s.provincia))
                      .map((s) => (s.provincia || '').trim())
                  )
                )
                  .filter(Boolean)
                  .sort((a, b) => a.localeCompare(b, 'pt-PT'))
                  .map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </select>

              {/* Filter Access Status */}
              <select
                value={studentAccessFilter}
                onChange={(e) => setStudentAccessFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todos os Estados</option>
                <option value="autorizado">Apenas Autorizados</option>
                <option value="bloqueado">Apenas Bloqueados</option>
              </select>
            </div>

            {/* Batch actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowImportExcelModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Carregar ficheiro Excel (.xlsx) com nome, login, senha, turma e província"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Carregar Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setShowStudentProfileModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Perfil
              </button>

              <button
                type="button"
                onClick={() => {
                  onBatchStudentAccess(true);
                  setFeedbackMsg('Acesso concedido com sucesso para todos os alunos!');
                }}
                className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Libertar acesso de todos os alunos"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Libertar Todos
              </button>

              <button
                type="button"
                onClick={() => {
                  onBatchStudentAccess(false);
                  setFeedbackMsg('Acesso bloqueado com sucesso para todos os alunos!');
                }}
                className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Bloquear acesso de todos os alunos"
              >
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                Bloquear Todos
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Matrícula</th>
                    <th className="py-3 px-4">Nome Completo do Aluno</th>
                    <th className="py-3 px-4">Login & Credencial</th>
                    <th className="py-3 px-4">Turma</th>
                    <th className="py-3 px-4">Província</th>
                    <th className="py-3 px-4 text-center">Acesso</th>
                    <th className="py-3 px-4">Provas Permitidas</th>
                    <th className="py-3 px-4 text-center">Tempo Extra</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-right">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students
                    .filter((s) => s.role !== 'docente')
                    .filter((s) => {
                      const matchesSearch =
                        s.nome.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        (s.login && s.login.toLowerCase().includes(studentSearchTerm.toLowerCase()));
                      const matchesTurma =
                        studentTurmaFilter === 'all' || s.turma === studentTurmaFilter;
                      const matchesProvincia =
                        studentProvinciaFilter === 'all' ||
                        (s.provincia || '').trim() === studentProvinciaFilter;
                      const isAllowed = s.acessoPermitido !== false;
                      const matchesAccess =
                        studentAccessFilter === 'all' ||
                        (studentAccessFilter === 'autorizado' && isAllowed) ||
                        (studentAccessFilter === 'bloqueado' && !isAllowed);
                      return matchesSearch && matchesTurma && matchesProvincia && matchesAccess;
                    })
                    .map((st) => {
                      const isAllowed = st.acessoPermitido !== false;
                      const stResult = results.find((r) => r.studentId === st.studentId && !r.ensaio);

                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {st.studentId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{st.nome}</div>
                            <div className="text-[11px] text-slate-500">{st.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <span className="text-slate-400 font-normal">user:</span> {st.login || st.studentId.toLowerCase()}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <KeyRound className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>•••••••• (Encriptada)</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{st.turma}</td>
                          <td className="py-3.5 px-4">
                            {st.provincia ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-200">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                {st.provincia}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Não informada</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateStudentAccess(st.studentId, { acessoPermitido: !isAllowed });
                                setFeedbackMsg(
                                  `Acesso do aluno ${st.nome} (${st.studentId}) alterado para ${
                                    !isAllowed ? 'Autorizado' : 'Bloqueado'
                                  }.`
                                );
                              }}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                isAllowed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Clique para alternar permissão de acesso deste aluno"
                            >
                              {isAllowed ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  Autorizado
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                  Bloqueado
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              {st.provasPermitidas && st.provasPermitidas.length > 0 ? (
                                st.provasPermitidas.map((pid) => (
                                  <span
                                    key={pid}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                                  >
                                    {pid === 'cabinda2027' ? 'Oficial' : pid}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  Todas as Provas
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {st.tempoExtraMin ? (
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                +{st.tempoExtraMin}m
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">Padrão</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {stResult ? (
                              <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {stResult.nota20.toFixed(1)} / 20
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Não iniciada</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudent(st);
                                  setShowStudentProfileModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Editar perfil completo, província, login e senha"
                              >
                                <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForAccess(st);
                                  setShowAccessModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Configurar permissões específicas, provas e tempo extra"
                              >
                                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                                Acesso
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRestartTarget({ studentId: st.studentId, examId: 'cabinda2027' });
                                  setShowRestartModal(true);
                                }}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Reiniciar prova deste aluno"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setStudentToDelete(st)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                title="Remover perfil deste aluno"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- Detail Inspector Modal --- */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 block">
                  Registo de Avaliação
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedResult.nome} ({selectedResult.studentId})
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-mono font-black text-emerald-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                  {selectedResult.nota20.toFixed(1)} / 20
                </span>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Prova:</span>
                  <span className="font-semibold text-slate-800">{selectedResult.tituloExame}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pontuação Bruta:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedResult.notaTotal} / {selectedResult.notaMax} pontos
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Itens e Correcção Detalhada
              </h4>

              <div className="space-y-3">
                {(selectedResult.detalhe || []).map((d, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Parte {d.parte} · {d.questao} {d.alinea}
                      </span>
                      <span className="font-mono font-bold text-blue-700">
                        {d.pontos} / {d.max} val
                      </span>
                    </div>
                    <p className="text-slate-600">{d.enunciado}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const studentId = selectedResult.studentId;
                  const examId = selectedResult.examId;
                  setSelectedResult(null);
                  handleTriggerRestart(studentId, examId);
                }}
                className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs hover:bg-amber-100 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                Reiniciar Esta Prova
              </button>

              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}



      {/* --- Student Profile Modal (Criar ou Editar Perfil) --- */}
      <StudentProfileModal
        isOpen={showStudentProfileModal}
        onClose={() => {
          setShowStudentProfileModal(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        exams={exams}
        onSaveStudent={(st: Student) => {
          if (onSaveStudent) {
            onSaveStudent(st);
          } else {
            onAddStudent(st);
          }
          setFeedbackMsg(
            `Perfil do estudante ${st.nome} (${st.studentId}) ${
              editingStudent ? 'actualizado' : 'criado'
            } com sucesso!`
          );
        }}
      />

      {/* --- Batch Import via Excel (.xlsx / .csv) Modal --- */}
      <ImportStudentsExcelModal
        isOpen={showImportExcelModal}
        onClose={() => setShowImportExcelModal(false)}
        existingStudentsCount={students.length}
        onConfirmImport={(importedStudents: Student[]) => {
          if (onBulkImportStudents) {
            onBulkImportStudents(importedStudents);
          } else {
            importedStudents.forEach((st: Student) => onAddStudent(st));
          }
          setFeedbackMsg(
            `${importedStudents.length} perfis de estudantes importados com sucesso a partir do Excel! Todos possuem login inicial e senha.`
          );
        }}
      />

      {/* --- Delete Student Confirmation Modal --- */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Remover Perfil do Aluno</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem a certeza que deseja remover o perfil de{' '}
                <strong className="text-slate-800">{studentToDelete.nome}</strong> (
                {studentToDelete.studentId})?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(studentToDelete.studentId);
                  }
                  setFeedbackMsg(
                    `Perfil do aluno ${studentToDelete.nome} (${studentToDelete.studentId}) removido.`
                  );
                  setStudentToDelete(null);
                }}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Grade Sheet Modal (Pauta Oficial com Nomes Completos & Valores Obtidos) */}
      <OfficialGradeSheetModal
        isOpen={showOfficialModal}
        onClose={() => setShowOfficialModal(false)}
        results={filteredResults}
        students={students}
        selectedExam={selectedExamDef}
        onExportCSV={handleExportCSV}
      />

      {/* Exam Opening Schedule Configuration Modal */}
      <ExamScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        exams={exams}
        onSaveSchedule={handleExecuteSaveSchedule}
      />

      {/* Restart Student Exam Modal */}
      <RestartStudentExamModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        students={students}
        exams={exams}
        results={results}
        preSelectedStudentId={restartTarget.studentId}
        preSelectedExamId={restartTarget.examId}
        onConfirmRestart={handleExecuteRestart}
      />

      {/* Clear Data Modal */}
      <ClearDataModal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        onConfirmClear={(scope) => {
          onClearData(scope);
          setFeedbackMsg(
            scope === 'all'
              ? 'Todos os registos, submissões, cronómetros e tentativas foram limpos com sucesso.'
              : 'Submissões e notas foram limpas com sucesso. A plataforma está pronta para o exame.'
          );
        }}
        totalSubmissions={totalSubmissions}
      />

      {/* Student Access Permission Modal */}
      <StudentAccessModal
        isOpen={showAccessModal}
        onClose={() => {
          setShowAccessModal(false);
          setSelectedStudentForAccess(null);
        }}
        student={selectedStudentForAccess}
        exams={exams}
        onSaveAccess={(studentId, updates) => {
          onUpdateStudentAccess(studentId, updates);
          setFeedbackMsg(`Permissões de acesso actualizadas com sucesso para o aluno ${studentId}.`);
        }}
      />
    </div>
  );
};
