<template>
    <v-container>
        <v-row class="ma-0 pb-2">
            <v-btn variant="text" @click="$router.back()">
                <div class="d-flex align-center">
                    <Icon name="material-symbols:arrow-back-2" class="mr-1" />
                    ກັບຄືນ
                </div>
            </v-btn>
            <v-spacer></v-spacer>
            <h2>ອັບໂຫຼດແຜນພະລັງງານ</h2>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="tonal" @click="onSavefile" class="mr-2">
                <Icon name="material-symbols:save-rounded" class="text-primary" />
                <span>ບັນທຶກ</span>
            </v-btn>
        </v-row>
        <div>
            <v-file-upload v-model="fileUpload" clearable density="compact" variant="compact" rounded="lg" show-size
                title="ອັບໂຫຼດ" accept=".xlsx,.xls,.csv" @update:model-value="onFileUploadChange"></v-file-upload>
            <v-table v-if="dataList.length > 0">
                <thead>
                    <tr>
                        <th v-for="h in formatHeader">
                            {{ h }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(i, index) in dataList" :key="index">
                        <td v-for="(h, hIndex) in formatHeader" :key="h"> {{ i[h] }} </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </v-container>
</template>
<script setup>
import { utils, read, readFile } from "xlsx";
definePageMeta({
    middleware: "auth",
    layout: "default",
});
import { useAuthUser } from "~~/composables/useAuth";
import axios from "axios";
const fileUpload = ref();
const dataList = ref([]);
const headerText = ref([]);
const user = useAuthUser()
const formatHeader = ref([
    "Point Name",
    "nem.M_Dam.Ain.Main Dam Water Level of Main Dam Grit Chamber 1.OUTPUT",
    "nem.D_Dam.Ain.Diversion Dam Water Level of Diversion Dam Reservoir.OUTPUT",
    "nem.Nemswy.Ain.220kV 1# Incoming AIN-P1.OUTPUT",
    "nem.Nemswy.Ain.220kV 2# Incoming AIN-P1.OUTPUT",
    "nem.G1.Ain.Unit 1 Water Pressure after MIV.OUTPUT",
    "nem.G2.Ain.Unit 2Water Pressure after MIV.OUTPUT",
    "nem.Nemswy.Ain.220kV 1# Outgoing AIN-P1.OUTPUT",
    "nem.G1.Ain.Unit 1 Unit Flow.OUTPUT",
    "nem.G2.Ain.Unit 2Unit Flow.OUTPUT"
]);


const onCheckFormat = async () => {
    var notMacth = false;
    for (let h = 0; h < formatHeader.value.length; h++) {
        const a = headerText.value.includes(formatHeader.value[h]);
        if (!a) {
            notMacth = true;
            h = formatHeader.value.length;
        }
    }
    if (notMacth) {
        // nuxtApp.$openAlert("E", "Your form incorrect format");
        console.log("first")
        fileUpload.value = null;
        return false;
    }
    return true;
};

const onFileUploadChange = async (newValue) => {
    if (newValue) {
        await onReadFile();
    } else {
        dataList.value = [];
        headerText.value = [];
    }
};
const onReadFile = async () => {
    // var wb = XLSX.read(data, opts);

    const file = fileUpload.value;

    const data = await file.arrayBuffer();
    const workbook = read(data, { cellDates: true });
    // console.log(workbook)

    const sheetName = workbook.SheetNames[0];
    // console.log(sheetName);

    const worksheet = workbook.Sheets[sheetName];
    // console.log(worksheet);

    const json = utils.sheet_to_json(worksheet, {
        raw: true,
    });
    // console.log(Object.keys(json[0]));
    headerText.value = Object.keys(json[0]);

    if (await onCheckFormat()) {
        dataList.value = json;
        console.log(dataList.value)

    } else {
        console.log("null")
        dataList.value = [];
    }
};


const onSavefile = async () => {
    // Handle file upload logic here
    for (let i = 0; i < dataList.value.length; i++) {
        const el = dataList.value[i];
        const h = formatHeader.value;

        var body = {
            date: el[h[0]],
            main_dam: el[h[1]],
            diversion: el[h[2]],
            power1: el[h[3]],
            power2: el[h[4]],
            water_unit1: el[h[5]],
            water_unit2: el[h[6]],
            user: user.value?.USER_NAME,
        };
        console.log(body)

        const res = await axios.post('/api/plan', body)
        if (res.data.code === "00") {
            showSnackbar('ການສ້າງແຜນທັບຊ້ອນກັນກະລຸນາກວດສອບ', 'error')
        }
    }
};
</script>