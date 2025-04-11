<template>
  <v-container fluid>
    <v-card v-if="clientData" class="rounded-xl">
      <v-card-title>
        <v-icon class="mr-2">
          mdi-account
        </v-icon>
        Crear Servicio para {{ clientData.name }}
      </v-card-title>
      <v-divider class="mb-5" />
      <v-card-text v-if="selectedCity && selectedClienttype">
        <v-alert
          v-if="alertBox"
          type="info"
          :class="alertBoxColor"
          tile
          dismissible
        >
          {{ createdMessage }}
        </v-alert>
        <v-form v-model="valid">
          <v-row>
            <v-col>
              <v-text-field
                v-model="Client.code"
                label="Codigo"
                hide-details="auto"
                required
                outlined
                dense
                @keyup="selectedClienttype.name === 'INTERNET' ? calculateSsid() : null"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="Client.name"
                label="Nombre Completo"
                required
                outlined
                dense
                disabled
                hide-details
              />
            </v-col>
          </v-row>
          <div class="my-5 parent">
            <v-select
              v-model="dir1"
              :items="dirFragment1"
              label="Dirección"
              autocomplete="off"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-autocomplete
              v-model="dir2"
              label="1, 2, 3, etc..."
              placeholder="5, 10, etc..."
              autocomplete="off"
              :items="numbers"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-autocomplete
              v-model="dir3"
              label="A, B, C, etc..."
              placeholder="BIZ, APTO, etc..."
              autocomplete="off"
              :items="[
                'A',
                'B',
                'C',
                'W',
                'D',
                'E',
                'F',
                'G',
                'H',
                'I',
                'J',
                'K',
                'L',
                'M',
                'N',
                'BIZ',
                'APTO',
                'CASA',
                'EDIFICIO',
                'TORRE',
                'INTERIOR',
                'OFICINA',
                'LOCAL',
                'PISO',
                'MANZANA',
                'LOTE',
                'KM',
                'VEREDA',
                'FINCA',
                'PARCELA',
                'BODEGA'
              ]"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-select
              v-model="dir4"
              :items="dirFragment2"
              autocomplete="off"
              label="4, 5, 6, etc..."
              value="No."
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-autocomplete
              v-model="dir5"
              label="5, 10, etc..."
              placeholder="5, 10, etc..."
              autocomplete="off"
              :items="numbers"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-autocomplete
              v-model="dir6"
              label="BIZ, APTO, etc..."
              placeholder="BIZ, APTO, etc..."
              autocomplete="off"
              :items="[
                'A',
                'B',
                'C',
                'W',
                'D',
                'E',
                'F',
                'G',
                'H',
                'I',
                'J',
                'K',
                'L',
                'M',
                'N',
                'BIZ',
                'APTO',
                'CASA',
                'EDIFICIO',
                'TORRE',
                'INTERIOR',
                'OFICINA',
                'LOCAL',
                'PISO',
                'MANZANA',
                'LOTE',
                'KM',
                'VEREDA',
                'FINCA',
                'PARCELA',
                'BODEGA'
              ]"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-autocomplete
              v-model="dir7"
              label="#"
              placeholder="5, 10, etc..."
              autocomplete="off"
              :items="numbersPad"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
            <v-text-field
              v-model="dir8"
              label="Opcional"
              placeholder="APTO 101, MANZANA 5, etc..."
              autocomplete="off"
              outlined
              dense
              hide-details
              @blur="genAddress"
            />
          </div>
          <v-row class="align-center">
            <h5 class="ml-4">
              Así va quedando la dirección:
            </h5>
            <h4 class="ml-2 px-3 grey darken-3 text-weight-bold rounded-xl white--text">
              {{ address }}
            </h4>
            <v-btn x-small class="ml-2 red darken-4" @click="resetAddress">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-row>
          <v-row>
            <v-col>
              <v-autocomplete
                v-model="Client.neighborhood"
                item-text="name"
                item-value="id"
                return-object
                :items="neighborhoods"
                label="Barrio"
                outlined
                dense
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-select
                v-model="Client.offer"
                item-text="name"
                item-value="id"
                :items="offers"
                label="Oferta"
                return-object
                outlined
                dense
                hide-details
                @change="createInvoiceMovementForDaysOfMonth"
              />
            </v-col>
          </v-row>
          <v-row v-if="selectedClienttype.name === 'INTERNET'">
            <v-col>
              <v-text-field
                v-model="Client.wifi_ssid"
                label="Nombre de Red"
                required
                outlined
                dense
                hide-details
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="Client.wifi_password"
                label="Clave de Red"
                required
                outlined
                dense
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field
                v-model="Client.stratum"
                label="Estrato"
                outlined
                dense
                hide-details="auto"
              />
            </v-col>
            <v-col v-if="monthfee">
              <v-text-field
                v-model.number="Client.costofdays"
                label="Cobrar días del mes"
                type="number"
                outlined
                dense
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                v-model="monthfee"
                :label="`Cobrar días del mes $${formatCurrency(Client.costofdays)}`"
                outlined
                dense
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                v-model="Client.affiliation"
                :label="Client.offer ? `Cobrar afiliacion $${formatCurrency(Client.offer.affiliation_price)}` : 'Cobrar afiliacion'"
                outlined
                dense
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <v-btn
            class="mr-4 mt-4"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="createClient"
          >
            Crear Servicio
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <h2 v-else>
      Formulario invalido. Por favor inicie de nuevo el proceso de creacion del servicio
    </h2>
  </v-container>
