import React, { useState, useEffect } from 'react';
import { Student, ExamDefinition } from '../types/exam';
import {
  User,
  X,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  GraduationCap,
  Mail,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; // null = new student, object = editing existing
  exams: ExamDefinition[];
  onSaveStudent: (student: Student) => void;
}

export const PROVINCIAS_ANGOLA = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire'
];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  exams,
  onSaveStudent
}) => {
  const isEditing = !!student;

  const [studentId, setStudentId] = useState('');
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('123456');
  const [turma, setTurma] = useState('GE-2026-M1');
  const [provincia, setProvincia] = useState('Cabinda');
  const [email, setEmail] = useState('');
  const [acessoPermitido, setAcessoPermitido] = useState(true);
  const [provasPermitidas, setProvasPermitidas] = useState<string[]>([]);
  const [tempoExtraMin, setTempoExtraMin] = useState(0);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (student) {
      setStudentId(student.studentId);
      setNome(student.nome);
      setLogin(student.login);
      setSenha('');
      setTurma(student.turma || 'GE-2026-M1');
      setProvincia(student.provincia || 'Cabinda');
      setEmail(student.email || '');
      setAcessoPermitido(student.acessoPermitido !== false);
      setProvasPermitidas(student.provasPermitidas || exams.map((e) => e.examId));
      setTempoExtraMin(student.tempoExtraMin || 0);
      setObservacao(student.observacao || '');
    } else {
      // New student defaults
      const autoId = `A${Math.floor(1000 + Math.random() * 9000)}`;
      setStudentId(autoId);
      setNome('');
      setLogin('');
      setSenha('123456');
      setTurma('GE-2026-M1');
      setProvincia('Cabinda');
      setEmail('');
      setAcessoPermitido(true);
      setProvasPermitidas(exams.map((e) => e.examId));
      setTempoExtraMin(0);
      setObservacao('');
    }
  }, [student, exams, isOpen]);

  // Auto-generate username and email if typing name on new student
  const handleNameChange = (val: string) => {
    setNome(val);
    if (!isEditing && val.trim().length > 0) {
      const parts = val.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
      const generatedLogin = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
      if (!login || login.startsWith('aluno')) {
        setLogin(generatedLogin);
      }
      if (!email || email.includes('@isp.ao')) {
        setEmail(`${generatedLogin}@isp.ao`);
      }
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(res);
  };

  const handleToggleExam = (examId: string) => {
    if (provasPermitidas.includes(examId)) {
      setProvasPermitidas(provasPermitidas.filter((id) => id !== examId));
    } else {
      setProvasPermitidas([...provasPermitidas, examId]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !studentId.trim() || !login.trim()) {
      alert('Por favor, preencha o Nome, a Matrícula e o Usuário do aluno.');
      return;
    }

    const payload: Student = {
      studentId: studentId.trim(),
      nome: nome.trim(),
      login: login.trim().toLowerCase(),
      senha: isEditing ? senha.trim() : (senha.trim() || '123456'),
      turma: turma.trim() || 'GE-2026',
      provincia: provincia.trim() || 'Cabinda',
      email: email.trim() || `${login.trim().toLowerCase()}@isp.ao`,
      role: 'aluno',
      acessoPermitido,
      provasPermitidas,
      tempoExtraMin,
      observacao: observacao.trim()
    };

    onSaveStudent(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isEditing ? 'Editar Perfil do Aluno' : 'Criar Novo Perfil de Aluno'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing
                  ? `Actualização dos dados cadastrais e de acesso de ${student?.nome}`
                  : 'Registo individual com credenciais de login inicial e província'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nome Completo do Aluno *
              </label>
              <input
                type="text"
                required
                value={nome}
                placeholder="ex.: Manuel Domingos Antunes"
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            {/* Matrícula / ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Número de Matrícula (ID) *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={studentId}
                placeholder="ex.: A001"
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold outline-none ${
                  isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-blue-600'
                }`}
              />
            </div>

            {/* Turma */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Turma / Ano Curricular *
              </label>
              <input
                type="text"
                required
                value={turma}
                placeholder="ex.: GE-2026-M1"
                onChange={(e) => setTurma(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-blue-600 outline-none"
              />
            </div>

            {/* Província onde Estudou */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Província Onde Estudou *
              </label>
              <select
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:border-blue-600 outline-none"
              >
                {PROVINCIAS_ANGOLA.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Institucional */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email Institucional
              </label>
              <input
                type="email"
                value={email}
                placeholder="ex.: aluno@isp.ao"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Login Inicial & Senha */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Credenciais de Login Inicial
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Usuário (Login) *
                </label>
                <input
                  type="text"
                  required
                  value={login}
                  placeholder="ex.: aluno1"
                  onChange={(e) => setLogin(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Senha Inicial {isEditing ? '(deixe vazio para manter)' : '*'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    Gerar
                  </button>
                </div>
                <input
                  type="text"
                  required={!isEditing}
                  value={senha}
                  placeholder={isEditing ? 'Deixe vazio para manter a actual' : 'ex.: 123456'}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold focus:border-blue-600 outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              {isEditing
                ? 'As senhas são armazenadas de forma encriptada. Preencha apenas se desejar redefinir a senha do estudante.'
                : 'O estudante utilizará este utilizador e senha inicial para aceder às avaliações.'}
            </p>
          </div>

          {/* Permissão de Acesso e Provas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Autorização de Acesso</span>
                <span className="text-[11px] text-slate-500">
                  {acessoPermitido
                    ? 'Aluno autorizado a aceder às provas permitidas.'
                    : 'Acesso bloqueado. O aluno não poderá entrar na avaliação.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAcessoPermitido(!acessoPermitido)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  acessoPermitido
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                {acessoPermitido ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Autorizado
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Bloqueado
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Provas Atribuídas a Este Aluno:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exams.map((ex) => {
                  const isChecked = provasPermitidas.includes(ex.examId);
                  return (
                    <label
                      key={ex.examId}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleExam(ex.examId)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{ex.titulo}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Tempo Adicional (Minutos Extras)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  step="5"
                  value={tempoExtraMin}
                  onChange={(e) => setTempoExtraMin(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Observações Administrativas
                </label>
                <input
                  type="text"
                  value={observacao}
                  placeholder="ex.: Regime especial / Transferência"
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Gravar Alterações' : 'Criar Perfil do Aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
