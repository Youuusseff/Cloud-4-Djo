from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from minio import Minio
import os

sync_bp = Blueprint("sync", __name__)

# MinIO client
MINIO_CLIENT = Minio(
    "localhost:9000",
    access_key="admin",
    secret_key="admin123",
    secure=False
)
BUCKET = "photos"

# Ensure bucket exists
if not MINIO_CLIENT.bucket_exists(BUCKET):
    MINIO_CLIENT.make_bucket(BUCKET)

@sync_bp.route("/upload", methods=["POST", "OPTIONS"])
@cross_origin()
def upload_photo():
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Save temporarily
    temp_path = f"/tmp/{file.filename}"
    file.save(temp_path)

    # Upload to MinIO
    MINIO_CLIENT.fput_object(BUCKET, file.filename, temp_path)

    # Delete temp file
    os.remove(temp_path)

    return jsonify({"status": "success", "filename": file.filename})

@sync_bp.route("/list", methods=["GET", "OPTIONS"])
@cross_origin()
def list_photos():
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
    
    try:
        objects = MINIO_CLIENT.list_objects(BUCKET)
        files = []
        for obj in objects:
            url = MINIO_CLIENT.presigned_get_object(BUCKET, obj.object_name)
            files.append({"name": obj.object_name, "url": url})
        return jsonify({"status": "success", "files": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

 
