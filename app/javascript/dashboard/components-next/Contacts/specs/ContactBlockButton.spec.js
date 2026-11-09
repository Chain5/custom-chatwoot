import { mount } from '@vue/test-utils';
import { withFullI18n } from 'test-i18n';
import ContactBlockButton from '../ContactBlockButton.vue';

withFullI18n();

const NOW = new Date('2026-11-09T10:00:00Z');

const chooseDuration = async (wrapper, label) => {
  await wrapper.get('button').trigger('click');
  const option = wrapper
    .findAll('button')
    .find(button => button.text() === label);
  await option.trigger('click');
};

describe('ContactBlockButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('blocks until the end of the chosen duration', async () => {
    const wrapper = mount(ContactBlockButton);

    await chooseDuration(wrapper, 'For 24 hours');

    expect(wrapper.emitted('block')).toEqual([['2026-11-10T10:00:00.000Z']]);
  });

  it('blocks permanently without an expiry', async () => {
    const wrapper = mount(ContactBlockButton);

    await chooseDuration(wrapper, 'Permanently');

    expect(wrapper.emitted('block')).toEqual([[null]]);
  });

  it('shows the expiry of a temporary block and unblocks', async () => {
    const wrapper = mount(ContactBlockButton, {
      props: { isBlocked: true, blockedUntil: NOW.getTime() / 1000 },
    });

    expect(wrapper.text()).toContain('Blocked until Nov 9, 2026');

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('unblock')).toHaveLength(1);
  });

  it('shows no expiry for a permanent block', () => {
    const wrapper = mount(ContactBlockButton, { props: { isBlocked: true } });

    expect(wrapper.text()).not.toContain('Blocked until');
    expect(wrapper.text()).toContain('Unblock contact');
  });
});
