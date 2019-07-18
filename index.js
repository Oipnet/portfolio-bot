require('dotenv').config()
const app = require('express')()
const http = require('https').createServer(app)
const io = require('socket.io')(http);
const Discord = require('discord.js')
const bot = new Discord.Client()

bot.login(process.env.BOT_TOKEN)


bot.on('ready', () => {
    const sockets = []

    bot.channels
        .filter(channel => channel.name.indexOf('client-') >= 0)
        .map(channel => channel.delete())

    bot.on('message', (message) => {
        if (message.content === '!ping') {
            message.channel.send('pong')
        }
    })

    bot.on('message', (message) => {
        if (message.author.username === 'Arnich') {
            sockets.find(soc => soc.name === message.channel.name).socket
                .emit('answer', { 
                    author: 'me',
                    message: message.content,
                    channel: message.channel.name
                })
        }
    })

    io.on('connection', function(socket) {
        socket.on('user-connect', () => {
            const guild = bot.guilds.find(guild => guild.name === 'oipnet')
            guild.createChannel(
                'client-' + sockets.length,
                'text', [{
                    id: guild.defaultRole.id,
                    deny: ['VIEW_CHANNEL']
                },
                {
                    id: guild.roles.find(role => role.name === 'Admin').id,
                    allow: ['VIEW_CHANNEL']
                }
                ]
            ).then(channel => {
                channel.send('Nouveau client')
                sockets.find(soc => soc.name === channel.name).socket.emit('answer', {
                    'author': 'me', 
                    message: 'Bienvenue, n\'hesitez pas a poser une question j\'y repondrais dans les plus brefs delais',
                    channel: channel.name
                })
            })

            sockets.push({'name': 'client-' + sockets.length, 'socket': socket})
        })

        socket.on('new-message', (message) => {
            bot.channels.find(channel => channel.name === message.channel).send(message.message)
        })

        socket.on('disconnect', function(){
            const disc = sockets.find(soc => soc.socket === socket)

            if (disc) {
                bot.channels
                .filter(channel => channel.name === disc.name)
                .map(channel => channel.delete())
            }
        });
    });

    http.listen(process.env.SOCKET_PORT || 6666, () => {
        console.log(`Listening on port ${process.env.SOCKET_PORT || 6666}`)
    })
})