<template>
  <span>
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          :block="block"
          :text="!block"
          :x-small="!block"
          :color="$vuetify.theme.dark && !block ? 'white' : 'green darken-4 white--text'"
          class="rounded-xl"
          :large="block"
          v-on="on"
          @click="initComponent"
        >
          <v-icon :class="block ? 'mr-1' : ''">mdi-wifi-check</v-icon>
          <span v-if="block">
            Ver Estado
          </span>
        </v-btn>
      </template>
      <span>Estatus</span>
    </v-tooltip>
    <v-dialog
      v-model="modal"
      max-width="890"
      class="transparent"
      content-class="elevation-0"
    >
      <v-card
        :loading="loading"
        :class="clientData ? clientData.online ? clientData.error ? 'blue-grey darken-4 rounded-xl' : clientData.address.includes('172.') ? 'blue-grey darken-4 rounded-xl' : 'teal darken-4 rounded-lg' : 'rounded-lg' : 'rounded-lg'"
      >
        <v-card-title>
          <v-icon class="mr-1">mdi-account</v-icon> Estado del usuario
        </v-card-title>
        <v-divider />
        <div
          v-if="loading"
          class="d-flex justify-center align-center"
        >
          <div class="text-center">
            <h2>Consultando en la Mikrotik...</h2>
            <p>Espere por favor...</p>
          </div>
        </div>
        <div v-else>
          <v-card-text v-if="clientData && clientData.error === null">
            <div class="d-flex mb-2 align-center">
              <v-icon class="mr-2">{{ clientData && !clientData.online && clientData.exists ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline' }}</v-icon>
              <v-chip outlined label class="mr-2" :to="`/client/${clientid}?city=${$route.query.city}&clienttype=${$route.query.clienttype}`">{{ name }}</v-chip>
              <h3> Se encuentra <strong>{{ clientData && !clientData.online && clientData.exists ? 'fuera de linea' : clientData.address.includes('172.') ? 'en linea pero NO ESTA NAVEGANDO (SIGUE CORTADO) REPORTAR A NICO' : 'en linea ' }}</strong>
              </h3>
            </div>
            <v-alert
              v-if="clientData && !clientData.online && clientData.exists"
              dense
              outlined
              type="error"
              class=""
            >
              Lleva fuera de linea <strong>{{ formatTimeOffLineSince(clientData.offlineTime) }}</strong> <br>
              Desde <strong>{{ formatTimeOffLine(clientData.offlineTime) }}</strong> <br>
              Razón de la desconexión: <strong>{{ disconnectReason(clientData.disconnectReason) }}</strong> <br>
              Última MAC conocida: <strong>{{ clientData.lastCallerId }}</strong> <br>
              Última Mikrotik conocida: <strong>{{ clientData.mikrotik }}</strong>
            </v-alert>
            <div v-if="clientData && clientData.online">
              <v-row>
                <v-col>
                  <h3>Acceso: <strong><a :href="`http://${clientData.address}`" target="_blank">{{ clientData.address }}</a></strong></h3>
                  <v-spacer />
                  <h3>Mac: {{ clientData.mac_address }}</h3>
                  <v-spacer />
                  <h3>En Linea: {{ formatTimeOnline(clientData.uptime) }}</h3>
                  <h3>OLT o Puerto: {{ clientData.service }}</h3>
                  <v-spacer />
                </v-col>
                <v-col>
                  <h3>Descarga: <strong>{{ formatBytes(clientData.download) }}</strong></h3>
                  <h3>Subida: <strong>{{ formatBytes(clientData.upload) }}</strong></h3>
                  <h3>Equipo RouterBoard: {{ clientData.mikrotik }}</h3>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
          <v-card-text v-else>
            <v-alert :type="clientData && clientData.errorType === 'not_found' ? 'warning' : 'error'">
              <template v-if="clientData && clientData.errorType">
                <strong>{{ getErrorTitle(clientData.errorType) }}</strong><br>
                {{ clientData.errorMessage }}
              </template>
              <template v-else>
                Error de conexión de la Mikrotik, no se pudo obtener el estado del usuario o el usuario no existe.
              </template>
            </v-alert>
          </v-card-text>
        </div>
        <v-card-actions>
          <v-spacer />

          <v-btn
            color="green darken-1"
            text
            @click="modal = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
export default {
  name: 'ClientStatus',
  props: {
    clientid: {
      type: Number,
      default: -1
    },
    name: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      default: ''
    },
    role: {
      type: Array,
      default: () => {}
    },
    block: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: () => {}
    },
    index: {
      type: Number,
      default: -1
    }
  },
  data: () => ({
    clientData: null,
    modal: false,
    clientExists: false,
    showCard: false,
    loading: true,
    showInfo: false,
    online: false,
    events: [],
    headers: [
      { text: 'Evento', sortable: false, value: 'type' },
      { text: 'Sucedido', sortable: false, value: 'createdAt' },
      { text: '#', sortable: false, value: '' }
    ]
  }),
  computed: {
    clientForDeviceManipulation () {
      return this.$store.state.client.clientForDeviceManipulation
    }
  },
  methods: {
    getErrorTitle (errorType) {
      const titles = {
        timeout: '⏱️ Tiempo de espera agotado',
        not_found: '🔍 Usuario no encontrado',
        connection_error: '🔌 Error de conexión'
      }
      return titles[errorType] || 'Error desconocido'
    },
    async initComponent () {
      this.loading = true
      this.modal = true
      this.online = false
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}clientstatus?id=${this.clientid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.json())
        .then((clientstatus) => {
          this.loading = false
          this.clientData = clientstatus.data
          if (clientstatus.error === null && clientstatus.data) {
            this.clientData.error = clientstatus.error
            this.searchDeviceByClient(clientstatus.data.mac_address ? clientstatus.data.mac_address : null)
          }
        })
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          service: this.clientid
        },
        pagination: {
          page: 1,
          pageSize: 50
        },
        sort: ['createdAt:desc']
      },
      {
        encodeValuesOnly: true
      })
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}pppoe-events?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.json())
        .then((events) => {
          this.loading = false
          this.events = events.data
        })
    },
    async searchDeviceByClient (mac = 'default') {
      if (mac) {
        const macOfCurrentDevice = mac.replace(/:/g, '')
        await this.$store.dispatch('client/clientForDeviceManipulation', {
          serviceid: this.clientid,
          token: this.$store.state.auth.token
        })
        if (!this.clientForDeviceManipulation) { return }
        const devices = this.clientForDeviceManipulation.mac_addresses.map((device) => {
          const newDevice = { ...device }
          newDevice.mac_address = newDevice.mac_address.replace(/:/g, '')
          return device
        })
        if (devices.length === 0) {
          this.$store.dispatch('device/assignDeviceToClient', {
            token: this.$store.state.auth.token,
            serviceid: this.clientid,
            mac: macOfCurrentDevice
          })
          this.$toast.info('Nueva MAC asignada', { duration: 5000 })
          return
        }
        if (devices.length > 0) {
          const device = devices.find(device => device.mac_address === macOfCurrentDevice)
          if (!device) {
            this.$store.dispatch('device/assignDeviceToClient', {
              token: this.$store.state.auth.token,
              serviceid: this.clientid,
              mac: macOfCurrentDevice
            })
            this.$toast.info('Nueva MAC asignada', { duration: 5000 })
          }
        }
      }
    },
    formatBytes (bytes, decimals = 2) {
      if (bytes === 0) { return '0 Bytes' }

      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    },
    formatTimeOnline (string) {
      const time = string.split('d')
      let days = 0
      let hours = 0
      let minutes = 0

      if (time.length > 1) {
        days = parseInt(time[0])
        const remainingTime = time[1]

        if (remainingTime.includes('h')) {
          const timeParts = remainingTime.split('h')
          hours = parseInt(timeParts[0])
          const minutesPart = timeParts[1]

          if (minutesPart.includes('m')) {
            minutes = parseInt(minutesPart.split('m')[0])
          }
        } else if (remainingTime.includes('m')) {
          minutes = parseInt(remainingTime.split('m')[0])
        }
      } else if (string.includes('h')) {
        hours = parseInt(time[0].split('h')[0])
        const minutesPart = time[0].split('h')[1]

        if (minutesPart.includes('m')) {
          minutes = parseInt(minutesPart.split('m')[0])
        }
      } else if (string.includes('m')) {
        minutes = parseInt(time[0].split('m')[0])
      }

      return `${days} días, ${hours} horas y ${minutes} minutos`
    },
    formatTimeOffLine (fecha) {
      if (fecha === '1970-01-01 00:00:00' || fecha === undefined || fecha === '' || fecha === null) {
        return 'Sin registro de desconexión'
      }
      const meses = {
        jan: 'enero',
        feb: 'febrero',
        mar: 'marzo',
        apr: 'abril',
        may: 'mayo',
        jun: 'junio',
        jul: 'julio',
        aug: 'agosto',
        sep: 'septiembre',
        oct: 'octubre',
        nov: 'noviembre',
        dec: 'diciembre'
      }

      const partes = fecha.split(' ')
      const fechaPartes = partes[0].split('/')

      const dia = fechaPartes[1]
      const mes = meses[fechaPartes[0]]
      const año = fechaPartes[2]
      const hora = partes[1].split(':')[0]
      const minutos = partes[1].split(':')[1]
      const ampm = Number(hora) >= 12 ? 'pm' : 'am'
      const formatoFecha = `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${dia} de ${año}`
      const formatoHora = `${Number(hora) > 12 ? Number(hora) - 12 : hora}:${minutos} ${ampm}`

      return `${formatoFecha} ${formatoHora}`
    },
    formatTimeOffLineSince (fecha) {
      if (fecha === '1970-01-01 00:00:00' || fecha === undefined || fecha === '' || fecha === null) {
        return 'Sin registro de desconexión'
      }
      const fechaActual = new Date()
      const fechaCadena = new Date(fecha)
      const diferenciaMilisegundos = Math.abs(fechaCadena - fechaActual)
      const segundos = Math.floor(diferenciaMilisegundos / 1000)
      const minutos = Math.floor(segundos / 60)
      const horas = Math.floor(minutos / 60)
      const dias = Math.floor(horas / 24)

      const diferencia = {
        dias,
        horas: horas % 24,
        minutos: minutos % 60,
        segundos: segundos % 60
      }

      const formatoDiferencia = `${diferencia.dias <= 1 ? '' : diferencia.dias} ${diferencia.dias <= 1 ? '' : 'dias'} ${diferencia.horas} horas ${diferencia.minutos} minutos`

      return formatoDiferencia
    },
    disconnectReason (string) {
      let traduccion = ''

      switch (string) {
        case 'hung-up':
          traduccion = 'Perdida de potencia optica o fallo en cable UTP'
          break
        case 'peer request':
          traduccion = 'Usuario desconecto el equipo'
          break
        case 'nas request':
          traduccion = 'El usuario fue pateado'
          break
        default:
          traduccion = 'Razón desconocida'
          break
      }

      return traduccion
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      return humanDateFormat
    },
    getHour (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { hour: 'numeric', minute: 'numeric', hour12: true })
      return humanDateFormat
    }
  }
}
</script>

<style>

</style>
