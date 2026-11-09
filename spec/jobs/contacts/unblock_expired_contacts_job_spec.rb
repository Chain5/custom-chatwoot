require 'rails_helper'

RSpec.describe Contacts::UnblockExpiredContactsJob do
  let(:account) { create(:account) }
  let!(:expired) { create(:contact, account: account, blocked: true, blocked_until: 1.hour.from_now) }
  let!(:active) { create(:contact, account: account, blocked: true, blocked_until: 2.days.from_now) }
  let!(:permanent) { create(:contact, account: account, blocked: true) }

  it 'unblocks only contacts whose block has expired' do
    travel 1.day do
      described_class.perform_now
    end

    expect(expired.reload).to have_attributes(blocked: false, blocked_until: nil)
    expect(active.reload).to have_attributes(blocked: true, blocked_until: be_present)
    expect(permanent.reload).to have_attributes(blocked: true, blocked_until: nil)
  end

  it 'lets new conversations from the contact open again' do
    inbox = create(:inbox, account: account)

    travel 1.day do
      described_class.perform_now
    end

    conversation = create(:conversation, account: account, inbox: inbox, contact: expired.reload)
    expect(conversation).to be_open
  end
end
