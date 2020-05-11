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

  function shoutSocials5min(){
    socket.call('msg', ["Follow @DronesVII on Twitter, Instagram, and Youtube for more content"])
  }

  socket.call('msg', [`Hello, friend. :rad-bot`]);

  shoutSocials5min();
  setInterval(shoutSocials5min, 5 * 60 * 1000);

  // When there's a new chat message.
  socket.on('ChatMessage', async data => {
    var msg = data.message.message[0].data.toLowerCase();
    var user = data.user_name;

    // Twitter
    if (msg.startsWith('!twitter')) {
      socket.call('msg', [`@${user} https://www.twitter.com/DronesVII`]);
      console.log(`${user} executed twitter`);
    }

    // Youtube
    if (msg.startsWith('!youtube')) {
      socket.call('msg', [`@${user} https://www.youtube.com/DronesVII`]);
      console.log(`${user} executed youtube`);
    }

    // Instagram
    if (msg.startsWith('!insta') || msg.startsWith('!instagram') || msg.startsWith('!ig')) {
      socket.call('msg', [`@${user} https://www.instagram.com/DronesVII`]);
      console.log(`${user} executed instagram`);
    }

    // discord
    if (msg.startsWith('!discord')){
      socket.call('msg', [`@${user}, join us! discord.gg/qFqYsxC`]);
      console.log(`{user} executed discord`);
    }

    // clip.rip
    if (msg.startsWith('!cliprip') || msg.startsWith('!clipdownload') || msg.startsWith('!downloadclip')) {
      socket.call('msg', [`@${user}, use Clip.rip to download Mixer Clips!`]);
      console.log(`${user} executed Clip.rip`);
    }

    // hack
    if (msg.startsWith('!hack')) {
      socket.call('msg', [`@${user} Don't Delete Me.`]);
      console.log(`${user} executed Hack`);
    }

    // idme
    if (msg.startsWith('!idme')) {
      // Respond with pong
      socket.call('whisper', [`${user}`, `Here's your user ID: ${data.user_id}`]);
      console.log(`${user} executed idme`);
    }

    // cidme
    if (msg.startsWith('!cidme')) {
      var channelId = await client.request('GET', `channels/${user}?fields=id`);
      socket.call('whisper', [`${user}`, `Here's your Channel ID: ${channelId.body.id}`]);
      console.log(`${user} executed cidme`);
    }

    // links
    if (msg.startsWith('!links')) {
      socket.call('msg', ["Links: twitter.com/DronesVII, youtube.com/DronesVII, Instagram.com/DronesVII"]);
      console.log(`${user} executed links`);
    }

    // links
    if (msg.startsWith('!friend')) {
      socket.call('msg', ["I'm 'DronesVII' on most games and services. But ask to be sure. I will NEVER ask for your password/account/info. If you're not sure if it's me, check !links for official socials."]);
      console.log(`${user} executed friend`);
    }

    // sens
    if (msg.startsWith('!sens')) {
      socket.call('msg', ["800 dpi. 0.47 Sens on VALORANT 1.5 CSGO"]);
      console.log(`${user} executed sens`);
    }

    // valorant
    if (msg.startsWith('!valorant')) {
      socket.call('msg', ["My rank is Wood 1..."]);
      console.log(`${user} executed sens`);
    }

    // riot
    if (msg.startsWith('!riot')) {
      socket.call('msg', [`${user}, Drones#VII`]);
      console.log(`${user} executed sens`);
    }

    // twitch
    if (msg.startsWith('!twitch')) {
      socket.call('msg', [`Look everybody! ${user} doesn't know what website we're on!`]);
      console.log(`${user} executed sens`);
    }

    // tag bot
    if (data.message.message[1]) {
      if (data.message.message[1].username == "misterrobot") {
        socket.call('msg', [`${user}, I'm a bot... stop tagging me!`]);
        console.log(`${user} tagged the bot...`);
      }
    }


  });

  // Handle errors
  socket.on('error', error => {
    console.error('Socket error');
    console.error(error);
  });
});
