<template>
  <div>
    <v-row>
      <v-col
        cols="12"
      >
        <v-card>
          <v-card-title
            :style="`color:${cityColor};`"
          >
            <span class="mr-4">Actualizar comentarios en Mikrotik</span>
            <v-btn
              color="blue darken-4"
              dark
              :loading="loading"
              :disabled="loading"
              class="mr-4"
              @click="generateComments()"
            >
              <v-icon>mdi-plus</v-icon>
              Generar Comentarios
            </v-btn>
            <v-chip
              color="blue darken-4 white--text"
              small
              class="mr-4"
            >
              Clientes en NICOM: {{ clients ? clients.length : '' }}
            </v-chip>
            <v-chip
              color="blue darken-4 white--text"
              small
              class="mr-4"
            >
              Clientes en Mikrotik: {{ MikrotikClient ? MikrotikClient.length : '' }}
            </v-chip>
            <v-chip
              color="cyan darken-4 white--text"
              small
              class="mr-4"
            >
              Exito: {{ successChanges }}
            </v-chip>
            <v-chip
              color="red darken-4 white--text"
              small
              class="mr-4"
            >
              Errores: {{ errorChanges }}
            </v-chip>
            <v-spacer />
            <v-btn
              color="red darken-4"
              dark
              class="mr-4"
              @click="applyComments()"
            >
              <v-icon>mdi-pencil</v-icon>
              Aplicar Comentarios
            </v-btn>
          </v-card-title>
          <client-only>
            <v-data-table
              :key="key"
              :headers="headers"
              :items="clients"
              :search="search"
              :items-per-page="itemsPerPage"
              :page.sync="page"
              :loading="initialLoading"
              sort-by="created_at"
              calculate-widths
              sort-desc
              no-data-text="No hay informacion para mostrar aun..."
              loading-text="Cargando información de clientes..."
              dense
              hide-default-footer
              mobile-breakpoint="100"
              @page-count="pageCount = $event"
            >
              <!-- COMPONENTS IMPLEMETATION -->
              <!-- eslint-disable -->
              <template v-slot:[`item.actions`]="{ item }">
                <div style="white-space:nowrap">
                  <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon
                        v-bind="attrs"
                        color="yellow darken-4"
                        v-on="on"
                        @click="removeItem(clients.map(function(x) {return x._id; }).indexOf(item._id))"
                      >
                        mdi-close
                      </v-icon>
                    </template>
                    <span>Quitar</span>
                  </v-tooltip>
                </div>
              </template>
              <!-- ########################### -->
            </v-data-table>
          </client-only>
          <div class="text-center pt-2">
            <v-pagination v-model="page" :length="pageCount" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'CommentGenerator',
  components: {
  },
  data () {
    return {
      key: 0,
      page: 1,
      pageCount: 0,
      itemsPerPage: 50,
      clients: [],
      MikrotikClient: [],
      search: '',
      currentCity: 'Mariquita',
      successChanges: 0,
      errorChanges: 0,
      cityName: '',
      cityColor: '',
      alertBox: false,
      loading: false,
      dialog: false,
      dialogEdit: false,
      initialLoading: false,
      headers: [
        { text: 'Nombre', sortable: true, value: 'name' },
        { text: 'Modelo', sortable: true, value: 'newModel' },
        { text: 'Comentario', sortable: true, value: 'comment' },
        { text: 'Acciones', sortable: false, value: 'actions' }
      ],
      title: 'Cambios de Clave',
      States: [{ name: 'Abierto', value: false }, { name: 'Cerrado', value: true }],
      snack: false,
      snackColor: '',
      snackText: ''
    }
  },
  mounted () {
    this.populateClients()
    this.populateMikrotikClient()
  },
  methods: {
    generateComment (index) {
      const client = this.clients
      const newComment = `${client[index].code} 
      ${client[index].technology.name} 
      ${client[index].addresses && client[index].addresses.length > 0 ? client[index].addresses.at(-1).neighborhood.name : client.neighborhood.name} 
      ${client[index].addresses && client[index].addresses.length > 0 ? client[index].addresses.at(-1).address : client[index].address} 
      ${client[index].name} 
      ${client[index].dni} 
      ${client[index].phone} 
      ${client[index].offer?.name} 
      ${client[index].wifi_ssid} 
      ${client[index].wifi_password}`
      return newComment
    },
    async generateComments () {
      this.loading = true
      const length = this.clients.length
      for (let i = 0; i < length; i++) {
        this.successChanges++
        this.$set(this.clients[i], 'comment', await this.generateComment(i))
        if (length - 1 === i) {
          this.loading = false
        }
      }
    },
    async applyComments () {
      const newClientInfo = this.clients
      for (let i = 0; i < newClientInfo.length; i++) {
        await this.$store.dispatch('client/updateClientCommentOnMikrotik', {
          client: newClientInfo[i],
          token: this.$store.state.auth.token
        }).then((input) => {
          this.successChanges++
        }).catch((error) => {
          this.errorChanges++
          this.snackText = error
        })
      }
    },
    async populateClients () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          }
        },
        pagination: {
          pageSize: 5000
        },
        populate: ['technology', 'neighborhood', 'plan', 'clienttype', 'city', 'offer', 'addresses', 'addresses.neighborhood']
      },
      {
        encodeValuesOnly: true
      })
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}clients?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then((clients) => {
            this.clients = clients.data
          })
      } catch (error) {
        throw new Error(`ACTION ${error}`)
      }
    },
    async populateMikrotikClient () {
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}secrets?mikrotikHost=181.78.67.167:11160`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then((secrets) => {
            this.MikrotikClient = secrets
          })
      } catch (error) {
        throw new Error(`ACTION ${error}`)
      }
    },
    removeItem (index) {
      this.clients.splice(index, 1)
    },
    sleep (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' })
      return humanDateFormat
    },
    getColor (state) {
      if (state.value) {
        return 'red'
      } else {
        return 'blue'
      }
    },
    getState (state) {
      if (state.value) {
        return 'Cerrado'
      } else {
        return 'Abierto'
      }
    },
    save (id, status) {
      this.$apollo.mutate({
        // mutation: gqlt`mutation ($input: UpdatePasswordChangeInput){
        //   updatePasswordChangeRequest(input: $input)
        // }`,
        variables: {
          input: {
            _id: id,
            closed: {
              name: status.name,
              value: status.value
            }
          }
        }
      }).then((input) => {
        this.snack = true
        this.snackColor = 'info'
        this.snackText = 'Petición actualizada con éxito.'
      }).catch((error) => {
        this.snack = true
        this.snackColor = 'red'
        this.snackText = error
      })
    },
    cancel () {
      this.snack = true
      this.snackColor = 'error'
      this.snackText = 'Operacion cancelada'
    },
    close () {
      // eslint-disable-next-line no-console
      console.log('Info closed')
    }
  },
  head () {
    return {
      title: this.title,
      meta: [
        { hid: 'language', name: 'language', content: 'es' },
        { hid: 'audience', name: 'audience', content: 'all' },
        { hid: 'rating', name: 'rating', content: 'general' },
        { hid: 'distribution', name: 'distribution', content: 'global' },
        { hid: 'document-type', name: 'document-type', content: 'Public' },
        { hid: 'MSSmartTagsPreventParsing', name: 'MSSmartTagsPreventParsing', content: 'true' },
        { hid: 'robots', name: 'robots', content: 'all' },
        { hid: 'robots', name: 'robots', content: 'all, index, follow' },
        { hid: 'googlebot', name: 'googlebot', content: 'all, index, follow' },
        { hid: 'yahoo-slurp', name: 'yahoo-slurp', content: 'all, index, follow' },
        { hid: 'msnbot', name: 'msnbot', content: 'index, follow' },
        { hid: 'googlebot-image', name: 'googlebot-image', content: 'all' },
        { hid: 'title', name: 'title', content: this.title },
        { hid: 'og:title', property: 'og:title', content: this.title },
        { hid: 'og:description', property: 'og:description', content: 'Nicom Integrado' },
        { hid: 'author', name: 'author', content: 'Esmeralda Rojas' }
      ]
    }
  }
}
</script>