</template>

<script>
export default {
  name: 'CreateForm',
  props: {
    clientData: {
      type: Object,
      default: null
    }
  },
  data: () => {
    return {
      selectedCity: null,
      selectedClienttype: null,
      selectedCompany: null,
      valid: false,
      offers: null,
      Client: {
        code: '',
        name: '',
        address: '',
        neighborhood: null,
        clienttype: null,
        plan: null,
        offer: null,
        wifi_ssid: '',
        wifi_password: '',
        technology: { id: 1, name: 'FIBRA OPTICA' },
        newModel: 1,
        ipmodel: 0,
        stratum: 0,
        affiliation: true,
        costofdays: null
      },
      dir1: '',
      dir2: '',
      dir3: '',
      dir4: 'No.',
      dir5: '',
      dir6: '',
      dir7: '',
      dir8: '',
      dir9: '',
      dirFragment1: [
        '(SIN INICIAL)',
        'CARRERA',
        'CALLE',
        'MANZANA',
        'AVENIDA QUESADA',
        'COLEGIO',
        'DIAGONAL',
        'RUTA',
        'CALLEJON',
        'CALLEJA',
        'AVENIDA',
        'CASA',
        'HOTEL',
        'EDIFICIO',
        'TORRE',
        'INTERIOR',
        'OFICINA',
        'LOCAL',
        'PISO',
        'LOTE'
      ],
      dirFragment2: [
        '',
        'No.',
        'CASA',
        'CARRERA',
        'CALLE',
        'DIAGONAL',
        'LOTE',
        'FINCA',
        'KM',
        'VEREDA',
        'PARCELA',
        'BODEGA'
      ],
      alertBox: false,
      alertBoxColor: '',
      createdMessage: '',
      isSubmitting: false,
      email: [
        v => !!v || 'El correo es requerido',
        v => /\S+@\S+\.\S+/.test(v) || 'El correo no es valido'
      ],
      idwith: [
        { id: 0, name: 'Cedula' },
        { id: 1, name: 'Codigo' }
      ],
      ipmodelItems: [
        { id: 0, name: 'PPPoE' },
        { id: 1, name: 'IP ESTATICA' }
      ],
      codeError: false,
      hideHint: true,
      hideD00pHint: true,
      d00pHint: '',
      codeSuccess: null,
      monthfee: false
    }
  },
  computed: {
    cities () {
      return this.$store.state.company.cities
    },
    currentCompany () {
      return this.$store.state.company.currentCompany
    },
    address () {
      return `${this.dir1} ${this.dir2}${this.dir3} ${this.dir4} ${this.dir5}${this.dir6} ${this.dir7 !== '' ? '-' : ''} ${this.dir7} ${this.dir8}`
    },
    numbers () {
      return Array.from({ length: 1200 }, (_, i) => i + 1)
    },
    numbersPad () {
      return Array.from({ length: 1200 }, (_, i) => (i + 1).toString().padStart(2, '0'))
    },
    neighborhoods () {
      return this.$store.state.neighborhood.neighborhoods
    },
    technologies () {
      return this.$store.state.technology.technologies
    },
    clienttypes () {
      return this.$store.state.company.clienttypes
    },
    currentClientCode () {
      return this.$store.state.client.currentClientCode
    },
    telegramBots () {
      return this.$store.state.telegram.telegramBots.find(bot => bot.city.name === this.selectedCity.name)
    }
  },
  mounted () {
    this.selectedCity = this.cities.find(city => city.name === this.$route.query.city)
    this.selectedClienttype = this.clienttypes.find(clienttype => clienttype.name === this.$route.query.clienttype)
    this.selectedCompany = this.currentCompany
    this.$store.dispatch('telegram/getTelegramBotsFromDatabase', { token: this.$store.state.auth.token })
    this.$store.dispatch('neighborhood/getNeighborhoodsFromDatabase')
    this.$store.dispatch('technology/getTechnologiesFromDatabase')

    if (this.clientData) {
      this.Client.name = this.clientData.name
      this.generateCode()
      this.getOffers()
    }

    setTimeout(() => {
      this.calculateSsid()
    }, 1000)
  },
  methods: {
    resetAddress () {
      this.dir1 = ''
      this.dir2 = ''
      this.dir3 = ''
      this.dir4 = 'No.'
      this.dir5 = ''
      this.dir6 = ''
      this.dir7 = ''
      this.dir8 = ''
      this.dir9 = ''
    },
    async generateCode () {
      try {
        const lastService = await this.getLastService()

        const newCode = parseInt(lastService.code) + 1
        this.Client.code = newCode
      } catch (error) {
        this.Client.code = 1
      }
    },

    getLastService () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          city: {
            $eq: this.selectedCity.id
          },
          clienttype: {
            $eq: this.selectedClienttype.id
          },
          company: {
            $eq: this.selectedCompany.id
          }
        },
        sort: ['createdAt:desc'],
        pagination: {
          page: 1,
          pageSize: 1
        }
      }, {
        encodeValuesOnly: true
      })

      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: services }) => {
            if (services && services.length > 0) {
              resolve(services[0])
            } else {
              resolve(null)
            }
          })
          .catch(reject)
      })
    },
    async createDebtMovement (service) {
      await this.$store.dispatch('offer/setNewDebt', {
        token: this.$store.state.auth.token,
        city: this.selectedCity,
        isindebt: false,
        service,
        technician: this.$store.state.auth
      })
    },
    async createOfferMovement (service, offer) {
      await this.$store.dispatch('offer/setNewOffer', {
        token: this.$store.state.auth.token,
        service,
        offer,
        technician: this.$store.state.auth
      })
      await this.$store.dispatch('client/setAuxPlan', {
        token: this.$store.state.auth.token,
        serviceId: service.id,
        plan: offer.plan,
        index: this.index
      })
    },
    createAddress (service) {
      this.$store.dispatch('client/createAddress', {
        token: this.$store.state.auth.token,
        service,
        address: this.address,
        neighborhood: this.Client.neighborhood
      })
      this.$store.dispatch('address/updateAddress', {
        service,
        address: this.address,
        neighborhood: this.Client.neighborhood,
        token: this.$store.state.auth.token
      })
    },
    async createClient () {
      this.isSubmitting = true
      if (
        (
          this.selectedClienttype.name === 'INTERNET' &&
          (
            this.Client.code === '' || this.Client.offer === null || this.Client.name === '' || this.Client.neighborhood === null
          )
        ) ||
        (
          this.selectedClienttype.name === 'TELEVISION' &&
          (
            this.Client.code === '' || this.Client.name === '' || this.Client.neighborhood === null
          )
        )
      ) {
        this.$toast.error('Por favor, complete todos los campos.')
        this.isSubmitting = false
        return
      }
      const data = {
        name: this.selectedClienttype.name,
        code: this.Client.code + '',
        clienttype: this.selectedClienttype.id,
        offer: this.Client.offer.id,
        technology: this.Client.technology.id || null,
        city: this.selectedCity.id,
        company: this.selectedCompany.id,
        stratum: this.Client.stratum,
        wifi_ssid: this.Client.wifi_ssid,
        wifi_password: this.Client.wifi_password,
        newModel: 1,
        ipmodel: 0,
        active: true,
        indebt: false,
        normalized_client: this.clientData.id,
        address: this.address,
        neighborhood: this.Client.neighborhood.name,
        client_name: this.clientData.name,
        dni: this.clientData.dni,
        phone: this.clientData.phone,
        balance: this.Client.affiliation ? this.Client.offer.affiliation_price : 0
      }
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        },
        body: JSON.stringify({
          data
        })
      })
        .then(res => res.json())
        .then(({ data: service }) => {
          if (this.selectedClienttype.name === 'INTERNET') {
            this.createOfferMovement(service, this.Client.offer)
          }
          this.createDebtMovement(service)
          this.createAddress(service)
          this.$store.dispatch('client/createTicketForNewClient', {
            clienttype: this.selectedClienttype,
            city: this.selectedCity,
            company: this.selectedCompany,
            service,
            address: this.address,
            neighborhood: this.Client.neighborhood,
            token: this.$store.state.auth.token
          })
          if (this.selectedClienttype.name === 'INTERNET') {
            this.$store.dispatch('client/adminCreate', {
              service,
              offer: this.Client.offer,
              city: this.selectedCity,
              token: this.$store.state.auth.token,
              operator: this.$store.state.auth.username
            })
          }
          if (this.Client.affiliation) {
            this.createInvoiceMovement(service.id, this.Client.offer.affiliation_price, 'AFILIACION')
          }
          if (this.Client.costofdays && this.monthfee) {
            this.createInvoiceMovement(service.id, this.Client.costofdays, 'COBRO DIAS DEL MES')
          }
          // this.$simpleTelegramCreate({ client: this.Client, address: this.address, neighborhood: this.Client.neighborhood, operator: this.$store.state.auth.username, telegramBots: this.telegramBots })
          this.$router.push({ path: `/client/${this.clientData.id}?city=${this.selectedCity.name}&clienttype=${this.selectedClienttype.name}` })
          this.isSubmitting = false
        }).catch((error) => {
          this.$toast.error(`Ha ocurrido un error creando el servicio ${error}`, { duration: 5000 })
          this.isSubmitting = false
        })
    },
    genAddress () {
      this.Client.address = this.address
    },
    async getOffers () {
      if (this.selectedCity && this.selectedClienttype && this.selectedCompany) {
        this.offers = await this.$store.dispatch('offer/getOffers', {
          token: this.$store.state.auth.token,
          city: this.selectedCity.name,
          clienttype: this.selectedClienttype.name,
          company: this.selectedCompany.name
        })
      }
    },
    calculateSsid () {
      const name = this.Client.name.split(' ')
      const length = name.length
      // eslint-disable-next-line no-var
      var lastNameLowerCase = ''
      switch (length) {
        case 1:
          break
        case 2:
          lastNameLowerCase = name[1].toLowerCase()
          break
        case 3:
          lastNameLowerCase = name[1].toLowerCase()
          break
        case 4:
          lastNameLowerCase = name[2].toLowerCase()
          break
        default:
          lastNameLowerCase = ''
          break
      }
      const nombreLowerCase = name[0].toLowerCase()
      const processedName = nombreLowerCase.charAt(0).toUpperCase() + nombreLowerCase.slice(1)
      this.Client.wifi_password = processedName + this.Client.code
      this.Client.wifi_ssid = `Nicom_${lastNameLowerCase.charAt(0).toUpperCase() + lastNameLowerCase.slice(1)}`
    },
    formatCurrency (value) {
      return Number(value).toLocaleString('es')
    },
    currentMonth () {
      return Date.now().getMonth() + 1
    },
    currentYear () {
      return Date.now().getFullYear()
    },
    getMonthNameByNumber () {
      const monthNames = [
        'ENERO',
        'FEBRERO',
        'MARZO',
        'ABRIL',
        'MAYO',
        'JUNIO',
        'JULIO',
        'AGOSTO',
        'SEPTIEMBRE',
        'OCTUBRE',
        'NOVIEMBRE',
        'DICIEMBRE'
      ]
      return monthNames[this.currentMonth - 1]
    },
    async createInvoiceMovement (serviceId, balance = 0, concept = 'AFILIACION') {
      await this.$store.dispatch('billing/createInvoice', {
        balance: balance || this.Client.offer.affiliation_price,
        value: balance || this.Client.offer.affiliation_price,
        month: this.currentMonth,
        year: this.currentYear,
        type: 'FACTURA',
        offer: 1,
        concept,
        details: this.getMonthNameByNumber(),
        payed: false,
        partial: false,
        indebt: false,
        service: serviceId,
        invoice_type: 5,
        token: this.$store.state.auth.token
      })
      const legalNote = {
        city: this.selectedCity.name,
        clienttype: this.selectedClienttype.name,
        token: this.$store.state.auth.token,
        biller: this.$store.state.auth,
        service: serviceId,
        debit: balance || this.Client.offer.affiliation_price,
        credit: 0,
        concept
      }
      await this.$store.dispatch('billing/createLegalNote', legalNote)
    },
    diasHastaFinDeMes () {
      const hoy = new Date()
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

      // Calcular la diferencia en días
      const diferencia = ultimoDiaMes.getDate() - hoy.getDate()

      return diferencia
    },
    calculateCostOfDays () {
      const days = this.diasHastaFinDeMes()
      if (days <= 6) {
        return 0
      }
      const dayValue = Math.ceil(this.Client.offer.price / 30)
      const cost = days * dayValue
      return Math.ceil(cost / 1000) * 1000
    },
    createInvoiceMovementForDaysOfMonth () {
      const cost = this.calculateCostOfDays()
      this.Client.costofdays = Math.ceil(cost)
    }
  }
}
</script>

<style scoped>
.parent {
  display:grid;
  grid-template-columns: 2fr 1fr 2fr 1fr;
  column-gap: 10px;
  row-gap: 10px;
}
@media (max-width: 600px) {
  .parent {
    display:grid;
    grid-template-columns: 1fr;
    column-gap: 10px;
    row-gap: 10px;
  }
}
</style>
