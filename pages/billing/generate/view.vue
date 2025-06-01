<template>
  <v-container fluid>
    <v-card class="mb-4 rounded-xl mx-auto elevation-0">
      <v-card-title class="text-center justify-center">
        Revisión y Reenvío de Notificaciones WhatsApp
      </v-card-title>

      <v-card-text>
        <!-- Filter Selection -->
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedMonth"
              :items="months"
              item-text="text"
              item-value="value"
              label="Mes"
              outlined
              dense
              hide-details="auto"
              class="mb-2"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="selectedYear"
              label="Año"
              type="number"
              outlined
              dense
              hide-details="auto"
              class="mb-2"
            />
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-row dense>
          <v-col cols="12" md="6">
            <v-btn
              color="primary"
              block
              :loading="loading"
              :disabled="!selectedMonth || !selectedYear"
              @click="loadInvoices"
            >
              <v-icon left>
                mdi-magnify
              </v-icon>
              Cargar Facturas
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn
              color="cyan darken-1 white--text"
              block
              :loading="loadingRetry"
              :disabled="loading || itemsToRetry.length === 0"
              @click="retrySends"
            >
              <v-icon left>
                mdi-whatsapp
              </v-icon>
              Reintentar Envíos ({{ itemsToRetry.length }})
            </v-btn>
          </v-col>
        </v-row>

        <!-- Summary Chips -->
        <v-row v-if="invoices.length > 0" dense class="mt-3">
          <v-col>
            <v-chip class="ma-1" color="primary">
              Total: <strong class="ml-1">{{ invoices.length }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="success darken-1">
              Enviados: <strong class="ml-1">{{ sentCount }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="red darken-2">
              Fallidos: <strong class="ml-1">{{ failedCount }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="cyan darken-3">
              Pendientes: <strong class="ml-1">{{ pendingCount }}</strong>
            </v-chip>
            <v-chip v-if="otherStatusCount > 0" class="ma-1" color="grey">
              Otros Estados: <strong class="ml-1">{{ otherStatusCount }}</strong>
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Invoices Table -->
    <v-card v-if="!loading && invoices.length > 0" class="rounded-xl elevation-0 mt-3">
      <v-card-title>
        Facturas Cargadas
        <v-spacer />
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar en tabla..."
          single-line
          hide-details
          dense
          outlined
          style="max-width: 300px;"
        />
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="invoices"
        :items-per-page="15"
        :search="search"
        item-key="id"
        class="elevation-0"
      >
        <template #item.value="{ item }">
          {{ formatCurrency(item.value) }}
        </template>

        <template #item.whatsapp_status="{ item }">
          <v-chip small :color="getWhatsappStatusColor(item.whatsapp_status)" text-color="white">
            {{ getWhatsappStatusText(item.whatsapp_status) }}
          </v-chip>
        </template>

        <template #item.whatsapp_attempted_at="{ item }">
          <span v-if="item.whatsapp_attempted_at">{{ formatDateTime(item.whatsapp_attempted_at) }}</span>
          <span v-else>-</span>
        </template>

        <template #item.whatsapp_error_message="{ item }">
          <v-tooltip v-if="item.whatsapp_error_message" bottom>
            <template #activator="{ on, attrs }">
              <span v-bind="attrs" class="d-inline-block text-truncate" style="max-width: 150px;" v-on="on">
                {{ item.whatsapp_error_message }}
              </span>
            </template>
            <span>{{ item.whatsapp_error_message }}</span>
          </v-tooltip>
          <span v-else>-</span>
        </template>
      </v-data-table>
    </v-card>
    <v-alert v-else-if="!loading && !invoices.length && searchPerformed" type="info" class="mt-3">
      No se encontraron facturas para los criterios seleccionados.
    </v-alert>
  </v-container>
</template>

<script>
import html2canvas from 'html2canvas' // Needed for image generation during retry
import qs from 'qs' // Import qs library

export default {
  middleware: 'authenticated',
  data () {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-indexed

    return {
      loading: false,
      loadingRetry: false,
      search: '',
      searchPerformed: false, // To track if a search was attempted
      selectedMonth: currentMonth,
      selectedYear: currentYear,
      invoices: [], // Holds the loaded invoices from Strapi
      headers: [
        { text: 'ID Factura', value: 'id', sortable: true },
        { text: 'Cód. Servicio', value: 'service.code', sortable: true },
        { text: 'Cliente', value: 'service.client_name', sortable: true },
        { text: 'Celular', value: 'service.phone', sortable: false },
        { text: 'Valor', value: 'value', sortable: true },
        { text: 'Estado WhatsApp', value: 'whatsapp_status', sortable: true },
        { text: 'Último Intento', value: 'whatsapp_attempted_at', sortable: true },
        { text: 'Mensaje Error', value: 'whatsapp_error_message', sortable: false, width: '200px' }
      ],
      months: [
        { text: 'Enero', value: 1 }, { text: 'Febrero', value: 2 }, { text: 'Marzo', value: 3 },
        { text: 'Abril', value: 4 }, { text: 'Mayo', value: 5 }, { text: 'Junio', value: 6 },
        { text: 'Julio', value: 7 }, { text: 'Agosto', value: 8 }, { text: 'Septiembre', value: 9 },
        { text: 'Octubre', value: 10 }, { text: 'Noviembre', value: 11 }, { text: 'Diciembre', value: 12 }
      ]
    }
  },

  computed: {
    // --- Vuex Data ---
    token () {
      return this.$store.state.auth.token
    },
    currentCompany () {
      return this.$store.state.company.currentCompany || {}
    },
    // --- Invoice Status Counts ---
    sentCount () {
      return this.invoices.filter(inv => inv.whatsapp_status === 'SENT').length
    },
    failedCount () {
      return this.invoices.filter(inv => inv.whatsapp_status === 'FAILED').length
    },
    pendingCount () {
      // Treat null, undefined, or 'PENDING' as pending
      return this.invoices.filter(inv => !inv.whatsapp_status || inv.whatsapp_status === 'PENDING').length
    },
    otherStatusCount () {
      return this.invoices.filter(inv => inv.whatsapp_status && !['SENT', 'FAILED', 'PENDING'].includes(inv.whatsapp_status)).length
    },
    itemsToRetry () {
      // Filter invoices that are PENDING or FAILED and have associated service/offer data
      return this.invoices.filter(inv =>
        (!inv.whatsapp_status || inv.whatsapp_status === 'PENDING' || inv.whatsapp_status === 'FAILED') &&
                  inv.service && inv.service.id && // Ensure service exists
                  inv.offer && inv.offer.id // Ensure offer exists (needed for image/message generation)
      )
    },
    apiEndpoint () {
      return this.$config.API_STRAPI_ENDPOINT
    },
    cdnEndpoint () {
      return this.$config.CDN_STRAPI_ENDPOINT
    }
  },

  mounted () {
    // Automatically load invoices if month/year and query params are present
    if (this.selectedMonth && this.selectedYear && this.$route.query.company) {
      this.loadInvoices()
    }
  },

  methods: {
    // --- Data Loading ---
    async loadInvoices () {
      if (!this.selectedMonth || !this.selectedYear) {
        this.$toast.error('Por favor seleccione Mes y Año.', { duration: 4000 })
        return
      }
      this.loading = true
      this.searchPerformed = true // Mark that a search was done
      this.invoices = [] // Reset previous results

      // Construct query object for qs
      const query = {
        filters: {
          month: { $eq: this.selectedMonth },
          year: { $eq: this.selectedYear }
        },
        populate: {
          service: { populate: ['offer', 'city', 'clienttype'] }, // Ensure city/clienttype are populated on service
          offer: true, // Populate invoice's direct offer link
          company: true // Populate company
        },
        pagination: {
          limit: -1 // Fetch all
        }
      }

      // Apply optional filters from route query
      const routeCity = this.$route.query.city
      const routeClientType = this.$route.query.clienttype
      const routeCompany = this.$route.query.company

      // Ensure nested filter structure
      if (routeCity || routeClientType) {
        query.filters.service = {}
        if (routeCity) {
          // Assuming filtering by city *name*
          query.filters.service.city = { name: { $eq: routeCity } }
        }
        if (routeClientType) {
          // Assuming filtering by clienttype *name*
          query.filters.service.clienttype = { name: { $eq: routeClientType } }
        }
      }

      if (routeCompany) {
        // Assuming filtering by company *ID*
        query.filters.company = { name: { $eq: routeCompany } }
      }

      // Stringify the query object using qs
      const queryString = qs.stringify(query, {
        encodeValuesOnly: true // Important for Strapi v4
      })

      try {
        const response = await fetch(`${this.apiEndpoint}invoices?${queryString}`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Failed to load invoices'}`)
        }

        const { data } = await response.json()
        this.invoices = data || [] // Assign fetched data or empty array
        this.$toast.success(`${this.invoices.length} facturas cargadas para ${this.months.find(m => m.value === this.selectedMonth)?.text} ${this.selectedYear}.`, { duration: 4000 })
      } catch (error) {
        console.error('Error loading invoices:', error)
        this.$toast.error(`Error cargando facturas: ${error.message}`, { duration: 5000 })
        this.invoices = [] // Clear invoices on error
      } finally {
        this.loading = false
      }
    },

    // --- Retry Logic ---
    async retrySends () {
      if (this.itemsToRetry.length === 0) {
        this.$toast.info('No hay envíos pendientes o fallidos para reintentar.', { duration: 4000 })
        return
      }

      this.loadingRetry = true
      this.$toast.info(`Iniciando reenvío para ${this.itemsToRetry.length} facturas...`, { duration: 4000 })

      const metaServicesInfo = await this.getMetaServicesConfig() // Reuse from process.vue
      if (!metaServicesInfo) {
        this.loadingRetry = false
        // Error toast is shown within getMetaServicesConfig
        return
      }

      let sentCount = 0
      let errorCount = 0

      // Loop through only items needing retry
      for (const invoice of this.itemsToRetry) {
        const serviceData = invoice.service // Service data should be populated
        const invoiceData = invoice // The item itself is the full invoice data

        // Double-check if data is sufficient
        if (!serviceData || !invoiceData || !serviceData.phone || !invoiceData.offer) {
          console.warn(`Skipping retry for Invoice ID ${invoice.id}: Missing required data (service, phone, or offer).`)
          this.$toast.info(`Saltando reintento Fac #${invoice.id}: Datos incompletos.`, { duration: 3000 })
          continue
        }

        try {
          // 1. Generate Image (if needed based on template config)
          let imageInfo = null
          if (this.currentCompany.meta_template) {
            this.$toast.info(`(Re)Generando imagen para factura #${invoiceData.id}...`, { duration: 2000 })
            imageInfo = await this.generateImageFromBill(invoiceData, serviceData)
            if (!imageInfo || !imageInfo[0]?.url) {
              this.$toast.error(`No se pudo generar/subir imagen para factura ${invoiceData.id}, se intentará enviar sin imagen.`, { duration: 4000 })
            } else {
              this.$toast.success(`Imagen (re)generada para factura #${invoiceData.id}`, { duration: 2000 })
            }
          }

          // 2. Send WhatsApp Notification via Vuex action (reuse the same action)
          this.$toast.info(`Reenviando WhatsApp para ${serviceData.code} (Fac #${invoiceData.id})...`, { duration: 3000 })
          const whatsappResponse = await this.$store.dispatch('notification/sendWhatsapp', {
            service: serviceData,
            invoice: invoiceData,
            // Need to get month/year object matching the invoice's month/year value
            month: this.months.find(m => m.value === invoiceData.month),
            year: invoiceData.year,
            limit: invoiceData.limit, // Pass the invoice's limit date
            token: this.token,
            metaServicesInfo,
            imgPath: imageInfo && imageInfo[0] ? imageInfo[0].url : null
          })

          // 3. Check Response and Update Status
          if (whatsappResponse && whatsappResponse.messages && whatsappResponse.messages[0]?.id) {
            this.$toast.success(`WhatsApp reenviado a ${serviceData.phone} (Fac #${invoiceData.id}).`, { duration: 4000 })
            await this.updateInvoiceWhatsappStatus(invoiceData.id, 'SENT')
            // Update local status for immediate UI feedback
            const localInvoice = this.invoices.find(inv => inv.id === invoiceData.id)
            if (localInvoice) {
              localInvoice.whatsapp_status = 'SENT'
              localInvoice.whatsapp_attempted_at = new Date().toISOString()
              localInvoice.whatsapp_error_message = null
            }
            sentCount++
          } else {
            const failureReason = whatsappResponse?.error?.message || 'Respuesta inválida o rechazada por API Meta.'
            throw new Error(failureReason)
          }
        } catch (error) {
          console.error(`Error retrying WhatsApp for invoice ${invoice.id}:`, error)
          this.$toast.error(`Error Reenvío Fac #${invoice.id} (${serviceData?.code}): ${error.message}`, { duration: 5000 })
          await this.updateInvoiceWhatsappStatus(invoice.id, 'FAILED', error.message)
          // Update local status
          const localInvoice = this.invoices.find(inv => inv.id === invoice.id)
          if (localInvoice) {
            localInvoice.whatsapp_status = 'FAILED'
            localInvoice.whatsapp_attempted_at = new Date().toISOString()
            localInvoice.whatsapp_error_message = error.message
          }
          errorCount++
        }
      } // End of loop

      this.loadingRetry = false
      this.$toast.success(`Proceso de reenvío finalizado. Enviados OK: ${sentCount}, Errores: ${errorCount}.`, { duration: 5000 })
      // Optionally reload invoices to confirm statuses from server
      // await this.loadInvoices();
    },

    // --- Status Update (Copied/Adapted from process.vue) ---
    async updateInvoiceWhatsappStatus (invoiceId, status, errorMessage = null) {
      if (!invoiceId) {
        console.error('Cannot update WhatsApp status: Invoice ID is missing.')
        return
      }
      const payload = { data: { whatsapp_status: status, whatsapp_attempted_at: new Date().toISOString(), whatsapp_error_message: errorMessage } }
      try {
        const response = await fetch(`${this.apiEndpoint}invoices/${invoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
          body: JSON.stringify(payload)
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Failed to update status'}`)
        }
        // No toast here for retries to avoid spamming, main process toast is enough
      } catch (error) {
        console.error(`Background Error updating WhatsApp status for invoice ${invoiceId}:`, error)
        // Maybe a single summary toast at the end if many updates fail?
        this.$toast.info(`Fallo al actualizar estado en BD para Fac #${invoiceId}. Reintento puede ocurrir de nuevo.`, { duration: 4000 })
      }
    },

    // --- Meta Config Fetching (Copied/Adapted from process.vue) ---
    getMetaServicesConfig () {
      const company = this.currentCompany
      if (company && company.meta_token && company.meta_endpoint && company.meta_template) {
        // this.$toast.info('Configuración Meta (WhatsApp) cargada.', { duration: 2000 }) // Less verbose for retry view
        return { meta_token: company.meta_token, meta_template: company.meta_template, meta_endpoint: company.meta_endpoint }
      } else {
        this.$toast.error('Configuración Meta incompleta. Verifique la configuración de la compañía.', { duration: 5000 })
        // Maybe try fetching like in process.vue, but for view mode, direct error might be better
        return null
      }
    },

    // --- Image Generation (Copied/Adapted from process.vue) ---
    // Note: Ensure template /templates/invoice.html is accessible
    async generateImageFromBill (invoice, service) {
      // Simple check for required data
      if (!invoice || !service || !invoice.id || !service.code || !service.offer) {
        this.$toast.error('Datos incompletos para generar imagen.', { duration: 4000 })
        return null
      }
      let tempContainer = null // Define here to ensure it's accessible in finally/catch

      try {
        const offer = service.offer // Should be populated
        const response = await fetch('/templates/invoice.html') // Check path
        if (!response.ok) { throw new Error(`Template invoice.html not found (${response.status})`) }
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

        const today = new Date()
        // Use invoice limit; fallback to today + 15 days if missing?
        const limitDate = invoice.limit ? parseLocalDate(invoice.limit) : new Date(today.setDate(today.getDate() + 15))

        const emissionDateFormatted = this.formatDateLong(new Date()) // Use current date for emission? Or invoice.createdAt?
        const limitDateFormatted = this.formatDateLong(limitDate)
        const paymentConcept = `Pago Mes ${this.getMonthName(invoice.month)} $${(invoice.value || 0).toLocaleString('es-CO')} pesos`

        tempContainer = document.createElement('div')
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '-9999px' // Hide it
        tempContainer.innerHTML = templateHtml
        document.body.appendChild(tempContainer)

        // --- Populate HTML (Ensure querySelectors match template) ---
        const selectors = {
          numeroRecibo: '#numero-recibo',
          codigoUsuario: '#codigo-usuario',
          idEmpresa: '#id-empresa',
          direccionSucursal: '#direccion-sucursal',
          nombreCliente: '#nombre-cliente',
          documentoCliente: '#documento-cliente',
          servicioCliente: '#servicio-cliente',
          direccionCliente: '#direccion-cliente',
          barrioCliente: '#barrio-cliente',
          idUsuario: '#id-usuario',
          celularCliente: '#celular-cliente',
          emailCliente: '#email-cliente',
          planContratado: '#plan-contratado',
          conceptoPago: '#concepto-pago',
          fechaPago: '#fecha-pago',
          estadoPago: '.pagado',
          totalPendiente: '.total-pendiente',
          emailEmpresa: '#email-empresa',
          fechaEmision: '#fecha-emision',
          fechaLimite: '#fecha-limite',
          logoImg: '.logo img',
          lineaAtencion: '.contacto div:first-child strong'
        }

        const populateElement = (selector, value) => {
          const el = tempContainer.querySelector(selector)
          if (el) { el.textContent = value || 'N/A' }
        }
        const company = this.currentCompany || {} // Use current loaded company

        populateElement(selectors.numeroRecibo, invoice.id)
        populateElement(selectors.codigoUsuario, service.code)
        populateElement(selectors.idEmpresa, company.nit)
        populateElement(selectors.direccionSucursal, company.address)
        populateElement(selectors.nombreCliente, service.client_name)
        populateElement(selectors.documentoCliente, service.dni)
        populateElement(selectors.servicioCliente, offer.name)
        populateElement(selectors.planContratado, offer.name)
        populateElement(selectors.direccionCliente, service.address)
        populateElement(selectors.barrioCliente, service.neighborhood)
        populateElement(selectors.idUsuario, `CÓDIGO: ${service.code}`)
        populateElement(selectors.celularCliente, service.phone)
        populateElement(selectors.emailCliente, service.email)
        populateElement(selectors.conceptoPago, paymentConcept)
        populateElement(selectors.fechaPago, new Date().toLocaleString('es-ES')) // Current time for generation?
        populateElement(selectors.emailEmpresa, company.email)
        populateElement(selectors.fechaEmision, emissionDateFormatted)
        populateElement(selectors.fechaLimite, limitDateFormatted)
        populateElement(selectors.totalPendiente, `TOTAL PENDIENTE POR PAGAR: $${(invoice.balance || 0).toLocaleString('es-CO')} pesos`)

        // Logo
        const logoImgEl = tempContainer.querySelector(selectors.logoImg)
        if (logoImgEl && company.logo?.url) {
          const cdnUrl = company.logo.url.startsWith('http') ? company.logo.url : `${this.cdnEndpoint}${company.logo.url}`
          logoImgEl.src = cdnUrl
          logoImgEl.alt = company.name || 'Logo'
        }
        // Linea Atencion
        const lineaAtencionEl = tempContainer.querySelector(selectors.lineaAtencion)
        if (lineaAtencionEl?.parentNode) {
          lineaAtencionEl.parentNode.innerHTML = `<strong>LÍNEA DE ATENCIÓN:</strong> ${company.phone || 'N/A'}`
        }
        // Estado Pago
        const estadoPagoEl = tempContainer.querySelector(selectors.estadoPago)
        if (estadoPagoEl) {
          const estadoTexto = invoice.payed ? 'PAGADO' : (invoice.partial ? 'ABONADO' : 'PENDIENTE')
          estadoPagoEl.textContent = estadoTexto
          estadoPagoEl.style.borderColor = invoice.payed ? '#4CAF50' : (invoice.partial ? '#FFC107' : '#FF0000')
          estadoPagoEl.style.color = invoice.payed ? '#4CAF50' : (invoice.partial ? '#FFC107' : '#FF0000')
        }

        // --- Render to Canvas ---
        const element = tempContainer.querySelector('.factura-container') // Ensure this class exists in template
        if (!element) { throw new Error('Element .factura-container not found in template.') }

        // Wait for images (like logo) to load
        await Promise.all(Array.from(tempContainer.querySelectorAll('img')).map(img =>
          img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = img.onerror = resolve })
        ))

        const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false })
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        const fileName = `recibo-${service.code}-${invoice.month}-${invoice.year}.jpg`

        // Upload
        return await this.uploadInvoiceImage(imgData, invoice.id, fileName)
      } catch (error) {
        console.error(`Error generating image for invoice ${invoice?.id}:`, error)
        this.$toast.error(`Error generando imagen Fac #${invoice?.id}: ${error.message}`, { duration: 5000 })
        return null // Indicate failure
      } finally {
        // Ensure temp container is removed
        if (tempContainer && tempContainer.parentNode) {
          document.body.removeChild(tempContainer)
        }
      }
    },

    // --- Image Upload (Copied/Adapted from process.vue) ---
    async uploadInvoiceImage (imageData, invoiceId, fileName) {
      try {
        const fetchResponse = await fetch(imageData)
        const blob = await fetchResponse.blob()
        const formData = new FormData()
        formData.append('files', blob, fileName)
        formData.append('ref', 'api::invoice.invoice')
        formData.append('refId', invoiceId)
        formData.append('field', 'image') // Ensure 'image' is the correct field name in Strapi for the invoice image

        const uploadResponse = await fetch(`${this.apiEndpoint}upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(`Error subiendo imagen (${uploadResponse.status}): ${errorData.error?.message || 'Upload failed'}`)
        }
        const uploadResult = await uploadResponse.json()
        if (!Array.isArray(uploadResult) || uploadResult.length === 0) {
          throw new Error('Respuesta de subida inválida o vacía.')
        }
        return uploadResult // Expecting [{ id, url, ... }]
      } catch (error) {
        console.error(`Error uploading image for invoice ${invoiceId}:`, error)
        this.$toast.error(`Error subiendo imagen Fac #${invoiceId}: ${error.message}`, { duration: 4000 })
        return null
      }
    },

    // --- Formatting Helpers ---
    formatCurrency (value) {
      if (typeof value !== 'number') { return 'N/A' }
      return `$${value.toLocaleString('es-CO')}`
    },
    formatDateTime (dateString) {
      if (!dateString) { return null }
      try {
        const date = new Date(dateString)
        return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
      } catch (e) {
        return dateString // Return original if parsing fails
      }
    },
    formatDateLong (date) {
      // Simplified version from process.vue
      if (!(date instanceof Date) || isNaN(date)) { return 'Fecha inválida' }
      const day = date.getDate()
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      const month = monthNames[date.getMonth()]
      const year = date.getFullYear()
      return `${day} de ${month} de ${year}`
    },
    getMonthName (monthValue) {
      // Simplified version from process.vue
      const monthNumber = parseInt(monthValue, 10)
      if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) { return 'Mes Inválido' }
      const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
      return monthNames[monthNumber - 1]
    },
    getWhatsappStatusText (status) {
      switch (status) {
        case 'SENT': return 'ENVIADO'
        case 'FAILED': return 'FALLIDO'
        case 'PENDING': return 'PENDIENTE'
        case null:
        case undefined:
          return 'PENDIENTE' // Treat null/undefined as PENDING
        default: return status // Show unknown status directly
      }
    },
    getWhatsappStatusColor (status) {
      switch (status) {
        case 'SENT': return 'success darken-1'
        case 'FAILED': return 'red darken-2'
        case 'PENDING': return 'cyan darken-3'
        case null:
        case undefined:
          return 'cyan darken-3' // Treat null/undefined as PENDING
        default: return 'grey' // Grey for unknown status
      }
    }
  }
}
</script>

  <style scoped>
  .v-chip {
    font-weight: bold;
  }
  /* Allow text truncation with ellipsis */
  .text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block; /* Or block depending on context */
    vertical-align: middle; /* Adjust alignment */
  }
  </style>
