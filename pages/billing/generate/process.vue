<template>
  <v-container>
    <v-card class="mb-4 rounded-xl elevation-0">
      <v-card-title class="text-center justify-center">
        <strong>Procesamiento</strong> - Generación de estados de cuenta
      </v-card-title>
      <v-card-text>
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
            <v-alert type="warning" dense outlined>
              {{ omitedBills }} servicios sin tarifas asignadas. Use la sección de configuración para corregir este problema.
            </v-alert>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-btn
              class="rounded-xl"
              color="error"
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
            <v-chip class="ma-1" color="primary" v-if="generatedBills > 0">
              Cargados: <strong class="ml-1">{{ generatedBills }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="warning" v-if="omitedBills > 0">
              Sin Tarifa: <strong class="ml-1">{{ omitedBills }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="info" v-if="alreadyBilled > 0">
              Ya generados: <strong class="ml-1">{{ alreadyBilled }}</strong>
            </v-chip>
            <v-chip class="ma-1" color="success" v-if="sendIndex > 0">
              Enviados: <strong class="ml-1">{{ sendIndex }}</strong>
            </v-chip>
          </v-col>
        </v-row>
        <v-row class="mt-2">
          <v-col>
            <div class="d-flex">
              <v-btn
                color="primary"
                class="mr-2"
                @click="$router.push({
                  path: '/billing/generate/prepare',
                  query: $route.query
                })"
                :disabled="loading"
              >
                <v-icon left>mdi-arrow-left</v-icon>
                Regresar
              </v-btn>
              <v-btn
                color="success"
                @click="exit"
                :disabled="loading || !end"
              >
                Finalizar
                <v-icon right>mdi-check</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-if="activeServices.length > 0 && end && !loading && omitedBills < 1" class="rounded-xl elevation-0">
      <v-card-title>
        Resumen de facturación
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="activeServices"
        :items-per-page="10"
        class="elevation-0"
      >
        <template v-slot:[`item.messageSent`]="{ item }">
          <v-chip
            :color="item.messageSent ? 'green' : (item.messageSent === false ? 'red' : 'cyan darken-4')"
            text-color="white"
            small
          >
            {{ item.messageSent ? 'ENVIADO' : (item.messageSent === false ? 'FALLIDO' : 'PENDIENTE') }}
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
      end: false,
      loading: false,
      offerCorrectionDialog: false,
      generatedBills: 0,
      omitedBills: 0,
      omitedBillsObjects: [],
      alreadyBilled: 0,
      alreadyBilledObjects: [],
      headers: [
        { text: 'Código', value: 'code', sortable: true },
        { text: 'Cliente', value: 'client_name', sortable: true },
        { text: 'Celular', value: 'phone', sortable: false },
        { text: 'Estado del envío', value: 'messageSent', sortable: false }
      ]
    }
  },

  computed: {
    activeServices () {
      // Use selected services if available, otherwise fall back to all active services
      return this.$store.state.billing.selectedServices.length > 0
        ? this.$store.state.billing.selectedServices
        : this.$store.state.billing.activeServices
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

  mounted () {
    // Verificar si tenemos los datos necesarios
    if (!this.month || !this.year || !this.limit) {
      this.$router.push('/billing/generate')
      return
    }
    // Verificar si tenemos servicios seleccionados
    if (this.$store.state.billing.selectedServices.length === 0) {
      this.$toast.warning('No hay servicios seleccionados para facturar')
      this.$router.push('/billing/generate/prepare')
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
              this.$toast.error('Error de configuración. Reportar al webmaster. CODE:COMP_META_INFO_NOT_FOUND')
              return null
            }
            if (!company.meta_token || !company.meta_template || !company.meta_endpoint) {
              this.$toast.error('Error de configuración. Reportar al webmaster. CODE:COMP_META_INFO_INCOMPLETE')
              return null
            }
            const metaServicesInfo = {
              meta_token: company.meta_token,
              meta_template: company.meta_template,
              meta_endpoint: company.meta_endpoint
            }
            resolve(metaServicesInfo)
          }).catch((error) => {
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
        this.$toast.error('Error al generar imagen de factura')
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
        return null
      }
    },

    async sendNotifications () {
      this.loading = true
      const services = this.activeServices

      const metaServicesInfo = await this.getMetaServicesConfig()
      if (!metaServicesInfo) {
        this.loading = false
        this.$toast.error('Error de configuración. Reportar al webmaster. CODE:COMP_META_INFO_ERROR')
        return
      }

      for (let i = 0; i < services.length; i++) {
        this.$store.commit('notification/setSendIndex', i + 1)

        const lastInvoice = services[i].invoices ? services[i].invoices.at(-1) : null
        const imgPath = lastInvoice?.image?.url || null

        await this.$store.dispatch('notification/sendWhatsapp', {
          service: services[i],
          month: this.month,
          token: this.$store.state.auth.token,
          metaServicesInfo,
          imgPath
        }).then(async (res) => {
          if (res && res.contacts && res.contacts[0]) {
            this.$toast.success('Notificación enviada', { duration: 2000 })
            this.$store.commit('billing/messageSent', {
              index: i,
              success: true
            })
            if (lastInvoice) {
              await this.$store.dispatch('billing/updateSentStatus', {
                token: this.$store.state.auth.token,
                invoice: lastInvoice,
                success: true
              })
            }
          } else {
            this.$store.commit('billing/messageSent', {
              index: i,
              success: false
            })
          }
        }).catch((error) => {
          console.error('Error enviando notificación:', error)
          this.$store.commit('billing/messageSent', {
            index: i,
            success: false
          })
        })
      }

      this.loading = false
      this.$toast.success('Proceso de notificaciones completado')
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
          city: activeService.city || this.$route.query.city,
          clienttype: activeService.clienttype || this.$route.query.clienttype,
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

        await this.$store.dispatch('billing/updateInvoice', {
          token: this.$store.state.auth.token,
          invoice: infavor,
          payed: balanceLeft === 0,
          balance: balanceLeft
        })
      } else {
        balanceToApply = balanceInFavor
        balanceLeft = 0

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
          token: this.$store.state.auth.token
        })

        const legalNote = {
          city: activeService.city || this.$route.query.city,
          clienttype: activeService.clienttype || this.$route.query.clienttype,
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

        await this.$store.dispatch('billing/updateInvoice', {
          token: this.$store.state.auth.token,
          invoice: infavor,
          payed: true,
          balance: 0
        })
      }
    },

    async processBalancesInFavor (activeService) {
      const balancesInFavor = await this.getBalancesInFavor(activeService.id)
      const validBalances = balancesInFavor.filter(b => b.balance > 0)

      if (validBalances.length < 1) {
        return false
      }

      for (const balanceInFavor of validBalances) {
        await this.applyBalanceInFavorToInvoiceAndCreateLegalNote(activeService, balanceInFavor)
      }

      return true
    },

    async generateBilling () {
      this.loading = true

      try {
        for (let i = 0; i < this.activeServices.length; i++) {
          const service = this.activeServices[i]

          if (!service.offer) {
            this.omitedBills++
            this.omitedBillsObjects.push({ ...service })
            continue
          }

          if (service.billingmonth === this.month.value && service.billingyear === this.year) {
            this.alreadyBilled++
            this.alreadyBilledObjects.push({ ...service })
            continue
          }

          // Actualizar período de facturación
          await this.$store.dispatch('billing/updateBillingPeriod', {
            token: this.$store.state.auth.token,
            service,
            billingmonth: this.month.value,
            billingyear: this.year
          })

          // Procesar saldos a favor si existen
          const hasBalancesInFavor = await this.processBalancesInFavor(service)
          if (hasBalancesInFavor) {
            this.generatedBills++
            continue
          }

          // Crear nueva factura
          const newInvoiceData = {
            balance: service.offer.price,
            value: service.offer.price,
            month: this.month.value,
            year: this.year,
            type: 'FACTURA',
            offer: service.offer.id,
            concept: 'FACTURACION MENSUAL',
            details: this.month.text,
            payed: false,
            partial: false,
            indebt: false,
            service: service.id,
            invoice_type: 1,
            limit: this.limit,
            token: this.$store.state.auth.token
          }

          const newInvoice = await this.$store.dispatch('billing/createInvoice', newInvoiceData)

          // Generar imagen de factura
          const invoiceImageResult = await this.generateImageFromBill(newInvoice, service)

          // Asociar imagen con la factura en el store
          if (invoiceImageResult) {
            this.$store.commit('billing/addInvoice', {
              index: i,
              invoice: {
                ...newInvoice,
                image: invoiceImageResult
              }
            })
          } else {
            this.$toast.warning(`No se pudo generar imagen para factura de ${service.client_name}`)
          }

          // Crear nota legal
          const legalNote = {
            city: this.$route.query.city,
            clienttype: this.$route.query.clienttype,
            token: this.$store.state.auth.token,
            biller: this.$store.state.auth,
            service: parseInt(service.id),
            debit: service.offer.price,
            credit: 0,
            concept: 'FACTURACION MENSUAL'
          }

          await this.$store.dispatch('billing/createLegalNote', legalNote)

          // Actualizar saldo del servicio
          await this.$store.dispatch('billing/updateServiceBalance', {
            balance: service.balance + service.offer.price,
            serviceId: service.id,
            token: this.$store.state.auth.token
          })

          this.generatedBills++
        }

        this.$toast.success(`Se generaron ${this.generatedBills} facturas correctamente`)
      } catch (error) {
        console.error('Error en la generación de facturas:', error)
        this.$toast.error('Error en el proceso de facturación')
      } finally {
        this.loading = false
        this.end = true
      }
    },

    exit () {
      this.$router.push('/client')
    }
  }
}
</script>
