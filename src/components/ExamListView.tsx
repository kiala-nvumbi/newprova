import React from 'react';
import { ExamDefinition, ExamResult, Student, StudentAccess } from '../types/exam';
import { verificarDisponibilidadeExame } from '../utils/storage';
import { BookOpen, Clock, CheckCircle2, Play, Sparkles, Award, User, RefreshCw, Calendar, Lock, ShieldAlert, ShieldCheck, MapPin } from 'lucide-react';

interface ExamListViewProps {
  currentUser: Student;
  exams: ExamDefinition[];
  results: ExamResult[];
  access: StudentAccess | null;
  onSelectExam: (examId: string) => void;
  onViewResult: (result: ExamResult) => void;
  onOpenScheduleModal?: () => void;
  onOpenProfile?: () => void;
}

export const ExamListView: React.FC<ExamListViewProps> = ({
  currentUser,
  exams,
  results,
  access,
  onSelectExam,
  onViewResult,
  onOpenScheduleModal,
  onOpenProfile
}) => {
  // Check if the 3-hour window is active
  const now = Date.now();
  const expiraTimestamp = access ? new Date(access.expiraEm).getTime() : null;
  const restantesSegundos = expiraTimestamp ? Math.floor((expiraTimestamp - now) / 1000) : null;
  const expirado = restantesSegundos !== null && restantesSegundos <= 0;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m < 10 ? '0' : ''}${m}m`;
    return `${m} minutos`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Student Welcome Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shadow-xs shrink-0">
            {currentUser.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentUser.studentId}
              </span>
              <span className="text-xs text-slate-500 font-medium">Turma: {currentUser.turma}</span>
              {currentUser.provincia && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  {currentUser.provincia}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Olá, {currentUser.nome}!
            </h2>
            <p className="text-xs text-slate-500">
              {currentUser.email || `${currentUser.studentId.toLowerCase()}@isp.ao`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              O Meu Perfil
            </button>
          )}

          {currentUser.role === 'docente' && (
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-800">
                Modo Docente
              </div>
              {onOpenScheduleModal && (
                <button
                  type="button"
                  onClick={onOpenScheduleModal}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Definir Abertura
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Access Permission Blocked Warning */}
      {currentUser.role === 'aluno' && currentUser.acessoPermitido === false && (
        <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-2xl flex items-start gap-3.5 text-rose-900 shadow-sm animate-in fade-in">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
              Acesso à Avaliação Bloqueado pelo Docente
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              O docente responsável ainda não libertou o acesso à avaliação para o seu registo ({currentUser.studentId} - {currentUser.nome}). Por favor, aguarde que o professor active o seu acesso no painel de gestão.
            </p>
            {currentUser.observacao && (
              <p className="text-xs font-semibold text-rose-900 bg-rose-100/70 p-2 rounded-lg mt-1 inline-block">
                Nota do Professor: {currentUser.observacao}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timer / Window Notice Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="text-sm space-y-1">
          <div className="font-bold text-slate-100 flex items-center gap-2">
            Regras de Realização e Janela de Acesso
          </div>
          {!access ? (
            <p className="text-slate-300 text-xs leading-relaxed">
              O seu tempo de prova oficial (<strong>3 horas</strong>) só começa a contar a partir do momento em que iniciar a prova oficial no dia de abertura estipulado pelo docente. Até lá, pode treinar livremente no <strong>Ambiente de Ensaio</strong> sem gastar a sua janela de acesso.
            </p>
          ) : !expirado ? (
            <p className="text-amber-200 text-xs leading-relaxed">
              O cronómetro do seu acesso oficial está a decorrer: restam cerca de <strong>{formatDuration(restantesSegundos!)}</strong>. O tempo conta continuamente desde o primeiro acesso e não pára.
            </p>
          ) : (
            <p className="text-rose-300 text-xs leading-relaxed">
              O período de 3 horas do seu acesso à prova oficial terminou. Caso necessite de reinício por razões justificadas, solicite ao docente a reabertura no painel.
            </p>
          )}
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 px-1">
          Provas Disponíveis
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {exams.map((exam) => {
            const isEnsaio = exam.tipo === 'ensaio';
            const userResult = results.find(
              (r) => r.studentId === currentUser.studentId && r.examId === exam.examId
            );

            // Check availability according to teacher's configured date and hour
            const disp = verificarDisponibilidadeExame(exam);
            const isTeacher = currentUser.role === 'docente';
            const isAccessBlocked = currentUser.role === 'aluno' && currentUser.acessoPermitido === false;
            const isExamForbidden =
              currentUser.role === 'aluno' &&
              currentUser.provasPermitidas &&
              currentUser.provasPermitidas.length > 0 &&
              !currentUser.provasPermitidas.includes(exam.examId);
            const canStart = (disp.estado === 'disponivel' || isTeacher) && !userResult && !expirado && !isAccessBlocked && !isExamForbidden;

            return (
              <div
                key={exam.examId}
                className={`p-6 rounded-2xl border transition-all bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isEnsaio
                    ? 'border-dashed border-emerald-300 hover:border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isEnsaio
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {isEnsaio ? 'Treino Livre (Ensaio)' : 'Prova Oficial'}
                    </span>

                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.tempoLimiteMin} minutos
                    </span>

                    {/* Availability badge */}
                    {disp.estado === 'agendada' && !isEnsaio && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        {disp.mensagem}
                      </span>
                    )}

                    {disp.estado === 'encerrada' && !isEnsaio && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {disp.mensagem}
                      </span>
                    )}

                    {userResult && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluída: {userResult.nota20} / 20
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 leading-snug">
                    {exam.titulo}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {exam.descricao}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>Partes: {exam.partes.length}</span>
                    <span>·</span>
                    <span>
                      Questões: {exam.partes.reduce((acc, p) => acc + p.questoes.length, 0)}
                    </span>
                    <span>·</span>
                    <span>
                      Total:{' '}
                      {exam.partes.reduce(
                        (acc, p) =>
                          acc +
                          p.questoes.reduce(
                            (accQ, q) => accQ + q.itens.reduce((accI, it) => accI + it.pontos, 0),
                            0
                          ),
                        0
                      )}{' '}
                      valores
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {userResult && (
                    <button
                      type="button"
                      onClick={() => onViewResult(userResult)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-amber-500" />
                      Ver Correcção
                    </button>
                  )}

                  {isEnsaio ? (
                    <button
                      type="button"
                      onClick={() => onSelectExam(exam.examId)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      {userResult ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Repetir Ensaio
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Iniciar Ensaio
                        </>
                      )}
                    </button>
                  ) : userResult ? (
                    <span className="text-xs font-semibold text-slate-500 italic">
                      Submissão única concluída
                    </span>
                  ) : isAccessBlocked ? (
                    <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Acesso Não Atribuído</span>
                    </div>
                  ) : isExamForbidden ? (
                    <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-500 text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Prova Não Atribuída</span>
                    </div>
                  ) : disp.estado === 'agendada' && !isTeacher ? (
                    <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-500 text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{disp.mensagem}</span>
                    </div>
                  ) : disp.estado === 'encerrada' && !isTeacher ? (
                    <span className="text-xs font-semibold text-rose-600">
                      Período de exame encerrado
                    </span>
                  ) : expirado ? (
                    <span className="text-xs font-semibold text-rose-600">
                      Janela de 3h terminada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectExam(exam.examId)}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Iniciar Prova
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
