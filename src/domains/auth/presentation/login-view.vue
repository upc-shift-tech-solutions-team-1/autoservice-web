<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../application/auth.store';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import LanguageSwitcher from '../../../shared/presentation/language-switcher.vue';
import { API_BASE_URL } from '../../../shared/infrastructure/http-common';
/**
 * Login/Register component.
 * Handles authentication flow for workshop registration and login.
 */
const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const isRegister = ref(false);


const showForgotDialog = ref(false);
const forgotEmail = ref('');
const forgotMessage = ref(null);
const forgotSuccess = ref(false);

const form = ref({
  workshopName: '',
  email: '',
  password: ''
});
const loginWithGoogle = () => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

const loginWithMicrosoft = () => {
  window.location.href = `${API_BASE_URL}/auth/microsoft`;
};

/**
 * Handles form submission for login or workshop registration.
 */
const handleSubmit = async () => {
  if (!form.value.email || !form.value.password) return;

  if (isRegister.value) {
    if (!form.value.workshopName) return;
    const success = await authStore.registerWorkshop(form.value.workshopName, form.value.email, form.value.password);
    if (success) {
      await authStore.login(form.value.email, form.value.password);
      router.push('/');
    }
  } else {
    const success = await authStore.login(form.value.email, form.value.password);
    if (success) {
      if (authStore.user?.role === 'mechanic') {
        router.push('/mechanic/workspace');
      } else {
        router.push('/');
      }
    }
  }
};
const handleForgotPassword = async () => {
  if (!forgotEmail.value) return;

  const result = await authStore.forgotPassword(forgotEmail.value);
  forgotSuccess.value = result.success;
  forgotMessage.value = result.message;

  if (result.success) {
    setTimeout(() => {
      showForgotDialog.value = false;
      forgotEmail.value = '';
      forgotMessage.value = null;
    }, 3000);
  }
};
</script>

<template>
  <div class="login-layout">
    <div class="hero-section">
      <div class="hero-content">
        <h1>{{ isRegister ? t('login.registerHeroTitle') : t('login.title') }}</h1>
        <p>{{ isRegister ? t('login.registerHeroSubtitle') : t('login.subtitle') }}</p>
      </div>
    </div>

    <div class="form-section">
      <div class="login-box">
        <div class="lang-switcher-wrapper">
          <LanguageSwitcher />
        </div>

        <div class="login-header">
          <h2>{{ isRegister ? t('login.registerTitle') : t('login.welcome') }}</h2>
          <p>{{ isRegister ? t('login.registerDescription') : t('login.description') }}</p>
        </div>


        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="input-group" v-if="isRegister">
            <label for="workshopName">{{ t('login.workshopName') }}</label>
            <InputText id="workshopName" v-model="form.workshopName" :placeholder="t('login.workshopPlaceholder')" />
          </div>

          <div class="input-group">
            <label for="email">{{ t('login.email') }}</label>
            <InputText id="email" v-model="form.email" type="email" :placeholder="t('login.emailPlaceholder')" />
          </div>

          <div class="input-group">
            <label for="password">{{ t('login.password') }}</label>
            <Password id="password" v-model="form.password" :feedback="false" toggleMask :placeholder="t('login.passwordPlaceholder')" />
          </div>

          <div v-if="authStore.error" class="error-message">
            <i class="pi pi-exclamation-circle"></i> {{ authStore.error }}
          </div>

          <Button type="submit" :label="isRegister ? t('login.registerButton') : t('login.submit')" :loading="authStore.loading" class="p-button-primary w-full mt-3" />
          <!-- Link Olvidé mi contraseña (solo en modo login) -->
          <div v-if="!isRegister" class="forgot-password">
            <a href="#" @click.prevent="showForgotDialog = true" class="text-primary text-sm">
              {{ t('login.forgotPassword') || '¿Olvidaste tu contraseña?' }}
            </a>
          </div>
          <!-- Social Login - En una sola fila -->
          <div class="social-login">
            <Button
                label="Google"
                icon="pi pi-google"
                class="p-button-outlined flex-1"
                @click="loginWithGoogle" />

            <Button
                label="Microsoft"
                icon="pi pi-microsoft"
                class="p-button-outlined flex-1 ml-3"
                @click="loginWithMicrosoft" />
          </div>

          <div class="divider">
            <span>O</span>
          </div>

          <div class="auth-links">

            <div class="auth-row">
              <span>{{ isRegister ? t('login.hasAccount') : t('login.noWorkshop') }}</span>

              <a
                  href="#"
                  @click.prevent="isRegister=!isRegister">

                {{ isRegister
                  ? t('login.loginHere')
                  : t('login.registerHere') }}

              </a>
            </div>

            <hr>

            <router-link
                to="/tracking"
                class="tracking">

              {{ t('auth.question') }}

            </router-link>

          </div>
        </form>
      </div>
    </div>
  </div>
  <Dialog v-model:visible="showForgotDialog"
          :header="t('login.forgotPasswordTitle') || 'Recuperar Contraseña'"
          :modal="true"
          :style="{ width: '420px' }">

    <div class="p-fluid">
      <p class="mb-4">{{ t('login.forgotPasswordDescription') || 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.' }}</p>

      <InputText
          v-model="forgotEmail"
          type="email"
          :placeholder="t('login.emailPlaceholder')"
          class="mb-3" />

      <Message v-if="forgotMessage"
               :severity="forgotSuccess ? 'success' : 'error'">
        {{ forgotMessage }}
      </Message>
    </div>

    <template #footer>
      <Button label="Cancelar" text @click="showForgotDialog = false" />
      <Button label="Enviar Enlace"
              :loading="authStore.loading"
              @click="handleForgotPassword"
              :disabled="!forgotEmail" />
    </template>
  </Dialog>
</template>
<style scoped>
.login-layout {display: flex;min-height: 100vh;width: 100%;background: #f4f6fa;font-family: Inter, system-ui, sans-serif;}
.hero-section {flex: 1;position: relative;background: linear-gradient(rgba(9,15,35,.55), rgba(9,15,35,.55)), url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1600&auto=format&fit=crop");background-size: cover;background-position: center;display: flex;align-items: center;justify-content: center;padding: 4rem;}

.hero-content {color: white;max-width: 470px;}

.hero-content h1 {font-size: 3rem;font-weight: 800;margin-bottom: .7rem;}

.hero-content p {font-size: 1rem;
  line-height: 1.6;
  color: rgba(255,255,255,.9);
}

/*======================
  FORM
=======================*/

.form-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: #f7f8fb;
}

.login-box {
  width: 100%;
  max-width: 430px;
  background: white;
  border-radius: 18px;
  padding: 2.5rem;
  border-top: 4px solid #0b1680;
  box-shadow: 0 20px 45px rgba(0,0,0,.08);
}

/*======================
  LANGUAGE
=======================*/

.lang-switcher-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.3rem;
}

/*======================
  HEADER
=======================*/

.login-header {
  text-align: center;
  margin-bottom: 1.8rem;
}

.login-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: .5rem;
}

.login-header p {
  color: #6b7280;
  font-size: .95rem;
}

/*======================
  FORM
=======================*/

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: .45rem;
}

