import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student } from '../types/exam';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface ImportStudentsExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (newStudents: Student[]) => void;
  existingStudentsCount: number;
}

export const ImportStudentsExcelModal: React.FC<ImportStudentsExcelModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  existingStudentsCount
}) => {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Normalize column keys
  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const processRows = (rows: any[]): Student[] => {
    const list: Student[] = [];
    let counter = existingStudentsCount + 1;

    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;

      let nome = '';
      let login = '';
      let senha = '';
      let turma = 'GE-2026-M1';
      let provincia = 'Cabinda';
      let matricula = '';
      let email = '';

      for (const rawKey of Object.keys(row)) {
        const val = String(row[rawKey] || '').trim();
        const k = normalizeKey(rawKey);

        if (k.includes('nome') || k.includes('aluno') || k === 'name') {
          nome = val;
        } else if (k.includes('usuari') || k.includes('user') || k === 'login') {
          login = val;
        } else if (k.includes('senha') || k.includes('pass') || k === 'pin') {
          senha = val;
        } else if (k.includes('turma') || k.includes('classe') || k.includes('sala')) {
          turma = val;
        } else if (k.includes('provinc') || k.includes('cidade') || k.includes('regiao')) {
          provincia = val;
        } else if (k.includes('matric') || k.includes('num') || k === 'id') {
          matricula = val;
        } else if (k.includes('mail')) {
          email = val;
        }
      }

      if (!nome) continue; // Skip empty rows

      // Generate initial login if missing
      if (!login) {
        const parts = nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/\s+/);
        login = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
      }

      // Initial password is guaranteed
      if (!senha) {
        senha = '123456';
      }

      if (!matricula) {
        matricula = `A${String(counter).padStart(3, '0')}`;
        counter++;
      }

      if (!provincia) {
        provincia = 'Cabinda';
      }

      if (!email) {
        email = `${login.toLowerCase()}@isp.ao`;
      }

      list.push({
        studentId: matricula.toUpperCase(),
        nome,
        login: login.toLowerCase(),
        senha,
        turma: turma || 'GE-2026',
        provincia,
        email,
        role: 'aluno',
        acessoPermitido: true,
        tempoExtraMin: 0
      });
    }

    return list;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setErrorMessage('O ficheiro Excel parece estar vazio ou sem linhas de dados.');
          return;
        }

        const students = processRows(json);
        if (students.length === 0) {
          setErrorMessage('Não foram identificados alunos no ficheiro. Certifique-se de que a coluna "Nome" existe.');
        } else {
          setParsedStudents(students);
        }
      } catch (err: any) {
        setErrorMessage('Erro ao ler ficheiro Excel: ' + (err.message || 'formato inválido'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleParsePastedText = () => {
    setErrorMessage(null);
    if (!pastedText.trim()) {
      setErrorMessage('Por favor, cole os dados do Excel na caixa abaixo.');
      return;
    }

    try {
      const lines = pastedText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setErrorMessage('Introduza pelo menos uma linha de cabeçalho e uma linha de aluno.');
        return;
      }

      // Check delimiter (tab, semicolon, or comma)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
      const headers = firstLine.split(delimiter).map((h) => h.trim());

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(delimiter).map((v) => v.trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      const students = processRows(rows);
      if (students.length === 0) {
        setErrorMessage('Não foi possível identificar os alunos. Verifique o cabeçalho (Nome, Usuário, Senha, Turma, Província).');
      } else {
        setParsedStudents(students);
      }
    } catch (err: any) {
      setErrorMessage('Erro ao processar texto: ' + err.message);
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nome': 'Afonso Miguel Panzo',
        'Usuario': 'afonso.panzo',
        'Senha': '123456',
        'Turma': 'GE-2026-M1',
        'Provincia': 'Cabinda',
        'Matricula': 'A010'
      },
      {
        'Nome': 'Teresa Isabel Ndalu',
        'Usuario': 'teresa.ndalu',
        'Senha': '123456',
        'Turma': 'GE-2026-M1',
        'Provincia': 'Luanda',
        'Matricula': 'A011'
      },
      {
        'Nome': 'Carlos Alberto Kiala',
        'Usuario': 'carlos.kiala',
        'Senha': '123456',
        'Turma': 'GE-2026-M2',
        'Provincia': 'Benguela',
        'Matricula': 'A012'
      },
      {
        'Nome': 'Esperança Maria Domingos',
        'Usuario': 'esperanca.domingos',
        'Senha': '123456',
        'Turma': 'GE-2026-M2',
        'Provincia': 'Huíla',
        'Matricula': 'A013'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');
    XLSX.writeFile(workbook, 'Modelo_Importacao_Alunos_SPE.xlsx');
  };

  const handleConfirm = () => {
    if (parsedStudents.length === 0) return;
    onConfirmImport(parsedStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Carregar Alunos via Excel</h3>
              <p className="text-xs text-slate-300">
                Importação em lote de Nome, Usuário, Senha, Turma e Província com login inicial garantido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action to download template */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-emerald-950 block">Modelo de Folha Excel (.xlsx)</span>
              <span className="text-emerald-800">
                Descarregue o modelo com as colunas recomendadas (Nome, Usuário, Senha, Turma, Província, Matrícula).
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descarregar Modelo Excel
            </button>
          </div>

          {/* Navigation modes */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => {
                setTab('upload');
                setErrorMessage(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                tab === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Submeter Ficheiro (.xlsx, .csv)
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('paste');
                setErrorMessage(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                tab === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Colar Linhas do Excel
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {tab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {fileName ? fileName : 'Clique para seleccionar a sua folha Excel'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Suporta formatos <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Mode 2: Paste Rows */}
          {tab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Copie as células do Excel e cole directamente aqui:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                placeholder={"Nome\tUsuario\tSenha\tTurma\tProvincia\nManuel Antunes\tmanuel.antunes\t123456\tGE-2026-M1\tCabinda"}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Processar e Validar Dados
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview of Parsed Students */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Alunos Prontos para Importação ({parsedStudents.length})
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Todos com login inicial e acesso garantido
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Matrícula</th>
                      <th className="py-2 px-3">Nome</th>
                      <th className="py-2 px-3">Usuário</th>
                      <th className="py-2 px-3">Senha</th>
                      <th className="py-2 px-3">Turma</th>
                      <th className="py-2 px-3">Província</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{st.studentId}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{st.nome}</td>
                        <td className="py-2 px-3 font-mono text-blue-600">{st.login}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{st.senha}</td>
                        <td className="py-2 px-3 text-slate-700">{st.turma}</td>
                        <td className="py-2 px-3 text-slate-700">{st.provincia || 'Cabinda'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {parsedStudents.length > 0
              ? `${parsedStudents.length} perfis de aluno prontos a gravar`
              : 'Seleccione o ficheiro Excel ou cole os dados para continuar'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedStudents.length === 0}
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar e Carregar {parsedStudents.length} Alunos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
