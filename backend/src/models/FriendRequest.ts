import mongoose, { Schema, Document, model, Types } from 'mongoose';
import { IUser } from './User';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriendRequest extends Document {
  requester: Types.ObjectId | IUser;
  recipient: Types.ObjectId | IUser;
  status: FriendRequestStatus;
  message?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema: Schema = new Schema<IFriendRequest>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    message: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FriendRequest = model<IFriendRequest>('FriendRequest', FriendRequestSchema);
