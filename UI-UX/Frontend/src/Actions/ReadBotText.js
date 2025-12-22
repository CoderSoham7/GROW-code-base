import axios from "axios";
import swal from 'sweetalert';

const ReadBotText = async (t, BotText) => {
  try {
    const config = {
      withCredentials: true,
    }      
    const response = await axios.post("/api/ext/rbt", { "data": BotText }, config);
    const audio_url = response.data;
    return audio_url;
  }   
  catch (error) {
    console.log('Error code F003')
    await swal({
      title: "Audio Generation Failed", 
      text: "Unable to convert text to speech. Please check your internet connection or try using a personal hotspot/different WiFi network.",
      icon: "error",
    });
    return null;
  }
}

export default ReadBotText;


