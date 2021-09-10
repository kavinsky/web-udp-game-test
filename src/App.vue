<template>  
  <div class="game-scene" v-if="conn.status == 'connected'">
    status: {{conn.status}}, net throughput: {{ meanPacketsPerFrame }}packets/sec, x: {{ player.pos.x }} y: {{ player.pos.y }}

    <div class="dot-pool" ref="dotPool">
      <Dot ref="playerDot" :pos="player.pos" :name="player.name" :color="player.color" />
      <div ref="enemyPool">
        <Dot v-for="(enemy, netId) in enemies" :key="netId" :name="enemy.name" :color="enemy.color" :pos="enemy.pos" />
      </div>
    </div>
  </div>

  <div class="connect-scene" v-else>
    <form name="connection" @submit.prevent="connect">
      <h2>Select your name!</h2>
      <p>status: {{conn.status}}</p>
      <input type="text" name="name" v-model="form.name" required 
        class="shadow appearance-none border rounded py-2 px-3 mr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Your name" />
      <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Connect!
      </button>
    </form>
  </div>

</template>

<script>
import { Client } from "@web-udp/client"
import Dot from '@/components/Dot'

const udp = new Client({ url: '172.20.21.206:8000'})


export default {
  name: 'App',
  components: {
    Dot
  },
  async mounted () {
        
  },
  data () {
    return {
      conn: {
        socket: null,
        status: 'disconnected'
      },
      packetsPerFrame: 0,
      meanPacketsPerFrame: 0,
      player: {
        netId: null,
        name: null,
        color: 'black',
        pos: {
          x: 0,
          y: 0,
        },
        previousPos: {
          x: 0,
          y: 0
        }
      },
      enemies:{},
      enemiesCached: [],
      eventHandlers: {
        onmousemove: null
      },
      form: {
        name: null
      }
    }
  },
  methods: {
    async connect () {
      this.conn.status = 'connecting'
      const connection = await udp.connect({
        metadata: {
          name: this.form.name
        }
      })

      connection.messages.subscribe(this.onMessageReceived)
      connection.closed.subscribe(this.onCloseConnection)     


      if (connection.state === 1) {
        this.conn.status = 'connected'
        this.onConnected()
      }

      this.conn.socket = connection
    },
    onConnected () {
      this.player.name = this.form.name

      this.netThroughputCalculation()
      this.$nextTick(this.mouseCaptureStart)
      this.$nextTick(this.startLoop)
    },
    onMessageReceived (msg) {
      this.packetsPerFrame++
      const {h, p} = JSON.parse(msg)
      
      if (h == 'tick') {
        this.updateEnemyPosition(p)
      }

      if (h == 'setcolor') {
        console.log('setcolor', p)
        this.player.color = p.color
      }

      if (h == 'player-enter') {
        console.log('player-enter', p)
      }

      if (h == 'player-exit') {
        console.log('player-exit', p)
        delete this.enemies[p.netId]
      }
    },
    onCloseConnection () {
      this.mouseCaptureStop()
      this.conn.status = 'disconnected'
    },
    netThroughputCalculation () {
      setInterval(() => {
        this.meanPacketsPerFrame = this.packetsPerFrame
        this.packetsPerFrame = 0 
      }, 1000);
    },

    mouseCaptureStart () {
      this.$refs.dotPool.addEventListener('mousemove', this.mouseCaptureEvent)
    },

    mouseCaptureStop () {
      this.$refs.dotPool.removeEventListener('mousemove', this.mouseCaptureEvent)
    },

    updateEnemyPosition (enemies) {
      this.enemies = enemies
    },

    mouseCaptureEvent (event) {
      this.player.pos.x = event.clientX
      this.player.pos.y = event.clientY
    },    

    startLoop () {
      this.runLoop = true
      this.loop()
    },

    loop () {
      if (!this.runLoop) return;

      requestAnimationFrame(() => {
        this.netUpdatePlayerPos()

        this.loop()
      })
    },

    stopLoop () {
      this.runLoop = false
    },
    netUpdatePlayerPos () {
      if (this.player.pos.x !== this.player.previousPos.x || this.player.pos.y !== this.player.previousPos.y) {
        this.sendPacket('ppos', this.player.pos)
        this.player.previousPos.x = this.player.pos.x
        this.player.previousPos.y = this.player.pos.y
      }
    },
    sendPacket(header, payload) {
      this.conn.socket.send(JSON.stringify({
        h: header,
        p: payload
      }))
    }
  }
}
</script>

<style>
@import 'assets/styles/tailwind.postcss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.dot-pool {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  cursor: none;
}

.btn {
  @apply font-bold py-2 px-4 rounded;
}
.btn-blue {
  @apply bg-blue-500 text-white;
}
.btn-blue:hover {
  @apply bg-blue-700;
}
</style>
