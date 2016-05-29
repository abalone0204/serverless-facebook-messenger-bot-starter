'use strict'

var request = require('request')

function display(object) {
    return JSON.stringify(object, null, 2)
}

function genMessageData(text) {
    if (text === 'feeds') {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "淺析 serverless 架構與實作",
                        "subtitle": "May 22, 2016",
                        "image_url": "http://i.imgur.com/lP3wcnh.jpg",
                        "buttons": [{
                            "type": "web_url",
                            "url": "http://abalone0204.github.io/2016/05/22/serverless-simple-crud/",
                            "title": "open"
                        }]
                    }, {
                        "title": "Saga Pattern 在前端的應用",
                        "subtitle": "May 14, 2016",
                        "image_url": "https://upload.wikimedia.org/wikipedia/zh/3/37/Adventure_Time_-_Title_card.png",
                        "buttons": [{
                            "type": "web_url",
                            "url": "http://abalone0204.github.io/2016/05/14/redux-saga/",
                            "title": "open"
                        }]
                    },
                    {
                        "title": "淺入淺出 Generator Function",
                        "subtitle": "May 8, 2016",
                        "image_url": "http://www.rumproast.com/images/uploads/shallow_end_thumb.jpg",
                        "buttons": [{
                            "type": "web_url",
                            "url": "http://abalone0204.github.io/2016/05/08/es6-generator-func/",
                            "title": "open"
                        }]
                    },
                    {
                        "title": "Super tiny compiler",
                        "subtitle": "Apr 25, 2016",
                        "image_url": "https://cloud.githubusercontent.com/assets/952783/14413766/134c4068-ff39-11e5-996e-9452973299c2.png",
                        "buttons": [{
                            "type": "web_url",
                            "url": "http://abalone0204.github.io/2016/04/25/Super-tiny-compiler/",
                            "title": "open"
                        }]
                    }
                    ]
                }
            }
        }
    }
    return {
        text
    }
}

module.exports.handler = function(event, context) {
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))

    const operation = event.operation
    const secret = event.secret

    function sendTextMessage(sender, messageData) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: secret
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: messageData,
            }
        }, (error, response, body) => {
            context.succeed(response);
            if (error) {
                context.fail('Error sending message: ', error);
            } else if (response.body.error) {
                context.fail('Error: ', response.body.error);
            }
        })
    }

    switch (operation) {
        case 'verify':
            const verifyToken = event["verify_token"]
            if (secret === verifyToken) {
                context.succeed(parseInt(event["challenge"]))
            } else {
                context.fail(new Error('Unmatch'))
            }
            break
        case 'reply':
            const messagingEvents = event.body.entry[0].messaging;
            messagingEvents.forEach((messagingEvent) => {
                const sender = messagingEvent.sender.id
                if (messagingEvent.message && messagingEvent.message.text) {
                    const text = messagingEvent.message.text;
                    const messageData = genMessageData(text)
                    sendTextMessage(sender, messageData)
                }
            })
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}