<template>
    <v-container fluid>
        <v-overlay :model-value="loading" persistent class="align-center justify-center" scrim="rgba(0,0,0,0.4)">
            <v-progress-circular indeterminate color="primary" size="64" />
        </v-overlay>
        <v-row class="ma-0 pb-2">
            <v-btn variant="text" @click="$router.back()">
                <div class="d-flex align-center">
                    <Icon name="material-symbols:arrow-back-2" class="mr-1" />
                    ກັບຄືນ
                </div>
            </v-btn>
            <v-spacer></v-spacer>
            <h2>ອັບໂຫຼດຂໍ້ມູນ</h2>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="tonal" :disabled="dataList.length > 0 ? false : true" @click="onSavefile"
                class="mr-2">
                <Icon name="material-symbols:save-rounded" class="text-primary" />
                <span>ບັນທຶກ</span>
            </v-btn>
        </v-row>

        <div>
            <v-file-upload v-model="fileUpload" clearable density="compact" variant="compact" rounded="lg" show-size
                title="ອັບໂຫຼດ" accept=".xlsx,.xls,.csv" @update:model-value="onFileUploadChange"></v-file-upload>

            <div style="overflow-x: auto">
                <v-table v-if="dataList.length > 0" density="compact">
                    <thead>
                        <tr>
                            <th v-for="c in columns" :key="c.key" style="white-space: pre-line">{{ c.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in dataList" :key="index">
                            <td v-for="c in columns" :key="c.key">{{ row[c.key] }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </div>
        </div>
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup>
import { utils, read, SSF } from "xlsx";
import axios from "axios";
import { useAuthUser } from "~~/composables/useAuth";

definePageMeta({ middleware: "auth", layout: "default" });
const saving = ref(false);
const loading = ref(false);
const fileUpload = ref();
const dataList = ref([]);
const user = useAuthUser();
const snackbar = ref({ show: false, message: '', color: 'success' })


const showSnackbar = (message, color = 'success') => {
    snackbar.value = { show: true, message, color }
}

// One entry per Excel column, in order. `key` is the field name sent to the API.
const columns = [
    { key: "date", label: "Date", type: "date" },
    { key: "dam", label: "Dam", type: "text" },
    { key: "energy_plan", label: "Energy Plan\n(GWh)", type: "num" },
    { key: "energy_actual", label: "Actual Energy\n(GWh)", type: "num" },
    { key: "revenue_plan", label: "Plan Revenue\n(MUSD)", type: "num" },
    { key: "revenue_actual", label: "Actual Revenue\n(MUSD)", type: "num" },
    { key: "turbine_flow_plan", label: "Plan Turbine Flow\n(MCM)", type: "num" },
    { key: "turbine_flow", label: "Turbine Flow\n(MCM)", type: "num" },
    { key: "spill", label: "Spill\n(MCM)", type: "num" },
    { key: "total_outflow", label: "Total Outflow\n(MCM)", type: "num" },
    { key: "inflow_plan", label: "Inflow Plan\n(MCM)", type: "num" },
    { key: "inflow_actual", label: "Actual Inflow\n(MCM)", type: "num" },

    // Main dam (MD)
    { key: "md_plan_wl", label: "Plan\nMD WL\n(masl)", type: "num" },
    { key: "md_plan_total_volume", label: "Plan\nMD total Volume\n(MCM)", type: "num" },
    { key: "md_plan_usable_volume", label: "Plan\nUsable water volume\n(MCM)", type: "num" },
    { key: "md_actual_wl", label: "MD actual WL\n(masl)", type: "num" },
    { key: "md_total_volume", label: "MD total Volume\n(MCM)", type: "num" },
    { key: "md_usable_volume", label: "Usable water volume\n(MCM)", type: "num" },

    // Diversion dam (DIV)
    { key: "div_plan_wl", label: "Plan\nDIV WL\n(masl)", type: "num" },
    { key: "div_plan_total_volume", label: "Plan\nDIV total Volume\n(MCM)", type: "num" },
    { key: "div_plan_usable_volume", label: "Plan\nUsable water volume\n(MCM)", type: "num" },
    { key: "div_actual_wl", label: "DIV actual WL\n(masl)", type: "num" },
    { key: "div_total_volume", label: "DIV total Volume\n(MCM)", type: "num" },
    { key: "div_usable_volume", label: "Usable water volume\n(MCM)", type: "num" },

    { key: "tailrace_wl", label: "Tailrace WL\nmasl", type: "num" },
    { key: "rainfall", label: "Rainfall\nmm", type: "num" },
];
// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

const toMysqlDate = (value) => {
    if (value == null || value === "") return null;

    if (typeof value === "number") {            // Excel serial number
        const { y, m, d } = SSF.parse_date_code(value);
        return `${y}-${pad(m)}-${pad(d)}`;
    }

    const t = String(value).trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);          // 2026-10-01
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

    m = t.match(/^(\d{1,2})[-\s/]([A-Za-z]{3})[A-Za-z]*[-\s/](\d{2}|\d{4})$/); // 30-Sep-26
    if (m) {
        const mon = MONTHS[m[2].toLowerCase()];
        const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
        if (mon) return `${year}-${pad(mon)}-${pad(m[1])}`;
    }
    return null;
};

const toNum = (v) => {
    if (v == null || v === "") return null;       // blank -> NULL in MySQL
    const n = Number(String(v).replace(/,/g, ""));
    return isNaN(n) ? null : n;
};

// ---------- read file ----------
const onFileUploadChange = async (newValue) => {
    if (newValue) {
        await onReadFile();
    } else {
        dataList.value = [];
    }
};

const onReadFile = async () => {
    const file = fileUpload.value;
    const data = await file.arrayBuffer();

    const workbook = read(data);                  // no cellDates: dates stay as serial numbers
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // 2nd sheet, as in your code

    // array of arrays; blank cells stay as undefined so column positions never shift
    const rows = utils.sheet_to_json(worksheet, { header: 1, raw: true, blankrows: false });

    // check header row by position
    const headerRow = rows[0] || [];
    const bad = columns.findIndex((c, i) => norm(headerRow[i]) !== norm(c.label));
    if (bad !== -1) {
        console.log("Header mismatch at column", bad, "expected:", columns[bad].label, "got:", headerRow[bad]);
        fileUpload.value = null;
        dataList.value = [];
        showSnackbar("ຮູບແບບໄຟລ໌ບໍ່ຖືກຕ້ອງ " + headerRow[bad] + " ກະລຸນາກວດສອບ", "error");
        return;
    }

    // convert every data row into an object ready for the API
    dataList.value = rows
        .slice(1)
        .map((r) => {
            const obj = {};
            columns.forEach((c, i) => {
                if (c.type === "date") obj[c.key] = toMysqlDate(r[i]);   // "2026-09-30"
                else if (c.type === "num") obj[c.key] = toNum(r[i]);
                else obj[c.key] = r[i] == null ? null : String(r[i]).trim();
            });
            return obj;
        })
        .filter((o) => o.date && o.dam);            // skip empty / invalid rows

};


const setdam = (v) => String(v ?? "").toLowerCase().trim();

// returns the list of dam codes that do NOT exist in /api/branch
const findInvalidDams = async () => {
    const res = await axios.get("/api/branch");
    const validCodes = new Set(res.data.DATA.map((d) => setdam(d.BR_CODE)));

    const invalid = new Set();
    for (const row of dataList.value) {
        if (!validCodes.has(setdam(row.dam))) invalid.add(row.dam);
    }
    return [...invalid];
};



// ---------- save ----------

const onSavefile = async () => {
    if (!dataList.value.length || saving.value) return;

    loading.value = true;
    saving.value = true;

    try {
        // 1) check dams first, nothing is inserted if any dam is wrong
        let invalidDams;
        try {
            invalidDams = await findInvalidDams();
        } catch (e) {
            console.error(e);
            showSnackbar("ບໍ່ສາມາດກວດສອບລະຫັດເຂື່ອນໄດ້", "error");
            return;
        }

        if (invalidDams.length) {
            console.error("Dam not match:", invalidDams);
            showSnackbar(
                `ບັນທຶກບໍ່ສຳເລັດ ກະລຸນາກວດສອບລະຫັດເຂື່ອນ: ${invalidDams.join(", ")}`,
                "error"
            );
            return;                       // stop here, no insert
        }

        // 2) all dams are valid, now insert
        let ok = 0;
        const dup = [];
        const bad = [];

        for (const row of dataList.value) {
            const body = { ...row, user: user.value?.USER_NAME };
            try {
                const res = await axios.post("/api/data", body);
                const { code, message } = res.data;

                if (code === "00") ok++;
                else if (code === "02") dup.push({ date: row.date, dam: row.dam, message });
                else bad.push({ date: row.date, dam: row.dam, message });
            } catch (e) {
                bad.push({
                    date: row.date,
                    dam: row.dam,
                    message: e.response?.data?.message || e.message,
                });
            }
        }

        if (bad.length) {
            console.log("Failed rows:", bad);
            showSnackbar(`ບັນທຶກສຳເລັດ ${ok}, ຊ້ຳ ${dup.length}, ຜິດພາດ ${bad.length}`, "error");
        } else if (dup.length) {
            console.log("Duplicate rows:", dup);
            showSnackbar(`ບັນທຶກສຳເລັດ ${ok}, ຂໍ້ມູນຊ້ຳ ${dup.length}`, "warning");
        } else {
            showSnackbar(`ບັນທຶກສຳເລັດ ${ok} ແຖວ`, "success");
        }
    } finally {
        saving.value = false;      // always runs, even on the early return
        loading.value = false;
    }
};
</script>