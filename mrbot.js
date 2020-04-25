// Load in some dependencies
const Mixer = require('@mixer/client-node');
const config = require('config');
const ws = require('ws');


let dronesChannel = config.get("dronesChannelId");
// Instantiate a new Mixer Client
const client = new Mixer.Client(new Mixer.DefaultRequestRunner());
client.use(new Mixer.OAuthProvider(client, {
  tokens: {
    access: config.get('access'),
    expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
  },
}));

/* Gets our Currently Authenticated Mixer user's information. This returns an object
 * full of useful information about the user whose OAuth Token we provided above.
 */
async function getUserInfo() {
  // Users Current will return information about the user who owns the OAuth
  // token registered above.
  return client.request('GET', 'users/current').then(response => response.body);
}

/**
 * Gets connection information from Mixer's chat servers
 * @param {Number} channelId The channelId of the channel you'd like to
 *  get connection information for.
 * @returns {Promise.<>}
 */
async function getConnectionInformation(channelId) {
  return new Mixer.ChatService(client).join(channelId).then(response => response.body);
}

/**
 * Creates a Mixer chat socket and authenticates
 * @param {number} userId The user to authenticate as
 * @param {number} channelId The channel id of the channel you want to join
 * @returns {Promise.<>}
 */
async function joinChat(userId, channelId) {
  const joinInformation = await getConnectionInformation(channelId);
  // Chat connection
  const socket = new Mixer.Socket(ws, joinInformation.endpoints).boot();

  return socket.auth(channelId, userId, joinInformation.authkey).then(() => socket);
}

// Get our Bot's User Information, Who are they?
getUserInfo().then(async userInfo => {

  const socket = await joinChat(userInfo.id, dronesChannel);

  socket.call('msg', [`Hello, friend.`]);

  // Greet a joined user
  // socket.on('UserJoin', data => {
  //   socket.call('msg', [
  //     `Hi ${data.username}!`,
  //   ]);
  // });

  // React to our !ping command
  // When there's a new chat message.
  socket.on('ChatMessage', async data => {

    // hack
    if (data.message.message[0].data.toLowerCase().startsWith('!hack')) {
      socket.call('msg', [`@${data.user_name} Don't Delete Me. !leavehere or !delete.`]);
      console.log(`${data.user_name} executed Hack`);
    }

    // idme
    if (data.message.message[0].data.toLowerCase().startsWith('!idme')) {
      // Respond with pong
      socket.call('whisper', [`${data.user_name}`, `Here's your user ID: ${data.user_id}`]);
      console.log(`${data.user_name} executed idme`);
    }

    if (data.message.message[0].data.toLowerCase().startsWith('!cidme')) {
      var channelId = await client.request('GET', `channels/${data.user_name}?fields=id`);
      socket.call('whisper', [`${data.user_name}`, `Here's your Channel ID: ${channelId.body.id}`]);
      console.log(`${data.user_name} executed cidme`);
    }

    if (data.message.message[1]) {
      if(data.message.message[1].username == "misterrobot"){
        socket.call('msg', [`${data.user_name}, I'm a bot... stop tagging me!`]);
        console.log(`${data.user_name} tagged the bot...`);
      }
    }
  });

  // Handle errors
  socket.on('error', error => {
    console.error('Socket error');
    console.error(error);
  });
});
