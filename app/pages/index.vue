<template>
  <v-container fluid class="dashboard-page pa-0">
    <main class="executive-dashboard">
      <header class="dashboard-header">
        <div class="brand-lockup">
          <div>
            <h1>{{ showPlantDetails ? "ຂໍ້ມູນລາຍລະອຽດເຂື່ອນ" : "ຂໍ້ມູນສະຖິຕິພະລັງງານ" }}</h1>
          </div>
        </div>

        <button class="date-badge" type="button" @click="filterOpen = !filterOpen">
          <Icon name="lucide:calendar-days" size="18" class="date-icon" />
          <span class="date-range-text">{{ rangeLabel }}</span>
          <span class="date-mobile-text">ວັນທີ</span>
          <Icon :name="filterOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="16" class="date-chevron" />
        </button>
      </header>

      <div class="dashboard-toolbar">
        <nav class="period-tabs" aria-label="ຮູບແບບໄລຍະເວລາ">
          <button
            v-for="period in periodOptions"
            :key="period.value"
            type="button"
            :class="{ active: selectedPeriod === period.value }"
            @click="selectPeriod(period.value)"
          >
            {{ period.title }}
          </button>
        </nav>
      </div>

      <form v-if="filterOpen" class="filter-panel" @submit.prevent="applyFilters">
        <div v-if="selectedPeriod === 'D' || selectedPeriod === 'W'" class="filter-field">
          <input id="dashboard-date" v-model="selectedDate" type="date" aria-label="ເລືອກວັນທີ">
        </div>

        <div v-else-if="selectedPeriod === 'M'" class="filter-field">
          <input id="dashboard-month" v-model="selectedMonth" type="month" aria-label="ເລືອກເດືອນ">
        </div>

        <template v-else-if="selectedPeriod === 'Q'">
          <div class="filter-field">
            <select id="dashboard-quarter" v-model.number="selectedQuarter" aria-label="ເລືອກໄຕມາດ">
              <option v-for="quarter in quarterOptions" :key="quarter" :value="quarter">ໄຕມາດ {{ quarter }}</option>
            </select>
          </div>
          <div class="filter-field">
            <input id="quarter-year" v-model.number="selectedYear" type="number" min="2000" max="2100" aria-label="ເລືອກປີ">
          </div>
        </template>

        <div v-else class="filter-field">
          <input id="dashboard-year" v-model.number="selectedYear" type="number" min="2000" max="2100" aria-label="ເລືອກປີ">
        </div>

        <button class="apply-button" type="submit" :disabled="loading || refreshing">
          <Icon name="lucide:search" size="18" />
          ຄົ້ນຫາ
        </button>
      </form>

      <div v-if="errorMessage" class="dashboard-alert" role="alert">
        <Icon name="lucide:triangle-alert" size="19" />
        <span>{{ errorMessage }}</span>
        <button type="button" @click="loadDashboard">ລອງໃໝ່</button>
      </div>

      <section
        v-if="!showPlantDetails"
        class="kpi-grid"
        :class="{ 'plant-list-mode': plantListView }"
        aria-label="ຕົວເລກສະຫຼຸບ"
      >
        <article class="executive-overview-card" aria-label="ພາບລວມພະລັງງານ ແລະ ລາຍຮັບ">
          <div class="executive-overview-grid">
        <section class="executive-metric-block energy-metric" :class="energyPerformance.tone">
          <div class="kpi-heading">
            <p class="kpi-title">
              <span class="metric-icon energy"><Icon name="mdi:lightning-bolt" size="20" /></span>
              <span>ພະລັງງານລວມ</span>
            </p>
            <strong class="kpi-percentage">
              <Icon :name="energyPerformance.icon" size="18" />
              <span>{{ energyPerformance.percentage }}</span>
            </strong>
          </div>
          <div class="kpi-summary-panel energy-summary">
            <div class="kpi-summary-values">
              <div class="kpi-summary-stat actual">
                <span>ຕົວຈິງ</span>
                <strong>{{ formatMetric(totalEnergy) }} <small>GWh</small></strong>
              </div>
              <div class="kpi-summary-stat plan">
                <span>ແຜນ</span>
                <strong>{{ formatMetric(totalPlanEnergy) }} <small>GWh</small></strong>
              </div>
            </div>
            <div class="kpi-summary-progress">
              <span :style="{ width: `${energyPerformance.bar}%` }" />
            </div>
            <div class="kpi-yesterday-row" :title="yesterdayDate">
              <div class="kpi-yesterday-value actual">
                <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                <b>{{ hasYesterdayData ? formatMetric(yesterdayActualEnergy) : "—" }}</b>
                <small>GWh</small>
              </div>
              <div class="kpi-yesterday-value plan">
                <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                <b>{{ hasYesterdayData ? formatMetric(yesterdayPlanEnergy) : "—" }}</b>
                <small>GWh</small>
              </div>
            </div>
          </div>

          <div v-if="false" class="kpi-plant-breakdown">
            <div class="breakdown-header">
              <span class="breakdown-title">
                <Icon name="lucide:layers" size="13" />
                <span>ພະລັງງານແຍກເຂື່ອນ</span>
              </span>
              <span class="breakdown-actions">
                <button
                  v-if="plantEnergyList.length"
                  class="breakdown-chart-button energy"
                  type="button"
                  aria-label="ເບິ່ງກຣາຟປຽບທຽບພະລັງງານ"
                  @click="openComparisonChart('energy')"
                >
                  <Icon name="lucide:chart-no-axes-column-increasing" size="13" />
                  <span>ປຽບທຽບ</span>
                </button>
                <span v-if="plantEnergyList.length" class="breakdown-count">{{ plantEnergyList.length }} ເຂື່ອນ</span>
              </span>
            </div>

            <div v-if="loading && !plantEnergyList.length" class="breakdown-skeleton">
              <div v-for="i in 4" :key="i" class="breakdown-skeleton-row" />
            </div>

            <div v-else-if="!plantEnergyList.length" class="breakdown-empty">
              <span>ບໍ່ມີຂໍ້ມູນແຕ່ລະເຂື່ອນ</span>
            </div>

            <div v-else class="breakdown-list">
              <div
                v-for="plant in plantEnergyList"
                :key="plant.code"
                class="plant-breakdown-row"
                role="button"
                tabindex="0"
                :title="`ເບິ່ງລາຍລະອຽດ ${plant.shortName || plant.code}`"
                @click="openSite(plant.code)"
                @keydown.enter="openSite(plant.code)"
              >
                <div class="plant-row-lead">
                  <span
                    class="plant-mini-logo"
                    :class="{ 'has-logo': plant.brand.logo }"
                    :style="{ '--plant-accent': plant.brand.accent }"
                  >
                    <img
                      v-if="plant.brand.logo"
                      :src="plant.brand.logo"
                      :alt="plant.shortName"
                      loading="lazy"
                    >
                    <span v-else class="plant-mini-mark">{{ plant.brand.mark }}</span>
                  </span>
                  <span class="plant-row-name">{{ plant.shortName }}</span>
                </div>

                <div class="plant-row-metrics">
                  <div class="plant-row-numbers">
                    <span class="metric-item actual">
                      <span class="metric-lbl">ຕົວຈິງ:</span>
                      <strong class="metric-val">{{ formatMetric(plant.energy) }}</strong>
                      <small>GWh</small>
                    </span>
                    <span class="metric-sep">/</span>
                    <span class="metric-item plan">
                      <span class="metric-lbl">ແຜນ:</span>
                      <span class="metric-val">{{ formatMetric(plant.planEnergy) }}</span>
                      <small>GWh</small>
                    </span>
                  </div>
                  <div class="plant-row-track">
                    <span
                      class="plant-row-fill energy-fill"
                      :class="plant.perf.tone"
                      :style="{ width: `${Math.min(100, Math.max(3, plant.perf.bar))}%` }"
                    />
                  </div>
                </div>

                <div class="plant-row-end">
                  <span class="plant-row-pct" :class="plant.perf.tone">
                    <Icon :name="plant.perf.icon" size="12" />
                    <span>{{ plant.perf.percentage }}</span>
                  </span>
                  <Icon name="lucide:chevron-right" size="13" class="plant-row-chevron" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="executive-metric-block revenue-metric" :class="revenuePerformance.tone">
          <div class="kpi-heading">
            <p class="kpi-title">
              <span class="metric-icon revenue"><Icon name="lucide:dollar-sign" size="19" stroke-width="2.6" /></span>
              <span>ລາຍຮັບລວມ</span>
            </p>
            <strong class="kpi-percentage">
              <Icon :name="revenuePerformance.icon" size="18" />
              <span>{{ revenuePerformance.percentage }}</span>
            </strong>
          </div>
          <div class="kpi-summary-panel revenue-summary">
            <div class="kpi-summary-values">
              <div class="kpi-summary-stat actual">
                <span>ຕົວຈິງ</span>
                <strong>{{ formatMetric(totalRevenue) }} <small>MUSD</small></strong>
              </div>
              <div class="kpi-summary-stat plan">
                <span>ແຜນ</span>
                <strong>{{ formatMetric(totalPlanRevenue) }} <small>MUSD</small></strong>
              </div>
            </div>
            <div class="kpi-summary-progress">
              <span :style="{ width: `${revenuePerformance.bar}%` }" />
            </div>
            <div class="kpi-yesterday-row" :title="yesterdayDate">
              <div class="kpi-yesterday-value actual">
                <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                <b>{{ hasYesterdayData ? formatMetric(yesterdayActualRevenue) : "—" }}</b>
                <small>MUSD</small>
              </div>
              <div class="kpi-yesterday-value plan">
                <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                <b>{{ hasYesterdayData ? formatMetric(yesterdayPlanRevenue) : "—" }}</b>
                <small>MUSD</small>
              </div>
            </div>
          </div>

          <div v-if="false" class="kpi-plant-breakdown">
            <div class="breakdown-header">
              <span class="breakdown-title">
                <Icon name="lucide:layers" size="13" />
                <span>ລາຍຮັບແຍກເຂື່ອນ</span>
              </span>
              <span class="breakdown-actions">
                <button
                  v-if="plantRevenueList.length"
                  class="breakdown-chart-button revenue"
                  type="button"
                  aria-label="ເບິ່ງກຣາຟປຽບທຽບລາຍຮັບ"
                  @click="openComparisonChart('revenue')"
                >
                  <Icon name="lucide:chart-no-axes-column-increasing" size="13" />
                  <span>ປຽບທຽບ</span>
                </button>
                <span v-if="plantRevenueList.length" class="breakdown-count">{{ plantRevenueList.length }} ເຂື່ອນ</span>
              </span>
            </div>

            <div v-if="loading && !plantRevenueList.length" class="breakdown-skeleton">
              <div v-for="i in 4" :key="i" class="breakdown-skeleton-row" />
            </div>

            <div v-else-if="!plantRevenueList.length" class="breakdown-empty">
              <span>ບໍ່ມີຂໍ້ມູນແຕ່ລະເຂື່ອນ</span>
            </div>

            <div v-else class="breakdown-list">
              <div
                v-for="plant in plantRevenueList"
                :key="plant.code"
                class="plant-breakdown-row"
                role="button"
                tabindex="0"
                :title="`ເບິ່ງລາຍລະອຽດ ${plant.shortName || plant.code}`"
                @click="openSite(plant.code)"
                @keydown.enter="openSite(plant.code)"
              >
                <div class="plant-row-lead">
                  <span
                    class="plant-mini-logo"
                    :class="{ 'has-logo': plant.brand.logo }"
                    :style="{ '--plant-accent': plant.brand.accent }"
                  >
                    <img
                      v-if="plant.brand.logo"
                      :src="plant.brand.logo"
                      :alt="plant.shortName"
                      loading="lazy"
                    >
                    <span v-else class="plant-mini-mark">{{ plant.brand.mark }}</span>
                  </span>
                  <span class="plant-row-name">{{ plant.shortName }}</span>
                </div>

                <div class="plant-row-metrics">
                  <div class="plant-row-numbers">
                    <span class="metric-item actual">
                      <span class="metric-lbl">ຕົວຈິງ:</span>
                      <strong class="metric-val">{{ formatMetric(plant.revenue) }}</strong>
                      <small>MUSD</small>
                    </span>
                    <span class="metric-sep">/</span>
                    <span class="metric-item plan">
                      <span class="metric-lbl">ແຜນ:</span>
                      <span class="metric-val">{{ formatMetric(plant.planRevenue) }}</span>
                      <small>MUSD</small>
                    </span>
                  </div>
                  <div class="plant-row-track">
                    <span
                      class="plant-row-fill revenue-fill"
                      :class="plant.perf.tone"
                      :style="{ width: `${Math.min(100, Math.max(3, plant.perf.bar))}%` }"
                    />
                  </div>
                </div>

                <div class="plant-row-end">
                  <span class="plant-row-pct" :class="plant.perf.tone">
                    <Icon :name="plant.perf.icon" size="12" />
                    <span>{{ plant.perf.percentage }}</span>
                  </span>
                  <Icon name="lucide:chevron-right" size="13" class="plant-row-chevron" />
                </div>
              </div>
            </div>
          </div>
        </section>
          </div>

        <section class="combined-plants-card embedded-plant-collapse" :class="{ 'is-collapsed': !plantsExpanded }">
          <div
            class="combined-plants-header"
            role="button"
            tabindex="0"
            :aria-expanded="plantsExpanded"
            aria-controls="plant-portfolio-content"
            @click="plantsExpanded = !plantsExpanded"
            @keydown.enter.prevent="plantsExpanded = !plantsExpanded"
            @keydown.space.prevent="plantsExpanded = !plantsExpanded"
          >
            <div class="combined-plants-title">
              <span class="combined-title-icon"><Icon name="lucide:building-2" size="18" /></span>
              <div>
                <h2>ພະລັງງານ ແລະ ລາຍຮັບແຕ່ລະເຂື່ອນ</h2>
              </div>
            </div>
            <div class="combined-plants-actions">
              <button
                v-if="combinedPlantList.length && plantsExpanded"
                class="breakdown-chart-button energy"
                type="button"
                aria-label="ເບິ່ງກຣາຟປຽບທຽບ"
                @click.stop="openComparisonChart('energy')"
              >
                <Icon name="lucide:chart-no-axes-column-increasing" size="13" />
                <span>ແບບປຽບທ້ຽບ</span>
              </button>
              <span v-if="combinedPlantList.length" class="breakdown-count">{{ combinedPlantList.length }} ເຂື່ອນ</span>
              <span class="portfolio-collapse-indicator" aria-hidden="true">
                <Icon :name="plantsExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="17" />
              </span>
            </div>
          </div>

          <div v-show="plantsExpanded" id="plant-portfolio-content" class="combined-plants-body">
          <div v-if="loading && !combinedPlantList.length" class="combined-plants-skeleton">
            <span v-for="i in 6" :key="i" />
          </div>

          <div v-else-if="!combinedPlantList.length" class="breakdown-empty">
            <span>ບໍ່ມີຂໍ້ມູນແຕ່ລະເຂື່ອນ</span>
          </div>

          <div v-else class="combined-plants-grid">
            <button
              v-for="plant in combinedPlantList"
              :key="plant.code"
              type="button"
              class="combined-plant-card"
              :style="{ '--plant-accent': plant.brand.accent }"
              :title="`ເບິ່ງລາຍລະອຽດ ${plantDisplayName(plant)}`"
              @click="openSite(plant.code)"
            >
              <span class="combined-plant-identity">
                <span class="combined-plant-logo" :class="{ 'has-logo': plant.brand.logo }">
                  <img v-if="plant.brand.logo" :src="plant.brand.logo" :alt="plantDisplayName(plant)" loading="lazy">
                  <span v-else>{{ plant.brand.mark }}</span>
                </span>
                <span class="combined-plant-name">
                  <strong>{{ plantDisplayName(plant) }}</strong>
                </span>
              </span>

              <span class="combined-card-metrics">
                <span class="combined-metric energy">
                  <span class="combined-metric-heading">
                    <span><Icon name="mdi:lightning-bolt" size="13" /> ພະລັງງານ</span>
                    <span class="combined-performance" :class="plant.energyPerf.tone">
                      <Icon :name="plant.energyPerf.icon" size="11" />
                      {{ plant.energyPerf.percentage }}
                    </span>
                  </span>
                  <span class="combined-metric-values">
                    <span><small>ຕົວຈິງ</small><strong>{{ formatMetric(plant.energy) }} <i>GWh</i></strong></span>
                    <span><small>ແຜນ</small><strong>{{ formatMetric(plant.planEnergy) }} <i>GWh</i></strong></span>
                  </span>
                  <span class="combined-progress"><i :class="plant.energyPerf.tone" :style="{ width: `${Math.min(100, Math.max(3, plant.energyPerf.bar))}%` }" /></span>
                  <span class="combined-yesterday-values" :title="yesterdayDate">
                    <span>
                      <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                      <strong>{{ plant.hasYesterdayEnergy ? formatMetric(plant.yesterdayEnergy) : "—" }} <i>GWh</i></strong>
                    </span>
                    <span>
                      <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                      <strong>{{ plant.hasYesterdayPlanEnergy ? formatMetric(plant.yesterdayPlanEnergy) : "—" }} <i>GWh</i></strong>
                    </span>
                  </span>
                </span>

                <span class="combined-metric revenue">
                  <span class="combined-metric-heading">
                    <span><Icon name="lucide:dollar-sign" size="13" /> ລາຍຮັບ</span>
                    <span class="combined-performance" :class="plant.revenuePerf.tone">
                      <Icon :name="plant.revenuePerf.icon" size="11" />
                      {{ plant.revenuePerf.percentage }}
                    </span>
                  </span>
                  <span class="combined-metric-values">
                    <span><small>ຕົວຈິງ</small><strong>{{ formatMetric(plant.revenue) }} <i>MUSD</i></strong></span>
                    <span><small>ແຜນ</small><strong>{{ formatMetric(plant.planRevenue) }} <i>MUSD</i></strong></span>
                  </span>
                  <span class="combined-progress"><i :class="plant.revenuePerf.tone" :style="{ width: `${Math.min(100, Math.max(3, plant.revenuePerf.bar))}%` }" /></span>
                  <span class="combined-yesterday-values" :title="yesterdayDate">
                    <span>
                      <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                      <strong>{{ plant.hasYesterdayRevenue ? formatMetric(plant.yesterdayRevenue) : "—" }} <i>MUSD</i></strong>
                    </span>
                    <span>
                      <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                      <strong>{{ plant.hasYesterdayPlanRevenue ? formatMetric(plant.yesterdayPlanRevenue) : "—" }} <i>MUSD</i></strong>
                    </span>
                  </span>
                </span>
              </span>

              <Icon name="lucide:chevron-right" size="15" class="combined-card-chevron" />
            </button>
          </div>
          </div>
        </section>
        </article>

        <article class="water-executive-card">
          <div class="water-executive-header">
            <div class="water-executive-title">
              <span class="water-title-icon"><Icon name="lucide:waves" size="19" /></span>
              <div>
                <h2>ປະລິມານນ້ຳເຂົ້າ-ນ້ຳອອກລວມ</h2>
              </div>
            </div>
            <span class="water-period-badge">{{ selectedPeriodLabel }}</span>
          </div>

          <div class="water-executive-grid">
            <section class="water-metric-block inflow" :class="inflowPerformance.tone">
              <div class="water-metric-heading">
                <span class="metric-icon inflow water-flow-icon"><Icon name="lucide:waves-arrow-down" size="20" /></span>
                <span>ປະລິມານນ້ຳເຂົ້າ</span>
                <strong class="water-performance">
                  <Icon :name="inflowPerformance.icon" size="15" />
                  {{ inflowPerformance.percentage }}
                </strong>
              </div>
              <div class="water-summary-panel inflow-panel">
                <div class="kpi-summary-values">
                  <div class="kpi-summary-stat actual">
                    <span>ຕົວຈິງ</span>
                    <strong>{{ formatMetric(apiTotalInflow) }} <small>MCM</small></strong>
                  </div>
                  <div class="kpi-summary-stat plan">
                    <span>ແຜນ</span>
                    <strong>{{ formatMetric(apiPlanInflow) }} <small>MCM</small></strong>
                  </div>
                </div>
                <div class="kpi-summary-progress"><span :style="{ width: `${inflowPerformance.bar}%` }" /></div>
                <div class="kpi-yesterday-row" :title="yesterdayDate">
                  <div class="kpi-yesterday-value actual">
                    <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                    <b>{{ hasYesterdayActualInflow ? formatMetric(yesterdayActualInflow) : "—" }}</b>
                    <small>MCM</small>
                  </div>
                  <div class="kpi-yesterday-value plan">
                    <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                    <b>{{ hasYesterdayPlanInflow ? formatMetric(yesterdayPlanInflow) : "—" }}</b>
                    <small>MCM</small>
                  </div>
                </div>
              </div>
            </section>

            <section class="water-metric-block outflow" :class="outflowPerformance.tone">
              <div class="water-metric-heading">
                <span class="metric-icon outflow water-flow-icon"><Icon name="lucide:waves-arrow-up" size="20" /></span>
                <span>ປະລິມານນ້ຳອອກ</span>
                <strong class="water-performance">
                  <Icon :name="outflowPerformance.icon" size="15" />
                  {{ outflowPerformance.percentage }}
                </strong>
              </div>
              <div class="water-summary-panel outflow-panel">
                <div class="kpi-summary-values">
                  <div class="kpi-summary-stat actual">
                    <span>ຕົວຈິງ</span>
                    <strong>{{ formatMetric(apiTotalOutflow) }} <small>MCM</small></strong>
                  </div>
                  <div class="kpi-summary-stat plan">
                    <span>ແຜນ</span>
                    <strong>{{ formatMetric(apiPlanOutflow) }} <small>MCM</small></strong>
                  </div>
                </div>
                <div class="kpi-summary-progress"><span :style="{ width: `${outflowPerformance.bar}%` }" /></div>
                <div class="kpi-yesterday-row" :title="yesterdayDate">
                  <div class="kpi-yesterday-value actual">
                    <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                    <b>{{ hasYesterdayActualOutflow ? formatMetric(yesterdayActualOutflow) : "—" }}</b>
                    <small>MCM</small>
                  </div>
                  <div class="kpi-yesterday-value plan">
                    <span><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
                    <b>{{ hasYesterdayPlanOutflow ? formatMetric(yesterdayPlanOutflow) : "—" }}</b>
                    <small>MCM</small>
                  </div>
                </div>
              </div>
            </section>

          </div>

          <section class="water-plants-section" :class="{ 'is-collapsed': !waterPlantsExpanded }">
            <div
              class="water-plants-header"
              role="button"
              tabindex="0"
              :aria-expanded="waterPlantsExpanded"
              aria-controls="water-plants-content"
              @click="waterPlantsExpanded = !waterPlantsExpanded"
              @keydown.enter.prevent="waterPlantsExpanded = !waterPlantsExpanded"
              @keydown.space.prevent="waterPlantsExpanded = !waterPlantsExpanded"
            >
              <div class="water-plants-title">
                <span class="water-details-icon"><Icon name="lucide:layers-3" size="16" /></span>
                <h3>ນ້ຳເຂົ້າ ແລະ ນ້ຳອອກແຕ່ລະເຂື່ອນ</h3>
              </div>
              <div class="water-plants-actions">
                <span v-if="waterPlantList.length" class="breakdown-count">{{ waterPlantList.length }} ເຂື່ອນ</span>
                <span class="portfolio-collapse-indicator" aria-hidden="true">
                  <Icon :name="waterPlantsExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="17" />
                </span>
              </div>
            </div>

            <div v-show="waterPlantsExpanded" id="water-plants-content" class="water-plants-body">
              <div v-if="loading && !waterPlantList.length" class="combined-plants-skeleton">
                <span v-for="i in 6" :key="i" />
              </div>
              <div v-else-if="!waterPlantList.length" class="breakdown-empty">
                <span>ບໍ່ມີຂໍ້ມູນນ້ຳແຕ່ລະເຂື່ອນ</span>
              </div>
              <div v-else class="water-plants-grid">
                <button
                  v-for="plant in waterPlantList"
                  :key="plant.code"
                  type="button"
                  class="combined-plant-card water-plant-card"
                  :style="{ '--plant-accent': plant.brand.accent }"
                  :title="`ເບິ່ງລາຍລະອຽດ ${plantDisplayName(plant)}`"
                  @click="openSite(plant.code)"
                >
                  <span class="combined-plant-identity">
                    <span class="combined-plant-logo" :class="{ 'has-logo': plant.brand.logo }">
                      <img v-if="plant.brand.logo" :src="plant.brand.logo" :alt="plantDisplayName(plant)" loading="lazy">
                      <span v-else>{{ plant.brand.mark }}</span>
                    </span>
                    <span class="combined-plant-name"><strong>{{ plantDisplayName(plant) }}</strong></span>
                  </span>

                  <span class="combined-card-metrics">
                    <span class="combined-metric water-inflow">
                      <span class="combined-metric-heading">
                        <span><Icon name="lucide:waves-arrow-down" size="14" /> ນ້ຳເຂົ້າ</span>
                        <span class="combined-performance" :class="plant.inflowPerf.tone">
                          <Icon :name="plant.inflowPerf.icon" size="11" />
                          {{ plant.inflowPerf.percentage }}
                        </span>
                      </span>
                      <span class="combined-metric-values">
                        <span><small>ຕົວຈິງ</small><strong>{{ formatMetric(plant.inflow) }} <i>MCM</i></strong></span>
                        <span><small>ແຜນ</small><strong>{{ formatMetric(plant.planInflow) }} <i>MCM</i></strong></span>
                      </span>
                      <span class="combined-progress"><i :class="plant.inflowPerf.tone" :style="{ width: `${Math.min(100, Math.max(3, plant.inflowPerf.bar))}%` }" /></span>
                      <span class="combined-yesterday-values" :title="yesterdayDate">
                        <span>
                          <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                          <strong>{{ plant.hasYesterdayInflow ? formatMetric(plant.yesterdayInflow) : "—" }} <i>MCM</i></strong>
                        </span>
                        <span>
                          <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                          <strong>{{ plant.hasYesterdayPlanInflow ? formatMetric(plant.yesterdayPlanInflow) : "—" }} <i>MCM</i></strong>
                        </span>
                      </span>
                    </span>

                    <span class="combined-metric water-outflow">
                      <span class="combined-metric-heading">
                        <span><Icon name="lucide:waves-arrow-up" size="14" /> ນ້ຳອອກ</span>
                        <span class="combined-performance" :class="plant.outflowPerf.tone">
                          <Icon :name="plant.outflowPerf.icon" size="11" />
                          {{ plant.outflowPerf.percentage }}
                        </span>
                      </span>
                      <span class="combined-metric-values">
                        <span><small>ຕົວຈິງ</small><strong>{{ formatMetric(plant.outflow) }} <i>MCM</i></strong></span>
                        <span><small>ແຜນ</small><strong>{{ formatMetric(plant.planOutflow) }} <i>MCM</i></strong></span>
                      </span>
                      <span class="combined-progress"><i :class="plant.outflowPerf.tone" :style="{ width: `${Math.min(100, Math.max(3, plant.outflowPerf.bar))}%` }" /></span>
                      <span class="combined-yesterday-values" :title="yesterdayDate">
                        <span>
                          <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                          <strong>{{ plant.hasYesterdayOutflow ? formatMetric(plant.yesterdayOutflow) : "—" }} <i>MCM</i></strong>
                        </span>
                        <span>
                          <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                          <strong>{{ plant.hasYesterdayPlanOutflow ? formatMetric(plant.yesterdayPlanOutflow) : "—" }} <i>MCM</i></strong>
                        </span>
                      </span>
                    </span>
                  </span>

                  <Icon name="lucide:chevron-right" size="15" class="combined-card-chevron" />
                </button>
              </div>
            </div>
          </section>
        </article>

        <article class="water-volume-executive-card">
          <div class="water-executive-header">
            <div class="water-executive-title">
              <span class="water-title-icon volume"><Icon name="mdi:waves-arrow-up" size="19" /></span>
              <div>
                <h2>ບໍລິມາດນ້ຳລວມ</h2>
              </div>
            </div>
            <span class="water-period-badge">{{ selectedPeriodLabel }}</span>
          </div>

          <div class="water-volume-overview">
            <div class="water-total-value">
              <span>ລວມທັງໝົດ</span>
              <strong>{{ formatMetric(totalWaterVolume) }} <small>MCM</small></strong>
            </div>
            <div class="water-volume-breakdown">
              <span>
                <small>ເຂື່ອນຫຼັກ</small>
                <strong>{{ formatMetric(mainWaterVolume) }} <i>MCM</i></strong>
              </span>
              <span>
                <small>ອ່າງອ່ວາຍນ້ຳ</small>
                <strong>{{ formatMetric(diversionWaterVolume) }} <i>MCM</i></strong>
              </span>
            </div>
            <div class="water-volume-track">
              <span class="main" :style="{ width: `${mainVolumeShare}%` }" />
              <span class="diversion" :style="{ width: `${diversionVolumeShare}%` }" />
            </div>
            <div class="water-volume-plan-groups">
              <section class="water-volume-plan-group stored-plan">
                <div class="water-volume-plan-heading">
                  <span><Icon name="lucide:calendar-range" size="14" /></span>
                  <div>
                    <strong>ແຜນບໍລິມາດນ້ຳປະຈຳປີ</strong>
                    <small>ບໍລິມາດນ້ຳທີ່ວາງແຜນໄວ້</small>
                  </div>
                </div>
                <div class="water-volume-plan-values">
                  <span title="YEAR_TOTAL_PLAN_VOLUME — ແຜນບໍລິມາດນ້ຳທັງໝົດ">
                    <small>ລວມທັງໝົດ</small>
                    <strong>{{ formatMetric(yearTotalPlanVolume) }} <i>MCM</i></strong>
                  </span>
                  <span title="YEAR_PLAN_MAIN_VOLUME — ແຜນບໍລິມາດນ້ຳຂອງເຂື່ອນຫຼັກທັງໝົດ">
                    <small>ເຂື່ອນຫຼັກ</small>
                    <strong>{{ formatMetric(yearPlanMainVolume) }} <i>MCM</i></strong>
                  </span>
                  <span title="YEAR_PLAN_DIVERSION_VOLUME — ແຜນບໍລິມາດນ້ຳຂອງເຂື່ອນອວ່າຍທັງໝົດ">
                    <small>ເຂື່ອນອວ່າຍນ້ຳ</small>
                    <strong>{{ formatMetric(yearPlanDiversionVolume) }} <i>MCM</i></strong>
                  </span>
                </div>
              </section>

              <section class="water-volume-plan-group usable-plan">
                <div class="water-volume-plan-heading">
                  <span><Icon name="lucide:droplets" size="14" /></span>
                  <div>
                    <strong>ແຜນບໍລິມາດນ້ຳທີ່ໃຊ້ໄດ້</strong>
                    <small>ບໍລິມາດນ້ຳພ້ອມນຳໃຊ້</small>
                  </div>
                </div>
                <div class="water-volume-plan-values">
                  <span title="YEAR_TOTAL_PLAN_VOLUMN_USABLE — ແຜນບໍລິມາດນ້ຳທັງໝົດທີ່ໃຊ້ໄດ້">
                    <small>ລວມທີ່ໃຊ້ໄດ້</small>
                    <strong>{{ formatMetric(yearTotalPlanUsableVolume) }} <i>MCM</i></strong>
                  </span>
                  <span title="YEAR_PLAN_MAIN_USABLE_VOLUME — ແຜນບໍລິມາດນ້ຳຂອງເຂື່ອນຫຼັກທັງໝົດທີ່ໃຊ້ໄດ້">
                    <small>ເຂື່ອນຫຼັກ</small>
                    <strong>{{ formatMetric(yearPlanMainUsableVolume) }} <i>MCM</i></strong>
                  </span>
                  <span title="YEAR_PLAN_DIVERSION_USABLE_VOLUME — ແຜນບໍລິມາດນ້ຳຂອງເຂື່ອນອວ່າຍທັງໝົດທີ່ໃຊ້ໄດ້">
                    <small>ເຂື່ອນອວ່າຍນ້ຳ</small>
                    <strong>{{ formatMetric(yearPlanDiversionUsableVolume) }} <i>MCM</i></strong>
                  </span>
                </div>
              </section>
            </div>
            <div class="water-volume-yesterday" :title="yesterdayDate">
              <span class="water-volume-yesterday-label"><Icon name="lucide:history" size="11" /> ມື້ວານ</span>
              <span>
                <small>ລວມ</small>
                <b>{{ hasYesterdayTotalVolume ? formatMetric(yesterdayTotalWaterVolume) : "—" }}</b>
                <i>MCM</i>
              </span>
              <span>
                <small>ເຂື່ອນຫຼັກ</small>
                <b>{{ hasYesterdayMainVolume ? formatMetric(yesterdayMainWaterVolume) : "—" }}</b>
                <i>MCM</i>
              </span>
              <span>
                <small>ອ່າງອ່ວາຍນ້ຳ</small>
                <b>{{ hasYesterdayDiversionVolume ? formatMetric(yesterdayDiversionWaterVolume) : "—" }}</b>
                <i>MCM</i>
              </span>
            </div>
          </div>

          <section class="water-plants-section volume-details" :class="{ 'is-collapsed': !waterVolumePlantsExpanded }">
            <div
              class="water-plants-header"
              role="button"
              tabindex="0"
              :aria-expanded="waterVolumePlantsExpanded"
              aria-controls="water-volume-plants-content"
              @click="waterVolumePlantsExpanded = !waterVolumePlantsExpanded"
              @keydown.enter.prevent="waterVolumePlantsExpanded = !waterVolumePlantsExpanded"
              @keydown.space.prevent="waterVolumePlantsExpanded = !waterVolumePlantsExpanded"
            >
              <div class="water-plants-title">
                <span class="water-details-icon"><Icon name="lucide:layers-3" size="16" /></span>
                <h3>ບໍລິມາດນ້ຳແຕ່ລະເຂື່ອນ</h3>
              </div>
              <div class="water-plants-actions">
                <span v-if="waterVolumePlantList.length" class="breakdown-count">{{ waterVolumePlantList.length }} ເຂື່ອນ</span>
                <span class="portfolio-collapse-indicator" aria-hidden="true">
                  <Icon :name="waterVolumePlantsExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="17" />
                </span>
              </div>
            </div>

            <div v-show="waterVolumePlantsExpanded" id="water-volume-plants-content" class="water-plants-body">
              <div v-if="loading && !waterVolumePlantList.length" class="combined-plants-skeleton">
                <span v-for="i in 6" :key="i" />
              </div>
              <div v-else-if="!waterVolumePlantList.length" class="breakdown-empty">
                <span>ບໍ່ມີຂໍ້ມູນບໍລິມາດນ້ຳແຕ່ລະເຂື່ອນ</span>
              </div>
              <div v-else class="water-plants-grid">
                <button
                  v-for="plant in waterVolumePlantList"
                  :key="plant.code"
                  type="button"
                  class="combined-plant-card water-volume-plant-card"
                  :class="{ 'has-diversion': plant.diversionVolume > 0 }"
                  :style="{ '--plant-accent': plant.brand.accent }"
                  :title="`ເບິ່ງລາຍລະອຽດ ${plantDisplayName(plant)}`"
                  @click="openSite(plant.code)"
                >
                  <span class="combined-plant-identity">
                    <span class="combined-plant-logo" :class="{ 'has-logo': plant.brand.logo }">
                      <img v-if="plant.brand.logo" :src="plant.brand.logo" :alt="plantDisplayName(plant)" loading="lazy">
                      <span v-else>{{ plant.brand.mark }}</span>
                    </span>
                    <span class="combined-plant-name"><strong>{{ plantDisplayName(plant) }}</strong></span>
                    <span class="volume-plant-total">
                      <small>ລວມ</small>
                      <strong>{{ formatMetric(plant.totalVolume) }} <i>MCM</i></strong>
                      <small class="volume-plant-yesterday" :title="yesterdayDate">
                        <Icon name="lucide:history" size="8" /> ມື້ວານ
                        <b>{{ plant.hasYesterdayTotalVolume ? formatMetric(plant.yesterdayTotalVolume) : "—" }}</b>
                        <i>MCM</i>
                      </small>
                    </span>
                  </span>

                  <span class="combined-card-metrics">
                    <span class="combined-metric water-main-volume">
                      <span class="combined-metric-heading">
                        <span><Icon name="lucide:landmark" size="13" /> ເຂື່ອນຫຼັກ</span>
                        <span class="combined-performance water-tone">{{ plant.mainShare.toFixed(1) }}%</span>
                      </span>
                      <span class="combined-metric-values single">
                        <span><small>ບໍລິມາດ</small><strong>{{ formatMetric(plant.mainVolume) }} <i>MCM</i></strong></span>
                      </span>
                      <span class="combined-progress"><i class="water-main" :style="{ width: `${plant.mainShare}%` }" /></span>
                      <span class="combined-yesterday-values single" :title="yesterdayDate">
                        <span>
                          <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                          <strong>{{ plant.hasYesterdayMainVolume ? formatMetric(plant.yesterdayMainVolume) : "—" }} <i>MCM</i></strong>
                        </span>
                      </span>
                    </span>

                    <span v-if="plant.diversionVolume > 0" class="combined-metric water-diversion-volume">
                      <span class="combined-metric-heading">
                        <span><Icon name="lucide:waves" size="13" /> ອ່າງອ່ວາຍນ້ຳ</span>
                        <span class="combined-performance water-tone">{{ plant.diversionShare.toFixed(1) }}%</span>
                      </span>
                      <span class="combined-metric-values single">
                        <span><small>ບໍລິມາດ</small><strong>{{ formatMetric(plant.diversionVolume) }} <i>MCM</i></strong></span>
                      </span>
                      <span class="combined-progress"><i class="water-diversion" :style="{ width: `${plant.diversionShare}%` }" /></span>
                      <span class="combined-yesterday-values single" :title="yesterdayDate">
                        <span>
                          <small><Icon name="lucide:history" size="9" /> ມື້ວານ</small>
                          <strong>{{ plant.hasYesterdayDiversionVolume ? formatMetric(plant.yesterdayDiversionVolume) : "—" }} <i>MCM</i></strong>
                        </span>
                      </span>
                    </span>
                  </span>

                  <Icon name="lucide:chevron-right" size="15" class="combined-card-chevron" />
                </button>
              </div>
            </div>
          </section>
        </article>
      </section>

      <section v-else class="dashboard-grid details-only-grid">
        <article class="dashboard-card comparison-card">
          <div class="section-heading">
            <div>
              <h2>ຂໍ້ມູນລາຍລະອຽດ</h2>
            </div>
            <span class="site-count">{{ comparisonData.length }} ເຂື່ອນ</span>
          </div>

          <div v-if="loading" class="comparison-skeleton">
            <span v-for="item in 4" :key="item" />
          </div>
          <div v-else-if="comparisonData.length === 0" class="chart-state compact">
            <Icon name="lucide:database-zap" size="30" />
            <span>ບໍ່ມີຂໍ້ມູນປຽບທຽບ</span>
          </div>
          <div v-else class="site-list">
            <button
              v-for="(site, index) in comparisonData"
              :key="site.code"
              type="button"
              class="plant-performance-card"
              @click="openSite(site.code)"
            >
              <span class="plant-card-topline">
                <span
                  class="plant-logo-placeholder"
                  :class="{ 'has-logo': getPlantBrand(site.code).logo }"
                  :style="{ '--plant-accent': getPlantBrand(site.code).accent }"
                  :aria-label="`${site.shortName || site.code} plant logo`"
                >
                  <img
                    v-if="getPlantBrand(site.code).logo"
                    class="plant-logo-image"
                    :src="getPlantBrand(site.code).logo"
                    :alt="`${site.shortName || site.code} logo`"
                    loading="lazy"
                    decoding="async"
                  >
                  <span v-else class="plant-logo-mark">{{ getPlantBrand(site.code).mark }}</span>
                </span>
                <span class="plant-card-identity">
                  <small>PLANT {{ String(index + 1).padStart(2, '0') }}</small>
                  <strong>{{ site.shortName || site.code }}</strong>
                </span>
                <span class="plant-card-output">
                  <strong>{{ formatMetric(site.energy) }}</strong>
                  <small>GWh</small>
                </span>
              </span>

              <span class="capacity-track">
                <i class="capacity-fill" :style="{ width: `${site.share}%` }" />
                <i class="capacity-marker" :style="{ left: `${Math.min(98, Math.max(2, site.share))}%` }" />
              </span>

              <span class="plant-card-footer">
                <span class="plant-card-footer-label">ຂອງພະລັງງານລວມ</span>
                <Icon class="plant-card-footer-icon" name="lucide:chevron-right" size="15" />
                <strong>{{ site.share.toFixed(1) }}%</strong>
              </span>
            </button>
          </div>
        </article>

      </section>

      <v-dialog
        v-model="comparisonChartOpen"
        max-width="940"
        @after-enter="comparisonChartReady = true"
        @after-leave="comparisonChartReady = false"
      >
        <v-card class="plant-comparison-dialog" rounded="xl">
          <div class="comparison-dialog-header">
            <div class="comparison-dialog-title">
              <span class="comparison-dialog-icon" :class="comparisonChartMetric">
                <Icon name="lucide:chart-no-axes-column-increasing" size="20" />
              </span>
              <div>
                <h2>{{ comparisonChartConfig.title }}</h2>
              </div>
            </div>

            <button class="comparison-dialog-close" type="button" aria-label="ປິດ" @click="comparisonChartOpen = false">
              <Icon name="lucide:x" size="19" />
            </button>
          </div>

          <div class="comparison-dialog-toolbar">
            <div class="comparison-metric-tabs" aria-label="ເລືອກຂໍ້ມູນປຽບທຽບ">
              <button
                type="button"
                :class="{ active: comparisonChartMetric === 'energy' }"
                @click="comparisonChartMetric = 'energy'"
              >
                <Icon name="mdi:lightning-bolt" size="15" />
                ພະລັງງານ
              </button>
              <button
                type="button"
                :class="{ active: comparisonChartMetric === 'revenue' }"
                @click="comparisonChartMetric = 'revenue'"
              >
                <Icon name="lucide:dollar-sign" size="15" />
                ລາຍຮັບ
              </button>
            </div>
            <span class="comparison-dialog-period">
              <Icon name="lucide:calendar-range" size="14" />
              {{ rangeLabel }}
            </span>
          </div>

          <div class="comparison-chart-shell">
            <div v-if="!comparisonChartReady" class="comparison-chart-loading">
              <span class="loader" />
              <span>ກຳລັງສ້າງກຣາຟ...</span>
            </div>
            <BarChart
              v-else-if="comparisonChartConfig.labels.length"
              :key="`plant-comparison-${comparisonChartMetric}-${rangeLabel}`"
              :labels="comparisonChartConfig.labels"
              :series="comparisonChartConfig.series"
              :unit="comparisonChartConfig.unit"
              :x-axis-sub-labels="comparisonChartConfig.badges"
              height="100%"
              dark
              show-all-x-axis-labels
            />
            <div v-else class="comparison-chart-empty">
              <Icon name="lucide:chart-no-axes-column" size="30" />
              <span>ບໍ່ມີຂໍ້ມູນປຽບທຽບ</span>
            </div>
          </div>
        </v-card>
      </v-dialog>
    </main>
  </v-container>
