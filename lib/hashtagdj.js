/*
*
* To run:
* token=THE_BOT_TOKEN node hashtagdj.js
*
 */

var Botkit = require('./node_modules/botkit/lib/Botkit.js');


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


/* Listeners */

controller.hears(['#dj'], ['mention', 'direct_message', 'direct_mention'], function(bot, message) {
    var messageRecieved = message.text;
    var messageFiltered = messageRecieved.replace('#dj ', '#dj');
    messageFiltered = messageFiltered.replace('#dj', '');

    var reply = "Sorry I didn't catch that. My hearing is pretty bad after so much music.\nSummon me with _#dj command_";

    switch (messageFiltered){
        case ('help'):
            reply = "What I know\n" +
                "*help*\n" +
                " - _List of everything I know_\n\n" +
                "*skip*\n" +
                " - _Don't like the song? Don't worry! I'll skip it!_\n\n" +
                "*what is this song*\n" +
                " - _I am the king of Name That Tune! I can tell you any song that is playing._";
            break;
        case ('skip'):
            reply = "I would love to skip this song if I could";
            break;
        case ('what is this song'):
            reply = "Let me hear a couple more notes...";
            break;
        default:
            break;
    }

    bot.reply(
        message,
        {
            'text'   : reply,
            'mrkdwn' : true
        }
    );

});
