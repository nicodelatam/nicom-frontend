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
            ENTREGA DE SERVICIO INTERNET
          </h2>
        </div>
        <div class="date-container">
          <h5 class="document-date">
            {{ getDate(clientInfo.createdAt) }}
          </h5>
        </div>
      </div>

      <!-- Client Information Section -->
      <div class="section-title">
        INFORMACIÓN DEL CLIENTE
      </div>

      <div class="client-info-grid">
        <div class="info-row">
          <div class="info-label">
            CLIENTE:
          </div>
          <div class="info-value">
            {{ clientInfo.name }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            DIRECCION:
          </div>
          <div class="info-value">
            {{ clientInfo.address }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            BARRIO:
          </div>
          <div class="info-value">
            {{ clientInfo.neighborhood }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            CELULAR:
          </div>
          <div class="info-value">
            {{ clientInfo.phone }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            ESTRATO:
          </div>
          <div class="info-value">
            {{ clientInfo.stratum }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            INTERNET HOGAR:
          </div>
          <div class="info-value">
            {{ clientInfo.offer.plan.name }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            EQUIPO EN COMODATO:
          </div>
          <div class="info-value">
            {{ clientInfo.tickettype }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            TIPO:
          </div>
          <div class="info-value">
            {{ clientInfo.technology.name }}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">
            IDENTIFICACION MAC:
          </div>
          <div class="info-value"></div>
        </div>
      </div>

      <!-- Technical Recommendations Section -->
      <div class="intro-text text-center mt-4">
        Para garantizar la calidad en la prestacion del servicio, es necesario tener en cuenta las siguientes recomendaciones técnicas.
      </div>

      <div class="section-title mt-4">
        RECOMENDACIONES TECNICAS
      </div>

      <div class="recommendations-section">
        <p>1. No comparta su contraseña con nadie. (puede ser victima de fraude y/o robo de sus datos personales e informacion)</p>
        <p>2. Evite desconectar o manipular cables y dispositivos.</p>
        <p>3. No intente entrar al dispositivo (Router) por medio de la interfaz para cambiar contraseñas o protocolos establecidos por la empresa.</p>
        <p>4. Desconecte la fuente electrica (cargador) del dispositivo (router) en caso de tormenta, para evitar que descargas electricas dañen el equipo.</p>
      </div>

      <!-- Service Request Section -->
      <div class="section-title mt-4">
        LLAME LINEA DE ATENCION Y SOLICITE UN SERVICIO TECNICO EN LOS SIGUIENTES CASOS:
      </div>

      <div class="service-request-section">
        <p>1. Si su servicio es por fibra optica y el dispositivo emite una luz de color rojo en el led LOS</p>
        <p>2. Si por manipulacion o accidente el cable UTP o Fibra optica es cortada o presenta deterioro.</p>
        <p>3. Si su servicio presenta lentitud en la navegacion. (no intente entrar al router)</p>
        <p>4. Si su dispositivo no enciende</p>
        <p>6. Si requiere cambiar de lugar su dispositivo. (Puede tener costo adicional)</p>
        <p>7. Si necesita cambiar la contraseña.</p>
      </div>

      <!-- Reminder Section -->
      <div class="reminder-text text-center mt-4">
        <strong>Recuerde que la calidad del servicio depende tambien del cuidado y buen uso del dispositivo</strong>
      </div>

      <!-- Contact Information Section -->
      <div class="section-title mt-4">
        LINEA DE ATENCION: {{ clientInfo.company.phone }}
      </div>

      <!-- Signature Section -->
      <div class="signature-section mt-5">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">
            CLIENTE
          </div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">
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
  max-width: 21cm;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  padding: 15px;
}

/* Header Section */
.header-section {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
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
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.date-container {
  text-align: right;
}

.document-date {
  color: #555;
  font-size: 0.9rem;
  margin: 0;
}

/* Section Titles */
.section-title {
  background-color: rgb(0, 176, 240);
  color: white;
  font-weight: bold;
  text-align: center;
  padding: 6px;
  margin: 15px 0 10px 0;
  font-size: 0.9rem;
  border-radius: 2px;
}

/* Client Information Grid */
.client-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.info-row {
  display: grid;
  grid-template-columns: 30% 70%;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  background-color: #f9f9f9;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 4px 12px;
  border-right: 1px solid #f0f0f0;
}

.info-value {
  padding: 4px 12px;
  font-size: 0.85rem;
}

/* Text Sections */
.intro-text, .reminder-text {
  font-size: 0.9rem;
  padding: 0 15px;
  color: #555;
}

/* Recommendation Sections */
.recommendations-section, .service-request-section, .contact-section {
  padding: 10px 15px;
}

.recommendations-section p, .service-request-section p, .contact-section p {
  font-size: 0.85rem;
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Signature Section */
.signature-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 15px;
}

.signature-block {
  text-align: center;
}

.signature-line {
  border-bottom: 1px solid #333;
  margin-bottom: 5px;
  padding-top: 40px;
}

.signature-label {
  font-weight: 600;
  font-size: 0.9rem;
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
    padding: 0;
  }
}
</style>
