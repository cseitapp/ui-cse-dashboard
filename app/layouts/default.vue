<template>
  <v-card class="app-shell">
    <v-layout>
      <v-app-bar
        class="app-header"
        elevation="0"
        :scroll-behavior="mdAndDown ? undefined : 'hide'"
        :scroll-threshold="mdAndDown ? undefined : 48"
      >
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

        <v-toolbar-title class="brand-title">
          <div class="header-logo-shell">
            <v-img src="/assets/images/logo_cse.png" class="header-logo" />
          </div>
        </v-toolbar-title>

        <v-avatar class="d-none d-lg-block">
          <v-img alt="John" :src="`/api/image/${PROFILE}/${user.PICTURE}`" />
        </v-avatar>

        <div class="ma-3 d-none d-lg-block">
          <div class="col">{{ user.FULL_NAME_LA }} ({{ user.USER_NAME }})</div>
          <div class="col">{{ user.BR_NAME }}</div>
        </div>
      </v-app-bar>

      <v-navigation-drawer class="app-drawer" v-model="drawer" :location="$vuetify.display.mobile ? 'left' : undefined">
        <v-list>
          <v-list-item class="px-0" v-for="item in groupedMenu" :key="item.MENU_ID" :active="false">
            <v-list-item-title class="px-2">
              <h5 class="font-weight-thin">{{ item.MENU_NAME_LA }}</h5>
            </v-list-item-title>
            <v-list v-if="item.submenus.length">
              <v-list-item class="px-0" v-for="sub in item.submenus" :key="sub.MENU_ID"
                :active="$route.path === sub.PATH && !(sub.PATH === '/' && $route.query.view === 'plants')" @click="handleMenuClick(sub)" link color="primary">
                <v-list-item-title class="d-flex px-4" :value="sub.PATH">
                  <Icon :icon="sub.CSS_ICON" class="mr-2" width="20" height="20" />
                  <h5 class="font-weight-thin">{{ sub.MENU_NAME_LA }}</h5>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-list-item>
          <v-list-item
            class="plant-details-menu px-0"
            :active="$route.path === '/' && $route.query.view === 'plants'"
            @click="handlePlantDetailsClick"
            link
            color="primary"
          >
            <v-list-item-title class="d-flex px-4">
              <Icon icon="lucide:building-2" class="mr-2" width="20" height="20" />
              <h5 class="font-weight-thin">ຂໍ້ມູນລາຍລະອຽດເຂື່ອນ</h5>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <!-- Logout Button -->
            <v-btn class="logout-button" block @click="confirmDialog = true">
              <h5 class="font-weight-thin"> ອອກຈາກລະບົບ</h5>
              <Icon class="ma-3" icon="lucide:log-out" width="24" height="24" />
            </v-btn>

            <!-- Confirm Dialog -->
            <v-dialog v-model="confirmDialog" max-width="400">
              <v-card rounded-lg>
                <v-card-title class="bg-blue-darken-2">
                  <div class="d-flex align-center">
                    <Icon icon="lucide:log-out" width="24" height="24" /><span class="ms-3">ຢືນຢັນ</span>
                  </div>
                </v-card-title>
                <v-card-text class="py-10 text-center">
                  ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ບໍ ?
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-btn variant="flat" @click="confirmDialog = false">ປິດ</v-btn>
                  <v-btn variant="tonal" color="error" @click="handleLogoutConfirm">ອອກຈາກລະບົບ</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </template>
      </v-navigation-drawer>

      <v-main class="app-main">
        <v-container fluid :class="{ 'pa-0': $route.path === '/' || $route.path === '/detail' }">
          <slot />
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>
<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useDisplay } from 'vuetify'
import axios from 'axios'
import { useLogout, useAuthUser } from '~~/composables/useAuth'
const user = useAuthUser()
const PROFILE = 'PROFILE'
// console.log(user.value)

const items = ref([])


