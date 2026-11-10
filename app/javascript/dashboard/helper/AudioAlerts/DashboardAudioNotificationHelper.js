import { MESSAGE_TYPE } from 'shared/constants/messages';
import { showBadgeOnFavicon } from './faviconHelper';
import { initFaviconSwitcher } from './faviconHelper';

import {
  AUDIO_ALERT_FREQUENCY,
  DEFAULT_AUDIO_ALERT_FREQUENCY,
  EVENT_TYPES,
} from 'dashboard/routes/dashboard/settings/profile/constants.js';
import GlobalStore from 'dashboard/store';
import AudioNotificationStore from './AudioNotificationStore';
import {
  isConversationAssignedToMe,
  isConversationUnassigned,
  isMessageFromCurrentUser,
} from './AudioMessageHelper';
import { useAlert } from 'dashboard/composables';
import wootConstants from 'dashboard/constants/globals';

const NOTIFICATION_TIME = 30000;
const ALERT_DURATION = 10000;
const ALERT_PATH_PREFIX = '/audio/dashboard/';
const DEFAULT_TONE = 'ding';
const DEFAULT_ALERT_TYPE = ['none'];

export class DashboardAudioNotificationHelper {
  constructor(store) {
    if (!store) {
      throw new Error('store is required');
    }
    this.store = new AudioNotificationStore(store);

    this.notificationConfig = {
      audioAlertType: DEFAULT_ALERT_TYPE,
      alertFrequency: DEFAULT_AUDIO_ALERT_FREQUENCY,
      alertIfUnreadConversationExist: false,
    };

    this.recurringNotificationTimer = null;

    this.audioConfig = {
      audio: null,
      tone: DEFAULT_TONE,
      hasSentSoundPermissionsRequest: false,
    };

    this.currentUser = null;
  }

  intializeAudio = () => {
    const resourceUrl = `${ALERT_PATH_PREFIX}${this.audioConfig.tone}.mp3`;
    this.audioConfig.audio = new Audio(resourceUrl);
    return this.audioConfig.audio.load();
  };

  playAudioAlert = async () => {
    try {
      await this.audioConfig.audio.play();
    } catch (error) {
      if (
        error.name === 'NotAllowedError' &&
        !this.hasSentSoundPermissionsRequest
      ) {
        this.hasSentSoundPermissionsRequest = true;
        useAlert(
          'PROFILE_SETTINGS.FORM.AUDIO_NOTIFICATIONS_SECTION.SOUND_PERMISSION_ERROR',
          { usei18n: true, duration: ALERT_DURATION }
        );
      }
    }
  };

  set = ({
    currentUser,
    alertFrequency = DEFAULT_AUDIO_ALERT_FREQUENCY,
    alertIfUnreadConversationExist,
    audioAlertType = DEFAULT_ALERT_TYPE,
    audioAlertTone = DEFAULT_TONE,
  }) => {
    this.notificationConfig = {
      ...this.notificationConfig,
      audioAlertType: audioAlertType.split('+').filter(Boolean),
      alertFrequency,
      alertIfUnreadConversationExist: alertIfUnreadConversationExist,
    };

    this.currentUser = currentUser;

    const previousAudioTone = this.audioConfig.tone;
    this.audioConfig = {
      ...this.audioConfig,
      tone: audioAlertTone,
    };

    if (!this.audioConfig.audio || previousAudioTone !== audioAlertTone) {
      this.intializeAudio();
    }

    initFaviconSwitcher();
    this.clearRecurringTimer();
    this.playAudioEvery30Seconds();
  };

  isMuted = () => {
    const { audioAlertType, alertFrequency } = this.notificationConfig;
    return (
      audioAlertType.includes('none') ||
      alertFrequency === AUDIO_ALERT_FREQUENCY.NEVER
    );
  };

  executeRecurringNotification = () => {
    if (this.store.hasUnreadConversation()) {
      this.playAudioAlert();
      showBadgeOnFavicon();
    }
    this.resetRecurringTimer();
  };

  clearRecurringTimer = () => {
    if (this.recurringNotificationTimer) {
      clearTimeout(this.recurringNotificationTimer);
    }
  };

