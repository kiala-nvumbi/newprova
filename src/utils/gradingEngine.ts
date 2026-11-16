/**
 * Automatic Grading Engine & PERT / CPM Analytical Solvers
 * Direct port and enhancement of Code_b16d5299.gs
 */

import { CorrectionRule, ExamItem } from '../types/exam';

export function normalize(str: any): string {
  return (str === null || str === undefined ? '' : str.toString())
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?()"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function limpar(s: any): string {
  return s === null || s === undefined ? '' : String(s).trim();
}

export function parseNum(v: any): number {
  if (v === null || v === undefined || v === '') return NaN;
  return parseFloat(v.toString().replace(/\s/g, '').replace(',', '.'));
}

export function lerPrecedencias(txt: any): string[] {
  const bruto = (txt === null || txt === undefined ? '' : txt.toString()).toUpperCase().trim();
  if (!bruto || bruto === '—' || bruto === '-') return [];
  const res: string[] = [];
  bruto.split(/[,;/+&]+/).forEach((pedaco: string) => {
    const toks = pedaco.replace(/[–-]/g, ' ').split(/\s+/).filter(Boolean);
    toks.forEach((t: string, i: number) => {
      // "C e D": o E do meio é conjunção, não actividade.
      // "D e E" ou "E e F": o E das pontas é mesmo a actividade E.
      if (t === 'E' && toks.length >= 3 && i > 0 && i < toks.length - 1) return;
      if (!/^[A-Z0-9]{1,4}$/.test(t)) return;
      if (res.indexOf(t) === -1) res.push(t);
    });
  });
  return res;
}

export interface ActivityMapItem {
  id: string;
  dur: number;
  desc?: string;
  preds: string[];
}

export function mapaAtividades(lista: any[]): Record<string, ActivityMapItem> {
  const mapa: Record<string, ActivityMapItem> = {};
  lista.forEach((a) => {
    const id = (a.id || '').toString().trim().toUpperCase();
    if (!id) return;
    mapa[id] = {
      id,
      dur: parseNum(a.duracao) || 0,
      desc: limpar(a.descricao),
      preds: lerPrecedencias(a.precedencias).sort()
    };
  });
  Object.keys(mapa).forEach((id) => {
    mapa[id].preds = mapa[id].preds.filter((p) => mapa[p] && p !== id);
  });
  return mapa;
}

export interface CPMResult {
  duracao: number;
  caminhos: string[][];
  es: Record<string, number>;
  ef: Record<string, number>;
  ls: Record<string, number>;
  lf: Record<string, number>;
  folgas: Record<string, number>;
}

/**
 * CPM / Critical Path Method solver
 */
export function calcularCaminhoCritico(mapa: Record<string, ActivityMapItem>): CPMResult {
  const ids = Object.keys(mapa);
  const ef: Record<string, number> = {};
  const es: Record<string, number> = {};
  let guarda = 0;
  let pendente = ids.slice();

  while (pendente.length && guarda++ < 500) {
    pendente = pendente.filter((id) => {
      const preds = mapa[id].preds;
      if (preds.some((p) => ef[p] === undefined)) return true;
      es[id] = preds.length ? Math.max(...preds.map((p) => ef[p])) : 0;
      ef[id] = es[id] + mapa[id].dur;
      return false;
    });
  }

  if (pendente.length) {
    return { duracao: 0, caminhos: [], es: {}, ef: {}, ls: {}, lf: {}, folgas: {} };
  }

  const duracao = ids.length ? Math.max(...ids.map((id) => ef[id])) : 0;

  // Backward pass
  const lf: Record<string, number> = {};
  const ls: Record<string, number> = {};
  const folgas: Record<string, number> = {};

  ids.forEach((id) => {
    lf[id] = duracao;
  });

  const sucessores: Record<string, string[]> = {};
  ids.forEach((id) => {
    sucessores[id] = [];
  });
  ids.forEach((id) => {
    mapa[id].preds.forEach((p) => {
      if (sucessores[p]) sucessores[p].push(id);
    });
  });

  let pendenteVolta = ids.slice();
  guarda = 0;
  while (pendenteVolta.length && guarda++ < 500) {
    pendenteVolta = pendenteVolta.filter((id) => {
      const sucs = sucessores[id];
      if (sucs.some((s) => ls[s] === undefined)) return true;
      lf[id] = sucs.length ? Math.min(...sucs.map((s) => ls[s])) : duracao;
      ls[id] = lf[id] - mapa[id].dur;
      folgas[id] = ls[id] - es[id];
      return false;
    });
  }

  // Find critical paths
  const caminhos: string[][] = [];
  function subir(id: string, acumulado: string[]) {
    const preds = mapa[id].preds.filter((p) => Math.abs(ef[p] - es[id]) < 0.001);
    if (!preds.length) {
      caminhos.push([id, ...acumulado]);
      return;
    }
    preds.forEach((p) => subir(p, [id, ...acumulado]));
  }

  ids.filter((id) => Math.abs(ef[id] - duracao) < 0.001).forEach((id) => subir(id, []));

  return { duracao, caminhos, es, ef, ls, lf, folgas };
}

