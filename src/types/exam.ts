/**
 * Types for the Online Exam System (Sistema de Provas Online)
 */

export type WidgetType =
  | 'texto'
  | 'numero'
  | 'textarea'
  | 'calculo'
  | 'escolha'
  | 'smart'
  | 'swot'
  | 'tabela'
  | 'pert';

export interface CorrectionRule {
  tipo: 'numero' | 'sequencia' | 'palavras' | 'linhas' | 'grupos' | 'campos' | 'matriz' | 'pertRede';
  campo?: string;
  valor?: number | string;
  tolerancia?: number;
  termos?: string;
  pontos?: number;
  pontosPorLinha?: number;
  pontosPorGrupo?: number;
  pontosPorCampo?: number;
  pontosPorColuna?: number;
  pontosPorLinhaExtra?: number;
  colunas?: string[];
  grupos?: string[];
  colunaGrupo?: string;
  colunaConteudo?: string;
  campos?: string[];
  minCaracteres?: number;
  minPorGrupo?: number;
  maxLinhas?: number;
  maxLinhasExtra?: number;
  referencia?: any[];
}

export interface ExamItemConfig {
  linhas?: number;
  placeholder?: string;
  sufixo?: string;
  rotuloCalculo?: string;
  rotuloResultado?: string;
  placeholderCalculo?: string;
  opcoes?: string[];
  rotuloEscolha?: string;
  rotuloJustificacao?: string;
  campos?: Array<{ key: string; letra: string; label: string; dica?: string }>;
  rotuloMeta?: string;
  quadrantes?: Array<{ key: string; label: string; sub?: string; cor?: string; itens?: number }>;
  colunas?: Array<{
    key: string;
    label: string;
    tipo?: string;
    bloqueado?: boolean;
    largura?: string;
    opcoes?: string[];
    fonte?: string[];
  }>;
  linhasIniciais?: any[];
  linhasPadrao?: any[];
  adicionar?: boolean;
  remover?: boolean;
  minLinhas?: number;
  rotuloAdicionar?: string;
  legenda?: string;
  instrucoes?: string;
  atividades?: Array<{ id?: string; descricao?: string; precedencias?: string; duracao?: number | string }>;
  linhasVazias?: number;
  usarCaminhoMarcado?: string;
}

export interface ExamItem {
  id: string;
  alinea?: string;
  enunciado: string;
  pontos: number;
  widget: WidgetType;
  config?: ExamItemConfig;
  correcao?: CorrectionRule[];
}

export interface ExamQuestion {
  numero: string;
  itens: ExamItem[];
}

export interface ExamPart {
  parte: string;
  titulo: string;
  contextoHtml?: string;
  questoes: ExamQuestion[];
}

export interface ExamDefinition {
  examId: string;
  titulo: string;
  descricao: string;
  contextoHtml?: string;
  partes: ExamPart[];
  tempoLimiteMin: number;
  tipo: 'oficial' | 'ensaio';
  disponivelEm?: string;
  horaInicio?: string;
  horaFim?: string;
  aberturaImediata?: boolean;
}

export interface Student {
  studentId: string;
  nome: string;
  login: string;
  senha: string;
  turma: string;
  provincia?: string;
  email: string;
  role?: 'aluno' | 'docente';
  acessoPermitido?: boolean;
  provasPermitidas?: string[];
  tempoExtraMin?: number;
  observacao?: string;
}

export interface StudentAccess {
  studentId: string;
  nome: string;
  primeiroLoginEm: string; // ISO
  expiraEm: string; // ISO
  ultimoLoginEm: string; // ISO
}

export interface Attempt {
  attemptId: string;
  studentId: string;
  nome?: string;
  examId: string;
  tituloExame: string;
  inicioEm: string;
  expiraEm: string;
  fimEm?: string;
  estado: 'Em curso' | 'Concluído' | 'Concluído (fora do prazo)' | 'Ensaio' | 'Abandonado';
  respostas: Record<string, { texto: string; dados: any }>;
  resultado?: ExamResult;
}

export interface DetailResult {
  parte: string;
  questao: string;
  alinea: string;
  enunciado: string;
  pontos: number;
  max: number;
  respostaTexto?: string;
  feedback?: string;
}

export interface ExamResult {
  attemptId: string;
  studentId: string;
  nome: string;
  turma?: string;
  examId: string;
  tituloExame: string;
  notaTotal: number;
  notaMax: number;
  nota20: number;
  inicioEm: string;
  fimEm: string;
  estado: string;
  foraDePrazo?: boolean;
  ensaio?: boolean;
  detalhe?: DetailResult[];
}
