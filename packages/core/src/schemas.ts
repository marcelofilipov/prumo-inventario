import { z } from 'zod'

export const statusItemSchema = z.enum([
  'ativo',
  'baixado',
  'emprestado',
  'manutencao',
])

export const categoriaSchema = z.enum([
  'acessibilidade_saude',
  'mobiliario',
  'cozinha',
  'comemorativo',
  'ritualistico',
  'eletronicos',
  'outros',
])

export const novoItemInventarioSchema = z.object({
  lojaId: z.string().min(1),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  quantidade: z.number().int().positive(),
  codigoLegado: z.string().min(1),
  categoria: categoriaSchema,
  localizacao: z.string().optional(),
  observacao: z.string().optional(),
  dataAquisicao: z.date().optional(),
  valorEstimado: z.number().nonnegative().optional(),
  status: statusItemSchema,
  fotos: z.array(z.string().url()).default([]),
  criadoPor: z.string().min(1),
  atualizadoPor: z.string().min(1),
})
