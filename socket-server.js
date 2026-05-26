const { createServer } = require("http")
const { Server } = require("socket.io")

const port = parseInt(process.env.PORT || "3001", 10)
const clientUrl = process.env.CLIENT_URL || "*"

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200)
    res.end("ok")
  } else {
    res.writeHead(404)
    res.end()
  }
})

const io = new Server(httpServer, {
  path: "/api/socketio",
  addTrailingSlash: false,
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
  },
})

io.on("connection", socket => {
  socket.on("join-conversation", conversationId => {
    socket.join(`conversation:${conversationId}`)
  })

  socket.on("leave-conversation", conversationId => {
    socket.leave(`conversation:${conversationId}`)
  })

  socket.on("broadcast-message", ({ conversationId, message }) => {
    socket.to(`conversation:${conversationId}`).emit("new-message", message)
  })
})

httpServer.listen(port, () => {
  console.log(`Socket.io server running on port ${port}`)
})
