const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// the info variable contains the return data shape requested by the frontend
// "a 2nd argument so it knows what data to return to the client"
// also prevents requerying already fetched information

// this might be the best quote:
// it "passes the query from the frontend"

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    }, info);

    return item;
  },
  async updateItem(parent, args, ctx, info) {

    const updates = { ...args };
    delete updates.id;
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id
      },
    }, info);
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1 find the item
    const item = await ctx.db.query.item({ where }, `{ id 
      title}`);
    // 2 c TODO heck if they own item
    // 3 delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    // in case people cap their emails
    args.email = args.email.toLowerCase();
    // hash their password
    const password = await bcrypt.hash(args.password, 10);
    // create user
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] }
      }
    }, info);
    // create jwt for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the JWT as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    });
    // return user to browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    userEmail = email.toLowerCase();
    const user = await ctx.db.query.user({
      where: { email: userEmail }
    });
    if(!user) {
      throw new Error(`No such user found for email ${userEmail}`);
    }
    const hasValidCredentials = await bcrypt.compare(password, user.password);
    if(!hasValidCredentials) {
      throw new Error(`Invalid password for ${email}`)
    }
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    });
    return user;
  },
  async signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  }
};

module.exports = Mutations;
