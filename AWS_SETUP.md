# AWS setup

AWS integrations are disabled by default. Set `HEATBUDGET_AWS_ENABLED=true` only in an AWS runtime with an IAM role; do not put access keys in `.env` or source control.

## Runtime configuration

- `AWS_REGION`: deployment region, default `ap-south-1`.
- `AWS_SNS_TOPIC_ARN`: optional SNS topic for broadcast rider rest nudges; otherwise SNS uses the supplied phone number.
- `AWS_BEDROCK_MODEL_ID`: required only when generating Bedrock reports.
- `AWS_SECRET_ID`: optional Secrets Manager secret identifier, read on demand through `AwsSecretReader`.

## Minimum IAM permissions

- `sns:Publish` on the configured topic when using SNS.
- `bedrock:Converse` on the approved Bedrock model or inference profile.
- `secretsmanager:GetSecretValue` on the one configured secret when it is used.

Restrict each statement to the exact ARN where AWS supports it. Use ECS task roles in production, encrypt database and Redis traffic, and keep individual rider data out of reports and Bedrock prompts.
