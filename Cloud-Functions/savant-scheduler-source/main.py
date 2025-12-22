import functions_framework  
from cryptography.fernet import Fernet  
import redis  
import json  
import os  
from dotenv import load_dotenv  
  
load_dotenv()  
  
# Connect to Redis  
r = redis.Redis(host=os.getenv('REDIS_INSTANCE_IP'), port='6379')  
  
@functions_framework.http  
def fetch_key(request):  
    if request.method == "OPTIONS":  
        # Allows GET requests from any origin with the Content-Type header and caches preflight response for an 3600s  
        headers = {  
            "Access-Control-Allow-Origin": "*",  
            "Access-Control-Allow-Methods": "GET",  
            "Access-Control-Allow-Headers": "Content-Type",  
            "Access-Control-Max-Age": "3600",  
        }  
        return "", 204, headers  
  
    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'op' not in request_json or 'queue' not in request_json:
            return jsonify({"error": "Invalid Request body. Must be JSON with 'op' and 'queue'."}), 400, headers

        op = request_json['op']
        queue_name = request_json['queue']

        valid_queues = ['api_keys', 'claude', 'the4o']
        if queue_name not in valid_queues:
            return jsonify({"error": f"Invalid Queue Name: {queue_name}"}), 400, headers

        if op == "getkey":
            key_bytes = r.lpop(queue_name)
            if key_bytes is None:
                return jsonify({"error": "No more keys left in the queue"}), 503, headers # 503 Service Unavailable is a good code here
            
            # The key is already bytes, no need to load and dump if it's stored correctly
            r.rpush(queue_name, key_bytes)
            
            encp_key = os.getenv('ENCP_KEY')
            if encp_key is None:
                logging.error("CRITICAL: ENCP_KEY environment variable is not set!")
                return jsonify({"error": "Server configuration error: Encryption key is missing"}), 500, headers
            
            cipher_suite = Fernet(encp_key)
            
            # Key from Redis should be a JSON string representing the credential dictionary
            # We encrypt this dictionary string
            encrypted_data = cipher_suite.encrypt(key_bytes)
            
            # The client expects the raw encrypted data, not a JSON object containing it
            # So we set a different content type and return the bytes
            response_headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/octet-stream"}
            return encrypted_data, 200, response_headers

        elif op == "ins_keys":  
            keys_list = request_json.get('keys')  
            
            if not keys_list:  
                return jsonify({"error": "No keys provided"}), 400, headers  
            
            dkeys = ''  
            
            for key in keys_list:  
                dkeys += str(key)  
                
                # You might want to add validation or transformation logic here  
                
                r.rpush(queue_name, json.dumps(key))  
            
            data = f'Keys inserted successfully into {queue_name}: {dkeys}'  
            return jsonify({"message": f"{len(keys_list)} keys inserted successfully into {queue_name}."}), 200, headers
        
        else:
            return jsonify({"error": "Invalid Operation specified"}), 400, headers
        
    except Exception as e:
        logging.exception("An unexpected error occurred in savant-scheduler")
        return jsonify({"error": f"An internal server error occurred: {e}"}), 500, headers
    