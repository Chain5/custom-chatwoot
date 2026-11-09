class AddBlockedUntilToContacts < ActiveRecord::Migration[7.2]
  def change
    add_column :contacts, :blocked_until, :datetime
  end
end
