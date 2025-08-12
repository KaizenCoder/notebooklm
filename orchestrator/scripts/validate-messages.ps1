param(
  [string]$SchemaPath = "..\..\docs\communication\communication\message.schema.json",
  [string]$SamplePath = ".\scripts\sample-message.json"
)

if (-not (Get-Command ajv -ErrorAction SilentlyContinue)) {
  npm i -g ajv-cli | Out-Null
}
ajv validate -s $SchemaPath -d $SamplePath
