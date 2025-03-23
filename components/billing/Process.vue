<template>
  <v-container>
    <v-row>
      <v-col class="align-center d-flex">
        <v-btn
          color="primary"
          class="rounded-xl"
          block
          :loading="loading"
          :disabled="loading || activeServices.length < 1 || end"
          @click="generateBilling"
        >
          Generar Estados de Cuenta
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="end && omitedBills > 0">
      <v-col class="align-center d-flex">
        <BillingOfferCorrection :services="omitedBillsObjects" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <!-- <v-btn
          class="rounded-xl"
          color="primary"
          block
          :loading="loading"
          :disabled="loading || activeServices.length < 1 || !end"
          @click="exit"
        >
          Finalizar
        </v-btn> -->
        <v-btn
          class="rounded-xl"
          color="red"
          block
          :loading="loading"
          :disabled="loading || activeServices.length < 1 || !end"
          @click="sendNotifications"
        >
          Enviar Notificaciones por WhatsApp
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <span v-if="sendIndex > 0" class="text-h5">Enviados: <strong>{{ sendIndex }}</strong></span>
        <span v-if="generatedBills > 0" class="text-h5">Cargados: <strong>{{ generatedBills }}</strong></span>
        <span v-if="omitedBills > 0" class="text-h5">Sin Tarifa: <strong>{{ omitedBills }}</strong></span>
        <span v-if="alreadyBilled > 0" class="text-h5">Ya generados: <strong>{{ alreadyBilled }}</strong></span>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table
          v-if="activeServices.length > 0 && end && !loading && omitedBills < 1"
          :headers="headers"
          :items="activeServices"
        >
          <template v-slot:[`item.messageSent`]="{ item }">
            <v-chip
              v-if="item.messageSent"
              :color="item.messageSent ? 'green' : 'red'"
              text-color="white"
            >
              {{ item.messageSent ? 'ENVIADO' : 'FALLIDO' }}
            </v-chip>
            <v-chip
              v-else
              :color="'cyan darken-4'"
              text-color="white"
            >
              PENDIENTE
            </v-chip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import html2canvas from 'html2canvas'
