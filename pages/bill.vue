<template>
  <v-container fluid>
    <BillingBillTemplate :bill="bill" :company="company" />
    <v-btn text class="black--text mt-10" @click="printPrompt">
      <v-icon>mdi-printer</v-icon> Imprimir
    </v-btn>
  </v-container>
</template>
<script>
export default {
  name: 'Bill',
  layout: 'print',
  data () {
    return {
      bill: null,
      company: null
    }
  },
  async mounted () {
    this.bill = await this.$store.dispatch('billing/getBillById', {
      token: this.$store.state.auth.token,
      id: this.$route.query.id
    })
    this.company = await this.$store.dispatch('company/getCompanyByName', {
      company: this.$route.query.company,
      token: this.$store.state.auth.token
    })
    setTimeout(() => {
      this.printoToPdf() // Uncomment this line to print the bill automatically
    }, 1000)
  },
  methods: {
    printoToPdf () {
      const html2pdf = require('html2pdf.js')
      const element = document.body
      const opt = {
        margin: 5,
        filename: 'RECIBO_' + this.bill.service.client_name + '_' + this.bill.createdAt + '.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, width: 800, x: 0, y: 0 },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      }
      html2pdf().set(opt).from(element).save()
    },
    printPrompt () {
      window.print()
    }
  },
  head () {
    return {
      title: 'Imprimir Recibo'
    }
  }
}
</script>
<style>
</style>
