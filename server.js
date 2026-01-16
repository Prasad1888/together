import { WebSocketServer } from "ws";

const port = process.env.PORT || 3000;
const wss = new WebSocketServer({ port });
const rooms = {};

wss.on("connection", ws => {
    ws.on("message", msg => {
        let data;
        try { data = JSON.parse(msg); }
        catch (e) { console.error("Invalid JSON:", msg); return; }

        // Join room
        if (data.type === "join") {
            ws.room = data.room;
            rooms[ws.room] = rooms[ws.room] || [];
            rooms[ws.room].push(ws);
        }

        // Forward signaling data
        if (data.type === "signal") {
            rooms[ws.room]?.forEach(client => {
                if (client !== ws && client.readyState === 1) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    });

    ws.on("close", () => {
        if (!ws.room) return;
        rooms[ws.room] = rooms[ws.room].filter(c => c !== ws);
    });
});

console.log(`WebSocket server running on ws://localhost:${port}`);
