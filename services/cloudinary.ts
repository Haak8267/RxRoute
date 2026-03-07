import FormData from "form-data";

// Upload image from React Native to Cloudinary
export const uploadImageFromRN = async (
  imageUri: string,
  folder = "rxroute",
) => {
  try {
    // Create FormData
    const formData = new FormData();

    // Append the image file
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg", // Adjust based on your image type
      name: `upload_${Date.now()}.jpg`,
    });

    formData.append("upload_preset", "rxroute_uploads"); // You need to create this preset in Cloudinary
    formData.append("folder", folder);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData as any,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Upload failed");
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
};

// Upload PDF from React Native to Cloudinary
export const uploadPdfFromRN = async (
  pdfUri: string,
  folder = "rxroute/prescriptions",
) => {
  try {
    const formData = new FormData();

    formData.append("file", {
      uri: pdfUri,
      type: "application/pdf",
      name: `prescription_${Date.now()}.pdf`,
    });

    formData.append("upload_preset", "rxroute_uploads");
    formData.append("folder", folder);
    formData.append("resource_type", "auto");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData as any,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Upload failed");
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error("PDF upload error:", error);
    throw error;
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinaryRN = async (publicId: string) => {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/destroy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id: publicId,
        }),
      },
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};
