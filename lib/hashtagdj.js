/*
*
* To run:
* token=THE_BOT_TOKEN node hashtagdj.js
*
 */

var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var applescript = require('./node_modules/applescript/lib/applescript.js');

var djBot = {};


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    debug: false
});

controller.spawn({
    token: process.env.token
}).startRTM(function(err) {
    if (err) {
        throw new Error(err);
    }
});

djBot.variables = {
    trackName : '',
    trackArtist : '',
    trackAlbum : '',
    trackId : ''
};

djBot.botReply = function(bot, message, text) {
    bot.reply(
        message,
        {
            'text'   : text,
            'mrkdwn' : true
        }
    );
};

djBot.tellSpotify = function(bot, message, script, text) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame <@jimmy>.");
        } else {
            djBot.botReply(bot, message, text);
        }

    });
};

djBot.askSpotifyArtist = function(bot, message, script) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame <@jimmy>.");
            djBot.variables.trackArtist = false;
        } else {
            djBot.variables.trackArtist = rtn;
            djBot.askSpotifyName(bot, message, 'applescripts/trackName.applescript');
        }
    });

};

djBot.askSpotifyName = function(bot, message, script) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame <@jimmy>.");
            djBot.variables.trackName = false;
        } else {
            djBot.variables.trackName = rtn;
            djBot.askSpotifyAlbum(bot, message, 'applescripts/trackAlbum.applescript');
        }
    });

};

djBot.askSpotifyAlbum = function(bot, message, script) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame <@jimmy>.");
            djBot.variables.trackAlbum = false;
        } else {
            djBot.variables.trackAlbum = rtn;
            // djBot.askSpotifyId(bot, message, 'applescripts/trackId.applescript');
            djBot.displaySong(bot, message);
        }
    });

};

djBot.askSpotifyId = function(bot, message, script) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame <@jimmy>.");
            djBot.variables.trackId = false;
        } else {
            djBot.variables.trackId = rtn;
            djBot.displaySong(bot, message);
        }
    });

};

djBot.displaySong = function(bot, message) {

    if (
        djBot.variables.trackName &&
        djBot.variables.trackArtist &&
        djBot.variables.trackAlbum
    ) {
        //var songInfo = "*" + djBot.variables.trackName + "*\n" + djBot.variables.trackArtist + "\n" + djBot.variables.trackAlbum;
        
        var songInfo = {
            'username': 'thedj' ,
            'text': "Here ya go <@" + message.user + ">",
            'attachments': [
                {
                    'fallback' : 'Currently playing track info',
                    'title': 'Currently Playing Track',
                    'text': djBot.variables.trackName + "\n_" + djBot.variables.trackArtist + "_\n_" + djBot.variables.trackAlbum + "_",
                    'color': '#23CF5F',
                    "mrkdwn_in": ["text"]
                }
            ]
        };
        
        bot.reply(message, songInfo);
    } else {
        djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame <@jimmy>.");
    }

};


controller.hears(['#dj'], ['mention', 'direct_message', 'direct_mention'], function(bot, message) {
    var messageRecieved = message.text;

    var messageFiltered = messageRecieved.replace('#dj ', '#dj');
    messageFiltered = messageFiltered.replace('#dj', '');

    var text = "Sorry I didn't catch that. My hearing is pretty bad after so much music.\nSummon me with _#dj command_";
    var script = '';

    switch (messageFiltered){
        case ('help'):
            text = "What I know\n" +
                "*help*\n" +
                " - _List of everything I know_\n\n" +
                "*skip*\n" +
                " - _Don't like the song? Don't worry! I'll skip it!_\n\n" +
                "*what is this song*\n" +
                " - _I am the king of Name That Tune! I can tell you any song that is playing._";
            djBot.botReply(bot, message, text);
            break;

        case ('skip'):
            text = "Song skipped. If you were enjoying it, blame <@" + message.user + ">";
            script = 'applescripts/skip.applescript';
            djBot.tellSpotify(bot, message, script, text);
            break;

        case ('what is this song'):
            djBot.askSpotifyArtist(bot, message, 'applescripts/trackArtist.applescript');

            break;

        default:
            djBot.botReply(bot, message, text);
            break;
    }

});
