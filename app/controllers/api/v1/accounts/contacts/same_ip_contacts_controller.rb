class Api::V1::Accounts::Contacts::SameIpContactsController < Api::V1::Accounts::Contacts::BaseController
  RESULTS_LIMIT = 20
  CONVERSATIONS_LIMIT = 100

  def index
    @contacts = @contact.contacts_with_same_ip
                        .includes(avatar_attachment: [:blob])
                        .order(Contact.arel_table[:last_activity_at].desc.nulls_last, id: :desc)
                        .limit(RESULTS_LIMIT)
                        .to_a
    @conversations_by_contact_id = permitted_conversations.group_by(&:contact_id)
  end

  private

  def permitted_conversations
    conversations = Current.account.conversations.where(contact_id: @contacts.map(&:id))

    Conversations::PermissionFilterService.new(conversations, Current.user, Current.account)
                                          .perform
                                          .order(last_activity_at: :desc)
                                          .limit(CONVERSATIONS_LIMIT)
  end
end
