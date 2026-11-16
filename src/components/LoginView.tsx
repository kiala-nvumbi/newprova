import React, { useState } from 'react';
import { Student } from '../types/exam';
import { setAuthToken } from '../utils/storage';
import { User, Lock, ArrowRight, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (student: Student) => void;
  allStudents?: Student[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const userClean = usuario.trim().toLowerCase();
    const passClean = senha.trim();

    if (!userClean || !passClean) {
      setErro('Por favor, indique o utilizador e a senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: userClean, password: passClean }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        if (data.token) {
          setAuthToken(data.token);
        }
        onLoginSuccess(data.user);
        return;
      }

      if (res.status === 429) {
        setErro(data.error || 'Demasiadas tentativas. Aguarde alguns minutos.');
        return;
      }

      setErro(data.error || 'Credenciais incorrectas. Verifique o utilizador/matrícula e a senha.');
    } catch {
      setErro('Não foi possível ligar ao servidor de autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header banner */}
        <div className="bg-slate-900 px-6 py-6 text-white text-center border-b border-slate-800">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 mb-3 border border-blue-500/30">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            Portal Académico de Avaliação
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">
            Entrar no Sistema
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Introduza os seus dados de acesso (Utilizador ou Matrícula) e senha para iniciar sessão.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Utilizador ou Matrícula
              </label>
              <input
                type="text"
                autoComplete="username"
                disabled={loading}
                value={usuario}
                placeholder="ex.: utilizador ou A001"
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                disabled={loading}
                value={senha}
                placeholder="••••••••"
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A autenticar...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Notice */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Ambiente Seguro e Privado
              </div>
              <p className="leading-relaxed">
                Cada utilizador visualiza unicamente o seu perfil individual e as suas próprias avaliações. O painel global e os registos académicos de outros alunos são de acesso exclusivo da Coordenação / ADM.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Provas com salvamento automático e temporizador de 3 horas.
        </div>
      </div>
    </div>
  );
};
