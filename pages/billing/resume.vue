<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card-title class="justify-center">
          Movimientos de cuenta
        </v-card-title>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="d-flex">
        <v-text-field
          ref="startDate"
          v-model="startDate"
          label="Inicio"
          type="date"
          outlined
          dense
          :rules="dateRules"
          class="rounded-xl"
          hide-details="auto"
          prepend-icon="mdi-calendar"
          @keyup.enter="setDateQuery"
        />
        <v-text-field
          v-model="endDate"
          label="Fin"
          type="date"
          outlined
          dense
          :rules="dateRules2"
          class="rounded-xl"
          hide-details="auto"
          prepend-icon="mdi-calendar"
          @keyup.enter="setDateQuery"
        />
        <v-btn
          color="white black--text"
          class="rounded-xl ml-4"
          @click="getBillsByDateRange"
        >
          <v-icon>
            mdi-history
          </v-icon>
        </v-btn>
      </v-col>
      <v-col>
        <v-btn-toggle
          v-model="mode"
          borderless
          dense
          color="primary"
        >
          <v-btn value="credit">
            <span class="hidden-sm-and-down">Credito</span>

            <v-icon right>
              mdi-arrow-down-bold
            </v-icon>
          </v-btn>

          <v-btn value="debit">
            <span class="hidden-sm-and-down">Debito</span>

            <v-icon right>
              mdi-arrow-up-bold
            </v-icon>
          </v-btn>
          <v-btn value="both">
            <span class="hidden-sm-and-down">Ambos</span>

            <v-icon right>
              mdi-circle
            </v-icon>
          </v-btn>
        </v-btn-toggle>
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
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card class="rounded-lg" style="width:100%;">
          <v-card-text>
            <v-container fluid>
              <v-row>
                <v-col>
                  <v-data-table
                    :items="billsOnDataRange"
                    :headers="headers"
                    :options.sync="options"
                    :loading="loadingDataTable"
                    no-data-text="No hay recibos para mostrar..."
                    loading-text="Cargando recibos..."
                    dense
                    hide-default-footer
                    :caption="`Recaudo de ${getDateWithoutHours(startDate)} a ${ getDateWithoutHours(endDate) } - Documentos: ${billsOnDataRange.length} - Total recaudado: $${Number(billsOnDataRange.reduce((a, b) => a + (b.credit || 0), 0)).toLocaleString('es')}`"
                    mobile-breakpoint="100"
                    @page-count="options.pageCount = $event"
                  >
                    <template v-slot:[`item.service.code`]="props">
                      <nuxt-link :to="`/billing/${props.item.service && props.item.service.code ? props.item.service.id : 'fallback'}?city=${$route.query.city}&clienttype=${$route.query.clienttype}`" class="blue--text">
                        <strong>
                          <h3>
                            {{ props.item.service && props.item.service.code ? props.item.service.code : 'Sin codigo' }}
                          </h3>
                        </strong>
                      </nuxt-link>
                    </template>
                    <template v-slot:[`item.debit`]="props">
                      <strong> ${{ Number(props.item.debit).toLocaleString('es') }} </strong>
                    </template>
                    <template v-slot:[`item.credit`]="props">
                      <strong> ${{ Number(props.item.credit).toLocaleString('es') }} </strong>
                    </template>
                    <template v-slot:[`item.invoices`]="props">
                      <strong> {{ formatConcepts(props.item.invoice_movements, props.item) }} </strong>
                    </template>
                    <template v-slot:[`item.createdAt`]="props">
                      <strong> {{ getDate(props.item.createdAt) }} </strong>
                    </template>
                    <template v-slot:[`item.biller.username`]="props">
                      <strong> {{ ucfirst(props.item.biller.username) }} </strong>
                    </template>
                  </v-data-table>
                  <v-pagination v-model="options.page" :length="options.pageCount" />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import * as XLSX from 'xlsx'
