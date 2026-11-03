const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Guests have no email/password until they save their account.
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, select: false },
    isGuest: { type: Boolean, default: false },
    // Used to remove guest accounts that were abandoned.
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.lastActiveAt;
        return ret;
      },
    },
  }
);

userSchema.index({ isGuest: 1, lastActiveAt: 1 });

module.exports = { User: mongoose.models.User || mongoose.model('User', userSchema) };
