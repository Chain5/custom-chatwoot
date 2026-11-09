require 'rails_helper'

RSpec.describe '/api/v1/accounts/{account.id}/contacts/:id/same_ip', type: :request do
  let(:account) { create(:account) }
  let(:ip) { '203.0.113.7' }
  let(:contact) { create(:contact, account: account, additional_attributes: { created_at_ip: ip }) }
  let!(:same_ip_contact) { create(:contact, account: account, additional_attributes: { created_at_ip: ip }) }
  let(:visible_inbox) { create(:inbox, account: account) }
  let(:hidden_inbox) { create(:inbox, account: account) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let!(:visible_conversation) { create(:conversation, account: account, inbox: visible_inbox, contact: same_ip_contact) }
  let!(:hidden_conversation) { create(:conversation, account: account, inbox: hidden_inbox, contact: same_ip_contact) }

  before do
    create(:inbox_member, user: agent, inbox: visible_inbox)
    create(:contact, account: account, additional_attributes: { created_at_ip: '198.51.100.1' })
    create(:contact, account: create(:account), additional_attributes: { created_at_ip: ip })
  end

  def same_ip_path(target = contact)
    "/api/v1/accounts/#{account.id}/contacts/#{target.id}/same_ip"
  end

  it 'returns unauthorized for unauthenticated users' do
    get same_ip_path

    expect(response).to have_http_status(:unauthorized)
  end

  it 'lists only other contacts of the account with the same IP' do
    get same_ip_path, headers: admin.create_new_auth_token, as: :json

    expect(response).to have_http_status(:success)
    expect(response.parsed_body['payload'].pluck('id')).to eq([same_ip_contact.id])
  end

  it 'includes every conversation for administrators' do
    get same_ip_path, headers: admin.create_new_auth_token, as: :json

    conversation_ids = response.parsed_body['payload'].first['conversations'].pluck('id')
    expect(conversation_ids).to contain_exactly(visible_conversation.display_id, hidden_conversation.display_id)
  end

  it 'includes only conversations from inboxes the agent can access' do
    get same_ip_path, headers: agent.create_new_auth_token, as: :json

    conversation_ids = response.parsed_body['payload'].first['conversations'].pluck('id')
    expect(conversation_ids).to eq([visible_conversation.display_id])
  end

  it 'returns no contacts when the contact has no recorded IP' do
    get same_ip_path(create(:contact, account: account)), headers: admin.create_new_auth_token, as: :json

    expect(response.parsed_body['payload']).to eq([])
  end

  it 'returns not found for a contact of another account' do
    other_contact = create(:contact, account: create(:account), additional_attributes: { created_at_ip: ip })

    get same_ip_path(other_contact), headers: admin.create_new_auth_token, as: :json

    expect(response).to have_http_status(:not_found)
  end
end
