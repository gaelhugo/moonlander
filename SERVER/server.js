const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8081 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    // ws.send(`You sent: ${message}`);
    // ws.send(message);
    ws.send(JSON.stringify(message));
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
