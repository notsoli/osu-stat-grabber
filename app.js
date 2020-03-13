// allows connection to the osu! IRC server
const irc = require('irc')

// allows connection to the osu! API
const request = require('request')

// allows access to the file system
const fs = require('fs')

// creates an object that stores player data
function Player(name, rank, playtime, playcount, creation, accuracy) {
  this.name = name
  this.rank = rank
  this.playtime = playtime
  this.playcount = playcount
  this.accuracy = accuracy
}

// creates variables to store the user's username and password
let username, password

// creates an array containing user data
const playerData = []

// allows the program to accept input from the console
const readline = require('readline')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.question("What is your osu! username? (This is used simply to connect to the osu! IRC server and is kept entirely local.): ", (user) => {
  username = user
  rl.question("What is your osu! IRC password? You can get it from https://osu.ppy.sh/p/irc (This is used simply to connect to the osu! IRC server and is kept entirely local.): ", (pass) => {
    password = pass
    grabUsers()
  })
})

// gets a list of users currently connected to Bancho
function grabUsers () {
  console.log("Trying to connect to the osu! IRC server.")
  const client = new irc.Client('irc.ppy.sh', username, {
    userName: username,
    password: password,
    channels: ['#osu']
  })

  client.addListener('names', (channel, nicks) => {
    console.log("Successfully connected to the osu! IRC server. Player information will now be collected. This may take a bit.")
    requestToken(Object.getOwnPropertyNames(nicks))
  })

  client.addListener('error', (message) => {
    console.log('error: ', message)
  })
}

// requests the user's API token
function requestToken(nicks) {
  rl.question("What is your osu! API token? You can get it from https://osu.ppy.sh/p/api (This is used to get extra player information and is kept entirely local.): ", (token) => {
    collectPlayerInformation(nicks, token)
  })
}

// uses the osu! API to collect player information like rank and hours played
function collectPlayerInformation(nicks, token) {
  searchQuery(nicks, token, () => {
    console.log("Done collecting user information.")
    console.log(playerData)
    savePlayerData(playerData)
  })
}

// grabs player information from each username in nicks[]
function searchQuery(nicks, token, callback, index) {
  // give index a default value
  if (index == undefined) {index = 0}

  // create request url
  const url = 'https://osu.ppy.sh/api/get_user?k=' + token + '&type=string&u=' + nicks[index]

  request(url, function(error, response, body) {
    // print error if one occurred
    if (error) {
      console.log(error)
    }

    // print the status code
    if (response.statusCode != 200) {
      console.log(response.statusCode)
    }

    // create a json object containing the returned data
    const data = JSON.parse(body)[0]

    try {
      playerData.push(new Player(data.username, data.pp_rank, data.total_seconds_played, data.playcount, data.join_date, data.accuracy))
      console.log("Data collected for user " + nicks[index] + ".")
    } catch {
      console.log("Error collecting data for user " + nicks[index] + ".")
    }
    if (index < nicks.length - 1) {
      setTimeout(() => {
        searchQuery(nicks, token, callback, index + 1)
      }, 1000)
    } else {
      callback()
    }
  })
}

// saves player data to playerData.json
function savePlayerData(playerData) {
  console.log("Saving player data.")
  const dataString = JSON.stringify(playerData)
  fs.writeFile("playerData.json", dataString, 'utf8', (err) => {
    if (err) {
      console.log("An error occured while saving player data.")
      console.log(err)
    } else {
      console.log("Done saving player data.")
    }
  })
}
