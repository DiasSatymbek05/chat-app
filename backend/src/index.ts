import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { ApolloServer } from 'apollo-server-express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import jwt from 'jsonwebtoken';

import { connectDB } from './config/db';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { authMiddleware, AuthRequest } from './middleware/auth';

dotenv.config();

async function startServer() {
  await connectDB();

  const app = express();

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json());

 
  app.use(authMiddleware);

  const httpServer = http.createServer(app);


  const schema = makeExecutableSchema({ typeDefs, resolvers });


  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }: { req: AuthRequest }) => {
      return { user: req.user };
    },
  });
  await apolloServer.start();


  apolloServer.applyMiddleware({ app: app as any, cors: false });


  const wsServer = new WebSocketServer({
    server: httpServer,
    path: apolloServer.graphqlPath,
  });

  useServer(
    {
      schema,
      context: (ctx: any) => {
        
        const token = ctx.connectionParams?.authToken;
        if (!token) return { user: null };

        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) throw new Error('JWT_SECRET is not defined');

          const decoded = jwt.verify(token, secret) as { userId: string };
          return { user: { userId: decoded.userId } };
        } catch (err) {
          console.warn('Invalid JWT in WS:', err);
          return { user: null };
        }
      },
    },
    wsServer
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 HTTP  http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`🚀 WS    ws://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer();
