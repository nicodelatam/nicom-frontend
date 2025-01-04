<template>
  <span>
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          :block="block"
          :text="block"
          :x-small="!block"
          :color="$vuetify.theme.dark && !block ? 'yellow darken-4' : 'primary'"
          v-on="on"
          @click="initComponent"
        >
          <v-icon>mdi-file-document-plus-outline</v-icon>
          <span v-if="block">
            Aplicar saldo a favor
          </span>
        </v-btn>
      </template>
      <span>Aplicar saldo</span>
    </v-tooltip>
    <v-dialog
      v-model="modal"
      max-width="1024"
    >
      <v-card
        :loading="loading"
      >
        <v-card-title>
          <v-icon>mdi-bill</v-icon>
          Aplicar saldo a favor manualmente
        </v-card-title>
        <v-divider />
        <v-card-text v-if="invoices.length > 0">
          <v-data-table
            :headers="[
              { text: '#', value: 'id',sortable: false },
              { text: 'Concepto', value: 'concept', sortable: false },
              { text: 'Detalles', value: 'details', sortable: false },
              { text: 'Valor Inicial', value: 'value',sortable: false },
              { text: 'Saldo pendiente', value: 'balance', sortable: false },
              { text: 'Acciones', value: 'actions', sortable: false }
            ]"
            :items="invoices"
            :loading="loading"
            :mobile-breakpoint="0"
            :no-data-text="'No hay datos para mostrar'"
            :no-results-text="'No hay adelantos para mostrar'"
            class="elevation-1"
            hide-default-footer
            item-key="id"
          >
            <template v-slot:[`item.actions`]="{ item }">
              <div class="d-flex">
                <v-btn
                  :color="item.success ? 'yellow darken-4' : 'green darken-4'"
                  :disabled="item.resend_at && !hasPassed24Hours(item.resend_at)"
                  small
                  @click="createInvoiceMovement(item, infavor)"
                >
                  <v-icon>mdi-send</v-icon>
                  Aplicar
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn
            color="green darken-1"
            text
            @click="modal = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
export default {
  name: 'ApplyBalanceInFavor',
  props: {
    infavor: {
      type: Object,
      default: () => {}
    },
    service: {
      type: Object,
      default: () => {}
    },
    block: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    modal: false,
    loading: false,
    billData: null,
    months: [
      {
        text: 'Enero',
        value: 1
      },
      {
        text: 'Febrero',
        value: 2
      },
      {
        text: 'Marzo',
        value: 3
      },
      {
        text: 'Abril',
        value: 4
      },
      {
        text: 'Mayo',
        value: 5
      },
      {
        text: 'Junio',
        value: 6
      },
      {
        text: 'Julio',
        value: 7
      },
      {
        text: 'Agosto',
        value: 8
      },
      {
        text: 'Septiembre',
        value: 9
      },
      {
        text: 'Octubre',
        value: 10
      },
      {
        text: 'Noviembre',
        value: 11
      },
      {
        text: 'Diciembre',
        value: 12
      }
    ]
  }),
  computed: {
    serviceData () {
      return this.$store.state.billing.billsForCurrentService
    },
    invoices () {
      return this.$store.state.billing.invoices.filter(i => i.concept !== 'ADELANTO')
    }
  },
  methods: {
    initComponent () {
      this.modal = true
    },
    hasPassed24Hours (date) {
      if (!date) { return false }
      const now = new Date()
      const billDate = new Date(date)
      const diff = now.getTime() - billDate.getTime()
      const hours = diff / (1000 * 3600)
      return hours > 24
    },
    async createInvoiceMovement (invoice, infavor) {
      let balanceToApply = 0
      let balanceLeft = 0
      if (infavor.balance >= invoice.balance) {
        balanceToApply = invoice.balance
        balanceLeft = infavor.balance - balanceToApply
      } else {
        balanceToApply = invoice.balance - infavor.balance
        balanceLeft = 0
      }
      if (this.loading) { return }
      this.loading = true
      const legalNote = {
        city: this.service.city.name,
        clienttype: this.service.name,
        token: this.$store.state.auth.token,
        biller: this.$store.state.auth,
        service: this.service.id,
        concept: 'APLICA SALDO A FAVOR',
        debit: 0,
        credit: balanceToApply,
        connect: true,
        invoices: [invoice]
      }
      const legalNoteRes = await this.$store.dispatch('billing/createLegalNote', legalNote)
      await this.$store.dispatch('billing/createInvoiceMovement', {
        token: this.$store.state.auth.token,
        biller: this.$store.state.auth,
        invoice,
        type: 'ADELANTO',
        concept: invoice.details,
        amount: invoice.balance === infavor.balance ? balanceToApply : invoice.balance - balanceToApply,
        details: 'APLICA SALDO A FAVOR',
        legalNote: legalNoteRes.id
      })
      await this.$store.dispatch('billing/updateInvoice', { // Update afected invoice
        token: this.$store.state.auth.token,
        invoice,
        payed: invoice.balance - balanceToApply === 0,
        balance: invoice.balance === infavor.balance ? invoice.balance - balanceToApply : balanceToApply
      })
      await this.$store.dispatch('billing/updateInvoice', { // Update in favor invoice
        token: this.$store.state.auth.token,
        invoice: this.infavor,
        payed: balanceLeft === 0,
        balance: balanceLeft
      })
      this.$store.commit('billing/refresh')
      this.loading = false
      this.dialog = false
    },
    getHumanDate (date) {
      return new Date(date).toLocaleDateString({
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  grid-gap: 1rem;
  grid-auto-rows: minmax(100px, auto);
}
.grid-item {
  border-radius: 5px;
  padding: 1rem;
  font-size: 1.2rem;
  text-align: center;
}

</style>
