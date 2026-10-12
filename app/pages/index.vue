<template>
  <v-container fluid>
    <v-card-text>
      <div class="d-flex justify-center">
        <v-img src="/assets/images/logo_cse.png" min-width="100px" height="100px" />
      </div>
      <h2 class="mb-8 text-center gold-gradient-text">ລາຍງານການບໍລິຫານຈັດການນ້ຳ ແລະ ການຜະລິດ</h2>
      <div class="d-flex justify-center"><v-btn color="primary" rounded="lg" variant="outlined"
          prepend-icon="mdi mdi-magnify" class="mb-2 text-right" @click="showDam()">
          ລາຍລະອຽດເຂື່ອນ
        </v-btn></div>
      <v-row class="d-flex justify-center">
        <v-col cols="12" lg="8" md="12">
          <v-card class="d-flex justify-center pa-3 rounded-lg">
            <v-row :align="'center'">
              <v-col class="d-flex justify-center" cols="12">
                <v-tabs v-model="periodType" color="primary">
                  <v-tab value="year">ປີ</v-tab>
                  <v-tab value="quarter">ໄຕມາດ</v-tab>
                  <v-tab value="month">ເດືອນ</v-tab>
                </v-tabs>
              </v-col>
              <!-- Year (always shown) -->
              <v-row class="d-flex justify-center mb-2" :align="'center'">
                <v-col cols="12" sm="3">
                  <v-select v-model="selectedYear" :items="yearItems" label="ປີ" variant="outlined"
                    density="comfortable" hide-details />
                </v-col>

                <!-- Quarter -->
                <v-col v-if="periodType === 'quarter'" cols="12" sm="3">
                  <v-select v-model="selectedQuarter" :items="quarterItems" item-title="title" item-value="value"
                    label="ໄຕມາດ" variant="outlined" density="comfortable" hide-details />
                </v-col>

                <!-- Month -->
                <v-col v-if="periodType === 'month'" cols="12" sm="3">
                  <v-select v-model="selectedMonth" :items="monthItems" item-title="title" item-value="value"
                    label="ເດືອນ" variant="outlined" density="comfortable" hide-details />
                </v-col>
                <!-- Search button -->
                <v-col cols="12" class="text-end" sm="auto">
                  <v-btn color="primary" prepend-icon="mdi-magnify" variant="outlined" :loading="loading"
                    :disabled="loading" @click="search">
                    ຄົ້ນຫາ
                  </v-btn>
                </v-col>
              </v-row>
            </v-row>

          </v-card>
        </v-col>
      </v-row>
      <div v-if="loading" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>



      <template v-else-if="sortedData.length > 0">
        <v-row>
          <v-col v-for="item in sortedData" :key="item.D_DAM" cols="12" sm="12" md="12" :lg="isAll(item) ? 12 : 6">
            <v-card rounded="lg" elevation="0" :hover="!isAll(item)" class="text-center border-sm rounded-lg"
              :class="{ 'cursor-pointer': !isAll(item) }" @click="!isAll(item) && gotoDetail(item)">
              <v-card-text class="text-center">
                <v-row :align="'center'" dense>
                  <!-- Icon + title -->
                  <v-col cols="12" sm="8" md="9">
                    <div class="d-flex align-center">
                      <Icon :name="isAll(item) ? 'mdi:sigma' : 'game-icons:waterfall'" size="3rem"
                        class="text-grey mx-2 mx-sm-4 flex-shrink-0" />
                      <div class="text-left">
                        <h3><b>{{ isAll(item) ? 'ລວມທຸກເຂື່ອນ' : item.branch?.BR_NAME }}</b></h3>
                        <h4 class="text-grey"><b>{{ isAll(item) ? 'ລາຍງານພະລັງງານ ແລະ ລາຍຮັບ' : item.branch?.BR_NAME_EN
                        }} {{ formatDate(item.PERIOD_START) }} - {{ formatDate(item.PERIOD_END) }}</b></h4>
                      </div>
                    </div>
                  </v-col>

                  <!-- Status chip -->
                  <v-col cols="12" sm="4" md="3" class="text-center text-sm-right">
                    <v-chip :color="getStatus(getPercent(item)).color" variant="tonal">
                      {{ getStatus(getPercent(item)).text }}
                      <template v-if="getPercent(item) !== null">
                        ({{ getPercent(item) }}%)
                      </template>
                    </v-chip>
                  </v-col>
                </v-row>
              </v-card-text>
              <div class="ma-3">
                <v-row>
                  <!-- Total Energy -->
                  <v-col cols="12" sm="6" md="6" class="d-flex justify-center">
                    <v-card elevation="0" rounded="lg" color="grey-lighten-4" class="w-100">
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" class="d-flex align-center justify-center">
                            <Icon name="streamline-sharp:hydro-energy-remix" size="2.5rem" class="text-primary mr-2" />
                            <h3>ພະລັງງານຜະລິດຕົວຈິງ</h3>
                          </v-col>
                          <v-divider></v-divider>
                          <v-col cols="12">
                            <v-row class="text-primary d-flex align-center">
                              <v-col cols="6">
                                <p>ພະລັງງານ: </p>
                              </v-col>
                              <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                                formatNumber(item.YEAR_ACTUAL_ENERGY) }}
                                  GWh</v-chip></v-col>
                            </v-row></v-col>
                          <v-col cols="12">
                            <v-row class="text-primary d-flex align-center">
                              <v-col cols="6">
                                <p>ລາຍຮັບ: </p>
                              </v-col>
                              <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                                formatNumber(item.YEAR_ACTUAL_REVENUE)
                                || '-'
                                  }}
                                  MUSD</v-chip></v-col>
                            </v-row></v-col>

                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <!-- Energy Plan -->
                  <v-col cols="12" sm="6" md="6" class="d-flex justify-center">
                    <v-card elevation="0" rounded="lg" color="grey-lighten-4" class="w-100">
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" class="d-flex align-center justify-center">
                            <Icon name="octicon:goal-24" size="2.5rem" class="text-success mr-2" />
                            <h3>ແຜນພະລັງງານຜະລິດ</h3>
                          </v-col>
                          <v-divider></v-divider>
                          <v-col cols="12">
                            <v-row class="text-success d-flex align-center">
                              <v-col cols="6">
                                ແຜນພະລັງງານ:
                              </v-col>
                              <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                                formatNumber(item.YEAR_PLAN_ENERGY) ||
                                '-' }}
                                  GWh</v-chip></v-col>
                            </v-row></v-col>
                          <v-col cols="12">
                            <v-row class="text-success d-flex align-center">
                              <v-col cols="6">
                                <p>ແຜນລາຍຮັບ:</p>
                              </v-col>
                              <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                                formatNumber(item.YEAR_PLAN_REVENUE) ||
                                '-'
                                  }}
                                  MUSD</v-chip></v-col>
                            </v-row></v-col>

                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card>
          </v-col>

        </v-row>
        <v-row>
          <v-col>
            <v-card rounded="lg" elevation="0" class="border-sm mb-4">
              <v-card-text>
                <BarChart title="ພະລັງງານຜະລິດ (GWh)" unit="GWh" :labels="labels" :series="energySeries"
                  :loading="loading" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </template>

      <div v-else class="text-center py-8">
        ບໍ່ມີຂໍ້ມູນ
      </div>
    </v-card-text>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { formatNumber } from "~~/components/common/formatNumber";
