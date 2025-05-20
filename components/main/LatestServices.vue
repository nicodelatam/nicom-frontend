<template>
  <v-card class="elevation-0 rounded-lg mt-2">
    <v-card-text class="d-flex">
      <MiscListCount
        :activeservices="activeServices"
        :inactiveservices="inactiveServices"
        :retiredservices="retiredServices"
        :freeservices="freeServices"
        :pagination="pagination"
      />
      <v-spacer />
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :nudge-width="200"
        offset-x
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            class="rounded-xl mr-2"
            :color="filterMonth ? 'primary' :'white black--text'"
            small
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-calendar</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-card-text>
            <v-date-picker
              v-model="filterMonth"
              range
              dark
              color="primary"
            />
          </v-card-text>
          <v-card-text>
            <v-btn
              color="green darken-4 white--text"
              @click="getLatestServices"
            >
              Filtrar
            </v-btn>
            <v-btn @click="clearFilter">
              Limpiar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            :disabled="loadingDataTable"
            :loading="loadingDataTable"
            :color="$vuetify.theme.dark ? 'white black--text' : 'green darken-4 white--text'"
            class="rounded-xl"
            small
            v-bind="attrs"
            v-on="on"
            @click="downloadExcelData"
          >
            <v-icon>
              mdi-file-excel
            </v-icon>
          </v-btn>
        </template>
        <span>Descargar Excel</span>
      </v-tooltip>
    </v-card-text>
    <v-card-text>
      <client-only>
        <v-data-table
          :headers="getHeadersByClienttype"
          :items="services"
          :items-per-page.sync="itemsPerPage"
          :loading="loadingDataTable"
          no-data-text="No hay resultados a la busqueda..."
          loading-text="Cargando información de clientes..."
          hide-default-footer
          mobile-breakpoint="100"
          header-color="primary"
          :caption="filterMonth ? pagination.total + ' Resultados - Filtrando por fecha...' : 'Listado de Clientes'"
          @page-count="pageCount = $event"
          @click:row="selectRow($event)"
        >
          <template v-slot:[`item.active`]="props">
            <v-chip
              :color="props.item.active ? props.item.indebt ? 'red darken-4' : 'green darken-3' : 'gray darken-3'"
              :to="`/billing/${props.item.id}?city=${$route.query.city}&clienttype=${$route.query.clienttype}&company=${$route.query.company}`"
            >
              {{ props.item.active ? props.item.indebt ? 'D' : 'A' : 'R' }}
            </v-chip>
          </template>
          <template v-slot:[`item.dni`]="{ item, index }">
            {{ item.dni }}
            <v-chip
              v-if="$store.state.isDesktop && ($isAdmin() || $isBiller())"
              x-small
              :color="item.corporate === null ? 'grey darken-3' : item.corporate === false ? 'blue darken-3' : 'green darken-4'"
              @click="toggleDniType(item, index)"
            >
              {{ item.corporate === null ? 'No definido' : item.corporate === false ? 'Plan Hogar' : 'Corporativo' }}
            </v-chip>
          </template>
          <template v-slot:[`item.service_addresses.address`]="{ item }">
            {{ processAddresses(item) }}
          </template>
          <template v-slot:[`item.neighborhood.name`]="{ item }">
            {{ processAddressesNeighborhood(item) }}
          </template>
          <template v-slot:[`item.technology.name`]="{ item }">
            <strong>
              {{ item.technology ? item.technology.name : 'No Reg.' }}
            </strong>
          </template>
          <template v-slot:[`item.balance`]="props">
            <strong> ${{ Number(reducePeningInvoices(props.item.invoices)).toLocaleString('es') }} </strong>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  icon
                  :color="$vuetify.theme.dark && !block ? 'white' : 'green darken-4 white--text'"
                  class="rounded-xl"
                  :to="`/client/${item.normalized_client ? item.normalized_client.id : ''}?city=${$route.query.city}&clienttype=${$route.query.clienttype}&company=${$route.query.company}&service=${item.id}`"
                  v-on="on"
                >
                  <v-icon :class="block ? 'mr-1' : ''">
                    mdi-account
                  </v-icon>
                  <span v-if="block">
                    Ir al Cliente
                  </span>
                </v-btn>
              </template>
              <span>Cliente</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </client-only>
      <div v-if="pagination.pageCount > 1" class="text-center pt-2">
        <v-pagination
          v-model="pagination.page"
          :disabled="loadingDataTable"
          :length="pagination.pageCount"
          @input="getLatestServices"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import * as XLSX from 'xlsx'
