<template>
  <v-card v-if="bill && company" id="billPrint" class="elevation-0 bill-card" light>
    <div class="header-section">
      <div class="logo-container">
        <img
          :src="this.$config.CDN_STRAPI_ENDPOINT + getLogo(company)"
          :alt="company.short_name"
          class="company-logo"
        >
      </div>
      <div class="company-info">
        <h4 class="company-name">
          {{ company.short_name }}
        </h4>
        <p class="mb-0">
          NIT: {{ company.nit }}
        </p>
        <p class="mb-0">
          {{ company.address }}
        </p>
      </div>
      <div class="receipt-info">
        <div class="receipt-box">
          <h5 class="receipt-title">
            RECIBO
          </h5>
          <h5 class="receipt-number">
            {{ bill.id }}
          </h5>
          <h5 class="receipt-code">
            CÓDIGO: {{ bill.service.code }}
          </h5>
        </div>
      </div>
    </div>

    <div class="section-title">
      DATOS PERSONALES DEL USUARIO
    </div>

    <div class="user-data-grid">
      <div class="user-data-section">
        <div class="data-label">
          NOMBRES Y APELLIDOS
        </div>
        <div class="data-value">
          {{ bill.service.client_name }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          NO. DOCUMENTO
        </div>
        <div class="data-value">
          {{ bill.service.dni }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          SERVICIO
        </div>
        <div class="data-value">
          {{ bill.service.offer.name }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          DIRECCIÓN DE DOMICILIO
        </div>
        <div class="data-value">
          {{ bill.service.address }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          BARRIO
        </div>
        <div class="data-value">
          {{ bill.service.neighborhood }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          ID DEL USUARIO
        </div>
        <div class="data-value">
          CÓDIGO: {{ bill.service.code }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          CELULAR
        </div>
        <div class="data-value">
          {{ bill.service.phone }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          CORREO ELECTRÓNICO
        </div>
        <div class="data-value">
          {{ bill.service.normalized_client.email }}
        </div>
      </div>

      <div class="user-data-section">
        <div class="data-label">
          PLAN CONTRATADO
        </div>
        <div class="data-value">
          {{ bill.service.offer.name }}
        </div>
      </div>
    </div>

    <div class="section-title">
      CONCEPTOS DE PAGO
    </div>

    <div class="payment-section">
      <div class="payment-details">
        <div v-if="bill.concept !== 'ADELANTO' && bill.concept !== 'APLICA SALDO A FAVOR'" class="payment-item">
          <span
            v-for="(movement, index) in bill.invoice_movements.filter(movement => movement.type !== 'ADELANTO')"
            :key="index"
          >
            Pago {{ movement.type === 'FACTURACION MENSUAL' ? 'Mes ' + movement.concept : movement.type }} ${{ Number(movement.amount).toLocaleString('es') }} pesos {{ movement.invoice.balance > 0 ? `| Saldo: $${Number(movement.invoice.balance).toLocaleString('es')}` : '' }}<br>
          </span>
        </div>
        <div v-else-if="bill.concept === 'APLICA SALDO A FAVOR'" class="payment-item">
          <span>
            Saldo a favor aplicado: ${{ Number(bill.credit).toLocaleString('es') }} pesos
          </span>
        </div>
        <div v-else class="payment-item">
          <span>
            Adelanto: ${{ Number(bill.credit).toLocaleString('es') }} pesos | Mes de {{ bill.invoices.find(invoice => invoice.payed === false && invoice.concept === "ADELANTO").details }} de {{ bill.invoices.find(invoice => invoice.payed === false && invoice.concept === "ADELANTO").year }}<br>
          </span>
        </div>
      </div>
      <div class="payment-date">
        {{ getDate(bill.createdAt) }}
      </div>
    </div>

    <div class="footer-section">
      <div class="payment-status-container">
        <div>
          <span v-if="getBalance() === 0 && bill.concept !== 'ADELANTO'" class="status-paid">PAGADO</span>
          <span v-else-if="bill.concept === 'ADELANTO'" class="status-advance">ADELANTO</span>
          <span v-else-if="bill.concept === 'APLICA SALDO A FAVOR'" class="status-advance">PAGO A FAVOR</span>
          <span v-else class="status-advance">ABONO</span>
        </div>

        <div class="balance-info">
          <strong v-if="bill.service.balance > 0 && bill.concept === 'ADELANTO'">${{ bill.credit.toLocaleString('es') }} pesos</strong>
          <strong v-else-if="bill.concept === 'APLICA SALDO A FAVOR'">Aplicado a <span v-for="(item, index) in getInvoicesWithBalance()" :key="index">
            {{ item.details }} de {{ item.year }}
          </span></strong>
          <strong v-else>TOTAL PENDIENTE POR PAGAR: ${{ getBalance().toLocaleString('es') }} <span v-if="getBalance() > 0">pesos de</span>
            <span v-for="(item, index) in getItemsWithBalance()" :key="index">
              {{ item.details }} de {{ item.year }}
            </span>
          </strong>
        </div>
      </div>

      <div class="contact-info">
        <div>LÍNEA DE ATENCIÓN: {{ company.phone }}</div>
        <div>CORREO ELECTRÓNICO: {{ company.email }}</div>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  props: {
    bill: {
      type: Object,
      default: () => {}
    },
    company: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
      return humanDateFormat
    },
    getBalance () {
      return this.bill.service.invoices.filter(invoice => invoice.invoice_type.name !== 'ADELANTO' && !invoice.cancelled && invoice.createdAt <= this.bill.createdAt).reduce((acc, curr) => {
        return acc + Number(curr.balance)
      }, 0)
    },
    getItemsWithBalance () {
      return this.bill.service.invoices.filter(invoice => invoice.invoice_type.name !== 'ADELANTO' && invoice.balance > 0 && !invoice.cancelled && invoice.createdAt <= this.bill.createdAt)
    },
    getInvoicesWithBalance () {
      return this.bill.invoices
    },
    getValue () {
      return this.bill.value
    },
    getLogo (company) {
      if (company.logo) {
        return company.logo.url
      } else {
        return 'default.png'
      }
    }
  }
}
</script>

<style scoped>
/* Configuración general */
.bill-card {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-width: 21cm; /* Ancho máximo A4 */
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  background-color: white;
  padding: 0;
}

/* Sección superior con logo y datos de empresa */
.header-section {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  padding: 5px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo-container {
  display: flex;
  justify-content: center;
  padding: 2px;
}

.company-info {
  text-align: center;
}

.company-name {
  color: #333;
  margin-bottom: 5px;
  font-weight: 600;
}

/* Sección de información del recibo */
.receipt-info {
  display: flex;
  justify-content: center;
}

.receipt-box {
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  width: 100%;
}

.receipt-title, .receipt-number, .receipt-code {
  border-bottom: 1px solid #f0f0f0;
  padding: 5px;
  margin: 0;
  font-weight: 600;
}

.receipt-code {
  border-bottom: none;
}

/* Títulos de sección */
.section-title {
  background-color: rgb(0,176,240);
  color: white;
  font-weight: bold;
  text-align: center;
  padding: 2px;
  margin-top: 15px;
  font-size: 14px;
}

/* Grid para datos del usuario */
.user-data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.user-data-section {
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
}

.user-data-section:nth-child(3n) {
  border-right: none;
}

.data-label {
  background-color: #f9f9f9;
  font-weight: 600;
  font-size: 12px;
  padding: 2px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.data-value {
  padding: 2px;
  text-align: center;
  font-size: 12px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sección de conceptos de pago */
.payment-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #f0f0f0;
}

.payment-details {
  border-right: 1px solid #f0f0f0;
  padding: 15px;
  font-size: 13px;
}

.payment-date {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: 13px;
  padding: 15px;
}

/* Sección de pie de página */
.footer-section {
  padding: 15px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  align-items: center;
}

.payment-status-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.balance-info {
  text-align: left;
  font-size: 13px;
}

.contact-info {
  text-align: right;
  font-size: 12px;
  color: #555;
  border-left: 1px solid #f0f0f0;
  padding-left: 15px;
}

/* Estados de pago */
.status-paid {
  color: #d32f2f;
  font-weight: bold;
  font-size: 16px;
  padding: 8px 15px;
  border: 1.5px solid #d32f2f;
  border-radius: 20px;
  display: inline-block;
}

.status-advance {
  color: #1976d2;
  font-weight: bold;
  font-size: 16px;
  padding: 8px 15px;
  border: 1.5px solid #1976d2;
  border-radius: 20px;
  display: inline-block;
}

/* Aseguramos que el componente se ajuste a la mitad superior de una A4 */
@media print {
  .bill-card {
    max-height: 14.8cm; /* Mitad de A4 (29.7cm / 2) */
    padding: 0;
    margin: 0;
    border: none;
  }
}

.company-logo {
  max-height: 80px;
  max-width: 160px;
  object-fit: contain;
}
</style>
