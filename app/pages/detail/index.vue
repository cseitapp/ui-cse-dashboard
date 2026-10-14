<template>
  <v-container fluid class="plant-page pa-0">
    <main class="plant-dashboard" :class="{ 'dual-view': dualView }">
      <header class="plant-header">
        <div class="plant-identity">
          <button type="button" class="icon-button back-button" aria-label="ກັບຄືນ" @click="router.back()">
            <Icon name="lucide:arrow-left" size="21" />
          </button>
          <div
            class="plant-header-brand"
            :style="{ '--plant-accent': plantBrand.accent }"
            :aria-label="`${branchName} logo`"
            role="img"
          >
            <span class="detail-plant-logo" :class="{ 'has-logo': plantBrand.logo }">
              <img v-if="plantBrand.logo" :src="plantBrand.logo" :alt="`${branchName} logo`">
              <span v-else>{{ plantBrand.mark }}</span>
            </span>
          </div>
          <div class="plant-title-block">
            <div class="plant-title-row">
              <h1>{{ branchName }}</h1>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="date-badge" @click="filterOpen = !filterOpen">
            <Icon name="lucide:calendar-days" size="18" class="date-icon" />
            <span class="date-range-text">{{ rangeLabel }}</span>
            <span class="date-mobile-text">ວັນທີ</span>
            <Icon :name="filterOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="16" class="date-chevron" />
          </button>
          <button type="button" class="icon-button info-button" aria-label="ຂໍ້ມູນເຂື່ອນ" @click="dialog = true">
            <Icon name="lucide:info" size="20" />
          </button>
        </div>
      </header>

      <nav class="period-tabs" aria-label="ຮູບແບບໄລຍະເວລາ">
        <button
          v-for="period in periodOptions"
          :key="period.value"
          type="button"
          :class="{ active: activeType === period.value }"
          @click="selectPeriod(period.value)"
        >
          {{ period.title }}
        </button>
      </nav>

      <form v-if="filterOpen" class="filter-panel" @submit.prevent="applyFilters">
        <template v-if="activeType === 'Q'">
          <div class="filter-field">
            <select id="plant-quarter" v-model.number="selectedQuarter" aria-label="ເລືອກໄຕມາດ">
              <option v-for="quarter in quarterOptions" :key="quarter" :value="quarter">
                ໄຕມາດ {{ quarter }}
              </option>
            </select>
          </div>
          <div class="filter-field">
            <input id="plant-quarter-year" v-model.number="selectedYear" type="number" min="2000" max="2100" aria-label="ເລືອກປີ">
          </div>
        </template>
        <div v-else-if="activeType === 'Y'" class="filter-field year-filter-field">
          <input id="plant-year" v-model.number="selectedYear" type="number" min="2000" max="2100" aria-label="ເລືອກປີ">
        </div>
        <template v-else>
          <div class="filter-field">
            <input id="plant-start-date" v-model="startDate" type="date" aria-label="ວັນທີເລີ່ມ">
          </div>
          <div class="filter-field">
            <input id="plant-end-date" v-model="endDate" type="date" aria-label="ວັນທີສິ້ນສຸດ">
          </div>
        </template>
        <button type="submit" class="apply-button" :disabled="loading">
          <Icon name="lucide:search" size="18" />
          ຄົ້ນຫາ
        </button>
      </form>

      <div v-if="errorMessage" class="dashboard-alert" role="alert">
        <Icon name="lucide:triangle-alert" size="19" />
        <span>{{ errorMessage }}</span>
        <button type="button" @click="loadDashboardData">ລອງໃໝ່</button>
      </div>

      <section class="analytics-section">
        <div class="section-heading">
          <div>
            <h2>I. ການຜະລິດ ແລະ ລາຍຮັບ</h2>
          </div>
          <div class="section-heading-actions">
            <span class="range-caption"><Icon name="lucide:calendar-range" size="16" /> {{ rangeLabel }}</span>
            <button
              type="button"
              class="chart-range-filter-button"
              :class="{ active: chartFilterOpen && chartFilterContext === 'energy' }"
              :aria-expanded="chartFilterOpen && chartFilterContext === 'energy'"
              aria-controls="chart-range-filter"
              title="ເລືອກຊ່ວງວັນທີສຳລັບທຸກກາຟ"
              @click="toggleChartFilter('energy')"
            >
              <Icon name="lucide:table-properties" size="18" />
              <span>Data</span>
              <Icon :name="chartFilterOpen && chartFilterContext === 'energy' ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="15" />
            </button>
          </div>
        </div>

        <div class="chart-grid analytics-chart-grid">
          <article class="chart-card">
            <div class="chart-card-header">
              <div class="chart-title">
                <span class="chart-icon orange"><Icon name="mdi:lightning-bolt" size="21" /></span>
                <div><strong>ພະລັງງານ</strong><small>GWh</small></div>
              </div>
              <div class="chart-total-summary energy" aria-label="ຍອດລວມພະລັງງານ">
                <div class="actual">
                  <span>ຕົວຈິງລວມ</span>
                  <strong>{{ formatMetric(totalEnergy) }} <small>GWh</small></strong>
                </div>
                <div class="plan">
                  <span>ແຜນລວມ</span>
                  <strong>{{ formatMetric(totalPlanEnergy) }} <small>GWh</small></strong>
                </div>
              </div>
            </div>

            <div v-if="loading" class="chart-state"><span class="loader" /><span>ກຳລັງໂຫຼດ...</span></div>
            <div v-else-if="!allData.length" class="chart-state"><Icon name="lucide:chart-no-axes-column" size="32" /><span>ບໍ່ມີຂໍ້ມູນ</span></div>
            <BarChart
              v-else
              :key="`energy-${activeType}-${startDate}-${endDate}`"
              title=""
              unit="GWh"
              height="350px"
              :labels="labels"
              :series="energySeries"
              :dark="true"
              :show-all-x-axis-labels="activeType !== 'D'"
            />
          </article>

          <article class="chart-card">
            <div class="chart-card-header">
              <div class="chart-title">
                <span class="chart-icon gold"><Icon name="lucide:dollar-sign" size="20" /></span>
                <div><strong>ລາຍຮັບ</strong><small>MUSD</small></div>
              </div>
              <div class="chart-total-summary revenue" aria-label="ຍອດລວມລາຍຮັບ">
                <div class="actual">
                  <span>ຕົວຈິງລວມ</span>
                  <strong>{{ formatMetric(totalRevenue) }} <small>MUSD</small></strong>
                </div>
                <div class="plan">
                  <span>ແຜນລວມ</span>
                  <strong>{{ formatMetric(totalPlanRevenue) }} <small>MUSD</small></strong>
                </div>
              </div>
            </div>

            <div v-if="loading" class="chart-state"><span class="loader" /><span>ກຳລັງໂຫຼດ...</span></div>
            <div v-else-if="!allData.length" class="chart-state"><Icon name="lucide:chart-no-axes-column" size="32" /><span>ບໍ່ມີຂໍ້ມູນ</span></div>
            <BarChart
              v-else
              :key="`revenue-${activeType}-${startDate}-${endDate}`"
              title=""
              unit="MUSD"
              height="350px"
              :labels="labels"
              :series="revenueSeries"
              :dark="true"
              :show-all-x-axis-labels="activeType !== 'D'"
            />
          </article>
        </div>
      </section>

      <section class="analytics-section water-section">
        <div class="section-heading">
          <div>
            <h2>II. ການບໍລິຫານຈັດການນ້ຳ</h2>
          </div>
          <div class="section-heading-actions">
            <span class="range-caption"><Icon name="lucide:calendar-range" size="16" /> {{ rangeLabel }}</span>
            <button
              type="button"
              class="chart-range-filter-button"
              :class="{ active: chartFilterOpen && chartFilterContext === 'water' }"
              :aria-expanded="chartFilterOpen && chartFilterContext === 'water'"
              aria-controls="chart-range-filter"
              title="ເລືອກຊ່ວງວັນທີສຳລັບກາຟການບໍລິຫານຈັດການນ້ຳ"
              @click="toggleChartFilter('water')"
            >
              <Icon name="lucide:table-properties" size="18" />
              <span>Data</span>
              <Icon :name="chartFilterOpen && chartFilterContext === 'water' ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="15" />
            </button>
          </div>
        </div>

        <div class="chart-grid">
          <article class="chart-card">
            <div class="chart-card-header">
              <div class="chart-title">
                <span class="chart-icon cyan water-direction-icon water-inflow-icon" title="ນ້ຳໄຫຼເຂົ້າ">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path class="flow-arrow" d="M12 2.5v10.25m-4-4 4 4 4-4" />
                    <path class="water-wave" d="M3 16.5c1.5-1.2 3-.8 4.5 0s3 .8 4.5 0 3-.8 4.5 0 3 .8 4.5 0" />
                    <path class="water-wave water-wave-secondary" d="M4.5 20c1.25-.8 2.5-.55 3.75 0s2.5.55 3.75 0 2.5-.55 3.75 0 2.5.55 3.75 0" />
                  </svg>
                </span>
                <div><strong>ປະລິມານນ້ຳເຂົ້າ</strong><small>MCM</small></div>
              </div>
              <div class="chart-total-summary water" aria-label="ຍອດລວມປະລິມານນ້ຳເຂົ້າ">
                <div class="actual">
                  <span>ຕົວຈິງລວມ</span>
                  <strong>{{ formatMetric(totalInflowActual) }} <small>MCM</small></strong>
                </div>
                <div class="plan">
                  <span>ແຜນລວມ</span>
                  <strong>{{ formatMetric(totalInflowPlan) }} <small>MCM</small></strong>
                </div>
              </div>
            </div>
            <div v-if="loading" class="chart-state"><span class="loader" /><span>ກຳລັງໂຫຼດ...</span></div>
            <div v-else-if="!allData.length" class="chart-state"><Icon name="lucide:waves" size="32" /><span>ບໍ່ມີຂໍ້ມູນ</span></div>
            <BarChart
              v-else
              :key="`water-inflow-${activeType}-${startDate}-${endDate}`"
              title=""
              unit="MCM"
              height="350px"
              :labels="labels"
              :series="inflowSeries"
              :dark="true"
              :show-all-x-axis-labels="activeType !== 'D'"
            />
          </article>

          <article class="chart-card">
            <div class="chart-card-header">
              <div class="chart-title">
                <span class="chart-icon cyan water-direction-icon water-outflow-icon" title="ນ້ຳໄຫຼອອກ">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path class="water-wave" d="M2.5 7c1.25-1 2.5-.65 3.75 0S8.75 8 10 7" />
                    <path class="water-wave water-wave-secondary" d="M2.5 11.5c1.25-1 2.5-.65 3.75 0s2.5 1 3.75 0" />
                    <path class="water-wave" d="M2.5 16c1.25-1 2.5-.65 3.75 0s2.5 1 3.75 0" />
                    <path class="flow-arrow" d="M8.5 11.5H21m-4-4 4 4-4 4" />
                  </svg>
                </span>
                <div><strong>ປະລິມານນ້ຳອອກ</strong><small>MCM</small></div>
              </div>
              <div class="chart-total-summary water" aria-label="ຍອດລວມປະລິມານນ້ຳອອກ">
                <div class="actual">
                  <span>ຕົວຈິງລວມ</span>
                  <strong>{{ formatMetric(totalOutflow) }} <small>MCM</small></strong>
                </div>
                <div class="plan">
                  <span>ແຜນລວມ</span>
                  <strong>{{ formatMetric(totalPlanOutflow) }} <small>MCM</small></strong>
                </div>
              </div>
            </div>
            <div v-if="loading" class="chart-state"><span class="loader" /><span>ກຳລັງໂຫຼດ...</span></div>
            <div v-else-if="!allData.length" class="chart-state"><Icon name="lucide:waves" size="32" /><span>ບໍ່ມີຂໍ້ມູນ</span></div>
            <BarChart
              v-else
              :key="`water-outflow-${activeType}-${startDate}-${endDate}`"
              title=""
              unit="MCM"
              height="350px"
              :labels="labels"
              :series="outflowSeries"
              :dark="true"
              :show-all-x-axis-labels="activeType !== 'D'"
            />
          </article>

          <article class="chart-card chart-card-wide">
            <div class="chart-title">
              <span class="chart-icon blue reservoir-metric-icon water-level-icon" title="ລະດັບນ້ຳ" role="img" aria-label="ລະດັບນ້ຳ">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path class="measure-post" d="M5 3v18M5 6h3M5 10h2M5 14h3M5 18h2" />
                  <path class="water-surface" d="M9.5 13.5c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0" />
                  <path class="water-surface water-surface-secondary" d="M9.5 17.5c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0" />
                  <path class="level-indicator" d="M11 9.5h7m-2.5-2.25L18 9.5l-2.5 2.25" />
                </svg>
              </span>
              <div><strong>ລະດັບນ້ຳຂອງເຂື່ອນ</strong><small>MASL</small></div>
            </div>
            <div v-if="waterLevelLimits.length" class="water-level-limits" aria-label="ຂອບເຂດລະດັບນ້ຳ">
              <button
                v-for="limit in waterLevelLimits"
                :key="limit.field"
                type="button"
                class="water-level-limit"
                :class="{ 'is-hidden': !isWaterLevelLimitVisible(limit.field) }"
                :style="{ '--limit-color': limit.color }"
                :aria-pressed="isWaterLevelLimitVisible(limit.field)"
                :title="`${isWaterLevelLimitVisible(limit.field) ? 'Hide' : 'Show'} ${limit.label}`"
                @click="toggleWaterLevelLimit(limit.field)"
              >
                <span>
                  <Icon :name="limit.kind === 'high' ? 'lucide:arrow-up-to-line' : 'lucide:arrow-down-to-line'" size="15" />
                  <span>{{ limit.label }}</span>
                  <Icon
                    class="water-level-limit-toggle"
                    :name="isWaterLevelLimitVisible(limit.field) ? 'lucide:eye' : 'lucide:eye-off'"
                    size="13"
                  />
                </span>
                <strong>{{ formatMetric(limit.value) }} <small>MASL</small></strong>
              </button>
            </div>
            <div v-if="loading" class="chart-state"><span class="loader" /><span>ກຳລັງໂຫຼດ...</span></div>
            <div v-else-if="!waterData.length" class="chart-state"><Icon name="lucide:gauge" size="32" /><span>ບໍ່ມີຂໍ້ມູນ</span></div>
            <EChart
              v-else
              :data="waterLevelChartData"
              title=""
              x-field="D_DATE"
              :dark="true"
              :day-only-labels="activeType === 'D'"
              :series="waterLevelSeries"
              :current-marker="latestWaterLevelMarker"
            />
          </article>

          <article class="chart-card chart-card-wide">
            <div class="chart-title">
              <span class="chart-icon blue reservoir-metric-icon water-volume-icon" title="ບໍລິມາດນ້ຳ" role="img" aria-label="ບໍລິມາດນ້ຳ">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path class="reservoir-basin" d="M3.5 6.5h17L19 19.5H5L3.5 6.5Z" />
                  <path class="water-fill" d="M5 12.5c1.4-1 2.8-1 4.2 0s2.8 1 4.2 0 2.8-1 4.2 0c.55.4 1.1.65 1.65.72L18.6 18H5.4L5 12.5Z" />
                  <path class="volume-surface" d="M5 12.5c1.4-1 2.8-1 4.2 0s2.8 1 4.2 0 2.8-1 4.2 0c.55.4 1.1.65 1.65.72" />
                  <path class="capacity-mark" d="M7 9h3" />
                </svg>
              </span>
              <div><strong>ບໍລິມາດນ້ຳຂອງເຂື່ອນ</strong><small>MCM</small></div>
            </div>
            <div v-if="loading" class="chart-state"><span class="loader" /><span>ກຳລັງໂຫຼດ...</span></div>
            <div v-else-if="!waterData.length" class="chart-state"><Icon name="lucide:database" size="32" /><span>ບໍ່ມີຂໍ້ມູນ</span></div>
            <EChart
              v-else
              :data="waterVolumeChartData"
              title=""
              x-field="D_DATE"
              :dark="true"
              :day-only-labels="activeType === 'D'"
              :series="waterVolumeSeries"
              :current-marker="latestWaterVolumeMarker"
            />
          </article>
        </div>
      </section>

      <v-dialog v-model="chartFilterOpen" max-width="860" scrollable>
        <v-card id="chart-range-filter" class="chart-data-dialog" rounded="xl">
          <header class="chart-data-dialog-header">
            <div>
              <span class="chart-data-dialog-icon">
                <Icon :name="chartFilterContext === 'water' ? 'lucide:waves' : 'lucide:table-properties'" size="21" />
              </span>
              <span>
                <h2>{{ chartFilterContext === 'water' ? 'ການບໍລິຫານຈັດການນ້ຳ' : 'ພະລັງງານ ແລະ ລາຍຮັບ' }}</h2>
              </span>
            </div>
            <button type="button" class="chart-data-dialog-close" aria-label="ປິດ" @click="chartFilterOpen = false">
              <Icon name="lucide:x" size="20" />
            </button>
          </header>

          <div class="chart-data-dialog-content">
            <form class="chart-range-filter-panel" @submit.prevent="applyChartRange">
              <label>
                <input v-model="chartStartDate" type="date" aria-label="ຈາກວັນທີ" required>
              </label>
              <label>
                <input v-model="chartEndDate" type="date" aria-label="ຫາວັນທີ" required>
              </label>
              <div class="chart-range-filter-actions">
                <button type="button" class="chart-range-year-button" @click="setChartRangeToWholeYear">
                  <Icon name="lucide:calendar-days" size="16" />
                  ທັງ 12 ເດືອນ
                </button>
                <button type="submit" class="chart-range-apply-button" :disabled="loading">
                  <Icon name="lucide:filter" size="16" />
                  ກົດເລືອກ
                </button>
              </div>
            </form>

            <p v-if="chartFilterError" class="chart-range-error" role="alert">{{ chartFilterError }}</p>

            <div class="chart-data-range-summary">
              <span><Icon name="lucide:calendar-range" size="15" /> {{ rangeLabel }}</span>
              <span>{{ chartTableRows.length }} ລາຍການ</span>
            </div>

            <div class="chart-data-table-wrap">
              <table class="chart-data-table" :class="{ 'water-data-table': chartFilterContext === 'water' }">
                <thead>
                  <tr>
                    <th rowspan="2">ໄລຍະເວລາ</th>
                    <template v-if="chartFilterContext === 'water'">
                      <th colspan="2" class="energy-group">ປະລິມານນ້ຳເຂົ້າ (MCM)</th>
                      <th colspan="2" class="revenue-group">ປະລິມານນ້ຳອອກ (MCM)</th>
                    </template>
                    <template v-else>
                      <th colspan="2" class="energy-group">ພະລັງງານ (GWh)</th>
                      <th colspan="2" class="revenue-group">ລາຍຮັບ (MUSD)</th>
                    </template>
                  </tr>
                  <tr>
                    <th>ແຜນ</th>
                    <th>ຕົວຈິງ</th>
                    <th>ແຜນ</th>
                    <th>ຕົວຈິງ</th>
                  </tr>
                </thead>
                <tbody v-if="loading">
                  <tr><td colspan="5" class="chart-data-table-state"><span class="loader" /> ກຳລັງໂຫຼດ...</td></tr>
                </tbody>
                <tbody v-else-if="!chartTableRows.length">
                  <tr><td colspan="5" class="chart-data-table-state">ບໍ່ມີຂໍ້ມູນໃນຊ່ວງວັນທີນີ້</td></tr>
                </tbody>
                <tbody v-else>
                  <tr
                    v-for="row in chartTableRows"
                    :key="row.key"
                    :class="{ 'is-current-month': row.isCurrentMonth }"
                  >
                    <th scope="row">{{ row.label }}</th>
                    <template v-if="chartFilterContext === 'water'">
                      <td data-label="ແຜນນ້ຳເຂົ້າ (MCM)">{{ formatMetric(row.planInflow) }}</td>
                      <td class="actual-value" data-label="ນ້ຳເຂົ້າຕົວຈິງ (MCM)">{{ formatMetric(row.actualInflow) }}</td>
                      <td data-label="ແຜນນ້ຳອອກ (MCM)">{{ formatMetric(row.planOutflow) }}</td>
                      <td class="actual-value water-outflow-value" data-label="ນ້ຳອອກຕົວຈິງ (MCM)">{{ formatMetric(row.actualOutflow) }}</td>
                    </template>
                    <template v-else>
                      <td data-label="ແຜນພະລັງງານ (GWh)">{{ formatMetric(row.planEnergy) }}</td>
                      <td class="actual-value" data-label="ພະລັງງານຕົວຈິງ (GWh)">{{ formatMetric(row.actualEnergy) }}</td>
                      <td data-label="ແຜນລາຍຮັບ (MUSD)">{{ formatMetric(row.planRevenue) }}</td>
                      <td class="actual-value revenue-value" data-label="ລາຍຮັບຕົວຈິງ (MUSD)">{{ formatMetric(row.actualRevenue) }}</td>
                    </template>
                  </tr>
                </tbody>
                <tfoot v-if="!loading && chartTableRows.length">
                  <tr>
                    <th>ລວມທັງໝົດ</th>
                    <template v-if="chartFilterContext === 'water'">
                      <td data-label="ແຜນນ້ຳເຂົ້າ (MCM)">{{ formatMetric(totalInflowPlan) }}</td>
                      <td data-label="ນ້ຳເຂົ້າຕົວຈິງ (MCM)">{{ formatMetric(totalInflowActual) }}</td>
                      <td data-label="ແຜນນ້ຳອອກ (MCM)">{{ formatMetric(totalPlanOutflow) }}</td>
                      <td data-label="ນ້ຳອອກຕົວຈິງ (MCM)">{{ formatMetric(totalOutflow) }}</td>
                    </template>
                    <template v-else>
                      <td data-label="ແຜນພະລັງງານ (GWh)">{{ formatMetric(totalPlanEnergy) }}</td>
                      <td data-label="ພະລັງງານຕົວຈິງ (GWh)">{{ formatMetric(totalEnergy) }}</td>
                      <td data-label="ແຜນລາຍຮັບ (MUSD)">{{ formatMetric(totalPlanRevenue) }}</td>
                      <td data-label="ລາຍຮັບຕົວຈິງ (MUSD)">{{ formatMetric(totalRevenue) }}</td>
                    </template>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </v-card>
      </v-dialog>

      <InfoDialog v-model="dialog" title="ຂໍ້ມູນທົ່ວໄປຂອງເຂື່ອນ" :dam-code="code">
        <template #actions><v-btn variant="text" @click="dialog = false">ປິດ</v-btn></template>
      </InfoDialog>
    </main>
  </v-container>
