<template>
  <v-container>

    <v-sheet rounded="lg">
      <v-data-table :headers="headers" :hide-default-footer="dam.length < 11" :items="dam">
        <template v-slot:top>
          <v-toolbar flat density="compact" class="pa-1" color="white" rounded="lg">
            <v-toolbar-title >
              <v-icon icon="mdi-text-box-edit" size="x-small" start></v-icon>
              <span >ຈັດການຂໍ້ມູນເຂື່ອນ</span>
            </v-toolbar-title>

            <v-btn class="me-2" prepend-icon="mdi-plus" rounded="lg" text="ເພີ່ມເຂື່ອນໃໝ່" color="primary"
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

        <template v-slot:item.dam_station="{ item }">
          <v-chip color="primary" variant="tonal" size="small">{{ item.dam_station }}</v-chip>
        </template>


        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
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
            ທ່ານຕ້ອງການລຶບເຂື່ອນ <v-chip color="primary">{{selectedDam?.dam_station }}</v-chip> ຂອງ <v-chip> {{ selectedDam?.dam_code }}</v-chip>  ແທ້ບໍ່?
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="confirmDialog = false">ຍົກເລີກ</v-btn>
            <v-btn color="error" variant="tonal" @click="confirmRemove">ລຶບ</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <DamForm v-model="dialog" :edit-data="selectedDam" @saved="fetchDams" />
    </v-sheet>
  </v-container>


</template>
<script setup>
import { onMounted, ref } from 'vue'
import DamForm from '~~/components/common/DamForm.vue'
import { useAuthUser } from '~~/composables/useAuth'
import axios from 'axios';

const user = useAuthUser();
const code = user.value.BR_CODE

const dam = ref([])
const dialog = ref(false)
const selectedDam = ref(null)
const confirmDialog = ref(false)

const loaddam = async () => {
  const res = await axios.get("/api/dam/", {
    params: { code: code },
  });
  dam.value = res.data.data.data;
}

const headers = [
  { title: 'ຊື່ເຂື່ອນ', key: 'dam_code', align: 'start' },
  { title: 'ເຂື່ອນ', key: 'dam_station' },
  { title: 'ປະເພດເຂື່ອນ', key: 'dam_type' },
  { title: 'ຄວາມສູງ', key: 'height', align: 'center' },
  { title: 'ຄວາມກ້ວາງ', key: 'width', align: 'center' },
  { title: 'ພື້ນທີ່ເກັບ', key: 'area', align: 'center', sortable: false },
  { title: 'ຈັດການ', key: 'actions', align: 'center', sortable: false },
]

const add = () => {
  selectedDam.value = null
  dialog.value = true
}

const edit = (id) => {
  selectedDam.value = dam.value.find(d => d.id === id)
  dialog.value = true
}

const remove = (id) => {
  selectedDam.value = dam.value.find(d => d.id === id)
  confirmDialog.value = true
}

const confirmRemove = async () => {
  await axios.delete(`/api/dam/${selectedDam.value.id}`)
  confirmDialog.value = false
  selectedDam.value = null
  loaddam()
}


const fetchDams = () => loaddam()

definePageMeta({
  middleware: "auth",
  layout: "default",
});

onMounted(() => {
  loaddam()
})
</script>