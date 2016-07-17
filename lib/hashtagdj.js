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

djBot.botDirectReply = function(bot, message, text) {
    bot.startPrivateConversation(message,function(err,dm) {
        dm.say(text);
    });
};

djBot.tellSpotify = function(bot, message, script, text) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame Jimmy.");
        } else {
            djBot.botReply(bot, message, text);
        }

    });
};

djBot.askSpotifyArtist = function(bot, message, script) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame Jimmy.");
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
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame Jimmy.");
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
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame Jimmy.");
            djBot.variables.trackAlbum = false;
        } else {
            djBot.variables.trackAlbum = rtn;
            djBot.askSpotifyArtwork(bot, message, 'applescripts/trackArtwork.applescript');
        }
    });

};

djBot.askSpotifyArtwork = function(bot, message, script) {
    applescript.execFile(script, function(err, rtn) {
        if (err) {
            djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame Jimmy.");
            djBot.variables.trackArtwork = false;
        } else {
            djBot.variables.trackArtwork = rtn;
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
        var artwork = '';
        if (djBot.variables.trackArtwork) {
            artwork = djBot.variables.trackArtwork;
        }

        var songInfo = {
            'text': "Here ya go <@" + message.user + ">",
            'attachments': [
                {
                    'fallback' : 'Currently playing track info',
                    'title': 'Currently Playing Track',
                    'text': djBot.variables.trackName + "\n_   " + djBot.variables.trackArtist + "_\n_   " + djBot.variables.trackAlbum + "_",
                    'color': '#23CF5F',
                    "mrkdwn_in": ["text"],
                    "thumb_url": artwork
                }
            ]
        };
        
        bot.reply(message, songInfo);
    } else {
        djBot.botReply(bot, message, "Dang nabbit, something went wrong with your request.\n I blame Jimmy.");
    }

};


controller.hears(['#dj'], ['mention', 'direct_message', 'direct_mention', 'ambient'], function(bot, message) {
    if (message.user == bot.id) return;

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
                "*previous*\n" +
                " - _Did someone skip your jam? Don't let them control your happiness. Go back to the previous song!_\n\n" +
                "*what is this song*\n" +
                " - _I am the king of Name That Tune! I can tell you any song that is playing._\n\n" +
                "*new dj*\n" +
                " - _I will tell you how to be become THE DJ. It's a pretty sweet gig (see what I did there?)._";
            djBot.botReply(bot, message, text);
            break;

        case ('skip'):
            text = "Song skipped. If you were enjoying it, blame <@" + message.user + ">\n" +
                "_Only you can prevent excessive skips. Type #dj previous to go back to your jam!_";
            script = 'applescripts/skip.applescript';
            djBot.tellSpotify(bot, message, script, text);
            break;

        case ('previous'):
            text = "Playing the previous song again. If this makes you angry, blame <@" + message.user + ">";
            script = 'applescripts/previous.applescript';
            djBot.tellSpotify(bot, message, script, text);
            break;

        case ('what is this song'):
            djBot.askSpotifyArtist(bot, message, 'applescripts/trackArtist.applescript');
            break;

        case ('welcome'):
            text = "Hello everyone!\n" +
                "Hate when you want to skip a song or know what song is playing and the DJ is not around? No way, me too! " +
                "I proclaim a decree that your ears will no longer have to suffer through MMMBop (your welcome Jean).\n" +
                "How you ask? Just type _#dj help_ to find out!";
            djBot.botReply(bot, message, text);
            break;

        case ('new dj'):
            var directMessage = {
                'title' : "Hashtag DJ Github",
                'title_link' : 'https://github.com/TylerWalkerLB/hashtag_dj',
                'text': "Becoming the DJ is pretty easy.\n" +
                "You need to clone my Github repo https://github.com/TylerWalkerLB/hashtag_dj, npm install inside the /lib folder, then start me up. " +
                "To start me up you can either get with Tyler to get the exact command (and set up a sweet bash) or look up my access token in the Lifeblue Slack channel. " +
                "If your going to do the latter, here is the command _token=THE_BOT_TOKEN node hashtagdj.js_",
                'mrkdwn' : true
            };
            djBot.botDirectReply(bot, message, directMessage);
            break;

        default:
            djBot.botReply(bot, message, text);
            break;
    }

});

controller.on(['channel_joined'], function(bot) {
    bot.say('Hola');
});
