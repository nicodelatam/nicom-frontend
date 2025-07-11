<template>
  <v-container fluid class="px-0">
    <v-row
      v-if="searchResult"
    >
      <v-col
        cols="12"
        md="6"
        lg="4"
      >
        <v-card class="rounded-lg">
          <v-card-title>
            <v-icon class="mr-2">
              mdi-account-outline
            </v-icon>Servicios del Usuario
          </v-card-title>
          <v-divider />
          <v-card-text>
            <h4 v-if="searchResult.services.length === 0">
              No hay servicios aún...
            </h4>
            <v-list v-else nav class="pa-0">
              <v-list-item-group
                v-model="indexOfSelectedService"
                color="primary"
              >
                <v-list-item
                  v-for="(service, i) in searchResult.services"
                  :key="i"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon
                      :color="service.active ? service.indebt ? 'red darkne-2' : 'green darken-2' : service.indebt ? 'gray' : 'red darken-4'"
                      class="pl-2"
                    >
                      {{ service.name === 'INTERNET' ? 'mdi-wifi' : 'mdi-television' }}
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title class="text-caption">
                      {{ `${service.code} ${service.city.name} ${processAddresses(service)} ${processAddressesNeighborhood(service)}` }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>
        <v-btn
          v-if="$isAdmin() || $isBiller()"
          color="primary"
          block
          dense
          class="mt-3 rounded-lg"
          :to="`/client/create?company=${$route.query.company}&city=${$route.query.city}&clienttype=${$route.query.clienttype}&client=${searchResult.id}&name=${searchResult.name}&dni=${searchResult.dni}&phone=${searchResult.phone}`"
        >
          <v-icon class="mr-2">
            mdi-plus
          </v-icon> Afiliar Nuevo Servicio
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        md="6"
        lg="8"
      >
        <v-card v-if="indexOfSelectedService !== null && currentService" class="rounded-lg mb-3">
          <v-card-title>
            <v-icon class="mr-2">
              mdi-information-outline
            </v-icon>
            Gestión De Información y Controles
          </v-card-title>
          <v-card-text>
            <MainClientStatus
              v-if="currentService.name === 'INTERNET'"
              :name="searchResult.name"
              :clientid="currentService.id"
              :code="currentService.code"
              :item="currentService"
            />
            <CreateTicket
              v-if="$isAdmin() || $isBiller()"
              :client="searchResult"
              :service="currentService"
              :assignated="$store.state.auth.id"
            />
            <ControlDevices
              v-if="currentService.name === 'INTERNET' && ($isAdmin() || $isBiller())"
              :service="currentService"
              :name="currentService.normalized_client.name"
            />
            <ControlNap
              v-if="currentService.name === 'INTERNET' && ($isAdmin() || $isBiller())"
              :isticket="false"
              :service="currentService"
            />
            <MiscTicketHistory :service="currentService" />
            <BillingAuxBillingList
              v-if="$isAdmin() || $isBiller()"
              :service="currentService"
            />
            <v-tooltip v-if="$isAdmin() || $isBiller()" top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  :to="`/billing/${currentService.id}?city=${$route.query.city}&clienttype=${$route.query.clienttype}`"
                  rounded
                  class="mr-1 ml-1"
                  :color="$vuetify.theme.dark ? currentService.indebt || !currentService.active ? 'red lighten-1' : 'white black--text' : 'primary'"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>mdi-currency-usd</v-icon>
                  {{ Number(reducePeningInvoices(currentService.invoices)).toLocaleString('es') }}
                </v-btn>
              </template>
              <span>Estados de cuenta</span>
            </v-tooltip>
            <MainClientControl :service="currentService" @refresh="getClientFromSearchParam()" />
          </v-card-text>
        </v-card>
        <v-card v-if="indexOfSelectedService !== null && currentService" class="rounded-lg">
          <v-subheader>
            Información del Cliente {{ searchResult ? searchResult.id : "N/A" }}
          </v-subheader>

          <v-divider />
          <v-card-text>
            <v-row>
              <v-col>
                <v-text-field
                  v-model="searchResult.dni"
                  label="Cedula"
                  autocomplete="off"
                  required
                  outlined
                  dense
                  hide-details
                  :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                  @blur="updateClient"
                  @keyup.enter="$event.target.blur()"
                />
              </v-col>
              <v-col>
                <v-text-field
                  :value="searchResult.name ? searchResult.name.toUpperCase() : ''"
                  label="Nombre Completo"
                  autocomplete="off"
                  required
                  outlined
                  dense
                  hide-details
                  :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                  @input="searchResult.name = $event.toUpperCase()"
                  @blur="updateClient"
                  @keyup.enter="$event.target.blur()"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  v-model="searchResult.phone"
                  label="Celular"
                  autocomplete="off"
                  required
                  outlined
                  dense
                  hide-details
                  :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                  @blur="updateClient"
                  @keyup.enter="$event.target.blur()"
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model="searchResult.email"
                  label="Correo Electronico"
                  autocomplete="off"
                  required
                  outlined
                  dense
                  hide-details
                  :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                  @blur="updateClient"
                  @keyup.enter="$event.target.blur()"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-subheader>
            Información del Servicio {{ currentService ? currentService.id : "N/A" }}
          </v-subheader>

          <v-divider />
          <v-card-text>
            <v-form ref="editForm" v-model="valid" @focus="resetSaveStatus">
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="currentService.code"
                    label="Codigo"
                    autocomplete="off"
                    required
                    outlined
                    dense
                    hide-details
                    :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                    @blur="updateService"
                    @keyup.enter="$event.target.blur()"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    :value="currentService.name ? currentService.name.toUpperCase() : ''"
                    label="Tipo de Servicio"
                    autocomplete="off"
                    required
                    outlined
                    dense
                    hide-details
                    disabled
                    @input="currentService.name = $event.toUpperCase()"
                    @blur="updateService"
                    @keyup.enter="$event.target.blur()"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" lg="6" md="6">
                  <v-text-field
                    :value="processAddresses(currentService)"
                    disabled
                    label="Direccion"
                    outlined
                    dense
                    hide-details
                  />
                </v-col>
                <v-col cols="12" lg="6" md="6" class="d-flex">
                  <v-text-field
                    :value="processAddressesNeighborhood(currentService)"
                    disabled
                    class="mr-3"
                    label="Barrio"
                    outlined
                    dense
                    hide-details
                  />
                  <CreateAddress :service="currentService" />
                  <MiscAddresses v-if="currentService.service_addresses" :service="currentService" />
                </v-col>
              </v-row>
              <v-row v-if="currentService.name === 'INTERNET'">
                <v-col>
                  <v-text-field
                    v-model="currentService.wifi_ssid"
                    :disabled="!$isAdmin() || loading"
                    label="Nombre de Red"
                    autocomplete="off"
                    required
                    outlined
                    dense
                    hide-details
                    @blur="updateService"
                    @keyup.enter="$event.target.blur()"
                  />
                </v-col>
                <v-col v-if="currentService.name === 'INTERNET'">
                  <v-text-field
                    v-model="currentService.wifi_password"
                    :disabled="!$isAdmin() || loading"
                    label="Clave de Red"
                    autocomplete="off"
                    required
                    outlined
                    dense
                    hide-details
                    @blur="updateService"
                    @keyup.enter="$event.target.blur()"
                  />
                </v-col>
              </v-row>
              <v-row v-if="currentService.name === 'INTERNET'">
                <v-col>
                  <v-select
                    v-model="currentService.technology"
                    :disabled="!(!$isAdmin() || !$isBiller() || !$isTechnician()) || loading"
                    item-text="name"
                    item-value="id"
                    :items="technologies"
                    :rules="[v => !!v || 'Debes especificar la tecnología']"
                    return-object
                    label="Tecnología"
                    outlined
                    dense
                    required
                    hide-details
                    @change="updateService"
                    @blur="updateService"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    v-model.number="currentService.stratum"
                    :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                    label="Estrato"
                    autocomplete="off"
                    outlined
                    dense
                    type="number"
                    hide-details="auto"
                    @blur="updateService"
                    @keyup.enter="$event.target.blur()"
                  />
                </v-col>
              </v-row>
              <v-row v-if="currentService.name === 'TELEVISION'">
                <v-col>
                  <v-text-field
                    v-model.number="currentService.stratum"
                    :disabled="!(!$isAdmin() || !$isBiller()) || loading"
                    label="Estrato"
                    autocomplete="off"
                    outlined
                    dense
                    type="number"
                    hide-details="auto"
                    @blur="updateService"
                    @keyup.enter="$event.target.blur()"
                  />
                </v-col>
              </v-row>
              <v-row v-if="currentService.name === 'TELEVISION' && currentService.tvspec">
                <v-col>
                  <v-text-field
                    v-model="currentService.tvspec.tvs"
                    disabled
                    label="Televisores"
                    autocomplete="off"
                    outlined
                    dense
                    hide-details="auto"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    v-model="currentService.tvspec.high"
                    disabled
                    label="Altos"
                    autocomplete="off"
                    outlined
                    dense
                    hide-details="auto"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    v-model="currentService.tvspec.down"
                    disabled
                    label="Bajos"
                    autocomplete="off"
                    outlined
                    dense
                    hide-details="auto"
                  />
                </v-col>
                <v-col>
                  <v-text-field
                    v-if="currentService.tvspec.tvspectype"
                    v-model="currentService.tvspec.tvspectype.name"
                    disabled
                    label="Calidad de señal"
                    autocomplete="off"
                    outlined
                    dense
                    hide-details="auto"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-divider />
          <v-card-text class="d-flex align-center mt-5">
            <caption ref="saveStatusText" class="font-italic align-self-end">
              {{ saveStatus }}
            </caption>
            <v-spacer />
            <div style="display: inline-grid;place-items: end;">
              <caption>Fecha de creacion: {{ getDate(currentService.createdAt) }}</caption>
              <caption>Fecha de ultima modificacion: {{ getDate(currentService.updatedAt) }}</caption>
            </div>
          </v-card-text>
        </v-card>
        <v-card v-else class="rounded-lg">
          <v-card-text>
            <v-alert
              type="info"
              elevation="2"
              icon="mdi-information"
            >
              <span class="font-weight-bold">Selecciona un servicio para ver sus detalles</span>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-progress-linear
      v-else
      indeterminate
      color="primary"
    />
  </v-container>
</template>
<script>
export default {
  name: 'ClientItem',
  data () {
    return {
      searchResult: null,
      oldClient: null,
      indexOfSelectedService: null,
      loadingDataTable: false,
      loading: false,
      saveStatus: 'No hay cambios pendientes...',
      idwith: [
        { id: 0, name: 'Cedula' },
        { id: 1, name: 'Codigo' }
      ],
      valid: false
    }
  },
  computed: {
    currentService () {
      return this.searchResult?.services.at(this.indexOfSelectedService) || null
    },
    noPendingChangesServices () {
      return Object.entries(this.searchResult.services.at(this.indexOfSelectedService)).toString() === Object.entries(this.oldClient.services.at(this.indexOfSelectedService)).toString()
    },
    noPendingChangesServiceTechnology () {
      return Object.entries(this.searchResult.services.at(this.indexOfSelectedService).technology).toString() === Object.entries(this.oldClient.services.at(this.indexOfSelectedService).technology).toString()
    },
    noPendingChangesServiceIdType () {
      return this.searchResult.services.at(this.indexOfSelectedService).newModel === this.oldClient.services.at(this.indexOfSelectedService).newModel
    },
    noPendingChangesClient () {
      return Object.entries(this.searchResult).toString() === Object.entries(this.oldClient).toString()
    },
    cities () {
      return this.$store.state.company.cities
    },
    neighborhoods () {
      return this.$store.state.neighborhood.neighborhoods
    },
    technologies () {
      return this.$store.state.technology.technologies
    },
    clienttype () {
      return this.$store.state.company.clienttypes.find(ct => ct.name === this.$route.query.clienttype)
    },
    telegramBots () {
      return this.$store.state.telegram.telegramBots.find(bot => bot.city.name === this.$route.query.city)
    }
  },
  watch: {
    '$store.state.client.refresh' () {
      this.getClientFromSearchParam()
    },
    '$route.query.search' () {
      this.getClientFromSearchParam()
    },
    '$route.query.service' () {
      this.selectServiceIfQuery()
      this.getTickettypes()
    },
    searchResult () {
      this.selectServiceIfQuery()
    },
    indexOfSelectedService () {
      if (this.currentService === null) { return }
      this.$router.push({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          service: this.currentService.id
        }
      })
    }
  },
  async mounted () {
    await this.$store.dispatch('telegram/getTelegramBotsFromDatabase', { token: this.$store.state.auth.token })
    await this.$store.dispatch('technology/getTechnologiesFromDatabase')
    await this.getClientFromSearchParam()
    this.getTickettypes()
  },
  methods: {
    selectServiceIfQuery () {
      if (this.$route.query.service) {
        const service = this.searchResult.services.find(s => s.id === parseInt(this.$route.query.service))
        this.indexOfSelectedService = this.searchResult.services.indexOf(service)
      }
    },
    getTickettypes () {
      if (this.currentService) {
        this.$store.dispatch('ticket/getTickettypes', {
          city: this.currentService.city.name,
          clienttype: this.currentService.name,
          token: this.$store.state.auth.token
        })
      }
    },
    testChanges () {
      const service = this.searchResult.services.at(this.indexOfSelectedService)
      const oldService = this.oldClient.services.at(this.indexOfSelectedService)
      const changes = Object.keys(service).filter(key => service[key] !== oldService[key])
      return changes.length
    },
    reducePeningInvoices (invoices) {
      if (!invoices) { return 0 }
      const pendingInvoices = invoices.filter(invoice => !invoice.payed && invoice.balance > 0 && invoice.concept !== 'ADELANTO')
      if (pendingInvoices.length > 0) {
        return pendingInvoices.reduce((acc, invoice) => acc + invoice.balance, 0)
      } else {
        return 0
      }
    },
    async updateClient () {
      this.$refs.saveStatusText.classList.remove('success--text')
      this.saveStatus = 'No hay cambios pendientes...'
      this.$refs.saveStatusText.classList.add('cyan--text')
      if (this.noPendingChangesClient) { return }
      this.oldClient = JSON.parse(JSON.stringify(this.searchResult))
      this.loading = true
      const operator = this.$store.state.auth.id
      const client = JSON.parse(JSON.stringify(this.searchResult))

      this.saveStatus = 'Guardando...'

      await this.$store.dispatch('client/updateClient', { client, index: this.index, operator, token: this.$store.state.auth.token })
      for (const serviceClient of client.services) {
        await this.$store.dispatch('client/updateService', { service: serviceClient, client: this.searchResult, index: this.index, operator, token: this.$store.state.auth.token })
      }
      if (this.$route.query.clienttype === 'INTERNET') {
        // this.$store.dispatch('client/updateClientCommentOnMikrotik', { service, token: this.$store.state.auth.token })
        // this.$simpleTelegramUpdate({ service, operator: this.$store.state.auth.username, telegramBots: this.telegramBots })
      } else {
        // this.$simpleTelegramUpdateTV({ service, operator: this.$store.state.auth.username, telegramBots: this.telegramBots })
      }

      this.$refs.saveStatusText.classList.remove('cyan--text')
      this.$refs.saveStatusText.classList.add('success--text')
      this.$refs.saveStatusText.classList.add('font-weight-bold')
      this.saveStatus = 'Guardado'
      setTimeout(() => {
        this.$refs.saveStatusText.classList.remove('success--text')
        this.$refs.saveStatusText.classList.remove('font-weight-bold')
        this.resetSaveStatus()
      }, 5000)
      this.loading = false
    },
    async updateService () {
      this.$refs.saveStatusText.classList.remove('success--text')
      this.saveStatus = 'No hay cambios pendientes...'
      this.$refs.saveStatusText.classList.add('cyan--text')
      if (this.noPendingChangesServices && this.noPendingChangesServiceTechnology && this.noPendingChangesServiceIdType) { return }
      this.oldClient.services = JSON.parse(JSON.stringify(this.searchResult.services))
      this.loading = true
      const operator = this.$store.state.auth.id
      const service = JSON.parse(JSON.stringify(this.searchResult.services.at(this.indexOfSelectedService)))

      this.saveStatus = 'Guardando...'

      await this.$store.dispatch('client/updateService', { service, client: this.searchResult, index: this.index, operator, token: this.$store.state.auth.token })
      if (this.$route.query.clienttype === 'INTERNET') {
        this.$store.dispatch('client/updateServiceCommentOnMikrotik', { service, token: this.$store.state.auth.token })
      }

      this.$refs.saveStatusText.classList.remove('cyan--text')
      this.$refs.saveStatusText.classList.add('success--text')
      this.$refs.saveStatusText.classList.add('font-weight-bold')
      this.saveStatus = 'Guardado'
      setTimeout(() => {
        this.$refs.saveStatusText.classList.remove('success--text')
        this.$refs.saveStatusText.classList.remove('font-weight-bold')
        this.resetSaveStatus()
      }, 5000)
      this.loading = false
    },
    resetSaveStatus () {
      this.saveStatus = 'No hay cambios pendientes...'
    },
    async getClientFromSearchParam () {
      const qs = require('qs')
      const query = qs.stringify({
        populate: ['services', 'services.normalized_client', 'services.city', 'services.company', 'services.plan', 'services.invoices', 'services.service_addresses', 'services.service_addresses.neighborhood', 'services.technology', 'services.clienttype', 'services.offer', 'services.offer.plan', 'services.offermovements.offer', 'services.offermovements', 'services.debtmovements', 'services.debtmovements.technician', 'services.monthlybills', 'services.tvspec', 'services.tvspec.tvspectype']
      },
      {
        encodeValuesOnly: true
      })
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}normalized-clients/${this.$route.params.client}?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.clone().json())
        .then(({ data: clients }) => {
          if (!clients) { this.searchResult = null; return }
          this.oldClient = JSON.parse(JSON.stringify(clients))
          this.searchResult = clients
          if (this.searchResult.services.length < 2) {
            this.indexOfSelectedService = 0
          }
        })
    },
    getDate (date) {
      if (date === null) { return 'N/A' }
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      return humanDateFormat
    },
    emitupdateClient () {
      this.$emit('updateSuccess')
    },
    processAddresses (service) {
      if (!service) { return 'Sin Direccion' }
      const address = service?.address
      const serviceAddresses = service?.service_addresses
      if (address && !serviceAddresses) { return address }
      if (address && serviceAddresses.length === 0) { return address }
      if (!address && serviceAddresses.length < 1) { return 'Sin Dirección' }
      if (address && serviceAddresses.length > 0) { return serviceAddresses.at(-1).address }
      if (!address && serviceAddresses.length > 0) { return serviceAddresses.at(-1).address }
    },
    processAddressesNeighborhood (service) {
      if (!service) { return 'Sin Barrio' }
      const addresses = service.service_addresses
      const neighborhood = service.neighborhood
      if (neighborhood && !addresses) { return neighborhood.name }
      if (neighborhood && addresses.length === 0) { return neighborhood.name }
      if (!neighborhood && addresses.length < 1) { return 'Sin Barrio' }
      if (neighborhood && addresses.length > 0 && addresses.at(-1).neighborhood) { return addresses.at(-1).neighborhood.name }
      if (neighborhood && addresses.length > 0 && !addresses.at(-1).neighborhood) { return 'Sin barrio' }
      if (!neighborhood && addresses.length > 0 && addresses.at(-1).neighborhood) { return addresses.at(-1).neighborhood.name }
      if (!neighborhood && addresses.length > 0 && !addresses.at(-1).neighborhood) { return 'Sin barrio' }
    }
  }
}
</script>
