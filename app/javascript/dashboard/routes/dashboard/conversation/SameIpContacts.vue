<script setup>
import { ref, watch } from 'vue';
import ContactAPI from 'dashboard/api/contacts';
import { useAccount } from 'dashboard/composables/useAccount';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

const props = defineProps({
  contactId: {
    type: Number,
    required: true,
  },
});

const { accountScopedUrl } = useAccount();

const contacts = ref([]);
const isLoading = ref(false);
const hasError = ref(false);

const fetchSameIpContacts = async contactId => {
  isLoading.value = true;
  hasError.value = false;
  try {
    const { data } = await ContactAPI.getSameIpContacts(contactId);
    contacts.value = data.payload;
  } catch (error) {
    contacts.value = [];
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const contactLabel = contact =>
  contact.name || contact.email || contact.identifier || `#${contact.id}`;

watch(() => props.contactId, fetchSameIpContacts, { immediate: true });
</script>

<template>
  <div class="px-2 pb-2">
    <div v-if="isLoading" class="flex justify-center py-4">
      <Spinner />
    </div>
    <p v-else-if="hasError" class="text-sm text-n-ruby-11">
      {{ $t('CONVERSATION_SIDEBAR.SAME_IP_CONTACTS.ERROR') }}
    </p>
    <p v-else-if="!contacts.length" class="text-sm text-n-slate-11">
      {{ $t('CONVERSATION_SIDEBAR.SAME_IP_CONTACTS.EMPTY') }}
    </p>
    <template v-else>
      <p class="mb-2 text-xs text-n-slate-11">
        {{ $t('CONVERSATION_SIDEBAR.SAME_IP_CONTACTS.HINT') }}
      </p>
      <ul class="flex flex-col gap-2">
        <li v-for="contact in contacts" :key="contact.id">
          <router-link
            :to="accountScopedUrl(`contacts/${contact.id}`)"
            class="text-sm font-medium text-n-slate-12 hover:underline"
          >
            {{ contactLabel(contact) }}
          </router-link>
          <div
            v-if="contact.conversations.length"
            class="flex flex-wrap gap-2 mt-1"
          >
            <router-link
              v-for="conversation in contact.conversations"
              :key="conversation.id"
              :to="accountScopedUrl(`conversations/${conversation.id}`)"
              class="text-xs text-n-blue-11 hover:underline"
            >
              {{ `#${conversation.id}` }}
            </router-link>
          </div>
          <p v-else class="mt-1 text-xs text-n-slate-11">
            {{ $t('CONVERSATION_SIDEBAR.SAME_IP_CONTACTS.NO_CONVERSATIONS') }}
          </p>
        </li>
      </ul>
    </template>
  </div>
</template>
