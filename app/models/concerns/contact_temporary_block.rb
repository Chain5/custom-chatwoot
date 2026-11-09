# A blocked contact with blocked_until is blocked until that time; without it the block is permanent.
# Contacts::UnblockExpiredContactsJob lifts expired blocks, so every surface keeps reading `blocked?`.
module ContactTemporaryBlock
  extend ActiveSupport::Concern

  included do
    validate :blocked_until_in_future, if: -> { blocked? && blocked_until_changed? && blocked_until.present? }
    before_validation :clear_blocked_until, unless: :blocked?

    scope :with_expired_block, -> { where(blocked: true, blocked_until: ..Time.current) }
  end

  private

  def clear_blocked_until
    self.blocked_until = nil
  end

  def blocked_until_in_future
    errors.add(:blocked_until, I18n.t('errors.contacts.blocked_until.past')) if blocked_until <= Time.current
  end
end
