# Finds other contacts created from the same IP (additional_attributes.created_at_ip).
# Shared IPs (NAT, mobile carriers, VPNs) give false positives, so this only lists contacts and never merges them.
module ContactSameIp
  extend ActiveSupport::Concern

  included do
    # Matches index_contacts_on_account_id_and_created_at_ip
    scope :with_created_at_ip, lambda { |ip|
      created_at_ip = Arel::Nodes::InfixOperation.new('->>', arel_table[:additional_attributes], Arel::Nodes.build_quoted('created_at_ip'))
      where(created_at_ip.eq(ip))
    }
  end

  def contacts_with_same_ip
    created_at_ip = additional_attributes&.dig('created_at_ip')
    return Contact.none if created_at_ip.blank?

    account.contacts.with_created_at_ip(created_at_ip).where.not(id: id)
  end
end
