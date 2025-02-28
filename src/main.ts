import { createApp } from 'vue';
import './style.css'
import App from './App.vue';
import { createI18n } from 'vue-i18n';

import ar from './locales/ar.json';
import en from './locales/en.json';

// Configure I18n
const i18n = createI18n({
    legacy: false,
    locale: 'ar', // Default language
    fallbackLocale: 'en',
    messages: {
        ar,
        en
    }
});

const app = createApp(App);
app.use(i18n);
app.mount('#app');