</template>

<script setup>
import axios from "axios";
import { getPlantBrand, getPlantShortName } from "~~/app/utils/plantNames";

const BarChart = defineAsyncComponent(() => import("~~/components/common/BarChart.vue"));

definePageMeta({
  middleware: "auth",
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const now = new Date();
const today = toIsoDate(now);
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const yesterdayDate = toIsoDate(yesterday);
const currentYear = now.getFullYear();

const loading = ref(false);
const refreshing = ref(false);
const errorMessage = ref("");
const filterOpen = ref(false);
const comparisonChartOpen = ref(false);
const comparisonChartReady = ref(false);
const comparisonChartMetric = ref("energy");
const plantListView = ref(false);
const plantsExpanded = ref(false);
const waterPlantsExpanded = ref(false);
const waterVolumePlantsExpanded = ref(false);
const selectedPeriod = ref("Y");
const selectedDate = ref(today);
const selectedMonth = ref(today.slice(0, 7));
const selectedQuarter = ref(Math.floor(now.getMonth() / 3) + 1);
const selectedYear = ref(currentYear);
const appliedRange = ref({ start: `${currentYear}-01-01`, end: `${currentYear}-12-31` });
const summaryData = ref([]);
const siteData = ref([]);
const periodData = ref([]);
const volumeData = ref([]);
const yesterdayData = ref([]);
const yesterdaySummaryData = ref([]);
const dashboardCacheTtl = 10 * 60 * 1000;
let activeRequestController;
let requestSequence = 0;

const periodOptions = [
  { title: "ວັນ", value: "D" },
  { title: "ອາທິດ", value: "W" },
  { title: "ເດືອນ", value: "M" },
  { title: "ໄຕມາດ", value: "Q" },
  { title: "ປີ", value: "Y" },
];
const quarterOptions = [1, 2, 3, 4];
const showPlantDetails = computed(() => route.query.view === "plants");
const selectedPeriodLabel = computed(() => (
  periodOptions.find(period => period.value === selectedPeriod.value)?.title || "-"
));

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = parseLocalDate(value);
  return Number.isFinite(parsed.getTime()) && toIsoDate(parsed) === value;
}

function isValidYear(value) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

function toNumber(value) {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const requestedRange = computed(() => {
  if (selectedPeriod.value === "D") {
    if (!isValidIsoDate(selectedDate.value)) return { start: "", end: "" };
    return { start: selectedDate.value, end: selectedDate.value };
  }

  if (selectedPeriod.value === "W") {
    if (!isValidIsoDate(selectedDate.value)) return { start: "", end: "" };
    const date = parseLocalDate(selectedDate.value);
    const weekday = date.getDay() || 7;
    const start = new Date(date);
    start.setDate(date.getDate() - weekday + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }

  if (selectedPeriod.value === "M") {
    if (!/^\d{4}-\d{2}$/.test(String(selectedMonth.value || ""))) return { start: "", end: "" };
    const [year, month] = selectedMonth.value.split("-").map(Number);
    if (!isValidYear(year) || month < 1 || month > 12) return { start: "", end: "" };
    return {
      start: `${year}-${pad(month)}-01`,
      end: toIsoDate(new Date(year, month, 0)),
    };
  }

  if (selectedPeriod.value === "Q") {
    if (!isValidYear(selectedYear.value) || ![1, 2, 3, 4].includes(Number(selectedQuarter.value))) {
      return { start: "", end: "" };
    }
    const startMonth = (Number(selectedQuarter.value) - 1) * 3;
    return {
      start: toIsoDate(new Date(Number(selectedYear.value), startMonth, 1)),
      end: toIsoDate(new Date(Number(selectedYear.value), startMonth + 3, 0)),
    };
  }

  if (!isValidYear(selectedYear.value)) return { start: "", end: "" };
  return {
    start: `${selectedYear.value}-01-01`,
    end: `${selectedYear.value}-12-31`,
  };
});

const rangeLabel = computed(() => {
  const { start, end } = appliedRange.value;
  return start === end ? start : `${start} — ${end}`;
});

const allSummary = computed(() => summaryData.value.find(item => item.D_DAM === "ALL" || item.IS_TOTAL === 1 || item.IS_TOTAL === "1" || String(item.D_DAM || '').toUpperCase() === "ALL") || {});

function summaryMetric(kind) {
  const item = allSummary.value;
  const prefix = { Y: "YEAR", M: "MONTH", W: "WEEK", D: "DAY" }[selectedPeriod.value];
  if (prefix) return toNumber(item[`${prefix}_${kind}`]);
  return 0;
}

const totalEnergy = computed(() => {
  const total = siteData.value.reduce((sum, item) => sum + item.energy, 0);
  return total || summaryMetric("ACTUAL_ENERGY");
});
const totalRevenue = computed(() => {
  const total = siteData.value.reduce((sum, item) => sum + item.revenue, 0);
  return total || summaryMetric("ACTUAL_REVENUE");
});
const totalPlanEnergy = computed(() => {
  const total = siteData.value.reduce((sum, item) => sum + item.planEnergy, 0);
  return total || summaryMetric("PLAN_ENERGY");
});
const totalPlanRevenue = computed(() => {
  const total = siteData.value.reduce((sum, item) => sum + item.planRevenue, 0);
  return total || summaryMetric("PLAN_REVENUE");
});

const yesterdayFields = {
  actualEnergy: ["D_ACTUAL_ENERGY", "SUM_ACTUAL_ENERGY", "ACTUAL_ENERGY"],
  planEnergy: ["D_PLAN_ENERGY", "SUM_PLAN_ENERGY", "PLAN_ENERGY"],
  actualRevenue: ["D_ACTUAL_REVENUE", "SUM_ACTUAL_REVENUE", "ACTUAL_REVENUE"],
  planRevenue: ["D_PLAN_REVENUE", "SUM_PLAN_REVENUE", "PLAN_REVENUE"],
  actualInflow: ["D_ACTUAL_INFLOW", "SUM_INFLOW_ACTUAL", "ACTUAL_INFLOW", "INFLOW_ACTUAL"],
  planInflow: ["D_INFLOW_PLAN", "SUM_INFLOW_PLAN", "INFLOW_PLAN"],
  actualOutflow: ["D_TOTAL_OUTFLOW", "SUM_OUTFLOW", "TOTAL_OUTFLOW"],
  planOutflow: [
    "D_PLAN_OUTFLOW",
    "SUM_PLAN_OUTFLOW",
    "SUM_OUTFLOW_PLAN",
    "PLAN_OUTFLOW",
    "OUTFLOW_PLAN",
    "D_PLAN_TURBINE",
    "PLAN_TURBINE",
    "SUM_PLAN_TURBINE",
    "SUM_TURBINE_PLAN",
    "D_TURBINE_PLAN",
    "TURBINE_PLAN",
  ],
  mainVolume: ["D_MAIN_VOLUME", "MAIN_VOLUME"],
  diversionVolume: ["D_DIVERSION_VOLUME", "DIVERSION_VOLUME"],
  totalVolume: ["D_TOTAL_VOLUME", "TOTAL_VOLUME"],
};
const yesterdayPlanOutflowSummaryFields = [
  "DAY_PLAN_OUTFLOW",
  "DAY_OUTFLOW_PLAN",
  "D_PLAN_OUTFLOW",
  "SUM_PLAN_OUTFLOW",
  "SUM_OUTFLOW_PLAN",
  "PLAN_OUTFLOW",
  "OUTFLOW_PLAN",
  "DAY_PLAN_TURBINE",
  "DAY_TURBINE_PLAN",
  "D_PLAN_TURBINE",
  "PLAN_TURBINE",
  "SUM_PLAN_TURBINE",
  "SUM_TURBINE_PLAN",
];

function dataRowCode(row) {
  return String(row.D_DAM || row.BR_CODE || row.DAM_CODE || row.dam_code || "").trim().toUpperCase();
}

function yesterdayRows(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (normalizedCode) return yesterdayData.value.filter(row => dataRowCode(row) === normalizedCode);

  const plantRows = yesterdayData.value.filter((row) => {
    const rowCode = dataRowCode(row);
    return rowCode && rowCode !== "ALL";
  });
  return plantRows.length ? plantRows : yesterdayData.value;
}

function hasYesterdayMetric(code, ...fields) {
  return yesterdayRows(code).some(row => fields.some(
    field => row[field] !== undefined && row[field] !== null && row[field] !== "",
  ));
}

function yesterdayPlantMetric(code, ...fields) {
  return yesterdayRows(code).reduce((sum, row) => {
    const field = fields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
    return sum + (field ? toNumber(row[field]) : 0);
  }, 0);
}

function yesterdayMetric(...fields) {
  const rows = yesterdayRows();

  return rows.reduce((sum, row) => {
    const field = fields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
    return sum + (field ? toNumber(row[field]) : 0);
  }, 0);
}

function yesterdaySummaryRows(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (normalizedCode) {
    return yesterdaySummaryData.value.filter(row => dataRowCode(row) === normalizedCode);
  }

  const aggregateRows = yesterdaySummaryData.value.filter((row) => {
    const rowCode = dataRowCode(row);
    return rowCode === "ALL" || row.IS_TOTAL === 1 || row.IS_TOTAL === "1";
  });
  if (aggregateRows.length) return aggregateRows;

  return yesterdaySummaryData.value.filter((row) => {
    const rowCode = dataRowCode(row);
    return rowCode && rowCode !== "ALL";
  });
}

function hasYesterdaySummaryMetric(code, ...fields) {
  return yesterdaySummaryRows(code).some(row => fields.some(
    field => row[field] !== undefined && row[field] !== null && row[field] !== "",
  ));
}

function yesterdaySummaryMetric(code, ...fields) {
  return yesterdaySummaryRows(code).reduce((sum, row) => {
    const field = fields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
    return sum + (field ? toNumber(row[field]) : 0);
  }, 0);
}

const hasYesterdayData = computed(() => hasYesterdayMetric(null,
  ...yesterdayFields.actualEnergy,
  ...yesterdayFields.planEnergy,
  ...yesterdayFields.actualRevenue,
  ...yesterdayFields.planRevenue,
));
const yesterdayActualEnergy = computed(() => yesterdayMetric(...yesterdayFields.actualEnergy));
const yesterdayPlanEnergy = computed(() => yesterdayMetric(...yesterdayFields.planEnergy));
const yesterdayActualRevenue = computed(() => yesterdayMetric(...yesterdayFields.actualRevenue));
const yesterdayPlanRevenue = computed(() => yesterdayMetric(...yesterdayFields.planRevenue));
const hasYesterdayActualInflow = computed(() => hasYesterdayMetric(null, ...yesterdayFields.actualInflow));
const hasYesterdayPlanInflow = computed(() => hasYesterdayMetric(null, ...yesterdayFields.planInflow));
const hasYesterdayActualOutflow = computed(() => hasYesterdayMetric(null, ...yesterdayFields.actualOutflow));
const hasYesterdayPlanOutflow = computed(() => (
  hasYesterdayMetric(null, ...yesterdayFields.planOutflow)
  || hasYesterdaySummaryMetric(null, ...yesterdayPlanOutflowSummaryFields)
));
const hasYesterdayMainVolume = computed(() => hasYesterdayMetric(null, ...yesterdayFields.mainVolume));
const hasYesterdayDiversionVolume = computed(() => hasYesterdayMetric(null, ...yesterdayFields.diversionVolume));
const hasYesterdayTotalVolume = computed(() => hasYesterdayMetric(null, ...yesterdayFields.totalVolume)
  || hasYesterdayMainVolume.value
  || hasYesterdayDiversionVolume.value);
const yesterdayActualInflow = computed(() => yesterdayMetric(...yesterdayFields.actualInflow));
const yesterdayPlanInflow = computed(() => yesterdayMetric(...yesterdayFields.planInflow));
const yesterdayActualOutflow = computed(() => yesterdayMetric(...yesterdayFields.actualOutflow));
const yesterdayPlanOutflow = computed(() => (
  hasYesterdayMetric(null, ...yesterdayFields.planOutflow)
    ? yesterdayMetric(...yesterdayFields.planOutflow)
    : yesterdaySummaryMetric(null, ...yesterdayPlanOutflowSummaryFields)
));
const yesterdayMainWaterVolume = computed(() => yesterdayMetric(...yesterdayFields.mainVolume));
const yesterdayDiversionWaterVolume = computed(() => yesterdayMetric(...yesterdayFields.diversionVolume));
const yesterdayTotalWaterVolume = computed(() => {
  const total = yesterdayMetric(...yesterdayFields.totalVolume);
  return total || yesterdayMainWaterVolume.value + yesterdayDiversionWaterVolume.value;
});

function sumPeriodMetric(...fields) {
  const aggregateRows = periodData.value.filter(row => row.D_DAM === "ALL" || row.DAM_CODE === "ALL");
  const rows = aggregateRows.length ? aggregateRows : periodData.value;

  return rows.reduce((sum, row) => {
    const field = fields.find(name => row[name] !== undefined && row[name] !== null);
    return sum + (field ? toNumber(row[field]) : 0);
  }, 0);
}

const waterPeriodPrefix = computed(() => ({
  Y: "YEAR",
  M: "MONTH",
  W: "WEEK",
  D: "DAY",
}[selectedPeriod.value] || ""));

const totalInflow = computed(() => sumPeriodMetric("SUM_INFLOW_ACTUAL", "D_ACTUAL_INFLOW", "INFLOW_ACTUAL"));
const totalPlanInflow = computed(() => sumPeriodMetric("SUM_INFLOW_PLAN", "D_INFLOW_PLAN", "INFLOW_PLAN"));
const totalOutflow = computed(() => sumPeriodMetric("SUM_OUTFLOW", "D_TOTAL_OUTFLOW", "TOTAL_OUTFLOW"));
const totalPlanOutflow = computed(() => {
  const sum = sumPeriodMetric(
    "SUM_PLAN_OUTFLOW",
    "SUM_OUTFLOW_PLAN",
    "D_PLAN_OUTFLOW",
    "PLAN_OUTFLOW",
    "OUTFLOW_PLAN",
    "SUM_PLAN_TURBINE",
    "SUM_TURBINE_PLAN",
    "D_PLAN_TURBINE",
    "PLAN_TURBINE",
  );
  if (sum > 0) return sum;
  const prefix = waterPeriodPrefix.value;
  if (prefix && summaryData.value.length) {
    const damSum = summaryData.value.reduce((acc, row) => {
      if (row.D_DAM === "ALL" || row.IS_TOTAL === 1 || String(row.D_DAM || '').toUpperCase() === "ALL") return acc;
      return acc + toNumber(
        row[`${prefix}_PLAN_OUTFLOW`]
        ?? row[`${prefix}_OUTFLOW_PLAN`]
        ?? row[`${prefix}_PLAN_TURBINE`]
        ?? row[`${prefix}_TURBINE_PLAN`]
      );
    }, 0);
    if (damSum > 0) return damSum;
  }
  return 0;
});

function sumWaterRows(...fields) {
  return volumeData.value.reduce((sum, row) => {
    if (row.D_DAM === "ALL" || row.DAM_CODE === "ALL") return sum;
    const field = fields.find(name => row[name] !== undefined && row[name] !== null);
    return sum + (field ? toNumber(row[field]) : 0);
  }, 0);
}

function waterSummaryMetric(kind, fallback) {
  const prefix = waterPeriodPrefix.value;
  let value;
  if (prefix && allSummary.value) {
    value = allSummary.value[`${prefix}_${kind}`];
    if (value === undefined || value === null || value === "") {
      if (kind === "PLAN_OUTFLOW") {
        value = allSummary.value[`${prefix}_OUTFLOW_PLAN`] ?? allSummary.value.YEAR_PLAN_OUTFLOW;
      } else if (kind === "OUTFLOW_PLAN") {
        value = allSummary.value[`${prefix}_PLAN_OUTFLOW`] ?? allSummary.value.YEAR_PLAN_OUTFLOW;
      }
    }
  }
  if (value !== undefined && value !== null && value !== "") return toNumber(value);
  return typeof fallback === "function" ? toNumber(fallback()) : toNumber(fallback);
}

const mainWaterVolume = computed(() => waterSummaryMetric(
  "MAIN_VOLUME",
  () => sumWaterRows("D_MAIN_VOLUME", "MAIN_VOLUME"),
));
const diversionWaterVolume = computed(() => waterSummaryMetric(
  "DIVERSION_VOLUME",
  () => sumWaterRows("D_DIVERSION_VOLUME", "DIVERSION_VOLUME"),
));
const totalWaterVolume = computed(() => waterSummaryMetric(
  "TOTAL_VOLUME",
  () => sumWaterRows("D_TOTAL_VOLUME", "TOTAL_VOLUME") || mainWaterVolume.value + diversionWaterVolume.value,
));

function annualPlanVolumeMetric(fields, fallback = 0) {
  const sourceFields = Array.isArray(fields) ? fields : [fields];
  const totalRow = allSummary.value;
  const totalField = sourceFields.find(field => (
    totalRow[field] !== undefined && totalRow[field] !== null && totalRow[field] !== ""
  ));
  if (totalField) return toNumber(totalRow[totalField]);

  const plantValues = summaryData.value
    .filter(row => row.D_DAM !== "ALL" && row.IS_TOTAL !== 1 && row.IS_TOTAL !== "1")
    .map((row) => {
      const field = sourceFields.find(name => row[name] !== undefined && row[name] !== null && row[name] !== "");
      return field ? toNumber(row[field]) : null;
    })
    .filter(value => value !== null);

  if (plantValues.length) return plantValues.reduce((sum, value) => sum + value, 0);
  return typeof fallback === "function" ? toNumber(fallback()) : toNumber(fallback);
}

const yearPlanMainVolume = computed(() => annualPlanVolumeMetric([
  "YEAR_PLAN_MAIN_VOLUME",
  "YEAR_MAIN_PLAN_VOLUME",
]));
const yearPlanDiversionVolume = computed(() => annualPlanVolumeMetric([
  "YEAR_PLAN_DIVERSION_VOLUME",
  "YEAR_DIVERSION_PLAN_VOLUME",
]));
const yearTotalPlanVolume = computed(() => annualPlanVolumeMetric([
  "YEAR_TOTAL_PLAN_VOLUME",
  "YEAR_PLAN_TOTAL_VOLUME",
], () => yearPlanMainVolume.value + yearPlanDiversionVolume.value));
const yearPlanMainUsableVolume = computed(() => annualPlanVolumeMetric([
  "YEAR_PLAN_MAIN_USABLE_VOLUME",
  "YEAR_MAIN_PLAN_USABLE_VOLUME",
]));
const yearPlanDiversionUsableVolume = computed(() => annualPlanVolumeMetric([
  "YEAR_PLAN_DIVERSION_USABLE_VOLUME",
  "YEAR_DIVERSION_PLAN_USABLE_VOLUME",
]));
const yearTotalPlanUsableVolume = computed(() => annualPlanVolumeMetric([
  "YEAR_TOTAL_PLAN_VOLUMN_USABLE",
  "YEAR_TOTAL_PLAN_VOLUME_USABLE",
  "YEAR_PLAN_TOTAL_USABLE_VOLUME",
  "YEAR_TOTAL_PLAN_USABLE_VOLUME",
], () => yearPlanMainUsableVolume.value + yearPlanDiversionUsableVolume.value));

const mainVolumeShare = computed(() => (
  totalWaterVolume.value > 0 ? Math.min(100, (mainWaterVolume.value / totalWaterVolume.value) * 100) : 0
));
const diversionVolumeShare = computed(() => (
  totalWaterVolume.value > 0 ? Math.min(100 - mainVolumeShare.value, (diversionWaterVolume.value / totalWaterVolume.value) * 100) : 0
));

const apiTotalInflow = computed(() => waterSummaryMetric("ACTUAL_INFLOW", () => totalInflow.value));
const apiPlanInflow = computed(() => waterSummaryMetric("INFLOW_PLAN", () => totalPlanInflow.value));
const apiTotalOutflow = computed(() => waterSummaryMetric("TOTAL_OUTFLOW", () => totalOutflow.value));
const apiPlanOutflow = computed(() => waterSummaryMetric("PLAN_OUTFLOW", () => totalPlanOutflow.value));

const waterPlantList = computed(() => {
  const totals = new Map();

  periodData.value.forEach((row) => {
    const code = row.D_DAM || row.DAM_CODE || row.BR_CODE || row.dam_code;
    if (!code || code === "ALL") return;

    const summaryRow = summaryData.value.find(item => item.D_DAM === code);
    const current = totals.get(code) || {
      code,
      label: row.branch?.BR_NAME || row.BR_NAME || summaryRow?.branch?.BR_NAME || summaryRow?.BR_NAME || code,
      shortName: getPlantShortName(code, row.branch?.BR_NAME_EN || row.BR_NAME_EN || summaryRow?.BR_NAME_EN),
      inflow: 0,
      planInflow: 0,
      outflow: 0,
      planOutflow: 0,
    };
    current.inflow += toNumber(row.SUM_INFLOW_ACTUAL ?? row.D_ACTUAL_INFLOW ?? row.ACTUAL_INFLOW);
    current.planInflow += toNumber(row.SUM_INFLOW_PLAN ?? row.D_INFLOW_PLAN ?? row.INFLOW_PLAN);
    current.outflow += toNumber(row.SUM_OUTFLOW ?? row.D_TOTAL_OUTFLOW ?? row.TOTAL_OUTFLOW);
    current.planOutflow += toNumber(
      row.SUM_PLAN_OUTFLOW
      ?? row.SUM_OUTFLOW_PLAN
      ?? row.D_PLAN_OUTFLOW
      ?? row.PLAN_OUTFLOW
      ?? row.D_PLAN_TURBINE
      ?? row.PLAN_TURBINE
      ?? row.SUM_PLAN_TURBINE
      ?? row.SUM_TURBINE_PLAN
    );
    totals.set(code, current);
  });

  const prefix = waterPeriodPrefix.value;
  totals.forEach((current, code) => {
    if (!current.planOutflow && prefix) {
      const summaryRow = summaryData.value.find(item => item.D_DAM === code);
      if (summaryRow) {
        current.planOutflow = toNumber(
          summaryRow[`${prefix}_PLAN_OUTFLOW`]
          ?? summaryRow[`${prefix}_OUTFLOW_PLAN`]
          ?? summaryRow[`${prefix}_PLAN_TURBINE`]
          ?? summaryRow[`${prefix}_TURBINE_PLAN`]
        );
      }
    }
  });

  if (!totals.size && waterPeriodPrefix.value) {
    summaryData.value.forEach((row) => {
      const code = row.D_DAM;
      if (!code || code === "ALL") return;
      totals.set(code, {
        code,
        label: row.branch?.BR_NAME || row.BR_NAME || code,
        shortName: getPlantShortName(code, row.branch?.BR_NAME_EN || row.BR_NAME_EN),
        inflow: toNumber(row[`${prefix}_ACTUAL_INFLOW`]),
        planInflow: toNumber(row[`${prefix}_INFLOW_PLAN`]),
        outflow: toNumber(row[`${prefix}_TOTAL_OUTFLOW`]),
        planOutflow: toNumber(
          row[`${prefix}_PLAN_OUTFLOW`]
          ?? row[`${prefix}_OUTFLOW_PLAN`]
          ?? row[`${prefix}_PLAN_TURBINE`]
          ?? row[`${prefix}_TURBINE_PLAN`]
        ),
      });
    });
  }

  return [...totals.values()]
    .map((plant) => {
      const hasYesterdayPlanInDetail = hasYesterdayMetric(plant.code, ...yesterdayFields.planOutflow);
      const hasYesterdayPlanInSummary = hasYesterdaySummaryMetric(plant.code, ...yesterdayPlanOutflowSummaryFields);

      return {
        ...plant,
        brand: getPlantBrand(plant.code),
        inflowPerf: performance(plant.inflow, plant.planInflow),
        outflowPerf: plant.planOutflow > 0 ? performance(plant.outflow, plant.planOutflow) : performance(plant.outflow, plant.inflow),
        hasYesterdayInflow: hasYesterdayMetric(plant.code, ...yesterdayFields.actualInflow),
        hasYesterdayPlanInflow: hasYesterdayMetric(plant.code, ...yesterdayFields.planInflow),
        hasYesterdayOutflow: hasYesterdayMetric(plant.code, ...yesterdayFields.actualOutflow),
        hasYesterdayPlanOutflow: hasYesterdayPlanInDetail || hasYesterdayPlanInSummary,
        yesterdayInflow: yesterdayPlantMetric(plant.code, ...yesterdayFields.actualInflow),
        yesterdayPlanInflow: yesterdayPlantMetric(plant.code, ...yesterdayFields.planInflow),
        yesterdayOutflow: yesterdayPlantMetric(plant.code, ...yesterdayFields.actualOutflow),
        yesterdayPlanOutflow: hasYesterdayPlanInDetail
          ? yesterdayPlantMetric(plant.code, ...yesterdayFields.planOutflow)
          : yesterdaySummaryMetric(plant.code, ...yesterdayPlanOutflowSummaryFields),
      };
    })
    .sort((a, b) => b.inflow - a.inflow);
});

const waterVolumePlantList = computed(() => {
  const totals = new Map();
  const prefix = waterPeriodPrefix.value;
  const hasSummaryVolume = Boolean(prefix) && summaryData.value.some((row) => (
    row.D_DAM !== "ALL"
    && ["TOTAL_VOLUME", "MAIN_VOLUME", "DIVERSION_VOLUME"].some(kind => (
      row[`${prefix}_${kind}`] !== undefined && row[`${prefix}_${kind}`] !== null
    ))
  ));

  if (hasSummaryVolume) {
    summaryData.value.forEach((row) => {
      const code = row.D_DAM;
      if (!code || code === "ALL") return;
      const mainVolume = toNumber(row[`${prefix}_MAIN_VOLUME`]);
      const diversionVolume = toNumber(row[`${prefix}_DIVERSION_VOLUME`]);
      totals.set(code, {
        code,
        label: row.branch?.BR_NAME || row.BR_NAME || code,
        shortName: getPlantShortName(code, row.branch?.BR_NAME_EN || row.BR_NAME_EN),
        mainVolume,
        diversionVolume,
        totalVolume: toNumber(row[`${prefix}_TOTAL_VOLUME`]) || mainVolume + diversionVolume,
      });
    });
  } else {
    volumeData.value.forEach((row) => {
      const code = row.D_DAM || row.DAM_CODE || row.BR_CODE || row.dam_code;
      if (!code || code === "ALL") return;
      const summaryRow = summaryData.value.find(item => item.D_DAM === code);
      const current = totals.get(code) || {
        code,
        label: row.branch?.BR_NAME || row.BR_NAME || summaryRow?.branch?.BR_NAME || summaryRow?.BR_NAME || code,
        shortName: getPlantShortName(code, row.branch?.BR_NAME_EN || row.BR_NAME_EN || summaryRow?.BR_NAME_EN),
        mainVolume: 0,
        diversionVolume: 0,
        totalVolume: 0,
      };
      current.mainVolume += toNumber(row.D_MAIN_VOLUME ?? row.MAIN_VOLUME);
      current.diversionVolume += toNumber(row.D_DIVERSION_VOLUME ?? row.DIVERSION_VOLUME);
      current.totalVolume += toNumber(row.D_TOTAL_VOLUME ?? row.TOTAL_VOLUME);
      totals.set(code, current);
    });
  }

  return [...totals.values()]
    .map((plant) => {
      const totalVolume = plant.totalVolume || plant.mainVolume + plant.diversionVolume;
      return {
        ...plant,
        totalVolume,
        brand: getPlantBrand(plant.code),
        mainShare: totalVolume > 0 ? Math.min(100, (plant.mainVolume / totalVolume) * 100) : 0,
        diversionShare: totalVolume > 0 ? Math.min(100, (plant.diversionVolume / totalVolume) * 100) : 0,
        hasYesterdayMainVolume: hasYesterdayMetric(plant.code, ...yesterdayFields.mainVolume),
        hasYesterdayDiversionVolume: hasYesterdayMetric(plant.code, ...yesterdayFields.diversionVolume),
        hasYesterdayTotalVolume: hasYesterdayMetric(plant.code, ...yesterdayFields.totalVolume)
          || hasYesterdayMetric(plant.code, ...yesterdayFields.mainVolume)
          || hasYesterdayMetric(plant.code, ...yesterdayFields.diversionVolume),
        yesterdayMainVolume: yesterdayPlantMetric(plant.code, ...yesterdayFields.mainVolume),
        yesterdayDiversionVolume: yesterdayPlantMetric(plant.code, ...yesterdayFields.diversionVolume),
        yesterdayTotalVolume: yesterdayPlantMetric(plant.code, ...yesterdayFields.totalVolume)
          || yesterdayPlantMetric(plant.code, ...yesterdayFields.mainVolume)
          + yesterdayPlantMetric(plant.code, ...yesterdayFields.diversionVolume),
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);
});

function performance(actual, plan) {
  const percent = plan > 0 ? (actual / plan) * 100 : 0;
  if (!plan) {
    return { percentage: "—", tone: "neutral", icon: "lucide:minus", bar: 0 };
  }
  if (percent >= 100) {
    return { percentage: `${percent.toFixed(1)}%`, tone: "positive", icon: "lucide:trending-up", bar: 100 };
  }
  return { percentage: `${percent.toFixed(1)}%`, tone: "warning", icon: "lucide:trending-down", bar: Math.max(3, percent) };
}

const energyPerformance = computed(() => performance(totalEnergy.value, totalPlanEnergy.value));
const revenuePerformance = computed(() => performance(totalRevenue.value, totalPlanRevenue.value));
const inflowPerformance = computed(() => performance(apiTotalInflow.value, apiPlanInflow.value));
const outflowPerformance = computed(() => {
  if (apiPlanOutflow.value > 0) {
    return performance(apiTotalOutflow.value, apiPlanOutflow.value);
  }
  if (!apiTotalInflow.value) {
    return { percentage: "—", tone: "neutral", icon: "lucide:minus", bar: 0 };
  }

  const percent = (apiTotalOutflow.value / apiTotalInflow.value) * 100;
  return {
    percentage: `${percent.toFixed(1)}%`,
    tone: "water",
    icon: "lucide:arrow-right-left",
    bar: Math.min(100, Math.max(3, percent)),
  };
});

const comparisonData = computed(() => {
  const total = totalEnergy.value;
  return [...siteData.value]
    .sort((a, b) => b.energy - a.energy)
    .map(item => ({ ...item, share: total > 0 ? (item.energy / total) * 100 : 0 }));
});

const plantEnergyList = computed(() => {
  return [...siteData.value]
    .sort((a, b) => b.energy - a.energy)
    .map(site => ({
      ...site,
      brand: getPlantBrand(site.code),
      perf: performance(site.energy, site.planEnergy),
    }));
});

const plantRevenueList = computed(() => {
  return [...siteData.value]
    .sort((a, b) => b.revenue - a.revenue)
    .map(site => ({
      ...site,
      brand: getPlantBrand(site.code),
      perf: performance(site.revenue, site.planRevenue),
    }));
});

const combinedPlantList = computed(() => {
  return [...siteData.value]
    .sort((a, b) => b.energy - a.energy)
    .map((plant) => {
      const hasYesterdayEnergy = hasYesterdayMetric(plant.code, ...yesterdayFields.actualEnergy);
      const hasYesterdayPlanEnergy = hasYesterdayMetric(plant.code, ...yesterdayFields.planEnergy);
      const hasYesterdayRevenue = hasYesterdayMetric(plant.code, ...yesterdayFields.actualRevenue);
      const hasYesterdayPlanRevenue = hasYesterdayMetric(plant.code, ...yesterdayFields.planRevenue);

      return {
        ...plant,
        brand: getPlantBrand(plant.code),
        energyPerf: performance(plant.energy, plant.planEnergy),
        revenuePerf: performance(plant.revenue, plant.planRevenue),
        hasYesterdayEnergy,
        hasYesterdayPlanEnergy,
        hasYesterdayRevenue,
        hasYesterdayPlanRevenue,
        yesterdayEnergy: yesterdayPlantMetric(plant.code, ...yesterdayFields.actualEnergy),
        yesterdayPlanEnergy: yesterdayPlantMetric(plant.code, ...yesterdayFields.planEnergy),
        yesterdayRevenue: yesterdayPlantMetric(plant.code, ...yesterdayFields.actualRevenue),
        yesterdayPlanRevenue: yesterdayPlantMetric(plant.code, ...yesterdayFields.planRevenue),
      };
    });
});

const comparisonChartConfig = computed(() => {
  const isRevenue = comparisonChartMetric.value === "revenue";
  const plants = isRevenue ? plantRevenueList.value : plantEnergyList.value;
  const actualValues = plants.map(plant => isRevenue ? plant.revenue : plant.energy);
  const planValues = plants.map(plant => isRevenue ? plant.planRevenue : plant.planEnergy);

  return {
    title: isRevenue ? "ປຽບທຽບລາຍຮັບແຕ່ລະເຂື່ອນ" : "ປຽບທຽບພະລັງງານແຕ່ລະເຂື່ອນ",
    unit: isRevenue ? "MUSD" : "GWh",
    labels: plants.map(plant => plantDisplayName(plant)),
    badges: plants.map(plant => ({
      text: plant.perf.percentage,
      tone: plant.perf.tone,
    })),
    series: [
      {
        name: "ຕົວຈິງ",
        data: actualValues,
        color: "#49d7df",
        radius: [7, 7, 2, 2],
        barMaxWidth: 34,
        showValues: true,
        labelColor: "#dffbff",
      },
      {
        name: "ແຜນ",
        data: planValues,
        color: "#f2bd56",
        radius: [7, 7, 2, 2],
        barMaxWidth: 34,
        showValues: true,
        labelColor: "#ffe5a7",
      },
    ],
  };
});

function openComparisonChart(metric) {
  comparisonChartMetric.value = metric;
  comparisonChartReady.value = false;
  comparisonChartOpen.value = true;
}

function formatMetric(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(toNumber(value));
}

const plantLaoNames = {
  NEM: "ນ້ຳອີມູນ",
  NP: "ນ້ຳປາກຊ່ອງ",
  NPC: "ນ້ຳປາກຊ່ອງ",
  NK2: "ນ້ຳກົງ 2",
  NK3: "ນ້ຳກົງ 3",
  NGG3A: "ນ້ຳງຽບ 3ເອ",
  NNG3A: "ນ້ຳງຽບ 3ເອ",
  XNN1: "ເຊນ້ຳນ້ອຍ 1",
};

function plantDisplayName(plant) {
  const code = String(plant?.code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const apiLabel = String(plant?.label || "").trim();
  const conciseApiLabel = apiLabel.replace(/^ເຂື່ອນໄຟຟ້າ\s*/, "").trim();

  return plantLaoNames[code] || conciseApiLabel || plant?.shortName || plant?.code || "-";
}

function buildSiteData(rows) {
  const siteMetadata = new Map(
    summaryData.value
      .filter(item => item.D_DAM && item.D_DAM !== "ALL")
      .map(item => [item.D_DAM, {
        label: item.branch?.BR_NAME || item.BR_NAME || item.D_DAM,
        shortName: getPlantShortName(item.D_DAM, item.branch?.BR_NAME_EN || item.BR_NAME_EN),
      }]),
  );
  const totals = new Map();

  rows.forEach((row) => {
    const code = row.D_DAM || row.BR_CODE || row.dam_code;
    if (!code || code === "ALL") return;
    const metadata = siteMetadata.get(code);
    const current = totals.get(code) || {
      code,
      label: row.branch?.BR_NAME || row.BR_NAME || metadata?.label || code,
      shortName: getPlantShortName(code, row.branch?.BR_NAME_EN || row.BR_NAME_EN || metadata?.shortName),
      energy: 0,
      revenue: 0,
      planEnergy: 0,
      planRevenue: 0,
    };
    current.energy += toNumber(row.D_ACTUAL_ENERGY ?? row.SUM_ACTUAL_ENERGY ?? row.ACTUAL_ENERGY);
    current.revenue += toNumber(row.D_ACTUAL_REVENUE ?? row.SUM_ACTUAL_REVENUE ?? row.ACTUAL_REVENUE);
    current.planEnergy += toNumber(row.D_PLAN_ENERGY ?? row.SUM_PLAN_ENERGY ?? row.PLAN_ENERGY);
    current.planRevenue += toNumber(row.D_PLAN_REVENUE ?? row.SUM_PLAN_REVENUE ?? row.PLAN_REVENUE);
    totals.set(code, current);
  });

  return [...totals.values()]
    .map(item => ({
      ...item,
      energy: Math.round(item.energy * 1000) / 1000,
      revenue: Math.round(item.revenue * 1000) / 1000,
      planEnergy: Math.round(item.planEnergy * 1000) / 1000,
      planRevenue: Math.round(item.planRevenue * 1000) / 1000,
    }))
    .sort((a, b) => a.energy - b.energy);
}

function fallbackSites() {
  if (!['Y', 'M'].includes(selectedPeriod.value)) return [];
  const prefix = selectedPeriod.value === 'Y' ? 'YEAR' : 'MONTH';
  return summaryData.value
    .filter(item => item.D_DAM && item.D_DAM !== "ALL")
    .map(item => ({
      code: item.D_DAM,
      label: item.branch?.BR_NAME || item.BR_NAME || item.D_DAM,
      shortName: getPlantShortName(item.D_DAM, item.branch?.BR_NAME_EN || item.BR_NAME_EN),
      energy: toNumber(item[`${prefix}_ACTUAL_ENERGY`]),
      revenue: toNumber(item[`${prefix}_ACTUAL_REVENUE`]),
      planEnergy: toNumber(item[`${prefix}_PLAN_ENERGY`]),
      planRevenue: toNumber(item[`${prefix}_PLAN_REVENUE`]),
    }))
    .sort((a, b) => a.energy - b.energy);
}

function dashboardCacheKey(start, end) {
  return `energy-dashboard:v7:${yesterdayDate}:${start}:${end}`;
}

function readDashboardCache(start, end) {
  if (!import.meta.client) return null;

  try {
    const cached = JSON.parse(sessionStorage.getItem(dashboardCacheKey(start, end)) || "null");
    if (!cached || Date.now() - Number(cached.savedAt || 0) > dashboardCacheTtl) return null;

    return {
      summary: Array.isArray(cached.summary) ? cached.summary : [],
      sites: Array.isArray(cached.sites) ? cached.sites : [],
      period: Array.isArray(cached.period) ? cached.period : [],
      volume: Array.isArray(cached.volume) ? cached.volume : [],
      yesterday: Array.isArray(cached.yesterday) ? cached.yesterday : [],
      yesterdaySummary: Array.isArray(cached.yesterdaySummary) ? cached.yesterdaySummary : [],
    };
  } catch {
    return null;
  }
}

function writeDashboardCache(start, end) {
  if (!import.meta.client) return;

  try {
    const existing = readDashboardCache(start, end);
    const summaryToSave = summaryData.value.length ? summaryData.value : (existing?.summary || []);
    const sitesToSave = siteData.value.length ? siteData.value : (existing?.sites || []);
    const periodToSave = periodData.value.length ? periodData.value : (existing?.period || []);
    const volumeToSave = volumeData.value.length ? volumeData.value : (existing?.volume || []);
    const yesterdayToSave = yesterdayData.value.length ? yesterdayData.value : (existing?.yesterday || []);
    const yesterdaySummaryToSave = yesterdaySummaryData.value.length
      ? yesterdaySummaryData.value
      : (existing?.yesterdaySummary || []);

    if (!summaryToSave.length && !sitesToSave.length) return;

    sessionStorage.setItem(dashboardCacheKey(start, end), JSON.stringify({
      savedAt: Date.now(),
      summary: summaryToSave,
      sites: sitesToSave,
      period: periodToSave,
      volume: volumeToSave,
      yesterday: yesterdayToSave,
      yesterdaySummary: yesterdaySummaryToSave,
    }));
  } catch {
    // Storage can be unavailable in private browsing; live data still works.
  }
}

async function loadDashboard() {
  const { start, end } = requestedRange.value;
  if (!start || !end || start > end) {
    errorMessage.value = "ກະລຸນາເລືອກຊ່ວງວັນທີໃຫ້ຖືກຕ້ອງ";
    return;
  }

  activeRequestController?.abort();
  const controller = new AbortController();
  activeRequestController = controller;
  const requestId = ++requestSequence;

  const cached = readDashboardCache(start, end);
  if (cached) {
    summaryData.value = cached.summary;
    siteData.value = cached.sites;
    periodData.value = cached.period;
    volumeData.value = cached.volume;
    yesterdayData.value = cached.yesterday;
    yesterdaySummaryData.value = cached.yesterdaySummary;
  } else {
    summaryData.value = [];
    siteData.value = [];
    periodData.value = [];
    volumeData.value = [];
    yesterdayData.value = [];
    yesterdaySummaryData.value = [];
  }

  loading.value = !summaryData.value.length && !siteData.value.length;
  refreshing.value = true;
  errorMessage.value = "";
  appliedRange.value = { start, end };
  filterOpen.value = false;

  let siteRows = null;
  const requestOptions = {
    signal: controller.signal,
    timeout: 15_000,
  };

  const summaryRequest = axios.get("/api/data/sum", {
    ...requestOptions,
    params: { dateselect: end || toIsoDate(new Date()), dam: "" },
  }).then((response) => {
    if (requestId !== requestSequence) return;
    const items = Array.isArray(response.data?.data)
      ? response.data.data
      : (Array.isArray(response.data) ? response.data : []);
    if (items.length) {
      summaryData.value = items;
    }

    if (needsDetailedSites) {
      if (Array.isArray(siteRows)) siteData.value = buildSiteData(siteRows);
      if (siteData.value.length === 0) siteData.value = fallbackSites();
    } else {
      siteData.value = fallbackSites();
      if (siteData.value.length === 0 && Array.isArray(siteRows)) siteData.value = buildSiteData(siteRows);
    }

    loading.value = false;
    writeDashboardCache(start, end);
  }).catch((err) => {
    console.warn("Failed to load dashboard summary data:", err);
    const todayIso = toIsoDate(new Date());
    if (end !== todayIso) {
      axios.get("/api/data/sum", {
        params: { dateselect: todayIso, dam: "" },
        timeout: 10_000,
      }).then((retryRes) => {
        if (requestId !== requestSequence) return;
        const retryItems = Array.isArray(retryRes.data?.data)
          ? retryRes.data.data
          : (Array.isArray(retryRes.data) ? retryRes.data : []);
        if (retryItems.length) {
          summaryData.value = retryItems;
          writeDashboardCache(start, end);
        }
      }).catch(() => {});
    }
  });

  const needsDetailedSites = !["Y", "M"].includes(selectedPeriod.value);
  const sitesRequest = axios.get("/api/data/dam", {
    ...requestOptions,
    params: { start, end, code: "" },
  }).then((response) => {
    if (requestId !== requestSequence) return;
    siteRows = Array.isArray(response.data?.data) ? response.data.data : [];
    volumeData.value = siteRows;

    if (needsDetailedSites) {
        siteData.value = buildSiteData(siteRows);
        if (siteData.value.length === 0) siteData.value = fallbackSites();
    }

    loading.value = false;
    writeDashboardCache(start, end);
  });

  const periodRequest = axios.get("/api/data/period", {
    ...requestOptions,
    params: {
      start,
      end,
      code: "",
      type: selectedPeriod.value === "Q" ? "M" : selectedPeriod.value,
    },
  }).then((response) => {
    if (requestId !== requestSequence) return;
    periodData.value = Array.isArray(response.data?.data) ? response.data.data : [];
    writeDashboardCache(start, end);
  });

  const yesterdayRequest = axios.get("/api/data/dam", {
    ...requestOptions,
    params: { start: yesterdayDate, end: yesterdayDate, code: "" },
  }).then((response) => {
    if (requestId !== requestSequence) return;
    yesterdayData.value = Array.isArray(response.data?.data) ? response.data.data : [];
    writeDashboardCache(start, end);
  });

  const yesterdaySummaryRequest = axios.get("/api/data/sum", {
    ...requestOptions,
    params: { dateselect: yesterdayDate, dam: "" },
  }).then((response) => {
    if (requestId !== requestSequence) return;
    yesterdaySummaryData.value = Array.isArray(response.data?.data)
      ? response.data.data
      : (Array.isArray(response.data) ? response.data : []);
    writeDashboardCache(start, end);
  });

  const [summaryResult, sitesResult, periodResult] = await Promise.allSettled([
    summaryRequest,
    sitesRequest,
    periodRequest,
    yesterdayRequest,
    yesterdaySummaryRequest,
  ]);
  if (requestId !== requestSequence) return;

  if (siteData.value.length === 0) siteData.value = fallbackSites();

  const allRequiredRequestsFailed = summaryResult.status === "rejected"
    && (!needsDetailedSites || sitesResult.status === "rejected")
    && periodResult.status === "rejected";
  if (allRequiredRequestsFailed) {
    const error = sitesResult.reason || summaryResult.reason;
    if (!axios.isCancel(error)) {
      errorMessage.value = error?.response?.data?.statusMessage
        || error?.response?.data?.message
        || (cached
          ? "Unable to refresh the dashboard. Showing recently saved data."
          : "ບໍ່ສາມາດໂຫຼດຂໍ້ມູນ Dashboard ໄດ້");
    }
  }

  loading.value = false;
  refreshing.value = false;
  if (activeRequestController === controller) activeRequestController = undefined;
}

async function selectPeriod(period) {
  if (selectedPeriod.value === period) return;
  selectedPeriod.value = period;
  await nextTick();
  await loadDashboard();
}

async function applyFilters() {
  const { start, end } = requestedRange.value;
  if (!start || !end || start > end) {
    errorMessage.value = "ກະລຸນາເລືອກຊ່ວງວັນທີໃຫ້ຖືກຕ້ອງ";
    return;
  }
  await loadDashboard();
}

function togglePlantDetails() {
  const query = { ...route.query };
  if (showPlantDetails.value) delete query.view;
  else query.view = "plants";
  router.push({ path: "/", query });
}

function openSite(code) {
  const item = summaryData.value.find(row => row.D_DAM === code);
  if (item) router.push({ path: "/detail", query: { item: JSON.stringify(item), code } });
  else router.push({ path: "/detail", query: { code } });
}

onMounted(loadDashboard);
onBeforeUnmount(() => activeRequestController?.abort());
</script>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 64px);
  background: #101216;
  color: #f7f8fa;
}

.executive-dashboard {
  width: min(1500px, 100%);
  margin: 0 auto;
  padding: 32px clamp(18px, 3vw, 48px) 48px;
}

.dashboard-header,
.brand-lockup,
.kpi-heading,
.section-heading,
.site-meta {
  display: flex;
  align-items: center;
}

.dashboard-header {
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.brand-lockup { min-width: 0; }
.eyebrow, .section-kicker { color: #ff8a1f; font-size: .7rem; font-weight: 800; letter-spacing: .16em; }
.brand-lockup h1 { margin-top: 3px; font-size: clamp(1.35rem, 2.3vw, 2.05rem); line-height: 1.25; }
.header-subtitle { margin-top: 5px; color: #9298a3; font-size: .88rem; }

.date-badge,
.sort-label,
.site-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.date-badge {
  border: 1px solid #323640;
  border-radius: 12px;
  background: #1b1e24;
  color: #d9dce2;
  padding: 11px 14px;
  cursor: pointer;
}
.date-mobile-text { display: none; }

.period-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  max-width: 620px;
  margin: 0 auto 22px;
  padding: 5px;
  border: 1px solid #292d35;
  border-radius: 14px;
  background: #17191e;
}

.period-tabs button {
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #8e939c;
  font-weight: 700;
  cursor: pointer;
  transition: .2s ease;
}

.period-tabs button:hover { color: white; }
.period-tabs button.active { background: #f67300; color: white; box-shadow: 0 5px 18px rgba(246, 115, 0, .28); }

.filter-panel {
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 12px;
  max-width: 720px;
  margin: -8px auto 22px;
  padding: 15px;
  border: 1px solid #292d35;
  border-radius: 14px;
  background: #181b20;
}

.filter-field { flex: 1; min-width: 150px; }
.filter-field label { display: block; margin-bottom: 6px; color: #a3a8b1; font-size: .75rem; }
.filter-field input, .filter-field select {
  width: 100%; height: 42px; border: 1px solid #383d47; border-radius: 9px;
  background: #111318; color: white; padding: 0 11px; outline: none;
}
.filter-field input:focus, .filter-field select:focus { border-color: #f67300; }
.filter-field input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: .72; }
.apply-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 42px; min-width: 120px; border: 0; border-radius: 9px;
  background: #f67300; color: white; font-weight: 800; cursor: pointer;
}
.apply-button:disabled { opacity: .55; cursor: wait; }

.dashboard-alert {
  display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 14px;
  border: 1px solid rgba(239, 83, 80, .35); border-radius: 12px; background: rgba(239, 83, 80, .1); color: #ffaaa8;
}
.dashboard-alert span { flex: 1; }
.dashboard-alert button { border: 0; background: transparent; color: #ff8a1f; font-weight: 800; cursor: pointer; }

.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-bottom: 18px; }
.kpi-card, .dashboard-card { border: 1px solid #292d35; border-radius: 18px; background: #1a1d22; box-shadow: 0 18px 55px rgba(0, 0, 0, .18); }
.kpi-card { padding: 22px; }
.kpi-heading { justify-content: space-between; gap: 16px; }
.kpi-heading p { margin-bottom: 5px; color: #a6abb4; font-size: .84rem; font-weight: 700; }
.kpi-heading strong { font-size: clamp(1.65rem, 3vw, 2.45rem); line-height: 1; }
.kpi-heading small { color: #c5c8ce; font-size: .7rem; font-weight: 700; }
.metric-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; }
.metric-icon.energy { background: rgba(255, 122, 0, .13); color: #ff8617; }
.metric-icon.revenue { background: rgba(254, 184, 54, .12); color: #f7b63b; }
.kpi-trend { display: flex; align-items: center; gap: 7px; margin-top: 18px; font-size: .77rem; font-weight: 700; }
.kpi-trend.positive { color: #55c994; }
.kpi-trend.warning { color: #ffad52; }
.kpi-trend.neutral { color: #8e939c; }
.progress-track { height: 4px; margin-top: 12px; overflow: hidden; border-radius: 10px; background: #30343b; }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #f56f00, #ffb03b); }
.plan-note {
  margin-top: 10px;
  color: #9299a5;
  font-size: .84rem;
  font-weight: 600;
  line-height: 1.35;
}

.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(330px, 1fr); gap: 18px; }
.dashboard-card { min-width: 0; padding: 22px; }
.section-heading { justify-content: space-between; gap: 15px; margin-bottom: 18px; }
.section-heading h2 { margin-top: 3px; font-size: 1.08rem; }
.chart-heading-actions { display: flex; align-items: center; gap: 9px; }
.chart-style-toggle,
.chart-metric-toggle {
  display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px;
  border: 1px solid #343944; border-radius: 9px; background: #22262d; color: #9097a2;
  cursor: pointer; transition: color .18s ease, border-color .18s ease, background .18s ease, transform .18s ease;
}
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color: #f0f2f6; border-color: #596170; transform: translateY(-1px); }
.chart-style-toggle.active { color: #8279ff; border-color: rgba(112,101,255,.65); background: rgba(112,101,255,.12); }
.chart-metric-toggle { color: #f5b82e; border-color: rgba(245,184,46,.42); background: rgba(245,184,46,.09); }
.chart-metric-toggle.revenue { color: #ffbe32; border-color: rgba(255,190,50,.7); background: rgba(255,190,50,.15); box-shadow: 0 0 14px rgba(255,174,31,.12); }
.sort-label, .site-count { color: #858b95; font-size: .7rem; }
.site-count { padding: 5px 9px; border-radius: 20px; background: #252930; }
.chart-site-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(74px, 1fr));
  gap: 4px;
  margin: 12px 12px 0 48px;
  padding-top: 10px;
  border-top: 1px solid rgba(116, 222, 230, .16);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #38404b transparent;
}
.chart-site-tile {
  position: relative;
  display: flex;
  min-width: 74px;
  min-height: 56px;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  padding: 8px 7px 5px;
  border: 1px solid #292e38;
  border-radius: 3px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--site-accent) 17%, #171a21) 0%, #11141a 48%);
  color: #eef1f5;
  text-align: left;
  cursor: pointer;
  transition: transform .18s ease, border-color .18s ease;
}
.chart-site-tile:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--site-accent) 68%, #39404b); }
.tile-accent { position: absolute; inset: 0 0 auto; height: 3px; background: var(--site-accent); box-shadow: 0 0 10px var(--site-accent); }
.tile-short-name { overflow: hidden; width: 100%; color: #aeb5c0; font-size: .56rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.tile-value { margin-top: 4px; font-size: .86rem; font-weight: 700; line-height: 1; letter-spacing: -.02em; }
.tile-footer { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 2px; }
.chart-site-tile small { color: #737c89; font-size: .47rem; }
.tile-achievement { display: inline-flex; align-items: center; gap: 2px; font-size: .47rem; font-weight: 800; white-space: nowrap; }
.tile-achievement.increase { color: #53d49a; }
.tile-achievement.decrease { color: #ff6f72; }
.tile-achievement.neutral { color: #727b87; }
.chart-state { display: flex; min-height: 330px; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #737983; font-size: .85rem; }
.chart-state.compact { min-height: 230px; }
.loader { width: 30px; height: 30px; border: 3px solid #343841; border-top-color: #ff7a00; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.site-list { display: grid; max-height: 370px; gap: 10px; overflow: auto; padding-right: 4px; }
.site-list::-webkit-scrollbar { width: 4px; }
.site-list::-webkit-scrollbar-thumb { border-radius: 10px; background: #3a3e47; }
.plant-performance-card {
  display: block;
  width: 100%;
  padding: 13px 14px 10px;
  border: 1px solid #2a3544;
  border-radius: 7px;
  background:
    radial-gradient(circle at 78% 0%, rgba(39, 97, 167, .14), transparent 42%),
    linear-gradient(135deg, #151b24 0%, #10151d 100%);
  color: #f6f8fb;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.025), 0 7px 18px rgba(0,0,0,.16);
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.plant-performance-card:hover { transform: translateY(-1px); border-color: #3f668d; box-shadow: 0 10px 24px rgba(0,0,0,.24); }
.plant-card-topline { display: flex; align-items: center; gap: 10px; min-width: 0; }
.plant-logo-placeholder {
  display: grid; place-items: center; flex: 0 0 34px; width: 34px; height: 34px;
  position: relative; overflow: hidden; color: var(--plant-accent, #38bdf8); border: 1px solid
  color-mix(in srgb, var(--plant-accent, #38bdf8) 58%, transparent); border-radius: 10px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--plant-accent, #38bdf8) 20%, #172230), #111923);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 5px 14px color-mix(in srgb, var(--plant-accent, #38bdf8) 13%, transparent);
}
.plant-logo-placeholder::after {
  position: absolute; right: -8px; bottom: -11px; width: 27px; height: 27px;
  border: 5px solid currentColor; border-radius: 50%; content: ""; opacity: .1;
}
.plant-logo-placeholder.has-logo {
  flex-basis: 44px; width: 44px; padding: 2px; border-color: rgba(255,255,255,.28);
  background: #fff; box-shadow: 0 5px 14px rgba(18, 117, 164, .2);
}
.plant-logo-placeholder.has-logo::after { display: none; }
.plant-logo-image {
  display: block; width: 100%; height: 100%; border-radius: 7px; object-fit: contain;
}
.plant-logo-mark {
  position: relative; z-index: 1; font-size: .66rem; font-weight: 900; letter-spacing: -.02em;
  line-height: 1;
}
.plant-card-identity { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.plant-card-identity small { margin-bottom: 1px; color: #91a5bb; font-size: .6rem; font-weight: 800; letter-spacing: .08em; }
.plant-card-identity strong { overflow: hidden; color: #eef4fa; font-size: .74rem; text-overflow: ellipsis; white-space: nowrap; }
.plant-card-output { display: flex; flex: 0 0 auto; align-items: baseline; gap: 4px; white-space: nowrap; }
.plant-card-output strong { font-size: 1.42rem; font-weight: 600; letter-spacing: -.04em; }
.plant-card-output small { color: #9eabb9; font-size: .56rem; font-weight: 800; }
.capacity-track { position: relative; display: block; height: 4px; margin: 11px 0 7px; border-radius: 6px; background: #25303d; }
.capacity-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #21d4c5 0%, #30bfea 52%, #657cff 100%); box-shadow: 0 0 9px rgba(48,191,234,.28); }
.capacity-marker {
  position: absolute; bottom: 7px; width: 0; height: 0; transform: translateX(-50%);
  border-right: 4px solid transparent; border-bottom: 6px solid #eaf7ff; border-left: 4px solid transparent;
  filter: drop-shadow(0 0 3px rgba(125,204,255,.7));
}
.plant-card-footer { display: flex; align-items: center; gap: 6px; color: #657385; font-size: .57rem; }
.plant-card-footer-label { flex: 1; }
.plant-card-footer-icon { flex: 0 0 auto; }
.plant-card-footer strong { min-width: 52px; color: #aebdcd; font-size: .62rem; text-align: right; }
.plant-card-footer svg { color: #647487; }
.comparison-skeleton { display: grid; gap: 12px; }
.comparison-skeleton span { height: 92px; border-radius: 7px; background: linear-gradient(90deg, #171d25, #222c38, #171d25); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }

@media (max-width: 960px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .site-list { max-height: none; }
}

@media (max-width: 600px) {
  .executive-dashboard { padding: 20px 12px 30px; }
  .dashboard-header { align-items: flex-start; margin-bottom: 22px; }
  .header-subtitle { display: none; }
  .eyebrow { font-size: .58rem; }
  .brand-lockup h1 { font-size: 1.13rem; }
  .date-badge { width: auto; min-width: 82px; height: 42px; justify-content: center; padding: 0 11px; font-size: .72rem; }
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
  .plan-note { min-height: 32px; font-size: .76rem; }
  .dashboard-card { padding: 17px 13px; border-radius: 15px; }
  .section-heading { align-items: flex-start; }
  .chart-heading-actions { gap: 6px; }
  .sort-label { margin-top: 3px; }
  .chart-site-strip {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 2px;
    margin: -9px 2px 0 28px;
    padding: 3px 0 0;
    overflow-x: hidden;
  }
  .chart-site-tile { min-width: 0; min-height: 50px; padding: 7px 4px 4px; }
  .tile-short-name { font-size: .48rem; text-align: center; }
  .tile-value { margin-top: 3px; font-size: .72rem; }
  .chart-site-tile small, .tile-achievement { font-size: .4rem; }
  .plant-card-output strong { font-size: 1.25rem; }
}

@media (max-width: 380px) {
  .date-badge { min-width: 42px; width: 42px; padding: 0; }
  .date-mobile-text { display: none; }
  .kpi-grid { grid-template-columns: 1fr; }
  .plan-note, .kpi-trend { min-height: auto; }
}

/* Energy growth and bright-future theme */
.dashboard-page {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 4%, rgba(56, 189, 248, .20), transparent 25rem),
    radial-gradient(circle at 94% 12%, rgba(132, 204, 22, .16), transparent 28rem),
    linear-gradient(155deg, #f8fcff 0%, #eef9fb 48%, #f5fbf1 100%);
  color: #12314a;
}

.dashboard-page::before,
.dashboard-page::after {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  content: "";
  pointer-events: none;
}

.dashboard-page::before {
  top: 130px;
  right: -170px;
  width: 430px;
  height: 430px;
  border: 58px solid rgba(20, 169, 190, .055);
}

.dashboard-page::after {
  bottom: -180px;
  left: -130px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(250, 190, 50, .12), rgba(250, 190, 50, 0) 68%);
}

.executive-dashboard { position: relative; z-index: 1; }

.dashboard-header {
  position: relative;
  overflow: hidden;
  padding: 24px 26px;
  border: 1px solid rgba(255, 255, 255, .58);
  border-radius: 22px;
  background:
    radial-gradient(circle at 90% -20%, rgba(255, 215, 95, .38), transparent 38%),
    linear-gradient(120deg, #086ca8 0%, #0d94b2 53%, #28a87f 100%);
  box-shadow: 0 18px 42px rgba(23, 119, 145, .20);
}

.dashboard-header::after {
  position: absolute;
  right: 20%;
  bottom: -70px;
  width: 210px;
  height: 150px;
  border: 25px solid rgba(255,255,255,.08);
  border-radius: 50%;
  content: "";
}

.dashboard-header .eyebrow { color: #ffe27a; }
.dashboard-header h1 { color: #fff; text-shadow: 0 2px 12px rgba(0, 65, 95, .18); }
.dashboard-header .header-subtitle { color: rgba(255, 255, 255, .82); }
.dashboard-header .date-badge {
  position: relative;
  z-index: 1;
  border-color: rgba(255,255,255,.36);
  background: rgba(255,255,255,.16);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16);
  backdrop-filter: blur(12px);
}

.period-tabs {
  border-color: #d9e9ed;
  background: rgba(255,255,255,.88);
  box-shadow: 0 10px 30px rgba(33, 110, 130, .10);
  backdrop-filter: blur(10px);
}
.period-tabs button { color: #607889; }
.period-tabs button:hover { color: #087da3; background: #edf9fb; }
.period-tabs button.active {
  background: linear-gradient(115deg, #0d9fc0, #25aa7b);
  color: #fff;
  box-shadow: 0 7px 18px rgba(13, 159, 192, .24);
}

.filter-panel {
  border-color: #d8e8ec;
  background: rgba(255,255,255,.94);
  box-shadow: 0 14px 35px rgba(33, 110, 130, .10);
}
.filter-field label { color: #526f80; }
.filter-field input,
.filter-field select { border-color: #cddfe5; background: #f8fcfd; color: #173b52; }
.filter-field input:focus,
.filter-field select:focus { border-color: #0ca4bc; box-shadow: 0 0 0 3px rgba(12,164,188,.11); }
.filter-field input::-webkit-calendar-picker-indicator { filter: none; opacity: .62; }
.apply-button { background: linear-gradient(115deg, #0b9ebf, #20a978); box-shadow: 0 7px 18px rgba(19,158,166,.22); }

.dashboard-alert { border-color: #f3c8c5; background: #fff5f4; color: #b9423e; }
.kpi-card,
.dashboard-card {
  border-color: rgba(152, 192, 203, .43);
  background: rgba(255,255,255,.94);
  box-shadow: 0 17px 45px rgba(38, 104, 122, .105);
  backdrop-filter: blur(10px);
}

.kpi-card { position: relative; overflow: hidden; }
.kpi-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(#17a9cb, #3dccaf);
  content: "";
}
.kpi-card:nth-child(2)::before { background: linear-gradient(#f6b52e, #7bc84b); }
.kpi-heading p { color: #527084; }
.kpi-heading strong { color: #0e3049; }
.kpi-heading small { color: #557286; }
.metric-icon.energy {
  border: 1px solid rgba(255, 143, 31, .23);
  background: linear-gradient(145deg, #44392f 0%, #292b2d 58%, #1e252a 100%);
  color: #ff8617;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 9px 22px rgba(112,65,18,.18);
  text-shadow: 0 0 10px rgba(255,134,23,.38);
}
.metric-icon.revenue {
  border: 1px solid rgba(255, 188, 50, .22);
  background: linear-gradient(145deg, #454033 0%, #252b30 58%, #1d252c 100%);
  color: #ffb51f;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 9px 22px rgba(107,79,16,.18);
  text-shadow: 0 0 10px rgba(255,181,31,.35);
}
.kpi-trend.positive { color: #16855e; }
.kpi-trend.warning { color: #bc7100; }
.kpi-trend.neutral { color: #6b7f8d; }
.progress-track { background: #e4eef0; }
.progress-track span { background: linear-gradient(90deg, #12a7c5, #5cc76e); box-shadow: 0 0 12px rgba(40,181,156,.22); }
.kpi-card:nth-child(2) .progress-track span { background: linear-gradient(90deg, #f3a817, #8bc84b); }
.plan-note { color: #587284; }

.section-kicker { color: #087f9f; }
.section-heading h2 { color: #12314a; }
.chart-style-toggle,
.chart-metric-toggle {
  border-color: #cbdde3;
  background: #f2f8fa;
  color: #557080;
  box-shadow: 0 5px 14px rgba(50, 104, 118, .08);
}
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color: #0786a7; border-color: #82c9d5; background: #e9f8fa; }
.chart-style-toggle.active { color: #136fc1; border-color: #72aee4; background: #eaf4ff; }
.chart-metric-toggle { color: #c98200; border-color: #e8c76d; background: #fff8e7; }
.chart-metric-toggle.revenue { color: #b66d00; border-color: #e7b443; background: #fff4d2; box-shadow: 0 6px 16px rgba(220,153,19,.14); }
.sort-label { color: #688091; }
.site-count { background: #eaf5f6; color: #4c7180; }

.chart-site-tile {
  border-color: #d5e3e8;
  background: linear-gradient(180deg, color-mix(in srgb, var(--site-accent) 10%, #fff) 0%, #f8fbfc 60%);
  color: #193a51;
  box-shadow: 0 5px 15px rgba(35, 99, 116, .07);
}
.chart-site-tile:hover { border-color: color-mix(in srgb, var(--site-accent) 58%, #b6d0d8); box-shadow: 0 8px 20px rgba(35,99,116,.12); }
.tile-short-name { color: #5c7180; }
.tile-value { color: #16384e; }
.chart-site-tile small { color: #718794; }
.tile-achievement.increase { color: #15865f; }
.tile-achievement.decrease { color: #d4484c; }
.tile-achievement.neutral { color: #778a96; }
.chart-state { color: #718895; }
.loader { border-color: #dcebed; border-top-color: #0ea5bd; }

.site-list::-webkit-scrollbar-thumb { background: #b9d1d7; }
.plant-performance-card {
  border-color: #d8e5e9;
  background:
    radial-gradient(circle at 84% 0%, rgba(25, 169, 194, .09), transparent 44%),
    linear-gradient(135deg, #fff 0%, #f5fafb 100%);
  color: #12314a;
  box-shadow: 0 7px 20px rgba(32, 95, 112, .08);
}
.plant-performance-card:hover { border-color: #66bdcb; box-shadow: 0 11px 26px rgba(20,126,150,.14); }
.plant-card-identity small { color: #4e8ba2; }
.plant-card-identity strong { color: #173b52; }
.plant-card-output strong { color: #0b5d80; }
.plant-card-output small { color: #5f7988; }
.capacity-track { background: #dce9ec; }
.capacity-fill { background: linear-gradient(90deg, #15b9ca 0%, #36bc91 55%, #91cb48 100%); box-shadow: 0 0 9px rgba(32,184,164,.2); }
.capacity-marker { border-bottom-color: #087b9b; filter: drop-shadow(0 0 3px rgba(13,142,169,.28)); }
.plant-card-footer { color: #6a8190; }
.plant-card-footer strong { color: #315b70; }
.plant-card-footer svg { color: #258aa3; }
.comparison-skeleton span { background: linear-gradient(90deg, #edf4f5, #dcebed, #edf4f5); background-size: 200% 100%; }

@media (max-width: 600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 5% 2%, rgba(56,189,248,.16), transparent 17rem),
      linear-gradient(155deg, #f8fcff, #eff9f8 68%, #f5fbf1);
  }
  .dashboard-header { padding: 17px 16px; border-radius: 17px; }
  .dashboard-header::after { right: -30px; bottom: -75px; }
  .dashboard-header .date-badge { background: rgba(255,255,255,.18); }
  .kpi-card,
  .dashboard-card { background: rgba(255,255,255,.97); }
  .chart-site-strip { scrollbar-color: #b7d0d7 transparent; }
}

/* Modern executive theme */
.dashboard-page {
  background:
    radial-gradient(circle at 12% 2%, rgba(126, 87, 255, .17), transparent 30rem),
    radial-gradient(circle at 94% 22%, rgba(43, 215, 198, .10), transparent 28rem),
    linear-gradient(145deg, #070b16 0%, #090e1d 52%, #080d19 100%);
  color: #edf2ff;
}
.dashboard-page::before {
  border-color: rgba(127, 91, 255, .055);
}
.dashboard-page::after {
  background: radial-gradient(circle, rgba(70, 218, 203, .07), transparent 68%);
}
.dashboard-header {
  border-color: rgba(148, 121, 255, .28);
  background:
    radial-gradient(circle at 84% -40%, rgba(67, 221, 205, .18), transparent 45%),
    linear-gradient(120deg, rgba(26, 20, 57, .97), rgba(13, 20, 40, .98) 55%, rgba(10, 29, 42, .97));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 22px 55px rgba(0,0,0,.32), 0 0 34px rgba(110,75,234,.09);
}
.dashboard-header::after { border-color: rgba(160,133,255,.08); }
.dashboard-header .eyebrow { color: #9d86ff; }
.dashboard-header h1 { color: #f6f3ff; }
.dashboard-header .header-subtitle { color: #8996af; }
.dashboard-header .date-badge {
  border-color: rgba(154,130,255,.30);
  background: rgba(18,25,45,.78);
  color: #e8e3ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 8px 24px rgba(0,0,0,.18);
}
.period-tabs {
  border-color: #242c43;
  background: rgba(15,21,38,.92);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 14px 32px rgba(0,0,0,.22);
}
.period-tabs button { color: #8390aa; }
.period-tabs button:hover { color: #dcd4ff; background: rgba(124,91,255,.09); }
.period-tabs button.active {
  background: linear-gradient(120deg, #7955ef, #6441d2);
  color: #fff;
  box-shadow: 0 8px 22px rgba(113,74,231,.33), inset 0 1px 0 rgba(255,255,255,.16);
}
.filter-panel {
  border-color: #252e47;
  background: rgba(15,22,39,.97);
  box-shadow: 0 18px 42px rgba(0,0,0,.28);
}
.filter-field label { color: #8d99af; }
.filter-field input,
.filter-field select { border-color: #303a55; background: #0b1120; color: #eef2ff; }
.filter-field input:focus,
.filter-field select:focus { border-color: #8060ef; box-shadow: 0 0 0 3px rgba(128,96,239,.13); }
.filter-field input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: .7; }
.apply-button {
  background: linear-gradient(120deg, #7d58ef, #6041ce);
  box-shadow: 0 8px 20px rgba(108,72,221,.27);
}
.dashboard-alert { border-color: rgba(246,92,111,.30); background: rgba(246,92,111,.09); color: #ff9cad; }
.kpi-card,
.dashboard-card {
  border-color: #232c43;
  background:
    radial-gradient(circle at 95% 0%, rgba(126,91,255,.055), transparent 38%),
    linear-gradient(145deg, rgba(17,24,43,.98), rgba(12,18,33,.98));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 18px 48px rgba(0,0,0,.28);
  backdrop-filter: blur(14px);
}
.kpi-card::before { background: linear-gradient(#8d66ff, #42d8ca); }
.kpi-card:nth-child(2)::before { background: linear-gradient(#c575ff, #59caef); }
.kpi-heading p { color: #9aa6bb; }
.kpi-heading strong { color: #f5f7ff; }
.kpi-heading small { color: #9ea9bc; }
.kpi-trend.positive { color: #45dab5; }
.kpi-trend.warning { color: #c8b9ff; }
.kpi-trend.neutral { color: #77839a; }
.progress-track { background: #283149; }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span {
  background: linear-gradient(90deg, #7957f4, #39d6c4);
  box-shadow: 0 0 14px rgba(83,100,245,.28);
}
.plan-note { color: #7f8ba2; }
.section-kicker { color: #9a7cff; }
.section-heading h2 { color: #f1f3fb; }
.chart-style-toggle,
.chart-metric-toggle {
  border-color: #303951;
  background: #171f32;
  color: #8d99ae;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 6px 16px rgba(0,0,0,.16);
}
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color: #dcd5ff; border-color: #7056cc; background: #211c3d; }
.chart-style-toggle.active { color: #ad99ff; border-color: #7256d8; background: rgba(117,81,224,.18); }
.chart-metric-toggle,
.chart-metric-toggle.revenue { color: #d6a2ff; border-color: rgba(190,111,255,.42); background: rgba(161,82,232,.12); box-shadow: 0 6px 18px rgba(93,54,162,.18); }
.sort-label { color: #77849b; }
.site-count { background: #1d2537; color: #8996aa; }
.chart-site-tile {
  border-color: #273149;
  background: linear-gradient(180deg, color-mix(in srgb, var(--site-accent) 12%, #131b2d), #0c1322 64%);
  color: #edf2ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 7px 18px rgba(0,0,0,.2);
}
.chart-site-tile:hover { border-color: color-mix(in srgb, var(--site-accent) 65%, #3a4260); box-shadow: 0 10px 24px rgba(0,0,0,.27); }
.tile-short-name { color: #929eb2; }
.tile-value { color: #f1f4ff; }
.chart-site-tile small { color: #68768d; }
.tile-achievement.increase { color: #47d9b5; }
.tile-achievement.decrease { color: #ff718d; }
.tile-achievement.neutral { color: #667389; }
.chart-state { color: #6f7c92; }
.loader { border-color: #2b344b; border-top-color: #805dff; }
.site-list::-webkit-scrollbar-thumb { background: #343e58; }
.plant-performance-card {
  border-color: #27344e;
  background:
    radial-gradient(circle at 85% 0%, rgba(121,86,240,.10), transparent 44%),
    linear-gradient(135deg, #111a2c, #0c1424);
  color: #f0f3ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.025), 0 8px 20px rgba(0,0,0,.2);
}
.plant-performance-card:hover { border-color: #6858ae; box-shadow: 0 11px 28px rgba(0,0,0,.28), 0 0 18px rgba(111,80,222,.08); }
.plant-card-identity small { color: #8c7ee1; }
.plant-card-identity strong { color: #eef1fc; }
.plant-card-output strong { color: #f4f6ff; }
.plant-card-output small { color: #8794a9; }
.capacity-track { background: #253049; }
.capacity-fill { background: linear-gradient(90deg, #7655ed, #40d5c7); box-shadow: 0 0 10px rgba(76,99,239,.27); }
.capacity-marker { border-bottom-color: #bfafff; filter: drop-shadow(0 0 4px rgba(151,126,255,.55)); }
.plant-card-footer { color: #68768d; }
.plant-card-footer strong { color: #b7c1d4; }
.plant-card-footer svg { color: #8f7ae5; }
.comparison-skeleton span { background: linear-gradient(90deg, #11192a, #202941, #11192a); background-size: 200% 100%; }

@media (max-width: 600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 5% 2%, rgba(125,87,245,.15), transparent 18rem),
      radial-gradient(circle at 100% 35%, rgba(55,211,198,.06), transparent 18rem),
      #070b16;
  }
  .dashboard-header .date-badge { background: rgba(15,22,39,.78); }
  .kpi-card,
  .dashboard-card { background: linear-gradient(145deg, #11182a, #0c1322); }
  .chart-site-strip { scrollbar-color: #35405a transparent; }
}

/* Premium energy-green executive theme */
.dashboard-page {
  background:
    radial-gradient(ellipse at 50% -12%, rgba(132, 195, 67, .25), transparent 29rem),
    radial-gradient(circle at 96% 34%, rgba(184, 221, 73, .055), transparent 25rem),
    linear-gradient(150deg, #050705, #080b08 55%, #060806);
  color: #f3f6ef;
}
.dashboard-page::before { border-color: rgba(142,201,75,.045); }
.dashboard-page::after { background: radial-gradient(circle, rgba(154,205,75,.06), transparent 68%); }
.dashboard-header {
  border-color: rgba(142,202,74,.24);
  background:
    radial-gradient(ellipse at 52% -45%, rgba(154,213,77,.30), transparent 52%),
    linear-gradient(125deg, rgba(11,16,10,.98), rgba(7,11,7,.99) 58%, rgba(12,17,10,.98));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 22px 55px rgba(0,0,0,.40), 0 0 35px rgba(119,178,55,.08);
}
.dashboard-header::after { border-color: rgba(159,211,82,.07); }
.dashboard-header .eyebrow { color: #a9dc67; }
.dashboard-header h1 { color: #f6f8f3; }
.dashboard-header .header-subtitle { color: #879081; }
.dashboard-header .date-badge {
  border-color: rgba(145,198,77,.28);
  background: rgba(16,22,14,.82);
  color: #e9f1e2;
}
.period-tabs { border-color: #252c22; background: rgba(17,21,16,.95); }
.period-tabs button { color: #92998e; }
.period-tabs button:hover { color: #cfe9a9; background: rgba(139,195,74,.08); }
.period-tabs button.active {
  background: linear-gradient(120deg, #9bd65b, #73ad39);
  color: #091008;
  box-shadow: 0 8px 22px rgba(119,174,57,.30), inset 0 1px 0 rgba(255,255,255,.30);
}
.filter-panel { border-color: #272e24; background: rgba(15,19,14,.98); }
.filter-field label { color: #929a8d; }
.filter-field input,
.filter-field select { border-color: #30392d; background: #090c08; color: #f0f4ec; }
.filter-field input:focus,
.filter-field select:focus { border-color: #82bb43; box-shadow: 0 0 0 3px rgba(130,187,67,.13); }
.apply-button { background: linear-gradient(120deg,#96d154,#68a22f); color: #081007; box-shadow: 0 8px 20px rgba(104,158,50,.27); }
.kpi-card,
.dashboard-card {
  border-color: #252d23;
  background:
    radial-gradient(circle at 92% 0%, rgba(141,202,72,.055), transparent 40%),
    linear-gradient(145deg, rgba(18,22,17,.99), rgba(10,14,10,.99));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 20px 50px rgba(0,0,0,.36);
}
.kpi-card::before,
.kpi-card:nth-child(2)::before { background: linear-gradient(#a8dc63,#668f34); }
.kpi-heading p { color: #a2aa9d; }
.kpi-heading strong { color: #f7f9f4; }
.kpi-heading small { color: #a4aca0; }
.kpi-trend.positive { color: #8edc77; }
.kpi-trend.warning { color: #b8dc78; }
.progress-track { background: #2b3128; }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span { background: linear-gradient(90deg,#79b63b,#b9df67); box-shadow: 0 0 13px rgba(133,190,65,.26); }
.plan-note { color: #858e81; }
.section-kicker { color: #a1d65e; }
.section-heading h2 { color: #f2f5ef; }
.chart-style-toggle,
.chart-metric-toggle { border-color: #323a2f; background: #171c16; color: #939c8f; }
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color: #d5edb0; border-color: #6f9d3c; background: #1d2819; }
.chart-style-toggle.active { color: #b8e576; border-color: #719f3e; background: rgba(134,193,66,.15); }
.chart-metric-toggle,
.chart-metric-toggle.revenue { color: #b7df71; border-color: rgba(139,195,74,.40); background: rgba(121,172,60,.12); box-shadow: 0 6px 18px rgba(76,111,34,.17); }
.sort-label { color: #7d8679; }
.site-count { background: #1d231c; color: #929b8e; }
.chart-site-tile {
  border-color: #293127;
  background: linear-gradient(180deg, color-mix(in srgb, var(--site-accent) 8%, #171c15), #0b0f0b 66%);
  color: #f0f4ec;
}
.tile-short-name { color: #969f92; }
.tile-value { color: #f4f7f1; }
.chart-site-tile small { color: #747d70; }
.tile-achievement.increase { color: #8fda75; }
.tile-achievement.decrease { color: #e17d75; }
.loader { border-color: #30372e; border-top-color: #91cc4d; }
.site-list::-webkit-scrollbar-thumb { background: #394134; }
.plant-performance-card {
  border-color: #293528;
  background:
    radial-gradient(circle at 86% 0%, rgba(143,204,76,.085), transparent 46%),
    linear-gradient(135deg,#131a12,#0b110c);
  color: #f2f5ef;
}
.plant-performance-card:hover { border-color: #638f38; box-shadow: 0 12px 28px rgba(0,0,0,.30),0 0 18px rgba(118,174,53,.07); }
.plant-card-identity small { color: #9ac65f; }
.plant-card-identity strong { color: #eff3eb; }
.plant-card-output strong { color: #f6f8f3; }
.plant-card-output small { color: #8d968a; }
.capacity-track { background: #293128; }
.capacity-fill { background: linear-gradient(90deg,#78b43c,#b7df66); box-shadow: 0 0 10px rgba(125,181,60,.25); }
.capacity-marker { border-bottom-color: #c9ed91; filter: drop-shadow(0 0 4px rgba(161,212,87,.48)); }
.plant-card-footer { color: #737d70; }
.plant-card-footer strong { color: #b7c1b1; }
.plant-card-footer svg { color: #91bf56; }
.comparison-skeleton span { background: linear-gradient(90deg,#121712,#22291f,#121712); background-size: 200% 100%; }

@media (max-width: 600px) {
  .dashboard-page { background: radial-gradient(ellipse at 50% -8%, rgba(132,195,67,.20), transparent 21rem), #050705; }
  .dashboard-header .date-badge { background: rgba(15,20,14,.84); }
  .kpi-card,
  .dashboard-card { background: linear-gradient(145deg,#121711,#0a0e0a); }
  .chart-site-strip { scrollbar-color: #3a4336 transparent; }
}

/* Warm graphite executive theme */
.dashboard-page {
  background:
    radial-gradient(ellipse at 50% -15%, rgba(255,119,35,.19), transparent 31rem),
    radial-gradient(circle at 94% 48%, rgba(255,177,70,.045), transparent 24rem),
    linear-gradient(150deg,#101212,#171919 50%,#111313);
  color: #f5f3f0;
}
.dashboard-page::before { border-color: rgba(255,125,45,.035); }
.dashboard-page::after { background: radial-gradient(circle,rgba(255,136,46,.055),transparent 68%); }
.dashboard-header {
  border-color: rgba(255,132,55,.20);
  background:
    radial-gradient(ellipse at 50% -55%,rgba(255,128,38,.23),transparent 55%),
    linear-gradient(125deg,rgba(38,41,40,.98),rgba(20,23,23,.99) 58%,rgba(29,31,30,.98));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.055),0 22px 55px rgba(0,0,0,.38),0 0 32px rgba(237,98,20,.065);
}
.dashboard-header::after { border-color: rgba(255,143,63,.065); }
.dashboard-header .eyebrow { color: #ff9857; }
.dashboard-header h1 { color: #faf8f5; }
.dashboard-header .header-subtitle { color: #a19f9a; }
.dashboard-header .date-badge { border-color: rgba(255,143,71,.24); background: rgba(38,41,40,.74); color: #f0ede9; }
.period-tabs { border-color: #363a39; background: rgba(35,38,37,.94); }
.period-tabs button { color: #aaa9a5; }
.period-tabs button:hover { color: #ffd1b1; background: rgba(255,119,35,.08); }
.period-tabs button.active { background: linear-gradient(120deg,#ff7a23,#eb5a12); color: #fff; box-shadow: 0 8px 22px rgba(222,83,13,.31),inset 0 1px 0 rgba(255,255,255,.22); }
.filter-panel { border-color: #383c3b; background: rgba(31,34,33,.98); }
.filter-field label { color: #a5a39e; }
.filter-field input,
.filter-field select { border-color: #454948; background: #171919; color: #f4f1ed; }
.filter-field input:focus,
.filter-field select:focus { border-color: #f17428; box-shadow: 0 0 0 3px rgba(241,116,40,.13); }
.apply-button { background: linear-gradient(120deg,#ff7922,#df510e); color:#fff; box-shadow:0 8px 20px rgba(210,74,9,.27); }
.kpi-card,
.dashboard-card {
  border-color: #393d3c;
  background:
    radial-gradient(circle at 92% 0%,rgba(255,124,43,.045),transparent 40%),
    linear-gradient(145deg,rgba(37,40,39,.99),rgba(24,27,27,.99));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.045),0 20px 50px rgba(0,0,0,.34);
}
.kpi-card::before,
.kpi-card:nth-child(2)::before { background:linear-gradient(#ff842f,#d65112); }
.kpi-heading p { color:#b3b1ac; }
.kpi-heading strong { color:#fbfaf7; }
.kpi-heading small { color:#aaa8a3; }
.kpi-trend.positive { color:#8ed0a4; }
.kpi-trend.warning { color:#ffad72; }
.progress-track { background:#424645; }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#ff7020,#ffad4f); box-shadow:0 0 13px rgba(242,100,24,.27); }
.plan-note { color:#96948f; }
.section-kicker { color:#ff8c42; }
.section-heading h2 { color:#f6f4f1; }
.chart-style-toggle,
.chart-metric-toggle { border-color:#454948; background:#2c302f; color:#aaa9a5; }
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color:#ffd2b2; border-color:#ae5e2f; background:#3b3029; }
.chart-style-toggle.active { color:#ffab70; border-color:#bb6733; background:rgba(255,119,35,.14); }
.chart-metric-toggle,
.chart-metric-toggle.revenue { color:#ffc071; border-color:rgba(255,166,65,.38); background:rgba(255,138,37,.11); box-shadow:0 6px 18px rgba(137,61,13,.16); }
.sort-label { color:#8f8e8a; }
.site-count { background:#303332; color:#aaa9a5; }
.chart-site-tile { border-color:#3b403e; background:linear-gradient(180deg,color-mix(in srgb,var(--site-accent) 7%,#2b2e2d),#1a1d1d 67%); color:#f5f3ef; }
.tile-short-name { color:#aeaca7; }
.tile-value { color:#f8f6f2; }
.chart-site-tile small { color:#85837f; }
.tile-achievement.increase { color:#89d0a2; }
.tile-achievement.decrease { color:#f08a7f; }
.loader { border-color:#454847; border-top-color:#ff7625; }
.site-list::-webkit-scrollbar-thumb { background:#4b4f4d; }
.plant-performance-card { border-color:#3c4541; background:radial-gradient(circle at 86% 0%,rgba(255,124,43,.07),transparent 46%),linear-gradient(135deg,#292d2c,#1b1e1e); color:#f5f3ef; }
.plant-performance-card:hover { border-color:#a55f36; box-shadow:0 12px 28px rgba(0,0,0,.29),0 0 18px rgba(224,92,18,.06); }
.plant-card-identity small { color:#e09260; }
.plant-card-identity strong { color:#f2f0ec; }
.plant-card-output strong { color:#faf8f5; }
.plant-card-output small { color:#9b9994; }
.capacity-track { background:#3b4140; }
.capacity-fill { background:linear-gradient(90deg,#ff7020,#ffad50); box-shadow:0 0 10px rgba(234,94,18,.24); }
.capacity-marker { border-bottom-color:#ffd0af; filter:drop-shadow(0 0 4px rgba(255,145,75,.44)); }
.plant-card-footer { color:#838682; }
.plant-card-footer strong { color:#c6c4bf; }
.plant-card-footer svg { color:#dc8751; }
.comparison-skeleton span { background:linear-gradient(90deg,#232625,#373b39,#232625); background-size:200% 100%; }

@media (max-width:600px) {
  .dashboard-page { background:radial-gradient(ellipse at 50% -8%,rgba(255,119,35,.16),transparent 21rem),#101212; }
  .dashboard-header .date-badge { background:rgba(34,37,36,.82); }
  .kpi-card,
  .dashboard-card { background:linear-gradient(145deg,#282b2a,#191c1c); }
  .chart-site-strip { scrollbar-color:#4d514f transparent; }
}

/* Light blue gradient executive theme */
.dashboard-page {
  background:
    radial-gradient(circle at 7% 0%,rgba(74,162,239,.20),transparent 30rem),
    radial-gradient(circle at 96% 24%,rgba(112,210,240,.15),transparent 27rem),
    linear-gradient(145deg,#f7fbff 0%,#edf5fc 55%,#f6fbff 100%);
  color:#173550;
}
.dashboard-page::before { border-color:rgba(52,142,222,.045); }
.dashboard-page::after { background:radial-gradient(circle,rgba(88,183,237,.10),transparent 68%); }
.dashboard-header {
  border-color:rgba(255,255,255,.55);
  background:
    radial-gradient(circle at 86% -28%,rgba(255,255,255,.32),transparent 42%),
    linear-gradient(125deg,#2386e5,#56a8ee 58%,#9bd0f7);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 20px 48px rgba(45,126,190,.22);
}
.dashboard-header::after { border-color:rgba(255,255,255,.13); }
.dashboard-header h1 { color:#fff; text-shadow:0 2px 10px rgba(22,92,154,.16); }
.dashboard-header .date-badge { border-color:rgba(255,255,255,.46); background:rgba(255,255,255,.18); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.20),0 7px 18px rgba(31,101,164,.10); }
.period-tabs { border-color:#d7e6f2; background:rgba(255,255,255,.92); box-shadow:0 12px 30px rgba(48,108,155,.11); }
.period-tabs button { color:#6d8295; }
.period-tabs button:hover { color:#227cc8; background:#edf7ff; }
.period-tabs button.active { background:linear-gradient(120deg,#2c8dea,#1874ce); color:#fff; box-shadow:0 8px 20px rgba(35,126,207,.27); }
.filter-panel { border-color:#d8e6f0; background:rgba(255,255,255,.97); box-shadow:0 16px 38px rgba(45,104,148,.11); }
.filter-field label { color:#617c91; }
.filter-field input,
.filter-field select { border-color:#ccdfe9; background:#f8fcff; color:#193b57; }
.filter-field input:focus,
.filter-field select:focus { border-color:#378fdc; box-shadow:0 0 0 3px rgba(55,143,220,.11); }
.filter-field input::-webkit-calendar-picker-indicator { filter:none; }
.apply-button { background:linear-gradient(120deg,#2e91e9,#1e73c7); color:#fff; box-shadow:0 8px 20px rgba(35,120,192,.22); }
.kpi-card,
.dashboard-card { border-color:rgba(174,204,224,.55); background:rgba(255,255,255,.96); box-shadow:0 18px 45px rgba(44,103,146,.105); }
.kpi-card::before { background:linear-gradient(#2e91e9,#74c7f2); }
.kpi-card:nth-child(2)::before { background:linear-gradient(#39b8d9,#74d2a9); }
.kpi-heading p { color:#60798d; }
.kpi-heading strong { color:#143a59; }
.kpi-heading small { color:#60798d; }
.metric-icon.energy { border-color:rgba(52,149,229,.22); background:linear-gradient(145deg,#58b3f2,#247ed4); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 9px 22px rgba(40,130,205,.19); }
.metric-icon.revenue { border-color:rgba(56,183,173,.22); background:linear-gradient(145deg,#61cdd5,#2aa89e); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 9px 22px rgba(38,155,147,.18); }
.kpi-trend.positive { color:#2da06b; }
.kpi-trend.warning { color:#327fc2; }
.progress-track { background:#e1edf4; }
.progress-track span { background:linear-gradient(90deg,#2d8dea,#68baf1); box-shadow:0 0 12px rgba(47,141,234,.19); }
.kpi-card:nth-child(2) .progress-track span { background:linear-gradient(90deg,#31a9d2,#6dcba7); }
.plan-note { color:#657e90; }
.section-kicker { color:#2c85cf; }
.section-heading h2 { color:#193b57; }
.chart-style-toggle,
.chart-metric-toggle { border-color:#cadde9; background:#f2f8fc; color:#668196; box-shadow:0 5px 14px rgba(49,106,148,.07); }
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color:#217bc7; border-color:#83bce8; background:#eaf5fd; }
.chart-style-toggle.active { color:#237ed0; border-color:#75ade0; background:#e7f3ff; }
.chart-metric-toggle,
.chart-metric-toggle.revenue { color:#238db3; border-color:rgba(65,169,208,.38); background:#eaf8fc; box-shadow:0 6px 16px rgba(42,137,176,.10); }
.sort-label { color:#72889a; }
.site-count { background:#edf5f9; color:#617b8d; }
.chart-site-tile { border-color:#d4e2eb; background:linear-gradient(180deg,color-mix(in srgb,var(--site-accent) 8%,#fff),#f7fbfe 68%); color:#173a55; box-shadow:0 5px 15px rgba(42,101,145,.07); }
.tile-short-name { color:#647c8e; }
.tile-value { color:#153a57; }
.chart-site-tile small { color:#7b8f9d; }
.tile-achievement.increase { color:#259868; }
.tile-achievement.decrease { color:#d65761; }
.loader { border-color:#dce9f1; border-top-color:#2f8dea; }
.site-list::-webkit-scrollbar-thumb { background:#b8cfdd; }
.plant-performance-card { border-color:#d2e1eb; background:radial-gradient(circle at 86% 0%,rgba(49,145,226,.08),transparent 46%),linear-gradient(135deg,#fff,#f5faff); color:#163a56; box-shadow:0 7px 20px rgba(42,101,145,.075); }
.plant-performance-card:hover { border-color:#73afe0; box-shadow:0 11px 26px rgba(36,112,173,.13); }
.plant-card-identity small { color:#4389bb; }
.plant-card-identity strong { color:#173b57; }
.plant-card-output strong { color:#155c8c; }
.plant-card-output small { color:#667f91; }
.capacity-track { background:#dce9f1; }
.capacity-fill { background:linear-gradient(90deg,#2d8dea,#65c4e9); box-shadow:0 0 9px rgba(44,142,217,.18); }
.capacity-marker { border-bottom-color:#237cc6; filter:drop-shadow(0 0 3px rgba(35,124,198,.24)); }
.plant-card-footer { color:#72899a; }
.plant-card-footer strong { color:#3e657c; }
.plant-card-footer svg { color:#3d8bc5; }
.comparison-skeleton span { background:linear-gradient(90deg,#edf4f8,#dceaf2,#edf4f8); background-size:200% 100%; }

@media (max-width:600px) {
  .dashboard-page { background:radial-gradient(circle at 8% 0%,rgba(65,154,233,.17),transparent 20rem),linear-gradient(145deg,#f7fbff,#edf5fc); }
  .dashboard-header .date-badge { background:rgba(255,255,255,.18); }
  .kpi-card,
  .dashboard-card { background:rgba(255,255,255,.97); }
  .chart-site-strip { scrollbar-color:#b9cfdd transparent; }
}

/* Aurora glass executive theme */
.dashboard-page {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 3%, rgba(58, 126, 255, .34), transparent 30rem),
    radial-gradient(circle at 92% 8%, rgba(221, 72, 255, .28), transparent 30rem),
    radial-gradient(circle at 55% 78%, rgba(30, 214, 205, .14), transparent 34rem),
    linear-gradient(145deg, #071229 0%, #111543 45%, #1c0f42 100%);
  color: #f7f8ff;
}
.dashboard-page::before {
  inset: -15% auto auto -9%;
  width: 36rem;
  height: 36rem;
  border: 0;
  background: radial-gradient(circle, rgba(91, 184, 255, .18), transparent 64%);
  filter: blur(8px);
}
.dashboard-page::after {
  right: -12rem;
  bottom: -14rem;
  left: auto;
  width: 42rem;
  height: 42rem;
  background: radial-gradient(circle, rgba(195, 70, 255, .19), transparent 65%);
  filter: blur(14px);
}
.executive-dashboard { position: relative; z-index: 1; }
.dashboard-header {
  position: relative;
  overflow: hidden;
  padding: 26px 28px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 24px;
  background:
    radial-gradient(circle at 86% 20%, rgba(240,103,255,.35), transparent 34%),
    linear-gradient(120deg, rgba(45,116,242,.72), rgba(91,72,204,.64) 58%, rgba(172,58,213,.60));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.24), 0 24px 64px rgba(2,7,35,.38), 0 0 42px rgba(103,92,255,.14);
  backdrop-filter: blur(24px) saturate(145%);
}
.dashboard-header::after {
  top: -90px;
  right: 9%;
  width: 230px;
  height: 230px;
  border: 38px solid rgba(255,255,255,.07);
}
.dashboard-header h1 { color: #fff; text-shadow: 0 2px 16px rgba(10,15,60,.28); }
.dashboard-header .date-badge {
  border-color: rgba(255,255,255,.26);
  background: rgba(10,18,54,.28);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.15), 0 10px 28px rgba(10,8,48,.22);
  backdrop-filter: blur(18px);
}
.period-tabs {
  border-color: rgba(255,255,255,.14);
  background: rgba(11,18,48,.50);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 16px 36px rgba(2,7,35,.24);
  backdrop-filter: blur(22px);
}
.period-tabs button { color: #aeb7d5; }
.period-tabs button:hover { color: #fff; background: rgba(137,113,255,.12); }
.period-tabs button.active {
  background: linear-gradient(120deg,#6d83ff,#985af2 62%,#cf62e8);
  color: #fff;
  box-shadow: 0 9px 24px rgba(114,75,238,.38), inset 0 1px 0 rgba(255,255,255,.25);
}
.filter-panel {
  border-color: rgba(255,255,255,.14);
  background: rgba(13,21,54,.68);
  box-shadow: 0 18px 46px rgba(2,7,35,.30);
  backdrop-filter: blur(24px);
}
.filter-field label { color: #b3bddb; }
.filter-field input,
.filter-field select {
  border-color: rgba(165,178,235,.23);
  background: rgba(4,10,34,.50);
  color: #f6f7ff;
}
.filter-field input:focus,
.filter-field select:focus { border-color: #9b80ff; box-shadow: 0 0 0 3px rgba(135,104,255,.17); }
.filter-field input::-webkit-calendar-picker-indicator { filter: invert(1); }
.apply-button {
  background: linear-gradient(120deg,#568cff,#8c5cf3);
  color: #fff;
  box-shadow: 0 10px 24px rgba(88,74,222,.31);
}
.kpi-card,
.dashboard-card {
  border-color: rgba(255,255,255,.14);
  background:
    radial-gradient(circle at 100% 0%, rgba(132,94,255,.13), transparent 42%),
    linear-gradient(145deg, rgba(31,44,91,.64), rgba(15,22,58,.66));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 22px 54px rgba(1,6,31,.32);
  backdrop-filter: blur(24px) saturate(135%);
}
.kpi-card { position: relative; overflow: hidden; }
.kpi-card::after {
  position: absolute;
  top: -75px;
  right: -65px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(82,203,255,.13), transparent 67%);
  content: "";
  pointer-events: none;
}
.kpi-card::before { background: linear-gradient(#5ce1f1,#6786ff); }
.kpi-card:nth-child(2)::before { background: linear-gradient(#c078ff,#ee72d8); }
.kpi-heading p { color: #b8c3df; }
.kpi-heading strong { color: #fff; text-shadow: 0 2px 18px rgba(96,143,255,.18); }
.kpi-heading small { color: #b9c5e0; }
.metric-icon.energy,
.metric-icon.revenue {
  border: 1px solid rgba(255,255,255,.18);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 10px 25px rgba(38,29,120,.28);
}
.metric-icon.energy { background: linear-gradient(145deg,rgba(66,211,235,.42),rgba(74,101,238,.48)); }
.metric-icon.revenue { background: linear-gradient(145deg,rgba(188,103,255,.43),rgba(225,78,182,.42)); }
.kpi-trend.positive { color: #66f1c5; }
.kpi-trend.warning { color: #c5b8ff; }
.progress-track { background: rgba(170,185,230,.17); }
.progress-track span { background: linear-gradient(90deg,#5ee1ec,#7182ff); box-shadow: 0 0 16px rgba(94,203,255,.34); }
.kpi-card:nth-child(2) .progress-track span { background: linear-gradient(90deg,#9d75ff,#ee75d7); }
.plan-note { color: #9faaca; }
.section-kicker { color: #79e4f4; }
.section-heading h2 { color: #fff; }
.chart-style-toggle,
.chart-metric-toggle {
  border-color: rgba(255,255,255,.17);
  background: rgba(15,23,60,.54);
  color: #bac4e4;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 8px 19px rgba(2,7,35,.18);
}
.chart-style-toggle:hover,
.chart-metric-toggle:hover { color: #fff; border-color: rgba(158,136,255,.7); background: rgba(117,88,229,.28); }
.chart-style-toggle.active { color: #ddd5ff; border-color: #9d83ff; background: rgba(129,91,240,.26); }
.chart-metric-toggle,
.chart-metric-toggle.revenue { color: #8ceafb; border-color: rgba(96,223,241,.42); background: rgba(73,196,226,.13); }
.sort-label { color: #939fbe; }
.site-count { background: rgba(125,137,188,.14); color: #bec8e3; }
.chart-site-tile {
  border-color: rgba(255,255,255,.14);
  background: linear-gradient(180deg,color-mix(in srgb,var(--site-accent) 17%,rgba(27,37,83,.82)),rgba(10,16,45,.78) 70%);
  color: #f6f7ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08),0 8px 20px rgba(0,4,28,.20);
}
.tile-short-name { color: #b8c2df; }
.tile-value { color: #fff; }
.chart-site-tile small { color: #8390b1; }
.tile-achievement.increase { color: #57ecc1; }
.tile-achievement.decrease { color: #ff839f; }
.loader { border-color: rgba(255,255,255,.16); border-top-color: #8e75ff; }
.site-list::-webkit-scrollbar-thumb { background: #4c5682; }
.plant-performance-card {
  border-color: rgba(137,158,221,.22);
  background:
    radial-gradient(circle at 85% 0%, rgba(116,92,247,.15), transparent 46%),
    linear-gradient(135deg,rgba(29,46,91,.76),rgba(10,19,49,.76));
  color: #f7f8ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.07),0 10px 26px rgba(0,5,33,.23);
  backdrop-filter: blur(16px);
}
.plant-performance-card:hover { border-color: rgba(119,207,255,.64); box-shadow:0 13px 30px rgba(0,4,31,.33),0 0 20px rgba(90,129,255,.10); }
.plant-card-identity small { color: #79dff2; }
.plant-card-identity strong,
.plant-card-output strong { color: #fff; }
.plant-card-output small { color: #a8b5d4; }
.capacity-track { background: rgba(169,186,230,.17); }
.capacity-fill { background: linear-gradient(90deg,#55dfdf,#5b9eff 58%,#a67cff); box-shadow: 0 0 12px rgba(81,183,245,.32); }
.capacity-marker { border-bottom-color: #e7e4ff; filter: drop-shadow(0 0 5px rgba(139,120,255,.62)); }
.plant-card-footer { color: #8290b2; }
.plant-card-footer strong { color: #ccd5ef; }
.plant-card-footer svg { color: #a98cff; }
.comparison-skeleton span { background: linear-gradient(90deg,rgba(27,37,79,.7),rgba(66,57,126,.72),rgba(27,37,79,.7)); background-size:200% 100%; }

@media (max-width:600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 8% 0%,rgba(53,123,255,.30),transparent 21rem),
      radial-gradient(circle at 100% 27%,rgba(204,62,255,.20),transparent 23rem),
      linear-gradient(155deg,#071229,#15123c 55%,#20103f);
  }
  .executive-dashboard { padding: 14px 10px 30px; }
  .dashboard-header { padding: 18px 16px; border-radius: 19px; }
  .dashboard-header .date-badge { background: rgba(8,15,45,.36); }
  .kpi-card,
  .dashboard-card { background: linear-gradient(145deg,rgba(29,42,87,.72),rgba(13,20,53,.72)); }
  .chart-site-strip { scrollbar-color:#56618e transparent; }
}

/* Sapphire-to-cyan transparent theme */
.dashboard-page {
  background:
    radial-gradient(circle at 8% 18%,rgba(35,55,222,.56),transparent 34rem),
    radial-gradient(circle at 96% 40%,rgba(77,226,239,.43),transparent 38rem),
    linear-gradient(118deg,#09106f 0%,#132da0 43%,#1777b6 72%,#55cbd5 100%);
}
.dashboard-page::before {
  inset:-8rem auto auto -10rem;
  width:38rem;
  height:38rem;
  background:radial-gradient(circle,rgba(79,101,255,.28),transparent 68%);
}
.dashboard-page::after {
  right:-10rem;
  bottom:-12rem;
  width:44rem;
  height:44rem;
  background:radial-gradient(circle,rgba(111,239,239,.23),transparent 67%);
}
.dashboard-header,
.kpi-card,
.dashboard-card,
.filter-panel,
.period-tabs {
  border-color:rgba(255,255,255,.25);
  background:linear-gradient(125deg,rgba(255,255,255,.105),rgba(255,255,255,.045));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 20px 55px rgba(0,14,75,.20);
  backdrop-filter:blur(22px) saturate(135%);
}
.dashboard-header {
  background:linear-gradient(112deg,rgba(56,76,210,.30),rgba(71,194,220,.20));
}
.dashboard-header::after { border-color:rgba(255,255,255,.08); }
.dashboard-header .date-badge,
.chart-style-toggle,
.chart-metric-toggle {
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
.filter-field input,
.filter-field select { border-color:rgba(255,255,255,.25); background:rgba(6,24,102,.22); }
.filter-field input:focus,
.filter-field select:focus { border-color:#8ce9f2; box-shadow:0 0 0 3px rgba(116,231,240,.16); }
.kpi-card::after { background:radial-gradient(circle,rgba(111,232,245,.17),transparent 67%); }
.kpi-card::before,
.kpi-card:nth-child(2)::before { background:linear-gradient(#83f1ee,#70a8ff); }
.metric-icon.energy,
.metric-icon.revenue {
  background:linear-gradient(145deg,rgba(255,255,255,.19),rgba(80,207,229,.19));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 10px 24px rgba(7,37,121,.20);
}
.progress-track { background:rgba(255,255,255,.16); }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span,
.capacity-fill { background:linear-gradient(90deg,#6df0e8,#79afff); box-shadow:0 0 14px rgba(111,226,246,.34); }
.section-kicker,
.plant-card-identity small { color:#84f4ef; }
.chart-style-toggle.active,
.chart-metric-toggle,
.chart-metric-toggle.revenue { border-color:rgba(133,239,245,.58); background:rgba(100,223,236,.15); color:#a4fbf6; }
.site-count { background:rgba(255,255,255,.10); color:#dcecff; }
.chart-site-tile,
.plant-performance-card {
  border-color:rgba(255,255,255,.20);
  background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(8,43,127,.16));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 10px 24px rgba(0,19,80,.16);
}
.plant-performance-card:hover { border-color:rgba(150,244,248,.74); box-shadow:0 13px 30px rgba(0,20,85,.24),0 0 22px rgba(99,222,238,.13); }
.capacity-track { background:rgba(255,255,255,.16); }
.capacity-marker { border-bottom-color:#c7ffff; }
.plant-card-footer svg { color:#8feff2; }

@media (max-width:600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 4% 10%,rgba(57,72,229,.48),transparent 22rem),
      radial-gradient(circle at 100% 44%,rgba(77,223,235,.35),transparent 24rem),
      linear-gradient(145deg,#080f6d,#163aa1 58%,#309ebd);
  }
  .kpi-card,
  .dashboard-card { background:linear-gradient(135deg,rgba(255,255,255,.105),rgba(255,255,255,.045)); }
}

/* Sky-grid glass executive theme */
.dashboard-page {
  background:
    radial-gradient(circle at 10% 6%,rgba(47,126,239,.34),transparent 34rem),
    radial-gradient(circle at 84% 72%,rgba(255,255,255,.62),transparent 35rem),
    linear-gradient(145deg,#6aa5f5 0%,#9fc8fb 45%,#dceafe 100%);
  color:#17385d;
}
.dashboard-page::before {
  inset:0;
  width:auto;
  height:auto;
  border:0;
  border-radius:0;
  background-image:
    linear-gradient(rgba(255,255,255,.19) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.19) 1px,transparent 1px);
  background-position:center 120px;
  background-size:40px 40px;
  opacity:.68;
  filter:none;
  mask-image:radial-gradient(ellipse 48% 56% at 50% 40%,#000 12%,transparent 76%);
}
.dashboard-page::after {
  right:-10rem;
  bottom:-12rem;
  width:39rem;
  height:39rem;
  background:radial-gradient(circle,rgba(255,255,255,.52),transparent 69%);
  filter:blur(8px);
}
.dashboard-header,
.kpi-card,
.dashboard-card,
.filter-panel,
.period-tabs {
  border-color:rgba(255,255,255,.58);
  background:linear-gradient(135deg,rgba(255,255,255,.48),rgba(255,255,255,.20));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.70),0 18px 48px rgba(42,94,158,.16);
  backdrop-filter:blur(22px) saturate(125%);
}
.dashboard-header {
  background:linear-gradient(115deg,rgba(39,117,224,.60),rgba(95,166,239,.38),rgba(255,255,255,.22));
}
.dashboard-header h1 { color:#fff; text-shadow:0 2px 14px rgba(22,76,142,.20); }
.dashboard-header::after { border-color:rgba(255,255,255,.14); }
.dashboard-header .date-badge {
  border-color:rgba(255,255,255,.58);
  background:rgba(255,255,255,.26);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 8px 24px rgba(37,95,161,.13);
}
.period-tabs button { color:#56769a; }
.period-tabs button:hover { color:#185ea8; background:rgba(255,255,255,.34); }
.period-tabs button.active,
.apply-button {
  background:linear-gradient(125deg,#397fe0,#69b4f1);
  color:#fff;
  box-shadow:0 9px 23px rgba(37,106,181,.24),inset 0 1px 0 rgba(255,255,255,.28);
}
.filter-field label { color:#496b8f; }
.filter-field input,
.filter-field select {
  border-color:rgba(90,143,195,.30);
  background:rgba(255,255,255,.45);
  color:#173b63;
}
.filter-field input:focus,
.filter-field select:focus { border-color:#4c91dc; box-shadow:0 0 0 3px rgba(63,132,210,.13); }
.filter-field input::-webkit-calendar-picker-indicator { filter:none; }
.kpi-card::after { background:radial-gradient(circle,rgba(89,168,238,.13),transparent 68%); }
.kpi-card::before,
.kpi-card:nth-child(2)::before { background:linear-gradient(#3b84dc,#72b8ef); }
.kpi-heading p { color:#52708f; }
.kpi-heading strong { color:#123d68; text-shadow:none; }
.kpi-heading small { color:#597795; }
.metric-icon.energy,
.metric-icon.revenue {
  border-color:rgba(255,255,255,.66);
  background:linear-gradient(145deg,rgba(255,255,255,.64),rgba(174,218,252,.48));
  color:#2374c8;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 9px 22px rgba(45,111,177,.13);
}
.kpi-trend.positive { color:#168a69; }
.kpi-trend.warning { color:#2d6fac; }
.progress-track,
.capacity-track { background:rgba(72,121,169,.17); }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span,
.capacity-fill { background:linear-gradient(90deg,#307fd5,#68b6eb); box-shadow:0 0 11px rgba(50,132,208,.20); }
.plan-note { color:#5d7893; }
.section-kicker { color:#2475bc; }
.section-heading h2 { color:#173d64; }
.chart-style-toggle,
.chart-metric-toggle,
.chart-metric-toggle.revenue {
  border-color:rgba(85,139,193,.28);
  background:rgba(255,255,255,.42);
  color:#286fae;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.60),0 7px 18px rgba(49,102,154,.09);
}
.chart-style-toggle:hover,
.chart-metric-toggle:hover,
.chart-style-toggle.active { color:#175f9e; border-color:#65a4dd; background:rgba(226,244,255,.70); }
.sort-label { color:#5e7893; }
.site-count { background:rgba(255,255,255,.42); color:#4c6c8a; }
.chart-site-tile,
.plant-performance-card {
  border-color:rgba(255,255,255,.62);
  background:linear-gradient(135deg,rgba(255,255,255,.52),rgba(222,242,255,.28));
  color:#173d62;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.70),0 9px 24px rgba(43,98,153,.11);
}
.chart-site-tile:hover,
.plant-performance-card:hover { border-color:rgba(62,137,207,.52); box-shadow:0 13px 28px rgba(39,104,165,.15); }
.tile-short-name,
.plant-card-output small { color:#597792; }
.tile-value,
.plant-card-identity strong,
.plant-card-output strong { color:#153f67; }
.chart-site-tile small,
.plant-card-footer { color:#69839b; }
.plant-card-identity small { color:#2d7cba; }
.capacity-marker { border-bottom-color:#2875bc; filter:drop-shadow(0 0 3px rgba(40,117,188,.25)); }
.plant-card-footer strong { color:#355f80; }
.plant-card-footer svg { color:#367fb7; }
.loader { border-color:rgba(44,110,171,.18); border-top-color:#347fc6; }
.site-list::-webkit-scrollbar-thumb { background:rgba(61,119,171,.38); }

@media (max-width:600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 8% 8%,rgba(51,126,231,.28),transparent 22rem),
      linear-gradient(150deg,#72aaf3,#a9cdf9 55%,#e1edfd);
  }
  .dashboard-header { background:linear-gradient(115deg,rgba(44,121,222,.62),rgba(125,190,240,.36)); }
  .kpi-card,
  .dashboard-card { background:linear-gradient(135deg,rgba(255,255,255,.50),rgba(255,255,255,.22)); }
}

/* Atmospheric cobalt glass theme */
.dashboard-page {
  background:
    radial-gradient(circle at 84% 102%,rgba(204,188,255,.42),transparent 26rem),
    radial-gradient(circle at 16% 82%,rgba(240,247,255,.34),transparent 29rem),
    linear-gradient(180deg,#263fe3 0%,#3973e4 27%,#68a9ea 58%,#dce9f7 100%);
  color:#17375d;
}
.dashboard-page::before {
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
  filter:none;
  mask-image:linear-gradient(90deg,transparent 2%,#000 25%,#000 76%,transparent 98%);
}
.dashboard-page::after {
  right:-12rem;
  bottom:-15rem;
  width:44rem;
  height:44rem;
  background:radial-gradient(circle,rgba(224,208,255,.42),transparent 68%);
  filter:blur(16px);
}
.dashboard-header,
.kpi-card,
.dashboard-card,
.filter-panel,
.period-tabs {
  border-color:rgba(255,255,255,.50);
  background:linear-gradient(145deg,rgba(255,255,255,.42),rgba(244,249,255,.18));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.68),0 20px 50px rgba(28,62,137,.16);
  backdrop-filter:blur(28px) saturate(120%);
}
.dashboard-header {
  background:linear-gradient(120deg,rgba(35,55,203,.54),rgba(72,132,226,.34),rgba(177,213,246,.20));
}
.dashboard-header .date-badge {
  border-color:rgba(255,255,255,.56);
  background:rgba(255,255,255,.18);
}
.period-tabs button.active,
.apply-button { background:linear-gradient(125deg,#3156db,#609de8); box-shadow:0 9px 24px rgba(37,74,176,.27),inset 0 1px 0 rgba(255,255,255,.30); }
.metric-icon.energy,
.metric-icon.revenue {
  border-color:rgba(255,255,255,.70);
  background:linear-gradient(145deg,rgba(255,255,255,.72),rgba(178,211,250,.43));
  color:#2e62c7;
}
.progress-track span,
.kpi-card:nth-child(2) .progress-track span,
.capacity-fill { background:linear-gradient(90deg,#365ed8,#73a9ea); box-shadow:0 0 12px rgba(61,102,205,.22); }
.section-kicker { color:#315fb3; }
.chart-style-toggle,
.chart-metric-toggle,
.chart-metric-toggle.revenue { color:#315ea9; background:rgba(255,255,255,.39); border-color:rgba(76,116,180,.27); }
.chart-site-tile,
.plant-performance-card {
  border-color:rgba(255,255,255,.62);
  background:linear-gradient(145deg,rgba(255,255,255,.48),rgba(235,245,255,.22));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.70),0 10px 26px rgba(34,77,145,.11);
}

@media (max-width:600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 82% 100%,rgba(205,190,255,.44),transparent 20rem),
      linear-gradient(180deg,#263fe3,#3974e4 30%,#6eaceb 62%,#dce9f7);
  }
  .dashboard-page::before { top:20%; left:-48%; width:190%; height:38%; }
  .dashboard-header { background:linear-gradient(120deg,rgba(35,55,203,.58),rgba(91,151,231,.30)); }
  .kpi-card,
  .dashboard-card { background:linear-gradient(145deg,rgba(255,255,255,.44),rgba(244,249,255,.19)); }
}

/* Teal banking-glass executive theme */
.dashboard-page {
  background:
    radial-gradient(circle at 7% 2%,rgba(0,202,207,.38),transparent 29rem),
    radial-gradient(circle at 100% 36%,rgba(17,130,158,.20),transparent 32rem),
    radial-gradient(circle at 50% 105%,rgba(3,12,44,.50),transparent 37rem),
    linear-gradient(160deg,#087d92 0%,#07516f 34%,#0a3559 62%,#0b1d42 100%);
  color:#f1f7fa;
}
.executive-dashboard {
  font-family:"Noto Sans Lao","Phetsarath",system-ui,sans-serif;
  font-weight:400;
  letter-spacing:.005em;
}
.dashboard-page::before {
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
  filter:none;
  mask-image:linear-gradient(90deg,transparent 2%,#000 28%,#000 74%,transparent 98%);
}
.dashboard-page::after {
  right:-12rem;
  bottom:-14rem;
  width:41rem;
  height:41rem;
  background:radial-gradient(circle,rgba(3,126,151,.18),transparent 68%);
  filter:blur(14px);
}
.dashboard-header,
.kpi-card,
.dashboard-card,
.filter-panel,
.period-tabs {
  border-color:rgba(112,227,230,.24);
  background:linear-gradient(145deg,rgba(8,79,105,.48),rgba(7,27,63,.42));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 20px 48px rgba(1,13,38,.24);
  backdrop-filter:blur(28px) saturate(125%);
}
.dashboard-header { background:linear-gradient(120deg,rgba(4,133,150,.51),rgba(7,75,104,.44),rgba(8,35,72,.38)); }
.dashboard-header h1 { color:#fff; font-weight:500; letter-spacing:.015em; text-shadow:0 2px 14px rgba(0,16,39,.24); }
.dashboard-header::after { border-color:rgba(45,216,218,.12); }
.dashboard-header .date-badge {
  border-color:rgba(111,230,232,.30);
  background:rgba(3,39,70,.28);
  color:#f7ffff;
  font-weight:400;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 22px rgba(0,18,45,.16);
}
.period-tabs button { color:rgba(225,240,245,.72); font-weight:500; }
.period-tabs button:hover { color:#fff; background:rgba(25,191,198,.10); }
.period-tabs button.active,
.apply-button { background:linear-gradient(125deg,#0db0ba,#087695); color:#fff; box-shadow:0 9px 24px rgba(0,71,101,.30),inset 0 1px 0 rgba(255,255,255,.18); }
.filter-field label { color:#a9c5d2; font-weight:400; }
.filter-field input,
.filter-field select { border-color:rgba(99,213,220,.24); background:rgba(3,30,62,.38); color:#f2fbfd; font-weight:400; }
.filter-field input:focus,
.filter-field select:focus { border-color:#2bcbd0; box-shadow:0 0 0 3px rgba(24,194,202,.13); }
.filter-field input::-webkit-calendar-picker-indicator { filter:invert(1); }
.kpi-card::after { background:radial-gradient(circle,rgba(21,200,205,.12),transparent 68%); }
.kpi-card::before,
.kpi-card:nth-child(2)::before { background:linear-gradient(#27d5d5,#0e8dad); }
.kpi-heading p { color:#aac2cf; font-weight:500; }
.kpi-heading strong { color:#fff; font-weight:600; letter-spacing:.01em; text-shadow:0 2px 14px rgba(10,199,205,.08); }
.kpi-heading small { color:#b6ced8; font-weight:500; }
.metric-icon.energy,
.metric-icon.revenue {
  border-color:rgba(73,222,224,.26);
  background:linear-gradient(145deg,rgba(18,178,186,.24),rgba(7,49,85,.34));
  color:#55e4df;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 9px 22px rgba(0,21,49,.20);
}
.kpi-trend.positive { color:#6ce2be; }
.kpi-trend.warning { color:#72d8e0; }
.progress-track,
.capacity-track { background:rgba(148,194,211,.17); }
.progress-track span,
.kpi-card:nth-child(2) .progress-track span,
.capacity-fill { background:linear-gradient(90deg,#18ccd0,#20a7c3); box-shadow:0 0 12px rgba(22,198,204,.25); }
.plan-note { color:#8daab9; font-weight:400; }
.section-kicker { color:#38d1d5; font-weight:600; }
.section-heading h2 { color:#f8fcfd; font-weight:500; letter-spacing:.012em; }
.chart-style-toggle,
.chart-metric-toggle,
.chart-metric-toggle.revenue {
  border-color:rgba(75,216,220,.24);
  background:rgba(5,41,74,.34);
  color:#65dbdd;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 7px 18px rgba(0,17,43,.16);
}
.chart-style-toggle:hover,
.chart-metric-toggle:hover,
.chart-style-toggle.active { border-color:rgba(65,224,225,.64); background:rgba(14,167,179,.20); color:#b4ffff; }
.sort-label { color:#91abb9; font-weight:400; }
.site-count {
  min-height:30px;
  padding:6px 11px;
  border:1px solid rgba(105,218,225,.14);
  background:rgba(48,130,151,.17);
  color:#c1dde5;
  font-size:clamp(.8rem,.72rem + .18vw,.9rem);
  font-weight:600;
  line-height:1.25;
}
.chart-site-tile,
.plant-performance-card {
  border-color:rgba(89,207,214,.20);
  background:linear-gradient(145deg,rgba(9,72,98,.43),rgba(5,27,60,.46));
  color:#f5fbfd;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 25px rgba(0,12,35,.20);
}
.chart-site-tile:hover,
.plant-performance-card:hover { border-color:rgba(59,216,220,.58); box-shadow:0 13px 28px rgba(0,14,39,.26),0 0 18px rgba(21,191,197,.08); }
.tile-short-name,
.plant-card-output small { color:#a1bbc7; font-weight:400; }
.tile-value,
.plant-card-identity strong,
.plant-card-output strong { color:#fff; font-weight:500; }
.chart-site-tile small,
.plant-card-footer { color:#7899aa; }
.plant-card-identity small { color:#4ed6da; font-weight:500; }
.capacity-marker { border-bottom-color:#9ff9f4; filter:drop-shadow(0 0 4px rgba(49,213,215,.38)); }
.plant-card-footer strong { color:#bad1db; font-weight:500; }
.plant-card-footer svg { color:#4bd5d6; }
.loader { border-color:rgba(96,174,194,.20); border-top-color:#25d0d0; }
.site-list::-webkit-scrollbar-thumb { background:rgba(42,159,177,.42); }

@media (max-width:600px) {
  .dashboard-page {
    background:
      radial-gradient(circle at 4% 0%,rgba(0,201,207,.31),transparent 20rem),
      linear-gradient(165deg,#087b90,#07516f 35%,#093657 64%,#0b1d42);
  }
  .dashboard-page::before { top:12%; left:-53%; width:205%; height:45%; }
  .dashboard-header { background:linear-gradient(120deg,rgba(4,132,150,.54),rgba(7,53,88,.40)); }
  .kpi-card,
  .dashboard-card { background:linear-gradient(145deg,rgba(8,76,101,.48),rgba(5,26,60,.46)); }
}

/* Semantic chart and KPI colors: actual = cyan, plan/revenue = gold */
.kpi-card:first-child::before { background:linear-gradient(#2fe1df,#129cb9); }
.kpi-card:nth-child(2)::before { background:linear-gradient(#ffd66e,#e6a63e); }
.metric-icon.revenue {
  border-color:rgba(247,198,87,.34);
  background:linear-gradient(145deg,rgba(232,174,61,.25),rgba(81,59,28,.30));
  color:#ffd46a;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 9px 22px rgba(45,29,4,.18);
}
.kpi-card:nth-child(2) .progress-track span {
  background:linear-gradient(90deg,#efb84d,#ffd76c);
  box-shadow:0 0 12px rgba(242,189,77,.24);
}
.chart-metric-toggle.revenue {
  border-color:rgba(247,199,91,.43);
  background:rgba(221,157,45,.13);
  color:#ffd46a;
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
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 5px 15px rgba(65,34,3,.10);
}
.kpi-trend.positive {
  border-color:rgba(83,226,155,.32);
  background:rgba(38,185,119,.12);
  color:#66e6a8;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 5px 15px rgba(3,56,37,.10);
}
.kpi-trend.neutral {
  border-color:rgba(158,184,198,.20);
  background:rgba(125,155,171,.10);
  color:#a8bec9;
}
.kpi-card.warning::before { background:linear-gradient(#ffc36d,#ed8c3c); }
.kpi-card.positive::before { background:linear-gradient(#65e6a7,#24ad78); }
.kpi-card.warning .progress-track span { background:linear-gradient(90deg,#ef9144,#ffc36d); box-shadow:0 0 12px rgba(242,155,67,.25); }
.kpi-card.positive .progress-track span { background:linear-gradient(90deg,#25b97c,#65e6a7); box-shadow:0 0 12px rgba(53,207,139,.25); }
.tile-achievement.increase,
.tile-achievement.decrease {
  padding:2px 5px;
  border:1px solid transparent;
  border-radius:999px;
}
.tile-achievement.increase { border-color:rgba(83,226,155,.25); background:rgba(38,185,119,.11); color:#66e6a8; }
.tile-achievement.decrease { border-color:rgba(255,180,82,.25); background:rgba(224,128,35,.11); color:#ffb863; }

/* Match dashboard KPI cards to the plant-detail summary cards */
.kpi-grid { gap:16px; margin-bottom:18px; }
.kpi-card::before,
.kpi-card.warning::before,
.kpi-card.positive::before { display:none; }
.kpi-card {
  display:flex;
  min-height:172px;
  flex-direction:column;
  justify-content:flex-start;
  padding:20px;
  border:1px solid rgba(87,207,214,.22);
  border-radius:16px;
  background:
    radial-gradient(circle at 92% 4%,rgba(26,189,197,.10),transparent 42%),
    linear-gradient(145deg,rgba(8,75,101,.56),rgba(5,28,63,.54));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.075),0 14px 34px rgba(0,13,37,.20);
}
.kpi-heading { align-items:flex-start; gap:12px; }
.kpi-heading p { margin-bottom:6px; font-size:.96rem; line-height:1.4; font-weight:600; }
.kpi-heading strong { font-size:clamp(1.65rem,2.8vw,2.2rem); line-height:1; }
.kpi-heading small { display:inline; margin-left:3px; font-size:.61rem; }
.metric-icon { width:42px; height:42px; flex:0 0 42px; border-radius:12px; }
.kpi-trend { margin-top:15px; padding:6px 10px; font-size:.69rem; font-weight:600; }
.progress-track { margin-top:12px; }
.plan-note {
  display:flex;
  margin-top:11px;
  align-items:baseline;
  gap:7px;
  flex-wrap:wrap;
  font-size:.86rem;
  line-height:1.4;
}
.plan-note strong { color:#d7e9ef; font-size:.9rem; font-weight:600; white-space:nowrap; }

@media (max-width:600px) {
  .kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .kpi-card { min-height:184px; padding:15px 12px; border-radius:14px; }
  .kpi-heading { gap:7px; }
  .kpi-heading p { font-size:.88rem; line-height:1.45; font-weight:600; }
  .kpi-heading strong { font-size:1.62rem; letter-spacing:-.02em; }
  .kpi-heading small { display:block; margin:6px 0 0; font-size:.65rem; }
  .metric-icon { width:37px; height:37px; flex-basis:37px; border-radius:10px; }
  .kpi-trend { min-height:0; margin-top:13px; padding:5px 8px; font-size:.68rem; line-height:1.35; }
  .progress-track { margin-top:11px; }
  .plan-note {
    display:flex;
    min-height:0;
    margin-top:9px;
    flex-direction:column;
    gap:2px;
    font-size:.86rem;
    line-height:1.35;
  }
  .plan-note strong { font-size:.86rem; line-height:1.4; }
  .plant-card-identity small { font-size:.66rem; }
  .plant-card-identity strong { overflow:visible; font-size:.82rem; text-overflow:clip; }
}

@media (max-width:340px) {
  .kpi-grid { grid-template-columns:1fr; }
  .kpi-card { min-height:0; }
}

/* Continuous dashboard atmosphere — avoids clipped decorative shading */
.period-tabs button {
  font-size:1rem;
  font-weight:600;
  line-height:1.25;
}
.dashboard-page {
  position:relative;
  isolation:isolate;
  overflow:hidden;
  background:
    radial-gradient(ellipse 72% 34% at 4% 0%,rgba(36,220,218,.24),transparent 72%),
    radial-gradient(ellipse 60% 48% at 106% 38%,rgba(30,143,184,.17),transparent 74%),
    radial-gradient(ellipse 85% 34% at 50% 104%,rgba(2,18,54,.34),transparent 76%),
    linear-gradient(165deg,#08788c 0%,#075a76 30%,#084566 58%,#092e53 80%,#0a2145 100%);
  background-repeat:no-repeat;
  background-size:cover;
}
.dashboard-page::before {
  inset:0;
  width:100%;
  height:100%;
  border:0;
  border-radius:0;
  background:
    linear-gradient(122deg,rgba(255,255,255,.045) 0%,transparent 31%,rgba(35,215,218,.025) 62%,transparent 100%),
    radial-gradient(ellipse 80% 30% at 48% 17%,rgba(35,213,216,.09),transparent 76%);
  opacity:1;
  filter:none;
  mask-image:none;
}
.dashboard-page::after {
  inset:0;
  width:100%;
  height:100%;
  border-radius:0;
  background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 24%,rgba(2,14,42,.10) 100%);
  opacity:1;
  filter:none;
}

/* Compact dashboard rhythm for desktop and tablet */
.executive-dashboard { padding:18px clamp(14px,2.2vw,32px) 32px; }
.dashboard-header {
  min-height:70px;
  margin-bottom:12px;
  padding:14px 18px;
  border-radius:18px;
}
.period-tabs { margin-bottom:12px; padding:4px; }
.period-tabs button { min-height:38px; }
.kpi-grid { gap:14px; margin-bottom:12px; }
.kpi-card { min-height:158px; padding:17px 18px; }
.kpi-trend { margin-top:12px; }
.progress-track { margin-top:9px; }
.plan-note { margin-top:8px; }
.dashboard-grid { gap:14px; }
.dashboard-card { padding:18px; }
.section-heading { margin-bottom:14px; }

@media (max-width:600px) {
  .dashboard-page {
    background:
      radial-gradient(ellipse 105% 24% at 5% 0%,rgba(37,219,217,.22),transparent 72%),
      radial-gradient(ellipse 90% 42% at 112% 42%,rgba(24,133,175,.15),transparent 74%),
      linear-gradient(168deg,#087489 0%,#075775 31%,#083f63 62%,#092b51 82%,#0a2145 100%);
  }
  .dashboard-page::before,
  .dashboard-page::after { inset:0; width:100%; height:100%; }
  .dashboard-header { min-height:84px; align-items:center; }
  .dashboard-header .brand-lockup {
    align-self:stretch;
    align-items:center;
  }
  .dashboard-header .brand-lockup > div {
    display:flex;
    min-height:100%;
    align-items:center;
  }
  .dashboard-header .brand-lockup h1 { margin:0; line-height:1.4; }

  /* Compact, consistent mobile vertical rhythm */
  .executive-dashboard { padding:10px 7px 22px; }
  .dashboard-header {
    min-height:66px;
    margin-bottom:10px;
    padding:10px 12px;
    border-radius:16px;
  }
  .dashboard-header .date-badge { height:38px; min-width:76px; padding:0 10px; }
  .period-tabs {
    margin-bottom:10px;
    padding:4px;
    border-radius:12px;
  }
  .period-tabs button { min-height:36px; font-size:.9rem; }
  .kpi-grid { gap:7px; margin-bottom:12px; }
  .kpi-card {
    min-height:172px;
    padding:12px 10px;
    border-radius:13px;
  }
  .kpi-trend { margin-top:10px; }
  .progress-track { margin-top:8px; }
  .plan-note { margin-top:7px; }
  .dashboard-grid { gap:12px; }
  .dashboard-card { padding:14px 11px; border-radius:14px; }
  .section-heading { margin-bottom:12px; }

  /* Keep the plot and its two-line plant labels, but remove the unused
     canvas footer that previously separated it from the next card. */
  .overview-card :deep(.bar-chart) { height:245px !important; }
}

@media (max-width:380px) {
  .overview-card :deep(.bar-chart) { height:235px !important; }
}

/* Keep the analytics chart inside its card after responsive layout changes. */
.executive-dashboard,
.dashboard-grid,
.overview-card {
  min-width:0;
  max-width:100%;
}
.overview-card { overflow:hidden; }
.overview-card :deep(.bar-chart) {
  width:100% !important;
  max-width:100%;
  min-width:0;
}

.filter-panel {
  width:min(100%,720px);
  box-sizing:border-box;
}
.filter-field { min-width:0; }

.overview-card .section-heading {
  align-items:center;
  flex-wrap:wrap;
}
.chart-section-title {
  display:flex;
  min-width:0;
  align-items:center;
  gap:9px;
}
.chart-section-title h2 { margin:0; }
.chart-title-icon {
  display:grid;
  width:32px;
  height:32px;
  flex:0 0 32px;
  place-items:center;
  border:1px solid rgba(86,231,230,.42);
  border-radius:10px;
  background:linear-gradient(145deg,rgba(25,198,203,.25),rgba(19,91,145,.24));
  color:#8cfff7;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 6px 16px rgba(0,25,63,.16);
}
.chart-section-title.revenue .chart-title-icon {
  border-color:rgba(247,199,91,.48);
  background:linear-gradient(145deg,rgba(221,157,45,.22),rgba(116,77,18,.20));
  color:#ffd462;
}
.chart-heading-actions {
  min-width:0;
  margin-left:auto;
}
.chart-metric-filter {
  display:inline-flex;
  align-items:center;
  gap:2px;
  padding:2px;
  border:1px solid rgba(113,220,230,.24);
  border-radius:10px;
  background:rgba(4,42,76,.24);
}
.chart-metric-toggle,
.chart-metric-toggle.revenue {
  display:grid;
  width:34px;
  min-width:34px;
  height:34px;
  grid-template-columns:1fr;
  place-items:center;
  gap:0;
  padding:0;
  border-color:transparent;
  border-radius:8px;
  background:transparent;
  color:rgba(210,236,244,.72);
  box-shadow:none;
}
.chart-metric-toggle.active {
  border-color:rgba(103,240,236,.55);
  background:linear-gradient(135deg,rgba(30,194,207,.34),rgba(54,126,214,.26));
  color:#8cfff7;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 5px 14px rgba(0,23,62,.18);
}
.chart-metric-toggle.revenue.active {
  border-color:rgba(255,208,87,.55);
  background:linear-gradient(135deg,rgba(218,164,39,.30),rgba(164,108,22,.22));
  color:#ffd462;
}

/* A navigation drawer leaves tablets less horizontal room than the viewport
   suggests, so stack analytics before either card becomes cramped. */
@media (max-width:1100px) {
  .dashboard-grid { grid-template-columns:minmax(0,1fr); }
  .site-list { max-height:none; }
}

@media (min-width:601px) and (max-width:1100px) {
  .executive-dashboard { padding-inline:18px; }
  .overview-card,
  .comparison-card { width:100%; }
}

@media (max-width:600px) {
  .filter-panel {
    display:grid;
    grid-template-columns:minmax(0,1fr);
    align-items:stretch;
    gap:10px;
    margin:0 auto 12px;
    padding:12px;
  }
  .filter-field,
  .apply-button {
    width:100%;
    min-width:0;
  }
  .chart-heading-actions { flex:0 0 auto; gap:5px; }
  .chart-section-title { gap:7px; }
  .chart-title-icon { width:30px; height:30px; flex-basis:30px; border-radius:9px; }
  .chart-metric-filter { gap:2px; padding:2px; }
  .chart-metric-toggle,
  .chart-metric-toggle.revenue {
    width:34px;
    min-width:34px;
    height:34px;
    grid-template-columns:1fr;
    padding:0;
  }
  .chart-style-toggle { width:34px; height:34px; flex-basis:34px; }
  /* The site values belong below the plot, never on top of its x-axis. */
  .chart-site-strip {
    display:grid;
    grid-template-columns:none;
    grid-auto-flow:column;
    grid-auto-columns:minmax(82px,1fr);
    width:100%;
    max-width:100%;
    gap:5px;
    margin:14px 0 0;
    padding:11px 0 5px;
    overflow-x:auto;
    overflow-y:hidden;
    scroll-snap-type:x proximity;
    overscroll-behavior-inline:contain;
    scrollbar-width:thin;
    scrollbar-color:rgba(109,240,232,.5) transparent;
  }
  .chart-site-strip::-webkit-scrollbar { height:4px; }
  .chart-site-strip::-webkit-scrollbar-track { background:transparent; }
  .chart-site-strip::-webkit-scrollbar-thumb {
    border-radius:999px;
    background:rgba(109,240,232,.5);
  }
  .chart-site-tile {
    min-width:82px;
    min-height:54px;
    padding:8px 6px 5px;
    scroll-snap-align:start;
  }
  .tile-short-name { font-size:.52rem; }
  .tile-value { font-size:.74rem; }
  .chart-site-tile small,
  .tile-achievement { font-size:.43rem; }
}

/* The details panel becomes the primary full-width content after removing the chart. */
.dashboard-grid.details-only-grid {
  grid-template-columns:minmax(0,1fr);
}
.details-only-grid .comparison-card {
  width:100%;
  min-width:0;
}
.details-only-grid .site-list {
  grid-template-columns:repeat(3,minmax(0,1fr));
  max-height:none;
}

@media (min-width:601px) and (max-width:1100px) {
  .details-only-grid .site-list { grid-template-columns:repeat(2,minmax(0,1fr)); }
}

@media (max-width:600px) {
  .details-only-grid .site-list { grid-template-columns:minmax(0,1fr); }
}

/* Keep each KPI symbol attached to its label instead of floating at the edge. */
.kpi-card { min-height:0; }
.kpi-heading {
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:flex-start;
  gap:8px 12px;
}
.kpi-heading .kpi-title {
  display:flex;
  min-width:0;
  margin:0;
  align-items:center;
  gap:8px;
}
.kpi-title .metric-icon {
  width:30px;
  height:30px;
  flex:0 0 30px;
  border-radius:9px;
}
.kpi-heading .kpi-actual-value {
  display:flex;
  min-width:0;
  grid-column:1 / -1;
  align-items:baseline;
  gap:5px;
  flex-wrap:nowrap;
  font-size:clamp(1.45rem,2.8vw,2rem);
  font-variant-numeric:tabular-nums;
  line-height:1;
  white-space:nowrap;
}
.kpi-heading .kpi-value-label,
.kpi-card .plan-note > span {
  flex:0 0 auto;
  color:#91afbb;
  font-size:.72rem;
  font-weight:600;
  line-height:1.2;
}
.kpi-heading .kpi-value-number { font-size:inherit; }
.kpi-heading .kpi-actual-value small,
.plan-note .kpi-plan-value small {
  display:inline;
  margin:0;
  color:#9cb7c2;
  font-size:.62rem;
  font-weight:600;
  line-height:1;
}
.plan-note .kpi-plan-value {
  display:inline-flex;
  align-items:baseline;
  gap:3px;
  font-size:.95rem;
  font-variant-numeric:tabular-nums;
  line-height:1.2;
  white-space:nowrap;
}
.kpi-card .plan-note {
  display:flex;
  flex-direction:row;
  align-items:baseline;
  gap:6px;
  flex-wrap:nowrap;
  white-space:nowrap;
}
.kpi-card .plan-note > span { flex:0 0 auto; }
.kpi-heading .kpi-percentage {
  display:inline-flex;
  flex:0 0 auto;
  padding-top:5px;
  align-items:center;
  gap:5px;
  color:#ffbd5d;
  font-size:clamp(1rem,1.8vw,1.3rem);
  font-variant-numeric:tabular-nums;
  line-height:1;
  white-space:nowrap;
}
.kpi-percentage > svg { flex:0 0 auto; }
.kpi-card.positive .kpi-percentage { color:#70e2ad; }
.kpi-card.neutral .kpi-percentage { color:#91aeba; }
.metric-icon.inflow {
  border-color:rgba(82,226,216,.42);
  background:linear-gradient(145deg,rgba(34,197,181,.30),rgba(30,122,167,.24));
  color:#75f1e5;
}
.metric-icon.outflow {
  border-color:rgba(98,184,255,.42);
  background:linear-gradient(145deg,rgba(47,151,218,.31),rgba(60,98,190,.24));
  color:#86d7ff;
}
.metric-icon.water-volume {
  border-color:rgba(101,211,255,.44);
  background:linear-gradient(145deg,rgba(37,180,218,.32),rgba(65,106,199,.24));
  color:#8ce6ff;
}
.water-volume-kpi { grid-column:1 / -1; }
.water-kpi.inflow .progress-track span {
  background:linear-gradient(90deg,#2bcab9,#72eadc);
  box-shadow:0 0 12px rgba(61,211,196,.26);
}
.water-kpi.outflow .progress-track span {
  background:linear-gradient(90deg,#369ed8,#71cdf2);
  box-shadow:0 0 12px rgba(69,174,224,.26);
}
.water-volume-kpi .progress-track span {
  background:linear-gradient(90deg,#2db8d7,#7adff0);
  box-shadow:0 0 12px rgba(70,196,222,.28);
}
.kpi-card.water .kpi-percentage { color:#78d9f6; }
.dashboard-toolbar {
  display:block;
  width:min(620px,100%);
  margin:0 auto 12px;
}
.dashboard-toolbar .period-tabs {
  width:100%;
  max-width:none;
  margin:0;
}
.plant-details-button {
  display:inline-flex;
  min-height:48px;
  align-items:center;
  justify-content:center;
  gap:7px;
  padding:0 16px;
  border:1px solid rgba(101,220,229,.28);
  border-radius:13px;
  background:rgba(5,55,87,.48);
  color:#b9d9e4;
  font-size:.86rem;
  font-weight:600;
  white-space:nowrap;
  cursor:pointer;
  transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease;
}
.plant-details-button:hover {
  transform:translateY(-1px);
  border-color:rgba(108,239,239,.55);
  background:rgba(13,105,131,.48);
  color:#fff;
}
.plant-details-button.active {
  border-color:rgba(103,240,236,.62);
  background:linear-gradient(135deg,rgba(27,190,200,.68),rgba(39,132,181,.62));
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 7px 18px rgba(0,29,65,.20);
}

.plant-view-toggle {
  display:inline-flex;
  min-height:48px;
  align-items:center;
  justify-content:center;
  gap:7px;
  padding:0 14px;
  border:1px solid rgba(101,220,229,.24);
  border-radius:13px;
  background:rgba(5,55,87,.42);
  color:#a9cad6;
  font:inherit;
  font-size:.78rem;
  font-weight:650;
  white-space:nowrap;
  cursor:pointer;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
  transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease;
}
.plant-view-toggle:hover,
.plant-view-toggle:focus-visible {
  outline:none;
  transform:translateY(-1px);
  border-color:rgba(108,239,239,.55);
  background:rgba(13,105,131,.48);
  color:#fff;
}
.plant-view-toggle.active {
  border-color:rgba(103,240,236,.58);
  background:linear-gradient(135deg,rgba(26,174,188,.60),rgba(37,117,169,.58));
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 7px 18px rgba(0,29,65,.18);
}

@media (max-width:600px) {
  .dashboard-toolbar {
    grid-template-columns:minmax(0,1fr);
    gap:7px;
    margin-bottom:10px;
  }
  .dashboard-toolbar.has-view-toggle {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .dashboard-toolbar.has-view-toggle .period-tabs { grid-column:1 / -1; }
  .plant-details-button { min-height:40px; }
  .plant-view-toggle { min-height:40px; padding:0 10px; }
  .water-kpi .kpi-title > span:last-child {
    font-size:.8rem;
    line-height:1.25;
  }
}

/* Executive total cards mirror the visual language of each plant card. */
.kpi-summary-panel {
  position: relative;
  margin-top: 10px;
  padding: 10px 12px 9px;
  overflow: hidden;
  border: 1px solid rgba(91, 206, 216, 0.19);
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0%, rgba(54, 208, 215, 0.11), transparent 54%),
    linear-gradient(145deg, rgba(10, 54, 77, 0.76), rgba(4, 30, 54, 0.70));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 8px 18px rgba(0, 15, 36, 0.14);
}

.kpi-summary-panel::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(180deg, #55dbe4, rgba(46, 143, 190, 0.28));
  content: "";
}

.kpi-summary-panel.revenue-summary {
  border-color: rgba(240, 187, 82, 0.20);
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 185, 74, 0.10), transparent 54%),
    linear-gradient(145deg, rgba(10, 54, 77, 0.76), rgba(4, 30, 54, 0.70));
}

.kpi-summary-panel.revenue-summary::before {
  background: linear-gradient(180deg, #f7cc68, rgba(212, 145, 39, 0.25));
}

.kpi-summary-values {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
  align-items: center;
}

.kpi-summary-stat {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.kpi-summary-stat.plan {
  margin-left: 14px;
  padding-left: 14px;
  border-left: 1px solid rgba(140, 183, 198, 0.18);
}

.kpi-summary-stat > span {
  color: #8fb0bd;
  font-size: 0.67rem;
  font-weight: 600;
  line-height: 1.2;
}

.kpi-summary-stat strong {
  overflow: hidden;
  color: #fff;
  font-size: clamp(1.22rem, 2vw, 1.52rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.08;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-summary-stat.plan strong {
  color: #c3d8e0;
  font-size: clamp(1.22rem, 2vw, 1.52rem);
  font-weight: 650;
}

.kpi-summary-stat small {
  color: #8eabb8;
  font-size: 0.56rem;
  font-weight: 600;
}

.kpi-yesterday-row {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
  margin-top: 6px;
}

.kpi-yesterday-value {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  color: #789aa8;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  white-space: nowrap;
}
.kpi-yesterday-value.plan {
  margin-left: 14px;
  padding-left: 14px;
}
.kpi-yesterday-value > span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: .52rem;
  font-weight: 600;
}
.kpi-yesterday-value b {
  overflow: hidden;
  color: #7fddd8;
  font-size: .63rem;
  font-weight: 750;
  text-overflow: ellipsis;
}
.kpi-yesterday-value.plan b { color: #a8c1cb; }
.revenue-summary .kpi-yesterday-value.actual b { color: #f2c45e; }
.kpi-yesterday-value small { color: #668896; font-size: .44rem; }

.kpi-summary-progress {
  height: 4px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(129, 173, 190, 0.17);
}

.kpi-summary-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ef9144, #ffc36d);
  box-shadow: 0 0 9px rgba(242, 155, 67, 0.28);
  transition: width 0.3s ease;
}

.kpi-card.positive .kpi-summary-progress > span {
  background: linear-gradient(90deg, #25b97c, #65e6a7);
  box-shadow: 0 0 9px rgba(53, 207, 139, 0.28);
}

.kpi-card.neutral .kpi-summary-progress > span {
  background: linear-gradient(90deg, #39b7cf, #70dce1);
  box-shadow: 0 0 9px rgba(67, 199, 211, 0.24);
}

/* One executive summary card for the two headline business metrics. */
.executive-overview-card {
  position: relative;
  grid-column: 1 / -1;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid rgba(87, 207, 214, 0.24);
  border-radius: 16px;
  background:
    radial-gradient(circle at 4% 0%, rgba(44, 206, 211, 0.12), transparent 29rem),
    radial-gradient(circle at 96% 100%, rgba(238, 180, 64, 0.08), transparent 25rem),
    linear-gradient(145deg, rgba(10, 72, 99, 0.88), rgba(6, 43, 76, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 13px 30px rgba(0, 19, 43, 0.17);
}

.executive-overview-card::before {
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #52dedf, rgba(82, 222, 223, 0.08) 46%, rgba(243, 190, 77, 0.08) 54%, #f3be4d);
  content: "";
  opacity: 0.7;
}

.executive-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.executive-metric-block {
  min-width: 0;
  padding-right: 18px;
}

.executive-metric-block.revenue-metric {
  position: relative;
  padding-right: 0;
  padding-left: 18px;
  border-left: 1px solid rgba(127, 188, 204, 0.18);
}

.executive-metric-block.revenue-metric::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: -1px;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(100, 225, 225, 0.38), transparent);
  content: "";
}

.executive-metric-block.positive .kpi-percentage { color: #70e2ad; }
.executive-metric-block.neutral .kpi-percentage { color: #91aeba; }
.executive-metric-block.positive .kpi-summary-progress > span {
  background: linear-gradient(90deg, #25b97c, #65e6a7);
  box-shadow: 0 0 9px rgba(53, 207, 139, 0.28);
}
.executive-metric-block.neutral .kpi-summary-progress > span {
  background: linear-gradient(90deg, #39b7cf, #70dce1);
  box-shadow: 0 0 9px rgba(67, 199, 211, 0.24);
}

@media (max-width: 600px) {
  .executive-overview-card { padding: 10px 11px; }
  .executive-overview-grid { grid-template-columns: 1fr; gap: 0; }
  .executive-metric-block { padding-right: 0; }
  .executive-metric-block.revenue-metric {
    margin-top: 9px;
    padding-top: 9px;
    padding-left: 0;
    border-top: 1px solid rgba(127, 188, 204, 0.18);
    border-left: 0;
  }
  .executive-metric-block.revenue-metric::before {
    inset: -1px 8% auto;
    width: 84%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(100, 225, 225, 0.38), transparent);
  }
}

/* Executive water summary mirrors the headline Energy and Revenue card. */
.water-executive-card,
.water-volume-executive-card {
  grid-column: 1 / -1;
  padding: 16px 18px 18px;
  border: 1px solid rgba(77, 196, 222, 0.23);
  border-radius: 16px;
  background:
    radial-gradient(circle at 3% 0%, rgba(42, 199, 207, 0.12), transparent 28rem),
    radial-gradient(circle at 100% 100%, rgba(54, 127, 214, 0.10), transparent 28rem),
    linear-gradient(145deg, rgba(9, 70, 98, 0.86), rgba(5, 39, 76, 0.91));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.065), 0 13px 30px rgba(0,19,43,.17);
}

.water-executive-header,
.water-executive-title,
.water-metric-heading,
.water-performance {
  display: flex;
  align-items: center;
}

.water-executive-header {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
  padding-bottom: 11px;
  border-bottom: 1px solid rgba(95, 210, 222, 0.16);
}

.water-executive-title { min-width: 0; gap: 9px; }
.water-executive-title h2 { margin: 0; color: #f0fbfd; font-size: .9rem; font-weight: 750; line-height: 1.3; }
.water-executive-title small { display: block; margin-top: 1px; color: #79a7b7; font-size: .59rem; font-weight: 600; }
.water-title-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid rgba(94, 222, 229, 0.28);
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(35, 188, 199, .28), rgba(41, 117, 184, .24));
  color: #79e9e7;
}
.water-period-badge {
  display: inline-flex;
  min-width: 42px;
  min-height: 25px;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border: 1px solid rgba(99, 219, 227, .24);
  border-radius: 999px;
  background: rgba(6, 51, 83, .46);
  color: #9de2e6;
  font-size: .62rem;
  font-weight: 700;
}

.water-executive-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.water-metric-block { min-width: 0; padding: 0 15px; }
.water-metric-block:first-child { padding-left: 0; }
.water-metric-block:last-child { padding-right: 0; }
.water-metric-block + .water-metric-block { border-left: 1px solid rgba(124, 186, 204, .16); }

.water-metric-heading {
  min-height: 32px;
  gap: 8px;
  color: #d8edf2;
  font-size: .78rem;
  font-weight: 700;
}
.water-metric-heading .metric-icon { width: 29px; height: 29px; flex-basis: 29px; border-radius: 8px; }
.water-flow-icon { position: relative; overflow: hidden; }
.water-flow-icon > svg:first-child { filter: drop-shadow(0 0 4px currentColor); }
.water-performance { margin-left: auto; gap: 4px; color: #78d9f6; font-size: .78rem; font-weight: 800; white-space: nowrap; }
.water-metric-block.warning .water-performance { color: #ffbd5d; }
.water-metric-block.positive .water-performance { color: #70e2ad; }
.water-metric-block.neutral .water-performance { color: #91aeba; }

.water-summary-panel {
  min-height: 106px;
  margin-top: 8px;
  padding: 10px 11px 9px;
  border: 1px solid rgba(89, 202, 220, .17);
  border-radius: 11px;
  background:
    radial-gradient(circle at 100% 0%, rgba(71, 185, 222, .09), transparent 55%),
    linear-gradient(145deg, rgba(8, 52, 78, .73), rgba(4, 29, 55, .68));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.045);
}
.water-summary-panel .kpi-summary-progress > span {
  background: linear-gradient(90deg, #2dbfd1, #77e3e8);
  box-shadow: 0 0 9px rgba(56, 198, 213, .25);
}
.water-metric-block.positive .kpi-summary-progress > span { background: linear-gradient(90deg,#25b97c,#65e6a7); }
.water-summary-panel.outflow-panel .kpi-summary-progress > span { background: linear-gradient(90deg,#359fd8,#78d9f6); }

.water-total-value { display: flex; min-width: 0; align-items: baseline; justify-content: space-between; gap: 8px; }
.water-total-value > span { color: #8fb0bd; font-size: .62rem; font-weight: 600; }
.water-total-value strong { color: #fff; font-size: clamp(1.12rem,1.75vw,1.42rem); font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.water-total-value small { color: #89aab7; font-size: .49rem; }
.water-volume-breakdown { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; margin-top: 10px; }
.water-volume-breakdown > span { display: flex; min-width: 0; flex-direction: column; gap: 1px; }
.water-volume-breakdown > span + span { padding-left: 8px; border-left: 1px solid rgba(127,178,195,.16); }
.water-volume-breakdown small { overflow: hidden; color: #739aa9; font-size: .51rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.water-volume-breakdown strong { overflow: hidden; color: #c8dde4; font-size: .7rem; font-weight: 650; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.water-volume-breakdown i { color: #7295a2; font-size: .43rem; font-style: normal; }
.water-volume-track { display: flex; height: 4px; margin-top: 9px; overflow: hidden; border-radius: 999px; background: rgba(128,171,188,.16); }
.water-volume-track span { display: block; height: 100%; }
.water-volume-track .main { background: linear-gradient(90deg,#2cb9cb,#6fdce4); }
.water-volume-track .diversion { background: linear-gradient(90deg,#428bd2,#7bbbf1); }
.water-volume-plan-groups {
  display:grid;
  grid-column:1 / -1;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
  margin-top:4px;
}
.water-volume-plan-group {
  min-width:0;
  padding:9px 10px;
  border:1px solid rgba(102,205,221,.17);
  border-radius:10px;
  background:rgba(4,35,61,.42);
}
.water-volume-plan-group.usable-plan {
  border-color:rgba(98,218,181,.19);
  background:linear-gradient(145deg,rgba(8,64,73,.36),rgba(4,35,61,.42));
}
.water-volume-plan-heading {
  display:flex;
  min-width:0;
  align-items:center;
  gap:7px;
  margin-bottom:7px;
}
.water-volume-plan-heading > span {
  display:grid;
  width:27px;
  height:27px;
  flex:0 0 27px;
  place-items:center;
  border:1px solid rgba(86,210,224,.24);
  border-radius:8px;
  background:rgba(31,173,190,.13);
  color:#66dce5;
}
.usable-plan .water-volume-plan-heading > span {
  border-color:rgba(91,221,180,.24);
  background:rgba(52,185,142,.13);
  color:#70e0b9;
}
.water-volume-plan-heading > div { display:flex; min-width:0; flex-direction:column; line-height:1.2; }
.water-volume-plan-heading strong { color:#d8edf2; font-size:clamp(.67rem,.72vw,.77rem); font-weight:750; }
.water-volume-plan-heading small { color:#7196a4; font-size:clamp(.5rem,.54vw,.58rem); font-weight:600; }
.water-volume-plan-values { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); }
.water-volume-plan-values > span { display:flex; min-width:0; flex-direction:column; gap:2px; }
.water-volume-plan-values > span + span { padding-left:9px; border-left:1px solid rgba(127,178,195,.14); }
.water-volume-plan-values small {
  overflow:hidden;
  color:#87a8b4;
  font-size:clamp(.57rem,.61vw,.65rem);
  font-weight:650;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.water-volume-plan-values strong {
  overflow:hidden;
  color:#f4c85d;
  font-size:clamp(.74rem,.8vw,.86rem);
  font-weight:800;
  font-variant-numeric:tabular-nums;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.usable-plan .water-volume-plan-values strong { color:#74dfba; }
.water-volume-plan-values i { color:#7394a1; font-size:.55em; font-style:normal; }
.water-volume-yesterday {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: auto repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: 6px 12px;
  margin-top: 2px;
  color: #789aa8;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.water-volume-yesterday-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: .52rem;
  font-weight: 600;
}
.water-volume-yesterday > span:not(.water-volume-yesterday-label) {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 4px;
}
.water-volume-yesterday > span + span {
  padding-left: 10px;
  border-left: 1px solid rgba(127,178,195,.14);
}
.water-volume-yesterday small { color: #6e929f; font-size: .47rem; font-weight: 600; }
.water-volume-yesterday b { overflow: hidden; color: #83dfe4; font-size: .61rem; text-overflow: ellipsis; }
.water-volume-yesterday i { color: #668896; font-size: .42rem; font-style: normal; }

.water-title-icon.volume {
  border-color: rgba(83, 195, 235, .30);
  background: linear-gradient(145deg, rgba(30, 170, 201, .29), rgba(50, 103, 191, .25));
  color: #83dcfa;
}
.water-volume-overview {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 8px 20px;
  padding: 11px 13px 10px;
  border: 1px solid rgba(83, 191, 224, .18);
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0%, rgba(67, 154, 222, .11), transparent 54%),
    linear-gradient(145deg, rgba(8, 52, 78, .73), rgba(4, 29, 55, .68));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.045);
}
.water-volume-overview .water-total-value {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
}
.water-volume-overview .water-volume-breakdown { margin-top: 0; }
.water-volume-overview .water-volume-track { grid-column: 1 / -1; margin-top: 2px; }

@media (max-width: 900px) {
  .water-executive-grid { grid-template-columns: 1fr; gap: 10px; }
  .water-metric-block,
  .water-metric-block:first-child,
  .water-metric-block:last-child { padding: 0; }
  .water-metric-block + .water-metric-block { padding-top: 10px; border-top: 1px solid rgba(124,186,204,.16); border-left: 0; }
  .water-summary-panel { min-height: 0; }
}

@media (max-width: 600px) {
  .water-executive-card,
  .water-volume-executive-card { padding: 11px; }
  .water-executive-header { margin-bottom: 9px; padding-bottom: 8px; }
  .water-executive-title small { display: none; }
  .water-executive-title h2 { font-size: .8rem; }
  .water-title-icon { width: 30px; height: 30px; flex-basis: 30px; }
  .water-metric-heading { font-size: .72rem; }
  .water-summary-panel { margin-top: 6px; padding: 8px 9px; }
  .water-summary-panel .kpi-summary-stat strong,
  .water-summary-panel .kpi-summary-stat.plan strong { font-size: 1rem; }
  .water-total-value strong { font-size: 1rem; }
  .water-volume-overview { grid-template-columns: 1fr; gap: 7px; padding: 9px; }
  .water-volume-overview .water-volume-track { grid-column: 1; }
  .water-volume-plan-groups { grid-column:1; grid-template-columns:1fr; gap:6px; }
  .water-volume-plan-group { padding:8px; }
  .water-volume-yesterday {
    grid-column: 1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
  }
  .water-volume-yesterday-label { grid-column: 1 / -1; }
  .water-volume-yesterday > span + span { padding-left: 6px; }
}

.water-plants-section {
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px solid rgba(93, 207, 220, .17);
}
.water-plants-header,
.water-plants-title,
.water-plants-actions {
  display: flex;
  align-items: center;
}
.water-plants-header {
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.water-plants-header:focus-visible {
  outline: 2px solid rgba(103, 236, 235, .72);
  outline-offset: 5px;
  border-radius: 8px;
}
.water-plants-title { min-width: 0; gap: 8px; }
.water-plants-title h3 { margin: 0; color: #dff7f8; font-size: .78rem; font-weight: 700; line-height: 1.3; }
.water-plants-actions { flex: 0 0 auto; gap: 7px; }
.water-details-icon {
  display: grid;
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  place-items: center;
  border: 1px solid rgba(83, 218, 225, .25);
  border-radius: 8px;
  background: rgba(26, 139, 167, .22);
  color: #77e2e4;
}
.water-plants-body { min-width: 0; padding-top: 11px; }
.water-plants-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
}
.combined-metric.water-inflow { border-color: rgba(79, 218, 213, .15); }
.combined-metric.water-outflow { border-color: rgba(86, 181, 239, .17); }
.combined-metric.water-outflow .combined-metric-heading > span:first-child { color: #76d2f5; }
.combined-metric.water-outflow .combined-progress i {
  background: linear-gradient(90deg, #329dd7, #77d7f5);
  box-shadow: 0 0 7px rgba(67, 174, 226, .25);
}
.volume-plant-total {
  display: flex;
  min-width: 0;
  margin-left: auto;
  padding-right: 10px;
  flex-direction: column;
  align-items: flex-end;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.volume-plant-total small { color: #7199a9; font-size: .46rem; font-weight: 600; }
.volume-plant-total strong { color: #dff5f8; font-size: .65rem; font-weight: 700; }
.volume-plant-total i { color: #7498a6; font-size: .41rem; font-style: normal; }
.volume-plant-total .volume-plant-yesterday {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #668b99;
  font-size: .4rem;
}
.volume-plant-total .volume-plant-yesterday b { color: #82dbe9; font-size: .47rem; }
.combined-metric-values.single { grid-template-columns: minmax(0,1fr); }
.water-volume-plant-card:not(.has-diversion) .combined-card-metrics {
  grid-template-columns: minmax(0, 1fr);
}
.combined-metric.water-main-volume { border-color: rgba(67, 206, 216, .16); }
.combined-metric.water-diversion-volume { border-color: rgba(82, 154, 230, .18); }
.combined-metric.water-main-volume .combined-metric-heading > span:first-child { color: #70dedf; }
.combined-metric.water-diversion-volume .combined-metric-heading > span:first-child { color: #86bff4; }
.combined-performance.water-tone { color: #82dbe9; }
.combined-progress i.water-main {
  background: linear-gradient(90deg,#2cb9cb,#6fdce4);
  box-shadow: 0 0 7px rgba(55,194,207,.25);
}
.combined-progress i.water-diversion {
  background: linear-gradient(90deg,#428bd2,#7bbbf1);
  box-shadow: 0 0 7px rgba(70,142,213,.25);
}

@media (max-width: 900px) {
  .water-plants-grid { grid-template-columns: 1fr; gap: 8px; }
}

@media (max-width: 600px) {
  .water-plants-section { margin-top: 11px; padding-top: 10px; }
  .water-plants-body { padding-top: 9px; }
  .water-plants-title h3 { font-size: .7rem; }
  .water-details-icon { width: 27px; height: 27px; flex-basis: 27px; }
}

/* Unified plant portfolio: one identity, Energy and Revenue together. */
.combined-plants-card {
  grid-column: 1 / -1;
  padding: 16px 18px 18px;
  border: 1px solid rgba(87, 207, 214, 0.22);
  border-radius: 16px;
  background:
    radial-gradient(circle at 6% 0%, rgba(25, 190, 198, 0.10), transparent 30rem),
    radial-gradient(circle at 100% 100%, rgba(34, 112, 172, 0.09), transparent 28rem),
    linear-gradient(145deg, rgba(8, 75, 101, 0.56), rgba(5, 28, 63, 0.54));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.075), 0 14px 34px rgba(0,13,37,.20);
}

.combined-plants-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
  padding-bottom: 11px;
  border-bottom: 1px solid rgba(87, 207, 214, 0.16);
  cursor: pointer;
  user-select: none;
  transition: margin .2s ease, padding .2s ease, border-color .2s ease;
}

.combined-plants-header:focus-visible {
  outline: 2px solid rgba(103, 236, 235, 0.72);
  outline-offset: 5px;
  border-radius: 8px;
}

.combined-plants-card.is-collapsed .combined-plants-header {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom-color: transparent;
}

.combined-plants-body { min-width: 0; }

.combined-plants-title,
.combined-plants-actions,
.combined-plant-identity,
.combined-metric-heading,
.combined-performance {
  display: flex;
  align-items: center;
}

.combined-plants-title { min-width: 0; gap: 9px; }
.combined-plants-title h2 { margin: 0; color: #f1f8fb; font-size: 0.88rem; font-weight: 700; line-height: 1.35; }
.combined-plants-title small { display: block; margin-top: 1px; color: #7197a8; font-size: 0.6rem; font-weight: 600; }
.combined-plants-actions { flex: 0 0 auto; gap: 7px; }
.portfolio-collapse-indicator {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border: 1px solid rgba(105, 220, 227, 0.22);
  border-radius: 8px;
  background: rgba(5, 47, 76, 0.46);
  color: #91dce1;
  transition: border-color .18s ease, background .18s ease, color .18s ease;
}
.combined-plants-header:hover .portfolio-collapse-indicator {
  border-color: rgba(108, 239, 239, 0.48);
  background: rgba(20, 116, 139, 0.42);
  color: #fff;
}
.combined-title-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border: 1px solid rgba(88, 223, 226, 0.25);
  border-radius: 9px;
  background: linear-gradient(145deg, rgba(36, 189, 197, 0.24), rgba(28, 104, 151, 0.22));
  color: #71e7e4;
}

.combined-plants-grid,
.combined-plants-skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.combined-plant-card {
  position: relative;
  display: block;
  min-width: 0;
  padding: 10px;
  overflow: hidden;
  border: 1px solid rgba(91, 206, 216, 0.16);
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--plant-accent, #38bdf8) 10%, transparent), transparent 52%),
    linear-gradient(145deg, rgba(10, 54, 77, 0.76), rgba(4, 30, 54, 0.70));
  color: #edf6fa;
  font: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 7px 16px rgba(0,15,36,.13);
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.combined-plant-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(180deg, var(--plant-accent, #55dbe4), transparent);
  content: "";
  opacity: .8;
}

.combined-plant-card:hover,
.combined-plant-card:focus-visible {
  outline: none;
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--plant-accent, #55dbe4) 58%, rgba(255,255,255,.15));
  box-shadow: 0 12px 24px rgba(0,14,36,.25), inset 0 1px 0 rgba(255,255,255,.09);
}

.combined-plant-identity { min-width: 0; gap: 8px; padding-right: 18px; }
.combined-plant-logo {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  overflow: hidden;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--plant-accent, #38bdf8) 45%, transparent);
  border-radius: 9px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--plant-accent, #38bdf8) 25%, #142332), #0e1823);
  color: var(--plant-accent, #38bdf8);
  font-size: .6rem;
  font-weight: 900;
}
.combined-plant-logo.has-logo { padding: 2px; border-color: rgba(255,255,255,.46); background: #fff; }
.combined-plant-logo img { display: block; width: 100%; height: 100%; border-radius: 6px; object-fit: contain; }
.combined-plant-name { display: flex; min-width: 0; align-items: center; }
.combined-plant-name strong { overflow: hidden; color: #f5fbfd; font-size: .8rem; font-weight: 750; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.combined-card-chevron { position: absolute; top: 19px; right: 10px; color: rgba(144,181,194,.48); transition: transform .18s ease, color .18s ease; }
.combined-plant-card:hover .combined-card-chevron { color: #8ff5f0; transform: translateX(2px); }

.combined-card-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  margin-top: 9px;
}

.combined-metric {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  padding: 7px 8px;
  border: 1px solid rgba(103, 204, 213, 0.12);
  border-radius: 9px;
  background: rgba(3, 28, 51, 0.30);
}
.combined-metric.revenue { border-color: rgba(236, 184, 79, 0.14); }
.combined-metric-heading { min-width: 0; justify-content: space-between; gap: 5px; }
.combined-metric-heading > span:first-child { display: inline-flex; align-items: center; gap: 3px; color: #73ddd9; font-size: .59rem; font-weight: 700; white-space: nowrap; }
.combined-metric.revenue .combined-metric-heading > span:first-child { color: #f1c45f; }
.combined-performance { flex: 0 0 auto; gap: 2px; font-size: .54rem; font-weight: 800; white-space: nowrap; }
.combined-performance.warning { color: #ffbd5d; }
.combined-performance.positive { color: #5eead4; }
.combined-performance.neutral { color: #91aeba; }
.combined-metric-values { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; }
.combined-metric-values > span { display: flex; min-width: 0; flex-direction: column; gap: 1px; }
.combined-metric-values > span + span { padding-left: 7px; border-left: 1px solid rgba(133,174,189,.14); }
.combined-metric-values small { color: #7597a5; font-size: .52rem; font-weight: 600; }
.combined-metric-values strong { overflow: hidden; color: #f5fbfd; font-size: .71rem; font-weight: 700; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.combined-metric-values > span + span strong { color: #adc7d1; font-weight: 600; }
.combined-metric-values i { color: #7795a1; font-size: .43rem; font-style: normal; font-weight: 600; }
.combined-progress { height: 3px; overflow: hidden; border-radius: 999px; background: rgba(128,171,188,.16); }
.combined-progress i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#ef9144,#ffc36d); box-shadow: 0 0 7px rgba(242,155,67,.25); }
.combined-metric.revenue .combined-progress i { background: linear-gradient(90deg,#e9aa35,#ffd263); }
.combined-progress i.positive { background: linear-gradient(90deg,#25b97c,#65e6a7); box-shadow: 0 0 7px rgba(53,207,139,.25); }
.combined-progress i.neutral { background: linear-gradient(90deg,#3faec5,#6cd7dc); }
.combined-yesterday-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  font-variant-numeric: tabular-nums;
}
.combined-yesterday-values.single { grid-template-columns: minmax(0, 1fr); }
.combined-yesterday-values > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}
.combined-yesterday-values > span + span {
  padding-left: 6px;
  border-left: 1px solid rgba(133,174,189,.12);
}
.combined-yesterday-values small {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #668b99;
  font-size: .44rem;
  font-weight: 600;
  white-space: nowrap;
}
.combined-yesterday-values strong {
  overflow: hidden;
  color: #7fddd8;
  font-size: .55rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.combined-yesterday-values > span + span strong { color: #9cb7c1; font-weight: 600; }
.combined-yesterday-values i { color: #668896; font-size: .39rem; font-style: normal; font-weight: 600; }
.combined-metric.revenue .combined-yesterday-values > span:first-child strong { color: #f2c45e; }

.combined-plants-skeleton span {
  height: 142px;
  border-radius: 12px;
  background: linear-gradient(90deg,rgba(8,48,72,.35),rgba(16,75,108,.45),rgba(8,48,72,.35));
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;
}

.plant-list-mode .combined-plants-grid,
.plant-list-mode .combined-plants-skeleton { grid-template-columns: 1fr; gap: 5px; }
.plant-list-mode .combined-plant-card {
  display: grid;
  min-height: 76px;
  grid-template-columns: minmax(116px, 138px) minmax(0,1fr);
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
}
.plant-list-mode .combined-card-metrics { margin: 0; }
.plant-list-mode .combined-plants-skeleton span { height: 76px; }

@media (max-width: 600px) {
  .combined-plants-grid,
  .combined-plants-skeleton { grid-template-columns: 1fr; }
  .combined-plant-card { display: grid; grid-template-columns: minmax(108px, 130px) minmax(0,1fr); align-items: center; gap: 8px; }
  .combined-card-metrics { margin-top: 0; }
}

@media (max-width: 430px) {
  .combined-plants-card { padding: 13px 10px; }
  .combined-plants-title small { display: none; }
  .combined-plant-card,
  .plant-list-mode .combined-plant-card { display: block; padding: 9px; }
  .combined-card-metrics { margin-top: 8px; gap: 5px; }
  .combined-metric { padding: 6px; }
  .combined-metric-values strong { font-size: .66rem; }
}

/* Keep the plant portfolio inside the headline Energy and Revenue card. */
.executive-overview-card .embedded-plant-collapse {
  margin-top: 15px;
  padding: 13px 0 0;
  overflow: visible;
  border: 0;
  border-top: 1px solid rgba(93, 207, 220, .17);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.executive-overview-card .embedded-plant-collapse .combined-plants-header,
.executive-overview-card .embedded-plant-collapse.is-collapsed .combined-plants-header {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}
.executive-overview-card .embedded-plant-collapse .combined-plants-body {
  padding-top: 11px;
}
.executive-overview-card .embedded-plant-collapse .combined-title-icon {
  width: 29px;
  height: 29px;
  flex-basis: 29px;
  border-radius: 8px;
}
.executive-overview-card .embedded-plant-collapse .combined-plants-title h2 {
  font-size: .78rem;
}

@media (max-width: 600px) {
  .executive-overview-card .embedded-plant-collapse {
    margin-top: 11px;
    padding: 10px 0 0;
  }
  .executive-overview-card .embedded-plant-collapse .combined-plants-body { padding-top: 9px; }
  .executive-overview-card .embedded-plant-collapse .combined-title-icon {
    width: 27px;
    height: 27px;
    flex-basis: 27px;
  }
  .executive-overview-card .embedded-plant-collapse .combined-plants-title h2 { font-size: .7rem; }
}

/* Specific plant breakdown inside KPI cards */
.kpi-card.has-breakdown {
  display: flex;
  flex-direction: column;
}

.kpi-plant-breakdown {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(87, 207, 214, 0.16);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px;
}

.breakdown-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.breakdown-chart-button {
  display: inline-flex;
  min-height: 25px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid rgba(95, 222, 226, 0.30);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(24, 150, 168, 0.22), rgba(14, 81, 116, 0.22));
  color: #87eee9;
  font: inherit;
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.breakdown-chart-button.revenue {
  border-color: rgba(244, 193, 85, 0.32);
  background: linear-gradient(145deg, rgba(216, 158, 43, 0.18), rgba(96, 67, 21, 0.18));
  color: #ffd573;
}

.breakdown-chart-button:hover,
.breakdown-chart-button:focus-visible {
  outline: none;
  transform: translateY(-1px);
  border-color: rgba(111, 241, 238, 0.66);
  background: linear-gradient(145deg, rgba(32, 184, 195, 0.34), rgba(17, 101, 138, 0.30));
  box-shadow: 0 6px 14px rgba(0, 21, 48, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.10);
}

.breakdown-chart-button.revenue:hover,
.breakdown-chart-button.revenue:focus-visible {
  border-color: rgba(255, 211, 112, 0.68);
  background: linear-gradient(145deg, rgba(226, 168, 53, 0.29), rgba(112, 76, 22, 0.25));
}

.breakdown-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a4c7d4;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.breakdown-title svg {
  color: #5eead4;
}

.breakdown-count {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(87, 207, 214, 0.12);
  border: 1px solid rgba(87, 207, 214, 0.22);
  color: #72eadc;
  font-size: 0.64rem;
  font-weight: 700;
}

/* Plant comparison modal */
.plant-comparison-dialog {
  max-height: calc(100vh - 32px);
  overflow-x: hidden !important;
  overflow-y: auto !important;
  border: 1px solid rgba(91, 213, 220, 0.28) !important;
  background:
    radial-gradient(circle at 8% 0%, rgba(32, 195, 201, 0.18), transparent 28rem),
    radial-gradient(circle at 100% 100%, rgba(27, 104, 156, 0.14), transparent 28rem),
    linear-gradient(155deg, #0a405c, #082f50 52%, #091f42) !important;
  color: #edf8fb !important;
  box-shadow: 0 28px 80px rgba(0, 9, 32, 0.46) !important;
}

.comparison-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px 15px;
  border-bottom: 1px solid rgba(104, 213, 220, 0.16);
}

.comparison-dialog-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.comparison-dialog-title h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.02rem, 2vw, 1.32rem);
  font-weight: 650;
  line-height: 1.35;
}

.comparison-dialog-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid rgba(87, 225, 228, 0.36);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(39, 200, 207, 0.28), rgba(35, 117, 170, 0.25));
  color: #81f1ed;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 8px 18px rgba(0, 20, 48, 0.20);
}

.comparison-dialog-icon.revenue {
  border-color: rgba(244, 197, 93, 0.38);
  background: linear-gradient(145deg, rgba(225, 169, 54, 0.27), rgba(105, 70, 22, 0.24));
  color: #ffd775;
}

.comparison-dialog-close {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 1px solid rgba(153, 197, 211, 0.20);
  border-radius: 10px;
  background: rgba(3, 30, 55, 0.34);
  color: #a9c5d0;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.comparison-dialog-close:hover,
.comparison-dialog-close:focus-visible {
  outline: none;
  border-color: rgba(122, 233, 235, 0.48);
  background: rgba(16, 101, 126, 0.38);
  color: #fff;
}

.comparison-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 22px 4px;
}

.comparison-metric-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid rgba(105, 201, 213, 0.17);
  border-radius: 10px;
  background: rgba(3, 29, 54, 0.30);
}

.comparison-metric-tabs button {
  display: inline-flex;
  min-height: 31px;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #8fabb8;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 650;
  cursor: pointer;
}

.comparison-metric-tabs button.active {
  background: linear-gradient(135deg, rgba(38, 185, 195, 0.52), rgba(39, 119, 173, 0.48));
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 5px 12px rgba(0, 22, 53, 0.20);
}

.comparison-dialog-period {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #9ebbc7;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.comparison-chart-shell {
  height: 410px;
  min-width: 0;
  margin: 10px 18px 18px;
  padding: 12px 10px 4px;
  border: 1px solid rgba(95, 202, 214, 0.14);
  border-radius: 14px;
  background: rgba(3, 25, 49, 0.30);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.comparison-chart-loading,
.comparison-chart-empty {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: #8eabb8;
  font-size: 0.76rem;
}

.comparison-chart-loading .loader {
  width: 28px;
  height: 28px;
  border-color: rgba(115, 204, 215, 0.20);
  border-top-color: #5be1e4;
}

.breakdown-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.plant-breakdown-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "lead status"
    "metrics metrics";
  align-content: start;
  gap: 9px 6px;
  min-height: 108px;
  padding: 10px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(91, 206, 216, 0.16);
  background:
    radial-gradient(circle at 100% 0%, rgba(54, 208, 215, 0.10), transparent 56%),
    linear-gradient(145deg, rgba(10, 54, 77, 0.72), rgba(4, 30, 54, 0.66));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.055),
    0 7px 16px rgba(0, 15, 36, 0.13);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.plant-breakdown-row::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(180deg, #55dbe4, rgba(46, 143, 190, 0.24));
  content: "";
  opacity: 0.72;
}

.kpi-card:nth-child(2) .plant-breakdown-row {
  border-color: rgba(240, 187, 82, 0.17);
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 185, 74, 0.09), transparent 56%),
    linear-gradient(145deg, rgba(10, 54, 77, 0.72), rgba(4, 30, 54, 0.66));
}

.kpi-card:nth-child(2) .plant-breakdown-row::before {
  background: linear-gradient(180deg, #f7cc68, rgba(212, 145, 39, 0.22));
}

.plant-breakdown-row:hover,
.plant-breakdown-row:focus-visible {
  outline: none;
  border-color: rgba(101, 229, 233, 0.48);
  background:
    radial-gradient(circle at 100% 0%, rgba(61, 222, 225, 0.16), transparent 58%),
    linear-gradient(145deg, rgba(13, 70, 94, 0.86), rgba(5, 38, 66, 0.82));
  transform: translateY(-2px);
  box-shadow: 0 11px 23px rgba(0, 14, 36, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.09);
}

.kpi-card:nth-child(2) .plant-breakdown-row:hover,
.kpi-card:nth-child(2) .plant-breakdown-row:focus-visible {
  border-color: rgba(247, 204, 104, 0.48);
}

.plant-row-lead {
  grid-area: lead;
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.plant-mini-logo {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  position: relative;
  overflow: hidden;
  border-radius: 9px;
  color: var(--plant-accent, #38bdf8);
  border: 1px solid color-mix(in srgb, var(--plant-accent, #38bdf8) 45%, transparent);
  background: linear-gradient(145deg, color-mix(in srgb, var(--plant-accent, #38bdf8) 25%, #142332), #0e1823);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.19);
}

.plant-mini-logo.has-logo {
  padding: 1.5px;
  background: #ffffff;
  border-color: rgba(255, 255, 255, 0.45);
}

.plant-mini-logo img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 7px;
  object-fit: contain;
}

.plant-mini-mark {
  position: relative;
  z-index: 1;
  font-size: 0.6rem;
  font-weight: 900;
  line-height: 1;
}

.plant-row-name {
  color: #edf4f8;
  font-size: 0.74rem;
  font-weight: 750;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-row-metrics {
  grid-area: metrics;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.plant-row-numbers {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  font-variant-numeric: tabular-nums;
}

.metric-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "label label"
    "value unit";
  align-items: baseline;
  justify-content: start;
  gap: 2px 3px;
  min-width: 0;
}

.metric-item.plan {
  margin-left: 7px;
  padding-left: 8px;
  border-left: 1px solid rgba(140, 183, 198, 0.16);
}

.metric-item .metric-lbl {
  grid-area: label;
  margin-bottom: 2px;
}

.metric-item.actual .metric-lbl {
  color: #8bb1c2;
  font-size: 0.63rem;
  font-weight: 600;
}

.metric-item.actual .metric-val {
  grid-area: value;
  color: #ffffff;
  font-size: 0.84rem;
  font-weight: 750;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-item.actual small {
  grid-area: unit;
  color: #8bb1c2;
  font-size: 0.52rem;
  font-weight: 600;
}

.metric-sep {
  display: none;
}

.metric-item.plan .metric-lbl {
  color: #7b9dae;
  font-size: 0.63rem;
  font-weight: 500;
}

.metric-item.plan .metric-val {
  grid-area: value;
  color: #b0cbd7;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-item.plan small {
  grid-area: unit;
  color: #7b9dae;
  font-size: 0.52rem;
}

.plant-row-track {
  height: 4px;
  border-radius: 999px;
  background: rgba(129, 173, 190, 0.16);
  overflow: hidden;
}

.plant-row-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.plant-row-fill.energy-fill {
  background: linear-gradient(90deg, #f56f00, #ffb03b);
  box-shadow: 0 0 8px rgba(245, 111, 0, 0.35);
}

.plant-row-fill.revenue-fill {
  background: linear-gradient(90deg, #f3a817, #ffd462);
  box-shadow: 0 0 8px rgba(243, 168, 23, 0.35);
}

.plant-row-fill.positive {
  background: linear-gradient(90deg, #10b981, #5eead4) !important;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.35) !important;
}

.plant-row-end {
  grid-area: status;
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
  justify-content: flex-end;
}

.plant-row-pct {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 5px;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.035);
  font-size: 0.62rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  opacity: 0.96;
}

.plant-row-pct.positive { color: #5eead4; }
.plant-row-pct.warning { color: #ffbd5d; }
.plant-row-pct.neutral { color: #91aeba; }

.plant-row-chevron {
  display: none;
  color: rgba(148, 169, 181, 0.40);
  transition: transform 0.18s ease, color 0.18s ease;
}

.plant-breakdown-row:hover .plant-row-chevron {
  color: #8cfff7;
  transform: translateX(2px);
}

.breakdown-empty {
  padding: 14px;
  text-align: center;
  color: #728d9c;
  font-size: 0.74rem;
}

.breakdown-skeleton {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.breakdown-skeleton-row {
  height: 108px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(8, 48, 72, 0.35), rgba(16, 75, 108, 0.45), rgba(8, 48, 72, 0.35));
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;
}

/* Optional compact list: every plant stays on one executive summary line. */
.plant-list-mode .breakdown-list,
.plant-list-mode .breakdown-skeleton {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.plant-list-mode .plant-breakdown-row {
  grid-template-columns: minmax(82px, 102px) minmax(0, 1fr) auto;
  grid-template-areas: "lead metrics status";
  min-height: 38px;
  align-items: center;
  gap: 9px;
  padding: 5px 8px;
  border-radius: 9px;
  background:
    radial-gradient(circle at 100% 0%, rgba(54, 208, 215, 0.075), transparent 52%),
    rgba(4, 28, 48, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.plant-list-mode .kpi-card:nth-child(2) .plant-breakdown-row {
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 185, 74, 0.07), transparent 52%),
    rgba(4, 28, 48, 0.48);
}

.plant-list-mode .plant-breakdown-row:hover,
.plant-list-mode .plant-breakdown-row:focus-visible {
  transform: translateX(2px);
}

.plant-list-mode .plant-row-lead { gap: 7px; }

.plant-list-mode .plant-mini-logo {
  width: 24px;
  height: 24px;
  flex-basis: 24px;
  border-radius: 7px;
}

.plant-list-mode .plant-mini-logo img { border-radius: 5px; }
.plant-list-mode .plant-row-name { font-size: 0.72rem; }

.plant-list-mode .plant-row-metrics {
  gap: 4px;
}

.plant-list-mode .plant-row-numbers {
  display: flex;
  align-items: baseline;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
}

.plant-list-mode .metric-item {
  display: inline-flex;
  min-width: 0;
  align-items: baseline;
  gap: 3px;
}

.plant-list-mode .metric-item.plan {
  margin: 0;
  padding: 0;
  border: 0;
}

.plant-list-mode .metric-item .metric-lbl {
  margin: 0;
  font-size: 0.57rem;
}

.plant-list-mode .metric-item.actual .metric-val,
.plant-list-mode .metric-item.plan .metric-val {
  overflow: visible;
  font-size: 0.7rem;
  text-overflow: clip;
}

.plant-list-mode .metric-item.actual small,
.plant-list-mode .metric-item.plan small {
  font-size: 0.49rem;
}

.plant-list-mode .metric-sep {
  display: inline;
  color: rgba(139, 177, 194, 0.36);
  font-size: 0.62rem;
}

.plant-list-mode .plant-row-track { height: 3px; }

.plant-list-mode .plant-row-end { gap: 4px; }

.plant-list-mode .plant-row-pct {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  font-size: 0.66rem;
}

.plant-list-mode .plant-row-chevron {
  display: block;
  width: 11px;
}

.plant-list-mode .breakdown-skeleton-row {
  height: 38px;
  border-radius: 9px;
}

@media (max-width: 600px) {
  .kpi-card.has-breakdown {
    grid-column: 1 / -1;
  }
  .kpi-summary-panel { padding: 9px 10px 8px; }
  .kpi-summary-stat.plan { margin-left: 9px; padding-left: 9px; }
  .kpi-yesterday-value.plan { margin-left: 9px; padding-left: 9px; }
  .executive-overview-card .kpi-summary-stat strong,
  .executive-overview-card .kpi-summary-stat.plan strong { font-size: 0.94rem; }
  .executive-overview-card .kpi-summary-stat > span { font-size: 0.59rem; }
  .executive-overview-card .kpi-summary-stat small { font-size: 0.48rem; }
  .executive-overview-card .kpi-summary-panel { margin-top: 6px; }
  .breakdown-list,
  .breakdown-skeleton {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .plant-breakdown-row {
    min-height: 106px;
    padding: 9px;
  }
  .plant-mini-logo { flex-basis: 28px; width: 28px; height: 28px; }
  .plant-row-name { font-size: 0.72rem; }
  .plant-list-mode .plant-breakdown-row {
    grid-template-columns:minmax(72px,86px) minmax(0,1fr) auto;
    gap:6px;
    padding:5px 6px;
  }
  .plant-list-mode .plant-mini-logo { flex-basis:23px; width:23px; height:23px; }
  .plant-list-mode .metric-item .metric-lbl { display:none; }
  .plant-list-mode .metric-item.actual .metric-val,
  .plant-list-mode .metric-item.plan .metric-val { font-size:.64rem; }
  .plant-list-mode .plant-row-pct { font-size:.61rem; }
  .breakdown-chart-button { padding-inline: 7px; }
  .comparison-dialog-header { padding: 15px 14px 12px; }
  .comparison-dialog-toolbar {
    padding: 10px 14px 2px;
    align-items: flex-start;
    flex-direction: column;
  }
  .comparison-dialog-period { padding-left: 4px; }
  .comparison-chart-shell { height: 350px; margin: 9px 8px 10px; padding: 8px 4px 2px; }
  .comparison-chart-shell :deep(.bar-chart) { height: 100% !important; }
}

@media (max-width: 340px) {
  .breakdown-list,
  .breakdown-skeleton { grid-template-columns: 1fr; }
}

/* Readable, consistent type hierarchy for the dashboard summary cards. */
.executive-overview-card .kpi-title > span:last-child {
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.25;
}

.executive-overview-card .kpi-percentage {
  font-size: 0.86rem;
  line-height: 1;
}

.executive-overview-card .kpi-summary-stat > span {
  font-size: 0.72rem;
  line-height: 1.2;
}

.executive-overview-card .kpi-summary-stat strong,
.executive-overview-card .kpi-summary-stat.plan strong {
  font-size: clamp(1.16rem, 2.2vw, 1.48rem);
  line-height: 1.15;
}

.executive-overview-card .kpi-summary-stat small {
  font-size: 0.56rem;
}

.executive-overview-card .kpi-yesterday-value > span {
  font-size: 0.6rem;
}

.executive-overview-card .kpi-yesterday-value b {
  font-size: 0.7rem;
}

.executive-overview-card .kpi-yesterday-value small {
  font-size: 0.5rem;
}

.combined-plant-name strong {
  font-size: 0.9rem;
  line-height: 1.25;
}

.combined-metric-heading > span:first-child {
  font-size: 0.68rem;
  line-height: 1.2;
}

.combined-performance {
  font-size: 0.63rem;
}

.combined-metric-values small {
  font-size: 0.6rem;
}

.combined-metric-values strong {
  font-size: 0.82rem;
  line-height: 1.15;
}

.combined-metric-values i {
  font-size: 0.49rem;
}

.combined-yesterday-values small {
  font-size: 0.51rem;
}

.combined-yesterday-values strong {
  font-size: 0.64rem;
}

.combined-yesterday-values i {
  font-size: 0.44rem;
}

@media (max-width: 600px) {
  .executive-overview-card .kpi-summary-stat strong,
  .executive-overview-card .kpi-summary-stat.plan strong {
    font-size: 1.12rem;
  }

  .executive-overview-card .kpi-summary-stat > span { font-size: 0.68rem; }
  .executive-overview-card .kpi-summary-stat small { font-size: 0.53rem; }
  .executive-overview-card .kpi-yesterday-value > span { font-size: 0.56rem; }
  .executive-overview-card .kpi-yesterday-value b { font-size: 0.66rem; }
  .executive-overview-card .kpi-yesterday-value small { font-size: 0.46rem; }

  .combined-plant-name strong { font-size: 0.86rem; }
  .combined-metric-heading > span:first-child { font-size: 0.64rem; }
  .combined-performance { font-size: 0.59rem; }
  .combined-metric-values small { font-size: 0.56rem; }
  .combined-metric-values strong { font-size: 0.78rem; }
  .combined-metric-values i { font-size: 0.46rem; }
  .combined-yesterday-values small { font-size: 0.48rem; }
  .combined-yesterday-values strong { font-size: 0.61rem; }
  .combined-yesterday-values i { font-size: 0.42rem; }
}

@media (max-width: 360px) {
  .combined-metric-values strong { font-size: 0.73rem; }
  .combined-performance { font-size: 0.56rem; }
}

/* Tablet and desktop readability: use a presentation-sized type scale. */
@media (min-width: 601px) {
  .executive-overview-card .kpi-title > span:last-child {
    font-size: clamp(0.95rem, 1vw, 1.06rem);
  }

  .executive-overview-card .kpi-percentage {
    font-size: clamp(0.92rem, 0.95vw, 1rem);
  }

  :is(.executive-overview-card, .water-executive-card) .kpi-summary-stat > span {
    font-size: clamp(0.75rem, 0.78vw, 0.82rem);
  }

  :is(.executive-overview-card, .water-executive-card) .kpi-summary-stat strong,
  :is(.executive-overview-card, .water-executive-card) .kpi-summary-stat.plan strong {
    font-size: clamp(1.55rem, 1.75vw, 1.82rem);
  }

  :is(.executive-overview-card, .water-executive-card) .kpi-summary-stat small {
    font-size: clamp(0.6rem, 0.62vw, 0.66rem);
  }

  :is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value > span {
    font-size: clamp(0.64rem, 0.66vw, 0.7rem);
  }

  :is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value b {
    font-size: clamp(0.75rem, 0.78vw, 0.82rem);
  }

  :is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value small {
    font-size: clamp(0.52rem, 0.55vw, 0.58rem);
  }

  .executive-overview-card .embedded-plant-collapse .combined-plants-title h2,
  .water-plants-title h3 {
    font-size: clamp(0.88rem, 0.92vw, 0.98rem);
  }

  .breakdown-count,
  .water-period-badge {
    font-size: clamp(0.68rem, 0.7vw, 0.74rem);
  }

  .water-executive-title h2 {
    font-size: clamp(1rem, 1.08vw, 1.14rem);
  }

  .water-metric-heading {
    font-size: clamp(0.86rem, 0.9vw, 0.96rem);
  }

  .water-performance {
    font-size: clamp(0.84rem, 0.88vw, 0.94rem);
  }

  .water-total-value > span {
    font-size: clamp(0.72rem, 0.76vw, 0.8rem);
  }

  .water-total-value strong {
    font-size: clamp(1.55rem, 1.75vw, 1.82rem);
  }

  .water-total-value small {
    font-size: clamp(0.56rem, 0.59vw, 0.62rem);
  }

  .water-volume-breakdown small {
    font-size: clamp(0.62rem, 0.65vw, 0.69rem);
  }

  .water-volume-breakdown strong {
    font-size: clamp(0.84rem, 0.88vw, 0.94rem);
  }

  .water-volume-breakdown i {
    font-size: clamp(0.5rem, 0.53vw, 0.56rem);
  }

  .water-volume-yesterday-label,
  .water-volume-yesterday small {
    font-size: clamp(0.57rem, 0.6vw, 0.64rem);
  }

  .water-volume-yesterday b {
    font-size: clamp(0.7rem, 0.74vw, 0.78rem);
  }

  .water-volume-yesterday i {
    font-size: clamp(0.49rem, 0.51vw, 0.54rem);
  }

  .combined-plant-name strong {
    font-size: clamp(0.92rem, 0.96vw, 1rem);
  }

  .combined-metric-heading > span:first-child {
    font-size: clamp(0.7rem, 0.74vw, 0.78rem);
  }

  .combined-performance {
    font-size: clamp(0.66rem, 0.69vw, 0.73rem);
  }

  .combined-metric-values small {
    font-size: clamp(0.62rem, 0.65vw, 0.69rem);
  }

  .combined-metric-values strong {
    font-size: clamp(0.86rem, 0.9vw, 0.96rem);
  }

  .combined-metric-values i {
    font-size: clamp(0.51rem, 0.54vw, 0.57rem);
  }

  .combined-yesterday-values small {
    font-size: clamp(0.54rem, 0.57vw, 0.6rem);
  }

  .combined-yesterday-values strong {
    font-size: clamp(0.67rem, 0.71vw, 0.75rem);
  }

  .combined-yesterday-values i {
    font-size: clamp(0.47rem, 0.49vw, 0.52rem);
  }
}

/* Accessible supporting text on phones, tablets and desktop screens. */
:is(.executive-overview-card, .water-executive-card) .kpi-summary-stat > span {
  font-size: clamp(0.72rem, 0.78vw, 0.82rem);
  font-weight: 700;
  line-height: 1.25;
}

:is(.executive-overview-card, .water-executive-card) .kpi-summary-stat small {
  font-size: clamp(0.56rem, 0.62vw, 0.66rem);
  line-height: 1;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value {
  gap: 4px;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value > span {
  font-size: clamp(0.61rem, 0.66vw, 0.7rem);
  line-height: 1.2;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value b {
  font-size: clamp(0.7rem, 0.78vw, 0.82rem);
  line-height: 1.2;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value small {
  font-size: clamp(0.51rem, 0.55vw, 0.58rem);
  line-height: 1;
}

.water-total-value > span {
  font-size: clamp(0.72rem, 0.76vw, 0.8rem);
  font-weight: 700;
}

.water-total-value small {
  font-size: clamp(0.55rem, 0.59vw, 0.62rem);
}

.water-volume-breakdown small {
  font-size: clamp(0.63rem, 0.65vw, 0.69rem);
  line-height: 1.25;
}

.water-volume-breakdown strong {
  font-size: clamp(0.8rem, 0.88vw, 0.94rem);
  line-height: 1.25;
}

.water-volume-breakdown i {
  font-size: clamp(0.49rem, 0.53vw, 0.56rem);
}

.water-volume-yesterday-label,
.water-volume-yesterday small {
  font-size: clamp(0.58rem, 0.6vw, 0.64rem);
  line-height: 1.2;
}

.water-volume-yesterday b {
  font-size: clamp(0.68rem, 0.74vw, 0.78rem);
  line-height: 1.2;
}

.water-volume-yesterday i {
  font-size: clamp(0.48rem, 0.51vw, 0.54rem);
}

.combined-metric-values small {
  font-size: clamp(0.6rem, 0.65vw, 0.69rem);
}

.combined-metric-values i {
  font-size: clamp(0.48rem, 0.54vw, 0.57rem);
}

.combined-yesterday-values small {
  font-size: clamp(0.54rem, 0.57vw, 0.6rem);
}

.combined-yesterday-values strong {
  font-size: clamp(0.64rem, 0.71vw, 0.75rem);
}

.combined-yesterday-values i {
  font-size: clamp(0.46rem, 0.49vw, 0.52rem);
}

@media (max-width: 380px) {
  :is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value {
    gap: 3px;
  }

  .water-volume-yesterday {
    column-gap: 4px;
  }

  .water-volume-yesterday > span:not(.water-volume-yesterday-label) {
    gap: 2px;
  }

  .water-volume-yesterday > span + span {
    padding-left: 4px;
  }
}

/* Final metadata scale: keep secondary figures legible at every viewport. */
:is(.executive-overview-card, .water-executive-card) .kpi-summary-stat > span {
  font-size: clamp(0.78rem, 0.84vw, 0.88rem);
}

:is(.executive-overview-card, .water-executive-card) .kpi-summary-stat small {
  font-size: clamp(0.62rem, 0.67vw, 0.7rem);
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-row {
  margin-top: 8px;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value {
  min-height: 20px;
  gap: 5px;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value > span {
  color: #8eafbc;
  font-size: clamp(0.7rem, 0.75vw, 0.79rem);
  font-weight: 700;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value b {
  font-size: clamp(0.8rem, 0.86vw, 0.9rem);
  font-weight: 800;
}

:is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value small {
  color: #7f9eaa;
  font-size: clamp(0.59rem, 0.63vw, 0.66rem);
  font-weight: 700;
}

.water-total-value > span,
.water-volume-breakdown small {
  color: #91b2bf;
  font-size: clamp(0.72rem, 0.78vw, 0.82rem);
  font-weight: 700;
}

.water-volume-breakdown strong {
  font-size: clamp(0.88rem, 0.95vw, 1rem);
  font-weight: 750;
}

.water-total-value small,
.water-volume-breakdown i {
  font-size: clamp(0.58rem, 0.63vw, 0.66rem);
  font-weight: 700;
}

.water-volume-yesterday {
  min-height: 26px;
  align-items: center;
  margin-top: 8px;
}

.water-volume-yesterday-label,
.water-volume-yesterday small {
  color: #829fac;
  font-size: clamp(0.67rem, 0.72vw, 0.76rem);
  font-weight: 700;
}

.water-volume-yesterday b {
  font-size: clamp(0.78rem, 0.84vw, 0.88rem);
  font-weight: 800;
}

.water-volume-yesterday i {
  color: #7897a4;
  font-size: clamp(0.57rem, 0.61vw, 0.64rem);
  font-weight: 700;
}

@media (max-width: 600px) {
  :is(.executive-overview-card, .water-executive-card) .kpi-yesterday-value {
    flex-wrap: wrap;
    row-gap: 1px;
  }

  .water-volume-yesterday > span:not(.water-volume-yesterday-label) {
    align-items: flex-start;
    flex-direction: column;
    gap: 1px;
  }
}

/* Standard type scale for every expanded plant card. */
.combined-plant-card {
  padding: 12px;
}

.combined-plant-name strong {
  font-size: clamp(0.98rem, 1.05vw, 1.12rem);
  font-weight: 800;
}

.combined-card-metrics {
  gap: 9px;
  margin-top: 11px;
}

.combined-metric {
  gap: 8px;
  padding: 10px;
}

.combined-metric-heading > span:first-child {
  font-size: clamp(0.76rem, 0.82vw, 0.87rem);
  font-weight: 750;
}

.combined-performance {
  font-size: clamp(0.72rem, 0.77vw, 0.82rem);
}

.combined-metric-values {
  gap: 8px;
}

.combined-metric-values small {
  color: #8aa9b5;
  font-size: clamp(0.68rem, 0.73vw, 0.77rem);
  font-weight: 700;
}

.combined-metric-values strong {
  font-size: clamp(0.94rem, 1vw, 1.06rem);
  font-weight: 800;
  line-height: 1.2;
}

.combined-metric-values > span + span strong {
  font-weight: 700;
}

.combined-metric-values i {
  color: #829faa;
  font-size: clamp(0.56rem, 0.6vw, 0.64rem);
  font-weight: 700;
}

.combined-progress {
  height: 4px;
}

.combined-yesterday-values {
  gap: 7px;
}

.combined-yesterday-values small {
  color: #809faa;
  font-size: clamp(0.62rem, 0.67vw, 0.71rem);
  font-weight: 700;
}

.combined-yesterday-values strong {
  font-size: clamp(0.74rem, 0.8vw, 0.85rem);
  font-weight: 800;
  line-height: 1.2;
}

.combined-yesterday-values > span + span strong {
  font-weight: 700;
}

.combined-yesterday-values i {
  color: #7896a2;
  font-size: clamp(0.53rem, 0.57vw, 0.6rem);
  font-weight: 700;
}

.volume-plant-total small {
  font-size: clamp(0.62rem, 0.67vw, 0.71rem);
  font-weight: 700;
}

.volume-plant-total strong {
  font-size: clamp(0.82rem, 0.88vw, 0.94rem);
  font-weight: 800;
}

.volume-plant-total i {
  font-size: clamp(0.53rem, 0.57vw, 0.6rem);
  font-weight: 700;
}

.volume-plant-total .volume-plant-yesterday {
  font-size: clamp(0.58rem, 0.62vw, 0.66rem);
}

.volume-plant-total .volume-plant-yesterday b {
  font-size: clamp(0.68rem, 0.73vw, 0.77rem);
}

@media (max-width: 430px) {
  .combined-plant-card,
  .plant-list-mode .combined-plant-card {
    padding: 10px;
  }

  .combined-card-metrics {
    gap: 6px;
    margin-top: 10px;
  }

  .combined-metric {
    gap: 7px;
    padding: 8px;
  }

  .combined-metric-values {
    gap: 5px;
  }
}

/* Keep every plant figure readable when a card is narrow. On phones and
   tablets, Actual and Plan use separate rows instead of truncating values. */
@media (max-width: 900px) {
  .combined-metric-values {
    grid-template-columns: minmax(0, 1fr);
    gap: 5px;
  }

  .combined-metric-values > span + span {
    padding-top: 5px;
    padding-left: 0;
    border-top: 1px solid rgba(133, 174, 189, 0.14);
    border-left: 0;
  }

  .combined-metric-values strong {
    overflow: visible;
    text-overflow: clip;
  }
}
</style>
