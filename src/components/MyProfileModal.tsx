import React, { useState } from 'react';
import { Student } from '../types/exam';
import { updateMyPassword } from '../utils/storage';
import {
  User,
  X,
  MapPin,
  Lock,
  KeyRound,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Student;
  onSaveProfile: (updated: Student) => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgErro(null);
    setMsgSucesso(null);

    const passClean = novaSenha.trim();
    if (!passClean) {
      setMsgErro('Por favor, introduza uma nova senha.');
      return;
    }

    if (passClean.length < 3) {
      setMsgErro('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (passClean !== confirmarSenha.trim()) {
      setMsgErro('A confirmação da senha não coincide.');
      return;
    }

    setSaving(true);
    const result = await updateMyPassword(passClean);
    setSaving(false);

    if (!result.success) {
      setMsgErro(result.error || 'Erro ao actualizar senha.');
      return;
    }

    setMsgSucesso('A sua senha foi encriptada e actualizada com sucesso!');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  const isAllowed = currentUser.acessoPermitido !== false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 block font-semibold">
                Área Pessoal Segura
              </span>
              <h3 className="text-base font-bold text-white">
                O Meu Perfil de Aluno
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Top Identity Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold font-mono shadow-xs shrink-0">
              {currentUser.nome.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                  {currentUser.studentId}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Turma: {currentUser.turma}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    isAllowed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isAllowed ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Acesso Autorizado
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Acesso Bloqueado
                    </>
                  )}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                {currentUser.nome}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser.email || 'E-mail não registado'}
              </p>
            </div>
          </div>

          {/* Academic & Origin Details */}
          <div className="space-y-3">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
              Dados Cadastrais e Académicos
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Nome Completo
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {currentUser.nome}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Nº de Matrícula
                </span>
                <span className="font-mono font-bold text-blue-700 text-xs mt-0.5 block">
                  {currentUser.studentId}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  Turma
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {currentUser.turma}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  Província onde Estudou
                </span>
                <span className="font-bold text-indigo-700 text-xs mt-0.5 block">
                  {currentUser.provincia || 'Não informada'}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Utilizador de Acesso (Login)
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                  {currentUser.login || currentUser.studentId.toLowerCase()}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Tempo Extra Atribuído
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {currentUser.tempoExtraMin ? `+${currentUser.tempoExtraMin} minutos` : 'Tempo padrão (sem acréscimo)'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            {currentUser.role === 'docente' ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Credencial de Administrador</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    A palavra-passe da conta de Administrador é gerida de forma segura no servidor através da variável de ambiente <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">ADMIN_PASSWORD</code>.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    Actualizar a Minha Senha de Acesso
                  </h5>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-[11px]"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>

                {msgSucesso && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{msgSucesso}</span>
                  </div>
                )}

                {msgErro && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{msgErro}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nova Senha
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 3 caracteres"
                        value={novaSenha}
                        disabled={saving}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-600 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Repita a nova senha"
                        value={confirmarSenha}
                        disabled={saving}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-600 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {saving ? 'A guardar...' : 'Salvar Nova Senha'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500">
            Apenas você e o Administrador têm acesso a este registo.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
