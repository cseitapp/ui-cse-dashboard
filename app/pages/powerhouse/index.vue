<template>
  <v-container>

    <v-sheet rounded="lg">
      <v-data-table :headers="headers" :hide-default-footer="powerhouse.length < 11" :items="powerhouse">
        <template v-slot:top>
          <v-toolbar flat density="compact" class="pa-1" color="white" rounded="lg">
            <v-toolbar-title>
              <v-icon  icon="mdi-text-box-edit" size="x-small" start></v-icon>
              <span >ຈັດການຂໍ້ມູນຂອງເຮືອນຈັກ</span>
            </v-toolbar-title>

            <v-btn class="me-2" prepend-icon="mdi-plus" rounded="lg" text="ເພີ່ມເຮືອນຈັກ" color="primary"
              variant="tonal" @click="add"></v-btn>
            <v-text-field prepend-inner-icon="mdi-magnify" density="compact" label="ຄົ້ນຫາ" color="blue-grey-lighten-2"
              rounded="lg" variant="outlined" hide-details single-line></v-text-field>

          </v-toolbar>
        </template>
        <template #headers="{ columns }">
          <tr>
            <th v-for="col in columns" :key="col.key" class="bg-blue-grey-darken-1 text-white"
              :style="{ width: col.width }">
              {{ col.title }}
            </th>
          </tr>
        </template>
         <template v-slot:item.COD="{ item }">
          {{ formatDate(item.COD) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-2 justify-center">
            <v-icon color="medium-emphasis" icon="mdi-pencil" size="small" @click="edit(item.id)"></v-icon>

            <v-icon color="medium-emphasis" icon="mdi-delete" size="small" @click="remove(item.id)"></v-icon>
          </div>
        </template>

        <template v-slot:no-data>
          <v-btn prepend-icon="mdi-backup-restore" rounded="lg" text="Reset data" variant="text" border
            @click="reset"></v-btn>
        </template>
      </v-data-table>
      <v-dialog v-model="confirmDialog" max-width="400">
        <v-card rounded="lg">
          <v-card-title class="pa-4">
            <v-icon color="error" class="me-2">mdi-alert-circle</v-icon>
            ຢືນຢັນການລຶບ
          </v-card-title>
          <v-card-text>
            ທ່ານຕ້ອງການລຶບເຂື່ອນ <v-chip color="primary">{{ selectedPowerhouse?.dam_station }}</v-chip> ຂອງ <v-chip> {{
              selectedPowerhouse?.dam_code }}</v-chip> ແທ້ບໍ່?
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="confirmDialog = false">ຍົກເລີກ</v-btn>
            <v-btn color="error" variant="tonal" @click="confirmRemove">ລຶບ</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <PowerhouseForm v-model="dialog" :edit-data="selectedPowerhouse" @saved="fetchPowerhouse" />
    </v-sheet>
  </v-container>


</template>
<script setup>
import { onMounted, ref } from 'vue'
import PowerhouseForm from '~~/components/common/PowerhouseForm.vue'
import { useAuthUser } from '~~/composables/useAuth'
import { useFormatDate } from '~~/components/common/useFormatDate'
const { formatDate } = useFormatDate()
import axios from 'axios';

const user = useAuthUser();
const code = user.value.BR_CODE

const powerhouse = ref([])
const dialog = ref(false)
const selectedPowerhouse = ref(null)
const confirmDialog = ref(false)

const loadPowerhouse = async () => {
  const res = await axios.get("/api/powerhouse/", {
    params: { code: code },
  });
  powerhouse.value = res.data.data.data;
  console.log(powerhouse.value)
}

const headers = [
  { title: 'ຊື່ເຂື່ອນ', key: 'dam_code', align: 'start' },
  { title: 'ປະເພດຈັກ', key: 'type_engine' },
  { title: 'ກຳລັງຕິດຕັ້ງ', key: 'power' },
  { title: 'ຈຳນວນຈັກ', key: 'number_engine' },
  { title: 'ວັນທີສ້າງ', key: 'COD' },
  { title: 'ຈັດການ', key: 'actions', sortable: false },
]

const add = () => {
  selectedPowerhouse.value = null
  dialog.value = true
}

const edit = (id) => {
  selectedPowerhouse.value = powerhouse.value.find(d => d.id === id)
  dialog.value = true
}

const remove = (id) => {
  selectedPowerhouse.value = powerhouse.value.find(d => d.id === id)
  confirmDialog.value = true
}

const confirmRemove = async () => {
  await axios.delete(`/api/powerhouse/${selectedPowerhouse.value.id}`)
  confirmDialog.value = false
  selectedPowerhouse.value = null
  loadPowerhouse()
}


const fetchPowerhouse = () => loadPowerhouse()

definePageMeta({
  middleware: "auth",
  layout: "default",
});

onMounted(() => {
  loadPowerhouse()
})
</script>