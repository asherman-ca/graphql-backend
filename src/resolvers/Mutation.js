const Mutations = {
  createDog(parent, args, ctx, info) {
    global.dogs = global.dogs || [];
    global.dogs.push({name: args.name});
    return {name: args.name};
  }
};

module.exports = Mutations;
