<template>
  <v-container fluid>
    <BillingInvoiceTemplate :invoice="invoice" :company="company" />
  </v-container>
</template>
<script>
export default {
  name: 'Invoice',
  layout: 'print',
  middleware: 'defaultCity',
  data () {
    return {
      invoice: null,
      company: null
    }
  },
  async mounted () {
    this.company = await this.$store.dispatch('company/getCompanyByName', {
      company: this.$route.query.company,
      token: this.$store.state.auth.token
    })
    this.invoice = await this.$store.dispatch('billing/getInvoiceById', {
      token: this.$store.state.auth.token,
      id: this.$route.query.id
    })
    setTimeout(() => {
      this.printoToPdf()
    }, 1000)
  },
  methods: {
    printoToPdf () {
      const html2pdf = require('html2pdf.js')
      const element = document.body
      const opt = {
        margin: 5,
        filename: 'FACTURA_' + this.invoice.service.client_name + '_' + this.invoice.createdAt + '.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, width: 800, x: 0, y: 0, useCORS: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      }
      html2pdf().set(opt).from(element).save()
    }
  },
  head () {
    return {
      title: 'Imprimir Estado de Cuenta'
    }
  }
}
</script>
<style>
</style>