import BarChart from '~~/components/common/BarChart.vue'
import { useFormatDate } from '~~/components/common/useFormatDate'
const { formatDate } = useFormatDate()


const router = useRouter();

definePageMeta({
  middleware: "auth",
  layout: "default",
});

// ─── State ────────────────────────────────────────────────
const data = ref([]);
const loading = ref(false);
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const damSelectd = ref("")


const now = new Date();
const periodType = ref("year"); // 'year' | 'quarter' | 'month'
const selectedYear = ref(now.getFullYear());
const selectedQuarter = ref(Math.floor(now.getMonth() / 3) + 1); // 1-4
const selectedMonth = ref(String(now.getMonth() + 1).padStart(2, "0")); // '01'-'12'

// ─── Select items ─────────────────────────────────────────
const yearItems = Array.from({ length: 10 }, (_, i) => now.getFullYear() - i);

const quarterItems = [
  { title: "Q1", value: 1 },
  { title: "Q2", value: 2 },
  { title: "Q3", value: 3 },
  { title: "Q4", value: 4 },
];

const monthItems = Array.from({ length: 12 }, (_, i) => {
  const m = String(i + 1).padStart(2, "0");
  return { title: m, value: m };
});

// ─── Compute start / end date ─────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const lastDayOf = (year, month) => new Date(year, month, 0).getDate(); // month is 1-12