</template>

<script setup>
import axios from "axios";
import moment from "moment";
import EChart from "~~/components/common/EChart.vue";
import InfoDialog from "~~/components/common/InfoDialog.vue";
import { getPlantBrand, getPlantShortName } from "~~/app/utils/plantNames";

const BarChart = defineAsyncComponent(() => import("~~/components/common/BarChart.vue"));

definePageMeta({ middleware: "auth", layout: "default" });

const route = useRoute();
const router = useRouter();

function getRouteItem() {
  try {
    return typeof route.query.item === "string" ? JSON.parse(route.query.item) : {};
  } catch {
    return {};
  }
}

const plant = getRouteItem();
const code = plant.D_DAM || String(route.query.code || "");
const branchName = getPlantShortName(code, plant.branch?.BR_NAME_EN || plant.BR_NAME_EN);
const plantBrand = getPlantBrand(code, plant.branch?.BR_NAME_EN || plant.BR_NAME_EN);

const dialog = ref(false);
const filterOpen = ref(false);
const chartFilterOpen = ref(false);
const chartFilterContext = ref("energy");
const chartFilterError = ref("");
const loading = ref(false);
const errorMessage = ref("");
const activeType = ref("M");
const startDate = ref(moment().startOf("year").format("YYYY-MM-DD"));
const endDate = ref(moment().endOf("year").format("YYYY-MM-DD"));
const chartStartDate = ref(startDate.value);
const chartEndDate = ref(endDate.value);
const selectedQuarter = ref(moment().quarter());
const selectedYear = ref(moment().year());
const allData = ref([]);
const waterData = ref([]);
const yesterdayData = ref([]);
const summaryData = ref([]);
const monthlyOutflowPlans = ref({});
const hiddenWaterLevelLimitFields = ref([]);
const yesterdayDate = moment().subtract(1, "day").format("YYYY-MM-DD");

const periodOptions = [
  { title: "ວັນ", value: "D" },
  { title: "ອາທິດ", value: "W" },
  { title: "ເດືອນ", value: "M" },
  { title: "ໄຕມາດ", value: "Q" },
  { title: "ປີ", value: "Y" },
];
const quarterOptions = [1, 2, 3, 4];

const rangeLabel = computed(() => startDate.value === endDate.value
  ? startDate.value
  : `${startDate.value} — ${endDate.value}`);

function summaryRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  return Array.isArray(payload) ? payload : [];
}

function plantSummaryRow(rows) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  return rows.find(row => (
    String(row.D_DAM || row.DAM_CODE || row.BR_CODE || "").trim().toUpperCase() === normalizedCode
  )) || rows.find(row => (
    row.IS_TOTAL === 1 || row.IS_TOTAL === "1" || String(row.D_DAM || "").toUpperCase() === "ALL"
  )) || rows[0];
}

function monthSummaryPeriods() {
  const start = moment(startDate.value, "YYYY-MM-DD", true);
  const end = moment(endDate.value, "YYYY-MM-DD", true);
  if (!start.isValid() || !end.isValid()) return [];

  const periods = [];
  const cursor = start.clone().startOf("month");
  while (cursor.isSameOrBefore(end, "month") && periods.length < 24) {
    periods.push({
      key: cursor.format("YYYY-MM"),
      date: moment.min(cursor.clone().endOf("month"), end).format("YYYY-MM-DD"),
    });
    cursor.add(1, "month");
  }
  return periods;
}

function monthlyPlanOutflowFromSummary(row) {
  if (!row) return undefined;
  const fields = ["MONTH_PLAN_OUTFLOW", "MONTH_OUTFLOW_PLAN", "SUM_PLAN_OUTFLOW", "SUM_OUTFLOW_PLAN"];
  const field = fields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
  return field ? toNumber(row[field]) : undefined;
}

function formatPeriodLabel(value) {
  const label = String(value ?? "").trim();
  if (!label) return "";

  const dateParts = label.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
  const compactDate = label.match(/^(\d{4})(\d{2})(\d{2})?$/);

  if (activeType.value === "D") {
    const day = dateParts?.[3] || compactDate?.[3];
    return day ? day.padStart(2, "0") : label;
  }

  if (activeType.value === "W") {
    const week = label.match(/(?:^|[-_/ ])W(?:EEK)?[-_ ]?(\d{1,2})$/i)
      || label.match(/^\d{4}[-_/ ]?(\d{1,2})$/);
    return week ? `W${week[1].padStart(2, "0")}` : label;
  }

  if (activeType.value === "M") {
    const month = dateParts?.[2] || compactDate?.[2];
    return month ? month.padStart(2, "0") : label;
  }

  if (activeType.value === "Q") {
    const quarter = label.match(/(?:^|[-_/ ])Q(?:UARTER)?[-_ ]?(\d)$/i);
    if (quarter) return `Q${quarter[1]}`;
    const month = Number(dateParts?.[2] || compactDate?.[2]);
    return month ? String(month).padStart(2, "0") : label;
  }

  if (activeType.value === "Y") {
    const year = label.match(/\d{4}/);
    return year ? year[0] : label;
  }

  return label;
}

const labels = computed(() => allData.value.map(row => formatPeriodLabel(row.PERIOD_LABEL)));

function isCurrentMonthPeriod(value, currentMonth, rangeYear) {
  const period = String(value ?? "").trim();
  const yearMonth = period.match(/^(\d{4})[-/](\d{1,2})/);
  if (yearMonth) {
    return Number(yearMonth[1]) === currentMonth.year()
      && Number(yearMonth[2]) === currentMonth.month() + 1;
  }

  const compactYearMonth = period.match(/^(\d{4})(\d{2})/);
  if (compactYearMonth) {
    return Number(compactYearMonth[1]) === currentMonth.year()
      && Number(compactYearMonth[2]) === currentMonth.month() + 1;
  }

  const monthYear = period.match(/^(\d{1,2})[-/](\d{4})$/);
  if (monthYear) {
    return Number(monthYear[1]) === currentMonth.month() + 1
      && Number(monthYear[2]) === currentMonth.year();
  }

  return /^\d{1,2}$/.test(period)
    && Number(period) === currentMonth.month() + 1
    && rangeYear === currentMonth.year();
}

const chartTableRows = computed(() => {
  const start = moment(startDate.value, "YYYY-MM-DD", true);
  const end = moment(endDate.value, "YYYY-MM-DD", true);
  const currentMonth = moment();
  const rows = allData.value.map((row, index) => ({
    key: String(row.PERIOD_LABEL ?? index),
    label: formatPeriodLabel(row.PERIOD_LABEL) || String(index + 1),
    actualEnergy: toNumber(row.SUM_ACTUAL_ENERGY),
    planEnergy: toNumber(row.SUM_PLAN_ENERGY),
    actualRevenue: toNumber(row.SUM_ACTUAL_REVENUE),
    planRevenue: toNumber(row.SUM_PLAN_REVENUE),
    actualInflow: toNumber(row.SUM_INFLOW_ACTUAL),
    planInflow: toNumber(row.SUM_INFLOW_PLAN),
    actualOutflow: toNumber(row.SUM_OUTFLOW),
    planOutflow: toNumber(outflowPlanSeriesData.value[index]),
    isCurrentMonth: activeType.value === "M"
      && isCurrentMonthPeriod(row.PERIOD_LABEL, currentMonth, start.year()),
  }));

  const isWholeYear = activeType.value === "M"
    && start.isValid()
    && end.isValid()
    && start.year() === end.year()
    && start.isSame(start.clone().startOf("year"), "day")
    && end.isSame(end.clone().endOf("year"), "day");

  if (!isWholeYear || !rows.length) return rows;

  const rowsByMonth = new Map(rows.map(row => [String(row.label).slice(-2).padStart(2, "0"), row]));
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const row = rowsByMonth.get(month);
    return row
      ? {
          ...row,
          key: `${start.year()}-${month}`,
          label: `${month}/${start.year()}`,
          isCurrentMonth: start.year() === currentMonth.year() && index === currentMonth.month(),
        }
      : {
          key: `${start.year()}-${month}`,
          label: `${month}/${start.year()}`,
          actualEnergy: 0,
          planEnergy: 0,
          actualRevenue: 0,
          planRevenue: 0,
          actualInflow: 0,
          planInflow: 0,
          actualOutflow: 0,
          planOutflow: 0,
          isCurrentMonth: start.year() === currentMonth.year() && index === currentMonth.month(),
        };
  });
});

const energySeries = computed(() => [
  {
    name: "ພະລັງງານຕົວຈິງ",
    data: allData.value.map(row => row.SUM_ACTUAL_ENERGY),
    color: "#24d1dc",
    barMaxWidth: 18,
    radius: [4, 4, 0, 0],
    showValues: true,
    labelColor: "#9af5f3",
  },
  {
    name: "ພະລັງງານໃນແຜນ",
    data: allData.value.map(row => row.SUM_PLAN_ENERGY),
    color: "#f6c85f",
    barMaxWidth: 14,
    radius: [4, 4, 0, 0],
    showValues: true,
    labelColor: "#ffe2a0",
  },
]);

const revenueSeries = computed(() => [
  {
    name: "ລາຍຮັບຕົວຈິງ",
    data: allData.value.map(row => row.SUM_ACTUAL_REVENUE),
    color: "#24d1dc",
    barMaxWidth: 18,
    radius: [4, 4, 0, 0],
    showValues: true,
    labelColor: "#9af5f3",
  },
  {
    name: "ລາຍຮັບໃນແຜນ",
    data: allData.value.map(row => row.SUM_PLAN_REVENUE),
    color: "#f6c85f",
    barMaxWidth: 14,
    radius: [4, 4, 0, 0],
    showValues: true,
    labelColor: "#ffe2a0",
  },
]);

function toggleChartFilter(context = "energy") {
  const isCurrentContext = chartFilterContext.value === context;
  chartFilterContext.value = context;
  chartFilterOpen.value = isCurrentContext ? !chartFilterOpen.value : true;
  if (!chartFilterOpen.value) return;
  chartFilterError.value = "";
  chartStartDate.value = startDate.value;
  chartEndDate.value = endDate.value;
}

function setChartRangeToWholeYear() {
  const draftYear = moment(chartStartDate.value, "YYYY-MM-DD", true);
  const year = draftYear.isValid() ? draftYear.year() : moment().year();
  activeType.value = "M";
  selectedYear.value = year;
  chartStartDate.value = `${year}-01-01`;
  chartEndDate.value = `${year}-12-31`;
}

async function applyChartRange() {
  chartFilterError.value = "";
  if (!chartStartDate.value || !chartEndDate.value || chartStartDate.value > chartEndDate.value) {
    chartFilterError.value = "ກະລຸນາເລືອກຊ່ວງວັນທີໃຫ້ຖືກຕ້ອງ";
    return;
  }

  startDate.value = chartStartDate.value;
  endDate.value = chartEndDate.value;
  await loadDashboardData();
  if (errorMessage.value) chartFilterError.value = errorMessage.value;
}

const inflowSeries = computed(() => {
  const actualData = allData.value.map(row => row.SUM_INFLOW_ACTUAL);
  const planData = allData.value.map(row => row.SUM_INFLOW_PLAN);

  return [
    {
      name: "ນ້ຳເຂົ້າຕົວຈິງ",
      data: actualData,
      color: "#24d1dc",
      barMaxWidth: 18,
      radius: [4, 4, 0, 0],
      showValues: true,
      labelColor: "#9af5f3",
    },
    {
      name: "ແຜນນ້ຳເຂົ້າ",
      data: planData,
      color: "#f6c85f",
      barMaxWidth: 14,
      radius: [4, 4, 0, 0],
      showValues: true,
      labelColor: "#ffe2a0",
    },
  ];
});
const outflowPlanFields = [
  "SUM_PLAN_OUTFLOW",
  "SUM_OUTFLOW_PLAN",
  "DAY_PLAN_OUTFLOW",
  "DAY_OUTFLOW_PLAN",
  "DAY_PLAN_TURBINE",
  "DAY_TURBINE_PLAN",
  "WEEK_PLAN_OUTFLOW",
  "WEEK_OUTFLOW_PLAN",
  "WEEK_PLAN_TURBINE",
  "WEEK_TURBINE_PLAN",
  "QUARTER_PLAN_OUTFLOW",
  "QUARTER_OUTFLOW_PLAN",
  "QUARTER_PLAN_TURBINE",
  "QUARTER_TURBINE_PLAN",
  "Q_PLAN_OUTFLOW",
  "Q_OUTFLOW_PLAN",
  "Q_PLAN_TURBINE",
  "Q_TURBINE_PLAN",
  "YEAR_PLAN_OUTFLOW",
  "YEAR_OUTFLOW_PLAN",
  "YEAR_PLAN_TURBINE",
  "YEAR_TURBINE_PLAN",
  "MONTH_PLAN_OUTFLOW",
  "MONTH_OUTFLOW_PLAN",
  "MONTH_PLAN_TURBINE",
  "MONTH_TURBINE_PLAN",
  "D_PLAN_OUTFLOW",
  "PLAN_OUTFLOW",
  "OUTFLOW_PLAN",
  "D_PLAN_TURBINE",
  "PLAN_TURBINE",
  "SUM_PLAN_TURBINE",
  "SUM_TURBINE_PLAN",
  "TURBINE_PLAN",
];

function planOutflowValue(row) {
  const field = outflowPlanFields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
  return field ? toNumber(row[field]) : 0;
}

const annualOutflowPlanFields = [
  "YEAR_PLAN_OUTFLOW",
  "YEAR_OUTFLOW_PLAN",
  "YEAR_PLAN_TURBINE",
  "YEAR_TURBINE_PLAN",
  "SUM_PLAN_OUTFLOW",
  "SUM_OUTFLOW_PLAN",
];

function annualOutflowPlanValue() {
  const summaryPlan = firstNumericFieldValue(plantSummaryRow(summaryData.value), annualOutflowPlanFields);
  if (summaryPlan !== null && summaryPlan > 0) return summaryPlan;

  const periodPlans = allData.value
    .map(row => firstNumericFieldValue(row, annualOutflowPlanFields))
    .filter(value => value !== null && value > 0);

  // Annual plan fields can be repeated in period rows, so use one value.
  return periodPlans.length ? Math.max(...periodPlans) : 0;
}

const monthlyOutflowPlanByPeriod = computed(() => {
  const totals = new Map();
  const dailyPlanFields = [
    "DAY_PLAN_OUTFLOW",
    "DAY_OUTFLOW_PLAN",
    "D_PLAN_OUTFLOW",
    "PLAN_OUTFLOW",
    "OUTFLOW_PLAN",
    "DAY_PLAN_TURBINE",
    "DAY_TURBINE_PLAN",
    "D_PLAN_TURBINE",
    "PLAN_TURBINE",
    "TURBINE_PLAN",
  ];

  waterData.value.forEach((row) => {
    const dateValue = row.D_DATE ?? row.DATE ?? row.DATA_DATE;
    if (!dateValue) return;
    const date = moment(dateValue);
    if (!date.isValid()) return;

    const field = dailyPlanFields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
    if (!field) return;

    const key = activeType.value === "D"
      ? date.format("YYYY-MM-DD")
      : activeType.value === "W"
        ? date.format("GGGG-[W]WW")
        : activeType.value === "Y"
          ? date.format("YYYY")
          : date.format("YYYY-MM");
    totals.set(key, (totals.get(key) || 0) + toNumber(row[field]));
  });

  return totals;
});

