import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const uploadUserImage = async (userId, file) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Token không tồn tại');

    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      type: 'image/jpeg',
      name: 'userImage.jpg',
    });

    const response = await axios.post(
      `http://localhost:3006/api/user/${userId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Phản hồi từ server:', response.data);
  } catch (error) {
    console.error('Lỗi khi upload ảnh:', error);
  }
};
