import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

// roomId -> [ws, ws]
const rooms = {};

wss.on("connection", (ws) => {

    ws.on("message", (message) => {
        let data;

        try {
            data = JSON.parse(message);
        } catch (err) {
            console.error("Invalid JSON received");
            return;
        }

        // ================= JOIN ROOM =================
        if (data.type === "join") {
            const roomId = data.room;
            ws.room = roomId;

            rooms[roomId] = rooms[roomId] || [];
            rooms[roomId].push(ws);

            // FIRST user = HOST
            const isHost = rooms[roomId].length === 1;

            ws.send(JSON.stringify({
                type: "joined",
                isHost
            }));

            console.log(
                `User joined room ${roomId} | Host: ${isHost}`
            );
        }

        // ================= SIGNALING =================
        if (data.type === "signal") {
            const roomId = ws.room;
            if (!roomId || !rooms[roomId]) return;

            rooms[roomId].forEach(client => {
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
        const roomId = ws.room;
        if (!roomId || !rooms[roomId]) return;

        rooms[roomId] = rooms[roomId].filter(c => c !== ws);

        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }

        console.log(`User left room ${roomId}`);
    });
});

console.log(`WebSocket server running on port ${PORT}`);
