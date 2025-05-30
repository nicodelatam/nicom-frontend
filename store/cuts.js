export const state = () => ({
  applyOffer: false,
  billingPeriod: null,
  billingPeriodMovements: [],
  services: [],
  servicesByPlan: [],
  cutErrors: [],
  cuts: [],
  e1: '1',
  errors: 0,
  isindebt: 0,
  inprocess: false,
  kick: false,
  loading: false,
  month: null,
  year: null,
  offer: null,
  offerForBulkProcess: null,
  plans: [],
  prepare: false,
  ready: [],
  type: null,
  validServices: [],
  currentBillingPeriod: null,
  servicesData: {
    services: [],
    minimumBalance: 0,
    totalBalance: 0
  }
})
export const mutations = {
  currentBillingPeriod (state, currentBillingPeriod) {
    state.currentBillingPeriod = currentBillingPeriod
  },
  clear (state) {
    state.applyOffer = false
    state.usePlan = false
    state.billingPeriod = null
    state.billingPeriodMovements = []
    state.services = []
    state.servicesByPlan = []
    state.cutErrors = []
    state.cuts = []
    state.e1 = '1'
    state.errors = 0
    state.inprocess = false
    state.kick = false
    state.loading = false
    state.month = null
    state.offer = null
    state.offerForBulkProcess = null
    state.plans = []
    state.prepare = false
    state.ready = []
    state.type = null
    state.validServices = []
    state.servicesData = {
      services: [],
      minimumBalance: 0,
      totalBalance: 0
    }
  },
  e1 (state, e1) {
    state.e1 = e1
  },
  usePlan (state, usePlan) {
    state.usePlan = usePlan
  },
  setMonth (state, month) {
    state.month = month
  },
  setYear (state, year) {
    state.year = year
  },
  setOfferForBulkProcess (state, offer) {
    state.offerForBulkProcess = offer
  },
  setType (state, type) {
    state.type = type
  },
  setCodes (state, codes) {
    state.ready = codes
  },
  addService (state, services) {
    state.services.push(services)
  },
  addValidService (state, services) {
    state.validServices.push(services)
  },
  addCut (state, cuts) {
    state.cuts.push({ success: true, ...cuts.service })
  },
  addCutError (state, erroredService) {
    state.cutErrors = erroredService
  },
  addCutInDebt (state, cuts) {
    state.isindebt.push(cuts.service)
  },
  reset (state) {
    state.services = []
  },
  resetcuts (state) {
    state.cuts = []
  },
  resetvalid (state) {
    state.validServices = []
  },
  loading (state, loading) {
    state.loading = loading
  },
  adderror (state) {
    state.errors = state.errors + 1
  },
  reseterror (state) {
    state.errors = 0
  },
  kick (state, kick) {
    state.kick = kick
  },
  prepare (state, prepare) {
    state.prepare = prepare
  },
  applyOffer (state, applyOffer) {
    state.applyOffer = applyOffer
  },
  offer (state, offer) {
    state.offer = offer
  },
  getBillingPeriod (state, billingPeriod) {
    state.billingPeriod = billingPeriod
  },
  getBillingPeriodMovements (state, billingPeriodMovements) {
    state.billingPeriodMovements = billingPeriodMovements
  },
  getPlans (state, plans) {
    state.plans = plans
  },
  getServicesByPlan (state, services) {
    state.servicesByPlan = services
  },
  setServicesData (state, servicesData) {
    state.servicesData = servicesData
  }
}
export const actions = {
  beginServerSideProcess ({ commit }, payload) {
    try {
      fetch(`${this.$config.API_STRAPI_ENDPOINT}serversidecuts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.token}`
        },
        body: JSON.stringify({
          data: {
            city: payload.city,
            kick: payload.kick,
            services: payload.services,
            currentBillingPeriod: payload.currentBillingPeriod,
            billingmonth: payload.billingmonth,
            billingyear: payload.billingyear,
            operator: payload.operator
          }
        })
      })
        .then(res => res.json())
        .then((response) => {
          if (response.status === 'ok') {
            this.$toast.info('Proceso iniciado.', { duration: 4000, position: 'bottom-center' })
          }
        })
    } catch (error) {
      throw new Error(`SERVER SIDE CUTS INITIATOR ${error}`)
    }
  },
  getServicesByPlan ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          $and: [
            { plan: payload.plan },
            { city: { name: payload.city } }
          ]
        },
        pagination: {
          pageSize: 10000
        },
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.token}`
        }
      })
        .then(res => res.json())
        .then(({ data: services }) => {
          commit('getServicesByPlan', services)
        })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  getPlans ({ commit }, payload) {
    fetch(`${this.$config.API_STRAPI_ENDPOINT}plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payload.token}`
      }
    })
      .then(res => res.json())
      .then((plans) => {
        commit('getPlans', plans.data)
      })
  },
  retireService ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services/${payload.service.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              active: payload.active,
              indebt: payload.indebt
            }
          })
        })
          .then(res => res.json())
          .then(({ data: service }) => {
            resolve(service)
          })
      })
    } catch (error) {
      throw new Error(`RETIRE SERVICE ACTION ${error}`)
    }
  },
  updateBillingPeriodAndDebt ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services/${payload.service.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              billingmonth: payload.billingmonth,
              billingyear: payload.billingyear,
              indebt: payload.indebt
            }
          })
        })
          .then(res => res.json())
          .then((billingperiod) => {
            resolve(billingperiod)
          })
      })
    } catch (error) {
      throw new Error(`UPDATE BILLING PERIOD ON SERVICE ACTION ${error}`)
    }
  },
  getServicesByBillingPeriod ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          $and: [
            { clienttype: { name: payload.clienttype } },
            { city: { name: payload.city } },
            { billingmonth: payload.month },
            { billingyear: payload.year },
            { indebt: payload.indebt },
            { active: payload.active }
          ]
        },
        pagination: {
          pageSize: 500
        },
        populate: [
          'normalized_client',
          'service_addresses',
          'service_addresses.neighborhood'
        ],
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: services }) => {
            resolve(services)
          })
      })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  getBillingPeriod ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          city: {
            name: payload.city
          }
        },
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then((billingperiod) => {
            if (billingperiod.data.length > 0) {
              resolve(billingperiod)
              commit('getBillingPeriod', billingperiod.data[0])
            } else {
              commit('getBillingPeriod', { name: 'default', createdAt: Date.now() })
              resolve({ name: 'default', createdAt: Date.now() })
            }
          })
      })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  getBillingPeriodMovements ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          isindebt: true,
          service: {
            city: {
              name: payload.city
            }
          },
          createdAt: {
            $gte: payload.billingPeriod.createdAt
          }
        },
        populate: ['service', 'service.service_addresses', 'service.service_addresses.neighborhood', 'service.debtmovements'],
        pagination: {
          pageSize: 1000
        },
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}debtmovements?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then((debtmovements) => {
            const movements = []
            debtmovements.data.map((movement) => {
              if (movement.service.debtmovements.at(-1).isindebt) {
                movements.push(movement)
                return movement
              }
            })
            commit('getBillingPeriodMovements', movements)
            resolve(movements)
          })
      })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  addBillingPeriod ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              name: payload.name,
              city: payload.city,
              month: payload.month,
              year: payload.year
            }
          })
        })
          .then(res => res.json())
          .then(({ data: billingperiod }) => {
            this.$toast.info('Periodo de corte actualizado.', { duration: 4000, position: 'bottom-center' })
            resolve(billingperiod)
          })
      })
    } catch (error) {
      throw new Error(`ADD BILLING PERIOD ACTION ${error}`)
    }
  },
  getBillingPeriods ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          city: {
            name: payload.city
          }
        },
        pagination: {
          pageSize: 12
        },
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then((billingperiods) => {
            resolve(billingperiods.data)
          })
      })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  prepareServices ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          code: payload.ready,
          city: {
            name: payload.city
          }
        },
        populate: ['service_addresses', 'service_addresses.neighborhood', 'normalized_client', 'plan', 'offer', 'debtmovements'],
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: services }) => {
            services.valid = true
            if (services.length === 1) {
              for (let i = 0; i < services.length; i++) {
                if (services[i].normalized_client) {
                  commit('addService', { valid: true, ...services[i] })
                  commit('addValidService', services[i])
                  resolve({ valid: true, ...services[i] })
                } else {
                  const notfound = {
                    valid: false,
                    code: payload.ready,
                    name: 'Servicio no encontrado'
                  }
                  commit('addService', notfound)
                  commit('adderror')
                  resolve(notfound)
                }
              }
            } else if (services.length > 1) {
              commit('addService', { valid: true, ...services[0] })
              commit('addValidService', services[0])
              resolve({ valid: true, ...services[0] })
            } else {
              const notfound = {
                valid: false,
                code: payload.ready,
                name: 'Servicio no encontrado'
              }
              commit('addService', notfound)
              commit('adderror')
              resolve(notfound)
            }
          })
      })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  getLastBillingPeriod ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          city: {
            name: payload.city.name
          }
        },
        pagination: {
          pageSize: 1
        },
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: lastBillingPeriod }) => {
            resolve(lastBillingPeriod)
          })
      })
    } catch (error) {
      throw new Error(`LAST DEBT HISTORY ACTION ${error}`)
    }
  },
  getServicesByBalance ({ commit }, payload) {
    try {
      const qs = require('qs')

      // Construir filtros dinámicamente - removemos el filtro de balance obsoleto
      const filters = {
        $and: [
          {
            city: { name: payload.city }
          },
          {
            clienttype: { name: payload.clienttype }
          }
        ]
      }

      // Filtrar por empresa para evitar mezclar clientes de diferentes empresas
      if (payload.company) {
        filters.$and.push({
          company: { name: payload.company }
        })
      }

      // Por defecto, solo mostrar servicios activos
      // Los servicios activos pueden tener saldo pendiente y ser candidatos a corte
      // No importa si ya están marcados como indebt o no
      filters.$and.push({
        active: true // Solo servicios activos (no retirados)
      })

      // Si no se incluyen cortados, filtrar solo los que no están ya en mora
      if (!payload.incluirCortados) {
        filters.$and.push({
          indebt: false // Solo servicios sin marca de mora previa
        })
      }

      // Agregar filtros adicionales si están definidos
      if (payload.filters) {
        if (payload.filters.stratum) {
          filters.$and.push({
            stratum: payload.filters.stratum
          })
        }

        if (payload.filters.neighborhood) {
          filters.$and.push({
            neighborhood: {
              $containsi: payload.filters.neighborhood
            }
          })
        }

        if (payload.filters.monthsInDebt) {
          // Calcular período de facturación basado en meses de mora
          const currentDate = new Date()
          const targetMonth = currentDate.getMonth() + 1 - parseInt(payload.filters.monthsInDebt)
          const targetYear = targetMonth <= 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()
          const adjustedMonth = targetMonth <= 0 ? 12 + targetMonth : targetMonth

          filters.$and.push({
            billingmonth: adjustedMonth
          })
          filters.$and.push({
            billingyear: targetYear
          })
        }
      }

      const query = qs.stringify({
        filters,
        pagination: {
          pageSize: 1000
        },
        populate: [
          'normalized_client',
          'service_addresses',
          'service_addresses.neighborhood',
          'plan',
          'offer',
          'invoices'
        ],
        sort: 'code:asc'
      },
      {
        encodeValuesOnly: true
      })

      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: services }) => {
            // Calcular saldo real desde facturas no pagadas
            let filteredServices = services.map((service) => {
              // Calcular balance real desde invoices no pagadas
              const unpaidInvoices = service.invoices?.filter(invoice =>
                invoice.payed === false && invoice.balance > 0
              ) || []
              const realBalance = unpaidInvoices.reduce((sum, invoice) =>
                sum + (invoice.balance || 0), 0
              )

              return {
                ...service,
                balance: realBalance, // Reemplazar con el balance calculado
                unpaidInvoicesCount: unpaidInvoices.length,
                invoices: unpaidInvoices // Solo mantener las facturas no pagadas
              }
            })

            // Filtrar servicios que realmente tengan el balance mínimo requerido
            filteredServices = filteredServices.filter(service =>
              service.balance >= payload.minimumBalance
            )

            // Aplicar filtro de saldo máximo si está definido
            if (payload.filters && payload.filters.maxBalance) {
              filteredServices = filteredServices.filter(service =>
                service.balance <= payload.filters.maxBalance
              )
            }

            // Ordenar por balance descendente
            filteredServices.sort((a, b) => b.balance - a.balance)

            // Agregar información de estado usando la lógica correcta del negocio
            filteredServices = filteredServices.map((service) => {
              let estadoCorte
              if (service.active && !service.indebt) {
                estadoCorte = 'disponible' // Activo, sin marca de mora, candidato a corte
              } else if (service.active && service.indebt) {
                estadoCorte = 'en_mora' // Activo pero ya marcado como moroso
              } else if (!service.active) {
                estadoCorte = 'retirado' // Retirado del servicio
              } else {
                estadoCorte = 'desconocido'
              }

              return {
                ...service,
                estadoCorte,
                fechaUltimaActualizacion: service.updatedAt
              }
            })

            resolve(filteredServices)
          })
          .catch((error) => {
            reject(new Error(`Error al obtener servicios por balance: ${error.message}`))
          })
      })
    } catch (error) {
      throw new Error(`GET SERVICES BY BALANCE ACTION ${error}`)
    }
  },
  createBillingPeriodWithBalance ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              name: `${payload.name} - Balance ≥ ${payload.minimumBalance}`,
              city: payload.cityId,
              clienttype: payload.clienttypeId,
              month: payload.month,
              year: payload.year,
              errors: 0,
              errorList: '',
              successes: payload.servicesCount,
              finished: false,
              processType: 'balance',
              minimumBalance: payload.minimumBalance,
              totalBalance: payload.totalBalance,
              averageBalance: Math.round(payload.totalBalance / payload.servicesCount),
              servicesCodes: payload.servicesCodes.join(',')
            }
          })
        })
          .then(res => res.json())
          .then((response) => {
            if (response.data) {
              this.$toast.success('Período de corte por balance creado exitosamente')
              resolve(response.data)
            } else {
              reject(new Error(`Error en respuesta del servidor: ${JSON.stringify(response.error || response)}`))
            }
          })
          .catch((error) => {
            reject(new Error(`Error al crear período de corte: ${error.message}`))
          })
      })
    } catch (error) {
      throw new Error(`CREATE BILLING PERIOD WITH BALANCE ACTION ${error}`)
    }
  },
  updateBillingPeriodMetrics ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods/${payload.billingPeriodId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              errors: payload.errors,
              errorList: payload.errorList,
              successes: payload.successes,
              finished: payload.finished
            }
          })
        })
          .then(res => res.json())
          .then(({ data: billingperiod }) => {
            resolve(billingperiod)
          })
          .catch((error) => {
            reject(new Error(`Error al actualizar métricas: ${error.message}`))
          })
      })
    } catch (error) {
      throw new Error(`UPDATE BILLING PERIOD METRICS ACTION ${error}`)
    }
  },
  getAdvancedBillingPeriodStats ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          city: {
            name: payload.city
          },
          clienttype: {
            name: payload.clienttype
          }
        },
        pagination: {
          pageSize: 24 // últimos 2 años
        },
        populate: ['city', 'clienttype'],
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })

      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: billingperiods }) => {
            // Calcular estadísticas avanzadas con todos los campos disponibles
            const stats = {
              totalPeriods: billingperiods.length,
              finishedPeriods: billingperiods.filter(bp => bp.finished).length,
              totalServices: billingperiods.reduce((sum, bp) => sum + (bp.successes || 0), 0),
              totalErrors: billingperiods.reduce((sum, bp) => sum + (bp.errors || 0), 0),
              totalBalance: billingperiods.reduce((sum, bp) => sum + (bp.totalBalance || 0), 0),
              averageServicesPerPeriod: billingperiods.length > 0
                ? Math.round(billingperiods.reduce((sum, bp) => sum + (bp.successes || 0), 0) / billingperiods.length) : 0,
              lastPeriod: billingperiods[0] || null,
              balanceProcesses: billingperiods.filter(bp => bp.processType === 'balance').length,
              manualProcesses: billingperiods.filter(bp => bp.processType !== 'balance' || !bp.processType).length
            }

            resolve({
              billingperiods,
              stats
            })
          })
          .catch((error) => {
            reject(new Error(`Error al obtener estadísticas avanzadas: ${error.message}`))
          })
      })
    } catch (error) {
      throw new Error(`GET ADVANCED BILLING PERIOD STATS ACTION ${error}`)
    }
  },
  checkExistingBillingPeriod ({ commit }, payload) {
    try {
      const qs = require('qs')

      // Construir filtros dinámicamente
      const filters = {
        $and: [
          {
            city: {
              name: payload.city
            }
          },
          {
            clienttype: {
              name: payload.clienttype
            }
          },
          {
            month: payload.month
          },
          {
            year: payload.year
          },
          {
            processType: payload.processType || 'balance'
          }
        ]
      }

      // Agregar filtro de empresa si está disponible
      // Nota: Solo agregar si el modelo billingperiod tiene relación con company
      if (payload.company) {
        filters.$and.push({
          company: {
            name: payload.company
          }
        })
      }

      const query = qs.stringify({
        filters,
        populate: ['city', 'clienttype', 'company'],
        sort: 'createdAt:desc'
      },
      {
        encodeValuesOnly: true
      })

      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}billingperiods?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`)
            }
            return res.json()
          })
          .then((response) => {
            // Manejar diferentes estructuras de respuesta de Strapi
            const existingPeriods = response.data || response || []

            resolve({
              exists: Array.isArray(existingPeriods) && existingPeriods.length > 0,
              periods: existingPeriods,
              latest: Array.isArray(existingPeriods) && existingPeriods.length > 0 ? existingPeriods[0] : null
            })
          })
          .catch((error) => {
            console.error('Error en checkExistingBillingPeriod:', error)
            // En caso de error, asumir que no existen períodos previos para permitir continuar
            resolve({
              exists: false,
              periods: [],
              latest: null
            })
          })
      })
    } catch (error) {
      console.error('Error en checkExistingBillingPeriod (catch):', error)
      // En caso de error, retornar valores seguros
      return Promise.resolve({
        exists: false,
        periods: [],
        latest: null
      })
    }
  }
}
export const getters = {
  serviciosDisponibles: (state) => {
    return state.servicesData.services.filter(service => service.estadoCorte === 'disponible')
  },
  serviciosEnMora: (state) => {
    return state.servicesData.services.filter(service => service.estadoCorte === 'en_mora')
  },
  serviciosRetirados: (state) => {
    return state.servicesData.services.filter(service => service.estadoCorte === 'retirado')
  },
  totalServicios: (state) => {
    return state.servicesData.services.length
  }
}
