
const server = require("http").createServer()
const { Server } = require("@web-udp/server")

const udp = new Server({ server })

const playerPool = [];

class Player {
  constructor (conn, netId, name, color) {
    this.conn = conn
    this.netId = netId
    this.name = name
    this.color = color
  }

  setPos(x, y) {
    this.x = x
    this.y = y
  }

  serialize() {
    return {
      netId: this.netId,
      name: this.name,
      color: this.color,
      pos: {
        x: this.x,
        y: this.y
      }
    }
  }
}

function serializePlayerPool(exceptNetId = []) {
  const serializedPlayerPool = []

  for (const [netId, player] of Object.entries(playerPool)) {
    if (exceptNetId.includes(netId)) {
      continue
    }

    serializedPlayerPool.push(player.serialize())
  }

  return serializedPlayerPool
}

function broadcast(packet, exceptNetIds = []) {
  for (const [netId, player] of Object.entries(playerPool)) {
    if (exceptNetIds.includes(netId)) {
      continue
    }

    player.conn.send(JSON.stringify(packet))
  }
}

udp.connections.subscribe(conn => {
  
  const playerColor = `#${Math.floor(Math.random()*16777215).toString(16)}`
  playerPool[conn.id] = new Player(conn, conn.id, conn.metadata.name, playerColor)
  
  conn.send(JSON.stringify({h:'setcolor', p: {color: playerColor}}))

  broadcast({
    h: 'player-enter',
    p: playerPool[conn.id].serialize()
  }, [conn.id])

  conn.messages.subscribe(message => {
    const {h, p} = JSON.parse(message)

    if (h == 'ppos') {
      playerPool[conn.id].x = p.x      
      playerPool[conn.id].y = p.y     
    }
  })

  conn.closed.subscribe(() => {
    delete playerPool[conn.id]

    broadcast({
      h: 'player-exit',
      p: {netId: conn.id}
    }, [conn.id])
  })

  conn.errors.subscribe(err => console.error(err))
})

setInterval(function () {
  for (const [netId, player] of Object.entries(playerPool)) {
    const serializedPlayerPool = serializePlayerPool(netId)
    player.conn.send(JSON.stringify({
      h: 'tick',
      p: serializedPlayerPool
    }))
  }
}, 16);

server.listen(8000)
console.log('Server started at 8000')