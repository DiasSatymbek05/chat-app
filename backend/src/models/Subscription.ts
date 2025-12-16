import { Schema, Document, model, Types } from 'mongoose';

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  channel: Types.ObjectId;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);
