<template>
  <v-container fluid>
    <BillingInvoicesTemplate :invoices="invoices" :service="service" :company="company" />
  </v-container>
</template>
<script>
export default {
  name: 'Invoices',
  layout: 'print',
  data () {
    return {
      invoices: [],
      service: null,
      company: null
    }
  },
  async mounted () {
    this.invoices = await this.$store.dispatch('billing/getInvoicesByServiceId', {
      token: this.$store.state.auth.token,
      serviceId: this.$route.query.service,
      payed: false
    })
    this.company = await this.$store.dispatch('company/getCompanyByName', {
      company: this.$route.query.company,
      token: this.$store.state.auth.token
    })
    this.service = await this.$store.dispatch('billing/getServiceById', {
      token: this.$store.state.auth.token,
      serviceId: this.$route.query.service
    })
    // setTimeout(() => {
    //   this.printoToPdf()
    // }, 1000)
  },
  methods: {
    printoToPdf () {
      const html2pdf = require('html2pdf.js')
      const element = document.body
      const opt = {
        margin: 5,
        filename: 'CUENTA_' + this.service.client_name + '.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, width: 800, x: 0, y: 0 },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      }
      html2pdf().set(opt).from(element).save()
    }
  },
  head () {
    return {
      title: 'Imprimir Estados de Cuenta'
    }
  }
}
</script>
<style>
</style>