/**
 * Constructs an Activity-on-Arrow (AOA) Event Network
 */
export interface PERTEvent {
  chave: string;
  nivel: number;
  numero?: number;
  x?: number;
  y?: number;
}

export interface PERTArc {
  de: PERTEvent;
  para: PERTEvent;
  id?: string;
  dur?: number;
  desc?: string;
  dummy?: boolean;
  desvio?: number;
}

export interface PERTNetwork {
  vazia?: boolean;
  ciclo?: boolean;
  desconhecidas?: string[];
  eventos: PERTEvent[];
  arcos: PERTArc[];
  ordemActividades: string[];
  nivelAct: Record<string, number>;
}

export function construirRedeAOA(lista: any[]): PERTNetwork {
  const mapa: Record<string, { id: string; desc: string; dur: number; preds: string[] }> = {};
  const ordem: string[] = [];
  const desconhecidas: string[] = [];

  lista.forEach((a) => {
    const id = limpar(a.id).toUpperCase();
    if (!id || mapa[id]) return;
    mapa[id] = { id, desc: limpar(a.descricao), dur: parseNum(a.duracao), preds: [] };
    ordem.push(id);
  });

  if (!ordem.length) return { vazia: true, eventos: [], arcos: [], ordemActividades: [], nivelAct: {} };

  lista.forEach((a) => {
    const id = limpar(a.id).toUpperCase();
    if (!id || !mapa[id]) return;
    lerPrecedencias(a.precedencias).forEach((p) => {
      if (mapa[p] && p !== id) {
        if (mapa[id].preds.indexOf(p) === -1) mapa[id].preds.push(p);
      } else if (!mapa[p] && desconhecidas.indexOf(p) === -1) {
        desconhecidas.push(p);
      }
    });
  });

  // Cycle check
  const nivelAct: Record<string, number> = {};
  let mudou = true;
  let guarda = 0;
  ordem.forEach((id) => {
    nivelAct[id] = 0;
  });

  while (mudou && guarda++ < 300) {
    mudou = false;
    ordem.forEach((id) => {
      mapa[id].preds.forEach((p) => {
        if (nivelAct[p] + 1 > nivelAct[id]) {
          nivelAct[id] = nivelAct[p] + 1;
          mudou = true;
        }
      });
    });
  }

  if (guarda >= 300) {
    return { ciclo: true, desconhecidas, eventos: [], arcos: [], ordemActividades: ordem, nivelAct };
  }

  function chave(arr: string[]): string {
    return arr.slice().sort().join(',');
  }

  const eventos: PERTEvent[] = [];
  const porChave: Record<string, PERTEvent> = {};

  function novoEvento(k: string): PERTEvent {
    const ev: PERTEvent = { chave: k, nivel: 0 };
    eventos.push(ev);
    return ev;
  }

  porChave[''] = novoEvento('');
  ordem.forEach((id) => {
    const k = chave(mapa[id].preds);
    if (!porChave[k]) porChave[k] = novoEvento(k);
  });

  const contem: Record<string, string[]> = {};
  ordem.forEach((id) => {
    contem[id] = [];
  });
  Object.keys(porChave).forEach((k) => {
    if (!k) return;
    k.split(',').forEach((p) => {
      if (contem[p]) contem[p].push(k);
    });
  });

  const fim = novoEvento('FIM');
  const arcos: PERTArc[] = [];

  ordem.forEach((id) => {
    const de = porChave[chave(mapa[id].preds)];
    const destinos = contem[id];
    let para: PERTEvent;
    if (!destinos.length) {
      para = fim;
    } else if (destinos.length === 1) {
      para = porChave[destinos[0]];
    } else {
      para = novoEvento('~' + id);
      destinos.forEach((k) => {
        arcos.push({ de: para, para: porChave[k], dummy: true });
      });
    }
    arcos.push({ de, para, id, dur: mapa[id].dur, desc: mapa[id].desc });
  });

  // Calculate event levels
  let passos = 0;
  do {
    mudou = false;
    arcos.forEach((arc) => {
      if (arc.de.nivel + 1 > arc.para.nivel) {
        arc.para.nivel = arc.de.nivel + 1;
        mudou = true;
      }
    });
  } while (mudou && passos++ < 300);

  eventos.sort((a, b) => a.nivel - b.nivel);
  eventos.forEach((ev, i) => {
    ev.numero = i + 1;
  });

  return { eventos, arcos, desconhecidas, ordemActividades: ordem, nivelAct };
}

