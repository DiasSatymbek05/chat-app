import mongoose, { Schema, Document, model, Types } from 'mongoose';
import { IUser } from './User';
import { IChat } from './Chat';

export interface ISubscription extends Document {
  user: Types.ObjectId | IUser;
  channel: Types.ObjectId | IChat;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);
