import mongoose, { Schema, Document, model, Types } from 'mongoose';

export interface IUser extends Document {
   _id: Types.ObjectId; 
   id?: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  email: string;
  password: string;
  avatarUrl?: string;
  isOnline: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: { type: String },
    isOnline: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

UserSchema.virtual('id').get(function (this: IUser) {
  return this._id.toHexString();
});
export const User = model<IUser>('User', UserSchema);
