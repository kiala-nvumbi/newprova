/**
 * SISTEMA DE PROVAS ONLINE — Google Apps Script (ficheiro único)
 * ---------------------------------------------------------------
 * · Login de alunos (contas criadas à mão na folha "Alunos")
 * · Janela de 3 horas por aluno, a contar do primeiro login
 * · Uma única tentativa por prova
 * · Prova com quadros dinâmicos (SWOT, PESTEL, GUT, 5W2H, rede PERT)
 * · Correcção automática e resultado detalhado logo após submeter
 * · Relatórios Excel/PDF e impressão individual da prova
 *
 * A definição da prova está no fim deste ficheiro (DEFINICAO_PROVAS).
 * ---------------------------------------------------------------
 */

// ------------------------- CONSTANTES -------------------------
const SHEET_EXAMES     = 'Exames';
const SHEET_PERGUNTAS  = 'Perguntas';
const SHEET_ALUNOS     = 'Alunos';
const SHEET_RESPOSTAS  = 'Respostas';
const SHEET_RESULTADOS = 'Resultados';
const SHEET_ACESSOS    = 'Acessos';
const SHEET_TENTATIVAS = 'Tentativas';

/** Minutos que cada aluno tem, a contar do seu primeiro login. */
const JANELA_MINUTOS = 180;
/** Tolerância, em minutos, para aceitar uma submissão que chegue depois do prazo. */
const TOLERANCIA_MINUTOS = 5;

const SESSAO_TTL_SEG = 12 * 60 * 60;

// ------------------------- MENU -------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎓 Sistema de Provas')
    .addItem('⚙️ Configurar sistema (1.ª vez)', 'configurarSistemaCompleto')
    .addItem('♻️ Actualizar provas (depois de editar a definição)', 'reinstalarProvas')
    .addSeparator()
    .addItem('🔗 Ver link da prova (Web App)', 'mostrarLinkWebApp')
    .addItem('🔓 Reabrir prova de um aluno', 'menuReabrirProva')
    .addSeparator()
    .addItem('📊 Gerar relatório em Excel', 'menuGerarExcel')
    .addItem('📄 Gerar relatório em PDF', 'menuGerarPDF')
    .addSeparator()
    .addItem('🖨️ Imprimir prova de 1 aluno (PDF)', 'menuImprimirUmaProva')
    .addItem('🖨️ Imprimir provas de todos (PDF)', 'menuImprimirTodasProvas')
    .addToUi();
}

// ------------------------- SETUP -------------------------
function configurarSistemaCompleto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  _criarFolhaComCabecalho(ss, SHEET_EXAMES,
    ['ExamID', 'Titulo', 'Descricao', 'Estado', 'TempoLimiteMin', 'CriadoEm']);
  _criarFolhaComCabecalho(ss, SHEET_PERGUNTAS,
    ['QuestionID', 'ExamID', 'Parte', 'Ordem', 'Enunciado', 'Tipo', 'PontosMax']);
  _criarFolhaComCabecalho(ss, SHEET_ALUNOS,
    ['StudentID', 'Nome', 'Login', 'Senha', 'Turma', 'Email']);
  _criarFolhaComCabecalho(ss, SHEET_ACESSOS,
    ['StudentID', 'Nome', 'PrimeiroLoginEm', 'ExpiraEm', 'UltimoLoginEm']);
  _criarFolhaComCabecalho(ss, SHEET_TENTATIVAS,
    ['AttemptID', 'StudentID', 'ExamID', 'InicioEm', 'ExpiraEm', 'Estado']);
  _criarFolhaComCabecalho(ss, SHEET_RESPOSTAS,
    ['RespostaID', 'AttemptID', 'StudentID', 'ExamID', 'QuestionID', 'Resposta', 'RespostaJSON', 'Pontuacao', 'PontosMax', 'Timestamp']);
  _criarFolhaComCabecalho(ss, SHEET_RESULTADOS,
    ['AttemptID', 'StudentID', 'Nome', 'ExamID', 'TituloExame', 'NotaTotal', 'NotaMax', 'Nota20', 'InicioEm', 'FimEm', 'Estado']);

  _sincronizarProvas();

  ui.alert('✅ Sistema configurado.\n\n' +
    'Crie as contas na folha "Alunos" (StudentID, Nome, Login, Senha, Turma, Email).\n\n' +
    'Cada aluno tem ' + JANELA_MINUTOS + ' minutos a contar do primeiro login e só pode fazer a prova uma vez.\n\n' +
    'Confirme o fuso horário do projecto (Definições do projecto > Fuso horário: Africa/Luanda) — ' +
    'é ele que decide o dia em que a prova oficial abre.\n\n' +
    'Passo seguinte: Implementar > Nova implementação > Aplicação Web ' +
    '(executar como "Eu", acesso "Qualquer pessoa").');
}

/** Reescreve as folhas Exames e Perguntas a partir da definição no fim deste ficheiro. */
function reinstalarProvas() {
  _sincronizarProvas();
  SpreadsheetApp.getUi().alert('✅ Provas actualizadas.\n\nRespostas, resultados e acessos não foram alterados.');
}

function _sincronizarProvas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fExames = _criarFolhaComCabecalho(ss, SHEET_EXAMES,
    ['ExamID', 'Titulo', 'Descricao', 'Estado', 'TempoLimiteMin', 'CriadoEm']);
  const fPerguntas = _criarFolhaComCabecalho(ss, SHEET_PERGUNTAS,
    ['QuestionID', 'ExamID', 'Parte', 'Ordem', 'Enunciado', 'Tipo', 'PontosMax']);

  const estados = {};
  _linhasComoObjetos(fExames).forEach(e => estados[e.ExamID] = e.Estado);

  if (fExames.getLastRow() > 1) fExames.deleteRows(2, fExames.getLastRow() - 1);
  if (fPerguntas.getLastRow() > 1) fPerguntas.deleteRows(2, fPerguntas.getLastRow() - 1);

  DEFINICAO_PROVAS.forEach(prova => {
    fExames.appendRow([prova.examId, prova.titulo, prova.descricao,
      estados[prova.examId] || 'Ativo', prova.tempoLimiteMin || JANELA_MINUTOS, new Date()]);
    let ordem = 0;
    _itensDaProva(prova).forEach(({ parte, questao, item }) => {
      ordem++;
      fPerguntas.appendRow([item.id, prova.examId, parte.parte, ordem,
        questao.numero + ' ' + (item.alinea || '') + ' ' + item.enunciado,
        item.widget, item.pontos]);
    });
  });
  fPerguntas.autoResizeColumns(1, 4);
}

function _criarFolhaComCabecalho(ss, nome, cabecalho) {
  let folha = ss.getSheetByName(nome);
  if (!folha) folha = ss.insertSheet(nome);
  if (folha.getLastRow() === 0) {
    folha.appendRow(cabecalho);
    folha.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
    folha.setFrozenRows(1);
  } else {
    const atual = folha.getRange(1, 1, 1, folha.getLastColumn()).getValues()[0];
    cabecalho.forEach(c => {
      if (atual.indexOf(c) === -1) {
        folha.getRange(1, folha.getLastColumn() + 1).setValue(c)
          .setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
      }
    });
  }
  return folha;
}

function _itensDaProva(prova) {
  const lista = [];
  prova.partes.forEach(parte => {
    parte.questoes.forEach(questao => {
      questao.itens.forEach(item => lista.push({ parte: parte, questao: questao, item: item }));
    });
  });
  return lista;
}

/** Estado de disponibilidade de uma prova, segundo a data e a hora do fuso do projecto. */
function _disponibilidade(prova) {
  if (prova.tipo === 'ensaio') return { estado: 'disponivel', ensaio: true };
  if (!prova.disponivelEm) return { estado: 'disponivel' };

  const tz = Session.getScriptTimeZone();
  const agora = new Date();
  const hoje = Utilities.formatDate(agora, tz, 'yyyy-MM-dd');
  const hora = Utilities.formatDate(agora, tz, 'HH:mm');
  const inicio = prova.horaInicio || '00:00';
  const fim = prova.horaFim || '23:59';

  if (hoje < prova.disponivelEm || (hoje === prova.disponivelEm && hora < inicio)) {
    return { estado: 'agendada', data: prova.disponivelEm, hora: inicio };
  }
  if (hoje > prova.disponivelEm || (hoje === prova.disponivelEm && hora > fim)) {
    return { estado: 'encerrada', data: prova.disponivelEm };
  }
  return { estado: 'disponivel' };
}

function _algumOficialAberto() {
  return DEFINICAO_PROVAS.some(p => p.tipo !== 'ensaio' && _disponibilidade(p).estado === 'disponivel');
}

function _definicao(examId) {
  return DEFINICAO_PROVAS.filter(p => p.examId === examId)[0] || null;
}

// ------------------------- WEB APP -------------------------
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema de Provas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function mostrarLinkWebApp() {
  const ui = SpreadsheetApp.getUi();
  let url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (err) {}
  if (url) ui.alert('Link da prova:\n\n' + url);
  else ui.alert('A aplicação ainda não foi implementada.\n\nVá a Implementar > Nova implementação > ' +
    'Tipo "Aplicação Web" (executar como "Eu", acesso "Qualquer pessoa").');
}

// ------------------------- UTILITÁRIOS -------------------------
function _ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function _sheet(nome) { return _ss().getSheetByName(nome); }

function _linhasComoObjetos(folha) {
  if (!folha || folha.getLastRow() < 2) return [];
  const dados = folha.getDataRange().getValues();
  const cab = dados.shift();
  return dados.map((linha, i) => {
    const obj = { _linha: i + 2 };
    cab.forEach((c, j) => obj[c] = linha[j]);
    return obj;
  });
}

function _appendPorCabecalho(folha, obj) {
  const cab = folha.getRange(1, 1, 1, folha.getLastColumn()).getValues()[0];
  folha.appendRow(cab.map(c => (obj[c] === undefined ? '' : obj[c])));
}

function _actualizarCelula(folha, numeroLinha, nomeColuna, valor) {
  const cab = folha.getRange(1, 1, 1, folha.getLastColumn()).getValues()[0];
  const col = cab.indexOf(nomeColuna) + 1;
  if (col > 0) folha.getRange(numeroLinha, col).setValue(valor);
}

function normalize(str) {
  return (str === null || str === undefined ? '' : str.toString())
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?()"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _num(v) {
  if (v === null || v === undefined || v === '') return NaN;
  return parseFloat(v.toString().replace(/\s/g, '').replace(',', '.'));
}

function _data(v) { return (v instanceof Date) ? v : new Date(v); }
function _segundosAte(data) { return Math.floor((_data(data).getTime() - Date.now()) / 1000); }

// ------------------------- LOGIN E JANELA DE ACESSO -------------------------
function login(usuario, senha) {
  const aluno = _linhasComoObjetos(_sheet(SHEET_ALUNOS)).filter(a =>
    (a.Login || '').toString().trim().toLowerCase() === (usuario || '').trim().toLowerCase() &&
    (a.Senha || '').toString().trim() === (senha || '').trim())[0];

  if (!aluno) return { ok: false, erro: 'Utilizador ou senha inválidos.' };

  // a janela de 3 horas só começa a contar quando a prova oficial está aberta,
  // para que os ensaios dos dias anteriores não gastem o tempo do aluno
  const acesso = _algumOficialAberto() ? _registarAcesso(aluno) : _acessoDoAluno(aluno.StudentID);
  const restantes = acesso ? _segundosAte(acesso.expiraEm) : null;

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify({
    studentId: aluno.StudentID, nome: aluno.Nome, login: aluno.Login
  }), SESSAO_TTL_SEG);

  return {
    ok: true, token: token, nome: aluno.Nome, studentId: aluno.StudentID,
    janelaIniciada: restantes !== null,
    segundosRestantes: restantes === null ? null : Math.max(0, restantes),
    expirado: restantes !== null && restantes <= 0,
    janelaMinutos: JANELA_MINUTOS
  };
}

