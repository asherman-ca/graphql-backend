// info contains the graphql query from the frontend containing the fields we are requesting (also see bottom of doc)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// crypto is build into node
const stripe = require('../stripe');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, createEmailBody } = require('../mail');
const { hasPermission } = require('../utils');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in');
    }

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args,
        user: {
          connect: {
            id: ctx.request.userId
          }
        }
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
      title user { id }}`);
    // 2 TODO heck if they own item or have permissions
    const hasItemOwnership = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission => {
      return ['ADMIN', 'ITEMDELETE'].includes(permission)
    });
    // 3 delete it
    if(!hasItemOwnership && !hasPermissions) {
      throw new Error('Insufficient Elevation');
    }
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
    // email them reset token

    const messageBody = createEmailBody(`Your password reset link is here: \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Reset Password</a>`);
    const message = {
      from: 'asher@asher.com',
      to: user.email,
      subject: 'password reset',
      text: messageBody
    }
    const mailRes = transport.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    })

    return { message: 'thanks' };
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
  },
  async updatePermissions(parent, args, ctx, info) {
    // check if logged in
    if(!ctx.request.userId){
      throw new Error('Must be logged in')
    }
    // query current user
    const currentUser = await ctx.db.query.user({
      where: {
        id: ctx.request.userId,
      }
    }, info);
    // check permissions
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // update permissions
    return ctx.db.mutation.updateUser({
      where: { id: args.userId },
      data: {
        permissions: {
          // must be set like this because of prisma enum rules
          set: args.permissions
        }
      }
    }, info)
  },
  async addToCart(parent, args, ctx, info) {
    // check logged in
    if(!ctx.request.userId){
      throw new Error('Please log in')
    }
    // query current cart
    // TODO: investigate why i didnt need to pass the info variable in this query
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: ctx.request.userId },
        item: { id: args.id },
      }
    })
    // check if item already in cart and +1 if it is, else create new item
    if(existingCartItem) {
      console.log('this item is already in their cart');
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 }
      }, info)
    }
    // add item to cart
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: ctx.request.userId }
        },
        item: {
          connect: { id: args.id }
        }
      }
    }, info)
  },
  async removeFromCart(parent, args, ctx, info) {
    // find cart item
    const cartItem = await ctx.db.query.cartItem({
      where: {
        id: args.id
      }
    }, `{ id, user { id }}`)
    if (!cartItem) throw new Error('No Cart item found')
    // make sure they own item
    if(cartItem.user.id !== ctx.request.userId) {
      throw new Error('Logged in user id doesnt match cart item user id')
    }
    // delete cart item
    return ctx.db.mutation.deleteCartItem({
      where: { id: args.id }
      // info is the query coming in from the client side
    }, info)
  },
  async createOrder(parent, args, ctx, info) {
    // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) throw new Error('You must be signed in to complete this order.');
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item { title price id description image largeImage }
      }}`
    );
    // 2. recalculate the total for the price in case user tries to spoof price through token
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log(`Going to charge for a total of ${amount}`);
    // 3. Create the stripe charge (turn token into $$$)
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token,
    });
    // 4. Convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      delete orderItem.id;
      return orderItem;
    });

    // 5. create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    });
    // 6. Clean up - clear the users cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    // another very flexible query provided out of the box by Prisma
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds,
      },
    });
    // 7. Return the Order to the client
    return order;
  },
};

module.exports = Mutations;