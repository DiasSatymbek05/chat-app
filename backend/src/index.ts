import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

// 🔹 Импорт моделей
import { User } from './models/User';
import { Chat } from './models/Chat';
import { Message } from './models/Message';
import { FriendRequest } from './models/FriendRequest';
import { Subscription } from './models/Subscription';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Простейший typeDefs + resolver для health-check
const typeDefs = gql`
  type Query {
    _health: String
  }
`;

const resolvers = {
  Query: {
    _health: () => 'ok',
  },
};

async function startServer() {
  await connectDB();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app: app as any });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
