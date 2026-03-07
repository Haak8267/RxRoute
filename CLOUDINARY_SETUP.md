# Cloudinary Setup Guide for RxRoute

## 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com) and sign up for a free account
2. Navigate to your Dashboard
3. Note down your:
   - **Cloud Name**
   - **API Key** 
   - **API Secret**

## 2. Configure Environment Variables

### Backend (.env)
```bash
# Add to your backend/.env file
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key  
CLOUDINARY_API_SECRET=your-api-secret

# Existing variables
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rxroute
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Frontend (app.json or environment)
```json
{
  "expo": {
    "extra": {
      "cloudinaryCloudName": "your-cloud-name"
    }
  }
}
```

## 3. Create Upload Preset

1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Click **Add upload preset**
3. Configure it as follows:
   - **Name**: `rxroute_uploads`
   - **Signed mode**: Off (for development)
   - **Allowed formats**: jpg, jpeg, png, gif, pdf
   - **Folder**: `rxroute`
   - **Unique filename**: On
4. Save the preset

## 4. Folder Structure

Cloudinary will organize your files in these folders:
- `rxroute/prescriptions/` - Prescription images and PDFs
- `rxroute/profiles/` - User profile pictures
- `rxroute/medications/` - Medication product images

## 5. Features Implemented

### Frontend
- ✅ Image upload from camera
- ✅ Image upload from gallery  
- ✅ PDF upload for prescriptions
- ✅ Profile picture upload component
- ✅ Automatic optimization and compression

### Backend
- ✅ Cloudinary integration
- ✅ Multer storage configuration
- ✅ File upload endpoint
- ✅ Image optimization utilities
- ✅ Secure URL generation

## 6. Usage Examples

### Upload Profile Image
```typescript
import ProfileImageUpload from '../components/ProfileImageUpload';

// In your component
const [showImageUpload, setShowImageUpload] = useState(false);
const [profileImage, setProfileImage] = useState(user.profileImage);

<ProfileImageUpload
  currentImage={profileImage}
  onImageUpdate={setProfileImage}
  isVisible={showImageUpload}
  onClose={() => setShowImageUpload(false)}
/>
```

### Upload Prescription
The camera component now automatically uploads to Cloudinary when you submit.

## 7. Security Notes

- **Development**: Upload presets are unsigned for easy testing
- **Production**: Use signed uploads and authentication
- **File Size**: Limited to 10MB per file
- **File Types**: Restricted to images and PDFs only
- **Rate Limiting**: Applied to prevent abuse

## 8. Benefits

- **Automatic Optimization**: Cloudinary automatically compresses and formats images
- **CDN Delivery**: Fast global content delivery
- **Transformations**: Easy to resize, crop, and apply effects
- **Storage**: No need to manage file storage on your servers
- **Analytics**: Built-in usage analytics and insights

## 9. Troubleshooting

### Common Issues
1. **Upload fails**: Check your Cloudinary credentials
2. **Preset not found**: Ensure upload preset is created and named correctly
3. **CORS errors**: Verify your Cloudinary CORS settings
4. **Large files**: Check file size limits (max 10MB)

### Debug Tips
- Check browser console for upload errors
- Verify network requests to Cloudinary API
- Check your Cloudinary dashboard for upload history
