<template>
  <v-card>
    <v-layout>
      <v-app-bar color="primary">
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

        <v-toolbar-title>ລະບົບລາຍງານ ພະລັງງານ ແລະ ນ້ຳ</v-toolbar-title>

        <v-avatar class="d-none d-lg-block">
          <v-img alt="John" :src="`/api/image/${PROFILE}/${user.PICTURE}`" />
        </v-avatar>

        <div class="ma-3 d-none d-lg-block">
          <div class="col">{{ user.FULL_NAME_LA }} ({{ user.USER_NAME }})</div>
          <div class="col">{{ user.TEAM_NAME }}</div>
        </div>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" :location="$vuetify.display.mobile ? 'left' : undefined">
        <v-list>
          <v-list-item class="px-0" v-for="item in groupedMenu" :key="item.MENU_ID" :active="false">
            <v-list-item-title class="px-2"><h5 class="font-weight-thin">{{ item.MENU_NAME_LA }}</h5></v-list-item-title>
            <v-list v-if="item.submenus.length">
              <v-list-item class="px-0" v-for="sub in item.submenus" :key="sub.MENU_ID"
                :active="$route.path === sub.PATH" @click="handleMenuClick(sub)" link color="primary">
                <v-list-item-title class="d-flex px-4" :value="sub.PATH">
                  <Icon :icon="sub.CSS_ICON" class="mr-2" width="20" height="20" /> <h5 class="font-weight-thin">{{ sub.MENU_NAME_LA }}</h5>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <!-- Logout Button -->
            <v-btn color="primary" block @click="confirmDialog = true">
             <h5 class="font-weight-thin"> ອອກຈາກລະບົບ</h5>
              <Icon class="ma-3" icon="lucide:log-out" width="24" height="24" />
            </v-btn>

            <!-- Confirm Dialog -->
            <v-dialog v-model="confirmDialog" max-width="400">
              <v-card>
                <v-card-title>ຢືນຢັນການອອກຈາກລະບົບ</v-card-title>
                <v-card-text>
                  ທ່ານແນ່ໃຈບໍ່ວ່າຈະອອກຈາກລະບົບ?
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="outlined" @click="confirmDialog = false">ປິດ</v-btn>
                  <v-btn color="red" variant="tonal" @click="handleLogoutConfirm">ອອກຈາກລະບົບ</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </template>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>
          <slot />
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>
<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import axios from 'axios'
import { useLogout, useAuthUser } from '~~/composables/useAuth'
const user = useAuthUser()
const PROFILE = 'PROFILE'

const items = ref([])


const router = useRouter()
const handleMenuClick = async (sub) => {
  localStorage.setItem('currentMenu', JSON.stringify(sub))
  if (sub.PATH) {
    router.push(sub.PATH)
  }
}

const handleLogoutConfirm = () => {
  confirmDialog.value = false
  useLogout()
  navigateTo('/login')
}

const fetchMenu = async () => {
  const roleId = user.value?.ROLE_ID
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
const drawer = ref(true)
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
  drawer.value = true
})
</script>