const dateRange = computed(() => {
  const y = Number(selectedYear.value);

  if (periodType.value === "year") {
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }

  if (periodType.value === "quarter") {
    const q = Number(selectedQuarter.value);
    const startM = (q - 1) * 3 + 1;
    const endM = q * 3;
    return {
      start: `${y}-${pad(startM)}-01`,
      end: `${y}-${pad(endM)}-${pad(lastDayOf(y, endM))}`,
    };
  }

  // month
  const m = Number(selectedMonth.value);
  return {
    start: `${y}-${pad(m)}-01`,
    end: `${y}-${pad(m)}-${pad(lastDayOf(y, m))}`,
  };
});

const getPercent = (item) => {
  const used = Number(item.YEAR_ACTUAL_ENERGY) || 0
  const plan = Number(item.YEAR_PLAN_ENERGY) || 0
  if (plan <= 0) return null                 // no plan set
  return Math.round((used / plan) * 10000) / 100   // 2 decimals
}

const getStatus = (percent) => {
  if (percent === null) return { color: 'grey', text: '-' }
  if (percent > 100) return { color: 'success', text: 'ເກີນແຜນ' }
  if (percent >= 70) return { color: 'warning', text: 'ໃກ້ຄຽງແຜນ' }
  return { color: 'error', text: 'ຍັງບໍ່ຮອດແຜນ' }
}
// ─── API ──────────────────────────────────────────────────
const loadData = async () => {
  loading.value = true;
  try {
    const { start, end } = dateRange.value;
    const res = await axios.get("/api/data/sum", {
      params: {
        // dateselect: selectedDate.value,
        dam: damSelectd.value,
        start_date: start,
        end_date: end,
      },
    });
    data.value = res.data.data
    console.log(data.value)
  } catch (err) {
    console.error(err);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

const search = () => {
  loadData()
}

const isAll = (item) => item.D_DAM === 'ALL'

const sortedData = computed(() =>
  data.value.filter((item) => isAll(item))
)

const sortedDataDam = computed(() =>
  data.value
    .filter((item) => !isAll(item))
    .sort(
      (a, b) =>
        (Number(a.YEAR_ACTUAL_ENERGY) || 0) - (Number(b.YEAR_ACTUAL_ENERGY) || 0)
    )
);
const labels = computed(() =>
  sortedDataDam.value.map((r) => r.branch?.BR_NAME || r.D_DAM)
);

const energySeries = computed(() => [
  {
    name: "ຕົວຈິງ",
    data: sortedDataDam.value.map((r) => r.YEAR_ACTUAL_ENERGY),
    color: "#1976D2",
  },
  {
    name: "ແຜນ",
    data: sortedDataDam.value.map((r) => r.YEAR_PLAN_ENERGY),
    color: "#ADADAD",
  },
  //  {
  //   name: "ປະລິມານນ້ຳຝົນ",
  //   data: sortedDataDam.value.map((r) => r.MONTH_RAINFALL),
  //   color: "#1996D2",
  // },

]);



const gotoDetail = (item) => {
  router.push({ path: `/detail`, query: { item: JSON.stringify(item) } });
};
const showDam = (item) => {
  router.push({ path: `/showdam`, query: { item: JSON.stringify(item) } });
};
onMounted(() => {
  loadData()
})

</script>
<style scoped>
.gold-gradient-text {
  background: linear-gradient(90deg,
      #cb9b51 22%,
      #f6e27a 45%,
      #f6e27a 55%,
      #cb9b51 78%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  /* fallback for browsers without -webkit prefix support */
}
</style>