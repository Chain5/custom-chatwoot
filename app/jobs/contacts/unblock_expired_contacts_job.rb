class Contacts::UnblockExpiredContactsJob < ApplicationJob
  queue_as :low

  def perform
    # update! (not update_all) so CONTACT_UPDATED reaches the dashboard and webhooks
    Contact.with_expired_block.find_each(batch_size: 100) do |contact|
      contact.update!(blocked: false)
    end
  end
end