/**
 * String keyword matching with weighted point distribution
 */
export function pontosPorPalavrasChave(termosStr: string | undefined, resposta: string): number {
  if (!termosStr) return 0;
  const respNorm = normalize(resposta);
  let total = 0;
  termosStr.split(';').forEach((par) => {
    const partes = par.split(':');
    if (partes.length < 2) return;
    const termo = partes[0].trim();
    const pontos = parseFloat(partes[1]);
    if (!termo || isNaN(pontos)) return;
    if (normalize(termo).split('|').some((v) => v && respNorm.indexOf(v) !== -1)) {
      total += pontos;
    }
  });
  return total;
}

/**
 * Apply individual correction rule to item
 */
export function aplicarRegra(regra: CorrectionRule, item: ExamItem, texto: string, dados: any): number {
  switch (regra.tipo) {
    case 'numero': {
      const dado = parseNum(dados?.[regra.campo || 'valor']);
      const esperado = Number(regra.valor);
      if (isNaN(dado)) return 0;
      const tol = Math.max(Math.abs(esperado) * (regra.tolerancia || 0.02), 0.001);
      return Math.abs(dado - esperado) <= tol ? Number(regra.pontos) : 0;
    }

    case 'sequencia': {
      const alvo = (regra.valor || '').toString().toUpperCase().replace(/[^A-Z]/g, '');
      const dado = (dados?.[regra.campo || 'valor'] || texto || '')
        .toString()
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      if (!dado) return 0;
      if (dado === alvo) return Number(regra.pontos);
      let certas = 0;
      for (let i = 0; i < Math.min(dado.length, alvo.length); i++) {
        if (dado[i] === alvo[i]) certas++;
      }
      return certas / alvo.length >= 0.8 ? Number(regra.pontos) * 0.5 : 0;
    }

    case 'palavras': {
      const base = regra.campo ? dados?.[regra.campo] || '' : texto;
      return pontosPorPalavrasChave(regra.termos, base);
    }

    case 'linhas': {
      const linhas = dados?.linhas || [];
      let validas = 0;
      linhas.forEach((l: any) => {
        if ((regra.colunas || []).every((k) => String(l[k] === undefined ? '' : l[k]).trim() !== '')) {
          validas++;
        }
      });
      return Math.min(validas, regra.maxLinhas || validas) * Number(regra.pontosPorLinha);
    }

    case 'grupos': {
      const linhas = dados?.linhas || [];
      let total = 0;
      (regra.grupos || []).forEach((g) => {
        const n = linhas.filter(
          (l: any) =>
            String(l[regra.colunaGrupo || 'grupo'] || '').trim().toUpperCase() === g.toUpperCase() &&
            String(l[regra.colunaConteudo || 'item'] || '').trim() !== ''
        ).length;
        total += Math.min(1, n / (regra.minPorGrupo || 1)) * Number(regra.pontosPorGrupo);
      });
      return total;
    }

    case 'campos': {
      let total = 0;
      (regra.campos || []).forEach((k) => {
        const v = String(dados?.[k] === undefined ? '' : dados[k]).trim();
        if (v.length >= (regra.minCaracteres || 5)) {
          total += Number(regra.pontosPorCampo);
        }
      });
      return total;
    }

    case 'matriz': {
      const linhas = dados?.linhas || [];
      const colunas = regra.colunas || [];
      let colunasUsadas = 0;
      colunas.forEach((k) => {
        if (linhas.some((l: any) => String(l[k] === undefined ? '' : l[k]).trim() !== '')) {
          colunasUsadas++;
        }
      });
      const total = colunasUsadas * Number(regra.pontosPorColuna);
      const completas = linhas.filter(
        (l: any) =>
          colunas.filter((k) => String(l[k] === undefined ? '' : l[k]).trim() !== '').length >=
          Math.ceil(colunas.length * 0.6)
      ).length;
      const extra = Math.min(Math.max(0, completas - 1), regra.maxLinhasExtra || 0);
      return total + extra * Number(regra.pontosPorLinhaExtra || 0);
    }

    case 'pertRede': {
      const referencia = mapaAtividades(regra.referencia || item.config?.atividades || []);
      const aluno = mapaAtividades(dados?.atividades || []);
      const ids = Object.keys(referencia);
      if (!ids.length) return 0;

      let certas = 0;
      ids.forEach((id) => {
        const r = referencia[id];
        const a = aluno[id];
        if (!a) return;
        const mesmaDuracao = Math.abs(a.dur - r.dur) < 0.001;
        const mesmasPrec = a.preds.join(',') === r.preds.join(',');
        if (mesmaDuracao && mesmasPrec) certas += 1;
        else if (mesmasPrec || mesmaDuracao) certas += 0.5;
      });
      let pontos = Number(regra.pontos) * (certas / ids.length);

      // Check critical path marked in diagram
      const critico = calcularCaminhoCritico(referencia);
      const marcado = (dados?.caminho || []).map((x: any) => String(x).toUpperCase()).join('');
      if (marcado && critico.caminhos.some((c) => c.join('') === marcado)) {
        pontos = Math.max(pontos, Number(regra.pontos) * 0.85);
      }
      return Math.round(pontos * 100) / 100;
    }

    default:
      return 0;
  }
}

