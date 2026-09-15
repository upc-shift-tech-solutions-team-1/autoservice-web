/**
 * Application bootstrap entry point.
 * Registers plugins, global components and mounts the app.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import ProgressBar from 'primevue/progressbar';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import App from './App.vue';
import i18n from './i18n.js';
import router from './router';

import 'primeicons/primeicons.css';
import './style.css';
import {Tooltip} from "primevue";

const app = createApp(App);

// ── Plugins ───────────────────────────────────────────────
app.use(createPinia());

app.use(router);

app.use(i18n);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.my-app-dark'
        }
    }
});
app.directive('tooltip', Tooltip)
// ── Global components ─────────────────────────────────────
app.component('Avatar', Avatar);
app.component('Button', Button);
app.component('Card', Card);
app.component('Dialog', Dialog);
app.component('InputNumber', InputNumber);
app.component('InputText', InputText);
app.component('ProgressBar', ProgressBar);
app.component('Select', Select);
app.component('Tag', Tag);
app.component('Textarea', Textarea);

// ── Mount app ─────────────────────────────────────────────
app.mount('#app');