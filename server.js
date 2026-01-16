import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;

// Render requires binding to 0.0.0.0
const wss = new WebSocketServer({
    port: PORT,
    host: "0.0.0.0"
});

const rooms = new Map();

wss.on("connection", (ws) => {
    ws.roomId = null;

    ws.on("message", (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            console.error("Invalid JSON");
            return;
        }

        // ===== JOIN ROOM =====
        if (data.type === "join") {
            ws.roomId = data.room;

            if (!rooms.has(ws.roomId)) {
                rooms.set(ws.roomId, new Set());
            }

            rooms.get(ws.roomId).add(ws);
            console.log(`User joined room: ${ws.roomId}`);
            return;
        }

        // ===== SIGNAL RELAY =====
        if (data.type === "signal" && ws.roomId) {
            const clients = rooms.get(ws.roomId);
            if (!clients) return;

            clients.forEach(client => {
                if (client !== ws && client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: "signal",
                        payload: data.payload
                    }));
                }
            });
        }
    });

    ws.on("close", () => {
        if (!ws.roomId) return;

        const room = rooms.get(ws.roomId);
        if (!room) return;

        room.delete(ws);

        if (room.size === 0) {
            rooms.delete(ws.roomId);
        }

        console.log(`User left room: ${ws.roomId}`);
    });
});

console.log(`✅ WebSocket signaling server running on port ${PORT}`);
