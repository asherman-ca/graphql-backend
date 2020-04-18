Prisma deploy: prisma deploy --env-file variables.env

graphql playground syntax exp:

query {
  dogs {
    name
  }
}

mutation {
  createDog(name: "dogname") {
    name
  }
}