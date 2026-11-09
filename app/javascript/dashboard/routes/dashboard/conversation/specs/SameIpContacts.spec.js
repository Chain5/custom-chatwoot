import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import { withFullI18n } from 'test-i18n';
import ContactAPI from 'dashboard/api/contacts';
import SameIpContacts from '../SameIpContacts.vue';

vi.mock('dashboard/api/contacts', () => ({
  default: { getSameIpContacts: vi.fn() },
}));

vi.mock('dashboard/composables/useAccount', () => ({
  useAccount: () => ({ accountScopedUrl: url => `/app/accounts/1/${url}` }),
}));

withFullI18n();

const mountComponent = async () => {
  const wrapper = mount(SameIpContacts, {
    props: { contactId: 7 },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
};

describe('SameIpContacts', () => {
  it('links each contact and its conversations', async () => {
    ContactAPI.getSameIpContacts.mockResolvedValue({
      data: {
        payload: [
          {
            id: 9,
            name: 'Other Username',
            conversations: [{ id: 42 }, { id: 43 }],
          },
        ],
      },
    });

    const wrapper = await mountComponent();

    expect(ContactAPI.getSameIpContacts).toHaveBeenCalledWith(7);
    const links = wrapper
      .findAllComponents(RouterLinkStub)
      .map(link => [link.text(), link.props('to')]);
    expect(links).toEqual([
      ['Other Username', '/app/accounts/1/contacts/9'],
      ['#42', '/app/accounts/1/conversations/42'],
      ['#43', '/app/accounts/1/conversations/43'],
    ]);
    expect(wrapper.text()).toContain('may be different people');
  });

  it('shows an empty state when no contact shares the IP', async () => {
    ContactAPI.getSameIpContacts.mockResolvedValue({ data: { payload: [] } });

    const wrapper = await mountComponent();

    expect(wrapper.text()).toContain('No other contacts share this IP');
  });

  it('shows an error when the request fails', async () => {
    ContactAPI.getSameIpContacts.mockRejectedValue(new Error('network'));

    const wrapper = await mountComponent();

    expect(wrapper.text()).toContain(
      'Could not load contacts with the same IP'
    );
  });
});
