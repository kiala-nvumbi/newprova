/**
 * Definitions for the exams, default student accounts, and initial seed data.
 */
import { ExamDefinition, Student } from '../types/exam';

export const DEFINICAO_PROVAS: ExamDefinition[] = [
  {
    examId: 'cabinda2027',
    titulo: 'Prova de Avaliação — Planeamento Estratégico em Gestão',
    descricao: 'Caso: Hospital Geral Provincial de Cabinda (Prova Oficial)',
    contextoHtml: `
      <h4>Contexto do caso</h4>
      <p>O Ministério da Saúde de Angola identificou um aumento significativo da procura por serviços hospitalares nos últimos três anos. O <strong>Hospital Geral Provincial de Cabinda</strong> atende uma população estimada de 2,8 milhões de habitantes e enfrenta desafios relacionados com o crescimento da procura, o aumento dos custos operacionais, a escassez de recursos humanos especializados e a pressão para melhorar a qualidade dos cuidados prestados.</p>
      <p><strong>Em 2025, o hospital registou:</strong></p>
      <table class="dados">
        <thead>
          <tr><th>Indicador</th><th>Valor</th></tr>
        </thead>
        <tbody>
          <tr><td>Consultas realizadas</td><td>285.000</td></tr>
          <tr><td>Internamentos</td><td>38.500</td></tr>
          <tr><td>Taxa de ocupação</td><td>92%</td></tr>
          <tr><td>Tempo médio de espera nas urgências</td><td>8 horas</td></tr>
          <tr><td>Mortalidade hospitalar</td><td>4,8%</td></tr>
          <tr><td>Satisfação dos utentes</td><td>61%</td></tr>
          <tr><td>Despesas operacionais</td><td>14,5 mil milhões Kz</td></tr>
        </tbody>
      </table>
      <p>O Conselho de Direcção pretende elaborar um novo <strong>Plano Estratégico 2027–2031</strong>.</p>
    `,
    tempoLimiteMin: 180,
    tipo: 'oficial',
    disponivelEm: '2026-08-29',
    horaInicio: '00:00',
    horaFim: '23:59',
    partes: [
      {
        parte: 'I',
        titulo: 'Missão, Visão e Valores',
        contextoHtml: `
          <p>Actualmente o hospital possui:</p>
          <table class="dados">
            <tbody>
              <tr><th style="width:110px">Missão</th><td>«Prestar assistência médica à população através de serviços hospitalares acessíveis.»</td></tr>
              <tr><th>Visão</th><td>«Ser um hospital de referência.»</td></tr>
              <tr><th>Valores</th><td>Respeito · Responsabilidade · Profissionalismo</td></tr>
            </tbody>
          </table>
        `,
        questoes: [
          {
            numero: 'Questão 1',
            itens: [
              {
                id: 'Q1a',
                alinea: 'a)',
                enunciado: 'Identifique as principais limitações da missão, visão e valores apresentados.',
                pontos: 3,
                widget: 'textarea',
                config: {
                  linhas: 5,
                  placeholder: 'Analise cada elemento: o que falta? o que é vago? o que não é mensurável?'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'vaga|generica|pouco especifica:1;sem populacao alvo|nao define populacao|nao identifica os utentes:1;sem indicadores|nao mensuravel|sem prazo:1;pouco diferenciadora|pouco inspiradora|nao inspira:1'
                  }
                ]
              },
              {
                id: 'Q1b',
                alinea: 'b)',
                enunciado: 'Reformule a Missão.',
                pontos: 4,
                widget: 'textarea',
                config: {
                  linhas: 4,
                  placeholder: 'Missão reformulada (quem somos, o que fazemos, para quem e com que diferencial)'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'acessivel|acesso:1;qualidade|seguranca:1;inovacao|inovador|tecnologia:1;populacao|comunidade|humanizado|cabinda:1'
                  }
                ]
              },
              {
                id: 'Q1c',
                alinea: 'c)',
                enunciado: 'Reformule a Visão.',
                pontos: 3,
                widget: 'textarea',
                config: {
                  linhas: 3,
                  placeholder: 'Visão reformulada (onde queremos chegar, com que âmbito e até quando)'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'referencia|excelencia:1;regional|nacional|angola|africa:1;2031|ate 2031|prazo|2027:1'
                  }
                ]
              },
              {
                id: 'Q1d',
                alinea: 'd)',
                enunciado: 'Acrescente pelo menos cinco valores institucionais adequados à realidade actual do Sistema Nacional de Saúde de Angola.',
                pontos: 5,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'valor', label: 'Valor institucional', tipo: 'texto', largura: '34%' },
                    { key: 'significado', label: 'O que significa na prática do hospital', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}, {}, {}, {}],
                  adicionar: true,
                  remover: true,
                  minLinhas: 5,
                  rotuloAdicionar: 'Adicionar valor'
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['valor'],
                    pontosPorLinha: 1,
                    maxLinhas: 5
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'II',
        titulo: 'Análise SWOT',
        contextoHtml: `
          <p>Após entrevistas realizadas junto dos gestores hospitalares foram identificadas as seguintes situações:</p>
          <div class="duas-colunas">
            <div>
              <h5>Situação interna</h5>
              <ol>
                <li>Existência de médicos especialistas experientes;</li>
                <li>Equipamentos de imagiologia obsoletos;</li>
                <li>Sistema de informação hospitalar parcialmente informatizado;</li>
                <li>Elevada rotatividade de enfermeiros;</li>
                <li>Forte reputação clínica em cirurgia geral.</li>
              </ol>
            </div>
            <div>
              <h5>Situação externa</h5>
              <ol>
                <li>Crescimento populacional de Luanda;</li>
                <li>Aumento de doenças não transmissíveis;</li>
                <li>Programa governamental de digitalização da saúde;</li>
                <li>Crescimento de clínicas privadas concorrentes;</li>
                <li>Instabilidade cambial que afecta a importação de medicamentos.</li>
              </ol>
            </div>
          </div>
        `,
        questoes: [
          {
            numero: 'Questão 2',
            itens: [
              {
                id: 'Q2a',
                alinea: 'a)',
                enunciado: 'Construa a Matriz SWOT.',
                pontos: 8,
                widget: 'swot',
                config: {
                  quadrantes: [
                    { key: 'Forças', label: 'Forças (S)', sub: 'Interno · positivo', cor: 'verde', itens: 3 },
                    { key: 'Fraquezas', label: 'Fraquezas (W)', sub: 'Interno · negativo', cor: 'vermelho', itens: 3 },
                    { key: 'Oportunidades', label: 'Oportunidades (O)', sub: 'Externo · positivo', cor: 'azul', itens: 3 },
                    { key: 'Ameaças', label: 'Ameaças (T)', sub: 'Externo · negativo', cor: 'laranja', itens: 3 }
                  ]
                },
                correcao: [
                  {
                    tipo: 'grupos',
                    colunaGrupo: 'grupo',
                    colunaConteudo: 'item',
                    grupos: ['Forças', 'Fraquezas', 'Oportunidades', 'Ameaças'],
                    minPorGrupo: 2,
                    pontosPorGrupo: 2
                  }
                ]
              },
              {
                id: 'Q2b',
                alinea: 'b)',
                enunciado: 'Desenvolva 2 estratégias FO, 2 estratégias FA, 2 estratégias DO e 2 estratégias DA.',
                pontos: 8,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'tipo', label: 'Tipo', tipo: 'texto', bloqueado: true, largura: '80px' },
                    { key: 'estrategia', label: 'Estratégia', tipo: 'textarea' }
                  ],
                  linhasPadrao: [
                    { tipo: 'FO' },
                    { tipo: 'FO' },
                    { tipo: 'FA' },
                    { tipo: 'FA' },
                    { tipo: 'DO' },
                    { tipo: 'DO' },
                    { tipo: 'DA' },
                    { tipo: 'DA' }
                  ],
                  adicionar: false,
                  remover: false,
                  legenda: 'FO = usar forças para aproveitar oportunidades · FA = usar forças para enfrentar ameaças · DO = corrigir fraquezas aproveitando oportunidades · DA = reduzir fraquezas e evitar ameaças'
                },
                correcao: [
                  {
                    tipo: 'grupos',
                    colunaGrupo: 'tipo',
                    colunaConteudo: 'estrategia',
                    grupos: ['FO', 'FA', 'DO', 'DA'],
                    minPorGrupo: 2,
                    pontosPorGrupo: 2
                  }
                ]
              },
              {
                id: 'Q2c',
                alinea: 'c)',
                enunciado: 'Identifique qual das quatro categorias estratégicas deve ser priorizada e justifique.',
                pontos: 2,
                widget: 'escolha',
                config: {
                  opcoes: ['FO', 'FA', 'DO', 'DA'],
                  rotuloEscolha: 'Categoria a priorizar',
                  rotuloJustificacao: 'Justificação',
                  linhas: 4
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    campo: 'justificacao',
                    termos: 'fraquezas|debilidades|internas:0.5;oportunidades|digitalizacao|crescimento:0.5;porque|dado que|uma vez que|permite:1'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'III',
        titulo: 'Análise PESTEL',
        contextoHtml: '<p>Com base na realidade actual do sector da saúde em Angola, efectue uma análise PESTEL para o hospital, identificando pelo menos <strong>dois factores por dimensão</strong>.</p>',
        questoes: [
          {
            numero: 'Questão 3',
            itens: [
              {
                id: 'Q3a',
                alinea: '',
                enunciado: 'Identifique pelo menos 2 factores Políticos, 2 Económicos, 2 Sociais, 2 Tecnológicos, 2 Ecológicos e 2 Legais.',
                pontos: 12,
                widget: 'tabela',
                config: {
                  colunas: [
                    {
                      key: 'dimensao',
                      label: 'Dimensão',
                      tipo: 'select',
                      opcoes: ['Político', 'Económico', 'Social', 'Tecnológico', 'Ecológico', 'Legal'],
                      largura: '150px'
                    },
                    { key: 'fator', label: 'Factor identificado', tipo: 'textarea' },
                    { key: 'implicacao', label: 'Implicação para o hospital', tipo: 'textarea' }
                  ],
                  linhasPadrao: [
                    { dimensao: 'Político' },
                    { dimensao: 'Político' },
                    { dimensao: 'Económico' },
                    { dimensao: 'Económico' },
                    { dimensao: 'Social' },
                    { dimensao: 'Social' },
                    { dimensao: 'Tecnológico' },
                    { dimensao: 'Tecnológico' },
                    { dimensao: 'Ecológico' },
                    { dimensao: 'Ecológico' },
                    { dimensao: 'Legal' },
                    { dimensao: 'Legal' }
                  ],
                  adicionar: true,
                  remover: true,
                  rotuloAdicionar: 'Adicionar factor'
                },
                correcao: [
                  {
                    tipo: 'grupos',
                    colunaGrupo: 'dimensao',
                    colunaConteudo: 'fator',
                    grupos: ['Político', 'Económico', 'Social', 'Tecnológico', 'Ecológico', 'Legal'],
                    minPorGrupo: 2,
                    pontosPorGrupo: 2
                  }
                ]
              },
              {
                id: 'Q3b',
                alinea: 'a)',
                enunciado: 'Indique os três factores com maior impacto estratégico.',
                pontos: 2,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'fator', label: 'Factor', tipo: 'texto', largura: '40%' },
                    { key: 'porque', label: 'Porque tem maior impacto', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}, {}],
                  adicionar: false,
                  remover: false
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['fator'],
                    pontosPorLinha: 0.67,
                    maxLinhas: 3
                  }
                ]
              },
              {
                id: 'Q3c',
                alinea: 'b)',
                enunciado: 'Indique os três factores com maior grau de incerteza.',
                pontos: 2,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'fator', label: 'Factor', tipo: 'texto', largura: '40%' },
                    { key: 'porque', label: 'Porque é mais incerto', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}, {}],
                  adicionar: false,
                  remover: false
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['fator'],
                    pontosPorLinha: 0.67,
                    maxLinhas: 3
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'IV',
        titulo: 'Regressão Linear Múltipla para Previsão',
        contextoHtml: `
          <p>O hospital pretende prever a procura anual por consultas externas. Os dados históricos são:</p>
          <table class="dados">
            <thead>
              <tr><th>Ano</th><th>População (milhares) X₁</th><th>Médicos X₂</th><th>Consultas (milhares) Y</th></tr>
            </thead>
            <tbody>
              <tr><td>2021</td><td>2300</td><td>220</td><td>210</td></tr>
              <tr><td>2022</td><td>2400</td><td>230</td><td>225</td></tr>
              <tr><td>2023</td><td>2500</td><td>240</td><td>242</td></tr>
              <tr><td>2024</td><td>2600</td><td>245</td><td>260</td></tr>
              <tr><td>2025</td><td>2800</td><td>255</td><td>285</td></tr>
            </tbody>
          </table>
          <p>Após processamento estatístico obteve-se:</p>
          <p class="formula">Y = −125 + 0,12·X₁ + 0,35·X₂</p>
        `,
        questoes: [
          {
            numero: 'Questão 4',
            itens: [
              {
                id: 'Q4a',
                alinea: 'a)',
                enunciado: 'Interprete economicamente cada coeficiente.',
                pontos: 3,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'coef', label: 'Coeficiente', tipo: 'texto', bloqueado: true, largura: '170px' },
                    { key: 'interpretacao', label: 'Interpretação económica', tipo: 'textarea' }
                  ],
                  linhasPadrao: [
                    { coef: 'Constante = −125' },
                    { coef: 'β₁ (População) = 0,12' },
                    { coef: 'β₂ (Médicos) = 0,35' }
                  ],
                  adicionar: false,
                  remover: false
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['interpretacao'],
                    pontosPorLinha: 0.7,
                    maxLinhas: 3
                  },
                  {
                    tipo: 'palavras',
                    termos: '0,12|0.12|120 consultas:0.5;0,35|0.35|350 consultas:0.4'
                  }
                ]
              },
              {
                id: 'Q4b',
                alinea: 'b)',
                enunciado: 'Calcule a previsão para 2027 considerando População = 3.100 mil habitantes e Médicos = 280.',
                pontos: 3,
                widget: 'calculo',
                config: {
                  rotuloCalculo: 'Apresente o cálculo (substituição na equação)',
                  rotuloResultado: 'Previsão de consultas para 2027',
                  sufixo: 'mil consultas',
                  linhas: 3,
                  placeholderCalculo: 'Y = −125 + 0,12 × ____ + 0,35 × ____ = ____'
                },
                correcao: [
                  {
                    tipo: 'numero',
                    campo: 'valor',
                    valor: 345,
                    tolerancia: 0.02,
                    pontos: 2
                  },
                  {
                    tipo: 'palavras',
                    campo: 'calculo',
                    termos: '3100|3.100:0.5;280:0.5'
                  }
                ]
              },
              {
                id: 'Q4c',
                alinea: 'c)',
                enunciado: 'Explique porque a regressão múltipla é mais adequada do que uma regressão simples neste caso.',
                pontos: 2,
                widget: 'textarea',
                config: {
                  linhas: 4
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'duas variaveis|mais de uma variavel|duas variaveis independentes|populacao e medicos:1;poder explicativo|r2|r quadrado|explica melhor:0.5;isola o efeito|efeito conjunto|controla:0.5'
                  }
                ]
              },
              {
                id: 'Q4d',
                alinea: 'd)',
                enunciado: 'Identifique duas limitações do modelo.',
                pontos: 2,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'limitacao', label: 'Limitação', tipo: 'texto', largura: '40%' },
                    { key: 'porque', label: 'Porquê', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}],
                  adicionar: true,
                  remover: true,
                  rotuloAdicionar: 'Adicionar limitação'
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['limitacao'],
                    pontosPorLinha: 1,
                    maxLinhas: 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'V',
        titulo: 'Matriz GUT',
        contextoHtml: '<p>Com base nas análises anteriores foram identificados os seguintes problemas: longo tempo de espera nas urgências, equipamentos obsoletos, rotatividade de enfermeiros, falta de medicamentos e sistema informático limitado.</p>',
        questoes: [
          {
            numero: 'Questão 5',
            itens: [
              {
                id: 'Q5a',
                alinea: 'a), b), c)',
                enunciado: 'Atribua valores de Gravidade, Urgência e Tendência (1 a 5), construa a Matriz GUT e priorize os problemas.',
                pontos: 5,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'problema', label: 'Problema', tipo: 'texto', bloqueado: true },
                    { key: 'g', label: 'G', tipo: 'select', opcoes: ['1', '2', '3', '4', '5'], largura: '70px' },
                    { key: 'u', label: 'U', tipo: 'select', opcoes: ['1', '2', '3', '4', '5'], largura: '70px' },
                    { key: 't', label: 'T', tipo: 'select', opcoes: ['1', '2', '3', '4', '5'], largura: '70px' },
                    { key: 'gut', label: 'G×U×T', tipo: 'produto', fonte: ['g', 'u', 't'], largura: '80px' },
                    { key: 'ordem', label: 'Prioridade', tipo: 'select', opcoes: ['1.º', '2.º', '3.º', '4.º', '5.º'], largura: '110px' }
                  ],
                  linhasPadrao: [
                    { problema: 'Longo tempo de espera nas urgências' },
                    { problema: 'Equipamentos obsoletos' },
                    { problema: 'Rotatividade de enfermeiros' },
                    { problema: 'Falta de medicamentos' },
                    { problema: 'Sistema informático limitado' }
                  ],
                  adicionar: false,
                  remover: false,
                  legenda: '1 = muito baixo · 5 = muito alto. A coluna G×U×T é calculada automaticamente; a prioridade é atribuída por si.'
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['g', 'u', 't', 'ordem'],
                    pontosPorLinha: 1,
                    maxLinhas: 5
                  }
                ]
              },
              {
                id: 'Q5b',
                alinea: 'd)',
                enunciado: 'Justifique a prioridade atribuída ao problema mais crítico.',
                pontos: 2,
                widget: 'textarea',
                config: {
                  linhas: 4
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'gravidade:0.5;urgencia:0.5;tendencia:0.5;tempo de espera|urgencias|mortalidade|satisfacao:0.5'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'VI',
        titulo: 'Metas SMART',
        contextoHtml: `
          <p>Considerando que o principal problema identificado foi:</p>
          <p class="destaque">«Tempo médio de espera nas urgências igual a 8 horas.»</p>
        `,
        questoes: [
          {
            numero: 'Questão 6',
            itens: [
              {
                id: 'Q6a',
                alinea: '',
                enunciado: 'Transforme o problema numa Meta SMART completa (Specific, Measurable, Achievable, Relevant, Time-Bound).',
                pontos: 5,
                widget: 'smart',
                config: {
                  campos: [
                    { key: 's', letra: 'S', label: 'Specific — Específica', dica: 'O que exactamente vai ser feito e onde?' },
                    { key: 'm', letra: 'M', label: 'Measurable — Mensurável', dica: 'Que indicador e que valor? De 8 horas para quanto?' },
                    { key: 'a', letra: 'A', label: 'Achievable — Alcançável', dica: 'Com que recursos é possível?' },
                    { key: 'r', letra: 'R', label: 'Relevant — Relevante', dica: 'Porque é que importa para o hospital?' },
                    { key: 't', letra: 'T', label: 'Time-Bound — Temporal', dica: 'Até que data?' }
                  ],
                  rotuloMeta: 'Redacção final da meta (uma frase)'
                },
                correcao: [
                  {
                    tipo: 'campos',
                    campos: ['s', 'm', 'a', 'r', 't'],
                    pontosPorCampo: 0.8,
                    minCaracteres: 8
                  },
                  {
                    tipo: 'palavras',
                    campo: 'meta',
                    termos: 'horas|%|por cento:0.5;ate|2027|2028|meses:0.5'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'VII',
        titulo: 'Plano de Acção — Modelo 5W2H',
        contextoHtml: '<p>Elabore o Plano de Acção da meta anteriormente definida. <span class="valor-parte">10 valores</span></p>',
        questoes: [
          {
            numero: 'Questão 8',
            itens: [
              {
                id: 'Q8a',
                alinea: '',
                enunciado: 'Desenvolva um modelo 5W2H completo contendo What, Why, Where, When, Who, How e How Much.',
                pontos: 10,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'what', label: 'What — O quê', tipo: 'textarea' },
                    { key: 'why', label: 'Why — Porquê', tipo: 'textarea' },
                    { key: 'where', label: 'Where — Onde', tipo: 'texto' },
                    { key: 'when', label: 'When — Quando', tipo: 'texto' },
                    { key: 'who', label: 'Who — Quem', tipo: 'texto' },
                    { key: 'how', label: 'How — Como', tipo: 'textarea' },
                    { key: 'howmuch', label: 'How much — Quanto', tipo: 'texto' }
                  ],
                  linhasPadrao: [{}, {}, {}],
                  adicionar: true,
                  remover: true,
                  minLinhas: 1,
                  rotuloAdicionar: 'Adicionar acção ao plano',
                  legenda: 'Cada linha é uma acção do plano. Acrescente tantas linhas quantas as acções necessárias.'
                },
                correcao: [
                  {
                    tipo: 'matriz',
                    colunas: ['what', 'why', 'where', 'when', 'who', 'how', 'howmuch'],
                    pontosPorColuna: 1,
                    pontosPorLinhaExtra: 1.5,
                    maxLinhasExtra: 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'IX',
        titulo: 'Rede PERT e Caminho Crítico',
        contextoHtml: `
          <p>Para implementar o projecto de redução do tempo de espera nas urgências foram definidas as seguintes actividades:</p>
          <table class="dados">
            <thead>
              <tr><th>Act.</th><th>Descrição</th><th>Precedência</th><th>Duração (dias)</th></tr>
            </thead>
            <tbody>
              <tr><td>A</td><td>Diagnóstico dos processos</td><td>—</td><td>5</td></tr>
              <tr><td>B</td><td>Aquisição de software</td><td>A</td><td>8</td></tr>
              <tr><td>C</td><td>Reorganização do fluxo de pacientes</td><td>A</td><td>6</td></tr>
              <tr><td>D</td><td>Formação dos profissionais</td><td>B</td><td>4</td></tr>
              <tr><td>E</td><td>Instalação do software</td><td>B</td><td>3</td></tr>
              <tr><td>F</td><td>Implementação do novo protocolo</td><td>C e D</td><td>5</td></tr>
              <tr><td>G</td><td>Testes operacionais</td><td>E e F</td><td>4</td></tr>
              <tr><td>H</td><td>Entrada em funcionamento</td><td>G</td><td>2</td></tr>
            </tbody>
          </table>
        `,
        questoes: [
          {
            numero: 'Questão 9',
            itens: [
              {
                id: 'Q9a',
                alinea: 'a)',
                enunciado: 'Desenhe a Rede PERT.',
                pontos: 5,
                widget: 'pert',
                config: {
                  instrucoes: 'Lance as actividades do projecto no quadro (código, descrição, precedências e duração). O diagrama é desenhado automaticamente a partir das precedências que indicar. Depois clique nas actividades do diagrama para marcar o caminho crítico.',
                  atividades: [{}, {}, {}, {}],
                  linhasVazias: 5
                },
                correcao: [
                  {
                    tipo: 'pertRede',
                    pontos: 5,
                    referencia: [
                      { id: 'A', descricao: 'Diagnóstico dos processos', precedencias: '', duracao: 5 },
                      { id: 'B', descricao: 'Aquisição de software', precedencias: 'A', duracao: 8 },
                      { id: 'C', descricao: 'Reorganização do fluxo de pacientes', precedencias: 'A', duracao: 6 },
                      { id: 'D', descricao: 'Formação dos profissionais', precedencias: 'B', duracao: 4 },
                      { id: 'E', descricao: 'Instalação do software', precedencias: 'B', duracao: 3 },
                      { id: 'F', descricao: 'Implementação do novo protocolo', precedencias: 'C, D', duracao: 5 },
                      { id: 'G', descricao: 'Testes operacionais', precedencias: 'E, F', duracao: 4 },
                      { id: 'H', descricao: 'Entrada em funcionamento', precedencias: 'G', duracao: 2 }
                    ]
                  }
                ]
              },
              {
                id: 'Q9b',
                alinea: 'b)',
                enunciado: 'Identifique o Caminho Crítico.',
                pontos: 2,
                widget: 'texto',
                config: {
                  placeholder: 'Ex.: A – B – … – H',
                  usarCaminhoMarcado: 'Q9a'
                },
                correcao: [
                  {
                    tipo: 'sequencia',
                    valor: 'ABDFGH',
                    pontos: 2
                  }
                ]
              },
              {
                id: 'Q9c',
                alinea: 'c)',
                enunciado: 'Determine a duração total do projecto.',
                pontos: 2,
                widget: 'numero',
                config: {
                  sufixo: 'dias'
                },
                correcao: [
                  {
                    tipo: 'numero',
                    campo: 'valor',
                    valor: 28,
                    tolerancia: 0.001,
                    pontos: 2
                  }
                ]
              },
              {
                id: 'Q9d',
                alinea: 'd)',
                enunciado: 'Se a actividade D atrasar 3 dias, qual será a nova duração total do projecto?',
                pontos: 2,
                widget: 'numero',
                config: {
                  sufixo: 'dias'
                },
                correcao: [
                  {
                    tipo: 'numero',
                    campo: 'valor',
                    valor: 31,
                    tolerancia: 0.001,
                    pontos: 2
                  }
                ]
              },
              {
                id: 'Q9e',
                alinea: 'd)',
                enunciado: 'Explique o impacto desse atraso no prazo final do projecto.',
                pontos: 1,
                widget: 'textarea',
                config: {
                  linhas: 3,
                  placeholder: 'A actividade D pertence (ou não) ao caminho crítico, logo…'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'caminho critico|critica:0.5;3 dias|tres dias|31:0.5;sem folga|folga zero|atrasa todo o projecto:0.5'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    examId: 'ensaio2027',
    titulo: 'ENSAIO — Planeamento Estratégico em Gestão',
    descricao: 'Ambiente de treino · Caso: Hospital Geral Provincial do Uíge · pode repetir as vezes que quiser',
    contextoHtml: `
      <h4>Contexto do caso (ensaio)</h4>
      <p>Esta é uma prova de treino, com a mesma estrutura da prova oficial mas com outro caso e outros dados. Pode repeti-la as vezes que quiser.</p>
      <p>O <strong>Hospital Geral Provincial do Uíge</strong> serve uma população estimada de 1,9 milhões de habitantes. Nos últimos anos acumulou pressão sobre as urgências, dificuldades de manutenção do equipamento e perda de quadros para o sector privado.</p>
      <p><strong>Em 2025, o hospital registou:</strong></p>
      <table class="dados">
        <thead>
          <tr><th>Indicador</th><th>Valor</th></tr>
        </thead>
        <tbody>
          <tr><td>Consultas realizadas</td><td>198.000</td></tr>
          <tr><td>Internamentos</td><td>24.300</td></tr>
          <tr><td>Taxa de ocupação</td><td>87%</td></tr>
          <tr><td>Tempo médio de espera nas urgências</td><td>6 horas</td></tr>
          <tr><td>Mortalidade hospitalar</td><td>5,4%</td></tr>
          <tr><td>Satisfação dos utentes</td><td>58%</td></tr>
          <tr><td>Despesas operacionais</td><td>9,8 mil milhões Kz</td></tr>
        </tbody>
      </table>
      <p>O Conselho de Direcção prepara o <strong>Plano Estratégico 2027–2031</strong>.</p>
    `,
    tempoLimiteMin: 180,
    tipo: 'ensaio',
    partes: [
      {
        parte: 'I',
        titulo: 'Missão, Visão e Valores',
        contextoHtml: `
          <p>Actualmente o hospital possui:</p>
          <table class="dados">
            <tbody>
              <tr><th style="width:110px">Missão</th><td>«Tratar os doentes do Uíge com os meios disponíveis.»</td></tr>
              <tr><th>Visão</th><td>«Crescer e melhorar.»</td></tr>
              <tr><th>Valores</th><td>Dedicação · Disciplina</td></tr>
            </tbody>
          </table>
        `,
        questoes: [
          {
            numero: 'Questão 1',
            itens: [
              {
                id: 'Q1a',
                alinea: 'a)',
                enunciado: 'Identifique as principais limitações da missão, visão e valores apresentados.',
                pontos: 3,
                widget: 'textarea',
                config: {
                  linhas: 5,
                  placeholder: 'Analise cada elemento: o que falta? o que é vago? o que não é mensurável?'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'vaga|generica|pouco especifica:1;sem populacao alvo|nao define populacao|nao identifica os utentes:1;sem indicadores|nao mensuravel|sem prazo:1;pouco diferenciadora|pouco inspiradora|nao inspira:1'
                  }
                ]
              },
              {
                id: 'Q1b',
                alinea: 'b)',
                enunciado: 'Reformule a Missão.',
                pontos: 4,
                widget: 'textarea',
                config: {
                  linhas: 4,
                  placeholder: 'Missão reformulada (quem somos, o que fazemos, para quem e com que diferencial)'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'acessivel|acesso:1;qualidade|seguranca:1;inovacao|inovador|tecnologia:1;populacao|comunidade|humanizado|uige:1'
                  }
                ]
              },
              {
                id: 'Q1c',
                alinea: 'c)',
                enunciado: 'Reformule a Visão.',
                pontos: 3,
                widget: 'textarea',
                config: {
                  linhas: 3,
                  placeholder: 'Visão reformulada (onde queremos chegar, com que âmbito e até quando)'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'referencia|excelencia:1;regional|nacional|angola|africa:1;2031|ate 2031|prazo|2027:1'
                  }
                ]
              },
              {
                id: 'Q1d',
                alinea: 'd)',
                enunciado: 'Acrescente pelo menos cinco valores institucionais adequados à realidade actual do Sistema Nacional de Saúde de Angola.',
                pontos: 5,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'valor', label: 'Valor institucional', tipo: 'texto', largura: '34%' },
                    { key: 'significado', label: 'O que significa na prática do hospital', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}, {}, {}, {}],
                  adicionar: true,
                  remover: true,
                  minLinhas: 5,
                  rotuloAdicionar: 'Adicionar valor'
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['valor'],
                    pontosPorLinha: 1,
                    maxLinhas: 5
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'II',
        titulo: 'Análise SWOT',
        contextoHtml: `
          <p>Das entrevistas aos gestores hospitalares resultaram as seguintes situações:</p>
          <div class="duas-colunas">
            <div>
              <h5>Situação interna</h5>
              <ol>
                <li>Equipa de enfermagem estável e experiente;</li>
                <li>Bloco operatório com avarias frequentes;</li>
                <li>Registo clínico ainda em papel;</li>
                <li>Falta de médicos especialistas em pediatria;</li>
                <li>Boa articulação com os centros de saúde municipais.</li>
              </ol>
            </div>
            <div>
              <h5>Situação externa</h5>
              <ol>
                <li>População jovem em crescimento na província;</li>
                <li>Aumento dos acidentes de viação;</li>
                <li>Financiamento público para reabilitação de infra-estruturas;</li>
                <li>Saída de quadros para clínicas privadas de Luanda;</li>
                <li>Ruptura frequente no fornecimento de energia eléctrica.</li>
              </ol>
            </div>
          </div>
        `,
        questoes: [
          {
            numero: 'Questão 2',
            itens: [
              {
                id: 'Q2a',
                alinea: 'a)',
                enunciado: 'Construa a Matriz SWOT.',
                pontos: 8,
                widget: 'swot',
                config: {
                  quadrantes: [
                    { key: 'Forças', label: 'Forças (S)', sub: 'Interno · positivo', cor: 'verde', itens: 3 },
                    { key: 'Fraquezas', label: 'Fraquezas (W)', sub: 'Interno · negativo', cor: 'vermelho', itens: 3 },
                    { key: 'Oportunidades', label: 'Oportunidades (O)', sub: 'Externo · positivo', cor: 'azul', itens: 3 },
                    { key: 'Ameaças', label: 'Ameaças (T)', sub: 'Externo · negativo', cor: 'laranja', itens: 3 }
                  ]
                },
                correcao: [
                  {
                    tipo: 'grupos',
                    colunaGrupo: 'grupo',
                    colunaConteudo: 'item',
                    grupos: ['Forças', 'Fraquezas', 'Oportunidades', 'Ameaças'],
                    minPorGrupo: 2,
                    pontosPorGrupo: 2
                  }
                ]
              },
              {
                id: 'Q2b',
                alinea: 'b)',
                enunciado: 'Desenvolva 2 estratégias FO, 2 estratégias FA, 2 estratégias DO e 2 estratégias DA.',
                pontos: 8,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'tipo', label: 'Tipo', tipo: 'texto', bloqueado: true, largura: '80px' },
                    { key: 'estrategia', label: 'Estratégia', tipo: 'textarea' }
                  ],
                  linhasPadrao: [
                    { tipo: 'FO' },
                    { tipo: 'FO' },
                    { tipo: 'FA' },
                    { tipo: 'FA' },
                    { tipo: 'DO' },
                    { tipo: 'DO' },
                    { tipo: 'DA' },
                    { tipo: 'DA' }
                  ],
                  adicionar: false,
                  remover: false,
                  legenda: 'FO = usar forças para aproveitar oportunidades · FA = usar forças para enfrentar ameaças · DO = corrigir fraquezas aproveitando oportunidades · DA = reduzir fraquezas e evitar ameaças'
                },
                correcao: [
                  {
                    tipo: 'grupos',
                    colunaGrupo: 'tipo',
                    colunaConteudo: 'estrategia',
                    grupos: ['FO', 'FA', 'DO', 'DA'],
                    minPorGrupo: 2,
                    pontosPorGrupo: 2
                  }
                ]
              },
              {
                id: 'Q2c',
                alinea: 'c)',
                enunciado: 'Identifique qual das quatro categorias estratégicas deve ser priorizada e justifique.',
                pontos: 2,
                widget: 'escolha',
                config: {
                  opcoes: ['FO', 'FA', 'DO', 'DA'],
                  rotuloEscolha: 'Categoria a priorizar',
                  rotuloJustificacao: 'Justificação',
                  linhas: 4
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    campo: 'justificacao',
                    termos: 'fraquezas|debilidades|internas:0.5;oportunidades|digitalizacao|crescimento:0.5;porque|dado que|uma vez que|permite:1'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'III',
        titulo: 'Análise PESTEL',
        contextoHtml: '<p>Com base na realidade actual do sector da saúde em Angola, efectue uma análise PESTEL para o hospital, identificando pelo menos <strong>dois factores por dimensão</strong>.</p>',
        questoes: [
          {
            numero: 'Questão 3',
            itens: [
              {
                id: 'Q3a',
                alinea: '',
                enunciado: 'Identifique pelo menos 2 factores Políticos, 2 Económicos, 2 Sociais, 2 Tecnológicos, 2 Ecológicos e 2 Legais.',
                pontos: 12,
                widget: 'tabela',
                config: {
                  colunas: [
                    {
                      key: 'dimensao',
                      label: 'Dimensão',
                      tipo: 'select',
                      opcoes: ['Político', 'Económico', 'Social', 'Tecnológico', 'Ecológico', 'Legal'],
                      largura: '150px'
                    },
                    { key: 'fator', label: 'Factor identificado', tipo: 'textarea' },
                    { key: 'implicacao', label: 'Implicação para o hospital', tipo: 'textarea' }
                  ],
                  linhasPadrao: [
                    { dimensao: 'Político' },
                    { dimensao: 'Político' },
                    { dimensao: 'Económico' },
                    { dimensao: 'Económico' },
                    { dimensao: 'Social' },
                    { dimensao: 'Social' },
                    { dimensao: 'Tecnológico' },
                    { dimensao: 'Tecnológico' },
                    { dimensao: 'Ecológico' },
                    { dimensao: 'Ecológico' },
                    { dimensao: 'Legal' },
                    { dimensao: 'Legal' }
                  ],
                  adicionar: true,
                  remover: true,
                  rotuloAdicionar: 'Adicionar factor'
                },
                correcao: [
                  {
                    tipo: 'grupos',
                    colunaGrupo: 'dimensao',
                    colunaConteudo: 'fator',
                    grupos: ['Político', 'Económico', 'Social', 'Tecnológico', 'Ecológico', 'Legal'],
                    minPorGrupo: 2,
                    pontosPorGrupo: 2
                  }
                ]
              },
              {
                id: 'Q3b',
                alinea: 'a)',
                enunciado: 'Indique os três factores com maior impacto estratégico.',
                pontos: 2,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'fator', label: 'Factor', tipo: 'texto', largura: '40%' },
                    { key: 'porque', label: 'Porque tem maior impacto', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}, {}],
                  adicionar: false,
                  remover: false
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['fator'],
                    pontosPorLinha: 0.67,
                    maxLinhas: 3
                  }
                ]
              },
              {
                id: 'Q3c',
                alinea: 'b)',
                enunciado: 'Indique os três factores com maior grau de incerteza.',
                pontos: 2,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'fator', label: 'Factor', tipo: 'texto', largura: '40%' },
                    { key: 'porque', label: 'Porque é mais incerto', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}, {}],
                  adicionar: false,
                  remover: false
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['fator'],
                    pontosPorLinha: 0.67,
                    maxLinhas: 3
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'IV',
        titulo: 'Regressão Linear Múltipla para Previsão',
        contextoHtml: `
          <p>O hospital pretende prever a procura anual por consultas externas. Os dados históricos são:</p>
          <table class="dados">
            <thead>
              <tr><th>Ano</th><th>População (milhares) X₁</th><th>Médicos X₂</th><th>Consultas (milhares) Y</th></tr>
            </thead>
            <tbody>
              <tr><td>2021</td><td>1600</td><td>120</td><td>118</td></tr>
              <tr><td>2022</td><td>1700</td><td>135</td><td>134</td></tr>
              <tr><td>2023</td><td>1800</td><td>145</td><td>148</td></tr>
              <tr><td>2024</td><td>1850</td><td>155</td><td>157</td></tr>
              <tr><td>2025</td><td>1900</td><td>160</td><td>198</td></tr>
            </tbody>
          </table>
          <p>Após processamento estatístico obteve-se:</p>
          <p class="formula">Y = −90 + 0,10·X₁ + 0,40·X₂</p>
        `,
        questoes: [
          {
            numero: 'Questão 4',
            itens: [
              {
                id: 'Q4a',
                alinea: 'a)',
                enunciado: 'Interprete economicamente cada coeficiente.',
                pontos: 3,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'coef', label: 'Coeficiente', tipo: 'texto', bloqueado: true, largura: '170px' },
                    { key: 'interpretacao', label: 'Interpretação económica', tipo: 'textarea' }
                  ],
                  linhasPadrao: [
                    { coef: 'Constante = −90' },
                    { coef: 'β₁ (População) = 0,10' },
                    { coef: 'β₂ (Médicos) = 0,40' }
                  ],
                  adicionar: false,
                  remover: false
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['interpretacao'],
                    pontosPorLinha: 0.7,
                    maxLinhas: 3
                  },
                  {
                    tipo: 'palavras',
                    termos: '0,10|0.10|100 consultas:0.5;0,40|0.40|400 consultas:0.4'
                  }
                ]
              },
              {
                id: 'Q4b',
                alinea: 'b)',
                enunciado: 'Calcule a previsão para 2027 considerando População = 2.300 mil habitantes e Médicos = 180.',
                pontos: 3,
                widget: 'calculo',
                config: {
                  rotuloCalculo: 'Apresente o cálculo (substituição na equação)',
                  rotuloResultado: 'Previsão de consultas para 2027',
                  sufixo: 'mil consultas',
                  linhas: 3,
                  placeholderCalculo: 'Y = −90 + 0,10 × ____ + 0,40 × ____ = ____'
                },
                correcao: [
                  {
                    tipo: 'numero',
                    campo: 'valor',
                    valor: 212,
                    tolerancia: 0.02,
                    pontos: 2
                  },
                  {
                    tipo: 'palavras',
                    campo: 'calculo',
                    termos: '2300|2.300:0.5;180:0.5'
                  }
                ]
              },
              {
                id: 'Q4c',
                alinea: 'c)',
                enunciado: 'Explique porque a regressão múltipla é mais adequada do que uma regressão simples neste caso.',
                pontos: 2,
                widget: 'textarea',
                config: {
                  linhas: 4
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'duas variaveis|mais de uma variavel|duas variaveis independentes|populacao e medicos:1;poder explicativo|r2|r quadrado|explica melhor:0.5;isola o efeito|efeito conjunto|controla:0.5'
                  }
                ]
              },
              {
                id: 'Q4d',
                alinea: 'd)',
                enunciado: 'Identifique duas limitações do modelo.',
                pontos: 2,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'limitacao', label: 'Limitação', tipo: 'texto', largura: '40%' },
                    { key: 'porque', label: 'Porquê', tipo: 'textarea' }
                  ],
                  linhasPadrao: [{}, {}],
                  adicionar: true,
                  remover: true,
                  rotuloAdicionar: 'Adicionar limitação'
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['limitacao'],
                    pontosPorLinha: 1,
                    maxLinhas: 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'V',
        titulo: 'Matriz GUT',
        contextoHtml: '<p>Das análises anteriores resultaram os seguintes problemas: longo tempo de espera nas urgências, avarias no bloco operatório, registo clínico em papel, falta de pediatras e cortes de energia eléctrica.</p>',
        questoes: [
          {
            numero: 'Questão 5',
            itens: [
              {
                id: 'Q5a',
                alinea: 'a), b), c)',
                enunciado: 'Atribua valores de Gravidade, Urgência e Tendência (1 a 5), construa a Matriz GUT e priorize os problemas.',
                pontos: 5,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'problema', label: 'Problema', tipo: 'texto', bloqueado: true },
                    { key: 'g', label: 'G', tipo: 'select', opcoes: ['1', '2', '3', '4', '5'], largura: '70px' },
                    { key: 'u', label: 'U', tipo: 'select', opcoes: ['1', '2', '3', '4', '5'], largura: '70px' },
                    { key: 't', label: 'T', tipo: 'select', opcoes: ['1', '2', '3', '4', '5'], largura: '70px' },
                    { key: 'gut', label: 'G×U×T', tipo: 'produto', fonte: ['g', 'u', 't'], largura: '80px' },
                    { key: 'ordem', label: 'Prioridade', tipo: 'select', opcoes: ['1.º', '2.º', '3.º', '4.º', '5.º'], largura: '110px' }
                  ],
                  linhasPadrao: [
                    { problema: 'Longo tempo de espera nas urgências' },
                    { problema: 'Avarias no bloco operatório' },
                    { problema: 'Registo clínico em papel' },
                    { problema: 'Falta de pediatras' },
                    { problema: 'Cortes de energia eléctrica' }
                  ],
                  adicionar: false,
                  remover: false,
                  legenda: '1 = muito baixo · 5 = muito alto. A coluna G×U×T é calculada automaticamente; a prioridade é atribuída por si.'
                },
                correcao: [
                  {
                    tipo: 'linhas',
                    colunas: ['g', 'u', 't', 'ordem'],
                    pontosPorLinha: 1,
                    maxLinhas: 5
                  }
                ]
              },
              {
                id: 'Q5b',
                alinea: 'd)',
                enunciado: 'Justifique a prioridade atribuída ao problema mais crítico.',
                pontos: 2,
                widget: 'textarea',
                config: {
                  linhas: 4
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'gravidade:0.5;urgencia:0.5;tendencia:0.5;tempo de espera|urgencias|mortalidade|satisfacao:0.5'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'VI',
        titulo: 'Metas SMART',
        contextoHtml: `
          <p>Considerando que o principal problema identificado foi:</p>
          <p class="destaque">«Tempo médio de espera nas urgências igual a 6 horas.»</p>
        `,
        questoes: [
          {
            numero: 'Questão 6',
            itens: [
              {
                id: 'Q6a',
                alinea: '',
                enunciado: 'Transforme o problema numa Meta SMART completa (Specific, Measurable, Achievable, Relevant, Time-Bound).',
                pontos: 5,
                widget: 'smart',
                config: {
                  campos: [
                    { key: 's', letra: 'S', label: 'Specific — Específica', dica: 'O que exactamente vai ser feito e onde?' },
                    { key: 'm', letra: 'M', label: 'Measurable — Mensurável', dica: 'Que indicador e que valor? De 6 horas para quanto?' },
                    { key: 'a', letra: 'A', label: 'Achievable — Alcançável', dica: 'Com que recursos é possível?' },
                    { key: 'r', letra: 'R', label: 'Relevant — Relevante', dica: 'Porque é que importa para o hospital?' },
                    { key: 't', letra: 'T', label: 'Time-Bound — Temporal', dica: 'Até que data?' }
                  ],
                  rotuloMeta: 'Redacção final da meta (uma frase)'
                },
                correcao: [
                  {
                    tipo: 'campos',
                    campos: ['s', 'm', 'a', 'r', 't'],
                    pontosPorCampo: 0.8,
                    minCaracteres: 8
                  },
                  {
                    tipo: 'palavras',
                    campo: 'meta',
                    termos: 'horas|%|por cento:0.5;ate|2027|2028|meses:0.5'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'VII',
        titulo: 'Plano de Acção — Modelo 5W2H',
        contextoHtml: '<p>Elabore o Plano de Acção da meta anteriormente definida. <span class="valor-parte">10 valores</span></p>',
        questoes: [
          {
            numero: 'Questão 8',
            itens: [
              {
                id: 'Q8a',
                alinea: '',
                enunciado: 'Desenvolva um modelo 5W2H completo contendo What, Why, Where, When, Who, How e How Much.',
                pontos: 10,
                widget: 'tabela',
                config: {
                  colunas: [
                    { key: 'what', label: 'What — O quê', tipo: 'textarea' },
                    { key: 'why', label: 'Why — Porquê', tipo: 'textarea' },
                    { key: 'where', label: 'Where — Onde', tipo: 'texto' },
                    { key: 'when', label: 'When — Quando', tipo: 'texto' },
                    { key: 'who', label: 'Who — Quem', tipo: 'texto' },
                    { key: 'how', label: 'How — Como', tipo: 'textarea' },
                    { key: 'howmuch', label: 'How much — Quanto', tipo: 'texto' }
                  ],
                  linhasPadrao: [{}, {}, {}],
                  adicionar: true,
                  remover: true,
                  minLinhas: 1,
                  rotuloAdicionar: 'Adicionar acção ao plano',
                  legenda: 'Cada linha é uma acção do plano. Acrescente tantas linhas quantas as acções necessárias.'
                },
                correcao: [
                  {
                    tipo: 'matriz',
                    colunas: ['what', 'why', 'where', 'when', 'who', 'how', 'howmuch'],
                    pontosPorColuna: 1,
                    pontosPorLinhaExtra: 1.5,
                    maxLinhasExtra: 2
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        parte: 'IX',
        titulo: 'Rede PERT e Caminho Crítico',
        contextoHtml: `
          <p>Para implementar o projecto de redução do tempo de espera nas urgências foram definidas as seguintes actividades:</p>
          <table class="dados">
            <thead>
              <tr><th>Act.</th><th>Descrição</th><th>Precedência</th><th>Duração (dias)</th></tr>
            </thead>
            <tbody>
              <tr><td>A</td><td>Levantamento do circuito do doente</td><td>—</td><td>2</td></tr>
              <tr><td>B</td><td>Contratação de pessoal para a triagem</td><td>A</td><td>4</td></tr>
              <tr><td>C</td><td>Revisão do protocolo de triagem</td><td>A</td><td>3</td></tr>
              <tr><td>D</td><td>Formação da equipa de triagem</td><td>B</td><td>5</td></tr>
              <tr><td>E</td><td>Aquisição de equipamento de monitorização</td><td>C</td><td>6</td></tr>
              <tr><td>F</td><td>Ensaio do novo circuito</td><td>D</td><td>3</td></tr>
              <tr><td>G</td><td>Instalação do equipamento</td><td>E</td><td>2</td></tr>
              <tr><td>H</td><td>Entrada em funcionamento</td><td>F e G</td><td>4</td></tr>
            </tbody>
          </table>
        `,
        questoes: [
          {
            numero: 'Questão 9',
            itens: [
              {
                id: 'Q9a',
                alinea: 'a)',
                enunciado: 'Desenhe a Rede PERT.',
                pontos: 5,
                widget: 'pert',
                config: {
                  instrucoes: 'Lance as actividades do projecto no quadro (código, descrição, precedências e duração). O diagrama é desenhado automaticamente a partir das precedências que indicar. Depois clique nas actividades do diagrama para marcar o caminho crítico.',
                  atividades: [{}, {}, {}, {}],
                  linhasVazias: 5
                },
                correcao: [
                  {
                    tipo: 'pertRede',
                    pontos: 5,
                    referencia: [
                      { id: 'A', descricao: 'Levantamento do circuito do doente', precedencias: '', duracao: 2 },
                      { id: 'B', descricao: 'Contratação de pessoal para a triagem', precedencias: 'A', duracao: 4 },
                      { id: 'C', descricao: 'Revisão do protocolo de triagem', precedencias: 'A', duracao: 3 },
                      { id: 'D', descricao: 'Formação da equipa de triagem', precedencias: 'B', duracao: 5 },
                      { id: 'E', descricao: 'Aquisição de equipamento de monitorização', precedencias: 'C', duracao: 6 },
                      { id: 'F', descricao: 'Ensaio do novo circuito', precedencias: 'D', duracao: 3 },
                      { id: 'G', descricao: 'Instalação do equipamento', precedencias: 'E', duracao: 2 },
                      { id: 'H', descricao: 'Entrada em funcionamento', precedencias: 'F, G', duracao: 4 }
                    ]
                  }
                ]
              },
              {
                id: 'Q9b',
                alinea: 'b)',
                enunciado: 'Identifique o Caminho Crítico.',
                pontos: 2,
                widget: 'texto',
                config: {
                  placeholder: 'Ex.: A – B – … – H',
                  usarCaminhoMarcado: 'Q9a'
                },
                correcao: [
                  {
                    tipo: 'sequencia',
                    valor: 'ABDFH',
                    pontos: 2
                  }
                ]
              },
              {
                id: 'Q9c',
                alinea: 'c)',
                enunciado: 'Determine a duração total do projecto.',
                pontos: 2,
                widget: 'numero',
                config: {
                  sufixo: 'dias'
                },
                correcao: [
                  {
                    tipo: 'numero',
                    campo: 'valor',
                    valor: 18,
                    tolerancia: 0.001,
                    pontos: 2
                  }
                ]
              },
              {
                id: 'Q9d',
                alinea: 'd)',
                enunciado: 'Se a actividade D atrasar 3 dias, qual será a nova duração total do projecto?',
                pontos: 2,
                widget: 'numero',
                config: {
                  sufixo: 'dias'
                },
                correcao: [
                  {
                    tipo: 'numero',
                    campo: 'valor',
                    valor: 21,
                    tolerancia: 0.001,
                    pontos: 2
                  }
                ]
              },
              {
                id: 'Q9e',
                alinea: 'd)',
                enunciado: 'Explique o impacto desse atraso no prazo final do projecto.',
                pontos: 1,
                widget: 'textarea',
                config: {
                  linhas: 3,
                  placeholder: 'A actividade D pertence (ou não) ao caminho crítico, logo…'
                },
                correcao: [
                  {
                    tipo: 'palavras',
                    termos: 'caminho critico|critica:0.5;3 dias|tres dias|21:0.5;sem folga|folga zero|atrasa todo o projecto:0.5'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const ESTUDANTES_PADRAO: Student[] = [
  {
    studentId: 'A001',
    nome: 'Manuel Domingos Antunes',
    login: 'aluno1',
    senha: '',
    turma: 'GE-2026-M1',
    provincia: 'Luanda',
    email: 'm.antunes@isp.ao',
    role: 'aluno',
    acessoPermitido: true
  },
  {
    studentId: 'A002',
    nome: 'Beatriz Teresa Kiala',
    login: 'aluno2',
    senha: '',
    turma: 'GE-2026-M1',
    provincia: 'Cabinda',
    email: 'b.kiala@isp.ao',
    role: 'aluno',
    acessoPermitido: true
  },
  {
    studentId: 'A003',
    nome: 'João Pedro Sebastião',
    login: 'aluno3',
    senha: '',
    turma: 'GE-2026-M2',
    provincia: 'Benguela',
    email: 'j.sebastiao@isp.ao',
    role: 'aluno',
    acessoPermitido: true
  },
  {
    studentId: 'A004',
    nome: 'Helena Maria de Carvalho',
    login: 'aluno4',
    senha: '',
    turma: 'GE-2026-M2',
    provincia: 'Huíla',
    email: 'h.carvalho@isp.ao',
    role: 'aluno',
    acessoPermitido: true
  }
];
