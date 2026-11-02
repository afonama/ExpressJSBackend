import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  name: z.string().trim().min(1).max(100)
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(72)
});

export const refreshSchema = z
  .object({ refreshToken: z.string().min(10).max(2048) })
  .partial();

export const signupRateSchema = signupSchema;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