function outflowPlanPeriodKey(row, index) {
  const period = String(row.PERIOD_LABEL ?? "").trim();
  const rangeStart = moment(startDate.value, "YYYY-MM-DD", true);

  if (activeType.value === "D") {
    const fullDate = period.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (fullDate) return `${fullDate[1]}-${fullDate[2].padStart(2, "0")}-${fullDate[3].padStart(2, "0")}`;
    const compactDate = period.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compactDate) return `${compactDate[1]}-${compactDate[2]}-${compactDate[3]}`;
    if (rangeStart.isValid() && /^\d{1,2}$/.test(period)) {
      return rangeStart.clone().date(Number(period)).format("YYYY-MM-DD");
    }
    return rangeStart.isValid() ? rangeStart.clone().add(index, "day").format("YYYY-MM-DD") : "";
  }

  if (activeType.value === "W") {
    const yearWeek = period.match(/^(\d{4})[-_/ ]?W?(\d{1,2})$/i);
    if (yearWeek) return `${yearWeek[1]}-W${yearWeek[2].padStart(2, "0")}`;
    const weekOnly = period.match(/^W(?:EEK)?[-_ ]?(\d{1,2})$/i);
    if (weekOnly && rangeStart.isValid()) return `${rangeStart.isoWeekYear()}-W${weekOnly[1].padStart(2, "0")}`;
    return rangeStart.isValid()
      ? rangeStart.clone().startOf("isoWeek").add(index, "week").format("GGGG-[W]WW")
      : "";
  }

  const yearMonth = period.match(/^(\d{4})[-/](\d{1,2})/);
  if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}`;

  const monthYear = period.match(/^(\d{1,2})[-/](\d{4})$/);
  if (monthYear) return `${monthYear[2]}-${monthYear[1].padStart(2, "0")}`;

  const compactYearMonth = period.match(/^(\d{4})(\d{2})/);
  if (compactYearMonth) return `${compactYearMonth[1]}-${compactYearMonth[2]}`;

  const month = /^\d{1,2}$/.test(period) ? Number(period) : index + 1;
  return rangeStart.isValid() && month >= 1 && month <= 12
    ? `${rangeStart.year()}-${String(month).padStart(2, "0")}`
    : "";
}

const outflowPlanSeriesData = computed(() => allData.value.map((row, index) => {
  const periodPlan = planOutflowValue(row);
  if (periodPlan > 0) return periodPlan;
  if (activeType.value === "Y") return annualOutflowPlanValue();
  const periodKey = outflowPlanPeriodKey(row, index);
  if (!periodKey) return 0;
  if (Object.prototype.hasOwnProperty.call(monthlyOutflowPlans.value, periodKey)) {
    return toNumber(monthlyOutflowPlans.value[periodKey]);
  }
  return toNumber(monthlyOutflowPlanByPeriod.value.get(periodKey));
}));

const outflowSeries = computed(() => [
  {
    name: "ນ້ຳອອກຕົວຈິງ",
    data: allData.value.map(row => row.SUM_OUTFLOW),
    color: "#24d1dc",
    barMaxWidth: 18,
    radius: [4, 4, 0, 0],
    showValues: true,
    labelColor: "#9af5f3",
  },
  {
    name: "ແຜນນ້ຳອອກ",
    data: outflowPlanSeriesData.value,
    color: "#f6c85f",
    barMaxWidth: 14,
    radius: [4, 4, 0, 0],
    showValues: true,
    labelColor: "#ffe2a0",
  },
]);

const waterLevelLimitDefinitions = [
  { field: "HIGH_WATER_LEVEL", label: "ສູງສຸດເຂື່ອນຫຼັກ", kind: "high", color: "#ff5667" },
  { field: "LOW_WATER_LEVEL", label: "ຕ່ຳສຸດເຂື່ອນຫຼັກ", kind: "low", color: "#55aaff" },
  { field: "HIGH_WATER_LEVEL_DIVERSION", label: "ສູງສຸດເຂື່ອນອວ່າຍນ້ຳ", kind: "high", color: "#ff8791" },
  { field: "LOW_WATER_LEVEL_DIVERSION", label: "ຕ່ຳສຸດເຂື່ອນອວ່າຍນ້ຳ", kind: "low", color: "#a795ff" },
];

function isWaterLevelLimitVisible(field) {
  return !hiddenWaterLevelLimitFields.value.includes(field);
}

function toggleWaterLevelLimit(field) {
  hiddenWaterLevelLimitFields.value = isWaterLevelLimitVisible(field)
    ? [...hiddenWaterLevelLimitFields.value, field]
    : hiddenWaterLevelLimitFields.value.filter(item => item !== field);
}

function waterLevelLimitValue(field) {
  const row = [...waterData.value, ...summaryData.value].find(item => (
    item[field] !== undefined
    && item[field] !== null
    && item[field] !== ""
    && Number.isFinite(Number(String(item[field]).replace(/,/g, "")))
  ));
  return row ? toNumber(row[field]) : null;
}

const waterLevelLimits = computed(() => waterLevelLimitDefinitions
  .map(limit => ({ ...limit, value: waterLevelLimitValue(limit.field) }))
  .filter(limit => limit.value !== null));

const mainWaterLevelPlanFields = [
  "D_PLAN_WL",
  "D_PLAN_MAIN_WL",
  "D_MAIN_PLAN_WL",
  "D_PLAN_WL_MAIN",
];
const diversionWaterLevelPlanFields = [
  "D_PLAN_DIVERSION_WL",
  "D_DIVERSION_PLAN_WL",
  "D_PLAN_WL_DIVERSION",
  "D_DIVERSION_WL_PLAN",
];

function firstNumericFieldValue(row, fields) {
  const field = fields.find((name) => {
    const value = row?.[name];
    return value !== undefined
      && value !== null
      && value !== ""
      && Number.isFinite(Number(String(value).replace(/,/g, "")));
  });
  return field ? toNumber(row[field]) : null;
}

const waterLevelChartData = computed(() => {
  const limitValues = Object.fromEntries(waterLevelLimits.value.map(limit => [limit.field, limit.value]));
  return waterData.value.map(row => ({
    ...row,
    ...limitValues,
    __MAIN_PLAN_WL: firstNumericFieldValue(row, mainWaterLevelPlanFields),
    __DIVERSION_PLAN_WL: firstNumericFieldValue(row, diversionWaterLevelPlanFields),
  }));
});

const mainPlanVolumeFields = [
  "D_PLAN_MAIN_VOLUME",
  "D_MAIN_PLAN_VOLUME",
  "DAY_PLAN_MAIN_VOLUME",
  "DAY_MAIN_PLAN_VOLUME",
  "WEEK_PLAN_MAIN_VOLUME",
  "WEEK_MAIN_PLAN_VOLUME",
  "MONTH_PLAN_MAIN_VOLUME",
  "MONTH_MAIN_PLAN_VOLUME",
  "YEAR_PLAN_MAIN_VOLUME",
  "YEAR_MAIN_PLAN_VOLUME",
];
const diversionPlanVolumeFields = [
  "D_PLAN_DIVERSION_VOLUME",
  "D_DIVERSION_PLAN_VOLUME",
  "DAY_PLAN_DIVERSION_VOLUME",
  "DAY_DIVERSION_PLAN_VOLUME",
  "WEEK_PLAN_DIVERSION_VOLUME",
  "WEEK_DIVERSION_PLAN_VOLUME",
  "MONTH_PLAN_DIVERSION_VOLUME",
  "MONTH_DIVERSION_PLAN_VOLUME",
  "YEAR_PLAN_DIVERSION_VOLUME",
  "YEAR_DIVERSION_PLAN_VOLUME",
];
const mainPlanUsableVolumeFields = [
  "D_PLAN_MAIN_USE_VOLUME",
  "D_MAIN_PLAN_USE_VOLUME",
  "D_PLAN_MAIN_USABLE_VOLUME",
  "D_MAIN_PLAN_USABLE_VOLUME",
  "DAY_PLAN_MAIN_USABLE_VOLUME",
  "WEEK_PLAN_MAIN_USABLE_VOLUME",
  "MONTH_PLAN_MAIN_USABLE_VOLUME",
  "YEAR_PLAN_MAIN_USABLE_VOLUME",
  "YEAR_MAIN_PLAN_USABLE_VOLUME",
];
const diversionPlanUsableVolumeFields = [
  "D_PLAN_DIVERSION_USE_VOLUME",
  "D_DIVERSION_PLAN_USE_VOLUME",
  "D_PLAN_DIVERSION_USABLE_VOLUME",
  "D_DIVERSION_PLAN_USABLE_VOLUME",
  "DAY_PLAN_DIVERSION_USABLE_VOLUME",
  "WEEK_PLAN_DIVERSION_USABLE_VOLUME",
  "MONTH_PLAN_DIVERSION_USABLE_VOLUME",
  "YEAR_PLAN_DIVERSION_USABLE_VOLUME",
  "YEAR_DIVERSION_PLAN_USABLE_VOLUME",
];

const waterVolumeChartData = computed(() => waterData.value.map(row => ({
  ...row,
  __MAIN_PLAN_VOLUME: firstNumericFieldValue(row, mainPlanVolumeFields),
  __DIVERSION_PLAN_VOLUME: firstNumericFieldValue(row, diversionPlanVolumeFields),
  __MAIN_PLAN_USABLE_VOLUME: firstNumericFieldValue(row, mainPlanUsableVolumeFields),
  __DIVERSION_PLAN_USABLE_VOLUME: firstNumericFieldValue(row, diversionPlanUsableVolumeFields),
})));

function latestWaterMarker(fields) {
  const latestRow = waterData.value
    .filter((row) => {
      const date = moment(row.D_DATE);
      const hasActualValue = fields.some(field => toNumber(row[field]) > 0);
      return date.isValid() && hasActualValue;
    })
    .sort((a, b) => moment(b.D_DATE).valueOf() - moment(a.D_DATE).valueOf())[0];

  if (!latestRow) return null;
  return {
    value: latestRow.D_DATE,
    label: `ຂໍ້ມູນລ່າສຸດ\n${moment(latestRow.D_DATE).format("DD/MM/YYYY")}`,
    color: "#f6bd55",
  };
}

const latestWaterLevelMarker = computed(() => latestWaterMarker(["D_MAIN", "D_DIVERSION"]));
const latestWaterVolumeMarker = computed(() => latestWaterMarker([
  "D_MAIN_VOLUME",
  "D_DIVERSION_VOLUME",
  "D_MAIN_USE_VOLUME",
  "D_DIVERSION_USE_VOLUME",
]));

const waterLevelSeries = computed(() => [
  { field: "D_MAIN", label: "ລະດັບນ້ຳຕົວຈິງ (ເຂື່ອນຫຼັກ)", color: "#2f8dea" },
  { field: "D_DIVERSION", label: "ລະດັບນ້ຳຕົວຈິງ (ເຂື່ອນອ່ວາຍນ້ຳ)", color: "#38b9d6" },
  { field: "__MAIN_PLAN_WL", label: "ແຜນລະດັບນ້ຳ (ເຂື່ອນຫຼັກ)", color: "#74cda8", area: false },
  { field: "__DIVERSION_PLAN_WL", label: "ແຜນລະດັບນ້ຳ (ເຂື່ອນອ່ວາຍນ້ຳ)", color: "#f6c85f", area: false },
  ...waterLevelLimitDefinitions
    .filter(limit => isWaterLevelLimitVisible(limit.field))
    .map(limit => ({
    ...limit,
    area: false,
    hideInLegend: true,
    markPoint: false,
    referenceLine: true,
    })),
]);
const waterVolumeSeries = [
  { field: "D_MAIN_VOLUME", label: "ບໍລິມາດນ້ຳເຂື່ອນຫຼັກທັງໝົດ", color: "#2f8dea" },
  { field: "D_DIVERSION_VOLUME", label: "ບໍລິມາດນ້ຳເຂື່ອນອ່ວາຍນ້ຳທັງໝົດ", color: "#38b9d6" },
  { field: "D_MAIN_USE_VOLUME", label: "ບໍລິມາດນ້ຳທີ່ໃຊ້ໄດ້ເຂື່ອນຫຼັກທັງໝົດ", color: "#74cda8", area: false },
  { field: "D_DIVERSION_USE_VOLUME", label: "ບໍລິມາດນ້ຳທີ່ໃຊ້ໄດ້ເຂື່ອນອ່ວາຍນ້ຳທັງໝົດ", color: "#9bc9f5", area: false },
  { field: "__MAIN_PLAN_VOLUME", label: "ແຜນບໍລິມາດນ້ຳທັງໝົດ (ເຂື່ອນຫຼັກ)", color: "#f6c85f", area: false, lineType: "dashed" },
  { field: "__DIVERSION_PLAN_VOLUME", label: "ແຜນບໍລິມາດນ້ຳທັງໝົດ (ເຂື່ອນອ່ວາຍນ້ຳ)", color: "#f0a957", area: false, lineType: "dashed" },
  { field: "__MAIN_PLAN_USABLE_VOLUME", label: "ແຜນບໍລິມາດນ້ຳທີ່ໃຊ້ໄດ້ທັງໝົດ (ເຂື່ອນຫຼັກ)", color: "#d5e86a", area: false, lineType: "dashed" },
  { field: "__DIVERSION_PLAN_USABLE_VOLUME", label: "ແຜນບໍລິມາດນ້ຳທີ່ໃຊ້ໄດ້ທັງໝົດ (ເຂື່ອນອ່ວາຍນ້ຳ)", color: "#c9a7ff", area: false, lineType: "dashed" },
];

function toNumber(value) {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumField(field) {
  return allData.value.reduce((sum, row) => sum + toNumber(row[field]), 0);
}

const totalEnergy = computed(() => sumField("SUM_ACTUAL_ENERGY"));
const totalPlanEnergy = computed(() => sumField("SUM_PLAN_ENERGY"));
const totalRevenue = computed(() => sumField("SUM_ACTUAL_REVENUE"));
const totalPlanRevenue = computed(() => sumField("SUM_PLAN_REVENUE"));
const totalInflowActual = computed(() => sumField("SUM_INFLOW_ACTUAL"));
const totalInflowPlan = computed(() => sumField("SUM_INFLOW_PLAN"));
const totalOutflow = computed(() => sumField("SUM_OUTFLOW"));
const totalPlanOutflow = computed(() => {
  const start = moment(startDate.value, "YYYY-MM-DD", true);
  const end = moment(endDate.value, "YYYY-MM-DD", true);
  const isWholeYear = start.isValid()
    && end.isValid()
    && start.year() === end.year()
    && start.isSame(start.clone().startOf("year"), "day")
    && end.isSame(end.clone().endOf("year"), "day");

  if ((activeType.value === "M" && isWholeYear) || activeType.value === "Y") {
    const annualPlan = annualOutflowPlanValue();
    if (annualPlan > 0) return annualPlan;
  }

  return outflowPlanSeriesData.value.reduce((sum, value) => sum + toNumber(value), 0);
});

function hasYesterdayMetric(...fields) {
  return yesterdayData.value.some(row => fields.some(
    field => row[field] !== undefined && row[field] !== null && row[field] !== "",
  ));
}

function yesterdayMetric(...fields) {
  return yesterdayData.value.reduce((sum, row) => {
    const field = fields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
    return sum + (field ? toNumber(row[field]) : 0);
  }, 0);
}

const yesterdayEnergyFields = ["D_ACTUAL_ENERGY", "SUM_ACTUAL_ENERGY", "ACTUAL_ENERGY"];
const yesterdayPlanEnergyFields = ["D_PLAN_ENERGY", "SUM_PLAN_ENERGY", "PLAN_ENERGY"];
const yesterdayRevenueFields = ["D_ACTUAL_REVENUE", "SUM_ACTUAL_REVENUE", "ACTUAL_REVENUE"];
const yesterdayPlanRevenueFields = ["D_PLAN_REVENUE", "SUM_PLAN_REVENUE", "PLAN_REVENUE"];
const hasYesterdayEnergy = computed(() => hasYesterdayMetric(...yesterdayEnergyFields));
const hasYesterdayPlanEnergy = computed(() => hasYesterdayMetric(...yesterdayPlanEnergyFields));
const hasYesterdayRevenue = computed(() => hasYesterdayMetric(...yesterdayRevenueFields));
const hasYesterdayPlanRevenue = computed(() => hasYesterdayMetric(...yesterdayPlanRevenueFields));
const yesterdayEnergy = computed(() => yesterdayMetric(...yesterdayEnergyFields));
const yesterdayPlanEnergy = computed(() => yesterdayMetric(...yesterdayPlanEnergyFields));
const yesterdayRevenue = computed(() => yesterdayMetric(...yesterdayRevenueFields));
const yesterdayPlanRevenue = computed(() => yesterdayMetric(...yesterdayPlanRevenueFields));

function performance(actual, plan) {
  const percent = plan > 0 ? (actual / plan) * 100 : 0;
  if (!plan) return { percentage: "—", text: "ຍັງບໍ່ມີຂໍ້ມູນແຜນ", tone: "neutral", icon: "lucide:minus", bar: 0 };
  if (percent >= 100) return { percentage: `${percent.toFixed(1)}%`, text: `${percent.toFixed(1)}% ຂອງແຜນ · ເກີນເປົ້າໝາຍ`, tone: "positive", icon: "lucide:trending-up", bar: 100 };
  return { percentage: `${percent.toFixed(1)}%`, text: `${percent.toFixed(1)}% ຂອງແຜນ`, tone: "warning", icon: "lucide:trending-down", bar: Math.max(3, percent) };
}

const energyPerformance = computed(() => performance(totalEnergy.value, totalPlanEnergy.value));
const revenuePerformance = computed(() => performance(totalRevenue.value, totalPlanRevenue.value));

function formatMetric(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(toNumber(value));
}

function getYearWeek(date) {
  const value = moment(date);
  return `${value.isoWeekYear()}${String(value.isoWeek()).padStart(2, "0")}`;
}

function requestParams(extra = {}) {
  const params = { start: startDate.value, end: endDate.value, code, ...extra };
  if (activeType.value === "W") {
    params.yearweek_start = getYearWeek(startDate.value);
    params.yearweek_end = getYearWeek(endDate.value);
  }
  return params;
}

function isValidQuarterSelection() {
  const year = Number(selectedYear.value);
  const quarter = Number(selectedQuarter.value);
  return Number.isInteger(year)
    && year >= 2000
    && year <= 2100
    && quarterOptions.includes(quarter);
}

function syncQuarterRange() {
  if (!isValidQuarterSelection()) return false;
  const quarterDate = moment()
    .year(Number(selectedYear.value))
    .quarter(Number(selectedQuarter.value));
  startDate.value = quarterDate.clone().startOf("quarter").format("YYYY-MM-DD");
  endDate.value = quarterDate.clone().endOf("quarter").format("YYYY-MM-DD");
  return true;
}

function syncYearRange() {
  const year = Number(selectedYear.value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return false;
  startDate.value = `${year}-01-01`;
  endDate.value = `${year}-12-31`;
  return true;
}

function setDefaultRange(type) {
  const current = moment();
  if (type === "Q") {
    selectedQuarter.value = current.quarter();
    selectedYear.value = current.year();
    syncQuarterRange();
  } else if (type === "Y") {
    selectedYear.value = current.year();
    syncYearRange();
  } else if (type === "M") {
    startDate.value = current.startOf("year").format("YYYY-MM-DD");
    endDate.value = current.endOf("year").format("YYYY-MM-DD");
  } else {
    startDate.value = current.startOf("month").format("YYYY-MM-DD");
    endDate.value = current.endOf("month").format("YYYY-MM-DD");
  }
}

async function selectPeriod(type) {
  if (activeType.value === type) return;
  activeType.value = type;
  setDefaultRange(type);
  await loadDashboardData();
  if (type === "Q" || type === "Y") filterOpen.value = true;
}

async function applyFilters() {
  if (activeType.value === "Q" && !syncQuarterRange()) {
    errorMessage.value = "ກະລຸນາເລືອກໄຕມາດ ແລະ ປີໃຫ້ຖືກຕ້ອງ";
    return;
  }
  if (activeType.value === "Y" && !syncYearRange()) {
    errorMessage.value = "ກະລຸນາເລືອກປີໃຫ້ຖືກຕ້ອງ";
    return;
  }
  await loadDashboardData();
}

async function loadDashboardData() {
  if (!code) {
    errorMessage.value = "ບໍ່ພົບລະຫັດເຂື່ອນ";
    return;
  }
  if (!startDate.value || !endDate.value || startDate.value > endDate.value) {
    errorMessage.value = "ກະລຸນາເລືອກຊ່ວງວັນທີໃຫ້ຖືກຕ້ອງ";
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  // Quarter bars are monthly too, so use the same per-month plan source.
  const monthlyPeriods = ["M", "Q"].includes(activeType.value) ? monthSummaryPeriods() : [];
  const monthlyPlanRequest = Promise.allSettled(monthlyPeriods.map(period => axios.get("/api/data/sum", {
    params: { dateselect: period.date, dam: code },
  })));
  const [periodResult, waterResult, yesterdayResult, summaryResult, monthlyPlanResult] = await Promise.allSettled([
    axios.get("/api/data/period", {
      params: requestParams({ type: activeType.value === "Q" ? "M" : activeType.value }),
    }),
    axios.get("/api/data/dam", { params: requestParams() }),
    axios.get("/api/data/dam", {
      params: { start: yesterdayDate, end: yesterdayDate, code },
    }),
    axios.get("/api/data/sum", {
      params: { dateselect: endDate.value, dam: code },
    }),
    monthlyPlanRequest,
  ]);

  allData.value = periodResult.status === "fulfilled" && Array.isArray(periodResult.value.data?.data)
    ? periodResult.value.data.data
    : [];
  waterData.value = waterResult.status === "fulfilled" && Array.isArray(waterResult.value.data?.data)
    ? waterResult.value.data.data
    : [];
  yesterdayData.value = yesterdayResult.status === "fulfilled" && Array.isArray(yesterdayResult.value.data?.data)
    ? yesterdayResult.value.data.data
    : [];
  const summaryPayload = summaryResult.status === "fulfilled" ? summaryResult.value.data : null;
  summaryData.value = summaryRows(summaryPayload);

  const nextMonthlyOutflowPlans = {};
  if (monthlyPlanResult.status === "fulfilled") {
    monthlyPlanResult.value.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const rows = summaryRows(result.value.data);
      const value = monthlyPlanOutflowFromSummary(plantSummaryRow(rows));
      if (value !== undefined) nextMonthlyOutflowPlans[monthlyPeriods[index].key] = value;
    });
  }
  monthlyOutflowPlans.value = nextMonthlyOutflowPlans;

  if (periodResult.status === "rejected" && waterResult.status === "rejected") {
    const error = periodResult.reason || waterResult.reason;
    errorMessage.value = error?.response?.data?.statusMessage
      || error?.response?.data?.message
      || "ບໍ່ສາມາດໂຫຼດຂໍ້ມູນເຂື່ອນໄດ້";
  }
  loading.value = false;
  filterOpen.value = false;
}

/* Follow the display mode chosen on the main dashboard (DUAL ປຽບທຽບ / POWER ຄອນໂຊນ share one theme) */
const dualView = ref(false);

onMounted(() => {
  try {
    dualView.value = ["dual", "console"].includes(localStorage.getItem("dashboardMetricDisplayMode"));
  } catch {
    dualView.value = false;
  }
  loadDashboardData();
});
</script>

<style scoped>
.plant-page { min-height: calc(100vh - 64px); background: #101216; color: #f7f8fa; }
.plant-dashboard { width: min(1500px, 100%); margin: 0 auto; padding: 30px clamp(18px, 3vw, 48px) 52px; }
.plant-header, .plant-identity, .header-actions, .kpi-heading, .section-heading, .chart-title { display: flex; align-items: center; }
.plant-header { justify-content: space-between; gap: 22px; margin-bottom: 26px; }
.plant-identity { gap: 15px; min-width: 0; }
.plant-title-block { min-width: 0; }
.plant-title-row { display: flex; align-items: center; gap: 11px; }
.plant-identity h1 { min-width: 0; font-size: clamp(1.35rem, 2.3vw, 2rem); line-height: 1.2; }
.detail-plant-logo {
  display: grid; place-items: center; flex: 0 0 46px; width: 46px; height: 40px;
  overflow: hidden; border: 1px solid color-mix(in srgb, var(--plant-accent, #38bdf8) 58%, transparent);
  border-radius: 10px; background: color-mix(in srgb, var(--plant-accent, #38bdf8) 15%, #17202a);
  color: var(--plant-accent, #38bdf8); font-size: .72rem; font-weight: 900;
}
.detail-plant-logo.has-logo {
  flex-basis: 78px; width: 78px; height: 68px; padding: 4px;
  border-color: rgba(255,255,255,.3); background: #fff;
  box-shadow: 0 7px 22px rgba(16,117,164,.2);
}
.detail-plant-logo img {
  display: block; width: 100%; height: 100%; border-radius: 7px;
  object-fit: contain; object-position: center;
}
.section-kicker { color: #ff8314; font-size: .7rem; font-weight: 900; letter-spacing: .15em; }
.header-actions { gap: 9px; }
.icon-button, .date-badge { border: 1px solid #323640; background: #1b1e24; color: #dfe2e7; cursor: pointer; }
.icon-button { display: grid; place-items: center; width: 45px; height: 45px; border-radius: 13px; }
.back-button { color: #ff8617; }
.info-button:hover, .back-button:hover { border-color: #f67300; background: rgba(246,115,0,.09); }
.date-badge { display: inline-flex; align-items: center; gap: 8px; padding: 11px 14px; border-radius: 12px; white-space: nowrap; }
.date-mobile-text { display: none; }

.period-tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); max-width: 620px; margin: 0 auto 22px; padding: 5px; border: 1px solid #292d35; border-radius: 14px; background: #17191e; }
.period-tabs button { min-height: 40px; border: 0; border-radius: 10px; background: transparent; color: #8e939c; font-weight: 700; cursor: pointer; transition: .2s ease; }
.period-tabs button:hover { color: white; }
.period-tabs button.active { background: #f67300; color: white; box-shadow: 0 5px 18px rgba(246,115,0,.28); }

.filter-panel { display: flex; align-items: end; justify-content: center; gap: 12px; max-width: 720px; margin: -8px auto 22px; padding: 15px; border: 1px solid #292d35; border-radius: 14px; background: #181b20; }
.filter-field { flex: 1; min-width: 160px; }
.filter-field label { display: block; margin-bottom: 6px; color: #a3a8b1; font-size: .75rem; }
.filter-field input, .filter-field select { width: 100%; height: 42px; border: 1px solid #383d47; border-radius: 9px; outline: none; background: #111318; color: white; padding: 0 11px; }
.filter-field input:focus, .filter-field select:focus { border-color: #f67300; }
.filter-field input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: .72; }
.apply-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 42px; min-width: 120px; border: 0; border-radius: 9px; background: #f67300; color: white; font-weight: 800; cursor: pointer; }
.apply-button:disabled { opacity: .55; cursor: wait; }
.dashboard-alert { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 14px; border: 1px solid rgba(239,83,80,.35); border-radius: 12px; background: rgba(239,83,80,.1); color: #ffaaa8; }
.dashboard-alert span { flex: 1; }
.dashboard-alert button { border: 0; background: transparent; color: #ff8a1f; font-weight: 800; cursor: pointer; }

.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-bottom: 18px; }
.kpi-card, .chart-card { border: 1px solid #292d35; border-radius: 18px; background: #1a1d22; box-shadow: 0 18px 55px rgba(0,0,0,.18); }
.kpi-card { padding: 22px; }
.kpi-heading { justify-content: space-between; gap: 16px; }
.kpi-heading p { margin-bottom: 5px; color: #a6abb4; font-size: .84rem; font-weight: 700; }
.kpi-heading strong { font-size: clamp(1.65rem, 3vw, 2.35rem); line-height: 1; }
.kpi-heading small { color: #c5c8ce; font-size: .7rem; font-weight: 700; }
.metric-icon, .chart-icon { display: grid; place-items: center; }
.metric-icon { width: 48px; height: 48px; border-radius: 14px; }
.metric-icon.energy {
  border: 1px solid rgba(255,143,31,.2);
  background: linear-gradient(145deg, #44392f, #282b2e 62%, #1c2328);
  color: #ff8617;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 8px 20px rgba(0,0,0,.18);
}
.metric-icon.revenue {
  border: 1px solid rgba(255,188,50,.2);
  background: linear-gradient(145deg, #454033, #242a30 62%, #1b2329);
  color: #ffb51f;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 8px 20px rgba(0,0,0,.18);
}
.kpi-trend { display: flex; align-items: center; gap: 7px; margin-top: 18px; font-size: .77rem; font-weight: 700; }
.kpi-trend.positive { color: #55c994; }
.kpi-trend.warning { color: #ffad52; }
.kpi-trend.neutral { color: #8e939c; }
.progress-track { height: 4px; margin-top: 12px; overflow: hidden; border-radius: 10px; background: #30343b; }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#f56f00,#ffb03b); }
.plan-note { margin-top: 9px; color: #727781; font-size: .72rem; }

.analytics-section { margin-top: 18px; padding: 22px; border: 1px solid #242830; border-radius: 20px; background: #14171b; }
.section-heading { justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.section-heading h2 { margin-top: 3px; font-size: 1.12rem; }
.range-caption, .section-badge { display: inline-flex; align-items: center; gap: 7px; color: #858b95; font-size: .7rem; white-space: nowrap; }
.section-badge { padding: 6px 10px; border-radius: 20px; background: #22262d; color: #28c6d8; font-weight: 800; }
.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 18px; }
.chart-card { min-width: 0; padding: 18px; }
.chart-card-wide { grid-column: 1 / -1; }
.chart-title { gap: 10px; margin-bottom: 5px; }
.chart-title div { display: flex; flex-direction: column; }
.chart-title strong { font-size: .93rem; }
.chart-title small { color: #747b86; font-size: .66rem; }
.chart-icon { width: 34px; height: 34px; border-radius: 10px; }
.chart-icon.orange {
  border: 1px solid rgba(255,143,31,.18);
  background: linear-gradient(145deg, #40362e, #24292d);
  color: #ff8617;
}
.chart-icon.gold {
  border: 1px solid rgba(255,188,50,.18);
  background: linear-gradient(145deg, #413b30, #232a30);
  color: #ffb51f;
}
.chart-icon.cyan { background: rgba(40,198,216,.12); color: #28c6d8; }
.chart-icon.blue { background: rgba(95,125,255,.12); color: #718cff; }
.water-level-limits {
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:8px;
  margin:12px 0 4px;
}
.water-level-limit {
  min-width:0;
  padding:8px 10px;
  border:1px solid rgba(99,213,220,.18);
  border-left:3px solid var(--limit-color);
  border-radius:9px;
  background:rgba(4,39,70,.34);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
  color:inherit;
  cursor:pointer;
  font:inherit;
  text-align:left;
  transition:border-color .18s ease,background .18s ease,box-shadow .18s ease,opacity .18s ease,transform .18s ease;
}
.water-level-limit:hover {
  border-color:color-mix(in srgb,var(--limit-color) 54%,transparent);
  background:rgba(8,57,87,.48);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 5px 14px rgba(0,22,46,.16);
  transform:translateY(-1px);
}
.water-level-limit:focus-visible {
  outline:2px solid color-mix(in srgb,var(--limit-color) 72%,white);
  outline-offset:2px;
}
.water-level-limit.is-hidden {
  border-left-color:rgba(123,157,170,.42);
  background:rgba(4,31,55,.24);
  box-shadow:none;
  opacity:.56;
}
.water-level-limit > span {
  display:flex;
  min-width:0;
  align-items:center;
  gap:5px;
  color:#9db8c5;
  font-size:.68rem;
  line-height:1.25;
}
.water-level-limit > span > span {
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.water-level-limit-toggle {
  flex:0 0 auto;
  margin-left:auto;
  color:var(--limit-color);
  opacity:.9;
}
.water-level-limit.is-hidden .water-level-limit-toggle { color:#7896a3; }
.water-level-limit > span svg { flex:0 0 auto;color:var(--limit-color); }
.water-level-limit strong {
  display:block;
  margin-top:4px;
  color:var(--limit-color);
  font-size:.9rem;
  line-height:1.1;
}
.water-level-limit strong small { color:#8faab7;font-size:.58rem;font-weight:600; }
.chart-card :deep(.echarts) { width: 100%; height: 350px; }
.chart-state { display: flex; min-height: 350px; flex-direction: column; align-items: center; justify-content: center; gap: 11px; color: #747b86; font-size: .82rem; }
.loader { width: 30px; height: 30px; border: 3px solid #343841; border-top-color: #ff7a00; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 960px) {
  .chart-grid { grid-template-columns: 1fr; }
  .chart-card-wide { grid-column: auto; }
  .water-level-limits { grid-template-columns:repeat(2,minmax(0,1fr)); }
}

@media (max-width: 420px) {
  .water-level-limits {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px 6px;
    margin: 7px 0 2px;
  }
  .water-level-limit {
    min-height: 48px;
    padding: 5px 7px;
    border-left-width: 2px;
    border-radius: 7px;
  }
  .water-level-limit > span {
    align-items: center;
    gap: 3px;
    overflow: hidden;
    font-size: .56rem;
    line-height: 1.1;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .water-level-limit > span svg {
    width: 12px;
    height: 12px;
  }
  .water-level-limit strong {
    margin-top: 3px;
    font-size: .78rem;
    line-height: 1;
  }
  .water-level-limit strong small { font-size: .48rem; }
}

@media (max-width: 600px) {
  .plant-dashboard { padding: 19px 12px 34px; }
  .plant-identity { gap: 9px; }
  .plant-title-row { gap: 8px; }
  .detail-plant-logo { flex-basis: 40px; width: 40px; height: 35px; border-radius: 8px; }
  .detail-plant-logo.has-logo { flex-basis: 60px; width: 60px; height: 52px; padding: 3px; }
  .plant-header { align-items: flex-start; margin-bottom: 20px; }
  .plant-identity h1 { font-size: 1.08rem; }
  .icon-button { width: 40px; height: 40px; border-radius: 11px; }
  .date-badge { width: auto; min-width: 82px; height: 40px; justify-content: center; padding: 0 11px; font-size: .72rem; }
  .date-range-text, .date-chevron { display: none; }
  .date-mobile-text { display: inline; }
  .period-tabs { margin-bottom: 16px; }
  .period-tabs button { min-height: 38px; padding: 0 5px; font-size: .73rem; }
  .filter-panel { flex-wrap: wrap; margin-top: 0; }
  .filter-field { flex: 1 0 100%; min-width: 100%; }
  .apply-button { flex: 1 0 100%; }
  .kpi-grid { gap: 10px; }
  .kpi-card { padding: 15px 13px; border-radius: 14px; }
  .kpi-heading strong { font-size: 1.35rem; }
  .kpi-heading small { display: block; margin-top: 5px; }
  .metric-icon { width: 37px; height: 37px; border-radius: 10px; }
  .kpi-trend { align-items: flex-start; min-height: 36px; margin-top: 14px; font-size: .65rem; }
  .plan-note { min-height: 30px; }
  .analytics-section { padding: 15px 10px; border-radius: 15px; }
  .section-heading { align-items: flex-start; }
  .range-caption { display: none; }
  .chart-card { padding: 14px 7px; border-radius: 14px; }
  .chart-card :deep(.echarts), .chart-state { height: 310px; min-height: 310px; }
}

@media (max-width: 380px) {
  .date-badge { min-width: 40px; width: 40px; padding: 0; }
  .date-mobile-text { display: none; }
  .kpi-grid { grid-template-columns: 1fr; }
  .plan-note, .kpi-trend { min-height: auto; }
}

/* Modern executive theme */
.plant-page {
  background:
    radial-gradient(circle at 12% 0%, rgba(126,87,255,.15), transparent 30rem),
    radial-gradient(circle at 95% 24%, rgba(57,215,197,.08), transparent 26rem),
    #070b16;
  color: #edf2ff;
}
.plant-header {
  padding: 18px 20px;
  border: 1px solid #242e48;
  border-radius: 18px;
  background: linear-gradient(130deg, rgba(24,20,53,.96), rgba(12,20,37,.97));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 16px 38px rgba(0,0,0,.25);
}
.section-kicker { color: #9b7eff; }
.icon-button,
.date-badge { border-color: #303a55; background: #151d30; color: #dce4f7; }
.back-button { color: #a78fff; }
.info-button:hover,
.back-button:hover { border-color: #7458d7; background: rgba(116,88,215,.14); }
.period-tabs { border-color: #252e47; background: #0f1627; box-shadow: 0 12px 30px rgba(0,0,0,.22); }
.period-tabs button { color: #8390a8; }
.period-tabs button:hover { color: #ded7ff; }
.period-tabs button.active { background: linear-gradient(120deg,#7b57ef,#6040cd); box-shadow: 0 8px 22px rgba(109,72,224,.30); }
.filter-panel { border-color: #27314a; background: #10182a; box-shadow: 0 16px 36px rgba(0,0,0,.24); }
.filter-field label { color: #8995aa; }
.filter-field input { border-color: #303a55; background: #0a1120; color: #edf2ff; }
.filter-field input:focus { border-color: #7c5be6; box-shadow: 0 0 0 3px rgba(124,91,230,.12); }
.apply-button { background: linear-gradient(120deg,#7b57ef,#6040cd); box-shadow: 0 8px 20px rgba(104,68,218,.27); }
.kpi-card,
.chart-card {
  border-color: #242e47;
  background:
    radial-gradient(circle at 94% 0%, rgba(126,91,255,.055), transparent 38%),
    linear-gradient(145deg,#11192b,#0c1322);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 16px 42px rgba(0,0,0,.27);
}
.kpi-heading p { color: #9aa6ba; }
.kpi-heading strong { color: #f5f7ff; }
.kpi-heading small { color: #99a6ba; }
.kpi-trend.warning { color: #c7b8ff; }
.kpi-trend.positive { color: #43dab4; }
.progress-track { background: #283149; }
.progress-track span { background: linear-gradient(90deg,#7956f1,#39d7c5); box-shadow: 0 0 13px rgba(89,88,237,.28); }
.plan-note { color: #7f8ba2; font-size: .8rem; }
.analytics-section {
  border-color: #222c44;
  background: rgba(9,14,26,.72);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.02);
}
.section-heading h2 { color: #f1f3fb; }
.range-caption { color: #78859b; }
.section-badge { background: rgba(57,215,197,.10); color: #55ddcf; }
.chart-title strong { color: #edf1fc; }
.chart-title small { color: #748198; }
.chart-icon.cyan { border: 1px solid rgba(57,215,197,.22); background: rgba(57,215,197,.09); color: #55ddcf; }
.chart-icon.blue { border: 1px solid rgba(128,93,255,.24); background: rgba(128,93,255,.11); color: #a18cff; }
.chart-state { color: #707d93; }
.loader { border-color: #2b344c; border-top-color: #805dff; }

@media (max-width: 600px) {
  .plant-page { background: radial-gradient(circle at 5% 2%, rgba(126,87,255,.14), transparent 18rem), #070b16; }
  .plant-header { padding: 12px 10px; border-radius: 14px; }
  .kpi-card,
  .chart-card { background: linear-gradient(145deg,#11192b,#0c1322); }
}

/* Premium energy-green executive theme */
.plant-page {
  background:
    radial-gradient(ellipse at 50% -12%, rgba(132,195,67,.22), transparent 30rem),
    radial-gradient(circle at 96% 28%, rgba(185,220,73,.05), transparent 25rem),
    #050705;
  color: #f2f5ef;
}
.plant-header {
  border-color: #293126;
  background:
    radial-gradient(ellipse at 50% -80%, rgba(148,205,73,.19), transparent 58%),
    linear-gradient(130deg,rgba(17,22,15,.98),rgba(8,12,8,.99));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03),0 18px 42px rgba(0,0,0,.34);
}
.section-kicker { color: #a2d85f; }
.icon-button,
.date-badge { border-color: #323a2f; background: #171c16; color: #e2e9dc; }
.back-button { color: #aadf68; }
.info-button:hover,
.back-button:hover { border-color: #759f43; background: rgba(131,184,67,.12); }
.period-tabs { border-color: #282f25; background: #111510; }
.period-tabs button { color: #90998c; }
.period-tabs button:hover { color: #d6edb4; }
.period-tabs button.active { background: linear-gradient(120deg,#9bd65b,#70a936); color: #091008; box-shadow: 0 8px 22px rgba(112,164,54,.29); }
.filter-panel { border-color: #293126; background: #111610; }
.filter-field label { color: #919a8d; }
.filter-field input { border-color: #333c31; background: #090c08; color: #eef3e9; }
.filter-field input:focus { border-color: #83b947; box-shadow: 0 0 0 3px rgba(131,185,71,.12); }
.apply-button { background: linear-gradient(120deg,#98d257,#68a030); color: #091008; box-shadow: 0 8px 20px rgba(102,151,47,.26); }
.kpi-card,
.chart-card {
  border-color: #282f26;
  background:
    radial-gradient(circle at 94% 0%, rgba(145,204,76,.05), transparent 40%),
    linear-gradient(145deg,#131812,#0a0e0a);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.025),0 18px 45px rgba(0,0,0,.33);
}
.kpi-heading p { color: #a1aa9d; }
.kpi-heading strong { color: #f6f8f3; }
.kpi-heading small { color: #a1aa9e; }
.kpi-trend.warning { color: #b8dc78; }
.kpi-trend.positive { color: #8ed878; }
.progress-track { background: #2b3229; }
.progress-track span { background: linear-gradient(90deg,#79b53d,#b9df68); box-shadow: 0 0 13px rgba(129,184,62,.25); }
.plan-note { color: #858e81; }
.analytics-section { border-color: #252d23; background: rgba(7,10,7,.75); }
.section-heading h2 { color: #f1f4ee; }
.range-caption { color: #7f897b; }
.section-badge { background: rgba(139,195,74,.10); color: #b3df74; }
.chart-title strong { color: #f0f3ed; }
.chart-title small { color: #798375; }
.chart-icon.cyan,
.chart-icon.blue { border-color: rgba(139,195,74,.22); background: rgba(124,177,60,.10); color: #a8d967; }
.loader { border-color: #30372e; border-top-color: #91cc4d; }

@media (max-width: 600px) {
  .plant-page { background: radial-gradient(ellipse at 50% -8%, rgba(132,195,67,.18), transparent 21rem), #050705; }
  .kpi-card,
  .chart-card { background: linear-gradient(145deg,#131812,#0a0e0a); }
}

/* Warm graphite executive theme */
.plant-page {
  background:
    radial-gradient(ellipse at 50% -15%,rgba(255,119,35,.18),transparent 31rem),
    radial-gradient(circle at 96% 36%,rgba(255,177,70,.04),transparent 24rem),
    #101212;
  color:#f4f2ef;
}
.plant-header {
  border-color:#393d3b;
  background:radial-gradient(ellipse at 50% -85%,rgba(255,124,42,.18),transparent 58%),linear-gradient(130deg,rgba(38,41,40,.98),rgba(20,23,23,.99));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 18px 42px rgba(0,0,0,.34);
}
.section-kicker { color:#ff8c42; }
.icon-button,
.date-badge { border-color:#454948; background:#2b2f2e; color:#eae7e3; }
.back-button { color:#ff9a5b; }
.info-button:hover,
.back-button:hover { border-color:#a85d31; background:rgba(255,119,35,.11); }
.period-tabs { border-color:#3a3e3c; background:#242726; }
.period-tabs button { color:#aaa9a5; }
.period-tabs button:hover { color:#ffd2b3; }
.period-tabs button.active { background:linear-gradient(120deg,#ff7922,#e55410); color:#fff; box-shadow:0 8px 22px rgba(215,78,10,.30); }
.filter-panel { border-color:#393d3b; background:#242827; }
.filter-field label { color:#a4a29e; }
.filter-field input { border-color:#474b4a; background:#171919; color:#f2efeb; }
.filter-field input:focus { border-color:#ec7228; box-shadow:0 0 0 3px rgba(236,114,40,.12); }
.apply-button { background:linear-gradient(120deg,#ff7922,#df500d); color:#fff; box-shadow:0 8px 20px rgba(207,71,7,.26); }
.kpi-card,
.chart-card { border-color:#393e3c; background:radial-gradient(circle at 94% 0%,rgba(255,124,43,.045),transparent 40%),linear-gradient(145deg,#292c2b,#191c1c); box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 18px 45px rgba(0,0,0,.32); }
.kpi-heading p { color:#b2b0ab; }
.kpi-heading strong { color:#faf8f5; }
.kpi-heading small { color:#aaa8a3; }
.kpi-trend.warning { color:#ffad72; }
.kpi-trend.positive { color:#8bcda1; }
.progress-track { background:#424645; }
.progress-track span { background:linear-gradient(90deg,#ff7020,#ffad4f); box-shadow:0 0 13px rgba(237,96,20,.25); }
.plan-note { color:#96948f; }
.analytics-section { border-color:#353937; background:rgba(19,21,21,.78); }
.section-heading h2 { color:#f5f3f0; }
.range-caption { color:#8c8b87; }
.section-badge { background:rgba(255,119,35,.10); color:#ffa46a; }
.chart-title strong { color:#f4f2ee; }
.chart-title small { color:#8d8b87; }
.chart-icon.cyan,
.chart-icon.blue { border-color:rgba(255,131,49,.20); background:rgba(255,119,35,.09); color:#ff9958; }
.loader { border-color:#454847; border-top-color:#ff7625; }

@media (max-width:600px) {
  .plant-page { background:radial-gradient(ellipse at 50% -8%,rgba(255,119,35,.15),transparent 21rem),#101212; }
  .kpi-card,
  .chart-card { background:linear-gradient(145deg,#292c2b,#191c1c); }
}

/* Light blue gradient executive theme */
.plant-page {
  background:
    radial-gradient(circle at 8% 0%,rgba(68,158,237,.19),transparent 30rem),
    radial-gradient(circle at 96% 28%,rgba(100,202,236,.13),transparent 27rem),
    linear-gradient(145deg,#f7fbff,#edf5fc);
  color:#173650;
}
.plant-header {
  border-color:rgba(170,203,225,.52);
  background:radial-gradient(circle at 88% -30%,rgba(255,255,255,.30),transparent 42%),linear-gradient(125deg,#2788e4,#63b2ef 68%,#a3d5f8);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 18px 42px rgba(44,122,185,.19);
}
.plant-identity h1 { color:#fff; }
.section-kicker { color:#e8f5ff; }
.icon-button,
.date-badge { border-color:rgba(255,255,255,.43); background:rgba(255,255,255,.17); color:#fff; }
.back-button { color:#fff; }
.info-button:hover,
.back-button:hover { border-color:rgba(255,255,255,.72); background:rgba(255,255,255,.25); }
.period-tabs { border-color:#d5e5f0; background:rgba(255,255,255,.94); box-shadow:0 12px 30px rgba(43,105,151,.10); }
.period-tabs button { color:#718698; }
.period-tabs button:hover { color:#287fc8; }
.period-tabs button.active { background:linear-gradient(120deg,#2e90e9,#1e73ca); color:#fff; box-shadow:0 8px 20px rgba(35,120,197,.25); }
.filter-panel { border-color:#d7e5ef; background:rgba(255,255,255,.97); box-shadow:0 15px 36px rgba(45,105,150,.10); }
.filter-field label { color:#657f92; }
.filter-field input { border-color:#cbdee9; background:#f8fcff; color:#173b57; }
.filter-field input:focus { border-color:#378fdc; box-shadow:0 0 0 3px rgba(55,143,220,.11); }
.filter-field input::-webkit-calendar-picker-indicator { filter:none; }
.apply-button { background:linear-gradient(120deg,#2e91e9,#1e72c6); color:#fff; box-shadow:0 8px 20px rgba(35,120,192,.22); }
.kpi-card,
.chart-card { border-color:rgba(174,204,224,.55); background:rgba(255,255,255,.97); box-shadow:0 17px 42px rgba(44,103,146,.10); }
.kpi-heading p { color:#627b8e; }
.kpi-heading strong { color:#153b59; }
.kpi-heading small { color:#627b8e; }
.metric-icon.energy { border-color:rgba(52,149,229,.22); background:linear-gradient(145deg,#58b3f2,#247ed4); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 9px 22px rgba(40,130,205,.19); }
.metric-icon.revenue { border-color:rgba(56,183,173,.22); background:linear-gradient(145deg,#61cdd5,#2aa89e); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 9px 22px rgba(38,155,147,.18); }
.kpi-trend.warning { color:#347fbd; }
.kpi-trend.positive { color:#2b9d69; }
.progress-track { background:#e1edf4; }
.progress-track span { background:linear-gradient(90deg,#2d8dea,#68baf1); box-shadow:0 0 12px rgba(47,141,234,.18); }
.plan-note { color:#667f91; }
.analytics-section { border-color:#d7e5ee; background:rgba(247,251,254,.78); box-shadow:inset 0 1px 0 rgba(255,255,255,.65); }
.analytics-section .section-kicker { color:#2d85ce; }
.section-heading h2 { color:#193b57; }
.range-caption { color:#768b9b; }
.section-badge { background:#eaf7fb; color:#258cad; }
.chart-title strong { color:#1b405c; }
.chart-title small { color:#778d9c; }
.chart-icon.orange,
.chart-icon.blue { border-color:rgba(57,147,221,.20); background:#eaf5fd; color:#287fc9; }
.chart-icon.gold,
.chart-icon.cyan { border-color:rgba(62,179,166,.20); background:#eaf9f6; color:#2a9c90; }
.chart-state { color:#738998; }
.loader { border-color:#dce9f1; border-top-color:#2f8dea; }

@media (max-width:600px) {
  .plant-page { background:radial-gradient(circle at 8% 0%,rgba(68,158,237,.16),transparent 20rem),linear-gradient(145deg,#f7fbff,#edf5fc); }
  .kpi-card,
  .chart-card { background:rgba(255,255,255,.98); }
}

/* Aurora glass executive theme */
.plant-page {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 8% 2%,rgba(56,129,255,.33),transparent 31rem),
    radial-gradient(circle at 95% 10%,rgba(215,67,255,.25),transparent 30rem),
    radial-gradient(circle at 55% 82%,rgba(35,213,202,.12),transparent 33rem),
    linear-gradient(145deg,#071229,#111543 46%,#1c0f42);
  color:#f7f8ff;
}
.plant-dashboard { position: relative; z-index: 1; }
.plant-header {
  position: relative;
  overflow: hidden;
  padding: 22px 24px;
  border-color:rgba(255,255,255,.18);
  border-radius:22px;
  background:
    radial-gradient(circle at 84% 10%,rgba(239,100,255,.34),transparent 34%),
    linear-gradient(120deg,rgba(43,116,241,.72),rgba(90,71,203,.64) 58%,rgba(170,58,212,.60));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.23),0 22px 58px rgba(1,6,34,.36);
  backdrop-filter:blur(24px) saturate(145%);
}
.plant-header::after {
  position:absolute;
  top:-85px;
  right:10%;
  width:220px;
  height:220px;
  border:36px solid rgba(255,255,255,.065);
  border-radius:50%;
  content:"";
  pointer-events:none;
}
.plant-identity,
.header-actions { position:relative; z-index:1; }
.plant-identity h1 { color:#fff; text-shadow:0 2px 14px rgba(11,13,60,.25); }
.section-kicker { color:#86edfa; }
.icon-button,
.date-badge {
  border-color:rgba(255,255,255,.25);
  background:rgba(9,17,52,.29);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 9px 22px rgba(4,5,42,.18);
  backdrop-filter:blur(18px);
}
.back-button { color:#fff; }
.info-button:hover,
.back-button:hover { border-color:rgba(255,255,255,.68); background:rgba(255,255,255,.17); }
.period-tabs {
  border-color:rgba(255,255,255,.14);
  background:rgba(11,18,48,.52);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 16px 36px rgba(2,7,35,.24);
  backdrop-filter:blur(22px);
}
.period-tabs button { color:#aeb7d5; }
.period-tabs button:hover { color:#fff; background:rgba(137,113,255,.12); }
.period-tabs button.active { background:linear-gradient(120deg,#6d83ff,#985af2 62%,#cf62e8); color:#fff; box-shadow:0 9px 24px rgba(114,75,238,.38),inset 0 1px 0 rgba(255,255,255,.25); }
.filter-panel {
  border-color:rgba(255,255,255,.14);
  background:rgba(13,21,54,.68);
  box-shadow:0 18px 46px rgba(2,7,35,.30);
  backdrop-filter:blur(24px);
}
.filter-field label { color:#b3bddb; }
.filter-field input { border-color:rgba(165,178,235,.23); background:rgba(4,10,34,.50); color:#f6f7ff; }
.filter-field input:focus { border-color:#9b80ff; box-shadow:0 0 0 3px rgba(135,104,255,.17); }
.filter-field input::-webkit-calendar-picker-indicator { filter:invert(1); }
.apply-button { background:linear-gradient(120deg,#568cff,#8c5cf3); color:#fff; box-shadow:0 10px 24px rgba(88,74,222,.31); }
.kpi-card,
.chart-card {
  border-color:rgba(255,255,255,.14);
  background:
    radial-gradient(circle at 100% 0%,rgba(132,94,255,.13),transparent 42%),
    linear-gradient(145deg,rgba(31,44,91,.64),rgba(15,22,58,.66));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 22px 54px rgba(1,6,31,.32);
  backdrop-filter:blur(24px) saturate(135%);
}
.kpi-heading p { color:#b8c3df; }
.kpi-heading strong { color:#fff; text-shadow:0 2px 18px rgba(96,143,255,.18); }
.kpi-heading small { color:#b9c5e0; }
.metric-icon.energy,
.metric-icon.revenue {
  border-color:rgba(255,255,255,.18);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 10px 25px rgba(38,29,120,.28);
}
.metric-icon.energy { background:linear-gradient(145deg,rgba(66,211,235,.42),rgba(74,101,238,.48)); }
.metric-icon.revenue { background:linear-gradient(145deg,rgba(188,103,255,.43),rgba(225,78,182,.42)); }
.kpi-trend.warning { color:#c5b8ff; }
.kpi-trend.positive { color:#66f1c5; }
.progress-track { background:rgba(170,185,230,.17); }
.progress-track span { background:linear-gradient(90deg,#5ee1ec,#7182ff); box-shadow:0 0 16px rgba(94,203,255,.34); }
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#9d75ff,#ee75d7); }
.plan-note { color:#9faaca; }
.analytics-section {
  border-color:rgba(255,255,255,.13);
  background:linear-gradient(145deg,rgba(17,29,69,.63),rgba(9,16,45,.68));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 22px 54px rgba(1,6,31,.27);
  backdrop-filter:blur(24px);
}
.analytics-section .section-kicker { color:#79e4f4; }
.section-heading h2 { color:#fff; }
.range-caption { color:#96a2c1; }
.section-badge { background:rgba(91,222,218,.12); color:#75eee4; }
.chart-title strong { color:#f7f8ff; }
.chart-title small { color:#8e9bbb; }
.chart-icon.orange,
.chart-icon.blue { border-color:rgba(104,199,255,.25); background:rgba(76,156,244,.16); color:#78ddf5; }
.chart-icon.gold,
.chart-icon.cyan { border-color:rgba(187,126,255,.25); background:rgba(158,93,240,.16); color:#d2a4ff; }
.chart-state { color:#8d9abc; }
.loader { border-color:rgba(255,255,255,.16); border-top-color:#8e75ff; }

@media (max-width:600px) {
  .plant-page {
    background:
      radial-gradient(circle at 8% 0%,rgba(53,123,255,.30),transparent 21rem),
      radial-gradient(circle at 100% 27%,rgba(204,62,255,.20),transparent 23rem),
      linear-gradient(155deg,#071229,#15123c 55%,#20103f);
  }
  .plant-dashboard { padding:14px 10px 32px; }
  .plant-header { padding:14px 11px; border-radius:18px; }
  .kpi-card,
  .chart-card { background:linear-gradient(145deg,rgba(29,42,87,.72),rgba(13,20,53,.72)); }
  .analytics-section { background:linear-gradient(145deg,rgba(20,32,73,.68),rgba(10,16,45,.72)); }
}

/* Sapphire-to-cyan transparent theme */
.plant-page {
  background:
    radial-gradient(circle at 8% 18%,rgba(35,55,222,.56),transparent 34rem),
    radial-gradient(circle at 96% 40%,rgba(77,226,239,.43),transparent 38rem),
    linear-gradient(118deg,#09106f 0%,#132da0 43%,#1777b6 72%,#55cbd5 100%);
}
.plant-header,
.kpi-card,
.chart-card,
.analytics-section,
.filter-panel,
.period-tabs {
  border-color:rgba(255,255,255,.25);
  background:linear-gradient(125deg,rgba(255,255,255,.105),rgba(255,255,255,.045));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 20px 55px rgba(0,14,75,.20);
  backdrop-filter:blur(22px) saturate(135%);
}
.plant-header { background:linear-gradient(112deg,rgba(56,76,210,.30),rgba(71,194,220,.20)); }
.plant-header::after { border-color:rgba(255,255,255,.08); }
.icon-button,
.date-badge {
  border-color:rgba(255,255,255,.26);
  background:rgba(255,255,255,.09);
  color:#f7fdff;
}
.period-tabs button { color:rgba(239,247,255,.76); }
.period-tabs button:hover { color:#fff; background:rgba(255,255,255,.09); }
.period-tabs button.active,
.apply-button {
  background:linear-gradient(125deg,#507df4,#48c8de);
  box-shadow:0 9px 24px rgba(12,42,131,.28),inset 0 1px 0 rgba(255,255,255,.28);
}
.filter-field input { border-color:rgba(255,255,255,.25); background:rgba(6,24,102,.22); }
.filter-field input:focus { border-color:#8ce9f2; box-shadow:0 0 0 3px rgba(116,231,240,.16); }
.metric-icon.energy,
.metric-icon.revenue,
.chart-icon.orange,
.chart-icon.gold,
.chart-icon.cyan,
.chart-icon.blue {
  border-color:rgba(255,255,255,.22);
  background:linear-gradient(145deg,rgba(255,255,255,.18),rgba(80,207,229,.18));
  color:#adfbf7;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.20),0 9px 22px rgba(7,37,121,.18);
}
.progress-track { background:rgba(255,255,255,.16); }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#6df0e8,#79afff); box-shadow:0 0 14px rgba(111,226,246,.34); }
.section-kicker,
.analytics-section .section-kicker { color:#84f4ef; }
.section-badge { background:rgba(255,255,255,.10); color:#adfbf7; }

@media (max-width:600px) {
  .plant-page {
    background:
      radial-gradient(circle at 4% 10%,rgba(57,72,229,.48),transparent 22rem),
      radial-gradient(circle at 100% 44%,rgba(77,223,235,.35),transparent 24rem),
      linear-gradient(145deg,#080f6d,#163aa1 58%,#309ebd);
  }
  .kpi-card,
  .chart-card,
  .analytics-section { background:linear-gradient(135deg,rgba(255,255,255,.105),rgba(255,255,255,.045)); }
}

/* Sky-grid glass executive theme */
.plant-page {
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(circle at 10% 6%,rgba(47,126,239,.34),transparent 34rem),
    radial-gradient(circle at 84% 72%,rgba(255,255,255,.62),transparent 35rem),
    linear-gradient(145deg,#6aa5f5,#9fc8fb 45%,#dceafe);
  color:#17385d;
}
.plant-page::before {
  position:absolute;
  inset:0;
  z-index:0;
  background-image:
    linear-gradient(rgba(255,255,255,.19) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.19) 1px,transparent 1px);
  background-position:center 120px;
  background-size:40px 40px;
  opacity:.68;
  content:"";
  pointer-events:none;
  mask-image:radial-gradient(ellipse 48% 56% at 50% 40%,#000 12%,transparent 76%);
}
.plant-header,
.kpi-card,
.chart-card,
.analytics-section,
.filter-panel,
.period-tabs {
  border-color:rgba(255,255,255,.58);
  background:linear-gradient(135deg,rgba(255,255,255,.48),rgba(255,255,255,.20));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.70),0 18px 48px rgba(42,94,158,.16);
  backdrop-filter:blur(22px) saturate(125%);
}
.plant-header { background:linear-gradient(115deg,rgba(39,117,224,.60),rgba(95,166,239,.38),rgba(255,255,255,.22)); }
.plant-header::after { border-color:rgba(255,255,255,.14); }
.plant-identity h1 { color:#fff; text-shadow:0 2px 14px rgba(22,76,142,.20); }
.section-kicker,
.analytics-section .section-kicker { color:#eaf8ff; }
.icon-button,
.date-badge {
  border-color:rgba(255,255,255,.58);
  background:rgba(255,255,255,.26);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 8px 24px rgba(37,95,161,.13);
}
.period-tabs button { color:#56769a; }
.period-tabs button:hover { color:#185ea8; background:rgba(255,255,255,.34); }
.period-tabs button.active,
.apply-button { background:linear-gradient(125deg,#397fe0,#69b4f1); color:#fff; box-shadow:0 9px 23px rgba(37,106,181,.24),inset 0 1px 0 rgba(255,255,255,.28); }
.filter-field label { color:#496b8f; }
.filter-field input { border-color:rgba(90,143,195,.30); background:rgba(255,255,255,.45); color:#173b63; }
.filter-field input:focus { border-color:#4c91dc; box-shadow:0 0 0 3px rgba(63,132,210,.13); }
.filter-field input::-webkit-calendar-picker-indicator { filter:none; }
.kpi-heading p { color:#52708f; }
.kpi-heading strong { color:#123d68; text-shadow:none; }
.kpi-heading small { color:#597795; }
.metric-icon.energy,
.metric-icon.revenue,
.chart-icon.orange,
.chart-icon.gold,
.chart-icon.cyan,
.chart-icon.blue {
  border-color:rgba(255,255,255,.66);
  background:linear-gradient(145deg,rgba(255,255,255,.64),rgba(174,218,252,.48));
  color:#2374c8;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 9px 22px rgba(45,111,177,.13);
}
.kpi-trend.positive { color:#168a69; }
.kpi-trend.warning { color:#2d6fac; }
.progress-track { background:rgba(72,121,169,.17); }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#307fd5,#68b6eb); box-shadow:0 0 11px rgba(50,132,208,.20); }
.plan-note { color:#5d7893; }
.analytics-section .section-kicker { color:#2475bc; }
.section-heading h2,
.chart-title strong { color:#173d64; }
.range-caption,
.chart-title small,
.chart-state { color:#5e7893; }
.section-badge { background:rgba(255,255,255,.42); color:#2d74aa; }
.loader { border-color:rgba(44,110,171,.18); border-top-color:#347fc6; }

@media (max-width:600px) {
  .plant-page {
    background:
      radial-gradient(circle at 8% 8%,rgba(51,126,231,.28),transparent 22rem),
      linear-gradient(150deg,#72aaf3,#a9cdf9 55%,#e1edfd);
  }
  .plant-header { background:linear-gradient(115deg,rgba(44,121,222,.62),rgba(125,190,240,.36)); }
  .kpi-card,
  .chart-card,
  .analytics-section { background:linear-gradient(135deg,rgba(255,255,255,.50),rgba(255,255,255,.22)); }
}

/* Atmospheric cobalt glass theme */
.plant-page {
  background:
    radial-gradient(circle at 84% 102%,rgba(204,188,255,.42),transparent 26rem),
    radial-gradient(circle at 16% 82%,rgba(240,247,255,.34),transparent 29rem),
    linear-gradient(180deg,#263fe3 0%,#3973e4 27%,#68a9ea 58%,#dce9f7 100%);
}
.plant-page::before {
  top:17%;
  right:-18%;
  bottom:auto;
  left:-20%;
  width:140%;
  height:52%;
  border:1px solid rgba(255,255,255,.32);
  border-radius:50%;
  background:none;
  opacity:.56;
  mask-image:linear-gradient(90deg,transparent 2%,#000 25%,#000 76%,transparent 98%);
}
.plant-header,
.kpi-card,
.chart-card,
.analytics-section,
.filter-panel,
.period-tabs {
  border-color:rgba(255,255,255,.50);
  background:linear-gradient(145deg,rgba(255,255,255,.42),rgba(244,249,255,.18));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.68),0 20px 50px rgba(28,62,137,.16);
  backdrop-filter:blur(28px) saturate(120%);
}
.plant-header { background:linear-gradient(120deg,rgba(35,55,203,.54),rgba(72,132,226,.34),rgba(177,213,246,.20)); }
.icon-button,
.date-badge { border-color:rgba(255,255,255,.56); background:rgba(255,255,255,.18); }
.period-tabs button.active,
.apply-button { background:linear-gradient(125deg,#3156db,#609de8); box-shadow:0 9px 24px rgba(37,74,176,.27),inset 0 1px 0 rgba(255,255,255,.30); }
.metric-icon.energy,
.metric-icon.revenue,
.chart-icon.orange,
.chart-icon.gold,
.chart-icon.cyan,
.chart-icon.blue {
  border-color:rgba(255,255,255,.70);
  background:linear-gradient(145deg,rgba(255,255,255,.72),rgba(178,211,250,.43));
  color:#2e62c7;
}
.progress-track span,
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#365ed8,#73a9ea); box-shadow:0 0 12px rgba(61,102,205,.22); }

@media (max-width:600px) {
  .plant-page {
    background:
      radial-gradient(circle at 82% 100%,rgba(205,190,255,.44),transparent 20rem),
      linear-gradient(180deg,#263fe3,#3974e4 30%,#6eaceb 62%,#dce9f7);
  }
  .plant-page::before { top:20%; left:-48%; width:190%; height:38%; }
  .plant-header { background:linear-gradient(120deg,rgba(35,55,203,.58),rgba(91,151,231,.30)); }
  .kpi-card,
  .chart-card,
  .analytics-section { background:linear-gradient(145deg,rgba(255,255,255,.44),rgba(244,249,255,.19)); }
}

/* Teal banking-glass executive theme */
.plant-page {
  background:
    radial-gradient(circle at 7% 2%,rgba(0,202,207,.38),transparent 29rem),
    radial-gradient(circle at 100% 36%,rgba(17,130,158,.20),transparent 32rem),
    radial-gradient(circle at 50% 105%,rgba(3,12,44,.50),transparent 37rem),
    linear-gradient(160deg,#087d92,#07516f 34%,#0a3559 62%,#0b1d42);
  color:#f1f7fa;
}
.plant-dashboard { font-family:"Noto Sans Lao","Phetsarath",system-ui,sans-serif; font-weight:400; letter-spacing:.005em; }
.plant-page::before {
  top:10%;
  right:-20%;
  bottom:auto;
  left:-22%;
  width:144%;
  height:62%;
  border:1px solid rgba(31,211,218,.24);
  border-radius:50%;
  background:none;
  opacity:.60;
  mask-image:linear-gradient(90deg,transparent 2%,#000 28%,#000 74%,transparent 98%);
}
.plant-header,
.kpi-card,
.chart-card,
.analytics-section,
.filter-panel,
.period-tabs {
  border-color:rgba(112,227,230,.24);
  background:linear-gradient(145deg,rgba(8,79,105,.48),rgba(7,27,63,.42));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 20px 48px rgba(1,13,38,.24);
  backdrop-filter:blur(28px) saturate(125%);
}
.plant-header { background:linear-gradient(120deg,rgba(4,133,150,.51),rgba(7,75,104,.44),rgba(8,35,72,.38)); }
.plant-identity h1 { color:#fff; font-weight:500; letter-spacing:.015em; }
.section-kicker,
.analytics-section .section-kicker { color:#38d1d5; font-weight:600; }
.icon-button,
.date-badge { border-color:rgba(111,230,232,.30); background:rgba(3,39,70,.28); color:#f7ffff; }
.period-tabs button { color:rgba(225,240,245,.72); font-weight:500; }
.period-tabs button:hover { color:#fff; background:rgba(25,191,198,.10); }
.period-tabs button.active,
.apply-button { background:linear-gradient(125deg,#0db0ba,#087695); color:#fff; box-shadow:0 9px 24px rgba(0,71,101,.30),inset 0 1px 0 rgba(255,255,255,.18); }
.filter-field label { color:#a9c5d2; font-weight:400; }
.filter-field input,
.filter-field select { border-color:rgba(99,213,220,.24); background:rgba(3,30,62,.38); color:#f2fbfd; }
.filter-field input:focus,
.filter-field select:focus { border-color:#2bcbd0; box-shadow:0 0 0 3px rgba(24,194,202,.13); }
.filter-field input::-webkit-calendar-picker-indicator { filter:invert(1); }
.kpi-heading p { color:#aac2cf; font-weight:500; }
.kpi-heading strong { color:#fff; font-weight:600; text-shadow:none; }
.kpi-heading small { color:#b6ced8; font-weight:500; }
.metric-icon.energy,
.metric-icon.revenue,
.chart-icon.orange,
.chart-icon.gold,
.chart-icon.cyan,
.chart-icon.blue {
  border-color:rgba(73,222,224,.26);
  background:linear-gradient(145deg,rgba(18,178,186,.24),rgba(7,49,85,.34));
  color:#55e4df;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 9px 22px rgba(0,21,49,.20);
}
.kpi-trend.positive { color:#6ce2be; }
.kpi-trend.warning { color:#72d8e0; }
.progress-track { background:rgba(148,194,211,.17); }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#18ccd0,#20a7c3); box-shadow:0 0 12px rgba(22,198,204,.25); }
.plan-note { color:#8daab9; }
.section-heading h2,
.chart-title strong { color:#f8fcfd; font-weight:500; }
.range-caption,
.chart-title small,
.chart-state { color:#91abb9; }
.section-badge { background:rgba(48,130,151,.17); color:#6de1df; }
.loader { border-color:rgba(96,174,194,.20); border-top-color:#25d0d0; }

@media (max-width:600px) {
  .plant-page {
    background:
      radial-gradient(circle at 4% 0%,rgba(0,201,207,.31),transparent 20rem),
      linear-gradient(165deg,#087b90,#07516f 35%,#093657 64%,#0b1d42);
  }
  .plant-page::before { top:12%; left:-53%; width:205%; height:45%; }
  .plant-header { background:linear-gradient(120deg,rgba(4,132,150,.54),rgba(7,53,88,.40)); }
  .kpi-card,
  .chart-card,
  .analytics-section { background:linear-gradient(145deg,rgba(8,76,101,.48),rgba(5,26,60,.46)); }
}

/* Semantic chart and KPI colors: actual = cyan, plan/revenue = gold */
.kpi-card:first-child .metric-icon { color:#55e4df; }
.kpi-card:nth-child(2) .metric-icon,
.chart-icon.gold {
  border-color:rgba(247,198,87,.34);
  background:linear-gradient(145deg,rgba(232,174,61,.25),rgba(81,59,28,.30));
  color:#ffd46a;
}
.kpi-card:nth-child(2) .progress-track span {
  background:linear-gradient(90deg,#efb84d,#ffd76c);
  box-shadow:0 0 12px rgba(242,189,77,.24);
}

/* Directional water icons: arrow into water = inflow, arrow leaving water = outflow */
.water-direction-icon { overflow:hidden; }
.water-direction-icon svg {
  width:23px;
  height:23px;
  fill:none;
  stroke:currentColor;
  stroke-linecap:round;
  stroke-linejoin:round;
  stroke-width:1.75;
}
.water-direction-icon .flow-arrow { stroke-width:2.15; }
.water-direction-icon .water-wave-secondary { opacity:.58; }
.chart-icon.cyan.water-inflow-icon {
  border-color:rgba(75,232,214,.34);
  background:linear-gradient(145deg,rgba(21,198,190,.25),rgba(6,66,93,.34));
  color:#68eee2;
}
.chart-icon.cyan.water-outflow-icon {
  border-color:rgba(91,199,244,.36);
  background:linear-gradient(145deg,rgba(24,162,212,.26),rgba(7,54,94,.36));
  color:#73dcff;
}

/* Reservoir metrics: measuring staff = water level, filled basin = stored volume */
.reservoir-metric-icon { overflow:hidden; }
.reservoir-metric-icon svg {
  width:24px;
  height:24px;
  fill:none;
  stroke:currentColor;
  stroke-linecap:round;
  stroke-linejoin:round;
  stroke-width:1.65;
}
.reservoir-metric-icon .measure-post { opacity:.82; }
.reservoir-metric-icon .level-indicator { stroke-width:1.9; }
.reservoir-metric-icon .water-surface { stroke-width:1.85; }
.reservoir-metric-icon .water-surface-secondary { opacity:.58; }
.chart-icon.blue.water-level-icon {
  border-color:rgba(97,192,255,.38);
  background:linear-gradient(145deg,rgba(39,169,224,.27),rgba(7,57,99,.38));
  color:#77dcff;
}
.water-volume-icon .reservoir-basin { stroke-width:1.8; }
.water-volume-icon .water-fill {
  fill:currentColor;
  stroke:none;
  opacity:.18;
}
.water-volume-icon .volume-surface { stroke-width:1.85; }
.water-volume-icon .capacity-mark { opacity:.68; }
.chart-icon.blue.water-volume-icon {
  border-color:rgba(76,229,204,.36);
  background:linear-gradient(145deg,rgba(27,191,177,.26),rgba(5,64,91,.38));
  color:#67eadb;
}

/* Achievement status: below target = amber, target reached = green */
.kpi-trend {
  width:fit-content;
  min-height:0;
  padding:6px 10px;
  border:1px solid transparent;
  border-radius:999px;
  line-height:1.1;
}
.kpi-trend.warning {
  border-color:rgba(255,180,82,.31);
  background:rgba(224,128,35,.12);
  color:#ffbe6c;
}
.kpi-trend.positive {
  border-color:rgba(83,226,155,.32);
  background:rgba(38,185,119,.12);
  color:#66e6a8;
}
.kpi-trend.neutral {
  border-color:rgba(158,184,198,.20);
  background:rgba(125,155,171,.10);
  color:#a8bec9;
}
.kpi-card.warning .progress-track span { background:linear-gradient(90deg,#ef9144,#ffc36d); box-shadow:0 0 12px rgba(242,155,67,.25); }
.kpi-card.positive .progress-track span { background:linear-gradient(90deg,#25b97c,#65e6a7); box-shadow:0 0 12px rgba(53,207,139,.25); }

/* Readable period tabs on every device */
.plant-dashboard { padding:22px clamp(16px,2.4vw,36px) 36px; }
.plant-header {
  margin-bottom:14px;
  padding:14px 18px;
  border-radius:18px;
}
.period-tabs { margin-bottom:14px; padding:4px; }
.kpi-grid { gap:14px; margin-bottom:14px; }
.kpi-card { padding:18px; }
.kpi-trend { margin-top:13px; }
.progress-track { margin-top:10px; }
.analytics-section { margin-top:14px; padding:18px; border-radius:17px; }
.section-heading { margin-bottom:14px; }
.chart-grid { gap:14px; }
.chart-card { padding:15px; }

.period-tabs button {
  font-size:1rem;
  font-weight:600;
  line-height:1.25;
}

/* Dashboard-style analytics controls */
.section-heading h2 { margin:0; }
.section-heading-actions {
  display:flex;
  min-width:0;
  align-items:center;
  justify-content:flex-end;
  gap:10px;
}
.chart-card-header {
  display:flex;
  min-height:42px;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  margin-bottom:6px;
}
.chart-card-header .chart-title { min-width:0; margin-bottom:0; }
.water-section .chart-title strong {
  font-size:clamp(.96rem,1vw,1.06rem);
  font-weight:700;
  line-height:1.2;
}
.chart-total-summary {
  display:grid;
  min-width:190px;
  grid-template-columns:repeat(2,minmax(0,1fr));
  overflow:hidden;
  border:1px solid rgba(82,218,218,.22);
  border-radius:11px;
  background:linear-gradient(145deg,rgba(14,95,113,.24),rgba(4,38,66,.5));
  box-shadow:inset 0 1px rgba(255,255,255,.05);
}
.chart-total-summary > div {
  display:flex;
  min-width:0;
  flex-direction:column;
  gap:1px;
  padding:6px 9px;
}
.chart-total-summary > div + div { border-left:1px solid rgba(117,187,200,.17); }
.chart-total-summary span {
  color:#84a8b4;
  font-size:.55rem;
  font-weight:700;
  line-height:1.15;
  white-space:nowrap;
}
.chart-total-summary strong {
  color:#73e8e3;
  font-size:.83rem;
  font-variant-numeric:tabular-nums;
  font-weight:850;
  line-height:1.15;
  white-space:nowrap;
}
.chart-total-summary strong small {
  color:#789ba8;
  font-size:.48rem;
  font-weight:700;
}
.chart-total-summary .plan strong { color:#ffd069; }
.chart-total-summary.revenue {
  border-color:rgba(242,194,83,.22);
  background:linear-gradient(145deg,rgba(126,91,28,.18),rgba(4,38,66,.5));
}
.chart-total-summary.water {
  min-width:168px;
  border-color:rgba(82,218,218,.26);
  background:linear-gradient(145deg,rgba(14,112,126,.24),rgba(4,38,66,.5));
}
.chart-total-summary.water > div { padding-inline:7px; }

@media (max-width:600px) {
  .period-tabs button { font-size:.9rem; }
  .plant-dashboard { padding:10px 7px 24px; }
  .plant-header {
    min-height:66px;
    margin-bottom:10px;
    padding:7px 9px;
    align-items:center;
    border-radius:15px;
  }
  .header-actions {
    align-self:center;
    align-items:center;
    margin-block:auto;
  }
  .period-tabs { margin-bottom:10px; padding:4px; }
  .kpi-grid { gap:7px; margin-bottom:12px; }
  .kpi-card { padding:12px 10px; border-radius:13px; }
  .kpi-trend { margin-top:10px; }
  .progress-track { margin-top:8px; }
  .plan-note { margin-top:7px; }
  .analytics-section { margin-top:12px; padding:13px 9px; border-radius:14px; }
  .section-heading { margin-bottom:12px; }
  .section-heading-actions { gap:6px; }
  .chart-grid { gap:12px; }
  .chart-card { padding:12px 6px; border-radius:13px; }
  .chart-card-header { min-height:40px; padding:0 5px; gap:8px; }
  .chart-total-summary { min-width:176px; }
  .chart-total-summary > div { padding:6px 7px; }
}

@media (max-width:420px) {
  .analytics-chart-grid .chart-card-header,
  .water-section .chart-card-header { flex-wrap:wrap; }
  .analytics-chart-grid .chart-total-summary,
  .water-section .chart-total-summary { width:100%;min-width:0; }
  .analytics-chart-grid .chart-total-summary > div,
  .water-section .chart-total-summary > div { align-items:center; }
}

/* Plant summary mirrors the main dashboard overview card. */
.detail-overview-card {
  position:relative;
  margin-bottom:14px;
  padding:15px 17px;
  overflow:hidden;
  border:1px solid rgba(87,207,214,.24);
  border-radius:16px;
  background:
    radial-gradient(circle at 4% 0%,rgba(44,206,211,.12),transparent 29rem),
    radial-gradient(circle at 96% 100%,rgba(238,180,64,.08),transparent 25rem),
    linear-gradient(145deg,rgba(10,72,99,.88),rgba(6,43,76,.92));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 13px 30px rgba(0,19,43,.17);
}
.detail-overview-card::before {
  position:absolute;
  inset:0 auto auto 0;
  width:100%;
  height:2px;
  background:linear-gradient(90deg,#52dedf,rgba(82,222,223,.08) 46%,rgba(243,190,77,.08) 54%,#f3be4d);
  content:"";
  opacity:.7;
}
.detail-overview-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
.detail-metric-block { min-width:0; padding-right:17px; }
.detail-metric-block.revenue {
  position:relative;
  padding-right:0;
  padding-left:17px;
  border-left:1px solid rgba(127,188,204,.18);
}
.detail-metric-heading,
.detail-metric-heading p,
.detail-percentage,
.detail-yesterday-row > span { display:flex; align-items:center; }
.detail-metric-heading { min-height:31px; justify-content:space-between; gap:10px; }
.detail-metric-heading p { min-width:0; margin:0; gap:8px; color:#dceff2; font-size:.8rem; font-weight:700; }
.detail-metric-icon {
  display:grid;
  width:30px;
  height:30px;
  flex:0 0 30px;
  place-items:center;
  border:1px solid rgba(82,226,216,.35);
  border-radius:9px;
  background:linear-gradient(145deg,rgba(34,197,181,.28),rgba(30,122,167,.22));
  color:#75f1e5;
}
.detail-metric-icon.revenue {
  border-color:rgba(247,198,87,.34);
  background:linear-gradient(145deg,rgba(232,174,61,.25),rgba(81,59,28,.30));
  color:#ffd46a;
}
.detail-percentage { flex:0 0 auto; gap:4px; color:#ffbd5d; font-size:.78rem; font-weight:800; white-space:nowrap; }
.detail-metric-block.positive .detail-percentage { color:#70e2ad; }
.detail-metric-block.neutral .detail-percentage { color:#91aeba; }
.detail-summary-panel {
  position:relative;
  margin-top:8px;
  padding:9px 11px 8px;
  overflow:hidden;
  border:1px solid rgba(91,206,216,.19);
  border-radius:11px;
  background:
    radial-gradient(circle at 100% 0%,rgba(54,208,215,.10),transparent 54%),
    linear-gradient(145deg,rgba(10,54,77,.76),rgba(4,30,54,.70));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 7px 16px rgba(0,15,36,.12);
}
.detail-summary-panel::before {
  position:absolute;
  inset:0 auto 0 0;
  width:3px;
  border-radius:11px 0 0 11px;
  background:linear-gradient(180deg,#55dbe4,rgba(46,143,190,.28));
  content:"";
}
.detail-summary-panel.revenue { border-color:rgba(240,187,82,.20); }
.detail-summary-panel.revenue::before { background:linear-gradient(180deg,#f7cc68,rgba(212,145,39,.25)); }
.detail-summary-values,
.detail-yesterday-row { display:grid; grid-template-columns:minmax(0,1.18fr) minmax(0,.82fr); }
.detail-summary-stat { display:flex; min-width:0; flex-direction:column; gap:2px; }
.detail-summary-stat.plan,
.detail-yesterday-row > span + span {
  margin-left:12px;
  padding-left:12px;
  border-left:1px solid rgba(140,183,198,.17);
}
.detail-summary-stat > span { color:#8fb0bd; font-size:.62rem; font-weight:600; }
.detail-summary-stat strong {
  overflow:hidden;
  color:#fff;
  font-size:clamp(1.08rem,2vw,1.35rem);
  font-weight:700;
  font-variant-numeric:tabular-nums;
  line-height:1.08;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.detail-summary-stat.plan strong { color:#c3d8e0; font-weight:650; }
.detail-summary-stat small { color:#8eabb8; font-size:.49rem; font-weight:600; }
.detail-progress { height:4px; margin-top:8px; overflow:hidden; border-radius:999px; background:rgba(129,173,190,.17); }
.detail-progress > span {
  display:block;
  height:100%;
  border-radius:inherit;
  background:linear-gradient(90deg,#ef9144,#ffc36d);
  box-shadow:0 0 9px rgba(242,155,67,.28);
}
.detail-metric-block.revenue .detail-progress > span { background:linear-gradient(90deg,#e9aa35,#ffd263); }
.detail-metric-block.positive .detail-progress > span { background:linear-gradient(90deg,#25b97c,#65e6a7); }
.detail-metric-block.neutral .detail-progress > span { background:linear-gradient(90deg,#39b7cf,#70dce1); }
.detail-yesterday-row { margin-top:6px; }
.detail-yesterday-row > span {
  min-width:0;
  gap:3px;
  overflow:hidden;
  color:#789aa8;
  font-size:.5rem;
  font-weight:600;
  font-variant-numeric:tabular-nums;
  white-space:nowrap;
}
.detail-yesterday-row b { overflow:hidden; color:#7fddd8; font-size:.59rem; text-overflow:ellipsis; }
.detail-yesterday-row > span + span b { color:#a8c1cb; }
.detail-summary-panel.revenue .detail-yesterday-row > span:first-child b { color:#f2c45e; }
.detail-yesterday-row small { color:#668896; font-size:.42rem; }

@media (max-width:600px) {
  .detail-overview-card { padding:10px 11px; border-radius:14px; }
  .detail-overview-grid { grid-template-columns:1fr; }
  .detail-metric-block { padding-right:0; }
  .detail-metric-block.revenue {
    margin-top:9px;
    padding-top:9px;
    padding-left:0;
    border-top:1px solid rgba(127,188,204,.18);
    border-left:0;
  }
  .detail-metric-heading p { font-size:.74rem; }
  .detail-summary-panel { margin-top:6px; padding:8px 9px 7px; }
  .detail-summary-stat.plan,
  .detail-yesterday-row > span + span { margin-left:8px; padding-left:8px; }
  .detail-summary-stat strong { font-size:1rem; }
  .detail-percentage { font-size:.72rem; }
}

/* One date-range control filters every analytics chart below it. */
.chart-range-filter-button {
  display:inline-flex;
  min-height:40px;
  align-items:center;
  gap:7px;
  padding:0 11px;
  border:1px solid rgba(77,215,220,.28);
  border-radius:11px;
  background:rgba(6,48,79,.46);
  color:#b9d5de;
  font:inherit;
  cursor:pointer;
  transition:border-color .18s ease,background .18s ease,color .18s ease;
}
.chart-range-filter-button:hover,
.chart-range-filter-button.active {
  border-color:rgba(101,235,233,.58);
  background:rgba(16,112,137,.36);
  color:#efffff;
}
.chart-range-filter-button:focus-visible {
  outline:2px solid #9ff9f4;
  outline-offset:2px;
}
.chart-range-filter-button > span {
  max-width:220px;
  overflow:hidden;
  font-size:.72rem;
  font-weight:700;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.chart-range-filter-panel {
  display:grid;
  grid-template-columns:repeat(2,minmax(170px,1fr)) auto;
  align-items:end;
  gap:10px;
  margin:8px 0 15px;
  padding:12px;
  border:1px solid rgba(81,208,216,.22);
  border-radius:12px;
  background:linear-gradient(145deg,rgba(8,69,94,.64),rgba(4,34,64,.72));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
}
.chart-range-filter-panel label {
  display:flex;
  min-width:0;
  flex-direction:column;
  gap:0;
}
.chart-range-filter-panel input {
  width:100%;
  min-height:40px;
  padding:0 10px;
  border:1px solid rgba(105,190,204,.25);
  border-radius:9px;
  outline:0;
  background:rgba(3,30,56,.68);
  color:#f3fbfd;
  font:inherit;
  font-size:.8rem;
  color-scheme:dark;
}
.chart-range-filter-panel input:focus {
  border-color:#55dbe4;
  box-shadow:0 0 0 3px rgba(85,219,228,.12);
}
.chart-range-filter-actions {
  display:flex;
  align-items:center;
  gap:7px;
}
.chart-range-year-button,
.chart-range-apply-button {
  display:inline-flex;
  min-height:40px;
  align-items:center;
  justify-content:center;
  gap:6px;
  padding:0 12px;
  border:1px solid rgba(99,190,204,.26);
  border-radius:9px;
  background:rgba(15,67,91,.58);
  color:#c6e0e6;
  font:inherit;
  font-size:.74rem;
  font-weight:750;
  white-space:nowrap;
  cursor:pointer;
}
.chart-range-apply-button {
  border-color:rgba(69,215,206,.42);
  background:linear-gradient(120deg,#139faa,#087895);
  color:#fff;
}
.chart-range-year-button:hover { background:rgba(24,91,116,.72);color:#fff; }
.chart-range-apply-button:hover { filter:brightness(1.08); }
.chart-range-apply-button:disabled { opacity:.55;cursor:not-allowed; }

@media (max-width:760px) {
  .chart-range-filter-button {
    width:auto;
    min-width:78px;
    min-height:38px;
    flex:0 0 auto;
    justify-content:center;
    gap:5px;
    padding:0 9px;
  }
  .chart-range-filter-button > span {
    display:inline;
    max-width:none;
    overflow:visible;
    color:#f3ffff;
    font-size:.68rem;
    text-overflow:clip;
  }
  .chart-range-filter-button > svg { flex:0 0 auto; }
  .chart-range-filter-button > svg:last-child { display:block; }
  .chart-range-filter-panel { grid-template-columns:1fr 1fr; }
  .chart-range-filter-actions { grid-column:1 / -1;justify-content:flex-end; }
}

@media (max-width:430px) {
  .chart-range-filter-panel { grid-template-columns:1fr; }
  .chart-range-filter-actions { grid-column:1; }
  .chart-range-year-button,
  .chart-range-apply-button { flex:1 1 0; }
}

.chart-data-dialog {
  overflow:hidden !important;
  border:1px solid rgba(87,214,220,.3) !important;
  background:linear-gradient(155deg,#0a526f,#073d60 48%,#082a50) !important;
  color:#edf9fb !important;
  box-shadow:0 28px 80px rgba(0,12,35,.5) !important;
}
.chart-data-dialog-header {
  display:flex;
  min-height:76px;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:15px 18px;
  border-bottom:1px solid rgba(95,210,222,.18);
  background:rgba(4,42,72,.28);
}
.chart-data-dialog-header > div {
  display:flex;
  min-width:0;
  align-items:center;
  gap:11px;
}
.chart-data-dialog-header > div > span:last-child { min-width:0; }
.chart-data-dialog-header h2 {
  margin:1px 0 0;
  color:#fff;
  font-size:clamp(1rem,1.6vw,1.3rem);
  line-height:1.25;
}
.chart-data-dialog-icon {
  display:grid;
  width:42px;
  height:42px;
  flex:0 0 42px;
  place-items:center;
  border:1px solid rgba(87,226,224,.34);
  border-radius:12px;
  background:rgba(28,166,179,.2);
  color:#7ce9e7;
}
.chart-data-dialog-close {
  display:grid;
  width:38px;
  height:38px;
  flex:0 0 38px;
  place-items:center;
  border:1px solid rgba(139,190,204,.24);
  border-radius:10px;
  background:rgba(4,32,61,.36);
  color:#a9c6d0;
  cursor:pointer;
}
.chart-data-dialog-close:hover { border-color:rgba(129,229,229,.5);color:#fff; }
.chart-data-dialog-content {
  min-height:0;
  padding:16px 18px 18px;
  overflow:auto;
}
.chart-data-dialog .chart-range-filter-panel {
  margin:0 0 12px;
  background:rgba(3,37,65,.5);
}
.chart-range-error {
  margin:0 0 10px;
  padding:9px 11px;
  border:1px solid rgba(255,139,108,.32);
  border-radius:9px;
  background:rgba(179,62,38,.16);
  color:#ffc4b2;
  font-size:.76rem;
  font-weight:650;
}
.chart-data-range-summary {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin:2px 0 9px;
  color:#9fbec8;
  font-size:.72rem;
  font-weight:700;
}
.chart-data-range-summary > span {
  display:inline-flex;
  align-items:center;
  gap:6px;
}
.chart-data-table-wrap {
  max-height:min(56vh,560px);
  overflow:auto;
  border:1px solid rgba(105,195,208,.2);
  border-radius:12px;
  background:rgba(3,27,52,.46);
}
.chart-data-table {
  width:100%;
  min-width:680px;
  border-collapse:separate;
  border-spacing:0;
  font-variant-numeric:tabular-nums;
}
.chart-data-table th,
.chart-data-table td {
  padding:10px 13px;
  border-right:1px solid rgba(116,177,194,.12);
  border-bottom:1px solid rgba(116,177,194,.12);
  text-align:right;
  white-space:nowrap;
}
.chart-data-table tr > :last-child { border-right:0; }
.chart-data-table thead th {
  position:sticky;
  z-index:2;
  top:0;
  background:#0b4767;
  color:#b9d5de;
  font-size:.74rem;
  font-weight:750;
}
.chart-data-table thead tr:nth-child(2) th { top:39px; }
.chart-data-table thead th:first-child,
.chart-data-table tbody th,
.chart-data-table tfoot th { text-align:left; }
.chart-data-table thead .energy-group { color:#75e5e1; }
.chart-data-table thead .revenue-group { color:#ffd066; }
.chart-data-table tbody th {
  color:#dcecf1;
  font-size:.77rem;
  font-weight:700;
}
.chart-data-table tbody td {
  color:#b6ccd4;
  font-size:.79rem;
  font-weight:650;
}
.chart-data-table tbody tr:nth-child(even) { background:rgba(72,151,170,.05); }
.chart-data-table tbody tr:hover { background:rgba(74,205,210,.09); }
.chart-data-table tbody tr.is-current-month {
  background:linear-gradient(90deg,rgba(35,207,213,.2),rgba(35,207,213,.08) 52%,rgba(255,201,82,.12));
  box-shadow:inset 4px 0 #42e1df,inset 0 1px rgba(109,239,235,.28),inset 0 -1px rgba(109,239,235,.28);
}
.chart-data-table tbody tr.is-current-month th,
.chart-data-table tbody tr.is-current-month td {
  color:#fff;
  font-weight:850;
}
.chart-data-table tbody tr.is-current-month th::after {
  display:inline-flex;
  margin-left:7px;
  padding:2px 6px;
  align-items:center;
  border:1px solid rgba(103,235,231,.42);
  border-radius:999px;
  background:rgba(44,202,204,.18);
  color:#83f2ed;
  content:"ປັດຈຸບັນ";
  font-size:.58rem;
  font-weight:800;
  line-height:1.2;
  vertical-align:middle;
}
.chart-data-table tbody td.actual-value { color:#79e5e1;font-weight:800; }
.chart-data-table tbody td.revenue-value { color:#ffd06c; }
.chart-data-table tfoot th,
.chart-data-table tfoot td {
  position:sticky;
  z-index:2;
  bottom:0;
  border-bottom:0;
  border-top:2px solid rgba(86,226,222,.68);
  background:linear-gradient(90deg,#0e5871,#0b4969 48%,#0d5670);
  color:#fff;
  font-size:.8rem;
  font-weight:850;
  box-shadow:inset 0 1px rgba(255,255,255,.08),0 -4px 14px rgba(1,20,40,.2);
}
.chart-data-table-state {
  height:110px;
  text-align:center !important;
  color:#91adb8 !important;
}
.chart-data-table-state .loader {
  display:inline-block;
  width:20px;
  height:20px;
  margin-right:7px;
  vertical-align:middle;
}

/* Compact comparison table: all 12 months remain visible without nested scrolling. */
@media (min-width:601px) {
  .chart-data-dialog {
    max-height:calc(100dvh - 24px) !important;
  }
  .chart-data-dialog-header {
    min-height:62px;
    padding:10px 15px;
  }
  .chart-data-dialog-icon {
    width:38px;
    height:38px;
    flex-basis:38px;
  }
  .chart-data-dialog-content {
    padding:9px 12px 11px;
  }
  .chart-data-dialog .chart-range-filter-panel {
    gap:6px;
    margin-bottom:5px;
    padding:7px 8px;
  }
  .chart-data-dialog .chart-range-filter-panel input,
  .chart-data-dialog .chart-range-year-button,
  .chart-data-dialog .chart-range-apply-button {
    min-height:38px;
    font-size:.82rem;
  }
  .chart-data-range-summary {
    margin:1px 0 6px;
    font-size:.78rem;
  }
  .chart-data-table-wrap {
    max-height:none;
    overflow:visible;
  }
  .chart-data-table {
    table-layout:fixed;
  }
  .chart-data-table th,
  .chart-data-table td {
    height:32px;
    padding:4px 7px;
    text-align:center;
  }
  .chart-data-table thead th {
    font-size:.82rem;
    line-height:1.2;
    text-align:center;
  }
  .chart-data-table thead tr:nth-child(2) th { top:32px; }
  .chart-data-table thead th:first-child,
  .chart-data-table tbody th,
  .chart-data-table tfoot th {
    text-align:center;
  }
  .chart-data-table thead th[rowspan],
  .chart-data-table tbody th,
  .chart-data-table tfoot th { width:18%; }
  .chart-data-table tbody th,
  .chart-data-table tbody td {
    font-size:.84rem;
    line-height:1.2;
  }
  .chart-data-table tbody td:nth-of-type(1) {
    color:#b9d0d8;
    font-weight:700;
  }
  .chart-data-table tbody td:nth-of-type(2) {
    color:#76e4df;
    font-weight:800;
  }
  .chart-data-table tbody td:nth-of-type(3) {
    color:#d8c69d;
    font-weight:700;
  }
  .chart-data-table tbody td:nth-of-type(4) {
    color:#ffd06b;
    font-weight:800;
  }
  .chart-data-table tbody tr:nth-child(even) {
    background:rgba(69,171,188,.065);
  }
  .chart-data-table tbody tr.is-current-month {
    background:linear-gradient(90deg,rgba(35,207,213,.2),rgba(35,207,213,.08) 52%,rgba(255,201,82,.12));
  }
  .chart-data-table tbody tr.is-current-month th::after { font-size:.66rem; }
  .chart-data-table tfoot th,
  .chart-data-table tfoot td {
    height:34px;
    font-size:.86rem;
    text-align:center;
  }
}

@media (max-width:600px) {
  .chart-data-dialog {
    max-height:calc(100dvh - 18px) !important;
  }
  .chart-data-dialog-header { min-height:66px;padding:12px; }
  .chart-data-dialog-header h2 { font-size:.94rem; }
  .chart-data-dialog-icon { width:36px;height:36px;flex-basis:36px; }
  .chart-data-dialog-content {
    padding:11px;
    overscroll-behavior:contain;
  }
  .chart-data-dialog .chart-range-filter-panel { grid-template-columns:1fr; }
  .chart-data-dialog .chart-range-filter-actions { grid-column:1; }
  .chart-data-range-summary { align-items:flex-start;flex-direction:column;gap:4px; }
  .chart-data-table-wrap {
    max-height:none;
    overflow:visible;
    border:0;
    background:transparent;
  }
  .chart-data-table {
    display:block;
    min-width:0;
  }
  .chart-data-table thead {
    position:absolute;
    width:1px;
    height:1px;
    padding:0;
    overflow:hidden;
    clip:rect(0,0,0,0);
    white-space:nowrap;
    border:0;
  }
  .chart-data-table tbody,
  .chart-data-table tfoot {
    display:block;
  }
  .chart-data-table tbody tr,
  .chart-data-table tfoot tr {
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:0;
    margin-bottom:9px;
    overflow:hidden;
    border:1px solid rgba(105,195,208,.2);
    border-radius:11px;
    background:rgba(3,31,57,.52);
  }
  .chart-data-table tbody tr.is-current-month {
    border-color:rgba(89,232,228,.58);
    background:linear-gradient(145deg,rgba(24,140,157,.34),rgba(5,50,78,.72));
    box-shadow:inset 4px 0 #42e1df,0 5px 18px rgba(21,203,204,.12);
  }
  .chart-data-table tbody th,
  .chart-data-table tfoot th {
    position:static;
    grid-column:1 / -1;
    padding:9px 10px;
    border-right:0;
    border-bottom:1px solid rgba(105,195,208,.18);
    background:rgba(19,102,124,.25);
    color:#f0fbfd;
    font-size:.78rem;
  }
  .chart-data-table tbody td,
  .chart-data-table tfoot td {
    position:static;
    display:flex;
    min-width:0;
    min-height:56px;
    padding:8px 10px;
    align-items:flex-end;
    justify-content:space-between;
    flex-direction:column;
    gap:4px;
    border-right:1px solid rgba(105,195,208,.12);
    border-bottom:1px solid rgba(105,195,208,.12);
    background:transparent;
    color:#dbeaf0;
    font-size:.84rem;
    text-align:right;
    white-space:normal;
  }
  .chart-data-table tbody td:nth-of-type(even),
  .chart-data-table tfoot td:nth-of-type(even) { border-right:0; }
  .chart-data-table tbody td::before,
  .chart-data-table tfoot td::before {
    align-self:flex-start;
    color:#829faa;
    content:attr(data-label);
    font-size:.61rem;
    font-weight:700;
    line-height:1.25;
    text-align:left;
  }
  .chart-data-table tbody td.actual-value { color:#79e5e1; }
  .chart-data-table tbody td.revenue-value { color:#ffd06c; }
  .chart-data-table tfoot tr {
    margin:2px 0 0;
    border:2px solid rgba(92,220,218,.5);
    background:linear-gradient(145deg,rgba(16,103,122,.88),rgba(8,63,91,.94));
    box-shadow:0 6px 20px rgba(1,20,40,.24),inset 0 1px rgba(255,255,255,.08);
  }
  .chart-data-table tfoot th,
  .chart-data-table tfoot td {
    color:#fff;
    font-weight:800;
  }
  .chart-data-table-state {
    grid-column:1 / -1;
    min-height:100px !important;
    align-items:center !important;
    justify-content:center !important;
  }
  .chart-data-table-state::before { display:none; }
}

@media (max-width:380px) {
  .chart-data-table tbody tr,
  .chart-data-table tfoot tr { grid-template-columns:1fr; }
  .chart-data-table tbody td,
  .chart-data-table tfoot td {
    min-height:48px;
    align-items:center;
    flex-direction:row;
    border-right:0;
  }
  .chart-data-table tbody td::before,
  .chart-data-table tfoot td::before { max-width:65%; }
}

/* Compact plant identity: Back, logo, and plant name remain on one line. */
.plant-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(10px, 1.5vw, 18px);
}
.plant-identity {
  min-width: 0;
  justify-self: start;
  gap: clamp(8px, 1vw, 12px);
}
.header-actions { justify-self: end; }
.plant-header-brand {
  position: relative;
  z-index: 1;
  display: grid;
  width: clamp(56px, 5.5vw, 68px);
  height: clamp(50px, 5vw, 60px);
  flex: 0 0 auto;
  padding: 3px;
  place-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--plant-accent, #38bdf8) 44%, rgba(255,255,255,.42));
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(239,250,252,.95));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.92),
    0 7px 18px rgba(0,28,61,.18),
    0 0 12px color-mix(in srgb, var(--plant-accent, #38bdf8) 14%, transparent);
}
.plant-header-brand::after {
  position: absolute;
  right: 13%;
  bottom: 0;
  left: 13%;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(90deg, transparent, var(--plant-accent, #38bdf8), transparent);
  content: "";
  box-shadow: 0 0 8px color-mix(in srgb, var(--plant-accent, #38bdf8) 45%, transparent);
  pointer-events: none;
}
.plant-header-brand .detail-plant-logo,
.plant-header-brand .detail-plant-logo.has-logo {
  display: grid;
  width: 100%;
  height: 100%;
  flex: none;
  padding: 0;
  place-items: center;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.plant-header-brand .detail-plant-logo img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  object-fit: contain;
  object-position: center;
}

@media (max-width: 760px) {
  .plant-header { gap: 8px; }
  .plant-identity { gap: 7px; }
  .plant-header-brand {
    width: 48px;
    height: 44px;
    padding: 2px;
    border-radius: 10px;
  }
}

@media (max-width: 420px) {
  .plant-header-brand {
    width: 44px;
    height: 40px;
    border-radius: 9px;
  }
}

@media (max-width: 340px) {
  .plant-identity { gap: 5px; }
  .plant-header-brand {
    width: 40px;
    height: 37px;
    padding: 2px;
  }
}

/* ==========================================================================
   Dual view (opened from the DUAL ປຽບທຽບ dashboard): same language as the
   main dashboard – teal glass sections, lighter glass chart cards, glossy
   icon badges, plan (amber, left) / actual (teal, right) total tiles.
   ========================================================================== */
.dual-view .analytics-section {
  border: 1px solid rgba(112, 227, 230, 0.24);
  border-radius: 22px;
  background:
    radial-gradient(70% 45% at 50% 0%, rgba(80, 220, 225, 0.08), transparent 70%),
    linear-gradient(145deg, rgba(8, 79, 105, 0.48), rgba(7, 27, 63, 0.42));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 20px 48px rgba(1, 13, 38, 0.24);
  backdrop-filter: blur(28px) saturate(125%);
}

.dual-view .section-heading h2 {
  color: #f0fbfd;
  letter-spacing: 0.01em;
}

.dual-view .chart-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(112, 227, 230, 0.2);
  border-radius: 20px;
  background:
    radial-gradient(70% 55% at 50% 0%, rgba(110, 235, 235, 0.1), transparent 70%),
    linear-gradient(160deg, rgba(22, 118, 142, 0.34), rgba(10, 62, 96, 0.26) 55%, rgba(8, 40, 78, 0.3));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 30px -14px rgba(1, 13, 38, 0.45);
}

.dual-view .chart-title strong {
  color: #f0fbfd;
  font-weight: 700;
}

.dual-view .chart-title small {
  color: #a3c7d3;
}

/* ---- glossy icon badges (same family as the dashboard section icons) ---- */
.dual-view .chart-icon {
  --badge-color: #4fe0dc;

  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--badge-color) 55%, white);
  border-radius: 11px;
  background:
    radial-gradient(120% 90% at 30% 15%, rgba(255, 255, 255, 0.55), transparent 45%),
    linear-gradient(150deg, color-mix(in srgb, var(--badge-color) 85%, white), var(--badge-color) 45%, color-mix(in srgb, var(--badge-color) 62%, #0a3550));
  color: #072a3c;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    inset 0 -2px 4px color-mix(in srgb, var(--badge-color) 40%, #032033),
    0 0 0 3px color-mix(in srgb, var(--badge-color) 14%, transparent),
    0 6px 16px -4px color-mix(in srgb, var(--badge-color) 55%, transparent);
}

.dual-view .chart-icon.orange { --badge-color: #4fe0dc; }
.dual-view .chart-icon.gold { --badge-color: #ffbd49; }
.dual-view .chart-icon.cyan { --badge-color: #6ee6b4; }
.dual-view .chart-icon.water-outflow-icon { --badge-color: #75d9ff; }
.dual-view .chart-icon.blue { --badge-color: #6cc9f5; }

.dual-view .chart-icon > svg {
  color: #072a3c;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35));
}

/* ---- totals: plan left (amber) / actual right (teal), like the gauge tiles ---- */
.dual-view .chart-total-summary,
.dual-view .chart-total-summary.revenue,
.dual-view .chart-total-summary.water {
  --dual-plan: #ffbd49;
  --dual-actual: #4fe0dc;

  position: relative;
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(112, 227, 230, 0.16);
  border-radius: 12px;
  background:
    radial-gradient(45% 100% at 0% 0%, color-mix(in srgb, var(--dual-plan) 8%, transparent), transparent 60%),
    radial-gradient(45% 100% at 100% 0%, color-mix(in srgb, var(--dual-actual) 8%, transparent), transparent 60%),
    rgba(10, 60, 92, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 12px -8px rgba(1, 13, 38, 0.55);
}

/* thin top edge: amber from the left (plan), teal from the right (actual) */
.dual-view .chart-total-summary::before {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--dual-plan), transparent 30%, transparent 70%, var(--dual-actual));
  content: "";
  opacity: 0.55;
}

.dual-view .chart-total-summary > div {
  --tile-color: var(--dual-actual);

  position: relative;
  padding: 8px 12px 7px;
  border: 0;
  background: none;
}

/* markup order is actual, plan → show plan first */
.dual-view .chart-total-summary > .plan {
  --tile-color: var(--dual-plan);

  order: 1;
}

.dual-view .chart-total-summary > .actual {
  order: 2;
  align-items: flex-end;
  text-align: right;
}

.dual-view .chart-total-summary > div + div {
  border-left: 0;
}

/* dashed divider between plan (left) and actual (right) */
.dual-view .chart-total-summary > .actual {
  border-left: 1px dashed rgba(150, 220, 235, 0.22);
}

.dual-view .chart-total-summary span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #a3c7d3;
  font-size: 0.68rem;
}

.dual-view .chart-total-summary > .actual span {
  flex-direction: row-reverse;
}

.dual-view .chart-total-summary span::before {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--tile-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tile-color) 20%, transparent), 0 0 8px var(--tile-color);
  content: "";
}

.dual-view .chart-total-summary strong,
.dual-view .chart-total-summary .plan strong {
  margin-top: 2px;
  color: var(--tile-color);
  font-size: 0.98rem;
  text-shadow: 0 1px 0 rgba(1, 13, 38, 0.6);
}

.dual-view .chart-total-summary strong small {
  color: #7fa6b5;
  font-size: 0.58rem;
}

@media (max-width: 600px) {
  .dual-view .analytics-section {
    border-radius: 18px;
  }

  .dual-view .chart-card {
    border-radius: 16px;
  }

  .dual-view .chart-total-summary > div {
    padding: 8px 10px 7px;
  }

  .dual-view .chart-total-summary strong,
  .dual-view .chart-total-summary .plan strong {
    font-size: 0.9rem;
  }
}

/* water chart icons carry older 3-class rules – match their specificity */
.dual-view .chart-icon.blue.water-level-icon,
.dual-view .chart-icon.blue.water-volume-icon,
.dual-view .chart-icon.cyan.water-inflow-icon,
.dual-view .chart-icon.cyan.water-outflow-icon {
  border-color: color-mix(in srgb, var(--badge-color) 55%, white);
  background:
    radial-gradient(120% 90% at 30% 15%, rgba(255, 255, 255, 0.55), transparent 45%),
    linear-gradient(150deg, color-mix(in srgb, var(--badge-color) 85%, white), var(--badge-color) 45%, color-mix(in srgb, var(--badge-color) 62%, #0a3550));
  color: #072a3c;
}

.dual-view .chart-icon.blue.water-volume-icon { --badge-color: #5cc8f0; }
.dual-view .water-volume-icon .water-fill { opacity: 0.38; }

/* ---- water-level limit tiles: raised glass, glowing edge in limit colour ---- */
.dual-view .water-level-limits {
  gap: 10px;
  margin: 14px 0 8px;
}

.dual-view .water-level-limit {
  position: relative;
  padding: 10px 12px 9px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--limit-color) 20%, rgba(112, 227, 230, 0.14));
  border-radius: 12px;
  background:
    radial-gradient(90% 80% at 0% 0%, color-mix(in srgb, var(--limit-color) 9%, transparent), transparent 60%),
    rgba(10, 60, 92, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 12px -8px rgba(1, 13, 38, 0.55);
}

.dual-view .water-level-limit::before {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--limit-color), transparent 55%);
  content: "";
  opacity: 0.55;
}

.dual-view .water-level-limit:hover {
  border-color: color-mix(in srgb, var(--limit-color) 38%, rgba(112, 227, 230, 0.14));
  background:
    radial-gradient(90% 80% at 0% 0%, color-mix(in srgb, var(--limit-color) 13%, transparent), transparent 60%),
    rgba(12, 66, 98, 0.48);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 16px -8px rgba(1, 13, 38, 0.65);
}

.dual-view .water-level-limit.is-hidden {
  border-color: rgba(123, 157, 170, 0.22);
  background: rgba(9, 52, 86, 0.3);
  box-shadow: none;
  opacity: 0.55;
}

.dual-view .water-level-limit.is-hidden::before {
  display: none;
}

.dual-view .water-level-limit > span {
  gap: 7px;
  color: #a3c7d3;
  font-size: 0.7rem;
  font-weight: 600;
}

/* direction icon in a small tinted coin */
.dual-view .water-level-limit > span > svg:first-child {
  box-sizing: content-box;
  padding: 3px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--limit-color) 12%, transparent);
}

.dual-view .water-level-limit strong {
  margin-top: 6px;
  font-size: 1.02rem;
  font-weight: 800;
  text-shadow: none;
}

.dual-view .water-level-limit strong small {
  color: #7fa6b5;
}

@media (max-width: 600px) {
  .dual-view .water-level-limits {
    gap: 8px;
  }

  .dual-view .water-level-limit {
    padding: 8px 10px 7px;
    border-radius: 11px;
  }

  .dual-view .water-level-limit strong {
    font-size: 0.9rem;
  }
}
</style>
