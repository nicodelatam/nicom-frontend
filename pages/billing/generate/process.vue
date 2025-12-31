<template>
  <v-container>
    <v-card class="mb-4 rounded-xl elevation-0">
      <v-card-title class="text-center justify-center">
        Procesamiento - {{ stageTitle }}
      </v-card-title>
      <v-card-text>
        <!-- Generation Button -->
        <v-row>
          <v-col class="align-center d-flex flex-column">
            <v-btn
              color="primary"
              class="rounded-xl mb-2"
              block
              :loading="loadingGenerate"
              :disabled="isProcessing || isComplete"
              @click="generateBilling"
            >
              Iniciar Generación en Segundo Plano
            </v-btn>

            <v-btn
              color="info"
              class="rounded-xl"
              text
              :disabled="isProcessing"
              @click="testConnection"
            >
              <v-icon left>
                mdi-whatsapp
              </v-icon>
              Probar Conexión WhatsApp
            </v-btn>
          </v-col>
        </v-row>

        <!-- Progress Bar -->
        <v-row v-if="isProcessing || isComplete">
          <v-col>
            <div class="d-flex justify-space-between mb-1">
              <span>Progreso: {{ progress }} / {{ total }}</span>
              <span>{{ percentage }}%</span>
            </div>
            <v-progress-linear
              :value="percentage"
              height="25"
              striped
              :color="statusColor"
            >
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>
            <div class="text-center mt-2 caption">
              Estado: {{ statusText }}
            </div>
          </v-col>
        </v-row>

        <!-- Summary Chips -->
        <v-row v-if="results">
          <v-col class="text-center">
            <v-chip class="ma-1" color="success">
              Exitosos: <strong class="ml-1">{{ results.success }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="error">
              Errores: <strong class="ml-1">{{ results.error }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="warning">
              Omitidos: <strong class="ml-1">{{ results.skipped }}</strong>
            </v-chip>
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-row class="mt-2">
          <v-col>
            <div class="d-flex justify-center">
              <v-btn
                color="primary"
                class="mr-2"
                :disabled="isProcessing"
                @click="$router.push({ path: '/billing/generate/prepare', query: $route.query })"
              >
                <v-icon left>
                  mdi-arrow-left
                </v-icon>
                Regresar
              </v-btn>
              <v-btn
                color="success"
                :disabled="!isComplete"
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
                <span class="subtitle-1">Logs del Servidor</span>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <div
                  ref="consoleContainer"
                  class="console-container"
                  style="height: 300px; overflow-y: auto; background-color: #1e1e1e; color: #ffffff; font-family: 'Courier New', monospace; font-size: 13px;"
                >
                  <div
                    v-for="(log, index) in logs"
                    :key="index"
                    class="console-line"
                    style="padding: 4px 12px;"
                  >
                    <span class="console-message">{{ log }}</span>
                  </div>
                  <div v-if="logs.length === 0" class="console-empty" style="padding: 20px; text-align: center; color: #666;">
                    Esperando logs...
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Test Dialog -->
    <v-dialog v-model="testDialog" max-width="400">
      <v-card>
        <v-card-title>Prueba de WhatsApp</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="testPhone"
            label="Número de Celular (sin 57)"
            type="number"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="testDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" :loading="testingLoading" @click="runTest">
            Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  middleware: 'authenticated',
  data () {
    return {
      loadingGenerate: false,
      batchId: null,
      status: 'idle', // idle, pending, processing, completed, failed
      progress: 0,
      total: 0,
      logs: [],
      results: null,
      pollingInterval: null,
      testDialog: false,
      testPhone: '',
      testingLoading: false
    }
  },

  computed: {
    month () { return this.$store.state.billing.month },
    year () { return this.$store.state.billing.year },
    limit () { return this.$store.state.billing.limit },
    currentCompany () { return this.$store.state.company.currentCompany },

    isProcessing () {
      return this.status === 'pending' || this.status === 'processing'
    },
    isComplete () {
      return this.status === 'completed' || this.status === 'failed'
    },
    percentage () {
      if (this.total === 0) { return 0 }
      return Math.min(100, Math.floor((this.progress / this.total) * 100))
    },
    stageTitle () {
      if (this.status === 'idle') { return 'Listo para Iniciar' }
      if (this.status === 'pending') { return 'Iniciando...' }
      if (this.status === 'processing') { return 'Procesando en Segundo Plano' }
      if (this.status === 'completed') { return 'Completado' }
      if (this.status === 'failed') { return 'Falló' }
      return ''
    },
    statusColor () {
      if (this.status === 'failed') { return 'error' }
      if (this.status === 'completed') { return 'success' }
      return 'primary'
    },
    statusText () {
      if (this.status === 'idle') { return 'Esperando inicio' }
      if (this.status === 'pending') { return 'En cola...' }
      if (this.status === 'processing') { return 'Generando facturas y enviando mensajes...' }
      if (this.status === 'completed') { return 'Proceso finalizado' }
      if (this.status === 'failed') { return 'Error en el proceso' }
      return ''
    }
  },

  mounted () {
    this.fetchLatestBatch()
  },

  beforeDestroy () {
    this.stopPolling()
  },

  methods: {
    async fetchLatestBatch () {
      try {
        const qs = require('qs')
        const query = qs.stringify({
          sort: 'createdAt:desc',
          pagination: { limit: 1 },
          filters: {
            company: { id: { $eq: this.currentCompany.id } },
            finalized: { $eq: false }
          }
        }, {
          encodeValuesOnly: true
        })

        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}billing-batches?${query}`, {
          headers: {
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch latest batch')
        }

        const { data } = await response.json()

        console.log(data)

        if (data && data.length > 0) {
          const latestBatch = data[0]
          // Only load if it's relevant (optional: you might want to check date or other criteria)
          // For now, we load the absolute latest for this company
          this.batchId = latestBatch.id

          // Update status immediately
          await this.checkStatus()

          // Resume polling if active
          if (this.isProcessing) {
            this.startPolling()
          }
        }
      } catch (error) {
        console.error('Error fetching latest batch:', error)
      }
    },

    async generateBilling () {
      this.loadingGenerate = true
      try {
        const payload = {
          month: this.month.value,
          year: this.year,
          limit: this.limit,
          clienttype: this.getClientTypeId(),
          city: this.getCityId(),
          company: this.currentCompany.id,
          serviceIds: this.$store.state.billing.selectedServices.map(s => s.id) // Send selected IDs
        }

        if (!payload.city || !payload.clienttype) {
          this.$toast.error('Error: No se pudo identificar ID de ciudad o tipo de cliente.')
          this.loadingGenerate = false
          return
        }

        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}billing/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Error al iniciar')
        }

        const data = await response.json()
        this.batchId = data.batchId // Flattened response

        this.$toast.success('Proceso iniciado en segundo plano', { duration: 5000 })
        this.status = 'pending'
        this.startPolling()
      } catch (error) {
        console.error('Error starting generation:', error)
        this.$toast.error(`Error: ${error.message}`)
      } finally {
        this.loadingGenerate = false
      }
    },

    startPolling () {
      this.pollingInterval = setInterval(this.checkStatus, 2000)
    },

    stopPolling () {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    },

    async checkStatus () {
      if (!this.batchId) { return }

      try {
        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}billing-batches/${this.batchId}`, {
          headers: {
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })

        const { data: res } = await response.json()
        // Strapi transformer flattens response, so data is the object directly
        const batch = res

        console.log(batch)

        this.status = batch.status
        this.progress = batch.progress
        this.total = batch.total

        // Robustly handle logs
        let logs = batch.logs
        if (typeof logs === 'string') {
          try {
            logs = JSON.parse(logs)
          } catch (e) {
            logs = [logs]
          }
        }
        this.logs = Array.isArray(logs) ? logs : []

        this.results = batch.results

        if (this.isComplete) {
          this.stopPolling()
          if (this.status === 'completed') {
            this.$toast.success('Proceso completado', { duration: 5000 })
          } else {
            this.$toast.error('El proceso falló')
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    },

    getCityId () {
      // Find ID from store based on route query name
      const city = this.$store.state.company.cities.find(c => c.name === this.$route.query.city)
      return city ? city.id : null
    },

    getClientTypeId () {
      const type = this.$store.state.company.clienttypes.find(c => c.name === this.$route.query.clienttype)
      return type ? type.id : null
    },

    testConnection () {
      this.testDialog = true
    },

    async runTest () {
      this.testingLoading = true
      try {
        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}billing/test-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          },
          body: JSON.stringify({
            phone: this.testPhone,
            company: this.currentCompany.id
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Error en prueba')
        }

        this.$toast.success('Mensaje de prueba enviado correctamente', { duration: 5000 })
        this.testDialog = false
      } catch (error) {
        this.$toast.error(`Error: ${error.message}`)
      } finally {
        this.testingLoading = false
      }
    },

    async exit () {
      if (this.batchId) {
        try {
          await fetch(`${this.$config.API_STRAPI_ENDPOINT}billing-batches/${this.batchId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.$store.state.auth.token}`
            },
            body: JSON.stringify({
              data: {
                finalized: true
              }
            })
          })
        } catch (e) {
          console.error('Error finalizing batch', e)
        }
      }
      this.$router.push('/billing/generate')
    }
  }
}
</script>

<style scoped>
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
</style>
