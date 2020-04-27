const { GraphQLServer } = require('graphql-yoga');
const Mutation =  require('./resolvers/Mutation');
const Query =  require('./resolvers/Query');
const db = require('./db');

// create the graphQL Yoga server (aka create the express server)
// context contains the standard express methods
// unlike standard express, req / res methods follow this signature:
// functionName(parent, args, ctx, info) {
//   return ctx.db.createItem({
//     data: { ...args } 
//   }, info)
// }

function createServer() {
  return new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    resolvers: {
      Mutation,
      Query
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    context: req => ({ ...req, db })
  });
}

module.exports = createServer;
