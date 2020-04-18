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