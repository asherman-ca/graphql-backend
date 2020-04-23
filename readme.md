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

Data creation flow (unit 14):
-edit data model
-deploy to prisma
-edit schema.graphql for yoga
-write a resolver in mutation/query or both

notes:
schema.graphql is the schema for yoga (aka express), which will largely mirror the prisma schema

TODO:
4/21-add image update interface to item update mutation

Docs:
https://www.prisma.io/tutorials/a-guide-to-common-resolver-patterns-ct08
https://www.prisma.io/blog/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a