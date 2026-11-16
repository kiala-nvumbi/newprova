import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role').notNull().default('student'), // 'admin' | 'professor' | 'student'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const examSettings = pgTable('exam_settings', {
  id: text('id').primaryKey(), // 'default'
  title: text('title').notNull().default('Avaliação Prática de Administração e Gestão de TI'),
  description: text('description'),
  scheduledOpenAt: timestamp('scheduled_open_at'),
  isActive: boolean('is_active').notNull().default(true),
  durationMinutes: integer('duration_minutes').notNull().default(120),
  allowStudentAccess: boolean('allow_student_access').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentAttempts = pgTable('student_attempts', {
  id: text('id').primaryKey(),
  studentName: text('student_name').notNull(),
  matricula: text('matricula').notNull(),
  turma: text('turma'),
  status: text('status').notNull().default('in_progress'), // 'in_progress' | 'submitted' | 'reset'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  score: integer('score').notNull().default(0),
  maxScore: integer('max_score').notNull().default(100),
  answers: jsonb('answers'),
  feedback: text('feedback'),
  gradingDetails: jsonb('grading_details'),
  resetCount: integer('reset_count').notNull().default(0),
  lastResetAt: timestamp('last_reset_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentPermissions = pgTable('student_permissions', {
  studentId: text('student_id').primaryKey(),
  nome: text('nome').notNull(),
  turma: text('turma'),
  provincia: text('provincia'),
  email: text('email'),
  login: text('login'),
  senha: text('senha'),
  acessoPermitido: boolean('acesso_permitido').notNull().default(true),
  provasPermitidas: jsonb('provas_permitidas'),
  tempoExtraMin: integer('tempo_extra_min').notNull().default(0),
  observacao: text('observacao'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

