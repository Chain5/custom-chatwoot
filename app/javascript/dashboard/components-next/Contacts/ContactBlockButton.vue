<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { vOnClickOutside } from '@vueuse/components';

import Button from 'dashboard/components-next/button/Button.vue';
import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';
import { dateFormat } from 'shared/helpers/timeHelper';

const props = defineProps({
  isBlocked: {
    type: Boolean,
    default: false,
  },
  // Unix timestamp in seconds; null means the block is permanent
  blockedUntil: {
    type: Number,
    default: null,
  },
  isUpdating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['block', 'unblock']);

const HOUR_IN_MS = 60 * 60 * 1000;
const BLOCK_DURATIONS = {
  ONE_HOUR: HOUR_IN_MS,
  ONE_DAY: 24 * HOUR_IN_MS,
  SEVEN_DAYS: 7 * 24 * HOUR_IN_MS,
  PERMANENT: null,
};

const { t } = useI18n();

const showDurations = ref(false);

const durationMenuItems = computed(() => [
  {
    label: t('CONTACTS_LAYOUT.HEADER.BLOCK_DURATION.ONE_HOUR'),
    action: 'ONE_HOUR',
    value: 'ONE_HOUR',
  },
  {
    label: t('CONTACTS_LAYOUT.HEADER.BLOCK_DURATION.ONE_DAY'),
    action: 'ONE_DAY',
    value: 'ONE_DAY',
  },
  {
    label: t('CONTACTS_LAYOUT.HEADER.BLOCK_DURATION.SEVEN_DAYS'),
    action: 'SEVEN_DAYS',
    value: 'SEVEN_DAYS',
  },
  {
    label: t('CONTACTS_LAYOUT.HEADER.BLOCK_DURATION.PERMANENT'),
    action: 'PERMANENT',
    value: 'PERMANENT',
  },
]);

const blockedUntilLabel = computed(() => {
  if (!props.blockedUntil) return '';

  return t('CONTACTS_LAYOUT.HEADER.BLOCKED_UNTIL', {
    date: dateFormat(props.blockedUntil, 'MMM d, yyyy h:mm a'),
  });
});

const handleDurationSelect = ({ action }) => {
  const durationMs = BLOCK_DURATIONS[action];
  showDurations.value = false;
  emit(
    'block',
    durationMs ? new Date(Date.now() + durationMs).toISOString() : null
  );
};
</script>

<template>
  <div v-if="isBlocked" class="flex items-center gap-2">
    <span v-if="blockedUntilLabel" class="text-xs text-n-slate-11">
      {{ blockedUntilLabel }}
    </span>
    <Button
      :label="$t('CONTACTS_LAYOUT.HEADER.UNBLOCK_CONTACT')"
      size="sm"
      slate
      :is-loading="isUpdating"
      :disabled="isUpdating"
      @click="emit('unblock')"
    />
  </div>
  <div
    v-else
    v-on-click-outside="() => (showDurations = false)"
    class="relative"
  >
    <Button
      :label="$t('CONTACTS_LAYOUT.HEADER.BLOCK_CONTACT')"
      size="sm"
      slate
      :is-loading="isUpdating"
      :disabled="isUpdating"
      @click="showDurations = !showDurations"
    />
    <DropdownMenu
      v-if="showDurations"
      :menu-items="durationMenuItems"
      class="ltr:right-0 rtl:left-0 mt-1 w-44 top-full"
      @action="handleDurationSelect"
    />
  </div>
</template>