const router = useRouter()
const { mobile, mdAndDown } = useDisplay()
const handleMenuClick = async (sub) => {
  localStorage.setItem('currentMenu', JSON.stringify(sub))
  if (sub.PATH) {
    await router.push(sub.PATH)
    if (mobile.value) drawer.value = false
  }
}

const handlePlantDetailsClick = async () => {
  await router.push({ path: '/', query: { view: 'plants' } })
  if (mobile.value) drawer.value = false
}

const handleLogoutConfirm = () => {
  confirmDialog.value = false
  useLogout()
  navigateTo('/login')
}

const fetchMenu = async () => {
  const roleId = user.value?.ROLE_ID
  console.log(roleId)
  try {
    const res = await axios.get('/api/menu', { params: { roleId } })
    if (res.data.ERROR_CODE === '00') {
      items.value = res.data.DATA
    } else {
      items.value = []
    }
  } catch (err) {
    console.error('Failed to fetch menu:', err)
    items.value = []
  }
}

onMounted(() => {
  drawer.value = !mobile.value
  const cached = localStorage.getItem('menu')
  if (cached) {
    items.value = JSON.parse(cached)
  }
  fetchMenu()
})

watch(items, (val) => {
  if (val && val.length > 0) {
    localStorage.setItem('menu', JSON.stringify(val))
  } else {
    localStorage.removeItem('menu')
  }
}, { deep: true })

const confirmDialog = ref(false)
// Let the navigation stay visible on desktop without covering mobile content.
const drawer = ref(null)
const group = ref(null)
const groupedMenu = computed(() => {
  // get main menus
  const mains = items.value.filter(i => i.TYPE === 'M')

  // attach submenus to each main
  return mains.map(main => ({
    ...main,
    submenus: items.value.filter(sub => sub.TYPE === 'S' && sub.SUB_MENU_ID === main.MENU_ID)
  }))
})


watch(group, () => {
  if (!mobile.value) drawer.value = true
})

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})
</script>

