#!/bin/bash

# VividLaunch — Automated Deployment Script
# This script automates the deployment of the Media Worker to Google Cloud Run.

# 1. Variables
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="vivid-media-worker"
REGION="us-central1"

echo "🚀 Starting Automated Deployment for $SERVICE_NAME..."

# 2. Build the Container using Cloud Build
echo "📦 Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# 3. Deploy to Cloud Run
echo "🌍 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
    --memory 2Gi \
    --cpu 1

# 4. Final Verification
echo "✅ Deployment Complete!"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)'
