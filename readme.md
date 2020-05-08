// DEPLOYMENT
1. Prisma Server
  - this is the db by itself, no logic just graphql schema on top of postgres
  - the Prisma deploy doesnt involve git or deploying code
  - it uses the datamodel.prisma file to setup a db on heroku without attached logic
  - prisma deploy command and then chosing an existing db
2. Yoga Server
  - this is the real express server
  - heroku apps:create sandbox-yoga-prod
  - git push heroku
3. React/Next Server

- change mail host to postmark or mailjet or mandril

Prisma dev deploy: prisma deploy --env-file variables.env
<!-- I think this opened the dialogue to change the deploy target and deploy -->
Prisma prod deploy: npm run deploy -- -n

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
-consider portmark for production mail service

schema.graphql is the schema / typing for yoga (aka express), which will largely mirror the prisma schema
  so, yoga = inbound/outbound request/response facing and prisma = db facing

TODO:
4/21-add image update interface to item update mutation

Docs:
https://www.prisma.io/tutorials/a-guide-to-common-resolver-patterns-ct08
https://www.prisma.io/blog/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a
https://app.prisma.io/
https://v1.prisma.io/docs/1.34/

// PRISMA CONSOLE
https://app.prisma.io/

// CLOUD SERVICES
-stripe
-cloudinary
-prisma