<!-- eslint-disable vue/html-self-closing -->
<template>
  <div>
    <v-container
      v-for="(clientInfo, index) in clientsInfo"
      :key="index"
      class="service-document"
    >
      <!-- Header Section -->
      <div class="header-section">
        <div class="logo-container">
          <v-img
            :src="$config.CDN_STRAPI_ENDPOINT + clientInfo.company.logo.url"
            class="company-logo"
          />
        </div>
        <div class="title-container">
          <h2 class="document-title">
            <v-icon color="#2c3e50" left>
              mdi-file-document-outline
            </v-icon>
            ENTREGA DE SERVICIO
          </h2>
        </div>
        <div class="date-container">
          <h5 class="document-date">
            <v-icon small color="#5d6975" class="mr-1">
              mdi-calendar
            </v-icon>
            {{ getDate(clientInfo.createdAt) }}
          </h5>
        </div>
      </div>

      <!-- Client Information Section -->
      <div class="section-title">
        <v-icon color="white" class="mr-1">
          mdi-account
        </v-icon>
        <span>INFORMACIÓN DEL CLIENTE</span>
      </div>

      <div class="client-info-grid">
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-account
            </v-icon>
            CLIENTE:
          </div>
          <div class="info-value">
            {{ clientInfo.name }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-map-marker
            </v-icon>
            DIRECCION:
          </div>
          <div class="info-value">
            {{ clientInfo.address }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-home-city
            </v-icon>
            BARRIO:
          </div>
          <div class="info-value">
            {{ clientInfo.neighborhood }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-cellphone
            </v-icon>
            CELULAR:
          </div>
          <div class="info-value">
            {{ clientInfo.phone }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-card-account-details
            </v-icon>
            CÉDULA / NIT:
          </div>
          <div class="info-value">
            {{ clientInfo.dni }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-package-variant
            </v-icon>
            OFERTA CONTRATADA:
          </div>
          <div class="info-value">
            {{ clientInfo.offer.plan.name }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-router-wireless
            </v-icon>
            EQUIPO EN COMODATO:
          </div>
          <div class="info-value">
            {{ clientInfo.tickettype }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-connection
            </v-icon>
            TIPO:
          </div>
          <div class="info-value">
            {{ clientInfo.technology.name }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <v-icon x-small left color="#2c3e50">
              mdi-email
            </v-icon>
            E-MAIL:
          </div>
          <div class="info-value">
            {{ clientInfo.email }}
          </div>
        </div>
      </div>

      <!-- Terms and Conditions Section -->
      <div class="section-title mt-4">
        <v-icon color="white" class="mr-1">
          mdi-file-document
        </v-icon>
        <span>CONDICIONES DEL SERVICIO</span>
      </div>

      <div class="conditions-section">
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-router-wireless
          </v-icon> 1. El equipo terminal (Router / ONT) es propiedad de {{ clientInfo.company.name }}
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-hand-peace
          </v-icon> 2. El usuario se compromete a no manipular ni alterar los dispositivos y redes de conexión y ante cualquier interrupción deberá solicitar la visita técnica por parte de la empresa.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-account-hard-hat
          </v-icon> 3. El técnico instalador entregará al usuario afiliado el equipo terminal en modalidad de comodato. Dicho equipo y su estado correcto de funcionamiento dependerán de los cuidados que el usuario de al mismo.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-keyboard-return
          </v-icon> 4. El usuario deberá regresar el equipo en buenas condiciones en el momento de solicitar la desafiliación del servicio.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-shield-lock
          </v-icon> 5. El usuario autoriza a {{ clientInfo.company.name }} el tratamiento de sus datos personales, política que podrá encontrar a mayor detalle en la página web netplusinternet.net
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-key-change
          </v-icon> 6. El cambio de contraseña deberá ser solicitada por el usuario a {{ clientInfo.company.name }} y dicho proceso se realizará en un lapso no superior a 3 días hábiles.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-home
          </v-icon> 7. El usuario deberá permitir al técnico instalador previamente identificado, el acceso a la vivienda en el momento de la instalación.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-cash
          </v-icon> 8. En el momento de la afiliación el usuario acepta el período de pago vigente en el momento.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-file-document-edit
          </v-icon> 9. El usuario podrá dar por finalizado este contrato en cualquier momento presentando una carta firmada solicitando la cancelación del servicio presentando una razón válida para el mismo.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-handshake
          </v-icon> 10. Este contrato es sin cláusula de permanencia; el usuario deberá solicitar la cancelación del servicio mediante una carta firmada especificando el motivo de retiro del servicio.
        </p>
        <p>
          <v-icon x-small color="#3d4852" class="mr-1">
            mdi-headset
          </v-icon> 11. El usuario podrá solicitar dentro del horario habitual su visita técnica en caso de no contar con el servicio.
        </p>
      </div>

      <!-- Technical Recommendations Section -->
      <div class="section-title mt-4">
        <v-icon color="white" class="mr-1">
          mdi-alert-circle
        </v-icon>
        <span>RECOMENDACIONES TÉCNICAS Y CASOS PARA SOLICITAR SERVICIO</span>
      </div>

      <div class="recommendations-grid">
        <div class="recommendations-column">
          <p>
            <v-icon color="#2c3e50" small class="mr-1">
              mdi-shield-alert
            </v-icon><strong>Recomendaciones:</strong>
          </p>
          <ul>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-lock
              </v-icon> No comparta su contraseña con nadie.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-cable-data
              </v-icon> Evite desconectar o manipular cables y dispositivos.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-cog
              </v-icon> No intente modificar configuraciones del Router.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-weather-lightning
              </v-icon> Desconecte el dispositivo durante tormentas eléctricas.
            </li>
          </ul>
        </div>
        <div class="recommendations-column">
          <p>
            <v-icon color="#2c3e50" small class="mr-1">
              mdi-phone-in-talk
            </v-icon><strong>Solicite servicio técnico si:</strong>
          </p>
          <ul>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-led-off
              </v-icon> El dispositivo muestra luz roja en el led LOS.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-ethernet-cable-off
              </v-icon> El cable está cortado o dañado.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-speedometer-slow
              </v-icon> El servicio presenta lentitud en navegación.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-power-plug-off
              </v-icon> El dispositivo no enciende o necesita cambiar de lugar.
            </li>
            <li>
              <v-icon x-small color="#3d4852" class="mr-1">
                mdi-form-textbox-password
              </v-icon> Necesita cambiar la contraseña.
            </li>
          </ul>
        </div>
      </div>

      <!-- Reminder Section -->
      <div class="reminder-box mt-4">
        <v-icon color="#1e5f8a" class="mr-1">
          mdi-information
        </v-icon>
        <strong>Recuerde que la calidad del servicio depende tambien del cuidado y buen uso del dispositivo</strong>
      </div>

      <!-- Contact Information Section -->
      <div class="contact-section mt-4">
        <v-icon color="white" class="mr-2">
          mdi-phone
        </v-icon>
        <div class="contact-label">
          LÍNEA DE ATENCIÓN:
        </div>
        <div class="contact-value">
          {{ clientInfo.company.phone }}
        </div>
      </div>

      <!-- Signature Section -->
      <div class="signature-section mt-5">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">
            <v-icon x-small color="#2c3e50" class="mr-1">
              mdi-account-edit
            </v-icon>
            CLIENTE
          </div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">
            <v-icon x-small color="#2c3e50" class="mr-1">
              mdi-account-hard-hat
            </v-icon>
            TECNICO
          </div>
        </div>
      </div>

      <div v-if="(index + 1) < clientsInfo.length" class="pagebreak"></div>
    </v-container>
  </div>
</template>
<script>
export default {
  name: 'PrintOrder',
  layout: 'print',
  data () {
    return {
      clientsInfo: []
    }
  },
  mounted () {
    this.$vuetify.theme.dark = false
    this.getClientInfo()
  },
  destroyed () {
    this.$vuetify.theme.dark = true
  },
  methods: {
    getClientInfo () {
      if (localStorage.getItem('clientsInfo')) {
        this.clientsInfo = JSON.parse(localStorage.getItem('clientsInfo'))
      }
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      return humanDateFormat
    }
  },
  head () {
    return {
      title: 'Imprimir Orden de Servicio'
    }
  }
}
</script>
<style scoped>
body {
  background-color: white !important;
}

.service-document {
  max-width: 23cm;
  margin: 0 auto;
  font-family: 'Roboto', 'Segoe UI', 'Arial', sans-serif;
  border: none;
  border-radius: 8px;
  background-color: white;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* Header Section */
.header-section {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.logo-container {
  display: flex;
  justify-content: center;
}

.company-logo {
  max-height: 80px;
  max-width: 160px;
  object-fit: contain;
}

.title-container {
  text-align: center;
}

.document-title {
  color: #2c3e50;
  font-size: 1.7rem;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.5px;
}

.date-container {
  text-align: right;
}

.document-date {
  color: #5d6975;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 400;
}

/* Section Titles */
.section-title {
  background: linear-gradient(90deg, rgba(0, 126, 180, 1) 0%, rgba(0, 176, 240, 1) 100%);
  color: white;
  font-weight: 500;
  text-align: center;
  padding: 8px 12px;
  margin: 20px 0 15px 0;
  font-size: 0.95rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.section-title span {
  position: relative;
  z-index: 2;
  letter-spacing: 0.5px;
}

/* Client Information Grid */
.client-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 12px;
  border-radius: 6px;
  padding: 12px;
  background-color: #fafafa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.info-item {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  background-color: white;
  transition: all 0.2s ease;
}

.info-item:hover {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.info-label {
  background-color: #f0f4f8;
  font-weight: 600;
  font-size: 0.7rem;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 126, 180, 0.1);
  color: #2c3e50;
  letter-spacing: 0.3px;
}

.info-value {
  padding: 8px 10px;
  font-size: 0.8rem;
  min-height: 24px;
  color: #3d4852;
}

/* Conditions Section */
.conditions-section {
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.conditions-section p {
  font-size: 0.75rem;
  margin-bottom: 6px;
  line-height: 1.4;
  color: #3d4852;
  position: relative;
  padding-left: 5px;
}

/* Recommendations Grid */
.recommendations-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.recommendations-column {
  background-color: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.recommendations-column ul {
  padding-left: 20px;
  margin-top: 8px;
  margin-bottom: 0;
}

.recommendations-column li {
  font-size: 0.75rem;
  margin-bottom: 6px;
  line-height: 1.4;
  color: #3d4852;
}

.recommendations-column p {
  font-size: 0.85rem;
  margin-bottom: 5px;
  color: #2c3e50;
}

/* Reminder Section */
.reminder-box {
  background-color: #e9f4fd;
  color: #1e5f8a;
  text-align: center;
  padding: 12px 15px;
  border-radius: 6px;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid rgba(0, 126, 180, 1);
}

/* Contact Section */
.contact-section {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, rgba(0, 126, 180, 1) 0%, rgba(0, 176, 240, 1) 100%);
  color: white;
  padding: 10px 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.contact-label {
  font-weight: 600;
  font-size: 0.9rem;
  margin-right: 10px;
  letter-spacing: 0.5px;
}

.contact-value {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Signature Section */
.signature-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 20px;
  margin-top: 30px;
}

.signature-block {
  text-align: center;
}

.signature-line {
  border-bottom: 1px solid #2c3e50;
  margin-bottom: 8px;
  padding-top: 50px;
}

.signature-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #2c3e50;
  letter-spacing: 0.3px;
}

/* Print Styles */
@media print {
  .pagebreak {
    page-break-after: always;
    opacity: 0;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page {
    margin: 0.5cm;
  }

  .service-document {
    border: none;
    padding: 10px;
    box-shadow: none;
  }

  .section-title,
  .contact-section {
    box-shadow: none;
  }

  .client-info-grid,
  .conditions-section,
  .recommendations-grid,
  .recommendations-column,
  .reminder-box,
  .info-item {
    box-shadow: none;
  }
}
</style>
