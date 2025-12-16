import mongoose, { Schema, Document, model, Types } from 'mongoose';
import { IUser } from './User';
import { IMessage } from './Message';

export type ChatType = 'group' | 'private' | 'channel';

export interface IChat extends Document {
  _id: Types.ObjectId;
  title?: string;
  isPrivate: boolean;
  members: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  type: ChatType;
  isDeleted: boolean;
  creator: Types.ObjectId;   
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema<IChat>(
  {
    title: { type: String },
    isPrivate: { type: Boolean, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    type: { type: String, enum: ['group', 'private', 'channel'], required: true },
    isDeleted: { type: Boolean, default: false },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  },
  { timestamps: true }
);

export const Chat = model<IChat>('Chat', ChatSchema);
