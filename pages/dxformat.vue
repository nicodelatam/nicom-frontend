<template>
  <div v-if="services">
    <v-card class="printme">
      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col cols="2" style="border: 1px solid grey;" class="align-center justify-center printme">
              <MainLogoDark />
            </v-col>
            <v-col cols="5" :style="clienttype === 'INTERNET' ? 'border: 1px solid grey;background-color:#ffbfbf;' : 'border: 1px solid grey;background-color:#c9bfff;'" class="d-flex align-center justify-center">
              <h2 class="printme">
                Agenda Desconexiones {{ $route.query.clienttype }}
              </h2>
            </v-col>
            <v-col cols="5" style="border: 1px solid grey;" class="d-flex align-center justify-center">
              <v-row>
                <v-col cols="5" class="text-center" style="border-right: 1px solid grey;">
                  <h3>Fecha: ______ de {{ getDate(new Date()) }}</h3>
                </v-col>
                <v-col cols="7" class="justify-center align-center d-flex">
                  <h3 style="color:#c9c9c9;">
                    Tecnico/s
                  </h3>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row class="mt-5">
            <div v-if="services && services.length === 0" class="w-100 text-center pa-4">
              <h3 style="color:#c9c9c9;">
                No hay servicios para mostrar en la agenda
              </h3>
            </div>
            <div
              v-for="item in services"
              :key="item.id || item.code"
              class="parent"
            >
              <span>
                {{ item.code || 'N/A' }}
              </span>
              <span>
                {{ getClientName(item) }}
              </span>
              <span>
                {{ item.address || 'Sin dirección' }}
              </span>
              <span>
                {{ item.neighborhood || 'Sin barrio' }}
              </span>
              <span>
                {{ getClientPhone(item) }}
              </span>
              <span style="color:#c9c9c9;">
                OBSERVACIONES
              </span>
            </div>
          </v-row>
          <v-row class="mt-3 justify-center" style="border: 1px solid grey;">
            Agenda de desconexiones por mora generada por {{ getUserDisplayName() }} el {{ getDateLog(new Date()) }}
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
export default {
  name: 'PrintDx',
  layout: 'print',
  data () {
    return {
      modal: false,
      technician: null,
      technicians: [],
      services: [],
      clienttype: ''
    }
  },
  mounted () {
    this.$vuetify.theme.dark = false
    this.getServicesDx()
    this.servicesDxClienttype()
  },
  methods: {
    getServicesDx () {
      try {
        if (localStorage.getItem('servicesDx')) {
          const servicesData = JSON.parse(localStorage.getItem('servicesDx'))
          this.services = Array.isArray(servicesData) ? servicesData : []
        } else {
          this.services = []
        }
      } catch (error) {
        console.error('Error al cargar servicios desde localStorage:', error)
        this.services = []
        // Limpiar localStorage corrupto
        localStorage.removeItem('servicesDx')
      }
    },
    servicesDxClienttype () {
      try {
        if (localStorage.getItem('servicesDxClienttype')) {
          this.clienttype = JSON.parse(localStorage.getItem('servicesDxClienttype'))
        } else {
          this.clienttype = this.$route.query.clienttype || 'SERVICIOS'
        }
      } catch (error) {
        console.error('Error al cargar tipo de cliente desde localStorage:', error)
        this.clienttype = this.$route.query.clienttype || 'SERVICIOS'
        // Limpiar localStorage corrupto
        localStorage.removeItem('servicesDxClienttype')
      }
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      return humanDateFormat
    },
    getDateLog (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
      return humanDateFormat
    },
    getUserDisplayName () {
      try {
        // Verificar si existe el store de auth y el usuario
        if (!this.$store.state.auth) {
          return 'Usuario no identificado'
        }

        // Intentar obtener username de diferentes posibles ubicaciones
        const username = this.$store.state.auth.username ||
                        this.$store.state.auth.user?.username ||
                        this.$store.state.auth.name ||
                        this.$store.state.auth.user?.name

        if (!username) {
          return 'Usuario no identificado'
        }

        // Capitalizar la primera letra de forma segura
        if (typeof username === 'string' && username.length > 0) {
          return username.charAt(0).toUpperCase() + username.slice(1)
        }

        return username.toString()
      } catch (error) {
        console.error('Error al obtener nombre de usuario:', error)
        return 'Usuario no identificado'
      }
    },
    getClientName (item) {
      try {
        // Intentar obtener el nombre del cliente de diferentes ubicaciones posibles
        return item.normalized_client?.name ||
               item.client_name ||
               item.name ||
               'Sin nombre'
      } catch (error) {
        console.error('Error al obtener nombre del cliente:', error)
        return 'Sin nombre'
      }
    },
    getClientPhone (item) {
      try {
        // Intentar obtener el teléfono del cliente de diferentes ubicaciones posibles
        return item.normalized_client?.phone ||
               item.phone ||
               'Sin teléfono'
      } catch (error) {
        console.error('Error al obtener teléfono del cliente:', error)
        return 'Sin teléfono'
      }
    }
  },
  head () {
    return {
      title: 'Agenda Desconexiones ' + this.clienttype
    }
  }
}
</script>
<style scoped>
@media print {
  * {
  -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page { margin: 0; }
  .no-printme {
    display: none !important;
  }
  .printme {
    display: block !important;
  }
}
.parent {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 3fr 2fr 2fr 2fr 4fr;
  grid-gap: 0px;
}
.parent > span {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: .6rem;
  padding: 0 0;
  border: 1px solid grey;
}
</style>
