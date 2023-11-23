const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    let joinedRoom;
    let userName;

    socket.on('join room', ({ name, room }) => {
        joinedRoom = room;
        userName = name;
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = new Set();
        }
        rooms[room].add(name);
        socket.to(room).emit('notification', `${name} entrou na sala.`);
        io.to(room).emit('room users', Array.from(rooms[room]));
    });

    socket.on('typing', () => socket.to(joinedRoom).emit('typing', userName));

    socket.on('stop typing', () => socket.to(joinedRoom).emit('stop typing', userName));

    socket.on('chat message', ({ room, message, name }) => io.to(room).emit('chat message', { message, name }));

    socket.on('disconnect', () => {
        if (joinedRoom && rooms[joinedRoom]) {
            rooms[joinedRoom].delete(userName);
            socket.to(joinedRoom).emit('notification', `${userName} saiu da sala.`);
            io.to(joinedRoom).emit('room users', Array.from(rooms[joinedRoom]));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
