<template>
  <v-container>
    <v-card rounded="lg" elevation="0" border :loading="loading" color="#FDFBF7">
      <v-card-text>
        <div class="d-flex justify-center">
          <v-img src="/assets/images/logo_cse.png" width="100px" height="100px" />
        </div>
        <h2 class="mb-8 text-center gold-gradient-text">ລາຍງານການບໍລິຫານຈັດການນ້ຳ ແລະ ການຜະລິດ</h2>
        <div v-if="loading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else-if="chartData.length > 0">
          <v-row>
            <v-col v-for="item in chartData" :key="item.CODE" cols="12" sm="6" md="4" lg="3">
              <v-card rounded="lg" elevation="0" hover class="cursor-pointer text-center border-sm rounded-lg"
                color="#FDFBF7"
                @click="router.push(`/${item.CODE}?name=${encodeURIComponent(item.branch?.BR_NAME || '')}`)">
                <v-card-title class="text-center">
                  <b class="text-primary">{{ item.branch?.BR_NAME }}</b>
                </v-card-title>
                <v-card-subtitle class="text-center">
                  <v-chip color="primary" variant="tonal">{{ currentYear }}</v-chip>
                </v-card-subtitle>
                <v-divider class="my-2"></v-divider>
                <div class="ma-3">

                  <v-row>
                    <!-- Total Energy -->
                    <v-col cols="6" class="d-flex justify-center">
                      <div class="d-flex flex-column align-center">
                        <v-tooltip text="ພະລັງງານ" location="top">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-lightning-bolt" size="2rem" color="primary" class="mb-2" />
                          </template>
                        </v-tooltip>

                        <v-chip label rounded="lg" variant="tonal" color="primary">
                          {{ formatNumber(item.total_power_year) }} MW
                        </v-chip>
                      </div>
                    </v-col>

                    <!-- Energy Plan -->
                    <v-col cols="6" class="d-flex justify-center">
                      <div class="d-flex flex-column align-center">
                        <v-tooltip text="ແຜນພະລັງງານ" location="top">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-bullseye-arrow" size="2rem" color="primary" class="mb-2" />
                          </template>
                        </v-tooltip>

                        <v-chip label rounded="lg" variant="tonal" color="primary">
                          {{ formatNumber(item.energy_plan) || '-' }} MW
                        </v-chip>
                      </div>
                    </v-col>
                  </v-row>
                </div>
                <v-divider class="my-3"></v-divider>
                <div class="ma-3">
                  <v-row>

                    <v-col cols="6" class="d-flex justify-center">
                      <div class="d-flex flex-column align-center">
                        <v-tooltip text="ລາຍຮັບ" location="top">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-currency-usd" size="2rem" color="warning" class="mb-2" />
                          </template>
                        </v-tooltip>

                        <v-chip variant="tonal" label rounded="lg" color="yellow-darken-4">
                          {{ formatNumber(item.cost_total) || '-' }} $
                        </v-chip>
                      </div>
                    </v-col>
                    <v-col cols="6" class="d-flex justify-center">
                      <div class="d-flex flex-column align-center">
                        <v-tooltip text="ແຜນລາຍຮັບ" location="top">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-cash-multiple" size="2rem" color="warning" class="mb-2" />
                          </template>
                        </v-tooltip>

                        <v-chip variant="tonal" label rounded="lg" color="yellow-darken-4">
                          {{ formatNumber(item.cost_total_plan) || '-' }} $
                        </v-chip>
                      </div>
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
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { useAuthUser } from "~~/composables/useAuth";

const router = useRouter();

definePageMeta({
  middleware: "auth",
  layout: "default",
});

// ─── State ────────────────────────────────────────────────
const data = ref([]);
const loading = ref(false);
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const currentYear = new Date().getFullYear(); // 2026
// ─── Computed ─────────────────────────────────────────────
const chartData = computed(() =>
  data.value.filter((d) => d.total_power_year > 0)
);
const formatNumber = (val) => {
  if (val == null) return "-";

  const num = Number(val);

  if (Math.abs(num) >= 1_000_000) {
    // e.g. 1500000 -> "1.5M", 1000000 -> "1M"
    const millions = num / 1_000_000;
    const formatted = millions.toFixed(3).replace(/\.0$/, "");
    return `${formatted}M`;
  }

  if (Math.abs(num) >= 1_000) {
    // e.g. 1500 -> "1.5K", 1000 -> "1K"
    const thousands = num / 1_000;
    const formatted = thousands.toFixed(3).replace(/\.0$/, "");
    return `${formatted}K`;
  }

  return num
    .toFixed(3)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};


// ─── API ──────────────────────────────────────────────────
const loadData = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/energy/all", {
      params: { dateselect: selectedDate.value },
    });
    data.value = Array.isArray(res.data.data) ? res.data.data : [];
    console.log(data.value)
  } catch (err) {
    console.error(err);
    data.value = [];
  } finally {
    loading.value = false;
  }
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