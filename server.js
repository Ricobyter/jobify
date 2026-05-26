const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  const io = new Server(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  })

  io.on("connection", socket => {
    socket.on("join-conversation", conversationId => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on("leave-conversation", conversationId => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Client emits this after a message is saved to DB; server broadcasts to others
    socket.on("broadcast-message", ({ conversationId, message }) => {
      socket.to(`conversation:${conversationId}`).emit("new-message", message)
    })
  })

  httpServer
    .once("error", err => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
