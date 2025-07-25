export const state = () => ({
  client: null,
  activeServices: [],
  selectedServices: [], // New state for selected services
  currentService: null,
  e1: 1,
  invoices: [],
  legalNotes: [],
  billsOnDataRange: [],
  sendIndex: 0,
  billsForCurrentService: [],
  total: 0,
  month: null,
  year: null,
  headers: [],
  selected: [],
  resetSelected: 0,
  refresh: 1,
  showPayed: false,
  limit: null
})
export const mutations = {
  e1 (state, payload) {
    state.e1 = payload.e1
  },
  messageSent (state, payload) {
    state.activeServices[payload.index].messageSent = payload.success
  },
  addInvoice (state, payload) {
    state.activeServices[payload.index].invoices.push(payload.invoice)
  },
  setYear (state, payload) {
    state.year = payload.year
  },
  setMonth (state, payload) {
    state.month = payload.month
  },
  setLimit (state, payload) {
    state.limit = payload.limit
  },
  refresh (state) {
    state.refresh++
  },
  editBill (state, payload) {
    state.billingInfo.bills[payload.index].payed = payload.payed
    state.billingInfo.bills[payload.index].details = payload.details
  },
  addDeposit (state, payload) {
    state.billingInfo.bills[payload.index].deposits.push({
      id: 3,
      amount: payload.amount,
      details: payload.details,
      createdAt: payload.createdAt
    })
  },
  getCurrentMonth (state) {
    const date = new Date()
    const month = date.getMonth() + 1
    state.month = month
  },
  togglePayed (state, _) {
    state.showPayed = !state.showPayed
  },
  setBillingInfo (state, billingInfo) {
    state.billingInfo = billingInfo
  },
  setSelected (state, selected) {
    state.selected = selected
  },
  resetSelected (state) {
    state.selected = []
    state.resetSelected++
  },
  resetInvoices (state) {
    state.invoices = []
    state.legalNotes = []
  },
  resetCurrentClient (state) {
    state.currentClient = null
  },
  resetActiveClients (state) {
    state.activeClients = []
  },
  resetDate (state) {
    state.month = null
    state.year = null
  },
  setTotal (state, total) {
    state.total = total
  },
  setShowPayedToFalse (state) {
    state.showPayed = false
  },
  getBillsByDateRange (state, bills) {
    try {
      state.billsOnDataRange = bills
    } catch (error) {
      throw new Error(`BILLING CLIENTS MUTATE ${error}`)
    }
  },
  setPaginationForBillsByDateRange (state, pagination) {
    try {
      state.billsOnDataRangePagination = pagination
    } catch (error) {
      throw new Error(`BILLING CLIENTS MUTATE ${error}`)
    }
  },
  createInvoice (state, movement) {
    state.billingInfo.movements.push({
      id: state.billingInfo.movements.length + 1,
      amount: movement.amount,
      details: movement.details,
      type: movement.billtype.name,
      date: new Date()
    })
  },
  addDiscountMovement (state, movement) {
    state.billingInfo.movements.push({
      id: state.billingInfo.movements.length + 1,
      amount: movement.amount,
      for: movement.for,
      billingMonth: movement.billingMonth,
      details: movement.details,
      type: 'RECAUDO',
      date: new Date()
    })
  },
  getBillsByServiceId (state, bills) {
    try {
      state.billsForCurrentService = []
      state.billsForCurrentService = bills
    } catch (error) {
      throw new Error(`BILLING SERVICE MUTATE ${error}`)
    }
  },
  getClientsBySearch (state, clients) {
    try {
      state.client = clients
    } catch (error) {
      throw new Error(`BILLING CLIENTS SEARCH MUTATE ${error}`)
    }
  },
  getHeadersByClientType (state, headers) {
    try {
      state.headers = headers
    } catch (error) {
      throw new Error(`GET BILLING HEADERS BY CLIENT TYPE MUTATE ${error}`)
    }
  },
  getBillingInfoByServiceId (state, data) {
    state.currentService = data.service
    state.invoices = data.invoices
    state.legalNotes = data.legalNotes
  },
  getListOfActiveServices (state, services) {
    try {
      state.activeServices = services
    } catch (error) {
      throw new Error(`GET LIST OF ACTIVE SERVICES MUTATE ${error}`)
    }
  },
  resetListOfActiveServices (state, clients) {
    try {
      state.activeServices = []
    } catch (error) {
      throw new Error(`GET LIST OF ACTIVE SERVICES MUTATE ${error}`)
    }
  },
  setSelectedServices (state, services) {
    state.selectedServices = services
  },
  resetSelectedServices (state) {
    state.selectedServices = []
  }
}
export const actions = {
  createInvoice ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              balance: payload.balance,
              value: payload.value,
              month: payload.month,
              year: payload.year,
              type: payload.type,
              offer: payload.offer,
              concept: payload.concept,
              details: payload.details,
              payed: payload.payed,
              partial: payload.partial,
              indebt: payload.indebt,
              service: payload.service,
              invoice_type: payload.invoice_type,
              limit: payload.limit ? payload.limit : null,
              image_path: payload.image_path ? payload.image_path : null
            }
          })
        })
          .then(res => res.json())
          .then(({ data: invoice }) => {
            resolve(invoice)
          })
      })
    } catch (error) {
      throw new Error(`UPDATE BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  getBalancesInFavor (_, payload) {
    try {
      return new Promise((resolve, reject) => {
        const qs = require('qs')
        const query = qs.stringify({
          filters: {
            service: payload.serviceId,
            concept: 'ADELANTO'
          }
        },
        {
          encodeValuesOnly: true
        })
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: balancesInFavor }) => {
            resolve(balancesInFavor)
          })
      })
    } catch (error) {
      throw new Error(`GET BALANCE IN FAVOR ACTION ${error}`)
    }
  },
  setNewBalanceInFavor (_, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}credit-balances/${payload.balanceInFavorId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              amount: payload.newBalance
            }
          })
        })
          .then(res => res.json())
          .then(({ data: service }) => {
            resolve(service)
          })
      })
    } catch (error) {
      throw new Error(`SET BALANCE IN FAVOR ACTION ${error}`)
    }
  },
  getInvoiceTypes ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoice-types`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then((invoiceTypes) => {
            localStorage.setItem('invoiceTypes', JSON.stringify(invoiceTypes.data))
            resolve(invoiceTypes.data)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  cancelBill (_, payload) {
    try {
      return new Promise((resolve) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${payload.bill.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              cancelled: true,
              cancelreason: payload.reason,
              payed: payload.payed
            }
          })
        })
          .then(res => res.json())
          .then((invoice) => {
            resolve(invoice)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  updateInvoice ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${payload.invoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              payed: payload.payed,
              balance: payload.balance
            }
          })
        })
          .then(res => res.json())
          .then(({ data: invoiceMovement }) => {
            resolve(invoiceMovement)
          })
      })
    } catch (error) {
      throw new Error(`UPDATE BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  createInvoiceMovement ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoice-movements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              invoice: payload.invoice.id,
              amount: payload.amount,
              details: payload.details,
              biller: payload.biller.id,
              type: payload.type,
              concept: payload.concept,
              legal_note: payload.legalNote ? payload.legalNote : null
            }
          })
        })
          .then(res => res.json())
          .then(({ data: invoiceMovement }) => {
            resolve(invoiceMovement)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  editBill ({ commit }, payload) {
    commit('editBill', payload)
  },
  addDiscountMovement ({ commit }, payload) {
    try {
      commit('addDiscountMovement', payload)
    } catch (error) {
      throw new Error(`ADD MOVEMENT ACTION ${error}`)
    }
  },
  updateServiceBalance ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services/${payload.serviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              balance: payload.balance
            }
          })
        })
          .then(res => res.json())
          .then(({ data: service }) => {
            resolve(service)
          })
      })
    } catch (error) {
      throw new Error(`UPDATE SERVICE BALANCE ACTION ${error}`)
    }
  },
  createLegalNote ({ commit }, { token, invoices, debit, city, clienttype, credit, service, biller, concept, cancelled, cancelreason, connect = false, company }) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}legal-notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            data: {
              invoices: connect ? {
                connect: invoices.map(invoice => invoice.id)
              } : [],
              credit,
              debit,
              service,
              city,
              clienttype,
              concept,
              cancelled,
              cancelreason,
              biller: biller.id,
              company
            }
          })
        })
          .then(res => res.json())
          .then(({ data: legalNotes }) => {
            resolve(legalNotes)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  getBillingInfoByServiceId ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        populate: [
          'normalized_client',
          'service_addresses',
          'service_addresses.neighborhood',
          'plan',
          'city',
          'offer',
          'offer.plan',
          'debtmovements',
          'debtmovements.technician',
          'offermovents',
          'offermovements.offer',
          'invoices',
          'invoices.offer',
          'invoices.invoice_type',
          'invoices.invoice_movements',
          'invoices.invoice_movements.biller',
          'legal_notes',
          'legal_notes.biller',
          'legal_notes.invoices',
          'legal_notes.invoice_movements',
          'legal_notes.service'
        ],
        pagination: {
          pageSize: 5000
        },
        sort: ['createdAt:desc']
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services/${payload.serviceId}?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: service }) => {
            service.invoices = service.invoices.filter(invoice => invoice.payed === payload.showPayed)
            // Sort legal_notes bu date desc
            service.legal_notes.sort((a, b) => {
              return new Date(b.createdAt) - new Date(a.createdAt)
            })
            commit('getBillingInfoByServiceId', { invoices: service.invoices, legalNotes: service.legal_notes, showArchive: payload.showArchive, service })
            resolve(service.invoices)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLING INFO BY CLIENT ID ACTION ${error}`)
    }
  },
  async getClientsBySearch ({ commit }, payload) {
    try {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
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
              $or: [
                {
                  name: {
                    $contains: payload.search
                  }
                },
                {
                  code: payload.search
                },
                {
                  dni: payload.search
                }
              ]
            }
          ]
        },
        populate: ['neighborhood', 'plan', 'technology', 'offer', 'offer.plan', 'offermovements.offer', 'offermovements', 'debtmovements', 'debtmovements.technician']
      },
      {
        encodeValuesOnly: true
      })
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}clients?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.token}`
        }
      })
        .then(res => res.json())
        .then((clients) => {
          commit('getClientsBySearch', clients)
        })
    } catch (error) {
      throw new Error(`BILLING CLIENTS SEARCH ACTION ${error}`)
    }
  },
  getInvoicesByServiceId ({ commit }, payload) {
    const qs = require('qs')
    const query = qs.stringify({
      filters: {
        $and: [
          {
            service: payload.serviceId
          },
          {
            payed: payload.payed
          }
        ]
      },
      populate: [
        'offer',
        'service',
        'legal_notes',
        'invoice_type',
        'invoice_movements',
        'service.normalized_client',
        'service.service_addresses',
        'service.offer',
        'service.service_addresses.neighborhood'
      ]
    },
    {
      encodeValuesOnly: true
    })
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: invoices }) => {
            resolve(invoices)
          })
      })
    } catch (error) {
      throw new Error(`GET BILL BY ID ACTION ${error}`)
    }
  },
  getServiceById ({ commit }, payload) {
    const qs = require('qs')
    const query = qs.stringify({
      populate: [
        'normalized_client',
        'service_addresses',
        'service_addresses.neighborhood',
        'plan',
        'city',
        'offer',
        'offer.plan',
        'debtmovements',
        'debtmovements.technician',
        'offermovents',
        'offermovements.offer',
        'invoices',
        'invoices.offer',
        'invoices.invoice_type',
        'invoices.invoice_movements',
        'invoices.invoice_movements.biller',
        'legal_notes',
        'legal_notes.biller',
        'legal_notes.invoices',
        'legal_notes.invoice_movements'
      ]
    },
    {
      encodeValuesOnly: true
    })
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services/${payload.serviceId}?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: service }) => {
            resolve(service)
          })
      })
    } catch (error) {
      throw new Error(`GET BILL BY ID ACTION ${error}`)
    }
  },
  getInvoiceById ({ commit }, payload) {
    const qs = require('qs')
    const query = qs.stringify({
      populate: [
        'offer',
        'service',
        'legal_notes',
        'invoice_type',
        'invoice_movements',
        'service.normalized_client',
        'service.service_addresses',
        'service.offer',
        'service.service_addresses.neighborhood'
      ]
    },
    {
      encodeValuesOnly: true
    })
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${payload.id}?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: invoice }) => {
            resolve(invoice)
          })
      })
    } catch (error) {
      throw new Error(`GET BILL BY ID ACTION ${error}`)
    }
  },
  getBillById ({ commit }, payload) {
    const qs = require('qs')
    const query = qs.stringify({
      populate: [
        'biller',
        'invoices',
        'invoice_movements',
        'invoice_movements.invoice',
        'service',
        'service.offer',
        'service.normalized_client',
        'service.service_addresses.neighborhood',
        'service.invoices',
        'service.invoices.invoice_type'
      ]
    },
    {
      encodeValuesOnly: true
    })
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}legal-notes/${payload.id}?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then((invoice) => {
            resolve(invoice.data)
          })
      })
    } catch (error) {
      throw new Error(`GET BILL BY ID ACTION ${error}`)
    }
  },
  getBillsByDateRange ({ commit }, payload) {
    let filterDebitCredit = {}
    if (payload.debit && !payload.credit) {
      filterDebitCredit.credit = 0
    } else if (payload.credit && !payload.debit) {
      filterDebitCredit.debit = 0
    } else if (payload.credit && payload.debit) {
      filterDebitCredit = {}
    }
    const qs = require('qs')
    const query = qs.stringify({
      filters: {
        $and: [
          filterDebitCredit,
          {
            city: payload.city
          },
          {
            clienttype: payload.clienttype
          },
          {
            createdAt: {
              $gte: payload.from + 'T00:00:00'
            }
          },
          {
            createdAt: {
              $lte: payload.to + 'T23:59:59'
            }
          },
          {
            cancelled: {
              $null: true
            }
          }
        ]
      },
      populate: [
        'biller',
        'invoices',
        'invoice_movements',
        'service',
        'service.offer',
        'service.normalized_client'
      ],
      pagination: {
        pageSize: 5000
      }
    },
    {
      encodeValuesOnly: true
    })
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}legal-notes?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then((invoices) => {
            commit('getBillsByDateRange', invoices.data)
            resolve(invoices)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLS BY DATE RANGE ACTION ${error}`)
    }
  },
  getBillsByServiceId ({ commit }, payload) {
    const qs = require('qs')
    const query = qs.stringify({
      populate: ['invoices', 'invoices.image']
    },
    {
      encodeValuesOnly: true
    })
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}services/${payload.service.id}?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: service }) => {
            service.invoices.sort((a, b) => {
              return new Date(b.createdAt) - new Date(a.createdAt)
            })
            service.invoices = service.invoices.filter(invoice => invoice.image !== null)
            commit('getBillsByServiceId', service)
            resolve(service)
          })
      })
    } catch (error) {
      throw new Error(`GET BILLS BY SERVICE ID ACTION ${error}`)
    }
  },
  updateBillingPeriod ({ commit }, payload) {
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
              billingyear: payload.billingyear
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
  updateSentStatus ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${payload.invoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          },
          body: JSON.stringify({
            data: {
              sent: payload.success
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
  getListOfActiveServices ({ commit }, payload) {
    let nfilter = []
    const currentYear = new Date().getFullYear()

    // Si includeAlreadyBilled es true, no aplicamos el filtro de billingmonth
    if (!payload.includeAlreadyBilled) {
      if (payload.year > currentYear) {
        nfilter = [
          {
            billingyear: {
              $lte: payload.year
            }
          },
          {
            billingmonth: {
              $gte: payload.month
            }
          }
        ]
      } else {
        nfilter = [
          {
            billingyear: {
              $lte: payload.year
            }
          },
          {
            billingmonth: {
              $ne: payload.month
            }
          }
        ]
      }
    }

    const qs = require('qs')

    // Construir filtros base
    const baseFilters = {
      active: payload.active,
      indebt: payload.indebt,
      city: {
        name: payload.city
      },
      clienttype: {
        name: payload.clienttype
      }
    }

    // Si includeAlreadyBilled es true, solo usamos filtros base
    // Si es false, agregamos los filtros de billing period
    const filters = payload.includeAlreadyBilled
      ? baseFilters
      : {
        ...baseFilters,
        $or: [
          {
            $and: nfilter
          },
          {
            $or: [
              {
                billingyear: {
                  $null: true
                }
              },
              {
                billingmonth: {
                  $null: true
                }
              }
            ]
          }
        ]
      }

    const query = qs.stringify({
      filters,
      pagination: {
        pageSize: 5000
      },
      populate: ['offer', 'plan', 'service_addresses', 'normalized_client', 'invoices', 'invoices.image', 'city']
    },
    {
      encodeValuesOnly: true
    })
    try {
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
            // Si includeAlreadyBilled es true, necesitamos marcar qué servicios ya tienen factura
            if (payload.includeAlreadyBilled) {
              services.forEach((service) => {
                // Buscar si ya tiene factura para este mes/año
                const existingInvoice = service.invoices?.find(invoice =>
                  invoice.month === payload.month && invoice.year === payload.year
                )
                if (existingInvoice) {
                  service.existingInvoiceId = existingInvoice.id
                }
              })
            }

            commit('getListOfActiveServices', services)
            resolve(services)
          })
      })
    } catch (error) {
      throw new Error(`GET LIST OF ACTIVE CLIENTS ACTION ${error}`)
    }
  },
  sendBill ({ commit }, payload) {
    return new Promise((resolve, reject) => {
      fetch(this.$config.META_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$config.META_TOKEN}`
        },
        body: JSON.stringify(
          {
            messaging_product: 'whatsapp',
            to: `57${payload.service.normalized_client.phone}`,
            type: 'template',
            template: {
              name: this.$config.META_TEMPLATE,
              language: {
                code: 'es'
              },
              components: [
                {
                  type: 'body',
                  parameters: [
                    {
                      type: 'text',
                      text: `${payload.month.text}`
                    },
                    {
                      type: 'text',
                      text: `15 de ${payload.month.text}`
                    }
                  ]
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [
                    {
                      type: 'text',
                      text: `${payload.service.normalized_client.dni}`
                    }
                  ]
                }
              ]
            }
          }
        )
      })
        .then(res => res.json())
        .then((res) => {
          resolve(res)
        })
    })
  },
  updateResend ({ commit }, payload) {
    const resend = payload.invoice.resend + 1
    return new Promise((resolve, reject) => {
      fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${payload.invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.token}`
        },
        body: JSON.stringify({
          data: {
            resend,
            resend_at: new Date()
          }
        })
      }).then(res => res.json())
        .then((res) => {
          resolve(res)
        })
    })
  },
  getHeadersByClientType ({ commit }, { city, clienttype }) {
    const internet = [
      { text: 'Codigo', value: 'code', sortable: false },
      { text: 'Nombre', value: 'name', sortable: false },
      { text: 'Cedula', value: 'dni', sortable: false },
      { text: 'Direccion', sortable: false, value: 'address' },
      { text: 'Barrio', value: 'neighborhood.name', sortable: false },
      { text: 'Estado', sortable: false, value: 'active' },
      { text: 'Saldo', sortable: false, value: 'balance' }
    ]
    const television = [
      { text: 'Codigo', value: 'code', sortable: false },
      { text: 'Nombre', value: 'name', sortable: false },
      { text: 'Cedula', value: 'dni', sortable: false },
      { text: 'Direccion', sortable: false, value: 'address' },
      { text: 'Barrio', value: 'neighborhood.name', sortable: false },
      { text: 'Estado', sortable: false, value: 'active' },
      { text: 'Saldo', sortable: false, value: 'balance' }
    ]

    if (clienttype === 'INTERNET') {
      commit('getHeadersByClientType', internet)
    } else if (clienttype === 'TELEVISION') {
      commit('getHeadersByClientType', television)
    }
  },
  async cancelLegalNote ({ dispatch }, { legalNote, token }) {
    // 1. Marcar el recibo como anulado
    await fetch(`${this.$config.API_STRAPI_ENDPOINT}legal-notes/${legalNote.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        data: {
          cancelled: true,
          cancelreason: 'Anulado por usuario'
        }
      })
    })
    // 2. Restaurar saldo de las facturas relacionadas
    if (legalNote.invoices && legalNote.invoices.length > 0) {
      // Distribuir el monto proporcionalmente si hay varias facturas
      const totalCredit = legalNote.credit
      const invoicesCount = legalNote.invoices.length
      const amountPerInvoice = Math.floor(totalCredit / invoicesCount)
      const remainder = totalCredit - (amountPerInvoice * invoicesCount)

      for (let i = 0; i < invoicesCount; i++) {
        const invoice = legalNote.invoices[i]
        let restoreAmount = amountPerInvoice
        if (i === invoicesCount - 1) { restoreAmount += remainder }
        const newBalance = (invoice.balance || 0) + restoreAmount

        // Determinar el estado correcto de payed y partial
        let payed = false
        let partial = false
        if (newBalance === 0) {
          payed = true
          partial = false
        } else if (newBalance > 0 && newBalance < invoice.value) {
          payed = false
          partial = true
        } else if (newBalance >= invoice.value) {
          payed = false
          partial = false
        }

        await fetch(`${this.$config.API_STRAPI_ENDPOINT}invoices/${invoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            data: {
              balance: newBalance,
              payed,
              partial
            }
          })
        })
      }
    }
  }
}
