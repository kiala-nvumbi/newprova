import React from 'react';
import { ExamDefinition, ExamResult, Student } from '../types/exam';
import { Printer, Download, X, Award, FileSpreadsheet } from 'lucide-react';

interface OfficialGradeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ExamResult[];
  students: Student[];
  selectedExam: ExamDefinition | undefined;
  onExportCSV: () => void;
}

export const OfficialGradeSheetModal: React.FC<OfficialGradeSheetModalProps> = ({
  isOpen,
  onClose,
  results,
  students,
  selectedExam,
  onExportCSV
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Find class and student mappings
  const getStudentTurma = (studentId: string) => {
    const s = students.find((st) => st.studentId === studentId);
    return s?.turma || 'GE-2026';
  };

  // Compute statistics
  const total = results.length;
  const media =
    total > 0
      ? (results.reduce((acc, r) => acc + r.nota20, 0) / total).toFixed(2)
      : '0.00';
  const maior =
    total > 0
      ? Math.max(...results.map((r) => r.nota20)).toFixed(1)
      : '0.0';
  const menor =
    total > 0
      ? Math.min(...results.map((r) => r.nota20)).toFixed(1)
      : '0.0';
  const aprovados = results.filter((r) => r.nota20 >= 9.5).length;
  const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 0;

  const getStatusText = (nota20: number) => {
    if (nota20 >= 16) return 'Aprovado com Distinção';
    if (nota20 >= 14) return 'Aprovado com Bom';
    if (nota20 >= 9.5) return 'Aprovado';
    return 'Não Aprovado';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Action Bar (hidden on print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Relatório & Pauta Oficial da Planilha
              </h3>
              <p className="text-xs text-slate-400">
                Visualização de documento A4 com colunas de Nomes Completos e Valores Obtidos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Descarregar CSV / Excel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Pauta (A4/PDF)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Grade Sheet Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-serif space-y-6 print:p-0 print:space-y-4">
          {/* Institutional Academic Header */}
          <div className="text-center space-y-1 border-b-2 border-slate-900 pb-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-600 font-sans font-bold">
              República de Angola · Ministério do Ensino Superior
            </div>
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-900">
              Instituto Superior Politécnico
            </h1>
            <div className="text-xs uppercase font-sans font-semibold text-slate-700">
              Departamento de Gestão e Economia · Ano Académico 2026/2027
            </div>
            <div className="pt-2">
              <span className="inline-block bg-slate-100 text-slate-900 font-sans font-bold text-xs uppercase tracking-wider px-3 py-1 rounded border border-slate-300">
                Pauta Oficial de Avaliação de Conhecimentos
              </span>
            </div>
            <div className="text-sm font-sans font-bold text-slate-800 pt-1">
              Unidade Curricular: {selectedExam ? selectedExam.titulo : 'Planeamento Estratégico em Gestão'}
            </div>
            <div className="text-xs font-sans text-slate-500">
              Data de Emissão: {new Date().toLocaleDateString('pt-PT')} · Sistema de Provas Online
            </div>
          </div>

          {/* Official Spreadsheet Table with Nome Completo & Valores Obtidos */}
          <div className="border border-slate-400 rounded-lg overflow-hidden shadow-2xs font-sans">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-300">#</th>
                  <th className="py-2.5 px-3 w-20 border-r border-slate-300 font-mono">Nº Aluno</th>
                  <th className="py-2.5 px-4 border-r border-slate-300 text-blue-950 font-extrabold tracking-wide">
                    Nome Completo do Aluno
                  </th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-300 text-center font-bold">
                    Turma
                  </th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-300 text-center font-mono font-black text-slate-900 bg-blue-50/70">
                    Valores Obtidos (0–20)
                  </th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-300 text-center font-mono">
                    Pontos Brutos
                  </th>
                  <th className="py-2.5 px-3 w-36 text-center font-bold">
                    Situação / Menção
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                      Nenhum resultado registado nesta pauta.
                    </td>
                  </tr>
                ) : (
                  results.map((r, i) => {
                    const isAprovado = r.nota20 >= 9.5;
                    const isDist = r.nota20 >= 14;

                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-slate-400">
                          {i + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-blue-800">
                          {r.studentId}
                        </td>
                        {/* Nome Completo column */}
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-900 text-sm">
                          {r.nome}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center text-slate-600 font-medium">
                          {getStudentTurma(r.studentId)}
                        </td>
                        {/* Valores Obtidos column */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-extrabold text-base bg-blue-50/30">
                          <span
                            className={
                              isDist
                                ? 'text-emerald-700 font-black'
                                : isAprovado
                                ? 'text-amber-700 font-black'
                                : 'text-rose-700 font-black'
                            }
                          >
                            {r.nota20.toFixed(1)}{' '}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">
                              val
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-600">
                          {r.notaTotal} / {r.notaMax}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-semibold text-xs px-2 py-0.5 rounded-full inline-block ${
                              isDist
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isAprovado
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {getStatusText(r.nota20)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Academic Statistical Summary Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Total de Alunos
              </span>
              <strong className="text-sm font-mono text-slate-900">{total}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Média da Turma
              </span>
              <strong className="text-sm font-mono text-blue-800">{media} / 20</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Maior Classificação
              </span>
              <strong className="text-sm font-mono text-emerald-700">{maior} / 20</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Menor Classificação
              </span>
              <strong className="text-sm font-mono text-slate-700">{menor} / 20</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Taxa de Aprovação
              </span>
              <strong className="text-sm font-mono text-emerald-700">
                {taxaAprovacao}% ({aprovados}/{total})
              </strong>
            </div>
          </div>

          {/* Formal Signatures Section */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center font-sans text-xs text-slate-700">
            <div className="space-y-14">
              <div className="border-b border-slate-400 w-3/4 mx-auto" />
              <div>
                <strong>O Docente Responsável</strong>
                <p className="text-[11px] text-slate-500">Prof. Doutor António Gonçalves</p>
              </div>
            </div>

            <div className="space-y-14">
              <div className="border-b border-slate-400 w-3/4 mx-auto" />
              <div>
                <strong>A Coordenação do Curso</strong>
                <p className="text-[11px] text-slate-500">Direcção Pedagógica & Registo Académico</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 font-sans">
            Colunas formatadas com nomes completos e valores obtidos na escala 0-20.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
