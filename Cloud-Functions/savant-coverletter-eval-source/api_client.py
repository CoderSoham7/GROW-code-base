import boto3
import json
import time
from functools import wraps
from botocore.config import Config
from threading import Lock
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class APIClient:
    def __init__(self, aws_creds_list):
        self.aws_creds = aws_creds_list
        self.current_cred_index = 0
        self.lock = Lock()
        self.bedrock_clients = [
            self.create_boto3_client(creds['AWSAK'], creds['AWSSAK'])
            for creds in self.aws_creds
        ]

    def create_boto3_client(self, awsak, awssak):
        config = Config(
            retries={
                'max_attempts': 10,
                'mode': 'standard'
            },
            max_pool_connections=200
        )
        return boto3.client(
            'bedrock-runtime',
            aws_access_key_id=awsak,
            aws_secret_access_key=awssak,
            region_name="us-west-2",
            config=config
        )

    def rotate_credentials(self):
        with self.lock:
            self.current_cred_index = (self.current_cred_index + 1) % len(self.bedrock_clients)
            return self.bedrock_clients[self.current_cred_index]

    def time_it(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            duration = end_time - start_time
            print(f"{func.__name__} took {duration} seconds to complete.")
            return result
        return wrapper

    @time_it
    def claude(self, mssgs, sysp):
        body = json.dumps({
            "max_tokens": 4096,
            "messages": mssgs,
            "anthropic_version": "bedrock-2023-05-31",
            "system": sysp
        })

        bedrock = self.rotate_credentials()
        response = bedrock.invoke_model(body=body, modelId=os.getenv('MODEL_ID'))
        response_body = json.loads(response.get("body").read())

        return response_body["content"][0]["text"]