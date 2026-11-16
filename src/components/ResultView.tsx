import React from 'react';
import { ExamResult } from '../types/exam';
import { Award, ArrowLeft, Printer, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface ResultViewProps {
  result: ExamResult;
  onBackToExams: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, onBackToExams }) => {
  const nota20 = result.nota20;
  const isAprovado = nota20 >= 9.5;
  const isDistincao = nota20 >= 14.0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Top back button */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          type="button"
          onClick={onBackToExams}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar às Provas
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar em PDF
        </button>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center space-y-6 relative overflow-hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
            {result.ensaio ? 'Resultado do Ensaio Prático' : 'Folha de Classificação Oficial'}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {result.tituloExame}
          </h2>
          <p className="text-xs text-slate-500">
            Aluno: <strong>{result.nome}</strong> ({result.studentId})
          </p>
        </div>

        {/* Big Grade Badge */}
        <div className="py-2">
          <div
            className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${
              isDistincao
                ? 'text-emerald-600'
                : isAprovado
                ? 'text-amber-600'
                : 'text-rose-600'
            }`}
          >
            {nota20.toFixed(1)} <span className="text-3xl text-slate-400 font-normal">/ 20</span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-bold ${
                isDistincao
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isAprovado
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {isDistincao ? (
                <>
                  <Award className="w-3.5 h-3.5" /> Aprovado com Mérito / Bom
                </>
              ) : isAprovado ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Não Aprovado
                </>
              )}
            </span>
          </div>
        </div>

        {/* Summary info boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Pontuação Bruta</div>
            <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
              {result.notaTotal} / {result.notaMax} pts
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Taxa de Acerto</div>
            <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
              {result.notaMax > 0 ? `${Math.round((result.notaTotal / result.notaMax) * 100)}%` : '0%'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Estado</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {result.estado}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Submetido em</div>
            <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
              {new Date(result.fimEm).toLocaleTimeString('pt-PT').slice(0, 5)}
            </div>
          </div>
        </div>
      </div>

      {/* Item-by-item breakdown table */}
      {result.detalhe && result.detalhe.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Discriminação da Pontuação por Pergunta
            </h3>
            <span className="text-xs text-slate-400">
              {result.detalhe.length} itens avaliados
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                  <th className="py-2.5 px-3 w-16">Parte</th>
                  <th className="py-2.5 px-3 w-28">Questão</th>
                  <th className="py-2.5 px-3">Enunciado / Tema</th>
                  <th className="py-2.5 px-3 text-right w-28">Pontuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.detalhe.map((d, idx) => {
                  const percent = d.max > 0 ? d.pontos / d.max : 0;
                  const isFull = percent >= 0.99;
                  const isZero = d.pontos === 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-700">
                        Parte {d.parte}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {d.questao} {d.alinea}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-700 leading-snug">
                        {d.enunciado}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md inline-block ${
                            isFull
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isZero
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {d.pontos} / {d.max} val
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 italic pt-2">
            * A correcção e verificação de critérios é efectuada com tolerâncias estatísticas e análise conceitual.
          </p>
        </div>
      )}
    </div>
  );
};
