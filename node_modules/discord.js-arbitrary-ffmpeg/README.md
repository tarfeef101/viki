# FFmpeg with custom parameters in Discord.js

Installation:
```bash
npm install discord.js-arbitrary-ffmpeg --save
```

Example usage:
```javascript
const Discord = require('discord.js');
const playArbitraryFFmpeg = require('discord.js-arbitrary-ffmpeg');

const objBot = new Discord.Client();

// ... login and connect to a voice channel so you get a voice connection ...

// These params will play a sound file in a much faster speed.
// Standard KHz rate is 44.1.
let arrFFmpegParams = [
	'-i', 'sounds/funny-meme-sound.mp3',
	'-filter:a', 'asetrate=r=66K'
];

const objStreamDispatcher = playArbitraryFFmpeg(
	objVoiceConnection, // A VoiceConnection from Discord.js
	arrFFmpegParams,
	{volume: .25} // Optional stream options (same as for playFile, playStream, etc.)
);

```
