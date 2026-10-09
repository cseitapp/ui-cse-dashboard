<template>
  <v-container fluid>
    <!-- <v-card rounded="lg" elevation="0" border :loading="loading" > -->
    <v-card-text>
      <div class="d-flex justify-center">
        <v-img src="/assets/images/logo_cse.png" min-width="100px" height="100px" />
      </div>
      <h2 class="mb-8 text-center gold-gradient-text">ລາຍງານການບໍລິຫານຈັດການນ້ຳ ແລະ ການຜະລິດ</h2>
      <div v-if="loading" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else-if="sortedData.length > 0">
  <v-row>
    <v-col v-for="item in sortedData" :key="item.D_DAM" cols="12" sm="12" md="12" :lg="isAll(item) ? 12 : 6">
      <v-card rounded="lg" elevation="0" :hover="!isAll(item)"
        class="text-center border-sm rounded-lg" :class="{ 'cursor-pointer': !isAll(item) }"
        @click="!isAll(item) && gotoDetail(item)">
        <v-card-text class="text-center">
          <div class="d-flex align-center">
            <Icon :name="isAll(item) ? 'mdi:sigma' : 'game-icons:waterfall'" size="3rem" class="text-grey mx-4" />
 
            <div class="text-left">
              <h3><b>{{ isAll(item) ? 'ລວມທຸກເຂື່ອນ' : item.branch?.BR_NAME }}</b></h3>
              <h4 class="text-grey"><b>{{ isAll(item) ? 'ລາຍງານພະລັງງານ ແລະ ລາຍຮັບ' : item.branch?.BR_NAME_EN }}</b></h4>
            </div>
            <div class="text-right ml-auto">
              <h3>
                <v-chip :color="getStatus(getPercent(item)).color" variant="tonal" class="ml-2">
                  {{ getStatus(getPercent(item)).text }}
                  <template v-if="getPercent(item) !== null">
                    ({{ getPercent(item) }}%)
                  </template>
                </v-chip>
              </h3>
            </div>
          </div>
        </v-card-text>
        <div class="ma-3">
          <v-row>
            <!-- Total Energy -->
            <v-col cols="6" class="d-flex justify-center">
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
                          <p>ພະລັງງານປີ: {{ item.YEAR_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.YEAR_ACTUAL_ENERGY) }}
                            GWh</v-chip></v-col>
                      </v-row></v-col>
                    <v-col cols="12">
                      <v-row class="text-primary d-flex align-center">
                        <v-col cols="6">
                          <p>ລາຍຮັບປີ: {{ item.YEAR_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.YEAR_ACTUAL_REVENUE)
                          || '-'
                            }}
                            MUSD</v-chip></v-col>
                      </v-row></v-col>
                    <v-divider></v-divider>
                    <v-col cols="12">
                      <v-row class="text-primary d-flex align-center">
                        <v-col cols="6">
                          <p>ພະລັງງານເດືອນ: {{ item.MONTH_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.MONTH_ACTUAL_ENERGY)
                            }}
                            GWh</v-chip></v-col>
                      </v-row></v-col>
                    <v-col cols="12">
                      <v-row class="text-primary d-flex align-center">
                        <v-col cols="6">
                          <p>ລາຍຮັບເດືອນ: {{ item.MONTH_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.MONTH_ACTUAL_REVENUE)
                          || '-'
                            }}
                            MUSD</v-chip></v-col>
                      </v-row></v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
 
            <!-- Energy Plan -->
            <v-col cols="6" class="d-flex justify-center">
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
                          ແຜນພະລັງງານປີ: {{ item.YEAR_NO }}
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.YEAR_PLAN_ENERGY) ||
                          '-' }}
                            GWh</v-chip></v-col>
                      </v-row></v-col>
                    <v-col cols="12">
                      <v-row class="text-success d-flex align-center">
                        <v-col cols="6">
                          <p>ແຜນລາຍຮັບປີ: {{ item.YEAR_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.YEAR_PLAN_REVENUE) ||
                          '-'
                        }}
                            MUSD</v-chip></v-col>
                      </v-row></v-col>
                    <v-divider></v-divider>
                    <v-col cols="12">
                      <v-row class="text-success d-flex align-center">
                        <v-col cols="6">
                          <p>ແຜນພະລັງງານເດືອນ: {{ item.MONTH_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.MONTH_PLAN_ENERGY)
                            }}
                            GWh</v-chip></v-col>
                      </v-row></v-col>
                    <v-col cols="12">
                      <v-row class="text-success d-flex align-center">
                        <v-col cols="6">
                          <p>ແຜນລາຍຮັບເດືອນ: {{ item.MONTH_NO }}</p>
                        </v-col>
                        <v-col cols="6" class="text-left"><v-chip :variant="isAll(item) ? 'tonal' : 'outlined'">{{
                          formatNumber(item.MONTH_PLAN_REVENUE)
                          || '-'
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
</template>

      <div v-else class="text-center py-8">
        ບໍ່ມີຂໍ້ມູນ
      </div>
    </v-card-text>
    <!-- </v-card> -->
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { formatNumber } from "~~/components/common/formatNumber";

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
    const res = await axios.get("/api/data/sum", {
      params: {
        dateselect: selectedDate.value,
        dam: damSelectd.value
      },
    });
    data.value = res.data.data
  } catch (err) {
    console.error(err);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

const isAll = (item) => item.D_DAM === 'ALL'
 
// ALL first, then the rest in their original order
const sortedData = computed(() =>
  [...data.value].sort((a, b) => Number(isAll(b)) - Number(isAll(a)))
)
 


const gotoDetail = (item) => {
  router.push({ path: `/detail`, query: { item: JSON.stringify(item) } });
};


// ─── Init ─────────────────────────────────────────────────
loadData();
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