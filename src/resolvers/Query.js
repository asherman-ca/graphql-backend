// if a query is same on yoga and prisma (with zero logic), you can use forwardTo:

const { forwardTo } = require('prisma-binding');

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
  }
}

module.exports = Query;

// because this has no logic it can be simplified as shown above

const simpleQuery = {
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  }
};