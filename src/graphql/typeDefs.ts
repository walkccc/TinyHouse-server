import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum LoginType {
    GITHUB
    GOOGLE
  }

  input LogInInput {
    code: String!
    loginType: LoginType!
  }

  type Query {
    authUrl(loginType: LoginType): String!
  }

  type Mutation {
    logIn(input: LogInInput): Viewer!
    logOut: Viewer!
  }

  type Viewer {
    id: ID
    token: String
    avatar: String
    didRequest: Boolean!
  }
`;
