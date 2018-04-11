'use strict';

const spawn = require('child_process').spawn;

/**
 * playArbitraryFFmpeg
 *
 * Will spawn a child process ffmpeg with specified parameters.
 * It will also concatenate some standard params that is needed
 * to output sound back into a VoiceConnection
 *
 * @param  {VoiceConnection}	objVoiceConnection	A VoiceConnection instance from Discord.js
 * @param  {array}				arrFFmpegParams		Your custom parameters to FFmpeg
 * @param  {object}				objOptions			Optional stream options
 * @return {StreamDispatcher}	Regular StreamDispatcher
 */
const playArbitraryFFmpeg = function(objVoiceConnection, arrFFmpegParams, objOptions) {

	objOptions = objOptions || {};

	const arrStandardParams = [
		'-f', 'mp3',
		'pipe:1'
	];
	const arrFinalParams = arrFFmpegParams.concat(arrStandardParams);
	let ffmpeg = spawn('ffmpeg', arrFinalParams);

	return objVoiceConnection.playStream(ffmpeg.stdout, objOptions)

};

module.exports = playArbitraryFFmpeg;
