import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi')
})

export const userCreateSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['admin', 'koordinator', 'anggota', 'kepala']),
  region_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

export const userUpdateSchema = z.object({
  nama: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  password: z.string().min(6).optional().or(z.literal('')).nullable(),
  role: z.enum(['admin', 'koordinator', 'anggota', 'kepala']).optional(),
  region_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

export const regionCreateSchema = z.object({
  nama: z.string().min(1, 'Nama wilayah wajib diisi'),
  kode: z.string().min(1, 'Kode wilayah wajib diisi'),
  status: z.enum(['active', 'inactive']).default('active')
})

export const regionUpdateSchema = z.object({
  nama: z.string().min(1).optional(),
  kode: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional()
})

export const categoryCreateSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi'),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid').default('#3B82F6'),
  icon: z.string().optional().nullable()
})

export const categoryUpdateSchema = z.object({
  nama: z.string().min(1).optional(),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional().nullable()
})

export const activityCreateSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  region_id: z.coerce.number().int().positive(),
  kategori_id: z.coerce.number().int().positive(),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  jam_mulai: z.string().optional().nullable(),
  jam_selesai: z.string().optional().nullable(),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  npsn: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  nama_sekolah: z.string().trim().max(255).optional().nullable().or(z.literal(''))
})

export const activityUpdateSchema = z.object({
  region_id: z.coerce.number().int().positive().optional(),
  kategori_id: z.coerce.number().int().positive().optional(),
  tanggal: z.string().min(1).optional(),
  jam_mulai: z.string().optional().nullable(),
  jam_selesai: z.string().optional().nullable(),
  deskripsi: z.string().min(1).optional(),
  npsn: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  nama_sekolah: z.string().trim().max(255).optional().nullable().or(z.literal(''))
})

export const commentCreateSchema = z.object({
  activity_id: z.coerce.number().int().positive(),
  komentar: z.string().min(1, 'Komentar wajib diisi')
})