/** Cria a janela de tempo do aluno no primeiro login; nos seguintes só actualiza o registo. */
function _registarAcesso(aluno) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const folha = _criarFolhaComCabecalho(_ss(), SHEET_ACESSOS,
      ['StudentID', 'Nome', 'PrimeiroLoginEm', 'ExpiraEm', 'UltimoLoginEm']);
    const agora = new Date();
    const existente = _linhasComoObjetos(folha).filter(a => a.StudentID === aluno.StudentID)[0];

    if (existente && existente.ExpiraEm) {
      _actualizarCelula(folha, existente._linha, 'UltimoLoginEm', agora);
      return { inicioEm: _data(existente.PrimeiroLoginEm), expiraEm: _data(existente.ExpiraEm) };
    }
    const expira = new Date(agora.getTime() + JANELA_MINUTOS * 60000);
    _appendPorCabecalho(folha, {
      StudentID: aluno.StudentID, Nome: aluno.Nome,
      PrimeiroLoginEm: agora, ExpiraEm: expira, UltimoLoginEm: agora
    });
    return { inicioEm: agora, expiraEm: expira };
  } finally {
    lock.releaseLock();
  }
}

function _acessoDoAluno(studentId) {
  const acesso = _linhasComoObjetos(_sheet(SHEET_ACESSOS)).filter(a => a.StudentID === studentId)[0];
  if (!acesso) return null;
  return { inicioEm: _data(acesso.PrimeiroLoginEm), expiraEm: _data(acesso.ExpiraEm) };
}

function _validarSessao(token) {
  const raw = CacheService.getScriptCache().get('sess_' + token);
  if (!raw) return null;
  return JSON.parse(raw);
}

// ------------------------- FLUXO DA PROVA -------------------------
function getExamesDisponiveis(token) {
  const sessao = _validarSessao(token);
  if (!sessao) return { ok: false, erro: 'Sessão expirada. Faça login novamente.' };

  const acesso = _acessoDoAluno(sessao.studentId);
  const restantes = acesso ? _segundosAte(acesso.expiraEm) : null;

  const ativos = {};
  _linhasComoObjetos(_sheet(SHEET_EXAMES)).forEach(ex => ativos[ex.ExamID] = (ex.Estado === 'Ativo'));
  const resultados = _linhasComoObjetos(_sheet(SHEET_RESULTADOS));

  const lista = [];
  DEFINICAO_PROVAS.forEach(prova => {
    if (ativos[prova.examId] === false) return;
    const disp = _disponibilidade(prova);
    const ensaio = prova.tipo === 'ensaio';
    const feito = !ensaio && resultados.filter(r => r.StudentID === sessao.studentId &&
      r.ExamID === prova.examId && String(r.Estado).indexOf('Concluído') === 0)[0];

    let estado = disp.estado;
    if (feito) estado = 'concluida';
    else if (!ensaio && disp.estado === 'disponivel' && restantes !== null && restantes <= 0) estado = 'expirada';

    lista.push({
      examId: prova.examId, titulo: prova.titulo, descricao: prova.descricao,
      ensaio: ensaio, estado: estado, data: disp.data || '', hora: disp.hora || '',
      nota20: feito ? feito.Nota20 : null
    });
  });

  return {
    ok: true, exames: lista,
    janelaIniciada: restantes !== null,
    segundosRestantes: restantes === null ? null : Math.max(0, restantes),
    janelaMinutos: JANELA_MINUTOS
  };
}

/** Cópia da definição sem os critérios de correcção (nunca são enviados ao aluno). */
function _definicaoParaAluno(prova) {
  const copia = JSON.parse(JSON.stringify(prova));
  copia.partes.forEach(parte => parte.questoes.forEach(questao => questao.itens.forEach(item => {
    delete item.correcao;
  })));
  return copia;
}

function iniciarTentativa(token, examId) {
  const sessao = _validarSessao(token);
  if (!sessao) return { ok: false, erro: 'Sessão expirada. Faça login novamente.' };

  const prova = _definicao(examId);
  if (!prova) return { ok: false, erro: 'Prova não encontrada. Corra "Actualizar provas" no menu.' };

  const ensaio = prova.tipo === 'ensaio';
  const folhaT = _criarFolhaComCabecalho(_ss(), SHEET_TENTATIVAS,
    ['AttemptID', 'StudentID', 'ExamID', 'InicioEm', 'ExpiraEm', 'Estado']);

  // ---------- ambiente de ensaio: sem data marcada, sem janela, repetível ----------
  if (ensaio) {
    _linhasComoObjetos(folhaT)
      .filter(t2 => t2.StudentID === sessao.studentId && t2.ExamID === examId && t2.Estado === 'Em curso')
      .forEach(t2 => _actualizarCelula(folhaT, t2._linha, 'Estado', 'Abandonado'));

    const minutos = Number(prova.tempoLimiteMin) || JANELA_MINUTOS;
    const attemptId = Utilities.getUuid();
    const expira = new Date(Date.now() + minutos * 60000);
    _appendPorCabecalho(folhaT, {
      AttemptID: attemptId, StudentID: sessao.studentId, ExamID: examId,
      InicioEm: new Date(), ExpiraEm: expira, Estado: 'Em curso'
    });
    return {
      ok: true, jaConcluido: false, ensaio: true, attemptId: attemptId,
      definicao: _definicaoParaAluno(prova), segundosRestantes: minutos * 60
    };
  }

  // ---------- prova oficial ----------
  const disp = _disponibilidade(prova);
  if (disp.estado === 'agendada') {
    return { ok: false, erro: 'Esta prova só fica disponível a ' + _dataPT(disp.data) +
      (disp.hora && disp.hora !== '00:00' ? (', a partir das ' + disp.hora) : '') + '.' };
  }
  if (disp.estado === 'encerrada') {
    return { ok: false, erro: 'O período de realização desta prova (' + _dataPT(disp.data) + ') já terminou.' };
  }

  const jaFeito = _linhasComoObjetos(_sheet(SHEET_RESULTADOS)).filter(r =>
    r.StudentID === sessao.studentId && r.ExamID === examId &&
    String(r.Estado).indexOf('Concluído') === 0)[0];
  if (jaFeito) return { ok: true, jaConcluido: true, nota20: jaFeito.Nota20 };

  const aluno = _linhasComoObjetos(_sheet(SHEET_ALUNOS)).filter(a => a.StudentID === sessao.studentId)[0];
  let acesso = _acessoDoAluno(sessao.studentId);
  if (!acesso && aluno) acesso = _registarAcesso(aluno);
  if (!acesso) return { ok: false, erro: 'Acesso não registado. Faça login novamente.' };

  const restantes = _segundosAte(acesso.expiraEm);
  if (restantes <= 0) {
    return { ok: false, expirado: true, erro: 'O seu período de ' + (JANELA_MINUTOS / 60) +
      ' horas terminou. Já não é possível realizar a prova. Contacte o docente.' };
  }

  let tentativa = _linhasComoObjetos(folhaT).filter(t2 =>
    t2.StudentID === sessao.studentId && t2.ExamID === examId && t2.Estado === 'Em curso')[0];

  if (!tentativa) {
    const attemptId = Utilities.getUuid();
    _appendPorCabecalho(folhaT, {
      AttemptID: attemptId, StudentID: sessao.studentId, ExamID: examId,
      InicioEm: new Date(), ExpiraEm: acesso.expiraEm, Estado: 'Em curso'
    });
    tentativa = { AttemptID: attemptId };
  }

  return {
    ok: true, jaConcluido: false, ensaio: false, attemptId: tentativa.AttemptID,
    definicao: _definicaoParaAluno(prova), segundosRestantes: restantes
  };
}

