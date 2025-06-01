<template>
  <v-dialog
    v-model="dialog"
    width="50vw"
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
        <span class="text-h6 font-weight-bold">Agregar saldo por concepto</span>
      </v-card-title>
      <v-divider class="mb-2" />
      <v-card-text>
        <v-form v-model="valid" action="" class="mt-2">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="amount"
                type="number"
                label="Valor a cobrar"
                :rules="canNotBeNullNorContainCommasOrDots"
                :disabled="loading"
                outlined
                rounded
                hide-details="auto"
                placeholder="$0.00"
                append-icon="mdi-currency-usd"
                color="red"
                class="mb-2"
                @keyup.enter="addAmount"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="billtype"
                :items="billtypes"
                :disabled="loading"
                item-text="name"
                item-value="id"
                label="Tipo de cobro"
                return-object
                hide-details
                outlined
                rounded
                autofocus
                class="mb-2"
                @keyup.enter="addAmount"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6" md="3">
              <v-text-field
                v-model.number="month"
                type="number"
                label="Mes"
                :disabled="loading"
                max="12"
                hide-details="auto"
                outlined
                rounded
                class="mb-2"
                @keyup.enter="addAmount"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field
                v-model.number="year"
                type="number"
                label="Año"
                :disabled="loading"
                hide-details="auto"
                outlined
                rounded
                class="mb-2"
                @keyup.enter="addAmount"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="details"
                label="Observaciones (opcional)"
                :disabled="loading"
                hide-details
                filled
                rounded
                color="blue"
                class="mb-2"
                @keyup.enter="addAmount"
              />
            </v-col>
          </v-row>
          <v-divider class="my-2" />
          <v-row>
            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                v-if="amount"
                :disabled="!valid || loading"
                color="primary"
                class="rounded-xl px-6"
                rounded
                x-large
                @click="addAmount"
              >
                <v-icon left>
                  mdi-send
                </v-icon>
                Crear Cobro
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
import html2canvas from 'html2canvas'
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
  computed: {
    currentCompany () {
      return this.$store.state.company.currentCompany || {}
    }
  },
  async mounted () {
    this.billtypes = await this.$store.dispatch('billing/getInvoiceTypes', { token: this.$store.state.auth.token })
  },
  methods: {
    async addAmount () {
      if (this.valid) {
        if (!this.amount || !this.month || !this.year || !this.billtype) {
          this.$toast.error('Completa todos los campos primero.', { duration: 5000 })
          return
        }
        this.loading = true
        const newInvoice = await this.$store.dispatch('billing/createInvoice', {
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
        // Generar y subir imagen de la factura
        try {
          await this.generateImageFromBill(newInvoice, this.service)
        } catch (e) {
          this.$toast.error('No se pudo generar o subir la imagen de la factura', { duration: 4000 })
        }
        const legalNote = {
          city: this.service.city.name,
          clienttype: this.service.name,
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          service: this.service.id,
          debit: this.billtype.name === 'ADELANTO' ? 0 : this.amount,
          credit: this.billtype.name === 'ADELANTO' ? this.amount : 0,
          concept: this.billtype.name,
          invoices: [newInvoice],
          connect: true
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
    async generateImageFromBill (invoice, service) {
      try {
        const offer = service.offer || { name: 'N/A' }
        const company = this.currentCompany
        // Cargar la plantilla HTML
        const response = await fetch('/templates/invoice.html')
        const templateHtml = await response.text()

        // Función auxiliar para parsear fechas sin problemas de zona horaria
        const parseLocalDate = (dateString) => {
          if (!dateString) { return new Date() }

          // Si es una cadena en formato YYYY-MM-DD, parseamos manualmente
          if (typeof dateString === 'string' && dateString.includes('-')) {
            const [year, month, day] = dateString.split('-').map(Number)
            return new Date(year, month - 1, day) // month - 1 porque los meses son 0-based
          }

          // Si no, usar Date normal
          return new Date(dateString)
        }

        // Formatear fechas
        const today = new Date()
        const limitDate = parseLocalDate(invoice.limit) || today
        const formatDateLong = (date) => {
          const day = date.getDate()
          const monthNames = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
          ]
          const month = monthNames[date.getMonth()]
          const year = date.getFullYear()
          return `${day} de ${month} de ${year}`
        }
        const emissionDateFormatted = formatDateLong(today)
        const limitDateFormatted = formatDateLong(limitDate)
        const paymentConcept = `Pago Mes ${this.getMonthNameByNumber()} $${invoice.value.toLocaleString('es-CO')} pesos`
        const currentDateTime = new Date().toLocaleString('es-ES')
        // Crear un contenedor temporal para el HTML
        const tempContainer = document.createElement('div')
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '-9999px'
        tempContainer.innerHTML = templateHtml
        document.body.appendChild(tempContainer)
        // Referencias a los elementos
        const numeroReciboEl = tempContainer.querySelector('#numero-recibo')
        const codigoUsuarioEl = tempContainer.querySelector('#codigo-usuario')
        const idEmpresaEl = tempContainer.querySelector('#id-empresa')
        const direccionSucursalEl = tempContainer.querySelector('#direccion-sucursal')
        const nombreClienteEl = tempContainer.querySelector('#nombre-cliente')
        const documentoClienteEl = tempContainer.querySelector('#documento-cliente')
        const servicioClienteEl = tempContainer.querySelector('#servicio-cliente')
        const direccionClienteEl = tempContainer.querySelector('#direccion-cliente')
        const barrioClienteEl = tempContainer.querySelector('#barrio-cliente')
        const idUsuarioEl = tempContainer.querySelector('#id-usuario')
        const celularClienteEl = tempContainer.querySelector('#celular-cliente')
        const emailClienteEl = tempContainer.querySelector('#email-cliente')
        const planContratadoEl = tempContainer.querySelector('#plan-contratado')
        const conceptoPagoEl = tempContainer.querySelector('#concepto-pago')
        const fechaPagoEl = tempContainer.querySelector('#fecha-pago')
        const estadoPagoEl = tempContainer.querySelector('.pagado')
        const totalPendienteEl = tempContainer.querySelector('.total-pendiente')
        const emailEmpresaEl = tempContainer.querySelector('#email-empresa')
        const fechaEmisionEl = tempContainer.querySelector('#fecha-emision')
        const fechaLimiteEl = tempContainer.querySelector('#fecha-limite')
        const logoImgEl = tempContainer.querySelector('.logo img')
        const lineaAtencionEl = tempContainer.querySelector('.contacto div:first-child strong')
        // Asignar valores
        if (numeroReciboEl) { numeroReciboEl.textContent = invoice.id?.toString() || 'N/A' }
        if (codigoUsuarioEl) { codigoUsuarioEl.textContent = service.code || 'N/A' }
        if (idEmpresaEl) { idEmpresaEl.textContent = company.nit || 'N/A' }
        if (direccionSucursalEl) { direccionSucursalEl.textContent = company.address || 'N/A' }
        if (logoImgEl && company.logo && company.logo.url) {
          const cdnUrl = company.logo.url.startsWith('http')
            ? company.logo.url
            : `${this.$config.CDN_STRAPI_ENDPOINT}${company.logo.url}`
          logoImgEl.src = cdnUrl
          logoImgEl.alt = company.name
        }
        if (nombreClienteEl) { nombreClienteEl.textContent = service.client_name || 'N/A' }
        if (documentoClienteEl) { documentoClienteEl.textContent = service.dni || 'N/A' }
        if (servicioClienteEl) { servicioClienteEl.textContent = offer.name }
        if (planContratadoEl) { planContratadoEl.textContent = offer.name }
        if (direccionClienteEl) { direccionClienteEl.textContent = service.address || 'N/A' }
        if (barrioClienteEl) { barrioClienteEl.textContent = service.neighborhood || 'N/A' }
        if (idUsuarioEl) { idUsuarioEl.textContent = `CÓDIGO: ${service.code || 'N/A'}` }
        if (celularClienteEl) { celularClienteEl.textContent = service.phone || 'N/A' }
        if (emailClienteEl) { emailClienteEl.textContent = service.email || 'N/A' }
        if (lineaAtencionEl && lineaAtencionEl.parentNode) {
          lineaAtencionEl.parentNode.innerHTML = `<strong>LÍNEA DE ATENCIÓN:</strong> ${company.phone || '3219121937'}`
        }
        if (fechaEmisionEl) { fechaEmisionEl.textContent = emissionDateFormatted }
        if (fechaLimiteEl) { fechaLimiteEl.textContent = limitDateFormatted }
        if (conceptoPagoEl) { conceptoPagoEl.textContent = paymentConcept }
        if (fechaPagoEl) { fechaPagoEl.textContent = currentDateTime }
        const estadoTexto = invoice.payed ? 'PAGADO' : (invoice.partial ? 'ABONADO' : 'PENDIENTE')
        if (estadoPagoEl) {
          estadoPagoEl.textContent = estadoTexto
          if (!invoice.payed) {
            if (invoice.partial) {
              estadoPagoEl.style.borderColor = '#FFC107'
              estadoPagoEl.style.color = '#FFC107'
            } else {
              estadoPagoEl.style.borderColor = '#FF0000'
              estadoPagoEl.style.color = '#FF0000'
            }
          }
        }
        if (totalPendienteEl) {
          totalPendienteEl.textContent = `TOTAL PENDIENTE POR PAGAR: $${invoice.balance?.toLocaleString('es-CO') || '0'} pesos`
        }
        if (emailEmpresaEl) { emailEmpresaEl.textContent = company.email || 'N/A' }
        // Renderizar a imagen
        const element = tempContainer.querySelector('.factura-container')
        const imageElements = tempContainer.querySelectorAll('img')
        await Promise.all(Array.from(imageElements).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve()
            } else {
              img.onload = resolve
              img.onerror = () => resolve()
            }
          })
        }))
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        })
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        document.body.removeChild(tempContainer)
        const fileName = `recibo-${service.code}-${invoice.month}-${invoice.year}.jpg`
        return await this.uploadInvoiceImage(imgData, invoice.id, fileName)
      } catch (error) {
        console.error('Error generando imagen de factura:', error)
        this.$toast.error('Error al generar imagen de factura', { duration: 4000 })
        return null
      }
    },
    async uploadInvoiceImage (imageData, invoiceId, fileName) {
      try {
        const fetchResponse = await fetch(imageData)
        const blob = await fetchResponse.blob()
        const formData = new FormData()
        formData.append('files', blob, fileName)
        formData.append('ref', 'api::invoice.invoice')
        formData.append('refId', invoiceId)
        formData.append('field', 'image')
        const uploadResponse = await fetch(`${this.$config.API_STRAPI_ENDPOINT}upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.$store.state.auth.token}`
          },
          body: formData
        })
        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen de factura')
        }
        return await uploadResponse.json()
      } catch (error) {
        console.error('Error subiendo imagen:', error)
        this.$toast.error(`Error al subir imagen para Factura #${invoiceId}: ${error.message}`, { duration: 4000 })
        return null
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
