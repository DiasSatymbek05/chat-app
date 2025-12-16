import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub() as any;

export const MESSAGE_SENT = 'MESSAGE_SENT';
