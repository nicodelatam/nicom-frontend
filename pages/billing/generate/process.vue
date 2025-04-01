<template>
  <v-container>
    <v-card class="mb-4 rounded-xl elevation-0">
      <v-card-title class="text-center justify-center">
        <strong>Procesamiento</strong> - {{ stageTitle }}
      </v-card-title>
      <v-card-text>
        <!-- Generation Button -->
        <v-row>
          <v-col class="align-center d-flex">
            <v-btn
              color="primary"
              class="rounded-xl"
              block
              :loading="loadingGenerate"
              :disabled="loadingSend || isGenerationComplete"
              @click="generateBilling"
            >
              Generar Estados de Cuenta ({{ generationPendingCount }} restantes)
            </v-btn>
          </v-col>
        </v-row>

        <!-- Send Notifications Button -->
        <v-row>
          <v-col>
            <v-btn
              class="rounded-xl"
              color="cyan darken-1 text--white"
              block
              :loading="loadingSend"
              :disabled="loadingGenerate || !isGenerationComplete || sendPendingCount === 0"
              @click="sendNotifications"
            >
              <v-icon left>
                mdi-whatsapp
              </v-icon>
              Enviar Notificaciones ({{ sendPendingCount }} restantes)
            </v-btn>
          </v-col>
        </v-row>

        <!-- Summary Chips -->
        <v-row>
          <v-col>
            <v-chip v-if="processedItems.length > 0" class="ma-1" color="primary">
              Total: <strong class="ml-1">{{ processedItems.length }}</strong>
            </v-chip>
            <v-chip v-if="alreadyBilledCount > 0" class="ma-1" color="info">
              Preexistentes: <strong class="ml-1">{{ alreadyBilledCount }}</strong>
            </v-chip>
            <v-chip v-if="skippedNoOfferCount > 0" class="ma-1" color="blue-grey lighten-2">
              Sin Tarifa: <strong class="ml-1">{{ skippedNoOfferCount }}</strong>
            </v-chip>
            <v-chip v-if="generatedOkCount > 0" class="ma-1" color="success">
              Generadas OK: <strong class="ml-1">{{ generatedOkCount }}</strong>
            </v-chip>
            <v-chip v-if="generationErrorCount > 0" class="ma-1" color="error">
              Error Generación: <strong class="ml-1">{{ generationErrorCount }}</strong>
            </v-chip>
            <v-chip v-if="sentOkCount > 0" class="ma-1" color="success darken-1">
              Enviados OK: <strong class="ml-1">{{ sentOkCount }}</strong>
            </v-chip>
            <v-chip v-if="sendErrorCount > 0" class="ma-1" color="red darken-2">
              Error Envío: <strong class="ml-1">{{ sendErrorCount }}</strong>
            </v-chip>
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-row class="mt-2">
          <v-col>
            <div class="d-flex">
              <v-btn
                color="primary"
                class="mr-2"
                :disabled="loadingGenerate || loadingSend"
                @click="$router.push({ path: '/billing/generate/prepare', query: $route.query })"
              >
                <v-icon left>
                  mdi-arrow-left
                </v-icon>
                Regresar
              </v-btn>
              <v-btn
                color="success"
                :disabled="loadingGenerate || loadingSend"
                @click="exit"
              >
                Finalizar
                <v-icon right>
                  mdi-check
                </v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-card v-if="processedItems.length > 0" class="rounded-xl elevation-0">
      <v-card-title>
        Resumen de procesamiento
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="processedItems"
        :items-per-page="10"
        item-key="code"
        class="elevation-0"
      >
        <!-- Template for Generation Status -->
        <template v-slot:[`item.generationStatus`]="{ item }">
          <v-chip small :color="getGenerationStatusColor(item)" text-color="white">
            {{ getGenerationStatusText(item) }}
          </v-chip>
        </template>
        <!-- Template for Send Status -->
        <template v-slot:[`item.messageSent`]="{ item }">
          <v-chip small :color="getSendStatusColor(item)" text-color="white">
            {{ getSendStatusText(item) }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import html2canvas from 'html2canvas'

export default {
  middleware: 'authenticated',
  data () {
    return {
      loadingGenerate: false,
      loadingSend: false,
      isGenerationComplete: false, // Flag to indicate if generation process finished (or skipped)
      // Local state to track progress for each item selected in prepare.vue
      processedItems: [],
      // Headers for the summary table
      headers: [
        { text: 'Código', value: 'code', sortable: true },
        { text: 'Cliente', value: 'client_name', sortable: true },
        { text: 'Celular', value: 'phone', sortable: false },
        { text: 'Estado Generación', value: 'generationStatus', sortable: false },
        { text: 'Estado Envío WhatsApp', value: 'messageSent', sortable: false }
      ]
      // Note: Old counters like generatedBills, omitedBills, alreadyBilled, sendIndex are removed
      // They are replaced by computed properties based on 'processedItems'
    }
  },

  computed: {
    // --- Vuex Data ---
    selectedServicesFromStore () {
      return this.$store.state.billing.selectedServices
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
      // Ensure currentCompany is loaded, might need error handling or default
      return this.$store.state.company.currentCompany || {}
    },
    // --- Process Status & Counters ---
    stageTitle () {
      if (this.loadingGenerate) { return 'Generando Facturas...' }
      if (this.loadingSend) { return 'Enviando Notificaciones WhatsApp...' }
      if (!this.isGenerationComplete) { return 'Listo para Generar Facturas' }
      if (this.sendPendingCount > 0) { return 'Listo para Enviar Notificaciones' }
      return 'Proceso Completado'
    },
    alreadyBilledCount () {
      return this.processedItems.filter(item => item.existingInvoiceId && !item.generationError).length
    },
    skippedNoOfferCount () {
      return this.processedItems.filter(item => item.skippedNoOffer).length
    },
    generatedOkCount () {
      return this.processedItems.filter(item => item.invoiceId && !item.existingInvoiceId && !item.generationError).length
    },
    generationErrorCount () {
      return this.processedItems.filter(item => item.generationError).length
    },
    generationPendingCount () {
      return this.processedItems.filter(item => !item.existingInvoiceId && !item.invoiceId && !item.skippedNoOffer && !item.generationError).length
    },
    sentOkCount () {
      return this.processedItems.filter(item => item.messageSent === true).length
    },
    sendErrorCount () {
      return this.processedItems.filter(item => item.messageSent === false).length
    },
    sendPendingCount () {
      // Count items that have an invoice (generated or existing) and haven't been sent or failed sending yet
      return this.processedItems.filter(item =>
        (item.invoiceId || item.existingInvoiceId) && // Has an invoice
        !item.generationError &&
        item.messageSent === null
      ).length
    }
    // Note: sendIndex computed is removed, use sentOkCount or other counters
  },

  mounted () {
    // --- Initial Checks ---
    if (!this.month || !this.year || !this.limit) {
      this.$toast.error('Faltan datos de período (mes/año/límite). Regresando...', { duration: 4000 })
      this.$router.push('/billing/generate')
      return
    }
    if (!this.selectedServicesFromStore || this.selectedServicesFromStore.length === 0) {
      this.$toast.error('No hay servicios seleccionados para procesar. Regresando...', { duration: 4000 })
      this.$router.push('/billing/generate/prepare')
      return
    }
    if (!this.currentCompany || !this.currentCompany.id) {
      this.$toast.error('Información de la compañía no disponible.', { duration: 4000 })
      // Potentially block further actions or redirect
      return
    }

    // --- Initialize processedItems ---
    // Create a deep copy and add status fields
    this.processedItems = JSON.parse(JSON.stringify(this.selectedServicesFromStore)).map(service => ({
      ...service,
      invoiceId: service.existingInvoiceId || null, // Use existing ID if present
      invoiceData: null,
      generationError: false, // Flag for generation failure
      skippedNoOffer: false, // Flag for skipped due to missing offer
      messageSent: null // WhatsApp status: null (pending), true (sent), false (failed)
    }))

    // Check if generation should be skipped entirely (all items already have invoices)
    this.checkIfGenerationIsComplete()
  },

  methods: {
    // --- Status Helpers for Table Display ---
    getGenerationStatusText (item) {
      if (item.generationError) { return 'ERROR' }
      if (item.skippedNoOffer) { return 'SIN TARIFA' }
      if (item.existingInvoiceId) { return 'PREEXISTENTE' }
      if (item.invoiceId) { return 'GENERADA OK' }
      return 'PENDIENTE'
    },
    getGenerationStatusColor (item) {
      if (item.generationError) { return 'error' } // Red
      if (item.skippedNoOffer) { return 'blue-grey lighten-2' } // Greyish
      if (item.existingInvoiceId) { return 'info' } // Blue
      if (item.invoiceId) { return 'success' } // Green
      return 'grey' // Default grey for pending
    },
    getSendStatusText (item) {
      if (!item.invoiceId && !item.existingInvoiceId) { return 'N/A' } // Not applicable if no invoice
      if (item.generationError) { return 'N/A (Error Gen.)' }
      if (item.messageSent === true) { return 'ENVIADO OK' }
      if (item.messageSent === false) { return 'ERROR ENVÍO' }
      return 'PENDIENTE ENVÍO'
    },
    getSendStatusColor (item) {
      if ((!item.invoiceId && !item.existingInvoiceId) || item.generationError) { return 'grey lighten-2' } // N/A grey
      if (item.messageSent === true) { return 'success darken-1' } // Darker Green
      if (item.messageSent === false) { return 'red darken-2' } // Darker Red
      return 'cyan darken-3' // Default cyan for pending send
    },

    // --- Core Logic ---
    checkIfGenerationIsComplete () {
      // Generation is complete if every item either has an existing invoice,
      // has successfully generated an invoice, was skipped, or had an error.
      this.isGenerationComplete = this.processedItems.every(item =>
        item.existingInvoiceId || item.invoiceId || item.skippedNoOffer || item.generationError
      )
      if (this.isGenerationComplete && this.generationPendingCount === 0 && !this.loadingGenerate) {
        if (this.processedItems.length > 0) { // Avoid toast if nothing was processed
          this.$toast.info('Fase de generación de facturas completada (o no necesaria).', { duration: 4000 })
        }
      }
    },

    async generateBilling () {
      this.loadingGenerate = true
      this.$toast.info(`Iniciando generación para ${this.generationPendingCount} servicios...`, { duration: 4000 })

      let generatedCount = 0
      let errorCount = 0
      let skippedCount = 0

      for (const item of this.processedItems) {
        // Skip if already processed in this run or pre-existing
        if (item.invoiceId || item.skippedNoOffer || item.generationError) {
          continue
        }

        // 1. Check for Offer
        if (!item.offer || !item.offer.id || !item.offer.price) {
          this.$toast.error(`Servicio ${item.code} (${item.client_name}) omitido: Sin tarifa asignada.`, { duration: 4000 })
          item.skippedNoOffer = true
          skippedCount++
          continue // Skip this item
        }

        // 2. Skip if Already Billed (Redundant check based on prepare.vue logic, but safe)
        // This uses the 'existingInvoiceId' added in prepare.vue or initial mount
        if (item.existingInvoiceId) {
          // This case should ideally not be hit if the first 'if' handles it,
          // but kept for robustness.
          this.$toast.info(`Servicio ${item.code} (${item.client_name}): Factura ya existe (ID: ${item.existingInvoiceId}).`, { duration: 4000 })
          item.invoiceId = item.existingInvoiceId // Ensure invoiceId is set
          // Pre-existing invoices don't count towards 'generatedCount' here
          continue
        }

        // 3. Process Balances in Favor (assuming this still happens before regular invoice)
        // TODO: Re-integrate balance processing if needed, ensuring it updates item status
        // const hasBalancesInFavor = await this.processBalancesInFavor(item)
        // if (hasBalancesInFavor) {
        //   this.$toast.success(`Saldo a favor aplicado para ${item.code}`)
        //   item.invoiceId = ??? // Need the ID from balance processing logic
        //   item.invoiceData = ??? // Need the invoice data
        //   generatedCount++
        //   continue
        // }

        // 4. Create New Invoice
        const newInvoiceData = {
          data: { // Strapi v4 payload structure
            balance: item.offer.price,
            value: item.offer.price,
            month: this.month.value,
            year: this.year,
            type: 'FACTURA',
            offer: item.offer.id,
            concept: 'FACTURACION MENSUAL',
            details: this.month.text, // Make sure 'text' exists on month object
            payed: false,
            partial: false,
            indebt: false,
            service: item.id,
            invoice_type: 1, // Assuming 'FACTURACION MENSUAL' type has ID 1
            limit: this.limit,
            company: this.currentCompany.id // Link to company
          }
        }

        try {
          const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.$store.state.auth.token}`
            },
            body: JSON.stringify(newInvoiceData)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Failed to create invoice'}`)
          }

          const { data: createdInvoice } = await response.json()

          if (!createdInvoice || !createdInvoice.id) {
            throw new Error('Invoice created but no ID returned.')
          }

          this.$toast.success(`Factura #${createdInvoice.id} creada para ${item.code} (${item.client_name}).`, { duration: 4000 })
          item.invoiceId = createdInvoice.id
          item.invoiceData = createdInvoice // Store the created invoice data
          generatedCount++

          // --- Post-Invoice Creation Steps (Sync) ---
          // These were previously inside the loop but might be better here or batched

          // a) Update Billing Period (Run synchronously for now)
          try {
            await this.$store.dispatch('billing/updateBillingPeriod', {
              token: this.$store.state.auth.token,
              service: item, // Pass the whole service item
              billingmonth: this.month.value,
              billingyear: this.year
            })
          } catch (updateError) {
            console.error(`Error updating billing period for ${item.code}:`, updateError)
            this.$toast.error(`No se pudo actualizar período de facturación para ${item.code}.`, { duration: 4000 })
            // Continue even if this fails
          }

          // b) Create Legal Note (Run synchronously for now)
          // TODO: Review if this is still necessary or handled differently
          // try {
          //     const legalNote = {
          //       city: this.$route.query.city,
          //       clienttype: this.$route.query.clienttype,
          //       token: this.$store.state.auth.token,
          //       biller: this.$store.state.auth, // Assuming auth object is sufficient
          //       service: parseInt(item.id),
          //       debit: item.offer.price,
          //       credit: 0,
          //       concept: 'FACTURACION MENSUAL',
          //       company: this.currentCompany.id // Link company
          //     }
          //     await this.$store.dispatch('billing/createLegalNote', legalNote)
          // } catch (legalNoteError) {
          //      console.error(`Error creating legal note for ${item.code}:`, legalNoteError)
          //      this.$toast.error(`No se pudo crear nota legal para ${item.code}.`, { duration: 4000 })
          //      // Continue even if this fails
          // }

          // c) Update Service Balance (Run synchronously for now)
          // TODO: Review if balance update is still needed here
          // try {
          //    await this.$store.dispatch('billing/updateServiceBalance', {
          //       balance: (item.balance || 0) + item.offer.price, // Ensure item.balance exists
          //       serviceId: item.id,
          //       token: this.$store.state.auth.token
          //    })
          // } catch (balanceError) {
          //     console.error(`Error updating service balance for ${item.code}:`, balanceError)
          //     this.$toast.error(`No se pudo actualizar saldo para ${item.code}.`, { duration: 4000 })
          //     // Continue even if this fails
          // }
        } catch (error) {
          console.error(`Error creating invoice for service ${item.code}:`, error)
          this.$toast.error(`Error al crear factura para ${item.code} (${item.client_name}): ${error.message}`, { duration: 4000 })
          item.generationError = true
          errorCount++
        }
      } // End of loop

      this.loadingGenerate = false
      this.$toast.success(`Proceso de generación finalizado. OK: ${generatedCount}, Errores: ${errorCount}, Omitidos (Sin Tarifa): ${skippedCount}, Preexistentes: ${this.alreadyBilledCount}.`, { duration: 4000 })
      this.checkIfGenerationIsComplete() // Update completion status
    },

    async fetchInvoiceDataIfNeeded (item) {
      // If invoice data isn't already on the item (e.g., for pre-existing), fetch it.
      if (!item.invoiceData && item.invoiceId) {
        this.$toast.info(`Cargando datos de factura #${item.invoiceId} para envío...`, { duration: 4000 })
        try {
          // Adjust endpoint and parameters as needed, add populate=* if necessary
          const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${item.invoiceId}?populate=*`, {
            headers: { Authorization: `Bearer ${this.$store.state.auth.token}` }
          })
          if (!response.ok) { throw new Error(`API Error (${response.status})`) }
          const { data } = await response.json()
          if (!data) { throw new Error('Invoice data not found.') }
          item.invoiceData = data // Store fetched data
          return true
        } catch (error) {
          console.error(`Error fetching invoice data for ${item.invoiceId}:`, error)
          this.$toast.error(`Error cargando datos para factura ${item.invoiceId}: ${error.message}`, { duration: 4000 })
          item.messageSent = false // Mark as failed since we can't proceed
          return false
        }
      }
      // If invoiceData already exists or no invoiceId, return true (or based on logic)
      return !!item.invoiceData
    },

    async sendNotifications () {
      this.loadingSend = true
      this.$toast.info(`Iniciando envío de WhatsApp para ${this.sendPendingCount} facturas...`, { duration: 4000 })

      const metaServicesInfo = await this.getMetaServicesConfig()
      if (!metaServicesInfo) {
        this.loadingSend = false
        this.$toast.error('Error crítico: Configuración de Meta (WhatsApp) no encontrada. No se pueden enviar mensajes.', { duration: 5000 })
        return
      }

      let sentCount = 0
      let errorCount = 0

      for (const item of this.processedItems) {
        // Skip if not applicable, already sent, or failed
        if (item.messageSent !== null || !item.invoiceId || item.generationError || item.skippedNoOffer) {
          continue
        }

        // Ensure we have the invoice data needed for the image/message
        const hasInvoiceData = await this.fetchInvoiceDataIfNeeded(item)
        if (!hasInvoiceData) {
          // fetchInvoiceDataIfNeeded sets messageSent = false and shows toast
          errorCount++
          continue // Skip to next item
        }

        // Prepare data for sending
        const serviceData = item // The item itself is the service data
        const invoiceData = item.invoiceData // Use the stored/fetched invoice data

        try {
          // 1. Generate Image (if template exists and upload is needed)
          // Assuming generateImageFromBill uploads and returns the Strapi file object/info
          // Or modifies the invoiceData object with image info
          // We might need to adapt this depending on how generateImageFromBill works
          let imageInfo = null
          if (this.currentCompany.meta_template) { // Check if template-based image generation is configured
            this.$toast.info(`Generando imagen para factura #${invoiceData.id}...`, { duration: 4000 })
            imageInfo = await this.generateImageFromBill(invoiceData, serviceData) // Pass full invoice and service
            if (!imageInfo || !imageInfo[0]?.url) { // Check the expected structure of imageInfo
              this.$toast.error(`No se pudo generar/subir imagen para factura ${invoiceData.id}, se enviará sin imagen.`, { duration: 4000 })
              // imageInfo = null; // Ensure it's null if failed
            } else {
              this.$toast.success(`Imagen generada para factura #${invoiceData.id}`, { duration: 4000 })
            }
          }

          // 2. Send WhatsApp Notification via Vuex action
          this.$toast.info(`Enviando WhatsApp para ${serviceData.code} (${serviceData.client_name})...`, { duration: 4000 })
          // Use the store action, passing necessary info
          // The action should handle constructing the message based on template/image
          const whatsappResponse = await this.$store.dispatch('notification/sendWhatsapp', {
            service: serviceData,
            invoice: invoiceData, // Pass the full invoice data
            month: this.month, // Pass month object if needed by template
            year: this.year,
            token: this.$store.state.auth.token,
            metaServicesInfo,
            // Pass image URL if available and generated successfully
            imgPath: imageInfo && imageInfo[0] ? `${this.$config.CDN_STRAPI_ENDPOINT}${imageInfo[0].url}` : null
          })

          // 3. Check Response (using the success example structure)
          // Adjust based on the actual response structure of sendWhatsapp action
          if (whatsappResponse && whatsappResponse.messages && whatsappResponse.messages[0]?.id) {
            this.$toast.success(`WhatsApp enviado a ${serviceData.phone} para Factura #${invoiceData.id}.`, { duration: 4000 })
            item.messageSent = true
            sentCount++

            // Optional: Update invoice status in Strapi to mark as notified
            await this.updateInvoiceWhatsappStatus(item.invoiceId, 'SENT')
          } else {
            // Inferring failure if success structure not matched
            const failureReason = whatsappResponse?.error?.message || 'Respuesta inválida o rechazada por API Meta.'
            throw new Error(failureReason) // Throw to be caught below
          }
        } catch (error) {
          console.error(`Error sending WhatsApp for invoice ${item.invoiceId}:`, error)
          this.$toast.error(`Error WhatsApp Fac #${item.invoiceId} (${item.code}): ${error.message}`, { duration: 4000 })
          item.messageSent = false
          errorCount++
          // Optional: Update invoice status in Strapi to mark as failed notification
          await this.updateInvoiceWhatsappStatus(item.invoiceId, 'FAILED', error.message)
        }
      } // End of loop

      this.loadingSend = false
      this.$toast.success(`Proceso de envío finalizado. Enviados OK: ${sentCount}, Errores: ${errorCount}.`, { duration: 4000 })
      // Update generation complete status again in case it affects display/buttons
      this.checkIfGenerationIsComplete()
    },

    // --- Method to Update Invoice Status in Strapi ---
    async updateInvoiceWhatsappStatus (invoiceId, status, errorMessage = null) {
      if (!invoiceId) {
        console.error('Cannot update WhatsApp status: Invoice ID is missing.')
        return
      }

      const payload = {
        data: {
          whatsapp_status: status,
          whatsapp_attempted_at: new Date().toISOString(),
          whatsapp_error_message: errorMessage
        }
      }

      try {
        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${invoiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Failed to update invoice status'}`)
        }

        this.$toast.info(`Estado WhatsApp actualizado a ${status} para Factura #${invoiceId}.`, { duration: 2000 }) // Shorter duration for status updates
      } catch (error) {
        console.error(`Error updating WhatsApp status for invoice ${invoiceId}:`, error)
        this.$toast.error(`Error al actualizar estado WhatsApp Fac #${invoiceId}: ${error.message}`, { duration: 4000 })
        // Decide if we need to retry this update or just log it
      }
    },

    // --- API Call Helpers (Example: Fetch Meta Config) ---
    async getMetaServicesConfig () {
      // Use currentCompany data if already loaded and sufficient
      const company = this.currentCompany
      if (company && company.meta_token && company.meta_endpoint && company.meta_template) {
        this.$toast.info('Configuración Meta (WhatsApp) cargada.', { duration: 4000 })
        return {
          meta_token: company.meta_token,
          meta_template: company.meta_template,
          meta_endpoint: company.meta_endpoint
        }
      } else {
        // Attempt to fetch if missing (optional, depends on app flow)
        this.$toast.error('Configuración Meta incompleta o no cargada, intentando recargar...', { duration: 4000 })
        try {
          // Assuming a Vuex action exists to fetch company details
          await this.$store.dispatch('company/fetchCompanyDetails', this.currentCompany.id)
          const updatedCompany = this.$store.state.company.currentCompany
          if (updatedCompany && updatedCompany.meta_token && updatedCompany.meta_endpoint) {
            this.$toast.success('Configuración Meta recargada exitosamente.', { duration: 4000 })
            return {
              meta_token: updatedCompany.meta_token,
              meta_template: updatedCompany.meta_template,
              meta_endpoint: updatedCompany.meta_endpoint
            }
          } else {
            throw new Error('Configuración Meta sigue incompleta después de recargar.')
          }
        } catch (error) {
          console.error('Error fetching Meta config:', error)
          this.$toast.error(`Error cargando configuración Meta: ${error.message}`, { duration: 4000 })
          return null // Indicate failure
        }
      }
    },

    // --- Image Generation & Upload (Existing Methods - Review Needed) ---
    // Ensure these methods handle errors gracefully and return useful info
    // Ensure they use the correct Strapi endpoint and auth
    async generateImageFromBill (invoice, service) {
      try {
        // Obtener datos del servicio y oferta desde el objeto invoice
        const offer = service.offer

        // Cargar la plantilla HTML
        const response = await fetch('/templates/invoice.html')
        const templateHtml = await response.text()

        // Formatear fechas
        const today = new Date()
        const limitDate = new Date(invoice.limit)

        // Formato de fecha en español con el día del mes, mes en palabras y año
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

        const paymentConcept = `Pago Mes ${this.getMonthName(invoice.month)} $${invoice.value.toLocaleString('es-CO')} pesos`
        const currentDateTime = new Date().toLocaleString('es-ES')

        // Crear un contenedor temporal para el HTML
        const tempContainer = document.createElement('div')
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '-9999px'
        tempContainer.innerHTML = templateHtml
        document.body.appendChild(tempContainer)

        // Obtener referencias a los elementos por ID basados en la nueva estructura HTML
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

        // Establecer valores en los elementos según la nueva estructura
        if (numeroReciboEl) { numeroReciboEl.textContent = invoice.id.toString() }
        if (codigoUsuarioEl) { codigoUsuarioEl.textContent = service.code }

        const company = this.currentCompany
        if (idEmpresaEl) { idEmpresaEl.textContent = company.nit || 'N/A' }
        if (direccionSucursalEl) { direccionSucursalEl.textContent = company.address || 'N/A' }

        // Configurar el logo de la empresa con el CDN de Strapi
        if (logoImgEl && company.logo && company.logo.url) {
          const cdnUrl = company.logo.url.startsWith('http')
            ? company.logo.url
            : `${this.$config.CDN_STRAPI_ENDPOINT}${company.logo.url}`
          logoImgEl.src = cdnUrl
          logoImgEl.alt = company.name
        }

        if (nombreClienteEl) { nombreClienteEl.textContent = service.client_name }
        if (documentoClienteEl) { documentoClienteEl.textContent = service.dni || 'N/A' }
        if (servicioClienteEl) { servicioClienteEl.textContent = offer.name }
        if (planContratadoEl) { planContratadoEl.textContent = offer.name }

        if (direccionClienteEl) { direccionClienteEl.textContent = service.address || 'N/A' }
        if (barrioClienteEl) { barrioClienteEl.textContent = service.neighborhood || 'N/A' }
        if (idUsuarioEl) { idUsuarioEl.textContent = `CÓDIGO: ${service.code}` }
        if (celularClienteEl) { celularClienteEl.textContent = service.phone || 'N/A' }
        if (emailClienteEl) { emailClienteEl.textContent = service.email || 'N/A' }

        // Agregar línea de atención con el teléfono de la empresa
        if (lineaAtencionEl && lineaAtencionEl.parentNode) {
          lineaAtencionEl.parentNode.innerHTML = `<strong>LÍNEA DE ATENCIÓN:</strong> ${company.phone || '3219121937'}`
        }

        // Asignar fechas de emisión y límite con el nuevo formato
        if (fechaEmisionEl) { fechaEmisionEl.textContent = emissionDateFormatted }
        if (fechaLimiteEl) { fechaLimiteEl.textContent = limitDateFormatted }

        if (conceptoPagoEl) { conceptoPagoEl.textContent = paymentConcept }
        if (fechaPagoEl) { fechaPagoEl.textContent = currentDateTime }

        // Estado de pago y clase correspondiente
        const estadoTexto = invoice.payed ? 'PAGADO' : (invoice.partial ? 'ABONADO' : 'PENDIENTE')
        if (estadoPagoEl) {
          estadoPagoEl.textContent = estadoTexto

          // Cambiar los estilos según el estado
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

        // Mostrar el saldo pendiente
        if (totalPendienteEl) {
          totalPendienteEl.textContent = `TOTAL PENDIENTE POR PAGAR: $${invoice.balance.toLocaleString('es-CO')} pesos`
        }

        if (emailEmpresaEl) { emailEmpresaEl.textContent = company.email || 'N/A' }

        // Renderizar el HTML a imagen con html2canvas
        const element = tempContainer.querySelector('.factura-container')

        // Esperar a que las imágenes se carguen completamente
        const imageElements = tempContainer.querySelectorAll('img')
        await Promise.all(Array.from(imageElements).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve()
            } else {
              img.onload = resolve
              img.onerror = () => {
                console.warn(`Error loading image: ${img.src}`)
                resolve()
              }
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

        // Convertir a imagen
        const imgData = canvas.toDataURL('image/jpeg', 0.95)

        // Eliminar el contenedor temporal
        document.body.removeChild(tempContainer)

        // Crear nombre único para el archivo
        const fileName = `recibo-${service.code}-${invoice.month}-${invoice.year}.jpg`

        // Subir la imagen al servidor
        return await this.uploadInvoiceImage(imgData, invoice.id, fileName)
      } catch (error) {
        console.error('Error generando imagen de factura:', error)
        this.$toast.error('Error al generar imagen de factura', { duration: 4000 })
        return null
      }
    },

    getMonthName (month) {
      const monthNames = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
      ]
      return monthNames[month - 1]
    },

    async uploadInvoiceImage (imageData, invoiceId, fileName) {
      try {
        // Convertir la imagen base64 a un blob
        const fetchResponse = await fetch(imageData)
        const blob = await fetchResponse.blob()

        // Crear un objeto FormData para enviar al servidor
        const formData = new FormData()
        formData.append('files', blob, fileName)
        formData.append('ref', 'api::invoice.invoice')
        formData.append('refId', invoiceId)
        formData.append('field', 'image')

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
        this.$toast.error(`Error al subir imagen para Factura #${invoiceId}: ${error.message}`, { duration: 4000 })
        return null
      }
    },

    exit () {
      this.$store.commit('billing/resetState') // Optional: Reset Vuex state on exit
      this.$router.push('/client') // Or appropriate dashboard/list page
    }
  }
}
</script>

<style scoped>
/* Add styles if needed, e.g., for chips */
.v-chip {
  font-weight: bold;
}
</style>
