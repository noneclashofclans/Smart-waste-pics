const fetch = require("node-fetch");
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const database = require('./db'); 
require('dotenv').config();

const app = express();

app.use(cors({
    origin: "https://smart-waste-pics-pfy6.vercel.app",
    credentials: true
}));

app.use(express.json()); 

app.use('/api', require('./authRoutes')); 

app.post("/trigger-n8n", async (req, res) => {
    try {
        const r = await fetch("https://n8n-smart-waste-pics.onrender.com/webhook/61e29fbc-00ef-4ab5-9d0a-ac1c416eb8c7", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });

        const data = await r.text();
        res.send(data);
    } catch (err) {
        console.error("n8n proxy error:", err);
        res.status(500).json({ error: "n8n trigger failed" });
    }
});


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://smart-waste-pics-pfy6.vercel.app", 
        methods: ["GET", "POST"]
    }
});

const chatRooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('announce_report_to_admin', (report) => {
        io.emit('announce_report_to_admin', report);
    });

    socket.on('join_report_chat', (reportId) => {
        socket.join(`report_${reportId}`);
        if (!chatRooms.has(reportId)) chatRooms.set(reportId, new Set());
        chatRooms.get(reportId).add(socket.id);
    });

    socket.on('send_message', (data) => {
        io.to(`report_${data.reportId}`).emit('receive_message', data);
    });

    socket.on('status_changed', (data) => {
        io.to(`report_${data.reportId}`).emit('status_changed', data);
    });

    socket.on('disconnect', () => {
        chatRooms.forEach((participants, reportId) => {
            if (participants.has(socket.id)) participants.delete(socket.id);
            if (participants.size === 0) chatRooms.delete(reportId);
        });
    });
});

const PORT = process.env.PORT || 7000;
database().then(() => {
    server.listen(PORT, () => {
        console.log(`API + Sockets running on port ${PORT}`);
    });
});