<style scoped>
.app-shell { min-height: 100vh; background: #eef5fb !important; color: #19344f; }
.app-header {
  border-bottom: 1px solid rgba(55, 130, 202, .16) !important;
  background: rgba(255, 255, 255, .88) !important;
  color: #1b3c5b !important;
  box-shadow: 0 9px 30px rgba(46,105,154,.11) !important;
  backdrop-filter: blur(16px);
}
.brand-title { overflow: visible; }
.header-logo-shell {
  position: relative;
  width: min(218px, calc(100vw - 98px));
  height: 50px;
  padding: 3px;
  overflow: hidden;
  border: 1px solid rgba(70, 151, 226, .38);
  border-radius: 14px;
  background:
    linear-gradient(#fff, #f8fbff) padding-box,
    linear-gradient(120deg, #258bea, rgba(108,185,246,.35), #a9d7fa) border-box;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.07),
    0 7px 20px rgba(50,112,164,.14),
    0 0 18px rgba(43,137,222,.08);
}
.header-logo-shell::after {
  position: absolute;
  right: 14px;
  bottom: 0;
  left: 14px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(90deg, transparent, #238ce9 30%, #74c8fa 70%, transparent);
  box-shadow: 0 0 8px rgba(35,140,233,.30);
  content: "";
  pointer-events: none;
}
.header-logo {
  width: 100%;
  height: 100%;
  padding: 4px 9px;
  border-radius: 10px;
  background: linear-gradient(115deg, #fff 0%, #f8fafb 70%, #fff4ec 100%);
}
.app-drawer {
  border-right: 1px solid rgba(66, 139, 202, .15) !important;
  background:
    radial-gradient(circle at 12% 8%, rgba(62, 153, 235, .11), transparent 18rem),
    rgba(255,255,255,.96) !important;
  color: #27445e !important;
}
.app-main {
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% -10%, rgba(55,153,239,.16), transparent 32rem),
    radial-gradient(circle at 96% 25%, rgba(115,201,249,.12), transparent 28rem),
    linear-gradient(145deg,#f6fbff,#edf5fc) !important;
}
.logout-button {
  background: linear-gradient(120deg, #268ce8, #1f6fc5) !important;
  color: #fff !important;
  box-shadow: 0 8px 22px rgba(36,119,194,.24);
}
:deep(.app-drawer .v-list) { background: transparent; color: inherit; }
:deep(.app-drawer .v-list-item) { border-radius: 11px; }
:deep(.app-drawer .v-list-item--active) {
  background: linear-gradient(100deg, rgba(45,143,230,.16), rgba(104,193,247,.08));
  color: #1978ca;
}
:deep(.app-drawer .v-list-item--active::before) { opacity: 0; }

@media (max-width: 600px) {
  .header-logo-shell { width: min(192px, calc(100vw - 92px)); height: 48px; border-radius: 13px; }
  .header-logo { padding: 4px 7px; border-radius: 9px; }
}

/* Aurora glass application chrome */
.app-shell {
  background:linear-gradient(145deg,#071229,#111543 48%,#1c0f42) !important;
  color:#f5f7ff;
}
.app-header {
  border-bottom:1px solid rgba(255,255,255,.12) !important;
  background:linear-gradient(90deg,rgba(8,18,43,.84),rgba(23,22,70,.78),rgba(45,18,82,.78)) !important;
  color:#f7f8ff !important;
  box-shadow:0 12px 38px rgba(1,5,30,.34) !important;
  backdrop-filter:blur(24px) saturate(145%);
}
.header-logo-shell {
  border-color:rgba(255,255,255,.22);
  background:
    linear-gradient(rgba(255,255,255,.97),rgba(246,248,255,.95)) padding-box,
    linear-gradient(120deg,#62dcf3,#7584ff 52%,#d26bea) border-box;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.72),0 9px 25px rgba(1,5,31,.28),0 0 20px rgba(105,111,255,.14);
}
.header-logo-shell::after {
  background:linear-gradient(90deg,transparent,#58dce9 25%,#8576ff 58%,#d466e2 78%,transparent);
  box-shadow:0 0 10px rgba(116,110,255,.48);
}
.header-logo { background:linear-gradient(115deg,#fff,#f4f6ff 68%,#f9efff); }
.app-drawer {
  border-right:1px solid rgba(255,255,255,.12) !important;
  background:
    radial-gradient(circle at 10% 7%,rgba(66,142,255,.20),transparent 20rem),
    radial-gradient(circle at 90% 80%,rgba(181,71,239,.13),transparent 22rem),
    linear-gradient(165deg,rgba(11,24,55,.97),rgba(22,18,64,.97)) !important;
  color:#dbe3fb !important;
  box-shadow:14px 0 42px rgba(0,5,32,.27);
  backdrop-filter:blur(24px);
}
.app-main {
  background:
    radial-gradient(circle at 15% -10%,rgba(55,130,255,.30),transparent 33rem),
    radial-gradient(circle at 98% 24%,rgba(207,67,255,.22),transparent 30rem),
    linear-gradient(145deg,#071229,#111543 48%,#1c0f42) !important;
}
.logout-button {
  border:1px solid rgba(255,255,255,.16) !important;
  background:linear-gradient(120deg,#4e8cff,#8c5cf2 62%,#c95ddb) !important;
  color:#fff !important;
  box-shadow:0 10px 28px rgba(75,53,210,.34);
}
:deep(.app-drawer .v-list-item) { color:#b7c2df; }
:deep(.app-drawer .v-list-item:hover) { background:rgba(121,107,243,.10); color:#fff; }
:deep(.app-drawer .v-list-item--active) {
  background:linear-gradient(100deg,rgba(82,150,255,.24),rgba(157,87,241,.18));
  color:#fff;
  box-shadow:inset 3px 0 0 #72dcf1;
}

@media (max-width:600px) {
  .app-header { background:linear-gradient(90deg,rgba(7,17,42,.94),rgba(28,20,72,.92)) !important; }
  .app-main { background:linear-gradient(155deg,#071229,#15123c 55%,#20103f) !important; }
}

/* Sapphire-to-cyan transparent application chrome */
.app-shell {
  background:linear-gradient(118deg,#09106f,#132da0 43%,#1777b6 72%,#55cbd5) !important;
}
.app-header {
  border-bottom-color:rgba(255,255,255,.19) !important;
  background:linear-gradient(100deg,rgba(7,17,103,.76),rgba(21,91,174,.60),rgba(75,195,207,.50)) !important;
  box-shadow:0 12px 38px rgba(0,16,76,.24) !important;
  backdrop-filter:blur(24px) saturate(145%);
}
.header-logo-shell {
  border-color:rgba(255,255,255,.42);
  background:
    linear-gradient(rgba(255,255,255,.96),rgba(245,252,255,.94)) padding-box,
    linear-gradient(120deg,#6d8fff,#7ff2ef) border-box;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.84),0 10px 28px rgba(0,26,101,.22),0 0 20px rgba(117,232,239,.16);
}
.header-logo-shell::after { background:linear-gradient(90deg,transparent,#678cff 28%,#72e9ec 72%,transparent); box-shadow:0 0 10px rgba(103,226,235,.40); }
.app-drawer {
  border-right-color:rgba(255,255,255,.20) !important;
  background:
    radial-gradient(circle at 9% 8%,rgba(82,103,255,.30),transparent 22rem),
    radial-gradient(circle at 100% 82%,rgba(80,224,231,.20),transparent 24rem),
    linear-gradient(150deg,rgba(7,18,105,.88),rgba(15,63,150,.82),rgba(29,146,181,.77)) !important;
  color:#f1f8ff !important;
  box-shadow:14px 0 42px rgba(0,18,76,.22);
}
.app-main {
  background:
    radial-gradient(circle at 8% 16%,rgba(42,58,222,.52),transparent 34rem),
    radial-gradient(circle at 96% 40%,rgba(75,224,236,.40),transparent 38rem),
    linear-gradient(118deg,#09106f,#132da0 43%,#1777b6 72%,#55cbd5) !important;
}
.logout-button {
  background:linear-gradient(120deg,#426ff0,#45c7dc) !important;
  box-shadow:0 10px 28px rgba(5,38,132,.27);
}
:deep(.app-drawer .v-list-item) { color:rgba(243,249,255,.80); }
:deep(.app-drawer .v-list-item:hover) { background:rgba(255,255,255,.10); }
:deep(.app-drawer .v-list-item--active) {
  background:linear-gradient(100deg,rgba(255,255,255,.16),rgba(104,228,235,.12));
  box-shadow:inset 3px 0 0 #8af5f0;
}

@media (max-width:600px) {
  .app-header { background:linear-gradient(100deg,rgba(7,17,103,.91),rgba(27,131,179,.76)) !important; }
  .app-main { background:linear-gradient(145deg,#080f6d,#163aa1 58%,#309ebd) !important; }
}

/* Sky-grid glass application chrome */
.app-shell { background:linear-gradient(145deg,#6aa5f5,#a6cbfa 50%,#dfecfd) !important; color:#17385d; }
.app-header {
  border-bottom-color:rgba(255,255,255,.62) !important;
  background:linear-gradient(100deg,rgba(255,255,255,.64),rgba(238,248,255,.43)) !important;
  color:#173d64 !important;
  box-shadow:0 10px 34px rgba(40,96,155,.15) !important;
  backdrop-filter:blur(24px) saturate(125%);
}
.header-logo-shell {
  border-color:rgba(255,255,255,.82);
  background:
    linear-gradient(rgba(255,255,255,.94),rgba(245,251,255,.89)) padding-box,
    linear-gradient(120deg,#4c92df,#a6d9f9) border-box;
  box-shadow:inset 0 1px 0 #fff,0 9px 25px rgba(45,104,165,.15);
}
.header-logo-shell::after { background:linear-gradient(90deg,transparent,#438bd7 28%,#78c7ed 72%,transparent); box-shadow:0 0 8px rgba(62,142,207,.24); }
.header-logo { background:linear-gradient(115deg,rgba(255,255,255,.98),rgba(243,250,255,.95)); }
.app-drawer {
  border-right-color:rgba(255,255,255,.55) !important;
  background:
    linear-gradient(rgba(255,255,255,.43),rgba(255,255,255,.25)),
    radial-gradient(circle at 12% 8%,rgba(72,145,229,.18),transparent 21rem) !important;
  color:#244d75 !important;
  box-shadow:12px 0 38px rgba(39,94,151,.13);
  backdrop-filter:blur(25px) saturate(125%);
}
.app-main {
  background:
    linear-gradient(rgba(255,255,255,.02),rgba(255,255,255,.02)),
    radial-gradient(circle at 10% 6%,rgba(47,126,239,.30),transparent 34rem),
    radial-gradient(circle at 84% 72%,rgba(255,255,255,.58),transparent 35rem),
    linear-gradient(145deg,#6aa5f5,#9fc8fb 45%,#dceafe) !important;
}
.logout-button {
  border-color:rgba(255,255,255,.62) !important;
  background:linear-gradient(120deg,#3c82dc,#72b9ed) !important;
  box-shadow:0 9px 24px rgba(42,108,174,.20);
}
:deep(.app-drawer .v-list-item) { color:#345d83; }
:deep(.app-drawer .v-list-item:hover) { background:rgba(255,255,255,.34); color:#174f82; }
:deep(.app-drawer .v-list-item--active) {
  background:linear-gradient(100deg,rgba(255,255,255,.52),rgba(214,239,255,.30));
  color:#155a96;
  box-shadow:inset 3px 0 0 #3989ce;
}

@media (max-width:600px) {
  .app-header { background:linear-gradient(100deg,rgba(255,255,255,.73),rgba(225,244,255,.50)) !important; }
  .app-main { background:linear-gradient(150deg,#72aaf3,#a9cdf9 55%,#e1edfd) !important; }
}

/* Atmospheric cobalt glass application chrome */
.app-shell { background:linear-gradient(180deg,#263fe3,#3973e4 28%,#6aa9e9 60%,#dce9f7) !important; }
.app-header {
  border-bottom-color:rgba(255,255,255,.48) !important;
  background:linear-gradient(100deg,rgba(34,56,207,.68),rgba(84,143,229,.44),rgba(220,238,251,.28)) !important;
  color:#fff !important;
  box-shadow:0 10px 34px rgba(25,55,137,.18) !important;
  backdrop-filter:blur(28px) saturate(120%);
}
.app-drawer {
  border-right-color:rgba(255,255,255,.48) !important;
  background:linear-gradient(155deg,rgba(255,255,255,.52),rgba(229,243,255,.28)) !important;
  color:#20466e !important;
  box-shadow:12px 0 38px rgba(32,76,143,.14);
  backdrop-filter:blur(28px) saturate(120%);
}
.app-main {
  background:
    radial-gradient(circle at 84% 102%,rgba(204,188,255,.40),transparent 27rem),
    radial-gradient(circle at 16% 82%,rgba(240,247,255,.32),transparent 29rem),
    linear-gradient(180deg,#263fe3,#3973e4 27%,#68a9ea 58%,#dce9f7) !important;
}
.logout-button { background:linear-gradient(125deg,#3157d9,#68a4e8) !important; box-shadow:0 9px 24px rgba(42,78,173,.23); }
:deep(.app-drawer .v-list-item) { color:#315577; }
:deep(.app-drawer .v-list-item:hover) { background:rgba(255,255,255,.32); color:#174d80; }
:deep(.app-drawer .v-list-item--active) { background:linear-gradient(100deg,rgba(255,255,255,.52),rgba(209,233,255,.28)); color:#18568e; box-shadow:inset 3px 0 0 #386fc5; }

@media (max-width:600px) {
  .app-header { background:linear-gradient(100deg,rgba(34,56,207,.80),rgba(94,153,232,.55)) !important; }
  .app-main { background:linear-gradient(180deg,#263fe3,#3974e4 30%,#6eaceb 62%,#dce9f7) !important; }
}

/* Teal banking-glass application chrome */
.app-shell {
  background:linear-gradient(160deg,#087d92,#07516f 34%,#0a3559 62%,#0b1d42) !important;
  color:#f1f7fa;
  font-family:"Noto Sans Lao","Phetsarath",system-ui,sans-serif;
  font-weight:400;
}
.app-header {
  border-bottom-color:rgba(89,213,218,.22) !important;
  background:linear-gradient(100deg,rgba(5,119,137,.76),rgba(6,70,99,.72),rgba(8,32,70,.76)) !important;
  color:#f8fcfd !important;
  box-shadow:0 10px 34px rgba(0,15,40,.25) !important;
  backdrop-filter:blur(28px) saturate(125%);
}
.header-logo-shell {
  border-color:rgba(98,222,225,.34);
  background:
    linear-gradient(rgba(255,255,255,.96),rgba(240,250,252,.92)) padding-box,
    linear-gradient(120deg,#20c7ca,#177da1) border-box;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 9px 25px rgba(0,19,46,.22),0 0 18px rgba(21,190,196,.09);
}
.header-logo-shell::after { background:linear-gradient(90deg,transparent,#20c8cb 32%,#1b8eb0 70%,transparent); box-shadow:0 0 8px rgba(24,190,198,.28); }
.app-drawer {
  border-right-color:rgba(95,215,221,.20) !important;
  background:
    radial-gradient(circle at 7% 3%,rgba(9,184,191,.18),transparent 20rem),
    linear-gradient(160deg,rgba(5,91,112,.91),rgba(6,45,78,.94),rgba(8,25,58,.96)) !important;
  color:#e4f0f4 !important;
  box-shadow:12px 0 38px rgba(0,12,35,.24);
  backdrop-filter:blur(28px) saturate(120%);
}
.app-main {
  background:
    radial-gradient(circle at 7% 2%,rgba(0,202,207,.34),transparent 29rem),
    radial-gradient(circle at 100% 36%,rgba(17,130,158,.18),transparent 32rem),
    linear-gradient(160deg,#087d92,#07516f 34%,#0a3559 62%,#0b1d42) !important;
}
.logout-button {
  border-color:rgba(101,226,227,.25) !important;
  background:linear-gradient(125deg,#0caab5,#087391) !important;
  box-shadow:0 9px 24px rgba(0,49,75,.28);
  font-weight:500;
}
:deep(.app-drawer .v-list-item) { color:#c2d8e0; font-weight:400; }
:deep(.app-drawer .v-list-item:hover) { background:rgba(27,190,195,.10); color:#fff; }
:deep(.app-drawer .v-list-item--active) {
  background:linear-gradient(100deg,rgba(18,184,191,.18),rgba(7,91,119,.14));
  color:#fff;
  box-shadow:inset 3px 0 0 #28d0d1;
}

@media (max-width:600px) {
  .app-header { background:linear-gradient(100deg,rgba(5,120,138,.88),rgba(7,45,82,.88)) !important; }
  :deep(.app-header .v-toolbar__content) { position:relative; }
  .brand-title {
    position:absolute;
    top:50%;
    left:50%;
    width:min(192px,calc(100vw - 112px));
    margin:0 !important;
    flex:none !important;
    transform:translate(-50%,-50%);
  }
  .header-logo-shell { width:100%; margin:0 auto; }
  .app-main { background:linear-gradient(165deg,#087b90,#07516f 35%,#093657 64%,#0b1d42) !important; }
}
</style>
