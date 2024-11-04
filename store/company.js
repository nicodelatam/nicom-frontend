export const state = () => ({
  currentCompany: [],
  cities: [],
  clienttypes: []
})
export const mutations = {
  setCurrentCompany (state, company) {
    try {
      state.currentCompany = company
      state.cities = company.cities
      state.clienttypes = company.clienttypes
    } catch (error) {
      throw new Error(`COMPANY MUTATE ${error}`)
    }
  }
}
export const actions = {
  getCompanyByName ({ commit }, payload) {
    try {
      return new Promise((resolve, reject) => {
        const qs = require('qs')
        const query = qs.stringify({
          filters: {
            name: payload.company
          },
          populate: 'logo'
        },
        {
          encodeValuesOnly: true
        })
        fetch(`${this.$config.API_STRAPI_ENDPOINT}companies?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: company }) => {
            if (company.length === 1) {
              resolve(company[0])
            } else {
              resolve(company)
            }
          })
      })
    } catch (error) {
      throw new Error(`COMPANY ACTION ${error}`)
    }
  }
}
