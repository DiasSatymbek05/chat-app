import mongoose, { Schema, Document, model, Types } from 'mongoose';
import { IUser } from './User';
import { IChat } from './Chat';

export interface IMessage extends Document {
  _id: Types.ObjectId;   
  text: string;
 sender?: Types.ObjectId;
chat: Types.ObjectId;
readBy: Types.ObjectId[];

  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema<IMessage>(
  {
    text: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

export const Message = model<IMessage>('Message', MessageSchema);
