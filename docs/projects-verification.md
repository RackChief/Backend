# Projects manual verification

Run `npm run db:migrate` against the intended database, start the API with `npm run dev`, and use a valid Supabase access token. These commands only create and delete a new throwaway project; they do not mutate the existing asset.

```bash
export API=http://localhost:3000
export TOKEN='<Supabase access token>'

# Confirm the existing asset API still works and copy Artemis' ID from the output.
curl -H "Authorization: Bearer $TOKEN" "$API/api/assets"
export ASSET_ID='<Artemis asset UUID>'

# Create a project associated with Artemis; copy the returned project ID.
curl -X POST "$API/api/projects" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"name\":\"Projects verification\",\"assetIds\":[\"$ASSET_ID\"]}"
export PROJECT_ID='<new project UUID>'

# Verify detail includes Artemis, then confirm deletion is blocked with HTTP 409.
curl -H "Authorization: Bearer $TOKEN" "$API/api/projects/$PROJECT_ID"
curl -i -X DELETE -H "Authorization: Bearer $TOKEN" "$API/api/projects/$PROJECT_ID"

# Add purchase and work items, then add an update.
curl -X POST "$API/api/projects/$PROJECT_ID/items" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"purchase","title":"Replacement drive","estimatedCost":120.00,"vendor":"Example vendor"}'
curl -X POST "$API/api/projects/$PROJECT_ID/items" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"work","title":"Install drive","sortOrder":1}'
curl -X POST "$API/api/projects/$PROJECT_ID/updates" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"body":"Planning is underway."}'

# Patch the project; verify its detail, items, and updates.
curl -X PATCH "$API/api/projects/$PROJECT_ID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"planned","priority":"high"}'
curl -H "Authorization: Bearer $TOKEN" "$API/api/projects/$PROJECT_ID"

# Archive and permanently delete this throwaway project only.
curl -X POST -H "Authorization: Bearer $TOKEN" "$API/api/projects/$PROJECT_ID/archive"
curl -i -X DELETE -H "Authorization: Bearer $TOKEN" "$API/api/projects/$PROJECT_ID"

# Confirm the public OpenAPI document lists every Projects operation.
curl "$API/openapi.json"
```
