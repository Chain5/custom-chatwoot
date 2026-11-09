json.payload @contacts do |contact|
  json.id contact.id
  json.name contact.name
  json.email contact.email
  json.identifier contact.identifier
  json.thumbnail contact.avatar_url
  json.conversations @conversations_by_contact_id.fetch(contact.id, []) do |conversation|
    json.id conversation.display_id
    json.status conversation.status
    json.last_activity_at conversation.last_activity_at.to_i
  end
end
