// because this has no logic it can be simplified as shown below

const simpleQuery = {
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  }
};

// b/c query is same on yoga and prisma (with zero logic), you can do this instead:

const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
}

module.exports = Query;
