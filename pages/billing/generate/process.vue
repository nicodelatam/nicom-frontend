<template>
  <v-container>
    <v-card class="mb-4 rounded-xl elevation-0">
      <v-card-title class="text-center justify-center">
        Procesamiento - {{ stageTitle }}
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
                color="orange darken-2"
                class="mr-2"
                :loading="loadingGenerateImages"
                :disabled="loadingGenerate || loadingSend || !month || !year"
                @click="generateMissingImages"
              >
                <v-icon left>
                  mdi-image-plus
                </v-icon>
                Generar Imágenes Faltantes
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

        <!-- Progress Console -->
        <v-row class="mt-4">
          <v-col>
            <v-card outlined>
              <v-card-title class="d-flex align-center py-2">
                <v-icon left color="blue darken-2">
                  mdi-console
                </v-icon>
                <span class="subtitle-1">Consola de Progreso</span>
                <v-spacer />
                <v-btn
                  small
                  outlined
                  color="grey darken-1"
                  @click="clearConsole"
                >
                  <v-icon small left>
                    mdi-delete-sweep
                  </v-icon>
                  Limpiar
                </v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <div
                  ref="consoleContainer"
                  class="console-container"
                  style="height: 300px; overflow-y: auto; background-color: #1e1e1e; color: #ffffff; font-family: 'Courier New', monospace; font-size: 13px;"
                >
                  <div
                    v-for="(log, index) in consoleLogs"
                    :key="index"
                    class="console-line"
                    :class="`console-${log.type}`"
                    style="padding: 4px 12px; border-left: 3px solid transparent;"
                  >
                    <span class="console-timestamp" style="color: #888; margin-right: 8px;">
                      {{ log.timestamp }}
                    </span>
                    <span class="console-message">{{ log.message }}</span>
                  </div>
                  <div v-if="consoleLogs.length === 0" class="console-empty" style="padding: 20px; text-align: center; color: #666;">
                    La consola está vacía. Los mensajes de progreso aparecerán aquí...
                  </div>
                </div>
              </v-card-text>
            </v-card>
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
        <!-- Template for Image Status -->
        <template v-slot:[`item.imageStatus`]="{ item }">
          <v-chip small :color="getImageStatusColor(item)" text-color="white">
            <v-icon small left>
              {{ getImageStatusIcon(item) }}
            </v-icon>
            {{ getImageStatusText(item) }}
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
      loadingGenerateImages: false,
      isGenerationComplete: false, // Flag to indicate if generation process finished (or skipped)
      // Local state to track progress for each item selected in prepare.vue
      processedItems: [],
      // Headers for the summary table
      headers: [
        { text: 'Código', value: 'code', sortable: true },
        { text: 'Cliente', value: 'client_name', sortable: true },
        { text: 'Celular', value: 'phone', sortable: false },
        { text: 'Estado Generación', value: 'generationStatus', sortable: false },
        { text: 'Estado Envío WhatsApp', value: 'messageSent', sortable: false },
        { text: 'Estado Imagen', value: 'imageStatus', sortable: false }
      ],
      consoleLogs: []
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
      this.logError('Faltan datos de período (mes/año/límite). Regresando...')
      this.$router.push('/billing/generate')
      return
    }
    if (!this.selectedServicesFromStore || this.selectedServicesFromStore.length === 0) {
      this.logError('No hay servicios seleccionados para procesar. Regresando...')
      this.$router.push('/billing/generate/prepare')
      return
    }
    if (!this.currentCompany || !this.currentCompany.id) {
      this.logError('Información de la compañía no disponible.')
      // Potentially block further actions or redirect
      return
    }

    this.logInfo(`Iniciando procesamiento para ${this.selectedServicesFromStore.length} servicios del período ${this.month.text} ${this.year}`)

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

    // --- Image Status Helpers ---
    getImageStatusColor (item) {
      const hasImage = this.hasInvoiceImage(item)
      if (!item.invoiceId && !item.existingInvoiceId) {
        return 'grey lighten-2' // No tiene factura
      }
      if (item.generationError || item.skippedNoOffer) {
        return 'grey lighten-2' // N/A
      }
      return hasImage ? 'success' : 'orange darken-2'
    },

    getImageStatusIcon (item) {
      const hasImage = this.hasInvoiceImage(item)
      if (!item.invoiceId && !item.existingInvoiceId) {
        return 'mdi-minus-circle' // No aplica
      }
      if (item.generationError || item.skippedNoOffer) {
        return 'mdi-minus-circle' // N/A
      }
      return hasImage ? 'mdi-check-circle' : 'mdi-alert-circle'
    },

    getImageStatusText (item) {
      const hasImage = this.hasInvoiceImage(item)
      if (!item.invoiceId && !item.existingInvoiceId) {
        return 'N/A' // No tiene factura
      }
      if (item.generationError || item.skippedNoOffer) {
        return 'N/A' // No aplica
      }
      return hasImage ? 'CON IMAGEN' : 'SIN IMAGEN'
    },

    hasInvoiceImage (item) {
      // Si no tiene factura, retorna false
      if (!item.invoiceId && !item.existingInvoiceId) {
        return false
      }

      // Si ya tenemos los datos de la factura y tiene imagen
      if (item.invoiceData && item.invoiceData.image && item.invoiceData.image.url) {
        return true
      }

      // Para facturas preexistentes, verificar si tiene imagen
      if (item.existingInvoiceId && item.invoices) {
        const existingInvoice = item.invoices.find(inv => inv.id === item.existingInvoiceId)
        return existingInvoice && existingInvoice.image && existingInvoice.image.url
      }

      // Por defecto, asumir que no tiene imagen si no se puede verificar
      return false
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
          this.logInfo('Fase de generación de facturas completada (o no necesaria).')
        }
      }
    },

    async generateBilling () {
      this.loadingGenerate = true
      this.logInfo(`Iniciando generación para ${this.generationPendingCount} servicios...`)

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
          this.logError(`Servicio ${item.code} (${item.client_name}) omitido: Sin tarifa asignada.`)
          item.skippedNoOffer = true
          skippedCount++
          continue // Skip this item
        }

        // 2. Skip if Already Billed (Redundant check based on prepare.vue logic, but safe)
        // This uses the 'existingInvoiceId' added in prepare.vue or initial mount
        if (item.existingInvoiceId) {
          // This case should ideally not be hit if the first 'if' handles it,
          // but kept for robustness.
          this.logInfo(`Servicio ${item.code} (${item.client_name}): Factura ya existe (ID: ${item.existingInvoiceId}).`)
          item.invoiceId = item.existingInvoiceId // Ensure invoiceId is set
          // Pre-existing invoices don't count towards 'generatedCount' here
          continue
        }

        // 3. Process Balances in Favor (Re-integrated)
        try {
          const createdInvoiceId = await this.processBalancesInFavor(item)
          if (createdInvoiceId) {
            this.logSuccess(`Saldo a favor aplicado para ${item.code}. Factura #${createdInvoiceId} generada.`)
            // Set the actual invoice ID returned from the balance process
            item.invoiceId = createdInvoiceId
            item.invoiceData = { id: createdInvoiceId, payed: true } // Simplified data for now
            generatedCount++ // Count this as a generated invoice
            continue // Skip regular invoice creation
          }
        } catch (balanceError) {
          console.error(`Error processing balance in favor for ${item.code}:`, balanceError)
          this.logError(`Error procesando saldo a favor para ${item.code}: ${balanceError.message}`)
          // Decide if we should stop or continue with regular invoice? For now, let's skip generation if balance check failed.
          item.generationError = true // Mark as error for this item
          errorCount++
          continue
        }

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

          this.logSuccess(`Factura #${createdInvoice.id} creada para ${item.code} (${item.client_name}).`)
          item.invoiceId = createdInvoice.id
          item.invoiceData = createdInvoice // Store the created invoice data
          generatedCount++

          // --- Generate Image for Invoice (NEW) ---
          // Generate image immediately after creating the invoice
          try {
            if (this.currentCompany.meta_template) {
              const imageInfo = await this.generateImageFromBill(createdInvoice, item)
              if (imageInfo && imageInfo[0]?.url) {
                this.logSuccess(`Imagen generada para factura #${createdInvoice.id}`)
                // Update the invoice data with the generated image
                if (item.invoiceData) {
                  item.invoiceData.image = imageInfo[0]
                } else {
                  item.invoiceData = { ...createdInvoice, image: imageInfo[0] }
                }
              }
            }
          } catch (imageError) {
            console.error(`Error generating image for invoice ${createdInvoice.id}:`, imageError)
            // Continue processing even if image generation fails
          }

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
            this.logError(`No se pudo actualizar período de facturación para ${item.code}.`)
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
          //      this.logError(`No se pudo crear nota legal para ${item.code}.`)
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
          //     this.logError(`No se pudo actualizar saldo para ${item.code}.`)
          //     // Continue even if this fails
          // }
        } catch (error) {
          console.error(`Error creating invoice for service ${item.code}:`, error)
          this.logError(`Error al crear factura para ${item.code} (${item.client_name}): ${error.message}`)
          item.generationError = true
          errorCount++
        }
      } // End of loop

      this.loadingGenerate = false
      this.logSuccess(`Proceso de generación finalizado. OK: ${generatedCount}, Errores: ${errorCount}, Omitidos (Sin Tarifa): ${skippedCount}, Preexistentes: ${this.alreadyBilledCount}.`)
      this.checkIfGenerationIsComplete() // Update completion status
    },

    async fetchInvoiceDataIfNeeded (item) {
      // If invoice data isn't already on the item (e.g., for pre-existing), fetch it.
      if (!item.invoiceData && item.invoiceId) {
        this.logInfo(`Cargando datos de factura #${item.invoiceId} para envío...`)
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
          this.logError(`Error cargando datos para factura ${item.invoiceId}: ${error.message}`)
          item.messageSent = false // Mark as failed since we can't proceed
          return false
        }
      }
      // If invoiceData already exists or no invoiceId, return true (or based on logic)
      return !!item.invoiceData
    },

    async sendNotifications () {
      this.loadingSend = true
      this.logInfo(`Iniciando envío de WhatsApp para ${this.sendPendingCount} facturas...`)

      const metaServicesInfo = await this.getMetaServicesConfig()
      if (!metaServicesInfo) {
        this.loadingSend = false
        this.logError('Error crítico: Configuración de Meta (WhatsApp) no encontrada. No se pueden enviar mensajes.')
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
            imageInfo = await this.generateImageFromBill(invoiceData, serviceData) // Pass full invoice and service
            if (!imageInfo || !imageInfo[0]?.url) { // Check the expected structure of imageInfo
              this.logError(`No se pudo generar/subir imagen para factura ${invoiceData.id}, se enviará sin imagen.`)
              // imageInfo = null; // Ensure it's null if failed
            } else {
              this.logSuccess(`Imagen generada para factura #${invoiceData.id}`)
            }
          }

          // 2. Send WhatsApp Notification via Vuex action
          this.logInfo(`Enviando WhatsApp para ${serviceData.code} (${serviceData.client_name}) con fecha límite: ${this.limit}`)
          // Use the store action, passing necessary info
          // The action should handle constructing the message based on template/image
          const whatsappResponse = await this.$store.dispatch('notification/sendWhatsapp', {
            service: serviceData,
            invoice: invoiceData, // Pass the full invoice data
            month: this.month, // Pass month object if needed by template
            year: this.year,
            limit: this.limit, // Pass the limit date
            token: this.$store.state.auth.token,
            metaServicesInfo,
            // Pass image URL if available and generated successfully
            imgPath: imageInfo && imageInfo[0] ? `${this.$config.CDN_STRAPI_ENDPOINT}${imageInfo[0].url}` : null
          })

          // 3. Check Response (using the success example structure)
          // Adjust based on the actual response structure of sendWhatsapp action
          if (whatsappResponse && whatsappResponse.messages && whatsappResponse.messages[0]?.id) {
            this.logSuccess(`WhatsApp enviado a ${serviceData.phone} para Factura #${invoiceData.id}.`)
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
          this.logError(`Error WhatsApp Fac #${item.invoiceId} (${item.code}): ${error.message}`)
          item.messageSent = false
          errorCount++
          // Optional: Update invoice status in Strapi to mark as failed notification
          await this.updateInvoiceWhatsappStatus(item.invoiceId, 'FAILED', error.message)
        }
      } // End of loop

      this.loadingSend = false
      this.logSuccess(`Proceso de envío finalizado. Enviados OK: ${sentCount}, Errores: ${errorCount}.`)
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

        this.logInfo(`Estado WhatsApp actualizado a ${status} para Factura #${invoiceId}.`) // Shorter duration for status updates
      } catch (error) {
        console.error(`Error updating WhatsApp status for invoice ${invoiceId}:`, error)
        this.logError(`Error al actualizar estado WhatsApp Fac #${invoiceId}: ${error.message}`)
        // Decide if we need to retry this update or just log it
      }
    },

    // --- API Call Helpers (Example: Fetch Meta Config) ---
    async getMetaServicesConfig () {
      // Use currentCompany data if already loaded and sufficient
      const company = this.currentCompany
      if (company && company.meta_token && company.meta_endpoint) { // meta_template is checked later when needed
        this.logInfo('Configuración Meta (WhatsApp) cargada.')
        return {
          meta_token: company.meta_token,
          meta_template: company.meta_template,
          meta_endpoint: company.meta_endpoint
        }
      } else {
        // Attempt to fetch if missing (optional, depends on app flow)
        this.logError('Configuración Meta incompleta o no cargada, intentando recargar...')
        try {
          // Assuming a Vuex action exists to fetch company details
          await this.$store.dispatch('company/fetchCompanyDetails', this.currentCompany.id)
          const updatedCompany = this.$store.state.company.currentCompany
          if (updatedCompany && updatedCompany.meta_token && updatedCompany.meta_endpoint) {
            this.logSuccess('Configuración Meta recargada exitosamente.')
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
          this.logError(`Error cargando configuración Meta: ${error.message}`)
          return null // Indicate failure
        }
      }
    },

    // --- Balance Processing Methods (Re-integrated) ---
    async getBalancesInFavor (serviceId) {
      // REVIEW: Ensure this dispatch/action handles Strapi v4 API/responses
      return await this.$store.dispatch('billing/getBalancesInFavor', {
        token: this.$store.state.auth.token,
        serviceId
      })
    },

    async applyBalanceInFavorToInvoiceAndCreateLegalNote (activeService, infavor) {
      // REVIEW: Ensure all dispatch calls within this method handle Strapi v4 data structures
      // e.g., wrapping request bodies in { data: { ... } }

      const invoicePrice = activeService.offer.price
      const balanceInFavor = infavor.balance
      let balanceToApply = 0
      let balanceLeft = 0

      let createdInvoice = null // To store the ID of the created invoice

      try {
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
            token: this.$store.state.auth.token,
            company: this.currentCompany.id // Ensure company is linked
          })
          createdInvoice = recentInvoice

          // --- Generate Image for Balance Invoice (NEW) ---
          // Generate image immediately after creating the invoice via balance
          try {
            if (this.currentCompany.meta_template) {
              const imageInfo = await this.generateImageFromBill(createdInvoice, activeService)
              if (imageInfo && imageInfo[0]?.url) {
                this.logSuccess(`Imagen generada para factura con saldo a favor #${createdInvoice.id}`)
                // Update the created invoice with image info
                createdInvoice.image = imageInfo[0]
              }
            }
          } catch (imageError) {
            console.error(`Error generating image for balance invoice ${createdInvoice.id}:`, imageError)
            // Continue processing even if image generation fails
          }

          const legalNote = {
            city: this.$route.query.city,
            clienttype: this.$route.query.clienttype,
            token: this.$store.state.auth.token,
            biller: this.$store.state.auth,
            service: activeService.id,
            concept: 'APLICA SALDO A FAVOR',
            debit: 0,
            credit: balanceToApply,
            connect: true,
            invoices: [createdInvoice],
            company: this.currentCompany.id // Link company if needed by action
          }
          const legalNoteRes = await this.$store.dispatch('billing/createLegalNote', legalNote)
          if (!legalNoteRes) {
            // Use throw new Error for consistency
            throw new Error('Error creando la nota legal (saldo a favor).')
          }

          // REVIEW: Ensure createInvoiceMovement action uses { data: { ... } }
          await this.$store.dispatch('billing/createInvoiceMovement', {
            token: this.$store.state.auth.token,
            biller: this.$store.state.auth,
            invoice: createdInvoice,
            type: 'ADELANTO',
            concept: this.month.text,
            amount: balanceToApply, // Amount applied
            details: 'APLICA SALDO A FAVOR',
            legal_note: legalNoteRes.id // Ensure field name is correct
          })

          await this.$store.dispatch('billing/updateInvoice', {
            token: this.$store.state.auth.token,
            invoice: infavor,
            payed: balanceLeft === 0,
            balance: balanceLeft
          })
        } else { // balanceInFavor < invoicePrice
          balanceToApply = balanceInFavor
          balanceLeft = 0

          // REVIEW: Ensure createInvoice action uses { data: { ... } }
          const recentInvoice = await this.$store.dispatch('billing/createInvoice', {
            balance: invoicePrice - balanceToApply,
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
            token: this.$store.state.auth.token,
            company: this.currentCompany.id // Ensure company is linked
          })
          createdInvoice = recentInvoice

          // --- Generate Image for Partial Balance Invoice (NEW) ---
          // Generate image immediately after creating the invoice via partial balance
          try {
            if (this.currentCompany.meta_template) {
              const imageInfo = await this.generateImageFromBill(createdInvoice, activeService)
              if (imageInfo && imageInfo[0]?.url) {
                this.logSuccess(`Imagen generada para factura con saldo parcial #${createdInvoice.id}`)
                // Update the created invoice with image info
                createdInvoice.image = imageInfo[0]
              }
            }
          } catch (imageError) {
            console.error(`Error generating image for partial balance invoice ${createdInvoice.id}:`, imageError)
            // Continue processing even if image generation fails
          }

          // REVIEW: Ensure createLegalNote action uses { data: { ... } }
          const legalNote = {
            city: this.$route.query.city,
            clienttype: this.$route.query.clienttype,
            token: this.$store.state.auth.token,
            biller: this.$store.state.auth,
            service: activeService.id,
            concept: 'APLICA SALDO A FAVOR',
            debit: 0,
            credit: balanceToApply,
            connect: true,
            invoices: [createdInvoice],
            company: this.currentCompany.id // Link company if needed by action
          }
          const legalNoteRes = await this.$store.dispatch('billing/createLegalNote', legalNote)

          if (!legalNoteRes) {
            throw new Error('Error creando la nota legal (saldo a favor parcial).')
          }

          // REVIEW: Ensure createInvoiceMovement action uses { data: { ... } }
          await this.$store.dispatch('billing/createInvoiceMovement', {
            token: this.$store.state.auth.token,
            biller: this.$store.state.auth,
            invoice: createdInvoice,
            type: 'ADELANTO',
            concept: this.month.text,
            amount: balanceToApply, // The amount of balance used
            details: 'APLICA SALDO A FAVOR',
            legal_note: legalNoteRes.id // Ensure field name is correct
          })

          // REVIEW: Ensure updateInvoice action uses { data: { ... } }
          // Mark the balance invoice as fully used
          await this.$store.dispatch('billing/updateInvoice', {
            token: this.$store.state.auth.token,
            invoice: infavor,
            payed: true,
            balance: 0
          })
        }
        // Return the ID of the newly created/affected invoice
        return createdInvoice
      } catch (error) {
        console.error(`Error applying balance in favor for service ${activeService?.id}, balance invoice ${infavor?.id}:`, error)
        this.logError(`Error aplicando saldo: ${error.message}`)
        throw error // Re-throw the error to be caught by processBalancesInFavor
      }
    },

    async processBalancesInFavor (activeService) {
      const balancesInFavor = await this.getBalancesInFavor(activeService.id)
      // Ensure response is an array
      const validBalances = Array.isArray(balancesInFavor) ? balancesInFavor.filter(b => b.balance > 0) : []

      if (validBalances.length < 1) {
        return null // No valid balances to apply
      }

      this.logInfo(`Aplicando ${validBalances.length} saldo(s) a favor para ${activeService.code}...`)

      let createdInvoiceId = null
      for (const balanceInFavor of validBalances) {
        // Apply them one by one
        // If any fails, the error should propagate from applyBalanceInFavorToInvoiceAndCreateLegalNote
        const invoiceId = await this.applyBalanceInFavorToInvoiceAndCreateLegalNote(activeService, balanceInFavor)
        if (invoiceId && !createdInvoiceId) {
          createdInvoiceId = invoiceId // Store the first created invoice ID
        }
      }

      // Return the ID of the created invoice, or null if none was created
      return createdInvoiceId
    },

    // --- Image Generation & Upload (Existing Methods - Review Needed) ---
    async generateImageFromBill (invoice, service) {
      try {
        // Obtener TODAS las facturas pendientes del servicio (no solo la actual)
        const allPendingInvoices = await this.getAllPendingInvoicesForService(service.id)

        // Verificar si la factura actual ya está en la lista de pendientes
        const currentInvoiceExists = allPendingInvoices.find(inv => inv.id === invoice.id)

        // Si la factura actual no está en la lista, agregarla
        let invoicesToShow = [...allPendingInvoices]
        if (!currentInvoiceExists && invoice.balance > 0) {
          invoicesToShow.push(invoice)
          // Reordenar después de agregar la factura actual
          invoicesToShow.sort((a, b) => {
            if (a.year !== b.year) {
              return a.year - b.year
            }
            return a.month - b.month
          })
        }

        // Si no hay facturas pendientes, usar solo la factura actual
        if (invoicesToShow.length === 0) {
          invoicesToShow = [invoice]
        }

        // Calcular el total pendiente de todas las facturas
        const totalPending = invoicesToShow.reduce((total, inv) => {
          return total + (inv.balance || 0)
        }, 0)

        this.logInfo(`Generando imagen con ${invoicesToShow.length} facturas. Total: $${totalPending.toLocaleString('es-CO')}`)

        // Obtener datos del servicio y oferta desde el objeto invoice
        const offer = service.offer

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
        const limitDate = parseLocalDate(invoice.limit)

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

        // Concepto principal para mostrar arriba
        const mainPaymentConcept = `PAGO TOTAL: $${totalPending.toLocaleString('es-CO')} pesos`
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
        if (emailClienteEl) { emailClienteEl.textContent = service.normalized_client?.email || 'N/A' }

        // Agregar línea de atención con el teléfono de la empresa
        if (lineaAtencionEl && lineaAtencionEl.parentNode) {
          lineaAtencionEl.parentNode.innerHTML = `<strong>LÍNEA DE ATENCIÓN:</strong> ${company.phone || '3219121937'}`
        }

        // Asignar fechas de emisión y límite con el nuevo formato
        if (fechaEmisionEl) { fechaEmisionEl.textContent = emissionDateFormatted }
        if (fechaLimiteEl) { fechaLimiteEl.textContent = limitDateFormatted }

        // MODIFICADO: Mostrar el concepto principal y los detalles de todas las facturas
        if (conceptoPagoEl) {
          // Usamos innerHTML para poder agregar múltiples líneas
          const conceptsHtml = invoicesToShow.map((inv) => {
            const monthName = this.getMonthName(inv.month)
            return `FACTURA ${inv.details || monthName} ${inv.year} $${(inv.balance || 0).toLocaleString('es-CO')}`
          }).join('<br>')

          conceptoPagoEl.innerHTML = `${mainPaymentConcept}<br><br>${conceptsHtml}`
        }

        if (fechaPagoEl) { fechaPagoEl.textContent = currentDateTime }

        // Estado de pago - mostrar como PENDIENTE si hay saldo
        const estadoTexto = totalPending > 0 ? 'PENDIENTE' : 'PAGADO'
        if (estadoPagoEl) {
          estadoPagoEl.textContent = estadoTexto

          // Cambiar los estilos según el estado
          if (totalPending > 0) {
            estadoPagoEl.style.borderColor = '#FF0000'
            estadoPagoEl.style.color = '#FF0000'
          } else {
            estadoPagoEl.style.borderColor = '#4CAF50'
            estadoPagoEl.style.color = '#4CAF50'
          }
        }

        // Mostrar el saldo pendiente total
        if (totalPendienteEl) {
          totalPendienteEl.textContent = `TOTAL PENDIENTE POR PAGAR: $${totalPending.toLocaleString('es-CO')} pesos`
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

    // Nueva función para obtener todas las facturas pendientes de un servicio
    async getAllPendingInvoicesForService (serviceId) {
      try {
        // Usar la acción existente del store para obtener facturas pendientes
        const pendingInvoices = await this.$store.dispatch('billing/getInvoicesByServiceId', {
          token: this.$store.state.auth.token,
          serviceId,
          payed: false // Solo las no pagadas
        })

        // Filtrar solo las que tienen saldo pendiente y no son adelantos
        const validInvoices = pendingInvoices.filter(invoice =>
          invoice.balance > 0 &&
          invoice.concept !== 'ADELANTO'
        )

        // Ordenar por mes y año (las más antiguas primero)
        validInvoices.sort((a, b) => {
          if (a.year !== b.year) {
            return a.year - b.year
          }
          return a.month - b.month
        })

        this.logInfo(`Encontradas ${validInvoices.length} facturas pendientes para el servicio ${serviceId}`)
        return validInvoices
      } catch (error) {
        console.error('Error obteniendo facturas pendientes:', error)
        this.logError(`Error al obtener facturas pendientes: ${error.message}`)
        return []
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

    async generateMissingImages () {
      if (!this.month || !this.year || !this.currentCompany?.meta_template) {
        this.logError('Faltan datos requeridos (mes/año) o no hay plantilla configurada.')
        return
      }

      this.loadingGenerateImages = true
      this.logInfo(`Buscando facturas del ${this.month.text} ${this.year} sin imagen...`)

      try {
        // 1. Fetch invoices for the selected month/year that don't have images
        const invoicesWithoutImages = await this.fetchInvoicesWithoutImages()

        if (!invoicesWithoutImages || invoicesWithoutImages.length === 0) {
          this.logSuccess('No se encontraron facturas sin imagen para el período seleccionado.')
          this.loadingGenerateImages = false
          return
        }

        this.logInfo(`Encontradas ${invoicesWithoutImages.length} facturas sin imagen. Generando...`)

        let successCount = 0
        let errorCount = 0
        const totalCount = invoicesWithoutImages.length

        // 2. Generate images for each invoice
        for (let i = 0; i < invoicesWithoutImages.length; i++) {
          const invoice = invoicesWithoutImages[i]
          try {
            this.logInfo(`[${i + 1}/${totalCount}] Generando imagen para factura #${invoice.id}...`)

            // Use the existing generateImageFromBill method
            const imageInfo = await this.generateImageFromBill(invoice, invoice.service)

            if (imageInfo && imageInfo[0]?.url) {
              this.logSuccess(`[${i + 1}/${totalCount}] Imagen generada para factura #${invoice.id}`)
              successCount++

              // Update any matching item in processedItems if it exists
              const matchingItem = this.processedItems.find(item =>
                (item.invoiceId === invoice.id || item.existingInvoiceId === invoice.id)
              )
              if (matchingItem) {
                if (matchingItem.invoiceData) {
                  matchingItem.invoiceData.image = imageInfo[0]
                } else {
                  matchingItem.invoiceData = { ...invoice, image: imageInfo[0] }
                }
              }
            } else {
              throw new Error('No se pudo generar la imagen')
            }
          } catch (error) {
            console.error(`Error generating image for invoice ${invoice.id}:`, error)
            this.logError(`[${i + 1}/${totalCount}] Error en factura #${invoice.id}: ${error.message}`)
            errorCount++
          }
        }

        this.logSuccess(`Proceso completado para ${this.month.text} ${this.year}. Éxito: ${successCount}, Errores: ${errorCount}`)
      } catch (error) {
        console.error('Error in generateMissingImages:', error)
        this.logError(`Error general: ${error.message}`)
      } finally {
        this.loadingGenerateImages = false
      }
    },

    async fetchInvoicesWithoutImages () {
      try {
        // Build query to find invoices for the specific month/year without images
        const qs = require('qs')
        const query = qs.stringify({
          filters: {
            month: this.month.value,
            year: this.year,
            image: {
              $null: true
            },
            company: this.currentCompany.id
          },
          populate: [
            'service',
            'service.offer',
            'service.normalized_client'
          ],
          pagination: {
            pageSize: 1000 // Adjust as needed
          }
        }, {
          encodeValuesOnly: true
        })

        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Failed to fetch invoices'}`)
        }

        const { data: invoices } = await response.json()

        // Filter out invoices that don't have complete service data
        const validInvoices = invoices.filter(invoice =>
          invoice.service &&
          invoice.service.offer &&
          invoice.service.code
        )

        console.log(`Found ${validInvoices.length} invoices without images for ${this.month.text} ${this.year}`)
        return validInvoices
      } catch (error) {
        console.error('Error fetching invoices without images:', error)
        throw error
      }
    },

    exit () {
      this.$store.commit('billing/resetState') // Optional: Reset Vuex state on exit
      this.$router.push('/client') // Or appropriate dashboard/list page
    },

    clearConsole () {
      this.consoleLogs = []
    },

    logToConsole (message, type = 'info') {
      const timestamp = new Date().toLocaleTimeString('es-ES', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      this.consoleLogs.push({
        timestamp,
        message,
        type
      })

      // Auto-scroll to bottom
      this.$nextTick(() => {
        if (this.$refs.consoleContainer) {
          this.$refs.consoleContainer.scrollTop = this.$refs.consoleContainer.scrollHeight
        }
      })

      // Limit console logs to prevent memory issues (keep last 500 logs)
      if (this.consoleLogs.length > 500) {
        this.consoleLogs = this.consoleLogs.slice(-500)
      }
    },

    logInfo (message) {
      this.logToConsole(message, 'info')
    },

    logSuccess (message) {
      this.logToConsole(message, 'success')
    },

    logWarning (message) {
      this.logToConsole(message, 'warning')
    },

    logError (message) {
      this.logToConsole(message, 'error')
    }
  }
}
</script>

<style scoped>
/* Add styles if needed, e.g., for chips */
.v-chip {
  font-weight: bold;
}

/* Console Styles */
.console-container {
  line-height: 1.4;
}

.console-line {
  white-space: pre-wrap;
  word-break: break-word;
}

.console-info {
  border-left-color: #2196F3 !important;
  background-color: rgba(33, 150, 243, 0.05);
}

.console-success {
  border-left-color: #4CAF50 !important;
  background-color: rgba(76, 175, 80, 0.05);
  color: #4CAF50 !important;
}

.console-warning {
  border-left-color: #FF9800 !important;
  background-color: rgba(255, 152, 0, 0.05);
  color: #FF9800 !important;
}

.console-error {
  border-left-color: #F44336 !important;
  background-color: rgba(244, 67, 54, 0.05);
  color: #F44336 !important;
}

.console-container::-webkit-scrollbar {
  width: 8px;
}

.console-container::-webkit-scrollbar-track {
  background: #2e2e2e;
}

.console-container::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-container::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