function _dataPT(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function submeterProva(token, attemptId, examId, respostas) {
  const sessao = _validarSessao(token);
  if (!sessao) return { ok: false, erro: 'Sessão expirada. Faça login novamente.' };

  const prova = _definicao(examId);
  if (!prova) return { ok: false, erro: 'Prova não encontrada.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ensaio = prova.tipo === 'ensaio';
    if (!ensaio) {
      const jaFeito = _linhasComoObjetos(_sheet(SHEET_RESULTADOS)).filter(r =>
        r.StudentID === sessao.studentId && r.ExamID === examId &&
        String(r.Estado).indexOf('Concluído') === 0)[0];
      if (jaFeito) return { ok: false, erro: 'Esta prova já foi submetida. Não é possível repeti-la.' };
    }

    const folhaT = _sheet(SHEET_TENTATIVAS);
    const tentativa = _linhasComoObjetos(folhaT).filter(t => t.AttemptID === attemptId)[0];
    if (!tentativa) return { ok: false, erro: 'Tentativa inválida.' };
    if (tentativa.StudentID !== sessao.studentId) return { ok: false, erro: 'Tentativa não pertence a este utilizador.' };
    if (tentativa.Estado !== 'Em curso') return { ok: false, erro: 'Esta tentativa já foi encerrada.' };

    const agora = new Date();
    const atraso = (agora.getTime() - _data(tentativa.ExpiraEm).getTime()) / 60000;
    const foraDePrazo = atraso > TOLERANCIA_MINUTOS;

    const folhaResp = _sheet(SHEET_RESPOSTAS);
    let notaTotal = 0, notaMax = 0;
    const detalhe = [];

    _itensDaProva(prova).forEach(({ parte, questao, item }) => {
      const bruto = respostas[item.id] || {};
      const texto = (typeof bruto === 'string') ? bruto : (bruto.texto || '');
      const dados = (typeof bruto === 'object' && bruto.dados) ? bruto.dados : { valor: texto };
      const pontos = _corrigirItem(item, texto, dados);

      notaTotal += pontos;
      notaMax += Number(item.pontos);
      detalhe.push({
        parte: parte.parte, questao: questao.numero, alinea: item.alinea || '',
        enunciado: item.enunciado, pontos: pontos, max: Number(item.pontos)
      });

      _appendPorCabecalho(folhaResp, {
        RespostaID: Utilities.getUuid(), AttemptID: attemptId, StudentID: sessao.studentId,
        ExamID: examId, QuestionID: item.id, Resposta: texto,
        RespostaJSON: JSON.stringify(dados).slice(0, 45000),
        Pontuacao: pontos, PontosMax: item.pontos, Timestamp: agora
      });
    });

    notaTotal = Math.round(notaTotal * 100) / 100;
    const nota20 = notaMax > 0 ? Math.round((notaTotal / notaMax) * 20 * 10) / 10 : 0;
    const exame = _linhasComoObjetos(_sheet(SHEET_EXAMES)).filter(e => e.ExamID === examId)[0];
    const estado = ensaio ? 'Ensaio' : (foraDePrazo ? 'Concluído (fora do prazo)' : 'Concluído');

    _appendPorCabecalho(_sheet(SHEET_RESULTADOS), {
      AttemptID: attemptId, StudentID: sessao.studentId, Nome: sessao.nome, ExamID: examId,
      TituloExame: exame ? exame.Titulo : prova.titulo, NotaTotal: notaTotal, NotaMax: notaMax,
      Nota20: nota20, InicioEm: _data(tentativa.InicioEm), FimEm: agora, Estado: estado
    });
    _actualizarCelula(folhaT, tentativa._linha, 'Estado', estado);

    return {
      ok: true, nota20: nota20, notaTotal: notaTotal, notaMax: notaMax,
      detalhe: detalhe, foraDePrazo: foraDePrazo && !ensaio, ensaio: ensaio
    };
  } finally {
    lock.releaseLock();
  }
}

// ------------------------- REABRIR PROVA (DOCENTE) -------------------------
function menuReabrirProva() {
  const ui = SpreadsheetApp.getUi();
  const r1 = ui.prompt('Reabrir prova', 'StudentID do aluno (ex.: A001):', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const studentId = r1.getResponseText().trim();
  const r2 = ui.prompt('Reabrir prova', 'ExamID (ex.: ' + DEFINICAO_PROVAS[0].examId + '):', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  const examId = r2.getResponseText().trim();

  const conf = ui.alert('Confirmar', 'Vai apagar o resultado e as respostas de ' + studentId +
    ' nesta prova e reiniciar a janela de ' + JANELA_MINUTOS + ' minutos. Continuar?', ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;

  ui.alert(reabrirProva(studentId, examId));
}

function reabrirProva(studentId, examId) {
  const relatorio = [];

  [SHEET_RESULTADOS, SHEET_RESPOSTAS, SHEET_TENTATIVAS].forEach(nome => {
    const folha = _sheet(nome);
    if (!folha) return;
    const linhas = _linhasComoObjetos(folha)
      .filter(r => r.StudentID === studentId && r.ExamID === examId)
      .map(r => r._linha)
      .sort((a, b) => b - a);
    linhas.forEach(n => folha.deleteRow(n));
    relatorio.push(nome + ': ' + linhas.length + ' linha(s) removida(s)');
  });

  const fAcessos = _sheet(SHEET_ACESSOS);
  const acesso = _linhasComoObjetos(fAcessos).filter(a => a.StudentID === studentId)[0];
  if (acesso) {
    fAcessos.deleteRow(acesso._linha);
    relatorio.push('Janela de tempo reiniciada (recomeça no próximo login)');
  }
  return '✅ Prova reaberta para ' + studentId + '\n\n' + relatorio.join('\n');
}

// ------------------------- MOTOR DE CORRECÇÃO -------------------------
function _corrigirItem(item, texto, dados) {
  const max = Number(item.pontos);
  const regras = item.correcao || [];
  if (!regras.length) return 0;
  let total = 0;
  regras.forEach(regra => { total += _aplicarRegra(regra, item, texto, dados); });
  return Math.round(Math.min(total, max) * 100) / 100;
}

function _aplicarRegra(regra, item, texto, dados) {
  switch (regra.tipo) {

    case 'numero': {
      const dado = _num(dados[regra.campo || 'valor']);
      const esperado = Number(regra.valor);
      if (isNaN(dado)) return 0;
      const tol = Math.max(Math.abs(esperado) * (regra.tolerancia || 0.02), 0.001);
      return Math.abs(dado - esperado) <= tol ? Number(regra.pontos) : 0;
    }

    case 'sequencia': {
      const alvo = (regra.valor || '').toUpperCase().replace(/[^A-Z]/g, '');
      const dado = (dados[regra.campo || 'valor'] || texto || '').toString().toUpperCase().replace(/[^A-Z]/g, '');
      if (!dado) return 0;
      if (dado === alvo) return Number(regra.pontos);
      let certas = 0;
      for (let i = 0; i < Math.min(dado.length, alvo.length); i++) if (dado[i] === alvo[i]) certas++;
      return (certas / alvo.length) >= 0.8 ? Number(regra.pontos) * 0.5 : 0;
    }

    case 'palavras': {
      const base = regra.campo ? (dados[regra.campo] || '') : texto;
      return _pontosPorPalavrasChave(regra.termos, base);
    }

    case 'linhas': {
      const linhas = dados.linhas || [];
      let validas = 0;
      linhas.forEach(l => {
        if ((regra.colunas || []).every(k => String(l[k] === undefined ? '' : l[k]).trim() !== '')) validas++;
      });
      return Math.min(validas, regra.maxLinhas || validas) * Number(regra.pontosPorLinha);
    }

    case 'grupos': {
      const linhas = dados.linhas || [];
      let total = 0;
      (regra.grupos || []).forEach(g => {
        const n = linhas.filter(l =>
          String(l[regra.colunaGrupo] || '').trim() === g &&
          String(l[regra.colunaConteudo] || '').trim() !== '').length;
        total += Math.min(1, n / (regra.minPorGrupo || 1)) * Number(regra.pontosPorGrupo);
      });
      return total;
    }

    case 'campos': {
      let total = 0;
      (regra.campos || []).forEach(k => {
        const v = String(dados[k] === undefined ? '' : dados[k]).trim();
        if (v.length >= (regra.minCaracteres || 5)) total += Number(regra.pontosPorCampo);
      });
      return total;
    }

    case 'matriz': {
      const linhas = dados.linhas || [];
      const colunas = regra.colunas || [];
      let colunasUsadas = 0;
      colunas.forEach(k => {
        if (linhas.some(l => String(l[k] === undefined ? '' : l[k]).trim() !== '')) colunasUsadas++;
      });
      let total = colunasUsadas * Number(regra.pontosPorColuna);
      const completas = linhas.filter(l =>
        colunas.filter(k => String(l[k] === undefined ? '' : l[k]).trim() !== '').length >= Math.ceil(colunas.length * 0.6)
      ).length;
      const extra = Math.min(Math.max(0, completas - 1), regra.maxLinhasExtra || 0);
      return total + extra * Number(regra.pontosPorLinhaExtra || 0);
    }

    case 'pertRede': {
      const referencia = _mapaAtividades(regra.referencia || (item.config || {}).atividades || []);
      const aluno = _mapaAtividades(dados.atividades || []);
      const ids = Object.keys(referencia);
      if (!ids.length) return 0;

      let certas = 0;
      ids.forEach(id => {
        const r = referencia[id], a = aluno[id];
        if (!a) return;
        const mesmaDuracao = Math.abs(a.dur - r.dur) < 0.001;
        const mesmasPrec = a.preds.join(',') === r.preds.join(',');
        if (mesmaDuracao && mesmasPrec) certas += 1;
        else if (mesmasPrec || mesmaDuracao) certas += 0.5;
      });
      let pontos = Number(regra.pontos) * (certas / ids.length);

      // caminho crítico correctamente marcado no diagrama
      const critico = _caminhoCritico(referencia);
      const marcado = (dados.caminho || []).map(x => String(x).toUpperCase()).join('');
      if (marcado && critico.caminhos.some(c => c.join('') === marcado)) {
        pontos = Math.max(pontos, Number(regra.pontos) * 0.85);
      }
      return Math.round(pontos * 100) / 100;
    }

    default:
      return 0;
  }
}

function _pontosPorPalavrasChave(termosStr, resposta) {
  if (!termosStr) return 0;
  const respNorm = normalize(resposta);
  let total = 0;
  termosStr.toString().split(';').forEach(par => {
    const partes = par.split(':');
    if (partes.length < 2) return;
    const termo = partes[0].trim();
    const pontos = parseFloat(partes[1]);
    if (!termo || isNaN(pontos)) return;
    if (normalize(termo).split('|').some(v => v && respNorm.indexOf(v) !== -1)) total += pontos;
  });
  return total;
}

// ------------------------- REDE PERT / CPM -------------------------
function _lerPrecedencias(txt) {
  const bruto = (txt === null || txt === undefined ? '' : txt.toString()).toUpperCase().trim();
  if (!bruto || bruto === '—' || bruto === '-') return [];
  const res = [];
  bruto.split(/[,;\/+&]+/).forEach(pedaco => {
    const toks = pedaco.replace(/[–-]/g, ' ').split(/\s+/).filter(Boolean);
    toks.forEach((t, i) => {
      // "C e D": o E do meio é conjunção. "D e E": o E final é a actividade E.
      if (t === 'E' && toks.length >= 3 && i > 0 && i < toks.length - 1) return;
      if (!/^[A-Z0-9]{1,4}$/.test(t)) return;
      if (res.indexOf(t) === -1) res.push(t);
    });
  });
  return res;
}

function _mapaAtividades(lista) {
  const mapa = {};
  lista.forEach(a => {
    const id = (a.id || '').toString().trim().toUpperCase();
    if (!id) return;
    mapa[id] = { id: id, dur: _num(a.duracao) || 0, preds: _lerPrecedencias(a.precedencias).sort() };
  });
  Object.keys(mapa).forEach(id => {
    mapa[id].preds = mapa[id].preds.filter(p => mapa[p] && p !== id);
  });
  return mapa;
}

/** Método do caminho crítico. Devolve { duracao, caminhos: [[ids]] } */
function _caminhoCritico(mapa) {
  const ids = Object.keys(mapa);
  const ef = {}, es = {};
  let guarda = 0, pendente = ids.slice();
  while (pendente.length && guarda++ < 500) {
    pendente = pendente.filter(id => {
      const preds = mapa[id].preds;
      if (preds.some(p => ef[p] === undefined)) return true;
      es[id] = preds.length ? Math.max.apply(null, preds.map(p => ef[p])) : 0;
      ef[id] = es[id] + mapa[id].dur;
      return false;
    });
  }
  if (pendente.length) return { duracao: 0, caminhos: [] };
  const duracao = ids.length ? Math.max.apply(null, ids.map(id => ef[id])) : 0;

  const caminhos = [];
  function subir(id, acumulado) {
    const preds = mapa[id].preds.filter(p => Math.abs(ef[p] - es[id]) < 0.001);
    if (!preds.length) { caminhos.push([id].concat(acumulado)); return; }
    preds.forEach(p => subir(p, [id].concat(acumulado)));
  }
  ids.filter(id => Math.abs(ef[id] - duracao) < 0.001).forEach(id => subir(id, []));
  return { duracao: duracao, caminhos: caminhos };
}

/** Utilitário para o docente: mostra o caminho crítico oficial de cada rede PERT da prova. */
function verCaminhoCritico(examId) {
  const prova = _definicao(examId || DEFINICAO_PROVAS[0].examId);
  let saida = '';
  _itensDaProva(prova).forEach(({ item }) => {
    if (item.widget !== 'pert') return;
    const ref = (item.correcao || []).filter(r => r.tipo === 'pertRede')[0];
    const r = _caminhoCritico(_mapaAtividades((ref && ref.referencia) || item.config.atividades));
    saida += item.id + ' → duração ' + r.duracao + ' dias; caminho(s) crítico(s): ' +
      r.caminhos.map(c => c.join('-')).join(' | ') + '\n';
  });
  Logger.log(saida);
  return saida;
}

// ------------------------- RELATÓRIOS -------------------------
function menuGerarExcel() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Gerar relatório Excel', 'Indique o ExamID:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  ui.alert('Relatório Excel gerado:\n' + gerarRelatorioExcel(resp.getResponseText().trim()));
}

function menuGerarPDF() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Gerar relatório PDF', 'Indique o ExamID:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  ui.alert('Relatório PDF gerado:\n' + gerarRelatorioPDF(resp.getResponseText().trim()));
}

function _dadosRelatorio(examId) {
  const resultados = _linhasComoObjetos(_sheet(SHEET_RESULTADOS))
    .filter(r => r.ExamID === examId)
    .sort((a, b) => b.Nota20 - a.Nota20);
  // nota: as linhas de ensaio ficam com Estado "Ensaio" e são fáceis de filtrar na folha
  const titulo = resultados.length ? resultados[0].TituloExame : examId;
  return {
    titulo: titulo,
    linhas: resultados.map(r => [r.Nome, r.Nota20, r.NotaTotal, r.NotaMax, r.Estado, r.InicioEm, r.FimEm])
  };
}

function _criarSpreadsheetRelatorio(examId) {
  const dados = _dadosRelatorio(examId);
  const novo = SpreadsheetApp.create('Relatorio_' + dados.titulo + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  const folha = novo.getSheets()[0];
  folha.setName('Relatorio');
  folha.appendRow(['Nome', 'Nota (0-20)', 'Pontos Obtidos', 'Pontos Máximos', 'Estado', 'Início', 'Fim']);
  folha.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
  dados.linhas.forEach(l => folha.appendRow(l));
  folha.autoResizeColumns(1, 7);
  SpreadsheetApp.flush();
  return novo;
}

function gerarRelatorioExcel(examId) {
  const novo = _criarSpreadsheetRelatorio(examId);
  const res = UrlFetchApp.fetch('https://docs.google.com/spreadsheets/d/' + novo.getId() + '/export?format=xlsx',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
  const arquivo = DriveApp.getRootFolder().createFile(res.getBlob().setName(novo.getName() + '.xlsx'));
  DriveApp.getFileById(novo.getId()).setTrashed(true);
  return arquivo.getUrl();
}

function gerarRelatorioPDF(examId) {
  const novo = _criarSpreadsheetRelatorio(examId);
  const gid = novo.getSheets()[0].getSheetId();
  const res = UrlFetchApp.fetch('https://docs.google.com/spreadsheets/d/' + novo.getId() +
    '/export?format=pdf&gid=' + gid + '&portrait=true&fitw=true&gridlines=false&size=A4',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
  const arquivo = DriveApp.getRootFolder().createFile(res.getBlob().setName(novo.getName() + '.pdf'));
  DriveApp.getFileById(novo.getId()).setTrashed(true);
  return arquivo.getUrl();
}

// ------------------------- IMPRESSÃO DA PROVA INDIVIDUAL -------------------------
function menuImprimirUmaProva() {
  const ui = SpreadsheetApp.getUi();
  const r1 = ui.prompt('Imprimir prova', 'StudentID do aluno:', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const r2 = ui.prompt('Imprimir prova', 'ExamID:', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  ui.alert('PDF gerado:\n' + imprimirProvaAluno(r1.getResponseText().trim(), r2.getResponseText().trim()));
}

function menuImprimirTodasProvas() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Imprimir todas as provas', 'ExamID:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const examId = resp.getResponseText().trim();

  const resultados = _linhasComoObjetos(_sheet(SHEET_RESULTADOS)).filter(r => r.ExamID === examId);
  if (!resultados.length) { ui.alert('Não há provas concluídas para esse ExamID.'); return; }

  const pasta = DriveApp.createFolder('Provas_' + examId + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  resultados.forEach(r => _gerarPdfProvaAluno(r.StudentID, examId, pasta));
  ui.alert('Provas geradas na pasta do Drive:\n' + pasta.getUrl());
}

function imprimirProvaAluno(studentId, examId) {
  return _gerarPdfProvaAluno(studentId, examId, DriveApp.getRootFolder()).getUrl();
}

function _gerarPdfProvaAluno(studentId, examId, pastaDestino) {
  const aluno = _linhasComoObjetos(_sheet(SHEET_ALUNOS)).filter(a => a.StudentID === studentId)[0];
  const prova = _definicao(examId);
  const respostas = _linhasComoObjetos(_sheet(SHEET_RESPOSTAS))
    .filter(r => r.StudentID === studentId && r.ExamID === examId);
  const resultado = _linhasComoObjetos(_sheet(SHEET_RESULTADOS))
    .filter(r => r.StudentID === studentId && r.ExamID === examId)[0];

  const mapaResp = {};
  respostas.forEach(r => mapaResp[r.QuestionID] = r);

  const doc = DocumentApp.create('Prova_' + (aluno ? aluno.Nome : studentId) + '_' + examId);
  const body = doc.getBody();
  body.appendParagraph(prova ? prova.titulo : examId).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('Aluno: ' + (aluno ? aluno.Nome : studentId) + '   |   Turma: ' + (aluno ? aluno.Turma : ''));
  body.appendParagraph('Nota final: ' + (resultado ? resultado.Nota20 : '—') + ' / 20');
  body.appendHorizontalRule();

  if (prova) {
    prova.partes.forEach(parte => {
      body.appendParagraph('PARTE ' + parte.parte + ' — ' + parte.titulo)
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);
      parte.questoes.forEach(questao => questao.itens.forEach(item => {
        body.appendParagraph(questao.numero + ' ' + (item.alinea || '') + ' ' + item.enunciado)
          .setHeading(DocumentApp.ParagraphHeading.HEADING3);
        const r = mapaResp[item.id];
        body.appendParagraph(r && r.Resposta ? r.Resposta.toString() : '(sem resposta)');
        body.appendParagraph('Pontuação: ' + (r ? r.Pontuacao : 0) + ' / ' + item.pontos).setItalic(true);
      }));
    });
  }

  doc.saveAndClose();
  const arquivo = pastaDestino.createFile(DriveApp.getFileById(doc.getId()).getAs('application/pdf'));
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return arquivo;
}

/* =======================================================================
   DEFINIÇÃO DAS PROVAS
   -----------------------------------------------------------------------
   Única fonte de verdade da prova. Depois de alterar seja o que for,
   corra: 🎓 Sistema de Provas > ♻️ Actualizar provas.

   Campos de cada item:
     id · alinea · enunciado · pontos
     widget    texto | numero | textarea | calculo | escolha |
               smart | swot | tabela | pert
     config    configuração do campo (colunas do quadro, opções…)
     correcao  regras: numero, sequencia, palavras, linhas, grupos,
               campos, matriz, pertRede
   ======================================================================= */

var DEFINICAO_PROVAS = [
  {
    "examId": "cabinda2027",
    "titulo": "Prova de Avaliação — Planeamento Estratégico em Gestão",
    "descricao": "Caso: Hospital Geral Provincial de Cabinda",
    "contextoHtml": "<h4>Contexto do caso</h4><p>O Ministério da Saúde de Angola identificou um aumento significativo da procura por serviços hospitalares nos últimos três anos. O <strong>Hospital Geral Provincial de Cabinda</strong> atende uma população estimada de 2,8 milhões de habitantes e enfrenta desafios relacionados com o crescimento da procura, o aumento dos custos operacionais, a escassez de recursos humanos especializados e a pressão para melhorar a qualidade dos cuidados prestados.</p><p><strong>Em 2025, o hospital registou:</strong></p><table class='dados'><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody><tr><td>Consultas realizadas</td><td>285.000</td></tr><tr><td>Internamentos</td><td>38.500</td></tr><tr><td>Taxa de ocupação</td><td>92%</td></tr><tr><td>Tempo médio de espera nas urgências</td><td>8 horas</td></tr><tr><td>Mortalidade hospitalar</td><td>4,8%</td></tr><tr><td>Satisfação dos utentes</td><td>61%</td></tr><tr><td>Despesas operacionais</td><td>14,5 mil milhões Kz</td></tr></tbody></table><p>O Conselho de Direcção pretende elaborar um novo <strong>Plano Estratégico 2027–2031</strong>.</p>",
    "partes": [
      {
        "parte": "I",
        "titulo": "Missão, Visão e Valores",
        "contextoHtml": "<p>Actualmente o hospital possui:</p><table class='dados'><tbody><tr><th style='width:110px'>Missão</th><td>«Prestar assistência médica à população através de serviços hospitalares acessíveis.»</td></tr><tr><th>Visão</th><td>«Ser um hospital de referência.»</td></tr><tr><th>Valores</th><td>Respeito · Responsabilidade · Profissionalismo</td></tr></tbody></table>",
        "questoes": [
          {
            "numero": "Questão 1",
            "itens": [
              {
                "id": "Q1a",
                "alinea": "a)",
                "enunciado": "Identifique as principais limitações da missão, visão e valores apresentados.",
                "pontos": 3,
                "widget": "textarea",
                "config": {
                  "linhas": 5,
                  "placeholder": "Analise cada elemento: o que falta? o que é vago? o que não é mensurável?"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "vaga|generica|pouco especifica:1;sem populacao alvo|nao define populacao|nao identifica os utentes:1;sem indicadores|nao mensuravel|sem prazo:1;pouco diferenciadora|pouco inspiradora|nao inspira:1"
                  }
                ]
              },
              {
                "id": "Q1b",
                "alinea": "b)",
                "enunciado": "Reformule a Missão.",
                "pontos": 4,
                "widget": "textarea",
                "config": {
                  "linhas": 4,
                  "placeholder": "Missão reformulada (quem somos, o que fazemos, para quem e com que diferencial)"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "acessivel|acesso:1;qualidade|seguranca:1;inovacao|inovador|tecnologia:1;populacao|comunidade|humanizado|cabinda:1"
                  }
                ]
              },
              {
                "id": "Q1c",
                "alinea": "c)",
                "enunciado": "Reformule a Visão.",
                "pontos": 3,
                "widget": "textarea",
                "config": {
                  "linhas": 3,
                  "placeholder": "Visão reformulada (onde queremos chegar, com que âmbito e até quando)"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "referencia|excelencia:1;regional|nacional|angola|africa:1;2031|ate 2031|prazo|2027:1"
                  }
                ]
              },
              {
                "id": "Q1d",
                "alinea": "d)",
                "enunciado": "Acrescente pelo menos cinco valores institucionais adequados à realidade actual do Sistema Nacional de Saúde de Angola.",
                "pontos": 5,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "valor",
                      "label": "Valor institucional",
                      "tipo": "texto",
                      "largura": "34%"
                    },
                    {
                      "key": "significado",
                      "label": "O que significa na prática do hospital",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {},
                    {},
                    {}
                  ],
                  "adicionar": true,
                  "remover": true,
                  "minLinhas": 5,
                  "rotuloAdicionar": "Adicionar valor"
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "valor"
                    ],
                    "pontosPorLinha": 1,
                    "maxLinhas": 5
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "II",
        "titulo": "Análise SWOT",
        "contextoHtml": "<p>Após entrevistas realizadas junto dos gestores hospitalares foram identificadas as seguintes situações:</p><div class='duas-colunas'><div><h5>Situação interna</h5><ol><li>Existência de médicos especialistas experientes;</li><li>Equipamentos de imagiologia obsoletos;</li><li>Sistema de informação hospitalar parcialmente informatizado;</li><li>Elevada rotatividade de enfermeiros;</li><li>Forte reputação clínica em cirurgia geral.</li></ol></div><div><h5>Situação externa</h5><ol><li>Crescimento populacional de Luanda;</li><li>Aumento de doenças não transmissíveis;</li><li>Programa governamental de digitalização da saúde;</li><li>Crescimento de clínicas privadas concorrentes;</li><li>Instabilidade cambial que afecta a importação de medicamentos.</li></ol></div></div>",
        "questoes": [
          {
            "numero": "Questão 2",
            "itens": [
              {
                "id": "Q2a",
                "alinea": "a)",
                "enunciado": "Construa a Matriz SWOT.",
                "pontos": 8,
                "widget": "swot",
                "config": {
                  "quadrantes": [
                    {
                      "key": "Forças",
                      "label": "Forças (S)",
                      "sub": "Interno · positivo",
                      "cor": "verde",
                      "itens": 3
                    },
                    {
                      "key": "Fraquezas",
                      "label": "Fraquezas (W)",
                      "sub": "Interno · negativo",
                      "cor": "vermelho",
                      "itens": 3
                    },
                    {
                      "key": "Oportunidades",
                      "label": "Oportunidades (O)",
                      "sub": "Externo · positivo",
                      "cor": "azul",
                      "itens": 3
                    },
                    {
                      "key": "Ameaças",
                      "label": "Ameaças (T)",
                      "sub": "Externo · negativo",
                      "cor": "laranja",
                      "itens": 3
                    }
                  ]
                },
                "correcao": [
                  {
                    "tipo": "grupos",
                    "colunaGrupo": "grupo",
                    "colunaConteudo": "item",
                    "grupos": [
                      "Forças",
                      "Fraquezas",
                      "Oportunidades",
                      "Ameaças"
                    ],
                    "minPorGrupo": 2,
                    "pontosPorGrupo": 2
                  }
                ]
              },
              {
                "id": "Q2b",
                "alinea": "b)",
                "enunciado": "Desenvolva 2 estratégias FO, 2 estratégias FA, 2 estratégias DO e 2 estratégias DA.",
                "pontos": 8,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "tipo",
                      "label": "Tipo",
                      "tipo": "texto",
                      "bloqueado": true,
                      "largura": "80px"
                    },
                    {
                      "key": "estrategia",
                      "label": "Estratégia",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {
                      "tipo": "FO"
                    },
                    {
                      "tipo": "FO"
                    },
                    {
                      "tipo": "FA"
                    },
                    {
                      "tipo": "FA"
                    },
                    {
                      "tipo": "DO"
                    },
                    {
                      "tipo": "DO"
                    },
                    {
                      "tipo": "DA"
                    },
                    {
                      "tipo": "DA"
                    }
                  ],
                  "adicionar": false,
                  "remover": false,
                  "legenda": "FO = usar forças para aproveitar oportunidades · FA = usar forças para enfrentar ameaças · DO = corrigir fraquezas aproveitando oportunidades · DA = reduzir fraquezas e evitar ameaças"
                },
                "correcao": [
                  {
                    "tipo": "grupos",
                    "colunaGrupo": "tipo",
                    "colunaConteudo": "estrategia",
                    "grupos": [
                      "FO",
                      "FA",
                      "DO",
                      "DA"
                    ],
                    "minPorGrupo": 2,
                    "pontosPorGrupo": 2
                  }
                ]
              },
              {
                "id": "Q2c",
                "alinea": "c)",
                "enunciado": "Identifique qual das quatro categorias estratégicas deve ser priorizada e justifique.",
                "pontos": 2,
                "widget": "escolha",
                "config": {
                  "opcoes": [
                    "FO",
                    "FA",
                    "DO",
                    "DA"
                  ],
                  "rotuloEscolha": "Categoria a priorizar",
                  "rotuloJustificacao": "Justificação",
                  "linhas": 4
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "campo": "justificacao",
                    "termos": "fraquezas|debilidades|internas:0.5;oportunidades|digitalizacao|crescimento:0.5;porque|dado que|uma vez que|permite:1"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "III",
        "titulo": "Análise PESTEL",
        "contextoHtml": "<p>Com base na realidade actual do sector da saúde em Angola, efectue uma análise PESTEL para o hospital, identificando pelo menos <strong>dois factores por dimensão</strong>.</p>",
        "questoes": [
          {
            "numero": "Questão 3",
            "itens": [
              {
                "id": "Q3a",
                "alinea": "",
                "enunciado": "Identifique pelo menos 2 factores Políticos, 2 Económicos, 2 Sociais, 2 Tecnológicos, 2 Ecológicos e 2 Legais.",
                "pontos": 12,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "dimensao",
                      "label": "Dimensão",
                      "tipo": "select",
                      "opcoes": [
                        "Político",
                        "Económico",
                        "Social",
                        "Tecnológico",
                        "Ecológico",
                        "Legal"
                      ],
                      "largura": "150px"
                    },
                    {
                      "key": "fator",
                      "label": "Factor identificado",
                      "tipo": "textarea"
                    },
                    {
                      "key": "implicacao",
                      "label": "Implicação para o hospital",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {
                      "dimensao": "Político"
                    },
                    {
                      "dimensao": "Político"
                    },
                    {
                      "dimensao": "Económico"
                    },
                    {
                      "dimensao": "Económico"
                    },
                    {
                      "dimensao": "Social"
                    },
                    {
                      "dimensao": "Social"
                    },
                    {
                      "dimensao": "Tecnológico"
                    },
                    {
                      "dimensao": "Tecnológico"
                    },
                    {
                      "dimensao": "Ecológico"
                    },
                    {
                      "dimensao": "Ecológico"
                    },
                    {
                      "dimensao": "Legal"
                    },
                    {
                      "dimensao": "Legal"
                    }
                  ],
                  "adicionar": true,
                  "remover": true,
                  "rotuloAdicionar": "Adicionar factor"
                },
                "correcao": [
                  {
                    "tipo": "grupos",
                    "colunaGrupo": "dimensao",
                    "colunaConteudo": "fator",
                    "grupos": [
                      "Político",
                      "Económico",
                      "Social",
                      "Tecnológico",
                      "Ecológico",
                      "Legal"
                    ],
                    "minPorGrupo": 2,
                    "pontosPorGrupo": 2
                  }
                ]
              },
              {
                "id": "Q3b",
                "alinea": "a)",
                "enunciado": "Indique os três factores com maior impacto estratégico.",
                "pontos": 2,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "fator",
                      "label": "Factor",
                      "tipo": "texto",
                      "largura": "40%"
                    },
                    {
                      "key": "porque",
                      "label": "Porque tem maior impacto",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {}
                  ],
                  "adicionar": false,
                  "remover": false
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "fator"
                    ],
                    "pontosPorLinha": 0.67,
                    "maxLinhas": 3
                  }
                ]
              },
              {
                "id": "Q3c",
                "alinea": "b)",
                "enunciado": "Indique os três factores com maior grau de incerteza.",
                "pontos": 2,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "fator",
                      "label": "Factor",
                      "tipo": "texto",
                      "largura": "40%"
                    },
                    {
                      "key": "porque",
                      "label": "Porque é mais incerto",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {}
                  ],
                  "adicionar": false,
                  "remover": false
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "fator"
                    ],
                    "pontosPorLinha": 0.67,
                    "maxLinhas": 3
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "IV",
        "titulo": "Regressão Linear Múltipla para Previsão",
        "contextoHtml": "<p>O hospital pretende prever a procura anual por consultas externas. Os dados históricos são:</p><table class='dados'><thead><tr><th>Ano</th><th>População (milhares) X₁</th><th>Médicos X₂</th><th>Consultas (milhares) Y</th></tr></thead><tbody><tr><td>2021</td><td>2300</td><td>220</td><td>210</td></tr><tr><td>2022</td><td>2400</td><td>230</td><td>225</td></tr><tr><td>2023</td><td>2500</td><td>240</td><td>242</td></tr><tr><td>2024</td><td>2600</td><td>245</td><td>260</td></tr><tr><td>2025</td><td>2800</td><td>255</td><td>285</td></tr></tbody></table><p>Após processamento estatístico obteve-se:</p><p class='formula'>Y = −125 + 0,12·X₁ + 0,35·X₂</p>",
        "questoes": [
          {
            "numero": "Questão 4",
            "itens": [
              {
                "id": "Q4a",
                "alinea": "a)",
                "enunciado": "Interprete economicamente cada coeficiente.",
                "pontos": 3,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "coef",
                      "label": "Coeficiente",
                      "tipo": "texto",
                      "bloqueado": true,
                      "largura": "170px"
                    },
                    {
                      "key": "interpretacao",
                      "label": "Interpretação económica",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {
                      "coef": "Constante = −125"
                    },
                    {
                      "coef": "β₁ (População) = 0,12"
                    },
                    {
                      "coef": "β₂ (Médicos) = 0,35"
                    }
                  ],
                  "adicionar": false,
                  "remover": false
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "interpretacao"
                    ],
                    "pontosPorLinha": 0.7,
                    "maxLinhas": 3
                  },
                  {
                    "tipo": "palavras",
                    "termos": "0,12|0.12|120 consultas:0.5;0,35|0.35|350 consultas:0.4"
                  }
                ]
              },
              {
                "id": "Q4b",
                "alinea": "b)",
                "enunciado": "Calcule a previsão para 2027 considerando População = 3.100 mil habitantes e Médicos = 280.",
                "pontos": 3,
                "widget": "calculo",
                "config": {
                  "rotuloCalculo": "Apresente o cálculo (substituição na equação)",
                  "rotuloResultado": "Previsão de consultas para 2027",
                  "sufixo": "mil consultas",
                  "linhas": 3,
                  "placeholderCalculo": "Y = −125 + 0,12 × ____ + 0,35 × ____ = ____"
                },
                "correcao": [
                  {
                    "tipo": "numero",
                    "campo": "valor",
                    "valor": 345,
                    "tolerancia": 0.02,
                    "pontos": 2
                  },
                  {
                    "tipo": "palavras",
                    "campo": "calculo",
                    "termos": "3100|3.100:0.5;280:0.5"
                  }
                ]
              },
              {
                "id": "Q4c",
                "alinea": "c)",
                "enunciado": "Explique porque a regressão múltipla é mais adequada do que uma regressão simples neste caso.",
                "pontos": 2,
                "widget": "textarea",
                "config": {
                  "linhas": 4
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "duas variaveis|mais de uma variavel|duas variaveis independentes|populacao e medicos:1;poder explicativo|r2|r quadrado|explica melhor:0.5;isola o efeito|efeito conjunto|controla:0.5"
                  }
                ]
              },
              {
                "id": "Q4d",
                "alinea": "d)",
                "enunciado": "Identifique duas limitações do modelo.",
                "pontos": 2,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "limitacao",
                      "label": "Limitação",
                      "tipo": "texto",
                      "largura": "40%"
                    },
                    {
                      "key": "porque",
                      "label": "Porquê",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {}
                  ],
                  "adicionar": true,
                  "remover": true,
                  "rotuloAdicionar": "Adicionar limitação"
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "limitacao"
                    ],
                    "pontosPorLinha": 1,
                    "maxLinhas": 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "V",
        "titulo": "Matriz GUT",
        "contextoHtml": "<p>Com base nas análises anteriores foram identificados os seguintes problemas: longo tempo de espera nas urgências, equipamentos obsoletos, rotatividade de enfermeiros, falta de medicamentos e sistema informático limitado.</p>",
        "questoes": [
          {
            "numero": "Questão 5",
            "itens": [
              {
                "id": "Q5a",
                "alinea": "a), b), c)",
                "enunciado": "Atribua valores de Gravidade, Urgência e Tendência (1 a 5), construa a Matriz GUT e priorize os problemas.",
                "pontos": 5,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "problema",
                      "label": "Problema",
                      "tipo": "texto",
                      "bloqueado": true
                    },
                    {
                      "key": "g",
                      "label": "G",
                      "tipo": "select",
                      "opcoes": [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                      ],
                      "largura": "70px"
                    },
                    {
                      "key": "u",
                      "label": "U",
                      "tipo": "select",
                      "opcoes": [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                      ],
                      "largura": "70px"
                    },
                    {
                      "key": "t",
                      "label": "T",
                      "tipo": "select",
                      "opcoes": [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                      ],
                      "largura": "70px"
                    },
                    {
                      "key": "gut",
                      "label": "G×U×T",
                      "tipo": "produto",
                      "fonte": [
                        "g",
                        "u",
                        "t"
                      ],
                      "largura": "80px"
                    },
                    {
                      "key": "ordem",
                      "label": "Prioridade",
                      "tipo": "select",
                      "opcoes": [
                        "1.º",
                        "2.º",
                        "3.º",
                        "4.º",
                        "5.º"
                      ],
                      "largura": "110px"
                    }
                  ],
                  "linhas": [
                    {
                      "problema": "Longo tempo de espera nas urgências"
                    },
                    {
                      "problema": "Equipamentos obsoletos"
                    },
                    {
                      "problema": "Rotatividade de enfermeiros"
                    },
                    {
                      "problema": "Falta de medicamentos"
                    },
                    {
                      "problema": "Sistema informático limitado"
                    }
                  ],
                  "adicionar": false,
                  "remover": false,
                  "legenda": "1 = muito baixo · 5 = muito alto. A coluna G×U×T é calculada automaticamente; a prioridade é atribuída por si."
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "g",
                      "u",
                      "t",
                      "ordem"
                    ],
                    "pontosPorLinha": 1,
                    "maxLinhas": 5
                  }
                ]
              },
              {
                "id": "Q5b",
                "alinea": "d)",
                "enunciado": "Justifique a prioridade atribuída ao problema mais crítico.",
                "pontos": 2,
                "widget": "textarea",
                "config": {
                  "linhas": 4
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "gravidade:0.5;urgencia:0.5;tendencia:0.5;tempo de espera|urgencias|mortalidade|satisfacao:0.5"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "VI",
        "titulo": "Metas SMART",
        "contextoHtml": "<p>Considerando que o principal problema identificado foi:</p><p class='destaque'>«Tempo médio de espera nas urgências igual a 8 horas.»</p>",
        "questoes": [
          {
            "numero": "Questão 6",
            "itens": [
              {
                "id": "Q6a",
                "alinea": "",
                "enunciado": "Transforme o problema numa Meta SMART completa (Specific, Measurable, Achievable, Relevant, Time-Bound).",
                "pontos": 5,
                "widget": "smart",
                "config": {
                  "campos": [
                    {
                      "key": "s",
                      "letra": "S",
                      "label": "Specific — Específica",
                      "dica": "O que exactamente vai ser feito e onde?"
                    },
                    {
                      "key": "m",
                      "letra": "M",
                      "label": "Measurable — Mensurável",
                      "dica": "Que indicador e que valor? De 8 horas para quanto?"
                    },
                    {
                      "key": "a",
                      "letra": "A",
                      "label": "Achievable — Alcançável",
                      "dica": "Com que recursos é possível?"
                    },
                    {
                      "key": "r",
                      "letra": "R",
                      "label": "Relevant — Relevante",
                      "dica": "Porque é que importa para o hospital?"
                    },
                    {
                      "key": "t",
                      "letra": "T",
                      "label": "Time-Bound — Temporal",
                      "dica": "Até que data?"
                    }
                  ],
                  "rotuloMeta": "Redacção final da meta (uma frase)"
                },
                "correcao": [
                  {
                    "tipo": "campos",
                    "campos": [
                      "s",
                      "m",
                      "a",
                      "r",
                      "t"
                    ],
                    "pontosPorCampo": 0.8,
                    "minCaracteres": 8
                  },
                  {
                    "tipo": "palavras",
                    "campo": "meta",
                    "termos": "horas|%|por cento:0.5;ate|2027|2028|meses:0.5"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "VII",
        "titulo": "Plano de Acção — Modelo 5W2H",
        "contextoHtml": "<p>Elabore o Plano de Acção da meta anteriormente definida. <span class='valor-parte'>10 valores</span></p>",
        "questoes": [
          {
            "numero": "Questão 8",
            "itens": [
              {
                "id": "Q8a",
                "alinea": "",
                "enunciado": "Desenvolva um modelo 5W2H completo contendo What, Why, Where, When, Who, How e How Much.",
                "pontos": 10,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "what",
                      "label": "What — O quê",
                      "tipo": "textarea"
                    },
                    {
                      "key": "why",
                      "label": "Why — Porquê",
                      "tipo": "textarea"
                    },
                    {
                      "key": "where",
                      "label": "Where — Onde",
                      "tipo": "texto"
                    },
                    {
                      "key": "when",
                      "label": "When — Quando",
                      "tipo": "texto"
                    },
                    {
                      "key": "who",
                      "label": "Who — Quem",
                      "tipo": "texto"
                    },
                    {
                      "key": "how",
                      "label": "How — Como",
                      "tipo": "textarea"
                    },
                    {
                      "key": "howmuch",
                      "label": "How much — Quanto",
                      "tipo": "texto"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {}
                  ],
                  "adicionar": true,
                  "remover": true,
                  "minLinhas": 1,
                  "rotuloAdicionar": "Adicionar acção ao plano",
                  "legenda": "Cada linha é uma acção do plano. Acrescente tantas linhas quantas as acções necessárias."
                },
                "correcao": [
                  {
                    "tipo": "matriz",
                    "colunas": [
                      "what",
                      "why",
                      "where",
                      "when",
                      "who",
                      "how",
                      "howmuch"
                    ],
                    "pontosPorColuna": 1,
                    "pontosPorLinhaExtra": 1.5,
                    "maxLinhasExtra": 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "IX",
        "titulo": "Rede PERT e Caminho Crítico",
        "contextoHtml": "<p>Para implementar o projecto de redução do tempo de espera nas urgências foram definidas as seguintes actividades:</p><table class='dados'><thead><tr><th>Act.</th><th>Descrição</th><th>Precedência</th><th>Duração (dias)</th></tr></thead><tbody><tr><td>A</td><td>Diagnóstico dos processos</td><td>—</td><td>5</td></tr><tr><td>B</td><td>Aquisição de software</td><td>A</td><td>8</td></tr><tr><td>C</td><td>Reorganização do fluxo de pacientes</td><td>A</td><td>6</td></tr><tr><td>D</td><td>Formação dos profissionais</td><td>B</td><td>4</td></tr><tr><td>E</td><td>Instalação do software</td><td>B</td><td>3</td></tr><tr><td>F</td><td>Implementação do novo protocolo</td><td>C e D</td><td>5</td></tr><tr><td>G</td><td>Testes operacionais</td><td>E e F</td><td>4</td></tr><tr><td>H</td><td>Entrada em funcionamento</td><td>G</td><td>2</td></tr></tbody></table>",
        "questoes": [
          {
            "numero": "Questão 9",
            "itens": [
              {
                "id": "Q9a",
                "alinea": "a)",
                "enunciado": "Desenhe a Rede PERT.",
                "pontos": 5,
                "widget": "pert",
                "config": {
                  "instrucoes": "Lance as actividades do projecto no quadro (código, descrição, precedências e duração). O diagrama é desenhado automaticamente a partir das precedências que indicar. Depois clique nas actividades do diagrama para marcar o caminho crítico.",
                  "atividades": [
                    {},
                    {},
                    {},
                    {}
                  ],
                  "linhasVazias": 5
                },
                "correcao": [
                  {
                    "tipo": "pertRede",
                    "pontos": 5,
                    "referencia": [
                      {
                        "id": "A",
                        "descricao": "Diagnóstico dos processos",
                        "precedencias": "",
                        "duracao": 5
                      },
                      {
                        "id": "B",
                        "descricao": "Aquisição de software",
                        "precedencias": "A",
                        "duracao": 8
                      },
                      {
                        "id": "C",
                        "descricao": "Reorganização do fluxo de pacientes",
                        "precedencias": "A",
                        "duracao": 6
                      },
                      {
                        "id": "D",
                        "descricao": "Formação dos profissionais",
                        "precedencias": "B",
                        "duracao": 4
                      },
                      {
                        "id": "E",
                        "descricao": "Instalação do software",
                        "precedencias": "B",
                        "duracao": 3
                      },
                      {
                        "id": "F",
                        "descricao": "Implementação do novo protocolo",
                        "precedencias": "C, D",
                        "duracao": 5
                      },
                      {
                        "id": "G",
                        "descricao": "Testes operacionais",
                        "precedencias": "E, F",
                        "duracao": 4
                      },
                      {
                        "id": "H",
                        "descricao": "Entrada em funcionamento",
                        "precedencias": "G",
                        "duracao": 2
                      }
                    ]
                  }
                ]
              },
              {
                "id": "Q9b",
                "alinea": "b)",
                "enunciado": "Identifique o Caminho Crítico.",
                "pontos": 2,
                "widget": "texto",
                "config": {
                  "placeholder": "Ex.: A – B – … – H",
                  "usarCaminhoMarcado": "Q9a"
                },
                "correcao": [
                  {
                    "tipo": "sequencia",
                    "valor": "ABDFGH",
                    "pontos": 2
                  }
                ]
              },
              {
                "id": "Q9c",
                "alinea": "c)",
                "enunciado": "Determine a duração total do projecto.",
                "pontos": 2,
                "widget": "numero",
                "config": {
                  "sufixo": "dias"
                },
                "correcao": [
                  {
                    "tipo": "numero",
                    "campo": "valor",
                    "valor": 28,
                    "tolerancia": 0.001,
                    "pontos": 2
                  }
                ]
              },
              {
                "id": "Q9d",
                "alinea": "d)",
                "enunciado": "Se a actividade D atrasar 3 dias, qual será a nova duração total do projecto?",
                "pontos": 2,
                "widget": "numero",
                "config": {
                  "sufixo": "dias"
                },
                "correcao": [
                  {
                    "tipo": "numero",
                    "campo": "valor",
                    "valor": 31,
                    "tolerancia": 0.001,
                    "pontos": 2
                  }
                ]
              },
              {
                "id": "Q9e",
                "alinea": "d)",
                "enunciado": "Explique o impacto desse atraso no prazo final do projecto.",
                "pontos": 1,
                "widget": "textarea",
                "config": {
                  "linhas": 3,
                  "placeholder": "A actividade D pertence (ou não) ao caminho crítico, logo…"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "caminho critico|critica:0.5;3 dias|tres dias|31:0.5;sem folga|folga zero|atrasa todo o projecto:0.5"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "tempoLimiteMin": 180,
    "tipo": "oficial",
    "disponivelEm": "2026-08-29",
    "horaInicio": "00:00",
    "horaFim": "23:59"
  },
  {
    "examId": "ensaio2027",
    "titulo": "ENSAIO — Planeamento Estratégico em Gestão",
    "descricao": "Ambiente de treino · Caso: Hospital Geral Provincial do Uíge · pode repetir as vezes que quiser",
    "contextoHtml": "<h4>Contexto do caso (ensaio)</h4><p>Esta é uma prova de treino, com a mesma estrutura da prova oficial mas com outro caso e outros dados. Pode repeti-la as vezes que quiser.</p><p>O <strong>Hospital Geral Provincial do Uíge</strong> serve uma população estimada de 1,9 milhões de habitantes. Nos últimos anos acumulou pressão sobre as urgências, dificuldades de manutenção do equipamento e perda de quadros para o sector privado.</p><p><strong>Em 2025, o hospital registou:</strong></p><table class='dados'><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody><tr><td>Consultas realizadas</td><td>198.000</td></tr><tr><td>Internamentos</td><td>24.300</td></tr><tr><td>Taxa de ocupação</td><td>87%</td></tr><tr><td>Tempo médio de espera nas urgências</td><td>6 horas</td></tr><tr><td>Mortalidade hospitalar</td><td>5,4%</td></tr><tr><td>Satisfação dos utentes</td><td>58%</td></tr><tr><td>Despesas operacionais</td><td>9,8 mil milhões Kz</td></tr></tbody></table><p>O Conselho de Direcção prepara o <strong>Plano Estratégico 2027–2031</strong>.</p>",
    "partes": [
      {
        "parte": "I",
        "titulo": "Missão, Visão e Valores",
        "contextoHtml": "<p>Actualmente o hospital possui:</p><table class='dados'><tbody><tr><th style='width:110px'>Missão</th><td>«Tratar os doentes do Uíge com os meios disponíveis.»</td></tr><tr><th>Visão</th><td>«Crescer e melhorar.»</td></tr><tr><th>Valores</th><td>Dedicação · Disciplina</td></tr></tbody></table>",
        "questoes": [
          {
            "numero": "Questão 1",
            "itens": [
              {
                "id": "Q1a",
                "alinea": "a)",
                "enunciado": "Identifique as principais limitações da missão, visão e valores apresentados.",
                "pontos": 3,
                "widget": "textarea",
                "config": {
                  "linhas": 5,
                  "placeholder": "Analise cada elemento: o que falta? o que é vago? o que não é mensurável?"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "vaga|generica|pouco especifica:1;sem populacao alvo|nao define populacao|nao identifica os utentes:1;sem indicadores|nao mensuravel|sem prazo:1;pouco diferenciadora|pouco inspiradora|nao inspira:1"
                  }
                ]
              },
              {
                "id": "Q1b",
                "alinea": "b)",
                "enunciado": "Reformule a Missão.",
                "pontos": 4,
                "widget": "textarea",
                "config": {
                  "linhas": 4,
                  "placeholder": "Missão reformulada (quem somos, o que fazemos, para quem e com que diferencial)"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "acessivel|acesso:1;qualidade|seguranca:1;inovacao|inovador|tecnologia:1;populacao|comunidade|humanizado|cabinda:1"
                  }
                ]
              },
              {
                "id": "Q1c",
                "alinea": "c)",
                "enunciado": "Reformule a Visão.",
                "pontos": 3,
                "widget": "textarea",
                "config": {
                  "linhas": 3,
                  "placeholder": "Visão reformulada (onde queremos chegar, com que âmbito e até quando)"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "referencia|excelencia:1;regional|nacional|angola|africa:1;2031|ate 2031|prazo|2027:1"
                  }
                ]
              },
              {
                "id": "Q1d",
                "alinea": "d)",
                "enunciado": "Acrescente pelo menos cinco valores institucionais adequados à realidade actual do Sistema Nacional de Saúde de Angola.",
                "pontos": 5,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "valor",
                      "label": "Valor institucional",
                      "tipo": "texto",
                      "largura": "34%"
                    },
                    {
                      "key": "significado",
                      "label": "O que significa na prática do hospital",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {},
                    {},
                    {}
                  ],
                  "adicionar": true,
                  "remover": true,
                  "minLinhas": 5,
                  "rotuloAdicionar": "Adicionar valor"
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "valor"
                    ],
                    "pontosPorLinha": 1,
                    "maxLinhas": 5
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "II",
        "titulo": "Análise SWOT",
        "contextoHtml": "<p>Das entrevistas aos gestores hospitalares resultaram as seguintes situações:</p><div class='duas-colunas'><div><h5>Situação interna</h5><ol><li>Equipa de enfermagem estável e experiente;</li><li>Bloco operatório com avarias frequentes;</li><li>Registo clínico ainda em papel;</li><li>Falta de médicos especialistas em pediatria;</li><li>Boa articulação com os centros de saúde municipais.</li></ol></div><div><h5>Situação externa</h5><ol><li>População jovem em crescimento na província;</li><li>Aumento dos acidentes de viação;</li><li>Financiamento público para reabilitação de infra-estruturas;</li><li>Saída de quadros para clínicas privadas de Luanda;</li><li>Ruptura frequente no fornecimento de energia eléctrica.</li></ol></div></div>",
        "questoes": [
          {
            "numero": "Questão 2",
            "itens": [
              {
                "id": "Q2a",
                "alinea": "a)",
                "enunciado": "Construa a Matriz SWOT.",
                "pontos": 8,
                "widget": "swot",
                "config": {
                  "quadrantes": [
                    {
                      "key": "Forças",
                      "label": "Forças (S)",
                      "sub": "Interno · positivo",
                      "cor": "verde",
                      "itens": 3
                    },
                    {
                      "key": "Fraquezas",
                      "label": "Fraquezas (W)",
                      "sub": "Interno · negativo",
                      "cor": "vermelho",
                      "itens": 3
                    },
                    {
                      "key": "Oportunidades",
                      "label": "Oportunidades (O)",
                      "sub": "Externo · positivo",
                      "cor": "azul",
                      "itens": 3
                    },
                    {
                      "key": "Ameaças",
                      "label": "Ameaças (T)",
                      "sub": "Externo · negativo",
                      "cor": "laranja",
                      "itens": 3
                    }
                  ]
                },
                "correcao": [
                  {
                    "tipo": "grupos",
                    "colunaGrupo": "grupo",
                    "colunaConteudo": "item",
                    "grupos": [
                      "Forças",
                      "Fraquezas",
                      "Oportunidades",
                      "Ameaças"
                    ],
                    "minPorGrupo": 2,
                    "pontosPorGrupo": 2
                  }
                ]
              },
              {
                "id": "Q2b",
                "alinea": "b)",
                "enunciado": "Desenvolva 2 estratégias FO, 2 estratégias FA, 2 estratégias DO e 2 estratégias DA.",
                "pontos": 8,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "tipo",
                      "label": "Tipo",
                      "tipo": "texto",
                      "bloqueado": true,
                      "largura": "80px"
                    },
                    {
                      "key": "estrategia",
                      "label": "Estratégia",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {
                      "tipo": "FO"
                    },
                    {
                      "tipo": "FO"
                    },
                    {
                      "tipo": "FA"
                    },
                    {
                      "tipo": "FA"
                    },
                    {
                      "tipo": "DO"
                    },
                    {
                      "tipo": "DO"
                    },
                    {
                      "tipo": "DA"
                    },
                    {
                      "tipo": "DA"
                    }
                  ],
                  "adicionar": false,
                  "remover": false,
                  "legenda": "FO = usar forças para aproveitar oportunidades · FA = usar forças para enfrentar ameaças · DO = corrigir fraquezas aproveitando oportunidades · DA = reduzir fraquezas e evitar ameaças"
                },
                "correcao": [
                  {
                    "tipo": "grupos",
                    "colunaGrupo": "tipo",
                    "colunaConteudo": "estrategia",
                    "grupos": [
                      "FO",
                      "FA",
                      "DO",
                      "DA"
                    ],
                    "minPorGrupo": 2,
                    "pontosPorGrupo": 2
                  }
                ]
              },
              {
                "id": "Q2c",
                "alinea": "c)",
                "enunciado": "Identifique qual das quatro categorias estratégicas deve ser priorizada e justifique.",
                "pontos": 2,
                "widget": "escolha",
                "config": {
                  "opcoes": [
                    "FO",
                    "FA",
                    "DO",
                    "DA"
                  ],
                  "rotuloEscolha": "Categoria a priorizar",
                  "rotuloJustificacao": "Justificação",
                  "linhas": 4
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "campo": "justificacao",
                    "termos": "fraquezas|debilidades|internas:0.5;oportunidades|digitalizacao|crescimento:0.5;porque|dado que|uma vez que|permite:1"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "III",
        "titulo": "Análise PESTEL",
        "contextoHtml": "<p>Com base na realidade actual do sector da saúde em Angola, efectue uma análise PESTEL para o hospital, identificando pelo menos <strong>dois factores por dimensão</strong>.</p>",
        "questoes": [
          {
            "numero": "Questão 3",
            "itens": [
              {
                "id": "Q3a",
                "alinea": "",
                "enunciado": "Identifique pelo menos 2 factores Políticos, 2 Económicos, 2 Sociais, 2 Tecnológicos, 2 Ecológicos e 2 Legais.",
                "pontos": 12,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "dimensao",
                      "label": "Dimensão",
                      "tipo": "select",
                      "opcoes": [
                        "Político",
                        "Económico",
                        "Social",
                        "Tecnológico",
                        "Ecológico",
                        "Legal"
                      ],
                      "largura": "150px"
                    },
                    {
                      "key": "fator",
                      "label": "Factor identificado",
                      "tipo": "textarea"
                    },
                    {
                      "key": "implicacao",
                      "label": "Implicação para o hospital",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {
                      "dimensao": "Político"
                    },
                    {
                      "dimensao": "Político"
                    },
                    {
                      "dimensao": "Económico"
                    },
                    {
                      "dimensao": "Económico"
                    },
                    {
                      "dimensao": "Social"
                    },
                    {
                      "dimensao": "Social"
                    },
                    {
                      "dimensao": "Tecnológico"
                    },
                    {
                      "dimensao": "Tecnológico"
                    },
                    {
                      "dimensao": "Ecológico"
                    },
                    {
                      "dimensao": "Ecológico"
                    },
                    {
                      "dimensao": "Legal"
                    },
                    {
                      "dimensao": "Legal"
                    }
                  ],
                  "adicionar": true,
                  "remover": true,
                  "rotuloAdicionar": "Adicionar factor"
                },
                "correcao": [
                  {
                    "tipo": "grupos",
                    "colunaGrupo": "dimensao",
                    "colunaConteudo": "fator",
                    "grupos": [
                      "Político",
                      "Económico",
                      "Social",
                      "Tecnológico",
                      "Ecológico",
                      "Legal"
                    ],
                    "minPorGrupo": 2,
                    "pontosPorGrupo": 2
                  }
                ]
              },
              {
                "id": "Q3b",
                "alinea": "a)",
                "enunciado": "Indique os três factores com maior impacto estratégico.",
                "pontos": 2,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "fator",
                      "label": "Factor",
                      "tipo": "texto",
                      "largura": "40%"
                    },
                    {
                      "key": "porque",
                      "label": "Porque tem maior impacto",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {}
                  ],
                  "adicionar": false,
                  "remover": false
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "fator"
                    ],
                    "pontosPorLinha": 0.67,
                    "maxLinhas": 3
                  }
                ]
              },
              {
                "id": "Q3c",
                "alinea": "b)",
                "enunciado": "Indique os três factores com maior grau de incerteza.",
                "pontos": 2,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "fator",
                      "label": "Factor",
                      "tipo": "texto",
                      "largura": "40%"
                    },
                    {
                      "key": "porque",
                      "label": "Porque é mais incerto",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {}
                  ],
                  "adicionar": false,
                  "remover": false
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "fator"
                    ],
                    "pontosPorLinha": 0.67,
                    "maxLinhas": 3
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "IV",
        "titulo": "Regressão Linear Múltipla para Previsão",
        "contextoHtml": "<p>O hospital pretende prever a procura anual por consultas externas. Os dados históricos são:</p><table class='dados'><thead><tr><th>Ano</th><th>População (milhares) X₁</th><th>Médicos X₂</th><th>Consultas (milhares) Y</th></tr></thead><tbody><tr><td>2021</td><td>1600</td><td>120</td><td>118</td></tr><tr><td>2022</td><td>1700</td><td>135</td><td>134</td></tr><tr><td>2023</td><td>1800</td><td>145</td><td>148</td></tr><tr><td>2024</td><td>1850</td><td>155</td><td>157</td></tr><tr><td>2025</td><td>1900</td><td>160</td><td>198</td></tr></tbody></table><p>Após processamento estatístico obteve-se:</p><p class='formula'>Y = −90 + 0,10·X₁ + 0,40·X₂</p>",
        "questoes": [
          {
            "numero": "Questão 4",
            "itens": [
              {
                "id": "Q4a",
                "alinea": "a)",
                "enunciado": "Interprete economicamente cada coeficiente.",
                "pontos": 3,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "coef",
                      "label": "Coeficiente",
                      "tipo": "texto",
                      "bloqueado": true,
                      "largura": "170px"
                    },
                    {
                      "key": "interpretacao",
                      "label": "Interpretação económica",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {
                      "coef": "Constante = −90"
                    },
                    {
                      "coef": "β₁ (População) = 0,10"
                    },
                    {
                      "coef": "β₂ (Médicos) = 0,40"
                    }
                  ],
                  "adicionar": false,
                  "remover": false
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "interpretacao"
                    ],
                    "pontosPorLinha": 0.7,
                    "maxLinhas": 3
                  },
                  {
                    "tipo": "palavras",
                    "termos": "0,10|0.10|100 consultas:0.5;0,40|0.40|400 consultas:0.4"
                  }
                ]
              },
              {
                "id": "Q4b",
                "alinea": "b)",
                "enunciado": "Calcule a previsão para 2027 considerando População = 2.300 mil habitantes e Médicos = 180.",
                "pontos": 3,
                "widget": "calculo",
                "config": {
                  "rotuloCalculo": "Apresente o cálculo (substituição na equação)",
                  "rotuloResultado": "Previsão de consultas para 2027",
                  "sufixo": "mil consultas",
                  "linhas": 3,
                  "placeholderCalculo": "Y = −125 + 0,12 × ____ + 0,35 × ____ = ____"
                },
                "correcao": [
                  {
                    "tipo": "numero",
                    "campo": "valor",
                    "valor": 212,
                    "tolerancia": 0.02,
                    "pontos": 2
                  },
                  {
                    "tipo": "palavras",
                    "campo": "calculo",
                    "termos": "2300|2.300:0.5;180:0.5"
                  }
                ]
              },
              {
                "id": "Q4c",
                "alinea": "c)",
                "enunciado": "Explique porque a regressão múltipla é mais adequada do que uma regressão simples neste caso.",
                "pontos": 2,
                "widget": "textarea",
                "config": {
                  "linhas": 4
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "duas variaveis|mais de uma variavel|duas variaveis independentes|populacao e medicos:1;poder explicativo|r2|r quadrado|explica melhor:0.5;isola o efeito|efeito conjunto|controla:0.5"
                  }
                ]
              },
              {
                "id": "Q4d",
                "alinea": "d)",
                "enunciado": "Identifique duas limitações do modelo.",
                "pontos": 2,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "limitacao",
                      "label": "Limitação",
                      "tipo": "texto",
                      "largura": "40%"
                    },
                    {
                      "key": "porque",
                      "label": "Porquê",
                      "tipo": "textarea"
                    }
                  ],
                  "linhas": [
                    {},
                    {}
                  ],
                  "adicionar": true,
                  "remover": true,
                  "rotuloAdicionar": "Adicionar limitação"
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "limitacao"
                    ],
                    "pontosPorLinha": 1,
                    "maxLinhas": 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "V",
        "titulo": "Matriz GUT",
        "contextoHtml": "<p>Das análises anteriores resultaram os seguintes problemas: longo tempo de espera nas urgências, avarias no bloco operatório, registo clínico em papel, falta de pediatras e cortes de energia eléctrica.</p>",
        "questoes": [
          {
            "numero": "Questão 5",
            "itens": [
              {
                "id": "Q5a",
                "alinea": "a), b), c)",
                "enunciado": "Atribua valores de Gravidade, Urgência e Tendência (1 a 5), construa a Matriz GUT e priorize os problemas.",
                "pontos": 5,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "problema",
                      "label": "Problema",
                      "tipo": "texto",
                      "bloqueado": true
                    },
                    {
                      "key": "g",
                      "label": "G",
                      "tipo": "select",
                      "opcoes": [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                      ],
                      "largura": "70px"
                    },
                    {
                      "key": "u",
                      "label": "U",
                      "tipo": "select",
                      "opcoes": [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                      ],
                      "largura": "70px"
                    },
                    {
                      "key": "t",
                      "label": "T",
                      "tipo": "select",
                      "opcoes": [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                      ],
                      "largura": "70px"
                    },
                    {
                      "key": "gut",
                      "label": "G×U×T",
                      "tipo": "produto",
                      "fonte": [
                        "g",
                        "u",
                        "t"
                      ],
                      "largura": "80px"
                    },
                    {
                      "key": "ordem",
                      "label": "Prioridade",
                      "tipo": "select",
                      "opcoes": [
                        "1.º",
                        "2.º",
                        "3.º",
                        "4.º",
                        "5.º"
                      ],
                      "largura": "110px"
                    }
                  ],
                  "linhas": [
                    {
                      "problema": "Longo tempo de espera nas urgências"
                    },
                    {
                      "problema": "Avarias no bloco operatório"
                    },
                    {
                      "problema": "Registo clínico em papel"
                    },
                    {
                      "problema": "Falta de pediatras"
                    },
                    {
                      "problema": "Cortes de energia eléctrica"
                    }
                  ],
                  "adicionar": false,
                  "remover": false,
                  "legenda": "1 = muito baixo · 5 = muito alto. A coluna G×U×T é calculada automaticamente; a prioridade é atribuída por si."
                },
                "correcao": [
                  {
                    "tipo": "linhas",
                    "colunas": [
                      "g",
                      "u",
                      "t",
                      "ordem"
                    ],
                    "pontosPorLinha": 1,
                    "maxLinhas": 5
                  }
                ]
              },
              {
                "id": "Q5b",
                "alinea": "d)",
                "enunciado": "Justifique a prioridade atribuída ao problema mais crítico.",
                "pontos": 2,
                "widget": "textarea",
                "config": {
                  "linhas": 4
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "gravidade:0.5;urgencia:0.5;tendencia:0.5;tempo de espera|urgencias|mortalidade|satisfacao:0.5"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "VI",
        "titulo": "Metas SMART",
        "contextoHtml": "<p>Considerando que o principal problema identificado foi:</p><p class='destaque'>«Tempo médio de espera nas urgências igual a 6 horas.»</p>",
        "questoes": [
          {
            "numero": "Questão 6",
            "itens": [
              {
                "id": "Q6a",
                "alinea": "",
                "enunciado": "Transforme o problema numa Meta SMART completa (Specific, Measurable, Achievable, Relevant, Time-Bound).",
                "pontos": 5,
                "widget": "smart",
                "config": {
                  "campos": [
                    {
                      "key": "s",
                      "letra": "S",
                      "label": "Specific — Específica",
                      "dica": "O que exactamente vai ser feito e onde?"
                    },
                    {
                      "key": "m",
                      "letra": "M",
                      "label": "Measurable — Mensurável",
                      "dica": "Que indicador e que valor? De 8 horas para quanto?"
                    },
                    {
                      "key": "a",
                      "letra": "A",
                      "label": "Achievable — Alcançável",
                      "dica": "Com que recursos é possível?"
                    },
                    {
                      "key": "r",
                      "letra": "R",
                      "label": "Relevant — Relevante",
                      "dica": "Porque é que importa para o hospital?"
                    },
                    {
                      "key": "t",
                      "letra": "T",
                      "label": "Time-Bound — Temporal",
                      "dica": "Até que data?"
                    }
                  ],
                  "rotuloMeta": "Redacção final da meta (uma frase)"
                },
                "correcao": [
                  {
                    "tipo": "campos",
                    "campos": [
                      "s",
                      "m",
                      "a",
                      "r",
                      "t"
                    ],
                    "pontosPorCampo": 0.8,
                    "minCaracteres": 8
                  },
                  {
                    "tipo": "palavras",
                    "campo": "meta",
                    "termos": "horas|%|por cento:0.5;ate|2027|2028|meses:0.5"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "VII",
        "titulo": "Plano de Acção — Modelo 5W2H",
        "contextoHtml": "<p>Elabore o Plano de Acção da meta anteriormente definida. <span class='valor-parte'>10 valores</span></p>",
        "questoes": [
          {
            "numero": "Questão 8",
            "itens": [
              {
                "id": "Q8a",
                "alinea": "",
                "enunciado": "Desenvolva um modelo 5W2H completo contendo What, Why, Where, When, Who, How e How Much.",
                "pontos": 10,
                "widget": "tabela",
                "config": {
                  "colunas": [
                    {
                      "key": "what",
                      "label": "What — O quê",
                      "tipo": "textarea"
                    },
                    {
                      "key": "why",
                      "label": "Why — Porquê",
                      "tipo": "textarea"
                    },
                    {
                      "key": "where",
                      "label": "Where — Onde",
                      "tipo": "texto"
                    },
                    {
                      "key": "when",
                      "label": "When — Quando",
                      "tipo": "texto"
                    },
                    {
                      "key": "who",
                      "label": "Who — Quem",
                      "tipo": "texto"
                    },
                    {
                      "key": "how",
                      "label": "How — Como",
                      "tipo": "textarea"
                    },
                    {
                      "key": "howmuch",
                      "label": "How much — Quanto",
                      "tipo": "texto"
                    }
                  ],
                  "linhas": [
                    {},
                    {},
                    {}
                  ],
                  "adicionar": true,
                  "remover": true,
                  "minLinhas": 1,
                  "rotuloAdicionar": "Adicionar acção ao plano",
                  "legenda": "Cada linha é uma acção do plano. Acrescente tantas linhas quantas as acções necessárias."
                },
                "correcao": [
                  {
                    "tipo": "matriz",
                    "colunas": [
                      "what",
                      "why",
                      "where",
                      "when",
                      "who",
                      "how",
                      "howmuch"
                    ],
                    "pontosPorColuna": 1,
                    "pontosPorLinhaExtra": 1.5,
                    "maxLinhasExtra": 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "parte": "IX",
        "titulo": "Rede PERT e Caminho Crítico",
        "contextoHtml": "<p>Para implementar o projecto de redução do tempo de espera nas urgências foram definidas as seguintes actividades:</p><table class='dados'><thead><tr><th>Act.</th><th>Descrição</th><th>Precedência</th><th>Duração (dias)</th></tr></thead><tbody><tr><td>A</td><td>Levantamento do circuito do doente</td><td>—</td><td>2</td></tr><tr><td>B</td><td>Contratação de pessoal para a triagem</td><td>A</td><td>4</td></tr><tr><td>C</td><td>Revisão do protocolo de triagem</td><td>A</td><td>3</td></tr><tr><td>D</td><td>Formação da equipa de triagem</td><td>B</td><td>5</td></tr><tr><td>E</td><td>Aquisição de equipamento de monitorização</td><td>C</td><td>6</td></tr><tr><td>F</td><td>Ensaio do novo circuito</td><td>D</td><td>3</td></tr><tr><td>G</td><td>Instalação do equipamento</td><td>E</td><td>2</td></tr><tr><td>H</td><td>Entrada em funcionamento</td><td>F e G</td><td>4</td></tr></tbody></table>",
        "questoes": [
          {
            "numero": "Questão 9",
            "itens": [
              {
                "id": "Q9a",
                "alinea": "a)",
                "enunciado": "Desenhe a Rede PERT.",
                "pontos": 5,
                "widget": "pert",
                "config": {
                  "instrucoes": "Lance as actividades do projecto no quadro (código, descrição, precedências e duração). O diagrama é desenhado automaticamente a partir das precedências que indicar. Depois clique nas actividades do diagrama para marcar o caminho crítico.",
                  "atividades": [
                    {},
                    {},
                    {},
                    {}
                  ],
                  "linhasVazias": 5
                },
                "correcao": [
                  {
                    "tipo": "pertRede",
                    "pontos": 5,
                    "referencia": [
                      {
                        "id": "A",
                        "descricao": "Levantamento do circuito do doente",
                        "precedencias": "",
                        "duracao": 2
                      },
                      {
                        "id": "B",
                        "descricao": "Contratação de pessoal para a triagem",
                        "precedencias": "A",
                        "duracao": 4
                      },
                      {
                        "id": "C",
                        "descricao": "Revisão do protocolo de triagem",
                        "precedencias": "A",
                        "duracao": 3
                      },
                      {
                        "id": "D",
                        "descricao": "Formação da equipa de triagem",
                        "precedencias": "B",
                        "duracao": 5
                      },
                      {
                        "id": "E",
                        "descricao": "Aquisição de equipamento de monitorização",
                        "precedencias": "C",
                        "duracao": 6
                      },
                      {
                        "id": "F",
                        "descricao": "Ensaio do novo circuito",
                        "precedencias": "D",
                        "duracao": 3
                      },
                      {
                        "id": "G",
                        "descricao": "Instalação do equipamento",
                        "precedencias": "E",
                        "duracao": 2
                      },
                      {
                        "id": "H",
                        "descricao": "Entrada em funcionamento",
                        "precedencias": "F, G",
                        "duracao": 4
                      }
                    ]
                  }
                ]
              },
              {
                "id": "Q9b",
                "alinea": "b)",
                "enunciado": "Identifique o Caminho Crítico.",
                "pontos": 2,
                "widget": "texto",
                "config": {
                  "placeholder": "Ex.: A – B – … – H",
                  "usarCaminhoMarcado": "Q9a"
                },
                "correcao": [
                  {
                    "tipo": "sequencia",
                    "valor": "ABDFH",
                    "pontos": 2
                  }
                ]
              },
              {
                "id": "Q9c",
                "alinea": "c)",
                "enunciado": "Determine a duração total do projecto.",
                "pontos": 2,
                "widget": "numero",
                "config": {
                  "sufixo": "dias"
                },
                "correcao": [
                  {
                    "tipo": "numero",
                    "campo": "valor",
                    "valor": 18,
                    "tolerancia": 0.001,
                    "pontos": 2
                  }
                ]
              },
              {
                "id": "Q9d",
                "alinea": "d)",
                "enunciado": "Se a actividade D atrasar 3 dias, qual será a nova duração total do projecto?",
                "pontos": 2,
                "widget": "numero",
                "config": {
                  "sufixo": "dias"
                },
                "correcao": [
                  {
                    "tipo": "numero",
                    "campo": "valor",
                    "valor": 21,
                    "tolerancia": 0.001,
                    "pontos": 2
                  }
                ]
              },
              {
                "id": "Q9e",
                "alinea": "d)",
                "enunciado": "Explique o impacto desse atraso no prazo final do projecto.",
                "pontos": 1,
                "widget": "textarea",
                "config": {
                  "linhas": 3,
                  "placeholder": "A actividade D pertence (ou não) ao caminho crítico, logo…"
                },
                "correcao": [
                  {
                    "tipo": "palavras",
                    "termos": "caminho critico|critica:0.5;3 dias|tres dias|21:0.5;sem folga|folga zero|atrasa todo o projecto:0.5"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "tempoLimiteMin": 180,
    "tipo": "ensaio"
  }
];
