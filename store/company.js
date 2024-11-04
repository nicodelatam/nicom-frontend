export const state = () => ({
  currentCompany: [],
  cities: [],
  clienttypes: []
})
export const mutations = {
  setCurrentCompany (state, company) {
    try {
      console.log(company)
      state.currentCompany = company
      state.cities = company.cities
      state.clienttypes = company.clienttypes
    } catch (error) {
      throw new Error(`COMPANY MUTATE ${error}`)
    }
  }
}
export const actions = {
}
