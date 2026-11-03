const { z } = require('zod');
const mongoose = require('mongoose');

const isBlank = (v) => v === undefined || v === null || v === '';
const isValidDate = (v) => !Number.isNaN(new Date(v).getTime());

/** A required date (ISO string or timestamp) → Date. */
const requiredDate = (message) =>
  z
    .any()
    .refine((v) => !isBlank(v), message)
    .refine((v) => isBlank(v) || isValidDate(v), 'Must be a valid date')
    .transform((v) => new Date(v));

/** An optional date; "" and null mean "no date". */
const optionalDate = () =>
  z
    .any()
    .refine((v) => isBlank(v) || isValidDate(v), 'Must be a valid date')
    .transform((v) => (isBlank(v) ? null : new Date(v)));

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid id');

module.exports = { requiredDate, optionalDate, objectId, isBlank };