  resetRecurringTimer = () => {
    this.clearRecurringTimer();
    this.recurringNotificationTimer = setTimeout(
      this.executeRecurringNotification,
      NOTIFICATION_TIME
    );
  };

  playAudioEvery30Seconds = () => {
    const { alertIfUnreadConversationExist } = this.notificationConfig;

    //  Audio alert is disabled dismiss the timer
    if (this.isMuted()) return;

    // If unread conversation flag is disabled, dismiss the timer
    if (!alertIfUnreadConversationExist) return;

    this.resetRecurringTimer();
  };

  shouldNotifyOnMessage = message => {
    const { audioAlertType } = this.notificationConfig;
    if (this.isMuted()) return false;
    if (audioAlertType.includes('all')) return true;

    const assignedToMe = isConversationAssignedToMe(
      message,
      this.currentUser.id
    );
    const isUnassigned = isConversationUnassigned(message);

    const shouldPlayAudio = [];

    if (
      audioAlertType.includes(EVENT_TYPES.ASSIGNED) ||
      audioAlertType.includes('mine')
    ) {
      shouldPlayAudio.push(assignedToMe);
    }
    if (audioAlertType.includes(EVENT_TYPES.UNASSIGNED)) {
      shouldPlayAudio.push(isUnassigned);
    }
    if (audioAlertType.includes(EVENT_TYPES.NOTME)) {
      shouldPlayAudio.push(!isUnassigned && !assignedToMe);
    }

    return shouldPlayAudio.some(Boolean);
  };

  triggerAlert = message => {
    if (!this.store.hasConversationPermission(this.currentUser)) return;
    if (!this.shouldNotifyOnMessage(message)) return;

    // Alerts play even when the dashboard is focused or the conversation is open
    this.playAudioAlert();
    showBadgeOnFavicon();
    this.playAudioEvery30Seconds();
  };

  triggerConversationAlert = conversation => {
    // Adapt the conversation once to the existing audio-filter contract. Bot IDs
    // must not be treated as human assignees, even when their IDs overlap.
    this.triggerAlert({
      conversation_id: conversation.id,
      conversation: {
        assignee_id:
          conversation.meta?.assignee_type === 'User'
            ? conversation.meta.assignee?.id
            : null,
      },
    });
  };

  onConversationBotHandoff = conversation => {
    this.triggerConversationAlert(conversation);
  };

  // In first-message mode a new chat alerts once, when the customer opens it. The widget
  // creates the conversation together with its first message, so the event carries it.
  onConversationCreated = conversation => {
    if (
      this.notificationConfig.alertFrequency !==
      AUDIO_ALERT_FREQUENCY.FIRST_MESSAGE
    ) {
      return;
    }
    if (conversation.status !== wootConstants.STATUS_TYPE.OPEN) return;

    const [firstMessage] = conversation.messages || [];
    if (firstMessage?.message_type !== MESSAGE_TYPE.INCOMING) return;

    this.triggerConversationAlert(conversation);
  };

  onNewMessage = message => {
    // First-message mode alerts from onConversationCreated instead
    if (
      this.notificationConfig.alertFrequency !==
      AUDIO_ALERT_FREQUENCY.EVERY_MESSAGE
    ) {
      return;
    }

    // Captain notes are context, not requests for attention. Only the dedicated
    // handoff event alerts agents, regardless of when its explanatory note arrives.
    if (message.private && message.sender?.type === 'captain_assistant') return;

    // If the conversation status is pending, then dismiss the alert
    // This case is common for all audio event types
    if (this.store.isMessageFromPendingConversation(message)) {
      return;
    }

    // If the message is sent by the current user then dismiss the alert
    if (isMessageFromCurrentUser(message, this.currentUser.id)) {
      return;
    }

    // If the message type is not incoming or private, then dismiss the alert
    const { message_type: messageType, private: isPrivate } = message;
    if (messageType !== MESSAGE_TYPE.INCOMING && !isPrivate) {
      return;
    }

    this.triggerAlert(message);
  };
}

export default new DashboardAudioNotificationHelper(GlobalStore);
