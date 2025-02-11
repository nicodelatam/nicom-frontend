<template>
  <v-container>
    <v-row>
      <v-card width="100%">
        <v-card-title>
          Aplicar pagos en lote
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-textarea
              v-model="info"
              label="Informacion a parsear"
              hide-details
              outlined
              rounded
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="parseInfo"
          >
            Procesar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-row>
    <v-row>
      <v-card width="100%">
        <v-card-title>Resultados</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headers"
            :items="items"
            :items-per-page="500"
            class="elevation-1"
          />
        </v-card-text>
      </v-card>
    </v-row>
  </v-container>
</template>
<script>
export default {
  data: () => ({
    valid: false,
    info: '',
    headers: [
      { text: 'Código', value: 'code' },
      { text: 'Año', value: 'year' },
      { text: 'Mes', value: 'month' },
      { text: 'Monto', value: 'amount' },
      { text: 'Resutado', value: 'result', sortable: true }
    ],
    items: [],
    loading: false
  }),
  methods: {
    async parseInfo () {
      this.loading = true
      const lines = this.info.split('\n')
      for (const line of lines) {
        const [code, year, month, amount] = line.split(';')
        const service = await this.getInvoicesByServiceCode(code)
        if (!service) {
          this.items.push({ code, year, month, amount, result: 'Servicio no encontrado' })
          continue
        } else {
          this.items.push({ code, year, month, amount, result: 'Procesando' })
        }
        const serviceId = service.id
        const invoiceList = service.invoices
        const invoices = invoiceList.filter(invoice => invoice.year === parseInt(year) && invoice.month === parseInt(month) && invoice.payed === false)
        for (const invoice of invoices) {
          await this.createInvoiceMovement(serviceId, code, invoice, amount, year, month)
        }
      }
      this.loading = false
    },
    getInvoicesByServiceCode (serviceCode) {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          $and: [
            {
              city: {
                name: this.$route.query.city
              }
            },
            {
              clienttype: {
                name: this.$route.query.clienttype
              }
            }, {
              company: {
                name: this.$route.query.company
              }
            },
            {
              code: {
                $eq: serviceCode
              }
            }
          ]
        },
        populate: ['invoices', 'invoices.invoice_type']
      },
      {
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
            resolve(services[0])
          })
      })
    },
    async createInvoiceMovement (serviceId, code, invoice, amount, year, month) {
      const legalNote = {
        city: this.$route.query.city,
        clienttype: this.$route.query.clienttype,
        token: this.$store.state.auth.token,
        biller: this.$store.state.auth,
        service: serviceId,
        concept: invoice.invoice_type.name === 'FACTURACION MENSUAL' ? invoice.details : invoice.invoice_type.name,
        debit: 0,
        credit: amount,
        connect: true,
        invoices: [invoice]
      }
      const legalNoteRes = await this.$store.dispatch('billing/createLegalNote', legalNote)
      await this.$store.dispatch('billing/createInvoiceMovement', {
        token: this.$store.state.auth.token,
        biller: this.$store.state.auth,
        invoice,
        type: invoice.invoice_type.name,
        concept: invoice.details,
        amount,
        details: invoice.details,
        legalNote: legalNoteRes.id
      })
      await this.$store.dispatch('billing/updateInvoice', {
        token: this.$store.state.auth.token,
        invoice,
        payed: true,
        balance: 0
      })
      this.items.push({ code, year, month, amount, result: 'OK' })
    }
  }
}
</script>
