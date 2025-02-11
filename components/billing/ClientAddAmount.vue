<template>
  <v-dialog
    v-model="dialog"
    width="90vw"
  >
    <template v-slot:activator="{ on: onDialog, attrs: attrDialog }">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            :color="$vuetify.theme.dark ? 'white black--text' : 'primary'"
            class="rounded-xl"
            v-bind="{...attrs, ...attrDialog}"
            v-on="{ ...on, ...onDialog }"
          >
            <v-icon>mdi-currency-usd</v-icon>
            Agregar Cobro
          </v-btn>
        </template>
        <span>Generar Cobro</span>
      </v-tooltip>
    </template>
    <v-card :loading="loading" class="mt-2 rounded-lg">
      <v-card-title class="d-flex justify-center">
        Agregar saldo por concepto
      </v-card-title>
      <v-card-text>
        <v-form v-model="valid" action="" class="d-lg-flex mt-2 mt-lg-0">
          <v-btn
            v-if="amount"
            :disabled="!valid || loading"
            :block="!$store.state.isDesktop"
            color="primary"
            class="mr-0 mr-lg-2 mt-2 mt-lg-0"
            rounded
            x-large
            @click="addAmount"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
          <v-text-field
            v-model.number="amount"
            type="number"
            label="Valor"
            :rules="canNotBeNullNorContainCommasOrDots"
            :disabled="loading"
            outlined
            rounded
            class="mr-0 mr-lg-2 mt-2 mt-lg-0"
            hide-details="auto"
            placeholder="$0.00"
            append-icon="mdi-currency-usd"
            color="red"
            @keyup.enter="addAmount"
          />
          <v-autocomplete
            v-model="billtype"
            :items="billtypes"
            :disabled="loading"
            item-text="name"
            item-value="id"
            label="Tipo de cobro"
            class="mr-0 mr-lg-2 mt-2 mt-lg-0"
            return-object
            hide-details
            outlined
            rounded
            autofocus
            @keyup.enter="addAmount"
          />
          <v-text-field
            v-model.number="month"
            type="number"
            label="Mes"
            class="mr-0 mr-lg-2 mt-2 mt-lg-0"
            :disabled="loading"
            max="12"
            hide-details="auto"
            outlined
            rounded
            @keyup.enter="addAmount"
          />
          <v-text-field
            v-model.number="year"
            type="number"
            label="Año"
            class="mr-0 mr-lg-2 mt-2 mt-lg-0"
            :disabled="loading"
            hide-details="auto"
            outlined
            rounded
            @keyup.enter="addAmount"
          />
          <v-text-field
            v-model="details"
            label="Observaciones (OPCIONAL)"
            class="mr-0 mr-lg-2 mt-2 mt-lg-0 d-lg-flex"
            :disabled="loading"
            hide-details
            filled
            rounded
            color="blue"
            @keyup.enter="addAmount"
          />
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  props: {
    service: {
      type: Object,
      default: () => {},
      required: true
    }
  },
  data () {
    return {
      valid: true,
      dialog: false,
      amount: null,
      details: null,
      loading: false,
      month: this.getCurrentMonth(),
      monthName: this.getCurrentMonthName(),
      year: this.getCurrentYear(),
      canNotBeNullNorContainCommasOrDots: [
        v => !!v || 'El monto es requerido',
        v => v > 0 || 'El monto debe ser mayor a 0',
        v => !v?.toString().includes(',') || 'No se permiten comas',
        v => !v?.toString().includes('.') || 'No se permiten puntos'
      ],
      billtype: {
        id: 1,
        name: 'FACTURACION MENSUAL'
      },
      billtypes: []
    }
  },
  async mounted () {
    this.billtypes = await this.$store.dispatch('billing/getInvoiceTypes', { token: this.$store.state.auth.token })
  },
  methods: {
    async addAmount () {
      if (this.valid) {
        this.loading = true
        await this.$store.dispatch('billing/createInvoice', {
          balance: this.amount,
          value: this.amount,
          month: this.month,
          year: this.year,
          type: 'FACTURA',
          offer: 1,
          concept: this.billtype.name,
          details: this.details ? this.details : this.getMonthNameByNumber(),
          payed: false,
          partial: false,
          indebt: false,
          service: this.service.id,
          invoice_type: this.billtype.id,
          token: this.$store.state.auth.token
        })
        const legalNote = {
          city: this.service.city.name,
          clienttype: this.service.name,
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          service: this.service.id,
          debit: this.billtype.name === 'ADELANTO' ? 0 : this.amount,
          credit: this.billtype.name === 'ADELANTO' ? this.amount : 0,
          concept: this.billtype.name
        }
        await this.$store.dispatch('billing/createLegalNote', legalNote)
        if (this.billtype.name === 'FACTURACION MENSUAL') {
          await this.$store.dispatch('billing/updateBillingPeriod', {
            token: this.$store.state.auth.token,
            service: this.service,
            billingmonth: this.month,
            billingyear: this.year
          })
        }
        this.loading = false
        this.amount = null
        this.details = null
        this.$store.commit('billing/refresh')
        this.dialog = false
      } else {
        this.$toast.error('No se puede crear la factura. Verifique los datos.', { duration: 5000 })
        this.amount = null
        this.details = null
        this.loading = false
        this.$store.commit('billing/refresh')
      }
    },
    getCurrentMonth () {
      const date = new Date()
      const month = date.getMonth() + 1
      return month < 10 ? `0${month}` : month
    },
    getCurrentMonthName () {
      const date = new Date()
      const month = date.getMonth() + 1
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
      return monthNames[month - 1]
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
      return monthNames[this.month - 1]
    },
    getCurrentYear () {
      const date = new Date()
      return date.getFullYear()
    }
  }
}
</script>
