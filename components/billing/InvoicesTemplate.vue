<template>
  <v-card v-if="invoices.length > 0 && service" class="elevation-0 inner p-0" style="border:1px solid black;" light>
    <v-container class="parent p-0">
      <div class="client-parent">
        <div style="width:200px;margin:auto;">
          <!-- <MainLogoDark /> -->
        </div>
        <div style="width:100%;text-align:center;text-align:center;">
          <h5>TV POR CABLE</h5>
          <h5></h5>
          <h5></h5>
        </div>
      </div>
      <div class="sub-parent">
        <div style="text-align:center;">
          <h4 style="border:1px solid black;border-radius:0;" class="pa-1">
            FACTURAS PENDIENTES
          </h4>
          <h4 style="border:1px solid black;border-radius:0px;" class="pa-1">
            {{ service.id }}
          </h4>
          <h4 style="border:1px solid black;border-radius:0;" class="pa-1">
            CODIGO: {{ service.code }}
          </h4>
        </div>
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="background-color:rgb(0,176,240);color:white;font-weight:bold;grid-column: span 8" class="text-center">
        DATOS PERSONALES DEL USUARIO
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 4" class="text-center">
        NOMBRES Y APELLIDOS
      </div>
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 2" class="text-center">
        NO. DOCUMENTO
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;font-weight:bold;grid-column: span 2" class="text-center">
        SERVICIO
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;grid-column: span 4" class="text-center">
        {{ service.client_name }}
      </div>
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;grid-column: span 2" class="text-center">
        {{ service.dni }}
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;grid-column: span 2" class="text-center">
        {{ service.offer.name }}
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 2" class="text-center">
        DIRECCION DE DOMICILIO
      </div>
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 2" class="text-center">
        BARRIO
      </div>
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 2" class="text-center">
        ID DEL USUARO
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;font-weight:bold;grid-column: span 2" class="text-center">
        CELULAR
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;grid-column: span 2" class="text-center">
        {{ service.address }}
      </div>
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;grid-column: span 2" class="text-center">
        {{ service.neighborhood }}
      </div>
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;grid-column: span 2" class="text-center">
        CODIGO: {{ service.code }}
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;grid-column: span 2" class="text-center">
        {{ service.phone }}
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 4" class="text-center">
        CORREO ELECTRONICO
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;font-weight:bold;grid-column: span 4" class="text-center">
        PLAN CONTRATADO
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;grid-column: span 4" class="text-center">
        {{ service.normalized_client.email }}
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;grid-column: span 4" class="text-center">
        {{ service.offer.name }}
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="background-color:rgb(0,176,240);color:white;font-weight:bold;grid-column: span 8" class="text-center">
        CONCEPTOS POR PAGAR
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="border-bottom:1px solid black;border-right:1px solid black;border-radius:0;font-weight:bold;grid-column: span 4" class="text-center">
        <h3 class="px-2">
          PAGO TOTAL: $ {{ Number(invoices.reduce((total, item) => {
            if (item.payed) {
              return total
            } else {
              return total + item.balance
            }
          }, 0)).toLocaleString('es') }}
        </h3>
        <h4
          v-for="invoice in invoices"
          :key="invoice.id"
        >
          FACTURA {{ invoice.details }} {{ invoice.year }} $ {{ Number(invoice.balance).toLocaleString('es') }}
        </h4>
      </div>
      <div style="border-bottom:1px solid black;border-radius:0;font-weight:bold;grid-column: span 4" class="justify-center d-flex align-center">
        FECHA LIMITE 5 de {{ nextDate }}
      </div>
    </v-container>
    <v-container class="parent-info pa-0">
      <div style="font-weight:bold;grid-column: span 4" class="text-center" />
      <div style="font-weight:bold;grid-column: span 4" class="text-center">
      </div>
      <div style="grid-column: span 4; grid-offset: 4;" />
      <div style="font-weight:bold;grid-column: span 4; grid-offset: 4;" class="text-center">
        CORREO ELECTRONICO
      </div>
      <div style="grid-column: span 4; grid-offset: 4;" class="text-center" />
      <div style="font-weight:bold;grid-column: span 4; grid-offset: 4;" class="text-center">
      </div>
    </v-container>
  </v-card>
</template>
<script>
export default {
  props: {
    invoices: {
      type: Array,
      default: () => []
    },
    service: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      nextDate: '',
      months: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
      ]
    }
  },
  mounted () {
    this.getNextMonth()
  },
  methods: {
    getNextMonth () {
      const date = new Date()
      const month = date.getMonth()
      if (month === 12) {
        this.nextDate = this.months[0]
        return
      }
      const nextMonth = month + 1
      this.nextDate = this.months[nextMonth]
    },
    getDate (date) {
      const dateObject = new Date(date)
      const humanDateFormat = dateObject.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
      return humanDateFormat
    }
  }
}
</script>
<style scoped>
  .parent {
    display: grid;
    grid-template-columns: 10fr 5fr;
    grid-gap: 10px;
    align-items: flex-end;
  }
  .parent-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  }

  .sub-parent {
    display: grid;
    grid-template-columns: 1fr;
    place-items:center;
    justify-items: stretch;
  }

  .client-parent {
    display:grid;
    grid-template-columns: 1fr;
    grid-gap: 10px;
  }
  .client-parent-sub {
    padding: 10px 0 10px 10px;
    margin-top: 50px;
  }
  .pagado {
    margin-left:20px;
    color: red;
    font-weight: bold;
    font-size: 20px;
    padding: 10px;
    border: 1px solid red;
    border-radius: 10px;
  }
  .abono {
    margin-left:20px;
    color: blue;
    font-weight: bold;
    font-size: 20px;
    padding: 10px;
    border: 1px solid blue;
    border-radius: 10px;
  }
</style>
