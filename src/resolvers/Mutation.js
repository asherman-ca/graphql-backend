const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// crypto is build into node
const { randomBytes } = require('crypto');
const { promisify } = require('util');
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
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  async requestReset(parent, { email }, ctx, info) {
    // check if this is a real user
    const user = await ctx.db.query.user({
      where: { email: email }
    });
    if(!user){
      throw new Error(`No user for ${email}`)
    }
    // set reset token and expiry (cryptographical strength!)
    const randomBytesPromise = promisify(randomBytes);
    const resetToken = (await randomBytesPromise(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      },
    });
    console.log(res);
    return { message: 'thanks' };
    // email them reset token
  },
  async resetPassword(parent, { resetToken, password, confirmPassword }, ctx, info) {
    // check if passwords match
    const hasMatchingPasswords = password === confirmPassword
    if(!hasMatchingPasswords){
      throw new Error(`Passwords dont match`);
    }
    // check if its a legit reset token and check if expired
    const [user] = await ctx.db.query.users({
      where: { 
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    })
    if(!user){
      throw new Error(`token: ${resetToken} is invalid or expired`)
    }
    // hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // save the new password to the user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });
    console.log(updatedUser);
    // generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // set JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    });
    // return the new user
    return updatedUser;
  }
};

module.exports = Mutations;