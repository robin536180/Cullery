package com.cullery.app;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Size;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;

@CapacitorPlugin(name = "PhotoLibrary")
public class PhotoLibraryPlugin extends Plugin {
    @PluginMethod
    public void scanPhotos(PluginCall call) {
        int limit = call.getInt("limit", 500);
        ContentResolver resolver = getContext().getContentResolver();

        boolean permissionGranted = hasReadImagesPermission();
        if (!permissionGranted) {
            JSObject result = new JSObject();
            result.put("permission", "denied");
            result.put("photos", new JSArray());
            call.resolve(result);
            return;
        }

        Uri collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        String[] projection = new String[] {
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME,
                MediaStore.Images.Media.SIZE,
                MediaStore.Images.Media.WIDTH,
                MediaStore.Images.Media.HEIGHT,
                MediaStore.Images.Media.DATE_TAKEN,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.RELATIVE_PATH,
                MediaStore.Images.Media.BUCKET_DISPLAY_NAME,
                MediaStore.Images.Media.MIME_TYPE
        };
        String sortOrder = MediaStore.Images.Media.DATE_TAKEN + " DESC";

        JSArray photos = new JSArray();
        Cursor cursor = null;

        try {
            cursor = resolver.query(collection, projection, null, null, sortOrder);
            if (cursor == null) {
                JSObject result = new JSObject();
                result.put("permission", "granted");
                result.put("photos", photos);
                call.resolve(result);
                return;
            }

            int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
            int nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
            int sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE);
            int widthColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.WIDTH);
            int heightColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.HEIGHT);
            int dateTakenColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_TAKEN);
            int dateAddedColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);
            int relativePathColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.RELATIVE_PATH);
            int bucketColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
            int mimeColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.MIME_TYPE);

            int count = 0;
            while (cursor.moveToNext() && count < limit) {
                long id = cursor.getLong(idColumn);
                String displayName = cursor.getString(nameColumn);
                long size = cursor.getLong(sizeColumn);
                int width = cursor.getInt(widthColumn);
                int height = cursor.getInt(heightColumn);
                long dateTaken = cursor.getLong(dateTakenColumn);
                long dateAddedSeconds = cursor.getLong(dateAddedColumn);
                String relativePath = cursor.getString(relativePathColumn);
                String bucket = cursor.getString(bucketColumn);
                String mimeType = cursor.getString(mimeColumn);

                Uri contentUri = ContentUris.withAppendedId(collection, id);
                long dateMillis = dateTaken > 0 ? dateTaken : (dateAddedSeconds > 0 ? dateAddedSeconds * 1000L : 0L);

                boolean isScreenshot = isScreenshot(displayName, relativePath, bucket);
                String thumbnailPath = buildThumbnailPath(contentUri, id);

                JSObject item = new JSObject();
                item.put("id", String.valueOf(id));
                item.put("contentUri", contentUri.toString());
                item.put("displayName", displayName == null ? "" : displayName);
                item.put("size", size);
                item.put("width", width);
                item.put("height", height);
                item.put("dateTaken", dateMillis);
                item.put("relativePath", relativePath == null ? "" : relativePath);
                item.put("bucket", bucket == null ? "" : bucket);
                item.put("mimeType", mimeType == null ? "" : mimeType);
                item.put("isScreenshot", isScreenshot);
                item.put("thumbnailPath", thumbnailPath == null ? "" : thumbnailPath);
                photos.put(item);

                count += 1;
            }

            JSObject result = new JSObject();
            result.put("permission", "granted");
            result.put("photos", photos);
            call.resolve(result);
        } catch (SecurityException e) {
            JSObject result = new JSObject();
            result.put("permission", "denied");
            result.put("photos", new JSArray());
            call.resolve(result);
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("permission", "granted");
            result.put("photos", photos);
            call.resolve(result);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    private boolean hasReadImagesPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.READ_MEDIA_IMAGES)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.READ_EXTERNAL_STORAGE)
                == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isScreenshot(String displayName, String relativePath, String bucket) {
        String name = displayName == null ? "" : displayName;
        String path = relativePath == null ? "" : relativePath;
        String bucketName = bucket == null ? "" : bucket;

        String combined = (name + " " + path + " " + bucketName).toLowerCase(Locale.ROOT);
        return combined.contains("screenshot") || combined.contains("screenshots");
    }

    private String buildThumbnailPath(Uri contentUri, long id) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return null;
        }

        try {
            Bitmap thumbnail = getContext().getContentResolver().loadThumbnail(contentUri, new Size(256, 256), null);
            File dir = new File(getContext().getCacheDir(), "thumbnails");
            if (!dir.exists() && !dir.mkdirs()) {
                return null;
            }
            File outFile = new File(dir, "ms-" + id + ".jpg");
            FileOutputStream outputStream = new FileOutputStream(outFile);
            try {
                thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, outputStream);
            } finally {
                outputStream.close();
            }
            return outFile.getAbsolutePath();
        } catch (Exception e) {
            return null;
        }
    }
}
