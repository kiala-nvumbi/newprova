import React, { useState, useEffect } from 'react';
import { ExamDefinition, ExamResult, Student, StudentAccess } from './types/exam';
import {
  getCurrentUser,
  setCurrentUser,
  getStudents,
  saveStudents,
  getResults,
  saveResults,
  getAttempts,
  registerOrUpdateAccess,
  getStudentAccess,
  seedInitialDataIfEmpty,
  getStoredExams,
  updateExamSchedule,
  resetStudentExam,
  syncWithCloudSql,
  clearAllExamData,
  updateStudentAccess,
  batchSetStudentsAccess,
  bulkImportStudents,
  deleteStudentProfile,
  authFetch,
  clearSensitiveLocalSession,
  sanitizeUserForStorage
} from './utils/storage';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { ExamListView } from './components/ExamListView';
import { ExamView } from './components/ExamView';
import { ResultView } from './components/ResultView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ExamScheduleModal } from './components/ExamScheduleModal';
import { MyProfileModal } from './components/MyProfileModal';
import { corrigirItem } from './utils/gradingEngine';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<ExamDefinition[]>([]);
  const [currentView, setCurrentView] = useState<'login' | 'exams' | 'exam' | 'result' | 'teacher'>('login');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [activeAccess, setActiveAccess] = useState<StudentAccess | null>(null);
  const [showScheduleModalFromNav, setShowScheduleModalFromNav] = useState(false);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);

  // Initialize and validate server session on mount
  useEffect(() => {
    let cancelled = false;

    seedInitialDataIfEmpty();
    const loadedExams = getStoredExams();
    setExams(loadedExams);

    const loadedResults = getResults();
    setResults(loadedResults);

    const verifySessionAndSync = async () => {
      try {
        const res = await authFetch('/api/auth/me');
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const safeUser = sanitizeUserForStorage(data.user);
            setCurrentUserState(safeUser);
            setCurrentUser(safeUser);
            setActiveAccess(getStudentAccess(safeUser.studentId));
            setCurrentView(safeUser.role === 'docente' ? 'teacher' : 'exams');

            if (safeUser.role === 'docente') {
              setAllStudents(getStudents());
              const synced = await syncWithCloudSql('docente');
              if (!cancelled && synced) {
                setAllStudents(synced);
              }
            } else {
              setAllStudents([safeUser]);
              await syncWithCloudSql('aluno');
            }
            return;
          }
        }

        // No valid server session: clear any stale local user/student cache
        clearSensitiveLocalSession();
        setCurrentUserState(null);
        setAllStudents([]);
        setCurrentView('login');
        await syncWithCloudSql();
      } catch {
        // Offline / server unreachable fallback: keep current user only if previously stored, never expose other students
        if (cancelled) return;
        const localUser = getCurrentUser();
        if (localUser) {
          setCurrentUserState(localUser);
          setActiveAccess(getStudentAccess(localUser.studentId));
          setAllStudents(localUser.role === 'docente' ? getStudents() : [localUser]);
          setCurrentView(localUser.role === 'docente' ? 'teacher' : 'exams');
        } else {
          setCurrentView('login');
        }
      }
    };

    verifySessionAndSync();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (user: Student) => {
    const safeUser = sanitizeUserForStorage(user);
    setCurrentUserState(safeUser);
    setCurrentUser(safeUser);

    const acc = getStudentAccess(safeUser.studentId);
    setActiveAccess(acc);

    if (safeUser.role === 'docente') {
      setAllStudents(getStudents());
      syncWithCloudSql('docente')
        .then((synced) => {
          if (synced) setAllStudents(synced);
        })
        .catch(() => {});
      setCurrentView('teacher');
    } else {
      // Strict privacy: students only see their own profile in memory
      setAllStudents([safeUser]);
      setCurrentView('exams');
    }
  };

  const handleLogout = () => {
    authFetch('/api/logout', { method: 'POST' }).catch(() => {});
    clearSensitiveLocalSession();
    setCurrentUserState(null);
    setAllStudents([]);
    setSelectedExamId(null);
    setSelectedResult(null);
    setActiveAccess(null);
    setShowMyProfileModal(false);
    setShowScheduleModalFromNav(false);
    setCurrentView('login');
  };

  const handleSwitchUser = (newStudent: Student) => {
    if (currentUser?.role !== 'docente') return;
    const safeTarget = sanitizeUserForStorage(newStudent);
    setCurrentUserState(safeTarget);
    setActiveAccess(getStudentAccess(safeTarget.studentId));
    setCurrentView(safeTarget.role === 'docente' ? 'teacher' : 'exams');
  };

  const handleSelectExam = (examId: string) => {
    if (!currentUser) return;
    const exam = exams.find((e) => e.examId === examId);
    if (!exam) return;

    // Start or get student window
    const acc = registerOrUpdateAccess(currentUser, exam.tempoLimiteMin || 180);
    setActiveAccess(acc);
    setSelectedExamId(examId);
    setCurrentView('exam');
  };

  const handleSubmitExam = (respostas: Record<string, { texto: string; dados: any }>) => {
    if (!currentUser || !selectedExamId) return;
    const exam = exams.find((e) => e.examId === selectedExamId);
    if (!exam) return;

    // Grade each item using the auto-correction engine
    let notaTotal = 0;
    let notaMax = 0;
    const detalhe: any[] = [];

    exam.partes.forEach((parte) => {
      parte.questoes.forEach((questao) => {
        questao.itens.forEach((item) => {
          const resp = respostas[item.id] || { texto: '', dados: {} };
          const pontos = corrigirItem(item, resp.texto, resp.dados);
          notaTotal += pontos;
          notaMax += Number(item.pontos);

          detalhe.push({
            parte: parte.parte,
            questao: questao.numero,
            alinea: item.alinea || '',
            enunciado: item.enunciado,
            pontos,
            max: Number(item.pontos)
          });
        });
      });
    });

    notaTotal = Math.round(notaTotal * 100) / 100;
    const nota20 = notaMax > 0 ? Math.round((notaTotal / notaMax) * 20 * 10) / 10 : 0;
    const isEnsaio = exam.tipo === 'ensaio';

    const newResult: ExamResult = {
      attemptId: `att-${Date.now()}`,
      studentId: currentUser.studentId,
      nome: currentUser.nome,
      examId: exam.examId,
      tituloExame: exam.titulo,
      notaTotal,
      notaMax,
      nota20,
      inicioEm: new Date(Date.now() - (exam.tempoLimiteMin || 180) * 60 * 1000).toISOString(),
      fimEm: new Date().toISOString(),
      estado: isEnsaio ? 'Ensaio' : 'Concluído',
      ensaio: isEnsaio,
      detalhe
    };

    // Update results list
    const updated = [
      newResult,
      ...results.filter(
        (r) => !(r.studentId === currentUser.studentId && r.examId === exam.examId && !isEnsaio)
      )
    ];
    saveResults(updated);
    setResults(updated);

    setSelectedResult(newResult);
    setCurrentView('result');
  };

  const handleViewResult = (res: ExamResult) => {
    if (
      currentUser?.role !== 'docente' &&
      res.studentId !== currentUser?.studentId
    ) {
      return;
    }
    setSelectedResult(res);
    setCurrentView('result');
  };

  // Teacher Schedule configuration handler (ADM only)
  const handleUpdateExamSchedule = (
    examId: string,
    updates: {
      disponivelEm: string;
      horaInicio: string;
      horaFim: string;
      aberturaImediata: boolean;
      tempoLimiteMin: number;
    }
  ) => {
    if (currentUser?.role !== 'docente') return;
    const updatedExams = updateExamSchedule(examId, updates);
    setExams(updatedExams);
  };

  // Teacher Restart student exam handler (ADM only)
  const handleRestartExam = (studentId: string, examId: string) => {
    if (currentUser?.role !== 'docente') return;
    resetStudentExam(studentId, examId);
    const updatedResults = getResults();
    setResults(updatedResults);

    if (currentUser?.studentId === studentId) {
      setActiveAccess(null);
    }
  };

  const handleClearData = (scope: 'attempts' | 'all') => {
    if (currentUser?.role !== 'docente') return;
    clearAllExamData(scope);
    setResults([]);
    if (scope === 'all') {
      setActiveAccess(null);
    }
  };

  const handleUpdateStudentAccess = (studentId: string, updates: Partial<Student>) => {
    if (currentUser?.role !== 'docente') return;
    const updated = updateStudentAccess(studentId, updates);
    setAllStudents(updated);
    if (currentUser?.studentId === studentId) {
      const currentUpdated = updated.find((s) => s.studentId === studentId) || null;
      setCurrentUserState(currentUpdated);
    }
  };

  const handleSaveStudent = (st: Student) => {
    if (currentUser?.role !== 'docente') return;
    const updated = updateStudentAccess(st.studentId, st);
    const exists = updated.some((s) => s.studentId === st.studentId);
    let finalStudents = updated;
    if (!exists) {
      finalStudents = [...updated, sanitizeUserForStorage(st)];
      saveStudents(finalStudents);
    }
    setAllStudents(finalStudents);
    if (currentUser?.studentId === st.studentId) {
      setCurrentUserState(sanitizeUserForStorage(st));
    }
  };

  const handleBulkImportStudents = (newStudents: Student[]) => {
    if (currentUser?.role !== 'docente') return;
    const updated = bulkImportStudents(newStudents);
    setAllStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (currentUser?.role !== 'docente') return;
    const updated = deleteStudentProfile(studentId);
    setAllStudents(updated);
  };

  const handleBatchStudentAccess = (allowAll: boolean) => {
    if (currentUser?.role !== 'docente') return;
    const updated = batchSetStudentsAccess(allowAll);
    setAllStudents(updated);
  };

  const activeExam = exams.find((e) => e.examId === selectedExamId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(v) => {
          if (v === 'teacher' && currentUser?.role !== 'docente') {
            setCurrentView('exams');
          } else {
            setCurrentView(v);
          }
        }}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        allStudents={allStudents}
        onOpenProfile={() => setShowMyProfileModal(true)}
      />

      <main className="flex-1">
        {currentView === 'login' && (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        )}

        {currentView === 'exams' && currentUser && (
          <ExamListView
            currentUser={currentUser}
            exams={exams}
            results={results}
            access={activeAccess}
            onSelectExam={handleSelectExam}
            onViewResult={handleViewResult}
            onOpenScheduleModal={() => {
              if (currentUser.role === 'docente') setShowScheduleModalFromNav(true);
            }}
            onOpenProfile={() => setShowMyProfileModal(true)}
          />
        )}

        {currentView === 'exam' && currentUser && activeExam && activeAccess && (
          <ExamView
            exam={activeExam}
            currentUser={currentUser}
            access={activeAccess}
            onBackToExams={() => setCurrentView('exams')}
            onSubmitExam={handleSubmitExam}
          />
        )}

        {currentView === 'result' && selectedResult && (
          <ResultView
            result={selectedResult}
            onBackToExams={() =>
              setCurrentView(currentUser?.role === 'docente' ? 'teacher' : 'exams')
            }
          />
        )}

        {currentView === 'teacher' && currentUser?.role === 'docente' && (
          <TeacherDashboard
            exams={exams}
            results={results}
            attempts={getAttempts()}
            students={allStudents}
            onUpdateResults={() => setResults(getResults())}
            onAddStudent={handleSaveStudent}
            onSaveStudent={handleSaveStudent}
            onBulkImportStudents={handleBulkImportStudents}
            onDeleteStudent={handleDeleteStudent}
            onUpdateExamSchedule={handleUpdateExamSchedule}
            onRestartExam={handleRestartExam}
            onClearData={handleClearData}
            onUpdateStudentAccess={handleUpdateStudentAccess}
            onBatchStudentAccess={handleBatchStudentAccess}
          />
        )}
      </main>

      {/* Student Personal Profile Modal (Visible only to the individual user) */}
      {showMyProfileModal && currentUser && (
        <MyProfileModal
          isOpen={showMyProfileModal}
          onClose={() => setShowMyProfileModal(false)}
          currentUser={currentUser}
          onSaveProfile={(updated) => {
            const safeUpdated = sanitizeUserForStorage(updated);
            setCurrentUserState(safeUpdated);
            setCurrentUser(safeUpdated);
          }}
        />
      )}

      {/* Schedule Modal accessible only when ADM opens it */}
      {showScheduleModalFromNav && currentUser?.role === 'docente' && (
        <ExamScheduleModal
          isOpen={showScheduleModalFromNav}
          onClose={() => setShowScheduleModalFromNav(false)}
          exams={exams}
          onSaveSchedule={(examId, updates) => {
            handleUpdateExamSchedule(examId, updates);
            setShowScheduleModalFromNav(false);
          }}
        />
      )}
    </div>
  );
}