export default {
  name: 'ClientList',
  props: {
    block: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isRx: true,
      itemsPerPage: 500,
      loadingDataTable: false,
      options: {},
      pageCount: 0,
      pagination: {
        page: 1,
        pageSize: 50,
        pageCount: 0
      },
      services: [],
      activeServices: 0,
      inactiveServices: 0,
      retiredServices: 0,
      freeServices: 0,
      menu: false,
      filterMonth: null
    }
  },
  computed: {
    currentCity () {
      // eslint-disable-next-line eqeqeq
      return this.$store.state.cities ? this.$store.state.cities.find(c => c.name == this.$route.query.city) : ''
    },
    plans () {
      return this.$store.state.plans
    },
    neighborhoods () {
      return this.$store.state.neighborhoods
    },
    technologies () {
      return this.$store.state.technologies
    },
    getHeadersByClienttype () {
      return [
        { text: 'Estado', value: 'active', sortable: false },
        { text: 'Codigo', value: 'code', sortable: false },
        { text: 'Nombre', value: 'normalized_client.name', sortable: false },
        { text: 'Cedula', value: 'normalized_client.dni', sortable: false },
        { text: 'Direccion', sortable: false, value: 'address' },
        { text: 'Barrio', value: 'neighborhood', sortable: false },
        { text: 'Telefono', sortable: false, value: 'normalized_client.phone' },
        { text: 'Saldo', sortable: false, value: 'balance' },
        { text: 'Acciones', value: 'actions', sortable: false }
      ]
    }
  },
  watch: {
    'pagination.page' () {
      this.getLatestServices()
    },
    $route () {
      this.pagination.page = 1
      this.getLatestServices()
    }
  },
  mounted () {
    this.getLatestServices()
    this.getLatestActiveServices()
    this.getLatestIndebtServices()
    this.getLatestRetiredServices()
    this.getFreeServices()
  },
  methods: {
    selectRow (item) {
      this.$router.push(`/client/${item.normalized_client ? item.normalized_client.id : ''}?city=${this.$route.query.city}&clienttype=${this.$route.query.clienttype}&company=${this.$route.query.company}&service=${item.id}`)
    },
    async getLatestServices () {
      this.loadingDataTable = true
      const qs = require('qs')
      const query = qs.stringify({
        pagination: this.pagination,
        populate: ['normalized_client', 'service_addressess', 'offer', 'invoices'],
        sort: 'createdAt:desc',
        filters: this.filterMonth ? {
          company: {
            name: this.$route.query.company
          },
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          },
          createdAt: {
            $gte: this.filterMonth[0],
            $lte: this.filterMonth[1]
          }
        } : {
          company: {
            name: this.$route.query.company
          },
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          }
        }
      },
      {
        encodeValuesOnly: true
      })
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: services, meta }) => {
            this.services = services
            this.pagination = meta.pagination
            this.loadingDataTable = false
            this.menu = false
          })
      } catch (error) {
        throw new Error(`GET LATEST SERVICES MODULE ${error}`)
      }
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
    clearFilter () {
      this.filterMonth = null
      this.getLatestServices()
      this.menu = false
    },
    async getLatestActiveServices () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          active: true,
          indebt: false,
          offer: {
            price: {
              $gt: 0
            }
          },
          company: {
            name: this.$route.query.company
          },
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          }
        }
      },
      {
        encodeValuesOnly: true
      })
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ _, meta }) => {
            this.activeServices = meta.pagination.total
          })
      } catch (error) {
        throw new Error(`GET LATEST SERVICES MODULE ${error}`)
      }
    },
    async getLatestIndebtServices () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          active: true,
          indebt: true,
          company: {
            name: this.$route.query.company
          },
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          }
        }
      },
      {
        encodeValuesOnly: true
      })
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ _, meta }) => {
            this.inactiveServices = meta.pagination.total
          })
      } catch (error) {
        throw new Error(`GET LATEST SERVICES MODULE ${error}`)
      }
    },
    async getLatestRetiredServices () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          active: false,
          indebt: false,
          company: {
            name: this.$route.query.company
          },
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          }
        }
      },
      {
        encodeValuesOnly: true
      })
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ _, meta }) => {
            this.retiredServices = meta.pagination.total
          })
      } catch (error) {
        throw new Error(`GET LATEST SERVICES MODULE ${error}`)
      }
    },
    async getFreeServices () {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          offer: {
            price: 0
          },
          company: {
            name: this.$route.query.company
          },
          city: {
            name: this.$route.query.city
          },
          clienttype: {
            name: this.$route.query.clienttype
          }
        }
      },
      {
        encodeValuesOnly: true
      })
      try {
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ _, meta }) => {
            this.freeServices = meta.pagination.total
          })
      } catch (error) {
        throw new Error(`GET LATEST SERVICES MODULE ${error}`)
      }
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })
      return humanDateFormat
    },
    async downloadExcelData () {
      this.loadingDataTable = true
      this.pagination.pageSize = 5000
      await this.getLatestServices()
      // Crear un nuevo libro y hoja de cálculo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(this.services.map(row => ({
        Nombre: row.client_name,
        Cedula: row.dni,
        Direccion: row.address,
        Barrio: row.neighborhood,
        Codigo: row.code,
        Correo: row.normalized_client.email,
        Telefono: row.phone,
        Plan: row.offer.name,
        Tarifa: row.offer.price,
        Fecha_Afiliacion: this.getDate(row.createdAt),
        Estrato: row.stratum,
        Activo: row.active && !row.indebt ? 'A' : !row.active && !row.indebt ? 'R' : 'D',
        Saldo: row.invoices.filter(invoice => !invoice.payed).reduce((acc, invoice) => acc + invoice.balance, 0)
      })))

      // Configurar estilos
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { r: R, c: C }
          const cellRef = XLSX.utils.encode_cell(cellAddress)

          if (!ws[cellRef]) { continue }

          // Agregar bordes
          ws[cellRef].s = {
            border: {
              top: { style: 'thin', color: '000000' },
              bottom: { style: 'thin', color: '000000' },
              left: { style: 'thin', color: '000000' },
              right: { style: 'thin', color: '000000' }
            }
          }

          // Calcular el ancho de la columna basándose en el contenido más largo
          const cellText = XLSX.utils.format_cell(ws[cellRef])
          const cellTextLength = cellText ? cellText.length : 0
          if (!ws['!cols'] || ws['!cols'][C]) {
            ws['!cols'] = ws['!cols'] || []
            ws['!cols'][C] = { wch: cellTextLength + 2 } // Puedes ajustar el +2 según tus necesidades
          }
        }
      }

      // Agregar hoja de cálculo al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

      // Crear un Blob y descargar el archivo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(data)
      link.download = 'Clientes.xlsx'
      link.click()
      this.pagination.pageSize = 50
      await this.getLatestServices()
      this.loadingDataTable = false
    },
    processAddresses ({ service }) {
      if (!service) { return 'Sin Direccion' }
      const addresses = service?.service_addresses
      if (!addresses) { return 'Sin Dirección' }
      if (addresses && addresses.length > 0) { return addresses.at(-1).address }
    },
    processAddressesNeighborhood ({ service }) {
      if (!service) { return 'Sin Barrio' }
      const addresses = service?.service_addresses
      if (!addresses) { return 'Sin Barrio' }
      if (addresses.length > 0 && addresses.at(-1).neighborhood) { return addresses.at(-1).neighborhood.name }
      if (addresses.length > 0 && !addresses.at(-1).neighborhood) { return 'Sin barrio' }
    }
  }
}
</script>
