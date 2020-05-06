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
  async order(parent, args, ctx, info) {
    // ensure logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to view order')
    }
    // query current order
    const order = await ctx.db.query.order({
      where: { id: args.id }
    }, info)
    // check permissions to see this order
    const isOwner = order.user.id === ctx.request.userId
    const isElevated = ctx.request.user.permissions.includes('ADMIN')
    if (!isOwner && !isElevated) {
      throw new Error('Insufficient elevation')
    }
    // return the order
    return order
  },
  async orders(parent, args, { request: { userId }}, info) {
    // ensure logged in
    if (!userId) {
      throw new Error('Must be signed in to view orders')
    }
    // query orders by user id
    return ctx.db.query.users({
      where: { user: { id: userId}}
    }, info)
  }
}

module.exports = Query;

// because this has no logic it can be simplified as shown above with forwardTo

const simpleQuery = {
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  }
};