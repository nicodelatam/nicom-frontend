<template>
  <div>
    <v-data-table
      :items="legalNotes"
      :headers="headers"
      :items-per-page="itemsPerPage"
      :page.sync="page"
      :options.sync="options"
      :loading="loadingDataTable"
      no-data-text="No hay recibos para mostrar..."
      loading-text="Cargando recibos..."
      dense
      hide-default-footer
      :caption="`Movimientos para servicio ID: ${$route.params.search}`"
      mobile-breakpoint="100"
      @page-count="pageCount = $event"
    >
      <template v-slot:[`item.debit`]="props">
        <strong> ${{ Number(props.item.debit).toLocaleString('es') }} </strong>
      </template>
      <template v-slot:[`item.credit`]="props">
        <strong> ${{ Number(props.item.credit).toLocaleString('es') }} </strong>
      </template>
      <template v-slot:[`item.invoices`]="props">
        <strong :class="props.item.cancelled ? 'red lighten-2' : ''"> {{ props.item.cancelled ? `Anulada: ${props.item.cancelreason}` : formatConcepts(props.item.invoice_movements, props.item) }} </strong>
      </template>
      <template v-slot:[`item.createdAt`]="props">
        <strong> {{ getDate(props.item.createdAt) }} </strong>
      </template>
      <template v-slot:[`top`]>
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
      </template>
      <template v-slot:[`item.actions`]="props">
        <v-btn
          v-if="props.item.debit === 0 && props.item.credit > 0"
          class="white black--text"
          x-small
          @click="openPrintReceipt(props.item)"
        >
          <v-icon>mdi-printer</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-pagination v-model="page" :length="pageCount" />
  </div>
</template>
<script>
import * as XLSX from 'xlsx'
export default {
  data () {
    return {
      itemsPerPage: 50,
      page: 1,
      pageCount: 0,
      options: {},
      loadingDataTable: false,
      selected: [],
      headers: [
        { text: 'Fecha', value: 'createdAt', align: 'start' },
        { text: 'Debito', value: 'debit', sortable: false },
        { text: 'Crédito', value: 'credit', sortable: false },
        { text: 'Conceptos', value: 'invoices', sortable: false },
        { text: 'Acciones', value: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    legalNotes () {
      return this.$store.state.billing.legalNotes
    },
    showPayed () {
      return this.$store.state.billing.showPayed
    }
  },
  methods: {
    downloadExcelData () {
      this.loadingDataTable = true
      // Crear un nuevo libro y hoja de cálculo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(this.$store.state.billing.legalNotes.map(row => ({
        No: row.id,
        Fecha: row.createdAt,
        Usuario: row.service.code,
        Nombre: row.service.client_name,
        Concepto: this.formatConcepts(row.invoice_movements, row),
        Cobros: row.debit,
        Pagos: row.credit,
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
      XLSX.utils.book_append_sheet(wb, ws, 'Recibos Cliente')

      // Crear un Blob y descargar el archivo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(data)
      link.download = 'RecibosCliente.xlsx'
      link.click()
      this.loadingDataTable = false
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
      return humanDateFormat
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
    openPrintReceipt (receipt) {
      localStorage.removeItem('receiptToPrint')
      localStorage.setItem('receiptToPrint', JSON.stringify(receipt))
      window.open(`/bill?id=${receipt.id}`)
    }
  }
}
</script>
