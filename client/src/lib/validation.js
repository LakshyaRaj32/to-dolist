import { z } from 'zod';

// Client-side schemas mirror the API's zod schemas so users see the same rules instantly.

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Task title is required').max(120, 'Title can be at most 120 characters'),
    description: z.string().max(2000, 'Description can be at most 2000 characters'),
    date: z.string().min(1, 'Date is required'),
    start: z.string().min(1, 'Start time is required'),
    end: z.string(),
    priority: z.string(),
    status: z.string(),
    tags: z.array(z.string()).max(10, 'At most 10 tags'),
  })
  .superRefine((v, ctx) => {
    if (v.start && v.end && v.end <= v.start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: 'Must be after the start time' });
    }
  });

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name can be at most 60 characters'),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password can be at most 72 characters'),
});