export default {
  data: () => ({
    selectedCity: null,
    selectedClienttype: null,
    startDate: '',
    endDate: '',
    dateRules: [
      v => !!v || 'La fecha de inicio es requerida',
      v => (v && v.length >= 10) || 'La fecha de inicio debe tener 10 caracteres',
      v => /^\d{4}-\d{2}-\d{2}$/.test(v) || 'La fecha de inicio debe tener el formato YYYY-MM-DD'
    ],
    dateRules2: [
      v => !!v || 'La fecha de fin es requerida',
      v => (v && v.length >= 10) || 'La fecha de fin debe tener 10 caracteres',
      v => /^\d{4}-\d{2}-\d{2}$/.test(v) || 'La fecha de fin debe tener el formato YYYY-MM-DD'
    ],
    headers: [
      { text: '#', value: 'id', align: 'start' },
      { text: 'Fecha', value: 'createdAt', align: 'start' },
      { text: 'Codigo', value: 'service.code', align: 'start' },
      { text: 'Nombre', value: 'service.normalized_client.name', align: 'start' },
      { text: 'Conceptos', value: 'invoices', sortable: false },
      { text: 'Debito', value: 'debit', sortable: false },
      { text: 'Crédito', value: 'credit', sortable: false },
      { text: 'Operador', value: 'biller.username', sortable: false }
    ],
    options: {
      page: 1,
      pageSize: 100,
      itemsPerPage: 100,
      pageCount: 0
    },
    loadingDataTable: false,
    mode: 'credit'
  }),
  computed: {
    billsOnDataRange () {
      return this.$store.state.billing.billsOnDataRange
    },
    cities () {
      return this.$store.state.company.cities
    },
    clienttypes () {
      return this.$store.state.company.clienttypes
    }
  },
  watch: {
    mode () {
      this.getBillsByDateRange()
    },
    '$route.query.startDate' () {
      this.getBillsByDateRange()
    },
    '$route.query.endDate' () {
      this.getBillsByDateRange()
    },
    '$route.query.city' () {
      this.setDateQuery()
      this.getBillsByDateRange()
    },
    '$route.query.clienttype' () {
      this.setDateQuery()
      this.getBillsByDateRange()
    }
  },
  mounted () {
    this.startDate = this.returnToday()
    this.endDate = this.returnToday()
    this.getBillsByDateRange()
    this.setDateQuery()
    this.setQueryCity()
    this.setSelectedClienttype()
  },
  methods: {
    downloadExcelData () {
      this.loadingDataTable = true
      // Crear un nuevo libro y hoja de cálculo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(this.$store.state.billing.billsOnDataRange.map(row => ({
        No: row.id,
        Fecha: row.createdAt,
        Usuario: row.service.code,
        Nombre: row.service.normalized_client.name,
        Concepto: this.formatConcepts(row.invoice_movements, row),
        Debido: row.debit,
        Credito: row.credit,
        Operador: row.biller.username
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
      XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')

      // Crear un Blob y descargar el archivo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(data)
      link.download = 'Movimientos.xlsx'
      link.click()
      this.loadingDataTable = false
    },
    changeCity (city) {
      this.$router.push({ query: { city: city.name, clienttype: this.$route.query.city } })
    },
    changeType (clienttype) {
      this.$router.push({ query: { city: this.$route.query.city, clienttype: clienttype.name } })
    },
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
    setDateQuery () {
      this.$router.push({
        query: {
          ...this.$route.query,
          startDate: this.startDate,
          endDate: this.endDate
        }
      })
    },
    async getBillsByDateRange () {
      this.loadingDataTable = true
      await this.$store.dispatch('billing/getBillsByDateRange', {
        city: this.$route.query.city,
        clienttype: this.$route.query.clienttype,
        token: this.$store.state.auth.token,
        from: this.$route.query.startDate || this.startDate,
        to: this.$route.query.endDate || this.endDate,
        credit: this.mode === 'credit' || this.mode === 'both',
        debit: this.mode === 'debit' || this.mode === 'both'
      })
      this.loadingDataTable = false
    },
    returnToday () {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      return `${yyyy}-${mm}-${dd}`
    },
    formatConcepts (invoicesMovements, legalNote) {
      if (invoicesMovements.length === 0) { return legalNote.concept }
      let concepts = ''
      invoicesMovements.forEach((movement, index) => {
        concepts += `${movement.type === 'FACTURACION MENSUAL' ? movement.concept : movement.type} $${Number(movement.amount).toLocaleString('es')}`
        if (index < invoicesMovements.length - 1) {
          concepts += ', '
        }
      })
      return concepts
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
      return humanDateFormat
    },
    getDateWithoutHours (date) {
      const dateObject = new Date(date + 'T00:00:00')
      const humanDateFormat = dateObject.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
      return humanDateFormat
    },
    ucfirst (string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
  },
  head () {
    return {
      title: `Movimientos de Cuenta ${this.startDate} a ${this.endDate}`
    }
  }
}
</script>
<style scoped>
input[type="date"]::-webkit-inner-spin-button,
input[type="date"]::-webkit-calendar-picker-indicator {
    display: none;
    -webkit-appearance: none;
}
.parent {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-gap: 10px;
  grid-auto-rows: minmax(100px, auto);
  padding: 0 12px;
}
</style>
