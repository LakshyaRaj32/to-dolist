const { z } = require('zod');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(254);

const register = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required').max(60),
  email,
  // bcrypt only uses the first 72 bytes of a password.
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password can be at most 72 characters'),
});

const login = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = { register, login };
