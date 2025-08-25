import axios from "axios";
import { Platform } from "react-native";

const API_BASE_URL = Platform.OS === 'web' ? "http://127.0.0.1:5000" : "http://192.168.1.19:5000";

export async function loginUser(username, password) {
    console.log("Logging in with:", username, password);
    console.log("API Base URL:", API_BASE_URL);
    console.log("Full URL:", `${API_BASE_URL}/login`);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
    });
    return response.data;
}

export async function registerUser(username, password, email) {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: username,
        password: password,
        email: email
    });
    return response.data;
}

export async function uploadPhoto(photo) {
  const formData = new FormData();
  formData.append("file", {
    uri: photo.uri,
    name: photo.fileName,
    type: photo.type,
  });

  const response = await axios.post(`${API_BASE_URL}/sync/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}


export async function uploadPhotosBatch(photos) {
  const results = [];
  for (let photo of photos) {
    try {
      const res = await uploadPhoto(photo);
      results.push(res);
    } catch (err) {
      console.error("Upload error:", err);
      results.push({ error: err.message, filename: photo.fileName });
    }
  }
  return results;
}

export async function getList() {
  try{
    const response = await axios.get(`${API_BASE_URL}/sync/list`);
    return response.data;
  } catch (error) {
    console.error("Error fetching list:", error);
    throw error;
  }
}
