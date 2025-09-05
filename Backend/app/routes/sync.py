from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from minio import Minio
from PIL import Image
from PIL.ExifTags import TAGS
import os
from datetime import datetime

sync_bp = Blueprint("sync", __name__)

MINIO_CLIENT = Minio(
    "172.20.10.2:9000",
    access_key="admin",
    secret_key="admin123",
    secure=False
)
BUCKET = "photos"

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
    
    metadata = extract_metadata(temp_path)
    
    # Upload to MinIO
    MINIO_CLIENT.fput_object(BUCKET, file.filename, temp_path, metadata=metadata)
    
    # Delete temp file
    os.remove(temp_path)
    
    return jsonify({"status": "success", "filename": file.filename})

def extract_metadata(file_path):
    try:
        print(f"Processing file: {file_path}")
        img = Image.open(file_path)
        width, height = img.size
        print(f"Image dimensions: {width}x{height}")
        
        # Try different methods to get EXIF data
        exif_data = None
        try:
            exif_data = img._getexif()
            print(f"EXIF data found: {exif_data is not None}")
        except:
            print("_getexif() method failed, trying getexif()")
            try:
                exif_data = img.getexif()
                print(f"getexif() data found: {exif_data is not None}")
            except:
                print("Both EXIF methods failed")
        
        photo_date = None
        if exif_data:
            print(f"Found {len(exif_data)} EXIF tags")
            date_tags = ['DateTime', 'DateTimeOriginal', 'DateTimeDigitized']
            
            # Debug: Print all EXIF tags
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag in date_tags:
                    print(f"Found date tag {tag}: {value}")
                    try:
                        # Try different date formats
                        for date_format in ["%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y:%m:%d"]:
                            try:
                                full_date = datetime.strptime(value, date_format)
                                photo_date = full_date.strftime("%Y-%m")  # Only year-month
                                print(f"Successfully parsed date: {photo_date}")
                                break
                            except ValueError:
                                continue
                        if photo_date:
                            break
                    except Exception as date_error:
                        print(f"Date parsing error: {date_error}")
                        continue
        else:
            print("No EXIF data found in image")
        
        # Always include width and height
        metadata = {
            "width": str(width),
            "height": str(height)
        }
        
        # Add date only if found
        if photo_date:
            metadata["date-taken"] = photo_date
            print(f"Added date to metadata: {photo_date}")
        else:
            print("No date found, not adding to metadata")
        
        print(f"Final metadata: {metadata}")
        return metadata
        
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        import traceback
        traceback.print_exc()
        return {}

@sync_bp.route("/list", methods=["GET", "OPTIONS"])
@cross_origin()
def list_photos():
    print("=== LIST ENDPOINT CALLED ===")
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
    
    try:
        print("Getting objects from MinIO...")
        objects = MINIO_CLIENT.list_objects(BUCKET)
        files = []
        
        for obj in objects:
            print(f"Processing object: {obj.object_name}")
            url = MINIO_CLIENT.presigned_get_object(BUCKET, obj.object_name)
            stat = MINIO_CLIENT.stat_object(BUCKET, obj.object_name)
            
            # Get metadata
            metadata = stat.metadata or {}
            print(f"Raw metadata for {obj.object_name}: {metadata}")
            
            # Use the correct metadata keys as shown in debug output
            date_taken = metadata.get('x-amz-meta-date-taken')
            width = metadata.get('x-amz-meta-width', '100')
            height = metadata.get('x-amz-meta-height', '100')
            
            # Convert date to year-month format if it exists
            if date_taken:
                try:
                    # First try to parse full datetime format from EXIF: "2025-09-03 20:09:02"
                    try:
                        full_date = datetime.strptime(date_taken, "%Y-%m-%d %H:%M:%S")
                        date_taken = full_date.strftime("%Y-%m")  # Convert to "2025-09"
                        print(f"Parsed full datetime to year-month: {date_taken}")
                    except ValueError:
                        # If that fails, check if it's already in year-month format
                        if len(date_taken) == 7 and date_taken[4] == '-':  # Format: "2025-08"
                            print(f"Date already in year-month format: {date_taken}")
                            # Keep it as is
                        else:
                            print(f"Unexpected date format: {date_taken}")
                            date_taken = None
                except Exception as parse_error:
                    print(f"Date parsing error: {parse_error}")
                    date_taken = None
            
            print(f"Extracted - width: {width}, height: {height}, date: {date_taken}")
            
            files.append({
                "fileName": obj.object_name,
                "uri": url,
                "width": int(width),
                "height": int(height),
                "type": "image",
                "fileSize": stat.size,
                "createdAt": obj.last_modified.isoformat(),
                "dateTaken": date_taken
            })
        
        print(f"Returning {len(files)} files")
        return jsonify({"status": "success", "files": files})
        
    except Exception as e:
        print(f"ERROR in list_photos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
