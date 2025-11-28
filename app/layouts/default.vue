<template>
    <v-card>
        <v-layout>
            <v-app-bar color="primary">
                <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

                <v-toolbar-title>ຈະເລີນເຊກອງ</v-toolbar-title>

                <template v-if="$vuetify.display.mdAndUp">
                    <v-btn icon="mdi-magnify" variant="text"></v-btn>

                    <v-btn icon="mdi-filter" variant="text"></v-btn>
                </template>

                <v-btn icon="mdi-dots-vertical" variant="text"></v-btn>
            </v-app-bar>

            <v-navigation-drawer v-model="drawer" :location="$vuetify.display.mobile ? 'left' : undefined" >
                <v-list :items="items"></v-list>
                <template v-slot:append>
                    <div class="pa-2">
                        <!-- Logout Button -->
                        <v-btn color="primary" block @click="confirmDialog = true">
                            ອອກຈາກລະບົບ
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

const items = [
    {
        title: 'Foo',
        value: 'foo',
    },
    {
        title: 'Bar',
        value: 'bar',
    },
    {
        title: 'Fizz',
        value: 'fizz',
    },
    {
        title: 'Buzz',
        value: 'buzz',
    },
]
const confirmDialog = ref(false)
const drawer = ref(true)
const group = ref(null)

watch(group, () => {
    drawer.value = true
})
</script>