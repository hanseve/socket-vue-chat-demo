// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
//http
var http = require('http');
var server = http.createServer(app);
var port = process.env.PORT || 3000;
var io = require('socket.io')(server);
server.listen(port, () => {
    console.log('Http Server listening at port %d', port);
});

var numUsers = 0;
var connectedUsername = {};
io.on('connection', (socket) => {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new:message', (data) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new:message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add:user', (username) => {
        if (addedUser) return;
        // whether nickname duplication or not
        if (connectedUsername[username]) {
            // tell client itself duplication
            socket.emit('user:exists', {
                username: username,
            });
            return;
        }

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;

        connectedUsername[username] = 1;

        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user:joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop:typing', () => {
        socket.broadcast.emit('stop:typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;
            delete connectedUsername[socket.username];

            // echo globally that this client has left
            socket.broadcast.emit('user:left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});

//https
var fs = require('fs');
var https = require('https');
var options = {
    key: fs.readFileSync('./encryption/server.key'),
    cert: fs.readFileSync('./encryption/server.crt'),
};
var httpsServer = https.createServer(options, app);
var ios = require('socket.io')(httpsServer);
httpsServer.listen(4433, () => {
    console.log('Https Server listening at port %d', 4433);
});

var httpsNumUsers = 0;
var httpsConnectedUsername = {};
ios.on('connection', (socket) => {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new:message', (data) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new:message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add:user', (username) => {
        if (addedUser) return;
        // whether nickname duplication or not
        if (httpsConnectedUsername[username]) {
            // tell client itself duplication
            socket.emit('user:exists', {
                username: username,
            });
            return;
        }

        // we store the username in the socket session for this client
        socket.username = username;
        ++httpsNumUsers;
        addedUser = true;

        httpsConnectedUsername[username] = 1;

        socket.emit('login', {
            numUsers: httpsNumUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user:joined', {
            username: socket.username,
            numUsers: httpsNumUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop:typing', () => {
        socket.broadcast.emit('stop:typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --httpsNumUsers;
            delete httpsConnectedUsername[socket.username];

            // echo globally that this client has left
            socket.broadcast.emit('user:left', {
                username: socket.username,
                numUsers: httpsNumUsers
            });
        }
    });
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