/**
 * Grades a single exam item
 */
export function corrigirItem(item: ExamItem, texto: string, dados: any): number {
  const max = Number(item.pontos);
  const regras = item.correcao || [];
  if (!regras.length) return 0;
  let total = 0;
  regras.forEach((regra) => {
    total += aplicarRegra(regra, item, texto, dados);
  });
  return Math.round(Math.min(total, max) * 100) / 100;
}

/**
 * Determines whether a line contains meaningful user input
 */
export function linhaPreenchida(linha: any, colunas: any[], padrao?: any): boolean {
  if (!linha) return false;
  return colunas.some((col) => {
    if (col.bloqueado || col.tipo === 'produto') return false;
    const v = limpar(linha[col.key]);
    if (v === '') return false;
    if (padrao && padrao[col.key] !== undefined && limpar(padrao[col.key]) === v) return false;
    return true;
  });
}

/**
 * Serializes item response to a clean human-readable text
 */
export function serializar(item: ExamItem, estado: any): string {
  if (!estado) return '';
  const c = item.config || {};

  switch (item.widget) {
    case 'tabela': {
      const colunas = c.colunas || [];
      const padroes = c.linhasPadrao || [];
      const linhas = (estado.linhas || []).filter((l: any, i: number) =>
        linhaPreenchida(l, colunas, padroes[i])
      );
      if (!linhas.length) return '';
      return linhas
        .map(
          (l: any, i: number) =>
            `${i + 1}) ` +
            colunas.map((col) => `${col.label}: ${limpar(l[col.key]) || '—'}`).join(' | ')
        )
        .join('\n');
    }

    case 'swot': {
      const grupos: Record<string, string[]> = {};
      (estado.linhas || []).forEach((l: any) => {
        if (!limpar(l.item)) return;
        (grupos[l.grupo] = grupos[l.grupo] || []).push(limpar(l.item));
      });
      const partes: string[] = [];
      (c.quadrantes || []).forEach((qd) => {
        if (grupos[qd.key]?.length) {
          partes.push(`${qd.key.toUpperCase()}: ${grupos[qd.key].join('; ')}`);
        }
      });
      return partes.join('\n');
    }

    case 'escolha': {
      if (!limpar(estado.escolha) && !limpar(estado.justificacao)) return '';
      return `Categoria escolhida: ${limpar(estado.escolha) || '—'}\nJustificação: ${
        limpar(estado.justificacao) || '—'
      }`;
    }

    case 'calculo': {
      if (!limpar(estado.calculo) && !limpar(estado.valor)) return '';
      return `Cálculo: ${limpar(estado.calculo)}\nResultado: ${limpar(estado.valor)}${
        c.sufixo ? ` ${c.sufixo}` : ''
      }`;
    }

    case 'smart': {
      const temConteudo =
        (c.campos || []).some((cp) => limpar(estado[cp.key]) !== '') || limpar(estado.meta) !== '';
      if (!temConteudo) return '';
      let t = (c.campos || [])
        .map((cp) => `${cp.letra} (${cp.label}): ${limpar(estado[cp.key]) || '—'}`)
        .join('\n');
      if (limpar(estado.meta)) t += `\nMeta final: ${limpar(estado.meta)}`;
      return t;
    }

    case 'pert': {
      const acts = (estado.atividades || []).filter((a: any) => limpar(a.id));
      if (!acts.length) return '';
      const linhasTxt = acts
        .map(
          (a: any) =>
            `${a.id.toUpperCase()} — ${limpar(a.descricao) || 'sem descrição'} (precedência: ${
              limpar(a.precedencias) || '—'
            }; duração: ${limpar(a.duracao) || '?'} dias)`
        )
        .join('\n');
      let txt =
        `Actividades da rede:\n${linhasTxt}\nCaminho marcado no diagrama: ` +
        (estado.caminho?.length ? estado.caminho.join(' – ') : '(nenhum)');
      const rede = construirRedeAOA(estado.atividades);
      if (rede.eventos?.length) {
        const datas = rede.eventos
          .map((ev) => {
            const d = (estado.eventos || {})[ev.chave] || {};
            if (!limpar(d.cedo) && !limpar(d.tarde)) return null;
            return `Evento ${ev.numero}: cedo=${limpar(d.cedo) || '—'}, tarde=${limpar(d.tarde) || '—'}`;
          })
          .filter(Boolean);
        if (datas.length) txt += `\nDatas dos eventos: ${datas.join('; ')}`;
      }
      return txt;
    }

    default:
      return limpar(estado.valor);
  }
}

/**
 * Tests whether an item has been answered by the student
 */
export function itemRespondido(item: ExamItem, estado: any): boolean {
  if (!estado) return false;
  if (item.widget === 'pert') return (estado.caminho || []).length > 0;
  return serializar(item, estado).trim() !== '';
}
