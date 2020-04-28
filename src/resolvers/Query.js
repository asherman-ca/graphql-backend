// if a query is same on yoga and prisma (with zero logic), you can use forwardTo:

const { forwardTo } = require('prisma-binding');

const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user ID
    if(!ctx.request.userId){
      // important to return null
      return null;
    }
    // since we are returning the promise we dont need to wait for it to resolve. it will resolve itself once its been finished and has come back.
    return ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info);
  },
  async users (parent, args, ctx, info) {
    // check if they are logged in
    if(!ctx.request.userId){
      throw new Error('Please log in');
    };
    // check if user has permission to query all users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);
    // query all users
    // info contains the graphql query from the frontend containing the fields we are requesting
    return ctx.db.query.users({}, info);
  },
}

module.exports = Query;

// because this has no logic it can be simplified as shown above

const simpleQuery = {
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  }
};