export default {
  data () {
    return {
      end: false,
      loading: false,
      offerCorrectionDialog: false,
      generatedBills: 0,
      omitedBills: 0,
      omitedBillsObjects: [],
      alreadyBilled: 0,
      alreadyBilledObjects: [],
      headers: [
        { text: 'Codigo', value: 'code', sortable: false },
        { text: 'Nombre', value: 'normalized_client.name', sortable: false },
        { text: 'Celular', value: 'normalized_client.phone', sortable: false },
        { text: 'Estado del envio', value: 'messageSent', sortable: false }
      ],
      newBalance: 0
    }
  },
  computed: {
    activeServices () {
      return this.$store.state.billing.activeServices
    },
    sendIndex () {
      return this.$store.state.billing.sendIndex
    },
    month () {
      return this.$store.state.billing.month
    },
    year () {
      return this.$store.state.billing.year
    },
    limit () {
      return this.$store.state.billing.limit
    },
    currentCompany () {
      return this.$store.state.company.currentCompany
    }
  },
  methods: {
    getMetaServicesConfig () {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}companies/${this.currentCompany.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: company }) => {
            if (!company) {
              this.$toast.error('Error de configuracion. Reportar al webmaster. CODE:COMP_META_INFO_NOT_FOUND')
              return null
            }
            if (!company.meta_token || !company.meta_template || !company.meta_endpoint) {
              this.$toast.error('Error de configuracion. Reportar al webmaster. CODE:COMP_META_INFO_INCOMPLETE')
              return null
            }
            const metaServicesInfo = {
              meta_token: company.meta_token,
              meta_template: company.meta_template,
              meta_endpoint: company.meta_endpoint
            }
            resolve(metaServicesInfo)
          }).catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
            reject(error)
          })
      })
    },
    async generateImageFromBill (invoice, service) {
      try {
        // Obtener datos del servicio y oferta desde el objeto invoice
        const offer = service.offer

        // Cargar la plantilla HTML
        const response = await fetch('/templates/invoice.html')
        const templateHtml = await response.text()

        // Formatear fechas
        const emissionDate = new Date().toLocaleDateString('es-ES')
        const limitDate = new Date(invoice.limit).toLocaleDateString('es-ES')

        // Crear un contenedor temporal para el HTML
        const tempContainer = document.createElement('div')
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '-9999px'
        tempContainer.innerHTML = templateHtml
        document.body.appendChild(tempContainer)

        // Obtener referencias a los elementos por ID
        const facturaNroEl = tempContainer.querySelector('#numero-factura')
        const fechaEmisionEl = tempContainer.querySelector('.factura-fecha:nth-child(3)')
        const fechaLimiteEl = tempContainer.querySelector('.factura-fecha:nth-child(4)')
        const codigoUsuarioEl = tempContainer.querySelector('#codigo-usuario')
        const nombreClienteEl = tempContainer.querySelector('#nombre-cliente')
        const cedulaClienteEl = tempContainer.querySelector('#cedula-cliente')
        const planInternetEl = tempContainer.querySelector('#plan-internet')
        const direccionClienteEl = tempContainer.querySelector('#direccion-cliente')
        const barrioClienteEl = tempContainer.querySelector('#barrio-cliente')
        const celularClienteEl = tempContainer.querySelector('#celular-cliente')
        const emailClienteEl = tempContainer.querySelector('#email-cliente')
        const estadoFacturaEl = tempContainer.querySelector('#estado-factura')
        const codigoUsuario2El = tempContainer.querySelector('#codigo-usuario-2')
        const nitEmpresaEl = tempContainer.querySelector('#nit-empresa')
        const direccionEmpresaEl = tempContainer.querySelector('#direccion-empresa')
        const telefonoAtencionEl = tempContainer.querySelector('#telefono-atencion')
        const whatsappEmpresaEl = tempContainer.querySelector('#whatsapp-empresa')
        const emailEmpresaEl = tempContainer.querySelector('#email-empresa')
        const webEmpresaEl = tempContainer.querySelector('#web-empresa')
        const listaConceptosEl = tempContainer.querySelector('#lista-conceptos')
        const totalPagarEl = tempContainer.querySelector('#total-pagar')
        const watermarkEl = tempContainer.querySelector('.watermark')
        const logoEl = tempContainer.querySelector('.logo')

        // Establecer valores en los elementos
        facturaNroEl.textContent = `${this.currentCompany.factura_prefix || 'FGT'}-${invoice.id}`
        fechaEmisionEl.textContent = `Fecha de emisión: ${emissionDate}`
        fechaLimiteEl.textContent = `Fecha límite de pago: ${limitDate}`
        codigoUsuarioEl.textContent = service.code
        nombreClienteEl.textContent = service.client_name
        cedulaClienteEl.textContent = service.dni || 'N/A'
        planInternetEl.textContent = offer.name
        direccionClienteEl.textContent = service.address || 'N/A'
        barrioClienteEl.textContent = service.neighborhood || 'N/A'
        celularClienteEl.textContent = service.phone || 'N/A'
        emailClienteEl.textContent = service.email || 'N/A'

        const estadoTexto = invoice.payed ? 'PAGADO' : (invoice.partial ? 'ABONADO' : 'PENDIENTE')
        estadoFacturaEl.textContent = estadoTexto

        // Cambiar la clase del estado de la factura según corresponda
        if (!invoice.payed) {
          if (invoice.partial) {
            estadoFacturaEl.classList.add('abonado')
          } else {
            estadoFacturaEl.classList.add('pendiente')
          }
        }

        codigoUsuario2El.textContent = service.code

        // Información de la empresa
        const company = this.currentCompany
        nitEmpresaEl.textContent = company.nit || 'N/A'
        direccionEmpresaEl.textContent = company.address || 'N/A'
        telefonoAtencionEl.textContent = company.phone || 'N/A'
        whatsappEmpresaEl.textContent = company.whatsapp || 'N/A'
        emailEmpresaEl.textContent = company.email || 'N/A'
        webEmpresaEl.textContent = company.website || 'N/A'

        // Personalizar la marca de agua con el nombre de la compañía
        watermarkEl.textContent = company.name

        // Reemplazar logo texto con logo de la compañía si existe
        if (company.logo) {
          const imgLogo = document.createElement('img')
          imgLogo.src = company.logo
          imgLogo.alt = company.name
          imgLogo.classList.add('logo')
          logoEl.parentNode.replaceChild(imgLogo, logoEl)
        }

        // Crear conceptos de pago
        const monthNames = [
          'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
          'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ]

        // Limpiar conceptos existentes
        listaConceptosEl.innerHTML = ''

        // Crear concepto principal
        const conceptoDiv = document.createElement('div')
        conceptoDiv.className = 'concepto-item'

        const conceptoDescripcion = document.createElement('div')
        conceptoDescripcion.textContent = `Servicio de Internet ${offer.name} - Mes de ${monthNames[invoice.month - 1]} ${invoice.year}`

        const conceptoValor = document.createElement('div')
        conceptoValor.textContent = `$${invoice.value.toLocaleString('es-CO')}`

        conceptoDiv.appendChild(conceptoDescripcion)
        conceptoDiv.appendChild(conceptoValor)
        listaConceptosEl.appendChild(conceptoDiv)

        // Establecer total a pagar
        totalPagarEl.textContent = `$${invoice.value.toLocaleString('es-CO')}`

        // Renderizar el HTML a imagen con html2canvas
        const element = tempContainer.querySelector('.factura-container')
        const canvas = await html2canvas(element, {
          scale: 2, // Mayor resolución
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })

        // Convertir a imagen
        const imgData = canvas.toDataURL('image/jpeg', 0.95)

        // Eliminar el contenedor temporal
        document.body.removeChild(tempContainer)

        // Subir la imagen al servidor
        const imgPath = await this.uploadInvoiceImage(imgData, invoice.id, service.code)

        return imgPath
      } catch (error) {
        console.error('Error generando imagen de factura:', error)
        this.$toast.error('Error al generar imagen de factura')
        return null
      }
    },

    async uploadInvoiceImage (imageData, invoiceId, serviceCode) {
      try {
        // Convertir la imagen base64 a un blob
        const fetchResponse = await fetch(imageData)
        const blob = await fetchResponse.blob()

        // Crear un objeto FormData para enviar al servidor
        const formData = new FormData()
        formData.append('files', blob, `factura-${serviceCode}.jpg`)
        formData.append('ref', 'api::invoice.invoice')
        formData.append('field', 'image')
        formData.append('refId', invoiceId) // Cambia esto al ID de la factura si es necesario

        // Enviar al endpoint de carga de archivos de Strapi
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
        return null
      }
    },
    async sendNotifications () {
      this.loading = true
      const services = this.activeServices

      const metaServicesInfo = await this.getMetaServicesConfig()
      if (!metaServicesInfo) {
        this.loading = false
        this.$toast.error('Error de configuracion. Reportar al webmaster. CODE:COMP_META_INFO_ERROR')
        return
      }

      for (let i = 0; i < services.length; i++) {
        this.$store.commit('notification/setSendIndex', i + 1)

        const lastInvoice = services[i].invoices.at(-1)
        console.log('lastInvoice', lastInvoice)
        const imgPath = lastInvoice.image.url

        await this.$store.dispatch('notification/sendWhatsapp', {
          service: services[i],
          month: this.month,
          token: this.$store.state.auth.token,
          metaServicesInfo,
          imgPath
        }).then(async (res) => {
          if (
            res &&
            res.contacts &&
            res.contacts[0]
          ) {
            this.$toast.success('Notificacion enviada', { duration: 2000 })
            this.$store.commit('billing/messageSent', {
              index: i,
              success: true
            })
            await this.$store.dispatch('billing/updateSentStatus', {
              token: this.$store.state.auth.token,
              invoice: services[i].invoices.at(-1),
              success: true
            })
          }
        })
      }
      this.loading = false
      this.end = true
    },
    async getBalancesInFavor (serviceId) {
      return await this.$store.dispatch('billing/getBalancesInFavor', {
        token: this.$store.state.auth.token,
        serviceId
      })
    },
    async applyBalanceInFavorToInvoiceAndCreateLegalNote (activeService, infavor) {
      const invoicePrice = activeService.offer.price
      const balanceInFavor = infavor.balance
      let balanceToApply = 0
      let balanceLeft = 0
      if (balanceInFavor >= invoicePrice) {
        balanceToApply = invoicePrice
        balanceLeft = balanceInFavor - balanceToApply

        const recentInvoice = await this.$store.dispatch('billing/createInvoice', {
          balance: 0,
          value: invoicePrice,
          month: this.month.value,
          year: this.year,
          type: 'FACTURA',
          offer: activeService.offer.id,
          concept: 'FACTURACION MENSUAL',
          details: this.month.text,
          payed: true,
          partial: false,
          indebt: false,
          service: activeService.id,
          invoice_type: 1,
          limit: this.limit,
          token: this.$store.state.auth.token
        })

        const legalNote = {
          city: activeService.city.name,
          clienttype: activeService.name,
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          service: activeService.id,
          concept: 'APLICA SALDO A FAVOR',
          debit: 0,
          credit: balanceToApply,
          connect: true,
          invoices: [recentInvoice]
        }
        const legalNoteRes = await this.$store.dispatch('billing/createLegalNote', legalNote)

        await this.$store.dispatch('billing/createInvoiceMovement', {
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          invoice: recentInvoice,
          type: 'ADELANTO',
          concept: recentInvoice.details,
          amount: recentInvoice.value,
          details: 'APLICA SALDO A FAVOR',
          legalNote: legalNoteRes.id
        })

        await this.$store.dispatch('billing/updateInvoice', { // Update in favor invoice
          token: this.$store.state.auth.token,
          invoice: infavor,
          payed: balanceLeft === 0,
          balance: balanceLeft
        })
      } else {
        balanceToApply = invoicePrice - balanceInFavor
        balanceLeft = 0

        const recentInvoice = await this.$store.dispatch('billing/createInvoice', {
          balance: balanceToApply,
          value: invoicePrice,
          month: this.month.value,
          year: this.year,
          type: 'FACTURA',
          offer: activeService.offer.id,
          concept: 'FACTURACION MENSUAL',
          details: this.month.text,
          payed: false,
          partial: true,
          indebt: false,
          service: activeService.id,
          invoice_type: 1,
          limit: this.limit,
          token: this.$store.state.auth.token
        })

        const legalNote = {
          city: activeService.city.name,
          clienttype: activeService.name,
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          service: activeService.id,
          concept: 'APLICA SALDO A FAVOR',
          debit: 0,
          credit: balanceToApply,
          connect: true,
          invoices: [recentInvoice]
        }
        const legalNoteRes = await this.$store.dispatch('billing/createLegalNote', legalNote)

        await this.$store.dispatch('billing/createInvoiceMovement', {
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          invoice: recentInvoice,
          type: 'ADELANTO',
          concept: recentInvoice.details,
          amount: balanceInFavor,
          details: 'APLICA SALDO A FAVOR',
          legalNote: legalNoteRes.id
        })

        await this.$store.dispatch('billing/updateInvoice', { // Update in favor invoice
          token: this.$store.state.auth.token,
          invoice: infavor,
          payed: balanceLeft === 0,
          balance: balanceLeft
        })
      }
    },
    async processBalancesInFavor (activeService) {
      const balancesInFavor = await this.getBalancesInFavor(activeService.id) // Should return an array of balances in favor
      const validBalances = balancesInFavor.filter(b => b.balance > 0)
      if (validBalances.length < 1) {
        return false
      }
      balancesInFavor.forEach(async (balanceInFavor) => {
        await this.applyBalanceInFavorToInvoiceAndCreateLegalNote(activeService, balanceInFavor)
      })
      return true
    },
    async generateBilling () {
      this.loading = true
      for (let i = 0; i < this.activeServices.length; i++) {
        if (this.activeServices[i].offer === null) {
          this.omitedBills++
          this.omitedBillsObjects.push({ ...this.activeServices[i] })
          continue
        }
        if (this.activeServices[i].billingmonth === this.month.value && this.activeServices[i].billingyear === this.year) {
          this.alreadyBilled++
          this.alreadyBilledObjects.push({ ...this.activeServices[i] })
          continue
        }
        await this.$store.dispatch('billing/updateBillingPeriod', {
          token: this.$store.state.auth.token,
          service: this.activeServices[i],
          billingmonth: this.month.value,
          billingyear: this.year
        })

        const balancesInFavor = await this.processBalancesInFavor(this.activeServices[i])
        if (balancesInFavor) {
          this.generatedBills++
          continue
        }

        const newInvoiceData = {
          balance: this.activeServices[i].offer.price,
          value: this.activeServices[i].offer.price,
          month: this.month.value,
          year: this.year,
          type: 'FACTURA',
          offer: this.activeServices[i].offer.id,
          concept: 'FACTURACION MENSUAL',
          details: this.month.text,
          payed: false,
          partial: false,
          indebt: false,
          service: this.activeServices[i].id,
          invoice_type: 1,
          limit: this.limit,
          token: this.$store.state.auth.token
        }

        const newInvoice = await this.$store.dispatch('billing/createInvoice', newInvoiceData)

        const invoiceImagePath = await this.generateImageFromBill(newInvoice, this.activeServices[i])
        this.$store.commit('billing/addInvoice', {
          index: i,
          invoice: {
            ...newInvoice,
            image: invoiceImagePath
          }
        })

        if (invoiceImagePath.data === null) {
          this.loading = false
          this.$toast.error('Error al generar la imagen de la factura')
          return
        }

        const legalNote = {
          city: this.$route.query.city,
          clienttype: this.$route.query.clienttype,
          token: this.$store.state.auth.token,
          biller: this.$store.state.auth,
          service: parseInt(this.activeServices[i].id),
          debit: this.activeServices[i].offer.price,
          credit: 0,
          concept: 'FACTURACION MENSUAL'
        }
        await this.$store.dispatch('billing/createLegalNote', legalNote)
        await this.$store.dispatch('billing/updateServiceBalance', { balance: this.activeServices[i].balance + this.activeServices[i].offer.price, serviceId: this.activeServices[i].id, token: this.$store.state.auth.token })
        this.generatedBills++
      }
      this.loading = false
      this.end = true
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
    backToE1 () {
      this.$store.commit('billing/e1', { e1: 1 })
    },
    exit () {
      window.location.href = '/client'
    }
  }
}
</script>
