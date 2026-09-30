import { defineNuxtPlugin } from '#imports'
import { Chart, LineElement, BarElement, ArcElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

Chart.register(
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('LineChart', Line)
  nuxtApp.vueApp.component('BarChart', Bar)
  nuxtApp.vueApp.component('DoughnutChart', Doughnut)
})
