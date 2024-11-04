<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card class="rounded-xl">
          <v-card-text>
            <v-sheet height="64">
              <v-toolbar
                flat
              >
                <v-btn
                  fab
                  text
                  small
                  color="grey darken-2"
                  @click="prev"
                >
                  <v-icon small>
                    mdi-chevron-left
                  </v-icon>
                </v-btn>
                <v-btn
                  fab
                  text
                  small
                  color="grey darken-2"
                  @click="next"
                >
                  <v-icon small>
                    mdi-chevron-right
                  </v-icon>
                </v-btn>
                <v-toolbar-title v-if="$refs.calendar">
                  {{ $refs.calendar.title }}
                </v-toolbar-title>
                <v-spacer />
                <v-menu
                  bottom
                  right
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      outlined
                      color="grey darken-2"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <span>{{ typeToLabel[type] }}</span>
                      <v-icon right>
                        mdi-menu-down
                      </v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="type = 'month'">
                      <v-list-item-title>Mes</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="type = 'day'">
                      <v-list-item-title>Dia</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="type = 'week'">
                      <v-list-item-title>Semana</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-toolbar>
            </v-sheet>
            <v-sheet height="700">
              <v-calendar
                ref="calendar"
                v-model="focus"
                dark
                color="primary"
                :event-height="this.$store.state.isDesktop ? 40 : 80"
                :weekdays="weekday"
                :events="events"
                :event-color="getEventColor"
                :type="type"
                @click:event="showEvent"
                @click:more="viewDay"
                @click:date="createEvent($event)"
                @change="getEventsFromDatabase"
              >
                <template v-slot:event="{ event }">
                  <div>
                    <span class="ml-1">{{ event.timed ? getDate(event.start) : '' }}</span>
                    <span style="text-wrap:wrap;">{{ event.name }}</span>
                    <span v-if="event.ticket">{{ event.ticket.details }}</span>
                  </div>
                </template>
              </v-calendar>
              <v-menu
                v-model="selectedOpen"
                :close-on-content-click="false"
                :activator="selectedElement"
                offset-x
              >
                <v-card
                  min-width="350px"
                  flat
                >
                  <v-toolbar
                    :color="selectedEvent.color"
                    dark
                  >
                    <v-toolbar-title v-text="selectedEvent.name" />
                    <v-spacer />
                    <v-btn icon @click="editTitle(selectedEvent)">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon @click="deleteEvent(selectedEvent)">
                      <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </v-toolbar>
                  <v-card-text>
                    <v-menu
                      ref="menu"
                      v-model="menu2"
                      :close-on-content-click="false"
                      :nudge-right="40"
                      :return-value.sync="time"
                      transition="scale-transition"
                      offset-y
                      max-width="290px"
                      min-width="290px"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="time"
                          :label="selectedEvent.timed ? getDate(selectedEvent.start) : 'Definir Hora'"
                          append-icon="mdi-clock-time-four-outline"
                          readonly
                          outlined
                          v-bind="attrs"
                          v-on="on"
                          @change="setHour"
                        />
                      </template>
                      <v-time-picker
                        v-if="menu2"
                        v-model="time"
                        full-width
                        @click:minute="$refs.menu.save(time)"
                      />
                    </v-menu>
                    <v-chip class="primary">
                      Ticket Asignado: {{ selectedEvent.ticket ? selectedEvent.ticket.details : selectedEvent.details }}
                    </v-chip>
                    <v-autocomplete
                      v-model="selectedEvent.ticket"
                      :items="tickets"
                      item-text="service.client_name"
                      item-value="id"
                      return-object
                      outlined
                      class="mt-2"
                      :label="selectedEvent.ticket ? selectedEvent.ticket.service.client_name : 'Seleccionar Ticket'"
                      @click="getTickets"
                    >
                      <template v-slot:item="{ item }">
                        <v-list-item-content>
                          <v-list-item-title v-text="item.service.client_name" />
                          <v-list-item-subtitle v-text="item.service.address" />
                        </v-list-item-content>
                      </template>
                    </v-autocomplete>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      text
                      color="primary"
                      @click="save(selectedEvent.id ? selectedEvent.id : '', selectedEvent.id ? 'update' : 'create')"
                    >
                      Guardar
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  data: () => ({
    focus: '',
    type: 'month',
    typeToLabel: {
      month: 'Month',
      week: 'Week',
      day: 'Day'
    },
    tickets: [],
    weekday: [1, 2, 3, 4, 5, 6, 0],
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    events: [],
    colors: ['primary'],
    names: ['Instalacion'],
    selectedCity: null,
    selectedClienttype: null,
    menu2: false,
    time: null
  }),
  computed: {
    cities () {
      return this.$store.state.company.cities
    },
    clienttypes () {
      return this.$store.state.company.clienttypes
    }
  },
  mounted () {
    this.$refs.calendar.checkChange()
    this.setQueryCity()
    this.setSelectedClienttype()
  },
  methods: {
    setQueryCity () {
      if (this.$route.query.city) {
        this.selectedCity = this.$store.state.company.cities.find(c => c.name === this.$route.query.city)
      }
    },
    setSelectedClienttype () {
      if (this.$route.query.clienttype) {
        this.selectedClienttype = this.$store.state.company.clienttypes.find(c => c.name === this.$route.query.clienttype)
      }
    },
    async getTickets () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          active: true,
          city: {
            name: {
              $eq: this.selectedCity.name
            }
          },
          clienttype: {
            name: {
              $eq: this.selectedClienttype.name
            }
          }
        },
        populate: [
          'service',
          'service.normalized_client',
          'service.naps',
          'service.offer',
          'service.offer.plan',
          'service.technology',
          'city',
          'media',
          'tickettype',
          'clienttype',
          'assignated',
          'technician',
          'ticketdetails',
          'ticketdetails.operator'
        ],
        sort: ['createdAt:desc'],
        pagination: {
          pageSize: 30
        }
      },
      {
        encodeValuesOnly: true
      })
      await this.$fetch(`${this.$config.API_STRAPI_ENDPOINT}tickets?${query}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.json())
        .then(({ data: tickets }) => {
          this.tickets = tickets
        })
        .catch((_) => {
          this.$toast.error('Calidad de red insuficiente. Porfavor intenta de nuevo', { duration: 4000, position: 'bottom-center' })
        })
    },
    viewDay ({ date }) {
      this.focus = date
      this.type = 'day'
    },
    getEventColor (event) {
      return event.color
    },
    setToday () {
      this.focus = ''
    },
    prev () {
      this.$refs.calendar.prev()
    },
    next () {
      this.$refs.calendar.next()
    },
    setHour (e) {
      this.time = e
    },
    showEvent ({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event
        this.selectedElement = nativeEvent.target
        // eslint-disable-next-line no-return-assign
        requestAnimationFrame(() => requestAnimationFrame(() => this.selectedOpen = true))
      }

      if (this.selectedOpen) {
        this.selectedOpen = false
        requestAnimationFrame(() => requestAnimationFrame(() => open()))
      } else {
        open()
      }

      nativeEvent.stopPropagation()
    },
    async getEventsFromDatabase () {
      this.events = []
      const qs = require('qs')
      const query = qs.stringify({
        populate: [
          'ticket',
          'ticket.service'
        ],
        pagination: {
          pageSize: 100
        }
      },
      {
        encodeValuesOnly: true
      })
      await this.$fetch(`${this.$config.API_STRAPI_ENDPOINT}events?${query}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.json())
        .then(({ data: events }) => {
          this.events = events
        })
        .catch((_) => {
          this.$toast.error('Calidad de red insuficiente. Porfavor intenta de nuevo', { duration: 4000, position: 'bottom-center' })
        })
    },
    async save (id, action) {
      const data = {
        name: this.selectedEvent.name,
        details: this.selectedEvent.details,
        ticket: this.selectedEvent.ticket ? this.selectedEvent.ticket.id : null,
        color: this.selectedEvent.color,
        start: this.time ? `${this.selectedEvent.start.split('T')[0]}T${this.time}:00` : this.selectedEvent.start,
        end: this.time ? `${this.selectedEvent.end.split('T')[0]}T${this.time}:00` : this.selectedEvent.end,
        timed: this.time !== null
      }
      await this.$fetch(`${this.$config.API_STRAPI_ENDPOINT}events${action === 'update' ? `/${id}` : ''}`, {
        method: action === 'update' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        },
        body: JSON.stringify({
          data
        })
      })
        .then(res => res.json())
        .then(({ data: tickets }) => {
          this.$toast.info('Guardado', { duration: 4000, position: 'bottom-center' })
          this.selectedOpen = false
        })
        .catch((err) => {
          this.$toast.error('Calidad de red insuficiente. Porfavor intenta de nuevo' + err, { duration: 4000, position: 'bottom-center' })
        })
      this.getEventsFromDatabase()
    },
    editTitle (event) {
      event.name = prompt('Edit event name', event.name) || event.name
    },
    async deleteEvent (event) {
      await this.$fetch(`${this.$config.API_STRAPI_ENDPOINT}events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.json())
        .then(({ data: tickets }) => {
          this.$toast.info('Eliminado', { duration: 4000, position: 'bottom-center' })
          this.selectedOpen = false
        })
        .catch((_) => {
          this.$toast.error('Calidad de red insuficiente. Porfavor intenta de nuevo', { duration: 4000, position: 'bottom-center' })
        })
      this.events = this.events.filter(e => e.id !== event.id)
    },
    rnd (a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a
    },
    createEvent (clickEvent) {
      const event = {
        name: this.names[this.rnd(0, this.names.length - 1)],
        details: '',
        ticket: null,
        color: this.colors[this.rnd(0, this.colors.length - 1)],
        start: clickEvent.date,
        end: clickEvent.date,
        timed: false
      }

      this.events.push(event)
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-CO', { hour: 'numeric', minute: 'numeric', hour12: true })
      return humanDateFormat
    }
  }
}
</script>
