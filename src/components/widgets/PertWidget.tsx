import React from 'react';
import { ExamItem } from '../../types/exam';
import { construirRedeAOA } from '../../utils/gradingEngine';
import { Plus, Trash2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface PertWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const PertWidget: React.FC<PertWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const atividades: any[] = value?.atividades || [];
  const caminho: string[] = value?.caminho || [];
  const eventos: Record<string, { cedo: string; tarde: string }> = value?.eventos || {};

  // Build the AOA network graph
  const rede = construirRedeAOA(atividades);

  const handleAddActivity = () => {
    const novas = [
      ...atividades,
      { id: '', descricao: '', precedencias: '', duracao: '' }
    ];
    onChange({ ...value, atividades: novas });
  };

  const handleRemoveActivity = (idx: number) => {
    const novas = atividades.filter((_, i) => i !== idx);
    onChange({ ...value, atividades: novas });
  };

  const handleUpdateActivity = (idx: number, field: string, val: string) => {
    const novas = [...atividades];
    novas[idx] = {
      ...novas[idx],
      [field]: field === 'id' || field === 'precedencias' ? val.toUpperCase() : val
    };
    onChange({ ...value, atividades: novas });
  };

  const handleTogglePath = (actId: string) => {
    if (!actId) return;
    const exists = caminho.indexOf(actId) !== -1;
    let novoCaminho: string[];
    if (exists) {
      novoCaminho = caminho.filter((id) => id !== actId);
    } else {
      novoCaminho = [...caminho, actId];
    }
    onChange({ ...value, caminho: novoCaminho });
  };

  const handleUpdateEventDate = (chave: string, field: 'cedo' | 'tarde', val: string) => {
    const novosEventos = { ...eventos };
    novosEventos[chave] = {
      ...novosEventos[chave],
      [field]: val
    };
    onChange({ ...value, eventos: novosEventos });
  };

  // SVG Dimension Calculations
  const R = 30;
  const GAPX = 160;
  const GAPY = 44;
  const MARG = 46;

  const colunas: any[][] = [];
  rede.eventos.forEach((ev) => {
    if (!colunas[ev.nivel]) colunas[ev.nivel] = [];
    colunas[ev.nivel].push(ev);
  });

  let maxLinhas = 1;
  colunas.forEach((col) => {
    if (col && col.length > maxLinhas) maxLinhas = col.length;
  });

  // Calculate curve offsets for parallel arrows or jumping levels
  const pares: Record<string, any[]> = {};
  let alterna = 0;
  rede.arcos.forEach((arc) => {
    const k = `${rede.eventos.indexOf(arc.de)}>${rede.eventos.indexOf(arc.para)}`;
    (pares[k] = pares[k] || []).push(arc);
  });

  Object.keys(pares).forEach((k) => {
    const grupo = pares[k];
    grupo.forEach((arc, i) => {
      const salto = arc.para.nivel - arc.de.nivel;
      const base = (i - (grupo.length - 1) / 2) * 96;
      const contorno = salto > 1 ? salto * 120 * (alterna++ % 2 === 0 ? 1 : -1) : 0;
      arc.desvio = base + contorno;
    });
  });

  let folgaCima = 0;
  let folgaBaixo = 0;
  rede.arcos.forEach((arc) => {
    if (arc.desvio && arc.desvio < 0) folgaCima = Math.max(folgaCima, -arc.desvio / 2 + 28);
    if (arc.desvio && arc.desvio > 0) folgaBaixo = Math.max(folgaBaixo, arc.desvio / 2 + 28);
  });

  const banda = maxLinhas * (R * 2) + (maxLinhas - 1) * GAPY;
  const altura = MARG * 2 + folgaCima + folgaBaixo + banda;
  const largura = MARG * 2 + Math.max(0, colunas.length - 1) * (R * 2 + GAPX) + R * 2;

  colunas.forEach((col, i) => {
    if (!col) return;
    const alturaCol = col.length * (R * 2) + (col.length - 1) * GAPY;
    const y0 = MARG + folgaCima + R + (banda - alturaCol) / 2;
    col.forEach((ev, j) => {
      ev.x = MARG + R + i * (R * 2 + GAPX);
      ev.y = y0 + j * (R * 2 + GAPY);
    });
  });

  // Sort marked path according to the topological sequence of the network
  const marcadasOrdenadas = caminho
    .filter((id) => rede.ordemActividades.indexOf(id) !== -1)
    .sort((a, b) => (rede.nivelAct[a] || 0) - (rede.nivelAct[b] || 0));

  return (
    <div className="space-y-4">
      {c.instrucoes && (
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
          <span>{c.instrucoes}</span>
        </div>
      )}

      {/* --- Table of activities --- */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 w-16">
                  Act.
                </th>
                <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Descrição da Actividade
                </th>
                <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 w-36">
                  Precedências
                </th>
                <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 w-28">
                  Duração (dias)
                </th>
                <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 w-12 text-center">
                  #
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {atividades.map((a, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={a.id || ''}
                      placeholder="Ex: A"
                      onChange={(e) => handleUpdateActivity(idx, 'id', e.target.value)}
                      className="w-full px-2 py-1 font-bold font-mono text-center text-blue-900 rounded border border-slate-300 bg-white text-xs uppercase"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={a.descricao || ''}
                      placeholder="Descrição da tarefa..."
                      onChange={(e) => handleUpdateActivity(idx, 'descricao', e.target.value)}
                      className="w-full px-2.5 py-1 rounded border border-slate-300 bg-white text-xs text-slate-800"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={a.precedencias || ''}
                      placeholder="Ex: A, B"
                      onChange={(e) => handleUpdateActivity(idx, 'precedencias', e.target.value)}
                      className="w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 bg-white text-slate-800 uppercase"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="number"
                      step="any"
                      value={a.duracao ?? ''}
                      placeholder="Dias"
                      onChange={(e) => handleUpdateActivity(idx, 'duracao', e.target.value)}
                      className="w-full px-2 py-1 font-bold text-center font-mono text-xs rounded border border-slate-300 bg-white text-slate-800"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(idx)}
                      title="Remover actividade"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-2.5 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddActivity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Actividade
          </button>
          <span className="text-xs text-slate-500">
            A rede PERT desenha-se automaticamente a partir das precedências indicadas.
          </span>
        </div>
      </div>

      {/* --- Warnings or cycle detection --- */}
      {rede.ciclo && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Ciclo detectado nas precedências:</strong> Uma actividade depende directa ou
            indirectamente de si própria. Corrija o quadro para gerar a rede.
          </span>
        </div>
      )}

      {rede.desconhecidas && rede.desconhecidas.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Precedência(s) indicada(s) inexistente(s) no quadro: {rede.desconhecidas.join(', ')}.
          </span>
        </div>
      )}

      {/* --- Diagram PERT Canvas (SVG + HTML inputs for early/late event dates) --- */}
      <div className="border border-slate-300 rounded-xl bg-slate-50/50 p-2 overflow-x-auto shadow-inner">
        {rede.vazia ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            Introduza as actividades e as respectivas precedências na tabela acima para o diagrama aparecer.
          </div>
        ) : (
          <div className="relative mx-auto" style={{ width: `${largura}px`, height: `${altura}px` }}>
            <svg
              viewBox={`0 0 ${largura} ${altura}`}
              width={largura}
              height={altura}
              className="block"
            >
              <defs>
                <marker
                  id="pert-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>

                <marker
                  id="pert-arrow-crit"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
                </marker>
              </defs>

              {/* Render Arcs */}
              {rede.arcos.map((arc, i) => {
                if (!arc.de.x || !arc.de.y || !arc.para.x || !arc.para.y) return null;
                const dx = arc.para.x - arc.de.x;
                const dy = arc.para.y - arc.de.y;
                const comp = Math.sqrt(dx * dx + dy * dy) || 1;
                const ux = dx / comp;
                const uy = dy / comp;
                const desvio = arc.desvio || 0;

                const ax = ux - uy * (desvio / comp);
                const ay = uy + ux * (desvio / comp);
                const an = Math.sqrt(ax * ax + ay * ay) || 1;
                const nax = ax / an;
                const nay = ay / an;

                const bx = ux + uy * (desvio / comp);
                const by = uy - ux * (desvio / comp);
                const bn = Math.sqrt(bx * bx + by * by) || 1;
                const nbx = bx / bn;
                const nby = by / bn;

                const x1 = arc.de.x + nax * R;
                const y1 = arc.de.y + nay * R;
                const x2 = arc.para.x - nbx * (R + 7);
                const y2 = arc.para.y - nby * (R + 7);

                const cx = (x1 + x2) / 2 - uy * desvio;
                const cy = (y1 + y2) / 2 + ux * desvio;

                const mx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
                const my = 0.25 * y1 + 0.5 * cy + 0.25 * y2;

                const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
                const isCrit = !arc.dummy && arc.id && caminho.indexOf(arc.id) !== -1;

                return (
                  <g key={`arc-${i}`} className="select-none">
                    {/* Visual arrow path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isCrit ? '#b91c1c' : arc.dummy ? '#94a3b8' : '#64748b'}
                      strokeWidth={isCrit ? 3.2 : 1.8}
                      strokeDasharray={arc.dummy ? '6 4' : undefined}
                      markerEnd={isCrit ? 'url(#pert-arrow-crit)' : 'url(#pert-arrow)'}
                    />

                    {/* Interactive clickable hit area for activities */}
                    {!arc.dummy && arc.id && (
                      <g
                        onClick={() => handleTogglePath(arc.id!)}
                        className="cursor-pointer group"
                      >
                        <path
                          d={pathData}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="24"
                        />
                        <title>
                          {arc.id} ({arc.dur} dias) — Clique para alternar caminho crítico
                        </title>

                        {/* Label Activity ID */}
                        <text
                          x={mx}
                          y={my - 7}
                          textAnchor="middle"
                          fontSize="17"
                          fontWeight="bold"
                          fontFamily="Georgia, serif"
                          fill={isCrit ? '#b91c1c' : '#1e3a8a'}
                          className="transition-colors group-hover:fill-blue-600"
                        >
                          {arc.id}
                        </text>

                        {/* Label Duration */}
                        <text
                          x={mx}
                          y={my + 13}
                          textAnchor="middle"
                          fontSize="11"
                          fontStyle="italic"
                          fontFamily="Georgia, serif"
                          fill={isCrit ? '#b91c1c' : '#64748b'}
                        >
                          {isNaN(arc.dur!) ? '?' : `${arc.dur}d`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Render Event Circles */}
              {rede.eventos.map((ev, i) => {
                if (!ev.x || !ev.y) return null;
                return (
                  <g key={`ev-${i}`}>
                    {/* Circle Node */}
                    <circle
                      cx={ev.x}
                      cy={ev.y}
                      r={R}
                      fill="#ffffff"
                      stroke="#1e3a8a"
                      strokeWidth="2"
                      className="shadow-sm drop-shadow-xs"
                    />

                    {/* Middle divider line */}
                    <line
                      x1={ev.x - R}
                      y1={ev.y}
                      x2={ev.x + R}
                      y2={ev.y}
                      stroke="#cbd5e1"
                      strokeWidth="1.2"
                    />

                    {/* Event sequence number over the circle */}
                    <text
                      x={ev.x}
                      y={ev.y - R - 7}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                      fill="#475569"
                    >
                      {ev.numero}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Event date inputs (Early / Late) */}
            {rede.eventos.map((ev, i) => {
              if (!ev.x || !ev.y) return null;
              const evData = eventos[ev.chave] || { cedo: '', tarde: '' };

              return (
                <React.Fragment key={`inputs-${i}`}>
                  {/* Early date input (top half of circle) */}
                  <input
                    type="text"
                    value={evData.cedo || ''}
                    title={`Data mais cedo do evento ${ev.numero}`}
                    placeholder="E"
                    onChange={(e) => handleUpdateEventDate(ev.chave, 'cedo', e.target.value)}
                    style={{
                      left: `${ev.x - 22}px`,
                      top: `${ev.y - 23}px`,
                      width: '44px',
                      height: '21px'
                    }}
                    className="absolute text-center text-xs font-bold font-serif text-blue-900 bg-transparent border-0 outline-none hover:bg-blue-50/60 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded"
                  />

                  {/* Late date input (bottom half of circle) */}
                  <input
                    type="text"
                    value={evData.tarde || ''}
                    title={`Data mais tarde do evento ${ev.numero}`}
                    placeholder="L"
                    onChange={(e) => handleUpdateEventDate(ev.chave, 'tarde', e.target.value)}
                    style={{
                      left: `${ev.x - 22}px`,
                      top: `${ev.y + 2}px`,
                      width: '44px',
                      height: '21px'
                    }}
                    className="absolute text-center text-xs font-bold font-serif text-rose-700 bg-transparent border-0 outline-none hover:bg-rose-50/60 focus:bg-white focus:ring-1 focus:ring-rose-500 rounded"
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Footer Status Bar --- */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
            Clique numa seta para alternar actividade crítica
          </span>

          {marcadasOrdenadas.length > 0 && (
            <span className="font-serif font-bold text-sm text-rose-800">
              Caminho marcado: {marcadasOrdenadas.join(' – ')}
            </span>
          )}
        </div>

        <span className="text-slate-500 italic">
          Círculos: Eventos (topo = data mais cedo; fundo = data mais tarde).
        </span>
      </div>
    </div>
  );
};
