const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://smart-waste-pics-pfy6.vercel.app/", 
        methods: ["GET", "POST"]
    }
});


const chatRooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('announce_report_to_admin', (report) => {
        console.log('📩 Report announced to admin:', report.id);
        io.emit('announce_report_to_admin', report);
    });

    socket.on('join_report_chat', (reportId) => {
        console.log(`Socket ${socket.id} joining chat room for report ${reportId}`);
        socket.join(`report_${reportId}`);
        

        if (!chatRooms.has(reportId)) {
            chatRooms.set(reportId, new Set());
        }
        chatRooms.get(reportId).add(socket.id);
        
        console.log(`👥 Room report_${reportId} now has ${chatRooms.get(reportId).size} participants`);
    });

    socket.on('send_message', (data) => {
        const { reportId, text, sender } = data;
        console.log(`💬 Message from ${sender} in report ${reportId}: "${text}"`);
        
        io.to(`report_${reportId}`).emit('receive_message', {
            reportId,
            text,
            sender,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Message broadcasted to room report_${reportId}`);
    });

    socket.on('status_changed', (data) => {
        const { reportId, status } = data;
        console.log(`Report ${reportId} status changed to ${status}`);
        
        io.emit('status_changed', {
            reportId,
            status
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        chatRooms.forEach((participants, reportId) => {
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                console.log(`Removed ${socket.id} from room report_${reportId}`);
            }
            if (participants.size === 0) {
                chatRooms.delete(reportId);
                console.log(`Removed empty room report_${reportId}`);
            }
        });
    });
});

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});