import './setup';

import request from 'supertest';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from '../../src/graphql/schema';
import { userResolvers } from '../../src/graphql/user/resolvers';
import { chatResolvers } from '../../src/graphql/chat/resolvers';
import { messageResolvers } from '../../src/graphql/message/resolvers';
import { friendRequestResolvers } from '../../src/graphql/friendRequest/resolvers';
import { subscriptionResolvers } from '../../src/graphql/subscription/resolvers';

let app: any;
let httpServer: any;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: [
      userResolvers,
      chatResolvers,
      messageResolvers,
      friendRequestResolvers,
      subscriptionResolvers,
    ],
  });

  const server = new ApolloServer({
    schema,
    context: () => ({}),
  });

  await server.start();

  app = express();
  server.applyMiddleware({ app });

  httpServer = request(app);
});

describe('User integration tests', () => {
  it('register and login user', async () => {
    
    const registerRes = await httpServer.post('/graphql').send({
      query: `
        mutation Register($input: RegisterInput!) {
          registerUser(input: $input) {
            token
            user {
              id
              email
            }
          }
        }
      `,
      variables: {
        input: {
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          password: 'password123',
        },
      },
    });

    expect(registerRes.body.errors).toBeUndefined();
    expect(registerRes.body.data.registerUser.token).toBeDefined();

    
    const loginRes = await httpServer.post('/graphql').send({
      query: `
        mutation Login($input: LoginInput!) {
          loginUser(input: $input) {
            token
            user {
              id
              email
            }
          }
        }
      `,
      variables: {
        input: {
          email: 'test@test.com',
          password: 'password123',
        },
      },
    });

    expect(loginRes.body.errors).toBeUndefined();
    expect(loginRes.body.data.loginUser.token).toBeDefined();
  });
});