.input-group label {
  font-size: .78rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: .4px;
}

/*======================
  INPUTS
=======================*/

:deep(.p-inputtext),
:deep(.p-password-input) {
  width: 100%;
  border-radius: 10px;
  padding: .85rem 1rem;
  background: #fbfbfc;
  border: 1px solid #d1d5db;
  transition: .2s;
}

:deep(.p-password){
  width:100%;
}

:deep(.p-password-panel){
  display:none;
}

:deep(.p-inputtext:focus),
:deep(.p-password-input:focus){
  border-color:#0b1680;
  box-shadow:0 0 0 3px rgba(11,22,128,.12);
  background:white;
}

/*======================
  BUTTON
=======================*/

:deep(.p-button){
  width:100%;
  border-radius:10px !important;
  padding:.9rem !important;
  font-weight:600;
}

:deep(.p-button-primary){
  background:#0b1680 !important;
  border:none !important;
  box-shadow:0 10px 25px rgba(11,22,128,.25);
}

:deep(.p-button-primary:hover){
  transform:translateY(-1px);
}

/*======================
  ERROR
=======================*/

.error-message{
  display:flex;
  align-items:center;
  gap:.5rem;
  padding:.8rem;
  border-radius:10px;
  background:#fef2f2;
  border:1px solid #fecaca;
  color:#dc2626;
  font-size:.85rem;
}

/*======================
  FORGOT
=======================*/

.forgot-password{
  display:flex;
  justify-content:flex-end;
  margin-top:-8px;
  margin-bottom:-2px;
}

.forgot-password a{
  font-size:.82rem;
  text-decoration:none;
  color:#0b1680;
}

.forgot-password a:hover{
  text-decoration:underline;
}

/*======================
  SOCIAL
=======================*/

.social-login{
  display:flex;
  gap:10px;
  margin-top:.3rem;
}

.social-login .p-button{
  flex:1;
}

:deep(.p-button-outlined){
  background:white !important;
  color:#374151 !important;
  border:1px solid #d1d5db !important;
  box-shadow:none !important;
}

:deep(.p-button-outlined:hover){
  background:#f8fafc !important;
}

/*======================
  DIVIDER
=======================*/

.divider{
  display:flex;
  align-items:center;
  margin:1rem 0;
  color:#9ca3af;
  font-size:.85rem;
}

.divider::before,
.divider::after{
  content:"";
  flex:1;
  border-top:1px solid #e5e7eb;
}

.divider span{
  padding:0 1rem;
}

/*======================
  LINKS
=======================*/

.auth-links{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:.8rem;
  margin-top:.3rem;
}

.auth-links span{
  color:#6b7280;
}

.auth-links a{
  color:#0b1680;
  font-weight:600;
  text-decoration:none;
}

.auth-links a:hover{
  text-decoration:underline;
}

.auth-links hr{
  width:100%;
  border:none;
  border-top:1px solid #e5e7eb;
  margin:.2rem 0;
}

.tracking{
  font-weight:600;
  color:#0b1680;
}

/* Hace que el texto y el enlace queden en la misma línea */
.auth-links span,
.auth-links a{
  display:inline;
}

/*======================
  RESPONSIVE
=======================*/

@media(max-width:900px){

  .login-layout{
    flex-direction:column;
  }

  .hero-section{
    min-height:220px;
    padding:2rem;
  }

  .hero-content{
    text-align:center;
  }

  .hero-content h1{
    font-size:2.2rem;
  }

  .form-section{
    padding:1rem;
  }

  .login-box{
    max-width:100%;
    margin-top:-35px;
    position:relative;
    z-index:2;
    padding:2rem;
  }

}

@media(max-width:576px){

  .social-login{
    flex-direction:column;
  }

  .hero-section{
    min-height:180px;
  }

  .hero-content h1{
    font-size:1.8rem;
  }

  .login-box{
    padding:1.5rem;
  }

}
</style>