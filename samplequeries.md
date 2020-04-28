//// Auth:

mutation requestReset{
  requestReset(email: "asd@asd.com") {
    message
  }
}

mutation resetPassword {
  resetPassword(
    resetToken: "b3577f9b5541cf32099933338f543b3f80852201", 
    password: "asd",
    confirmPassword: "asd"
  ) {
    id
    email
  }
}

mutation signUp {
  signup(email: "email2" password: "password" name: "name") {
    id
    email
  }
}


//// Items:

mutation createItem {
  createItem(
    title: "words" description: "words" price: 50 image: "words" largeImage: "words") {
    title
  }
}

query allItems {
  items {
    id
    title
  }
}

query singleItem {
  item(where:{
    id: "ck97vthxr9wew0934kgq87wym"
  }) {
    title
    description
    price
  }
}

query dataAboutItems{
  itemsConnection {
    aggregate {
      count
    }
  }
}