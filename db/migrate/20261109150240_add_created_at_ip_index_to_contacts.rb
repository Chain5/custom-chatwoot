class AddCreatedAtIpIndexToContacts < ActiveRecord::Migration[7.2]
  disable_ddl_transaction!

  def change
    # Partial: only widget contacts created with ip_lookup enabled carry an IP, so the index stays small.
    # Equality lookups on the expression imply IS NOT NULL, so the planner can use it.
    # last_activity_at serves the "most recent first" order, so the lookup stops after the limit.
    add_index :contacts, "account_id, (additional_attributes ->> 'created_at_ip'), last_activity_at DESC NULLS LAST",
              where: "(additional_attributes ->> 'created_at_ip') IS NOT NULL",
              name: 'index_contacts_on_account_id_and_created_at_ip',
              algorithm: :concurrently
  end
end
