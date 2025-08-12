# Annexes — Exemples JSON (Edge Functions ↔ Orchestrateur)

Note: Exemples minimaux, strictement calqués sur les Edge Functions du package original. Les valeurs sont indicatives; conservez les clés/champs et formats. Données: la persistance s’effectue sur une instance PostgreSQL locale (pgvector), pas de base cloud. Gouvernance: utilisez ces exemples comme oracles dans les tests de parité et reliez les vérifications à des IDs Task‑Master.

## send-chat-message

Request (Edge → Orchestrateur via `NOTEBOOK_CHAT_URL`)
```json
{
  "session_id": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "message": "Quel est le résumé du document ?",
  "user_id": "5f4d3c2b-1a09-4e87-b123-abcdef012345",
  "timestamp": "2025-08-11T08:00:00.000Z"
}
```

Response (Edge → Frontend)
```json
{
  "success": true,
  "data": {
    "output": [
      {
        "text": "Résumé ... [1] [2]",
        "citations": [
          { "source_id": "c0ffee00-0000-0000-0000-000000000001", "lines": { "from": 10, "to": 18 } }
        ]
      }
    ]
  }
}
```

## process-document

Request (Frontend → Edge `process-document`)
```json
{
  "sourceId": "1d2c3b4a-5678-49ab-9cde-001122334455",
  "filePath": "notebooks/1d2c/sources/doc.pdf",
  "sourceType": "pdf"
}
```

Webhook payload (Edge → Orchestrateur via `DOCUMENT_PROCESSING_WEBHOOK_URL`)
```json
{
  "source_id": "1d2c3b4a-5678-49ab-9cde-001122334455",
  "file_url": "http://localhost:8000/storage/v1/object/public/sources/notebooks/1d2c/sources/doc.pdf",
  "file_path": "notebooks/1d2c/sources/doc.pdf",
  "source_type": "pdf",
  "callback_url": "http://localhost:8000/functions/v1/process-document-callback"
}
```

Callback (Orchestrateur → Edge `process-document-callback`)
```json
{
  "source_id": "1d2c3b4a-5678-49ab-9cde-001122334455",
  "content": "Texte extrait ...",
  "summary": "Résumé court ...",
  "title": "Titre extrait",
  "status": "completed"
}
```

Edge Response (→ Frontend)
```json
{
  "success": true,
  "message": "Document processing initiated",
  "result": { "job": "accepted" }
}
```

## generate-audio-overview

Request (Frontend → Edge `generate-audio-overview`)
```json
{
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab"
}
```

Webhook payload (Edge → Orchestrateur via `AUDIO_GENERATION_WEBHOOK_URL`)
```json
{
  "notebook_id": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "callback_url": "http://localhost:8000/functions/v1/audio-generation-callback"
}
```

Callback (Orchestrateur → Edge `audio-generation-callback`) — success
```json
{
  "notebook_id": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "audio_url": "http://localhost:8000/storage/v1/object/private/audio/e7b1/overview.mp3",
  "status": "success"
}
```

Edge Response (→ Frontend)
```json
{
  "success": true,
  "message": "Audio generation started",
  "status": "generating"
}
```

## generate-notebook-content

Request (Frontend → Edge `generate-notebook-content`)
```json
{
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "filePath": "notebooks/e7b1/sources/doc.pdf",
  "sourceType": "pdf"
}
```

Webhook payload (Edge → Orchestrateur via `NOTEBOOK_GENERATION_URL`)
```json
{
  "sourceType": "pdf",
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "filePath": "notebooks/e7b1/sources/doc.pdf"
}
```

Edge Response (→ Frontend)
```json
{
  "success": true,
  "message": "Notebook generation started in background",
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab"
}
```

## process-additional-sources

Request (Frontend → Edge `process-additional-sources`) — multiple-websites
```json
{
  "type": "multiple-websites",
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "urls": ["https://exemple1", "https://exemple2"],
  "sourceIds": [
    "c0ffee00-0000-0000-0000-000000000001",
    "c0ffee00-0000-0000-0000-000000000002"
  ],
  "timestamp": "2025-08-11T08:00:00.000Z"
}
```

Webhook payload (Edge → Orchestrateur)
```json
{
  "type": "multiple-websites",
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "urls": ["https://exemple1", "https://exemple2"],
  "sourceIds": [
    "c0ffee00-0000-0000-0000-000000000001",
    "c0ffee00-0000-0000-0000-000000000002"
  ],
  "timestamp": "2025-08-11T08:00:00.000Z"
}
```

Request (Frontend → Edge `process-additional-sources`) — copied-text
```json
{
  "type": "copied-text",
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "title": "Titre fourni",
  "content": "Texte collé ...",
  "sourceIds": ["c0ffee00-0000-0000-0000-000000000003"],
  "timestamp": "2025-08-11T08:00:00.000Z"
}
```

Webhook payload (Edge → Orchestrateur)
```json
{
  "type": "copied-text",
  "notebookId": "e7b1b2c8-8a7f-4c7a-9a1e-1234567890ab",
  "title": "Titre fourni",
  "content": "Texte collé ...",
  "sourceId": "c0ffee00-0000-0000-0000-000000000003",
  "timestamp": "2025-08-11T08:00:00.000Z"
}
```

Edge Response (→ Frontend)
```json
{
  "success": true,
  "message": "multiple-websites data sent to webhook successfully",
  "webhookResponse": "OK"
}
```
