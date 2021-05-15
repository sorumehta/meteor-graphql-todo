import { Meteor } from 'meteor/meteor';
import { startGraphQLServer } from 'meteor/quave:graphql/server';
import {TasksCollection} from '../db/TasksCollection'


const log = error => console.error('GraphQL server error', error);

const UserSchema = `
  type Query {
    loggedUser: User
  } 
  
  type User {
    _id: ID!
    username: String
  }
`;

const UserResolvers = {
  Query: {
    async loggedUser(root, args, { userId }) {
      if (!userId) {
        return null;
      }
      return Meteor.users.findOne(userId);
    },
  },
};

const TaskSchema = `
  type Query {
    tasks: [Task]
  } 
  
  type Task {
    _id: ID!
    text: String
    createdAt: String
    isChecked: Boolean
    user: User
  }

  type Mutation {
    addTask(text: String!): Task
  }
`;

const TaskResolvers = {
  Query: {
    async tasks(root, args, { userId }) {
      if (!userId) {
        return null;
      }
      return TasksCollection.find({ userId }, { sort: { createdAt: -1 } });
    },
  },
  Mutation: {
    addTask(root, {text}, {userId}) {
      if (!userId) {
        return null;
      }
      return TasksCollection.save({text, userId});
    }
  },
  Task: {
    user({ userId }) {
      return Meteor.users.findOne(userId);
    }
  }
};

startGraphQLServer({
    typeDefs: [UserSchema, TaskSchema],
    resolvers: [UserResolvers, TaskResolvers],
    log
  });
  