import axios from "axios";
import swal from 'sweetalert';

const WriteUserSpeech = async (t, formData = null) => {
  try {
    const config = {
      withCredentials: true,
    }
    const URL = "/api/ext/wus";
    const result = await axios.post(
      URL,
      formData,
      config
    )
    return result.data;
  } catch (error) {
    console.log('Error code F001')
    await swal({
      title: "Speech Recognition Failed",
      text: "Unable to convert your speech to text. Please check your internet connection or try using a personal hotspot/different WiFi network.",
      icon: "error",
    });
    return null;
  }
}

export default WriteUserSpeech;