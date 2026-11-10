<script setup>
import { useAlert } from 'dashboard/composables';
import { useUISettings } from 'dashboard/composables/useUISettings';
import AudioAlertTone from './AudioAlertTone.vue';
import AudioAlertEvent from './AudioAlertEvent.vue';
import AudioAlertCondition from './AudioAlertCondition.vue';
import FormSelect from 'v3/components/Form/Select.vue';
import {
  AUDIO_ALERT_FREQUENCY,
  DEFAULT_AUDIO_ALERT_FREQUENCY,
} from './constants';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'dashboard/composables/store';
const store = useStore();
import { useI18n } from 'vue-i18n';
import camelcaseKeys from 'camelcase-keys';
import { initializeAudioAlerts } from 'dashboard/helper/scriptHelpers';
import { useStoreGetters } from 'dashboard/composables/store';

const getters = useStoreGetters();
const currentUser = computed(() => getters.getCurrentUser.value);

const { uiSettings, updateUISettings } = useUISettings();

const { t } = useI18n();
const audioAlert = ref('');
const alertFrequency = ref(DEFAULT_AUDIO_ALERT_FREQUENCY);
const alertIfUnreadConversationExist = ref(false);
const alertTone = ref('ding');
const audioAlertConditions = ref([]);
const i18nKeyPrefix = 'PROFILE_SETTINGS.FORM.AUDIO_NOTIFICATIONS_SECTION';

const initializeNotificationUISettings = newUISettings => {
  const updatedUISettings = camelcaseKeys(newUISettings);

  audioAlert.value = updatedUISettings.enableAudioAlerts;
  alertFrequency.value =
    updatedUISettings.audioAlertFrequency || DEFAULT_AUDIO_ALERT_FREQUENCY;
  alertIfUnreadConversationExist.value =
    updatedUISettings.alertIfUnreadAssignedConversationExist;
  audioAlertConditions.value = [
    {
      id: 'audio2',
      label: t(`${i18nKeyPrefix}.CONDITIONS.CONDITION_TWO`),
      model: alertIfUnreadConversationExist.value,
      value: 'conversations_are_read',
    },
  ];
  alertTone.value = updatedUISettings.notificationTone || 'ding';
};

watch(
  uiSettings,
  value => {
    initializeNotificationUISettings(value);
  },
  { immediate: true }
);

const handleAudioConfigChange = value => {
  updateUISettings(value);
  initializeAudioAlerts(currentUser.value);
  useAlert(t('PROFILE_SETTINGS.FORM.API.UPDATE_SUCCESS'));
};

onMounted(() => {
  store.dispatch('userNotificationSettings/get');
});

const handAudioAlertChange = value => {
  audioAlert.value = value;
  handleAudioConfigChange({
    enable_audio_alerts: value,
  });
};
const alertFrequencyOptions = computed(() => [
  {
    value: AUDIO_ALERT_FREQUENCY.EVERY_MESSAGE,
    label: t(
      'PROFILE_SETTINGS.FORM.AUDIO_NOTIFICATIONS_SECTION.FREQUENCY.EVERY_MESSAGE'
    ),
  },
  {
    value: AUDIO_ALERT_FREQUENCY.FIRST_MESSAGE,
    label: t(
      'PROFILE_SETTINGS.FORM.AUDIO_NOTIFICATIONS_SECTION.FREQUENCY.FIRST_MESSAGE'
    ),
  },
  {
    value: AUDIO_ALERT_FREQUENCY.NEVER,
    label: t(
      'PROFILE_SETTINGS.FORM.AUDIO_NOTIFICATIONS_SECTION.FREQUENCY.NEVER'
    ),
  },
]);

const handleAlertFrequencyChange = value => {
  alertFrequency.value = value;
  handleAudioConfigChange({ audio_alert_frequency: value });
};
const handleAudioAlertConditions = (id, value) => {
  if (id === 'conversations_are_read') {
    handleAudioConfigChange({
      alert_if_unread_assigned_conversation_exist: value,
    });
  }
};
const handleAudioToneChange = value => {
  handleAudioConfigChange({ notification_tone: value });
};
</script>

<template>
  <div id="profile-settings-notifications" class="flex flex-col gap-6">
    <AudioAlertTone
      :value="alertTone"
      :label="$t(`${i18nKeyPrefix}.DEFAULT_TONE.TITLE`)"
      @change="handleAudioToneChange"
    />

    <FormSelect
      :model-value="alertFrequency"
      name="audioAlertFrequency"
      spacing="compact"
      :label="
        $t('PROFILE_SETTINGS.FORM.AUDIO_NOTIFICATIONS_SECTION.FREQUENCY.TITLE')
      "
      @update:model-value="handleAlertFrequencyChange"
    >
      <option
        v-for="option in alertFrequencyOptions"
        :key="option.value"
        :value="option.value"
        :selected="option.value === alertFrequency"
      >
        {{ option.label }}
      </option>
    </FormSelect>

    <AudioAlertEvent
      :label="$t(`${i18nKeyPrefix}.ALERT_TYPE.TITLE`)"
      :value="audioAlert"
      @update="handAudioAlertChange"
    />

    <AudioAlertCondition
      :items="audioAlertConditions"
      :label="$t(`${i18nKeyPrefix}.CONDITIONS.TITLE`)"
      @change="handleAudioAlertConditions"
    />
  </div>
</template>
