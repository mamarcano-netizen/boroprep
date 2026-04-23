# Deploy to Google Cloud Run

1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
2. Login: gcloud auth login
3. Set project: gcloud config set project YOUR_PROJECT_ID
4. Enable APIs: gcloud services enable run.googleapis.com artifactregistry.googleapis.com
5. Build and deploy:
   gcloud run deploy boroprep \
     --source . \
     --region us-east1 \
     --allow-unauthenticated \
     --set-env-vars ANTHROPIC_API_KEY=YOUR_KEY,DB_PATH=/tmp/boroprep.db,SECRET_KEY=YOUR_SECRET \
     --memory 512Mi

Note: DB_PATH=/tmp is ephemeral on Cloud Run. For persistence, use Cloud SQL or set DB_PATH to a Cloud Storage mount.
